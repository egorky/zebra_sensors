import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function changePasswordHandler(db, jwtSecret) {
  return (req, res) => {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son obligatorias' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const row = db
      .prepare('SELECT id, username, role, password_hash FROM users WHERE id = ?')
      .get(req.user.id);
    if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, row.id);

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
        mustChangePassword: false,
      },
    });
  };
}
