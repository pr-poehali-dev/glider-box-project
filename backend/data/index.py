import json
import os
import psycopg2

def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }

def _auth(event, cur):
    token = (event.get('headers') or {}).get('X-Auth-Token') or (event.get('headers') or {}).get('x-auth-token')
    if not token:
        return None
    cur.execute("SELECT company_id FROM sessions WHERE token = %s", (token,))
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    '''Данные кабинета Glider_box: дашборд, клиенты, услуги и товары. Изоляция по компании.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}

    headers = {**_cors(), 'Content-Type': 'application/json'}
    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', '')

    conn = _conn()
    cur = conn.cursor()
    company_id = _auth(event, cur)
    if company_id is None:
        cur.close()
        conn.close()
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'unauthorized'})}

    body = json.loads(event.get('body') or '{}')

    if resource == 'dashboard' and method == 'GET':
        cur.execute("SELECT COUNT(*) FROM clients WHERE company_id = %s", (company_id,))
        clients_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM orders WHERE company_id = %s AND status != 'done'", (company_id,))
        active_orders = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM employees WHERE company_id = %s", (company_id,))
        staff_count = cur.fetchone()[0]
        cur.execute(
            "SELECT COALESCE(SUM(amount),0) FROM orders WHERE company_id = %s "
            "AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)",
            (company_id,)
        )
        revenue = float(cur.fetchone()[0])
        cur.execute(
            "SELECT EXTRACT(DOW FROM created_at)::int AS dow, COUNT(*) "
            "FROM orders WHERE company_id = %s AND created_at >= CURRENT_DATE - INTERVAL '7 days' "
            "GROUP BY dow",
            (company_id,)
        )
        week = {int(r[0]): int(r[1]) for r in cur.fetchall()}
        chart = [week.get(d, 0) for d in [1, 2, 3, 4, 5, 6, 0]]
        cur.execute(
            "SELECT id, client_name, service_name, amount, status, created_at "
            "FROM orders WHERE company_id = %s ORDER BY created_at DESC LIMIT 5",
            (company_id,)
        )
        recent = [{'id': r[0], 'client_name': r[1], 'service_name': r[2], 'amount': float(r[3]), 'status': r[4], 'created_at': str(r[5])} for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'stats': {'clients': clients_count, 'active_orders': active_orders, 'staff': staff_count, 'revenue': revenue},
            'chart': chart,
            'recent_orders': recent,
        })}

    if resource == 'clients':
        if method == 'GET':
            search = (params.get('search') or '').strip()
            if search:
                like = f"%{search}%"
                cur.execute(
                    "SELECT c.id, c.name, c.phone, c.email, c.comment, c.created_at, "
                    "(SELECT COUNT(*) FROM orders o WHERE o.client_id = c.id) "
                    "FROM clients c WHERE c.company_id = %s AND (c.name ILIKE %s OR c.phone ILIKE %s) "
                    "ORDER BY c.created_at DESC",
                    (company_id, like, like)
                )
            else:
                cur.execute(
                    "SELECT c.id, c.name, c.phone, c.email, c.comment, c.created_at, "
                    "(SELECT COUNT(*) FROM orders o WHERE o.client_id = c.id) "
                    "FROM clients c WHERE c.company_id = %s ORDER BY c.created_at DESC",
                    (company_id,)
                )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            data = [{'id': r[0], 'name': r[1], 'phone': r[2], 'email': r[3], 'comment': r[4], 'created_at': str(r[5]), 'orders_count': r[6]} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'clients': data})}
        if method == 'POST':
            name = (body.get('name') or '').strip()
            if not name:
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Имя обязательно'})}
            cur.execute(
                "INSERT INTO clients (company_id, name, phone, email, comment) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (company_id, name, body.get('phone', ''), body.get('email', ''), body.get('comment', ''))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': new_id})}
        if method == 'DELETE':
            cid = params.get('id')
            cur.execute("DELETE FROM clients WHERE id = %s AND company_id = %s", (cid, company_id))
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if resource == 'client_card' and method == 'GET':
        cid = params.get('id')
        cur.execute("SELECT id, name, phone, email, comment, created_at FROM clients WHERE id = %s AND company_id = %s", (cid, company_id))
        c = cur.fetchone()
        if not c:
            cur.close()
            conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'not found'})}
        cur.execute(
            "SELECT id, service_name, amount, status, created_at FROM orders "
            "WHERE client_id = %s AND company_id = %s ORDER BY created_at DESC",
            (cid, company_id)
        )
        orders = [{'id': r[0], 'service_name': r[1], 'amount': float(r[2]), 'status': r[3], 'created_at': str(r[4])} for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'client': {'id': c[0], 'name': c[1], 'phone': c[2], 'email': c[3], 'comment': c[4], 'created_at': str(c[5])},
            'orders': orders,
        })}

    if resource == 'items':
        if method == 'GET':
            kind = params.get('kind', 'all')
            if kind in ('service', 'product'):
                cur.execute(
                    "SELECT id, name, kind, price, duration, sku, description, image_url, is_active "
                    "FROM items WHERE company_id = %s AND kind = %s ORDER BY created_at DESC",
                    (company_id, kind)
                )
            else:
                cur.execute(
                    "SELECT id, name, kind, price, duration, sku, description, image_url, is_active "
                    "FROM items WHERE company_id = %s ORDER BY created_at DESC",
                    (company_id,)
                )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            data = [{'id': r[0], 'name': r[1], 'kind': r[2], 'price': float(r[3]), 'duration': r[4], 'sku': r[5], 'description': r[6], 'image_url': r[7], 'is_active': r[8]} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'items': data})}
        if method == 'POST':
            name = (body.get('name') or '').strip()
            if not name:
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Название обязательно'})}
            cur.execute(
                "INSERT INTO items (company_id, name, kind, price, duration, sku, description, image_url, is_active) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (company_id, name, body.get('kind', 'service'), body.get('price', 0) or 0,
                 body.get('duration', ''), body.get('sku', ''), body.get('description', ''),
                 body.get('image_url', ''), body.get('is_active', True))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': new_id})}
        if method == 'PUT':
            iid = params.get('id')
            cur.execute("UPDATE items SET is_active = %s WHERE id = %s AND company_id = %s", (body.get('is_active', True), iid, company_id))
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}
        if method == 'DELETE':
            iid = params.get('id')
            cur.execute("DELETE FROM items WHERE id = %s AND company_id = %s", (iid, company_id))
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if resource == 'orders' and method == 'POST':
        cur.execute(
            "INSERT INTO orders (company_id, client_id, client_name, service_name, amount, status) "
            "VALUES (%s, %s, %s, %s, %s, 'new') RETURNING id",
            (company_id, body.get('client_id'), body.get('client_name', ''), body.get('service_name', ''), body.get('amount', 0) or 0)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': new_id})}

    cur.close()
    conn.close()
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'unknown resource'})}
