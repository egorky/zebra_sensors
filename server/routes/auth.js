import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncRoute } from '../utils/asyncRoute.js';

export function createAuthRouter(db, jwtSecret) {
  const r = Router();

  r.post(
    '/login',
    asyncRoute(async (req, res) => {
      const username = String(req.body?.username || '').trim();
      const password = String(req.body?.password || '');
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña obligatorios' });
      }
      const row = await db.get(
        'SELECT id, username, password_hash, role, must_change_password FROM users WHERE username = ?',
        [username]
      );
      if (!row || !bcrypt.compareSync(password, row.password_hash)) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const token = jwt.sign(
        { sub: row.id, username: row.username, role: row.role },
        jwtSecret,
        { expiresIn: '24h' }
      );
      res.json({
        token,
        expiresIn: 86400,
        user: {
          id: row.id,
          username: row.username,
          role: row.role,
          mustChangePassword: row.must_change_password === 1 || row.must_change_password === true,
        },
      });
    })
  );

  return r;
}
