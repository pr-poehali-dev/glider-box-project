import json
import os
import hashlib
import secrets
import psycopg2

def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }

def handler(event: dict, context) -> dict:
    '''Регистрация компании, вход владельца и проверка сессии для Glider_box'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}

    headers = {**_cors(), 'Content-Type': 'application/json'}
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if method == 'GET' and action == 'me':
        token = (event.get('headers') or {}).get('X-Auth-Token') or (event.get('headers') or {}).get('x-auth-token')
        if not token:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'no token'})}
        conn = _conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT e.id, e.name, e.role, c.id, c.name, c.currency, c.logo_url, c.email, c.phone "
            "FROM sessions s JOIN employees e ON e.id = s.employee_id "
            "JOIN companies c ON c.id = s.company_id WHERE s.token = %s",
            (token,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'invalid token'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'employee': {'id': row[0], 'name': row[1], 'role': row[2]},
            'company': {'id': row[3], 'name': row[4], 'currency': row[5], 'logo_url': row[6], 'email': row[7], 'phone': row[8]},
        })}

    body = json.loads(event.get('body') or '{}')

    if method == 'POST' and action == 'register':
        name = (body.get('company_name') or '').strip()
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        phone = (body.get('phone') or '').strip()
        if not name or not email or not password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните обязательные поля'})}
        conn = _conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM companies WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {'statusCode': 409, 'headers': headers, 'body': json.dumps({'error': 'Компания с таким email уже существует'})}
        cur.execute(
            "INSERT INTO companies (name, email, phone) VALUES (%s, %s, %s) RETURNING id",
            (name, email, phone)
        )
        company_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO employees (company_id, name, email, password_hash, phone, role) "
            "VALUES (%s, %s, %s, %s, %s, 'admin') RETURNING id",
            (company_id, name, email, _hash(password), phone)
        )
        employee_id = cur.fetchone()[0]
        token = secrets.token_hex(32)
        cur.execute(
            "INSERT INTO sessions (employee_id, company_id, token) VALUES (%s, %s, %s)",
            (employee_id, company_id, token)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'token': token, 'company_name': name})}

    if method == 'POST' and action == 'login':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        conn = _conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, company_id, password_hash FROM employees WHERE email = %s",
            (email,)
        )
        row = cur.fetchone()
        if not row or row[2] != _hash(password):
            cur.close()
            conn.close()
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Неверный email или пароль'})}
        token = secrets.token_hex(32)
        cur.execute(
            "INSERT INTO sessions (employee_id, company_id, token) VALUES (%s, %s, %s)",
            (row[0], row[1], token)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'token': token})}

    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'unknown action'})}
