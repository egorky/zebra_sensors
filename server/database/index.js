import bcrypt from 'bcryptjs';
import { createSqliteAdapter } from './sqlite.js';
import { createMysqlAdapter } from './mysql.js';
import { applySchema } from './schema.js';

function readMysqlConfigFromEnv() {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER || '';
  const password = process.env.MYSQL_PASSWORD ?? '';
  const database = process.env.MYSQL_DATABASE || 'zebra_sensors';
  if (!user || !database) {
    throw new Error('MYSQL_USER y MYSQL_DATABASE son obligatorios cuando DATABASE_DRIVER=mysql');
  }
  return { host, port, user, password, database };
}

/**
 * Async database adapter (SQLite via better-sqlite3, MySQL via mysql2).
 * Methods: all, get, run, exec, close — dialect is 'sqlite' | 'mysql'.
 */
export async function createDatabase() {
  const driver = (process.env.DATABASE_DRIVER || 'sqlite').toLowerCase().trim();
  let adapter;
  if (driver === 'mysql') {
    adapter = createMysqlAdapter(readMysqlConfigFromEnv());
  } else {
    const path = process.env.DATABASE_PATH || './server/data/app.db';
    adapter = createSqliteAdapter(path);
  }
  await applySchema(adapter);
  return adapter;
}

export async function ensureBootstrapUser(db) {
  const row = await db.get('SELECT COUNT(*) AS c FROM users');
  const count = Number(row?.c) || 0;
  if (count > 0) return;

  const username = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'changeme';
  const hash = bcrypt.hashSync(password, 10);
  await db.run(
    `INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, 'admin', 1)`,
    [username, hash]
  );
  console.warn(
    `[zebra-server] Base sin usuarios: creado administrador "${username}" (debe cambiar contraseña en la app). Define BOOTSTRAP_* en producción y JWT_SECRET seguro.`
  );
}
