import urls from '../../backend/func2url.json';

const AUTH_URL = urls.auth;
const DATA_URL = urls.data;

export const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  done: 'Выполнен',
};

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  in_progress: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  done: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

function getToken(): string {
  return localStorage.getItem('gb_token') || '';
}

export function setToken(token: string) {
  localStorage.setItem('gb_token', token);
}

export function clearToken() {
  localStorage.removeItem('gb_token');
}

async function authFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${AUTH_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

async function dataFetch(query: string, options: RequestInit = {}) {
  const res = await fetch(`${DATA_URL}${query}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

export const api = {
  register: (body: { company_name: string; email: string; password: string; phone: string }) =>
    authFetch('?action=register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    authFetch('?action=login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => authFetch('?action=me', { method: 'GET' }),

  dashboard: () => dataFetch('?resource=dashboard', { method: 'GET' }),

  clients: (search = '') => dataFetch(`?resource=clients${search ? `&search=${encodeURIComponent(search)}` : ''}`, { method: 'GET' }),
  addClient: (body: { name: string; phone?: string; email?: string; comment?: string }) =>
    dataFetch('?resource=clients', { method: 'POST', body: JSON.stringify(body) }),
  deleteClient: (id: number) => dataFetch(`?resource=clients&id=${id}`, { method: 'DELETE' }),
  clientCard: (id: number) => dataFetch(`?resource=client_card&id=${id}`, { method: 'GET' }),

  items: (kind = 'all') => dataFetch(`?resource=items&kind=${kind}`, { method: 'GET' }),
  addItem: (body: Record<string, unknown>) =>
    dataFetch('?resource=items', { method: 'POST', body: JSON.stringify(body) }),
  toggleItem: (id: number, is_active: boolean) =>
    dataFetch(`?resource=items&id=${id}`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
  deleteItem: (id: number) => dataFetch(`?resource=items&id=${id}`, { method: 'DELETE' }),

  addOrder: (body: { client_id?: number; client_name?: string; service_name?: string; amount?: number }) =>
    dataFetch('?resource=orders', { method: 'POST', body: JSON.stringify(body) }),
};
