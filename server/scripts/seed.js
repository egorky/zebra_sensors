/**
 * Crea un usuario en la base. Usa el .env de la raíz del repo.
 * Desde la raíz: npm run seed -- mi_usuario mi_clave admin
 */
import '../loadRootEnv.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { openDatabase } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
process.chdir(repoRoot);

const dbPath = process.env.DATABASE_PATH || './server/data/app.db';
const [, , username, password, roleArg] = process.argv;
if (!username || !password) {
  console.error('Uso (desde la raíz): npm run seed -- <usuario> <contraseña> [admin|operator]');
  process.exit(1);
}
const role = roleArg === 'operator' ? 'operator' : 'admin';

const db = openDatabase(dbPath);
const hash = bcrypt.hashSync(password, 10);
try {
  db.prepare(`INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, ?, 0)`).run(
    username,
    hash,
    role
  );
  console.log(`Usuario "${username}" creado (${role}).`);
} catch (e) {
  if (String(e.message).includes('UNIQUE')) {
    console.error('Ese usuario ya existe.');
  } else {
    console.error(e);
  }
  process.exit(1);
}
db.close();
