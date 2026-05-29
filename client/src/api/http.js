let token = null;

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('crash_token', t);
  else localStorage.removeItem('crash_token');
}

export function getToken() {
  if (token) return token;
  token = localStorage.getItem('crash_token');
  return token;
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let err;
    try { err = (await res.json()).error; } catch { err = res.statusText; }
    const e = new Error(err);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export const api = {
  auth: (payload) => request('POST', '/api/auth', payload),
  me: () => request('GET', '/api/me'),
  history: () => request('GET', '/api/history'),
  rounds: () => request('GET', '/api/rounds'),
  dailyBonus: () => request('POST', '/api/daily-bonus'),
  leaderboard: (period = 'all') => request('GET', `/api/leaderboard?period=${period}`),
  replenishDemo: () => request('POST', '/api/demo/replenish'),
  settings: (payload) => request('POST', '/api/settings', payload),
  cases: () => request('GET', '/api/cases'),
  openCase: (slug) => request('POST', `/api/cases/${slug}/open`),

  // Admin API
  get: (path) => request('GET', `/api${path}`),
  post: (path, body) => request('POST', `/api${path}`, body),
  patch: (path, body) => request('PATCH', `/api${path}`, body),
  put: (path, body) => request('PUT', `/api${path}`, body),
  delete: (path) => request('DELETE', `/api${path}`),
};
