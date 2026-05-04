import { Router } from 'express';
import { asyncRoute } from '../utils/asyncRoute.js';
import { requireAdmin } from '../middleware/auth.js';
import { sqlNow } from '../database/schema.js';

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

  r.get(
    '/cached',
    asyncRoute(async (_req, res) => {
      const order =
        db.dialect === 'mysql'
          ? 'ORDER BY name ASC'
          : 'ORDER BY name COLLATE NOCASE';
      const rows = await db.all(
        `SELECT zebra_id, name, status, raw_json, updated_at FROM task_snapshots ${order}`
      );
      res.json({ tasks: rows });
    })
  );

  r.post(
    '/sync',
    asyncRoute(async (req, res) => {
      const list = req.body?.tasks;
      if (!Array.isArray(list)) {
        return res.status(400).json({ error: 'Body debe incluir tasks: []' });
      }
      const nowF = sqlNow(db);
      let n = 0;
      if (db.dialect === 'mysql') {
        const sql = `INSERT INTO task_snapshots (zebra_id, name, status, raw_json, updated_at)
          VALUES (?, ?, ?, ?, ${nowF})
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            status = VALUES(status),
            raw_json = VALUES(raw_json),
            updated_at = VALUES(updated_at)`;
        for (const t of list) {
          const row = mapTask(t);
          if (row) {
            await db.run(sql, [row.zebra_id, row.name, row.status, row.raw_json]);
            n += 1;
          }
        }
      } else {
        const sql = `INSERT INTO task_snapshots (zebra_id, name, status, raw_json, updated_at)
          VALUES (?, ?, ?, ?, ${nowF})
          ON CONFLICT(zebra_id) DO UPDATE SET
            name = excluded.name,
            status = excluded.status,
            raw_json = excluded.raw_json,
            updated_at = excluded.updated_at`;
        for (const t of list) {
          const row = mapTask(t);
          if (row) {
            await db.run(sql, [row.zebra_id, row.name, row.status, row.raw_json]);
            n += 1;
          }
        }
      }
      res.json({ synced: n });
    })
  );

  r.get(
    '/poll-states',
    requireAdmin,
    asyncRoute(async (_req, res) => {
      const order =
        db.dialect === 'mysql'
          ? 'ORDER BY t.name ASC'
          : 'ORDER BY t.name COLLATE NOCASE';
      const rows = await db.all(
        `SELECT t.zebra_id AS task_zebra_id, t.name AS task_name,
                COALESCE(p.polling_enabled, 0) AS polling_enabled
         FROM task_snapshots t
         LEFT JOIN zebra_task_poll_config p ON p.task_zebra_id = t.zebra_id
         ${order}`
      );
      res.json({ tasks: rows });
    })
  );

  r.put(
    '/poll-states/:taskId',
    requireAdmin,
    asyncRoute(async (req, res) => {
      const taskId = String(req.params.taskId || '').trim();
      if (!taskId) {
        return res.status(400).json({ error: 'taskId inválido' });
      }
      const enabled = req.body?.polling_enabled === true || req.body?.polling_enabled === 1 ? 1 : 0;
      const nowF = sqlNow(db);
      if (db.dialect === 'mysql') {
        await db.run(
          `INSERT INTO zebra_task_poll_config (task_zebra_id, polling_enabled, updated_at)
           VALUES (?, ?, ${nowF})
           ON DUPLICATE KEY UPDATE polling_enabled = VALUES(polling_enabled), updated_at = VALUES(updated_at)`,
          [taskId, enabled]
        );
      } else {
        await db.run(
          `INSERT INTO zebra_task_poll_config (task_zebra_id, polling_enabled, updated_at)
           VALUES (?, ?, ${nowF})
           ON CONFLICT(task_zebra_id) DO UPDATE SET
             polling_enabled = excluded.polling_enabled,
             updated_at = excluded.updated_at`,
          [taskId, enabled]
        );
      }
      res.json({ task_zebra_id: taskId, polling_enabled: !!enabled });
    })
  );

  return r;
}
