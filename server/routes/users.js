import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { asyncRoute } from '../utils/asyncRoute.js';

export function createUsersRouter(db) {
  const r = Router();

  const orderUser =
    db.dialect === 'mysql' ? 'ORDER BY username ASC' : 'ORDER BY username COLLATE NOCASE';

  r.get(
    '/',
    asyncRoute(async (_req, res) => {
      const rows = await db.all(
        `SELECT id, username, role, created_at FROM users ${orderUser}`
      );
      res.json({ users: rows });
    })
  );

  r.post(
    '/',
    asyncRoute(async (req, res) => {
      const username = String(req.body?.username || '').trim();
      const password = String(req.body?.password || '');
      const role = req.body?.role === 'operator' ? 'operator' : 'admin';
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña obligatorios' });
      }
      if (username.length > 64 || password.length < 4) {
        return res.status(400).json({ error: 'Usuario máx. 64 caracteres; contraseña mín. 4' });
      }
      try {
        const hash = bcrypt.hashSync(password, 10);
        const info = await db.run(
          `INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, ?, 0)`,
          [username, hash, role]
        );
        res.status(201).json({ id: info.lastInsertRowid, username, role });
      } catch (e) {
        if (String(e.message).includes('UNIQUE') || String(e.message).includes('Duplicate')) {
          return res.status(409).json({ error: 'Ese nombre de usuario ya existe' });
        }
        throw e;
      }
    })
  );

  r.delete(
    '/:id',
    asyncRoute(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      if (id === req.user.id) {
        return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
      }
      const info = await db.run('DELETE FROM users WHERE id = ?', [id]);
      if (info.changes === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ ok: true });
    })
  );

  return r;
}
