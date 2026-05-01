import { Router } from 'express';
import bcrypt from 'bcryptjs';

export function createUsersRouter(db) {
  const r = Router();

  r.get('/', (req, res) => {
    const rows = db
      .prepare(
        `SELECT id, username, role, created_at FROM users ORDER BY username COLLATE NOCASE`
      )
      .all();
    res.json({ users: rows });
  });

  r.post('/', (req, res) => {
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
      const info = db
        .prepare(
          `INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, ?, 0)`
        )
        .run(username, hash, role);
      res.status(201).json({ id: info.lastInsertRowid, username, role });
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) {
        return res.status(409).json({ error: 'Ese nombre de usuario ya existe' });
      }
      throw e;
    }
  });

  r.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ ok: true });
  });

  return r;
}
