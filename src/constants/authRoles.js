/** Rol con acceso completo: configuración de la app, API, enrolado y cambios en Zebra. */
export const ROLE_ADMIN = 'admin';

/** Rol de solo consulta: inicio, sensores, tareas, logs y alarmas; sin cambios en Zebra ni credenciales. */
export const ROLE_OPERATOR = 'operator';

export function normalizeRole(role) {
  if (role === ROLE_OPERATOR) return ROLE_OPERATOR;
  return ROLE_ADMIN;
}

export function isAdminRole(role) {
  return normalizeRole(role) === ROLE_ADMIN;
}

