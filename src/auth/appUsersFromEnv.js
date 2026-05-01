import { normalizeRole } from '../constants/authRoles';

/**
 * Usuarios de la SPA definidos en build (Vite). Sin base de datos en el proyecto.
 * @returns {{ username: string, password: string, role: string }[]}
 */
export function getAppUsersFromEnv() {
  const raw = import.meta.env.VITE_APP_USERS;
  if (raw && typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr) && arr.length > 0) {
          return arr
            .filter((u) => u && typeof u.username === 'string' && typeof u.password === 'string')
            .map((u) => ({
              username: u.username,
              password: u.password,
              role: normalizeRole(u.role),
            }));
        }
      } catch {
        console.warn('VITE_APP_USERS: JSON no válido; se intentará VITE_APP_USERNAME / VITE_APP_PASSWORD.');
      }
    }
  }
  const u = import.meta.env.VITE_APP_USERNAME;
  const p = import.meta.env.VITE_APP_PASSWORD;
  if (u && p) {
    return [{ username: u, password: p, role: normalizeRole('admin') }];
  }
  return [];
}
