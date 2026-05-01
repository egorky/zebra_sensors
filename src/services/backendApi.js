const trimBase = () => import.meta.env.VITE_BACKEND_URL?.trim()?.replace(/\/$/, '') || '';

/** La URL del API Node es obligatoria para esta aplicación. */
export function hasBackendUrl() {
  return Boolean(trimBase());
}

export function getBackendBaseUrl() {
  return trimBase();
}

export function readBackendAuthFromStorage() {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.token || !data.expiresAt) return null;
    if (Date.now() >= data.expiresAt) return null;
    return { token: data.token, role: data.role, username: data.username };
  } catch {
    return null;
  }
}

export async function authChangePassword(currentPassword, newPassword) {
  const base = trimBase();
  if (!base) {
    throw new Error('Falta VITE_BACKEND_URL');
  }
  const auth = readBackendAuthFromStorage();
  if (!auth?.token) {
    throw new Error('Sesión no válida');
  }
  const r = await fetch(`${base}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(body.error || `Error ${r.status}`);
  }
  return body;
}

export async function backendLogin(username, password) {
  const base = trimBase();
  if (!base) {
    throw new Error('Falta VITE_BACKEND_URL');
  }
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(body.error || `Error ${r.status}`);
  }
  return body;
}

async function backendFetch(path, options = {}) {
  const base = trimBase();
  if (!base) {
    throw new Error('Falta VITE_BACKEND_URL');
  }
  const auth = readBackendAuthFromStorage();
  if (!auth?.token) {
    throw new Error('Sesión no válida');
  }
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    ...(options.headers || {}),
  };
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  const r = await fetch(`${base}${path}`, { ...options, headers });
  const text = await r.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!r.ok) {
    throw new Error(json.error || `Error ${r.status}`);
  }
  return json;
}

export async function fetchBackendUsers() {
  return backendFetch('/api/users');
}

export async function createBackendUser({ username, password, role }) {
  return backendFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });
}

export async function deleteBackendUser(id) {
  return backendFetch(`/api/users/${id}`, { method: 'DELETE' });
}

export async function syncSensorsToBackend(sensors) {
  return backendFetch('/api/sensors/sync', {
    method: 'POST',
    body: JSON.stringify({ sensors }),
  });
}

export async function syncTasksToBackend(tasks) {
  return backendFetch('/api/tasks/sync', {
    method: 'POST',
    body: JSON.stringify({ tasks }),
  });
}

export async function fetchCachedSensors() {
  return backendFetch('/api/sensors/cached');
}

export async function fetchCachedTasks() {
  return backendFetch('/api/tasks/cached');
}
