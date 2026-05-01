import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';

function mapTask(t) {
  const id = t.id != null ? String(t.id) : '';
  if (!id) return null;
  const name = t.taskDetails?.name ?? t.name ?? '';
  return {
    zebra_id: id,
    name: name != null ? String(name) : null,
    status: t.status != null ? String(t.status) : null,
    raw_json: JSON.stringify(t),
  };
}

export function createTasksRouter(db) {
  const r = Router();

  r.get('/cached', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT zebra_id, name, status, raw_json, updated_at FROM task_snapshots ORDER BY name COLLATE NOCASE`
      )
      .all();
    res.json({ tasks: rows });
  });

  r.post('/sync', requireAdmin, (req, res) => {
    const list = req.body?.tasks;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: 'Body debe incluir tasks: []' });
    }
    const upsert = db.prepare(`
      INSERT INTO task_snapshots (zebra_id, name, status, raw_json, updated_at)
      VALUES (@zebra_id, @name, @status, @raw_json, datetime('now'))
      ON CONFLICT(zebra_id) DO UPDATE SET
        name = excluded.name,
        status = excluded.status,
        raw_json = excluded.raw_json,
        updated_at = datetime('now')
    `);
    const run = db.transaction((items) => {
      let n = 0;
      for (const t of items) {
        const row = mapTask(t);
        if (row) {
          upsert.run(row);
          n += 1;
        }
      }
      return n;
    });
    const count = run(list);
    res.json({ synced: count });
  });

  return r;
}
