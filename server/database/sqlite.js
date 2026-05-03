import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

function ensureDirForFile(absPath) {
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function createSqliteAdapter(databasePath) {
  const abs = path.isAbsolute(databasePath)
    ? databasePath
    : path.resolve(process.cwd(), databasePath);
  ensureDirForFile(abs);
  const db = new Database(abs);
  db.pragma('journal_mode = WAL');

  const adapter = {
    dialect: 'sqlite',
    raw: db,
    async exec(sql) {
      db.exec(sql);
    },
    async all(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
    async get(sql, params = []) {
      return db.prepare(sql).get(...params);
    },
    async run(sql, params = []) {
      const info = db.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) || 0 };
    },
    async close() {
      db.close();
    },
  };
  return adapter;
}
