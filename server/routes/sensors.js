import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';

function mapSensor(s) {
  const id = s.id != null ? String(s.id) : '';
  if (!id) return null;
  const unv = s.unverified || {};
  const lastTemp = unv.last_temperature;
  return {
    zebra_id: id,
    serial_number: s.serial_number != null ? String(s.serial_number) : null,
    name: s.name != null ? String(s.name) : null,
    status: s.status != null ? String(s.status) : null,
    battery_level: s.battery_level != null ? Number(s.battery_level) : null,
    last_temperature: typeof lastTemp === 'number' && !Number.isNaN(lastTemp) ? lastTemp : null,
    raw_json: JSON.stringify(s),
  };
}

export function createSensorsRouter(db) {
  const r = Router();

  r.get('/cached', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT zebra_id, serial_number, name, status, battery_level, last_temperature, raw_json, updated_at
         FROM sensor_snapshots ORDER BY name COLLATE NOCASE`
      )
      .all();
    const sensors = rows.map((row) => ({
      ...row,
      parsed: (() => {
        try {
          return JSON.parse(row.raw_json);
        } catch {
          return null;
        }
      })(),
    }));
    res.json({ sensors });
  });

  r.post('/sync', requireAdmin, (req, res) => {
    const list = req.body?.sensors;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: 'Body debe incluir sensors: []' });
    }
    const upsert = db.prepare(`
      INSERT INTO sensor_snapshots (zebra_id, serial_number, name, status, battery_level, last_temperature, raw_json, updated_at)
      VALUES (@zebra_id, @serial_number, @name, @status, @battery_level, @last_temperature, @raw_json, datetime('now'))
      ON CONFLICT(zebra_id) DO UPDATE SET
        serial_number = excluded.serial_number,
        name = excluded.name,
        status = excluded.status,
        battery_level = excluded.battery_level,
        last_temperature = excluded.last_temperature,
        raw_json = excluded.raw_json,
        updated_at = datetime('now')
    `);
    const run = db.transaction((items) => {
      let n = 0;
      for (const s of items) {
        const row = mapSensor(s);
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
