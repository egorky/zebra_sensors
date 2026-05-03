import { Router } from 'express';
import { asyncRoute } from '../utils/asyncRoute.js';
import { sqlNow } from '../database/schema.js';

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

  r.get(
    '/cached',
    asyncRoute(async (_req, res) => {
      const order =
        db.dialect === 'mysql'
          ? 'ORDER BY name ASC'
          : 'ORDER BY name COLLATE NOCASE';
      const rows = await db.all(
        `SELECT zebra_id, serial_number, name, status, battery_level, last_temperature, raw_json, updated_at
         FROM sensor_snapshots ${order}`
      );
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
    })
  );

  r.post(
    '/sync',
    asyncRoute(async (req, res) => {
      const list = req.body?.sensors;
      if (!Array.isArray(list)) {
        return res.status(400).json({ error: 'Body debe incluir sensors: []' });
      }
      const nowF = sqlNow(db);
      let n = 0;
      if (db.dialect === 'mysql') {
        const sql = `INSERT INTO sensor_snapshots (zebra_id, serial_number, name, status, battery_level, last_temperature, raw_json, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ${nowF})
          ON DUPLICATE KEY UPDATE
            serial_number = VALUES(serial_number),
            name = VALUES(name),
            status = VALUES(status),
            battery_level = VALUES(battery_level),
            last_temperature = VALUES(last_temperature),
            raw_json = VALUES(raw_json),
            updated_at = VALUES(updated_at)`;
        for (const s of list) {
          const row = mapSensor(s);
          if (row) {
            await db.run(sql, [
              row.zebra_id,
              row.serial_number,
              row.name,
              row.status,
              row.battery_level,
              row.last_temperature,
              row.raw_json,
            ]);
            n += 1;
          }
        }
      } else {
        const sql = `INSERT INTO sensor_snapshots (zebra_id, serial_number, name, status, battery_level, last_temperature, raw_json, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ${nowF})
          ON CONFLICT(zebra_id) DO UPDATE SET
            serial_number = excluded.serial_number,
            name = excluded.name,
            status = excluded.status,
            battery_level = excluded.battery_level,
            last_temperature = excluded.last_temperature,
            raw_json = excluded.raw_json,
            updated_at = excluded.updated_at`;
        for (const s of list) {
          const row = mapSensor(s);
          if (row) {
            await db.run(sql, [
              row.zebra_id,
              row.serial_number,
              row.name,
              row.status,
              row.battery_level,
              row.last_temperature,
              row.raw_json,
            ]);
            n += 1;
          }
        }
      }
      res.json({ synced: n });
    })
  );

  return r;
}
