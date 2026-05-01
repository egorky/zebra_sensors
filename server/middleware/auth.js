import jwt from 'jsonwebtoken';

export function createAuthMiddleware(jwtSecret) {
  return function requireAuth(req, res, next) {
    const h = req.headers.authorization || '';
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    try {
      const payload = jwt.verify(m[1], jwtSecret);
      req.user = {
        id: Number(payload.sub),
        username: payload.username,
        role: payload.role === 'operator' ? 'operator' : 'admin',
      };
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido o caducado' });
    }
  };
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol administrador' });
  }
  next();
}
