import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function createAuthRouter(db, jwtSecret) {
  const r = Router();

  r.post('/login', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña obligatorios' });
    }
    const row = db
      .prepare(
        'SELECT id, username, password_hash, role, must_change_password FROM users WHERE username = ?'
      )
      .get(username);
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
        mustChangePassword: row.must_change_password === 1,
      },
    });
  });

  return r;
}
