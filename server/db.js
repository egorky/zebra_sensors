import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export function openDatabase(databasePath) {
  const abs = path.isAbsolute(databasePath) ? databasePath : path.resolve(process.cwd(), databasePath);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(abs);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'operator')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sensor_snapshots (
      zebra_id TEXT PRIMARY KEY,
      serial_number TEXT,
      name TEXT,
      status TEXT,
      battery_level INTEGER,
      last_temperature REAL,
      raw_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_snapshots (
      zebra_id TEXT PRIMARY KEY,
      name TEXT,
      status TEXT,
      raw_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function ensureBootstrapUser(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;

  const username = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'changeme';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')`
  ).run(username, hash);
  console.warn(
    `[zebra-server] Base sin usuarios: creado administrador "${username}". Cambia la contraseña y define BOOTSTRAP_* en producción.`
  );
}
