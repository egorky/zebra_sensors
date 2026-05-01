/** Rol con acceso completo, incluida la gestión de cuentas locales (menú Usuarios). */
export const ROLE_ADMIN = 'admin';

/** Rol de gestión en Zebra (sensores, tareas, configuración); no puede crear ni eliminar usuarios de la app. */
export const ROLE_OPERATOR = 'operator';

export function normalizeRole(role) {
  if (role === ROLE_OPERATOR) return ROLE_OPERATOR;
  return ROLE_ADMIN;
}

export function isAdminRole(role) {
  return normalizeRole(role) === ROLE_ADMIN;
}

/** Enrolar, desenrolar, crear/detener tareas, asociar sensores, activos, configuración Zebra, etc. */
export function canManageZebraContent(role) {
  const r = normalizeRole(role);
  return r === ROLE_ADMIN || r === ROLE_OPERATOR;
}

