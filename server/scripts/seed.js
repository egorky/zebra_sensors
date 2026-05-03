/**
 * Crea un usuario en la base. Usa el .env de la raíz del repo.
 * Desde la raíz: npm run seed -- mi_usuario mi_clave admin
 */
import '../loadRootEnv.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { createDatabase } from '../database/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
process.chdir(repoRoot);

const [, , username, password, roleArg] = process.argv;
if (!username || !password) {
  console.error('Uso (desde la raíz): npm run seed -- <usuario> <contraseña> [admin|operator]');
  process.exit(1);
}
const role = roleArg === 'operator' ? 'operator' : 'admin';

const db = await createDatabase();
const hash = bcrypt.hashSync(password, 10);
try {
  await db.run(`INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, ?, 0)`, [
    username,
    hash,
    role,
  ]);
  console.log(`Usuario "${username}" creado (${role}).`);
} catch (e) {
  if (String(e.message).includes('UNIQUE') || String(e.message).includes('Duplicate')) {
    console.error('Ese usuario ya existe.');
  } else {
    console.error(e);
  }
  process.exit(1);
}
await db.close();
