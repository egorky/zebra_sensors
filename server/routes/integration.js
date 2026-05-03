import { Router } from 'express';
import { asyncRoute } from '../utils/asyncRoute.js';
import { sqlNow } from '../database/schema.js';
import { testZabbixConnection } from '../services/zabbixRpc.js';
import { runZebraZabbixPollOnce } from '../services/zebraZabbixPoller.js';

function parseHostsJson(raw) {
  try {
    const j = JSON.parse(raw || '[]');
    if (Array.isArray(j)) {
      const hosts = j.map((x) => (typeof x === 'string' ? x : x?.host)).filter(Boolean);
      return hosts.length ? hosts : ['Zebra Devices', 'Prologitec'];
    }
  } catch {
    /* ignore */
  }
  return ['Zebra Devices', 'Prologitec'];
}

function maskRow(row) {
  if (!row) return null;
  return {
    poller_enabled: !!row.poller_enabled,
    poll_interval_minutes: Number(row.poll_interval_minutes) || 6,
    zebra_base_url: row.zebra_base_url || '',
    zebra_task_id: row.zebra_task_id || '',
    has_zebra_api_key: Boolean(String(row.zebra_api_key || '').trim()),
    zabbix_api_url: row.zabbix_api_url || '',
    zabbix_auth_type: row.zabbix_auth_type === 'password' ? 'password' : 'token',
    has_zabbix_api_token: Boolean(String(row.zabbix_api_token || '').trim()),
    zabbix_username: row.zabbix_username || '',
    has_zabbix_password: Boolean(String(row.zabbix_password || '').trim()),
    zabbix_hosts: parseHostsJson(row.zabbix_hosts_json),
    item_key_template: row.item_key_template || 'alarm.{sensorId}',
    min_seconds_between_events: Number(row.min_seconds_between_events) || 300,
    initial_lookback_minutes: Number(row.initial_lookback_minutes) || 120,
    last_poll_at: row.last_poll_at || null,
    last_poll_error: row.last_poll_error || null,
    updated_at: row.updated_at || null,
  };
}

export function createIntegrationRouter(db, pollerCtl) {
  const r = Router();

  r.get(
    '/zabbix-poller',
    asyncRoute(async (_req, res) => {
      const row = await db.get('SELECT * FROM integration_settings WHERE id = 1');
      res.json({ settings: maskRow(row) });
    })
  );

  r.put(
    '/zabbix-poller',
    asyncRoute(async (req, res) => {
      const b = req.body || {};
      const row = await db.get('SELECT * FROM integration_settings WHERE id = 1');

      const poller_enabled =
        b.poller_enabled === undefined
          ? Number(row.poller_enabled) ? 1 : 0
          : b.poller_enabled === true || b.poller_enabled === 1
            ? 1
            : 0;
      const poll_interval_minutes = Math.max(
        1,
        b.poll_interval_minutes !== undefined
          ? Number(b.poll_interval_minutes)
          : Number(row.poll_interval_minutes) || 6
      );
      const zebra_base_url = String(b.zebra_base_url ?? row.zebra_base_url).trim() || 'https://api.zebra.com/v2';
      const zebra_task_id =
        b.zebra_task_id !== undefined ? String(b.zebra_task_id).trim() : row.zebra_task_id;
      const zebra_api_key =
        b.zebra_api_key !== undefined && String(b.zebra_api_key).trim() !== ''
          ? String(b.zebra_api_key).trim()
          : row.zebra_api_key;
      const zabbix_api_url =
        b.zabbix_api_url !== undefined ? String(b.zabbix_api_url).trim() : row.zabbix_api_url;
      const zabbix_auth_type =
        b.zabbix_auth_type !== undefined
          ? b.zabbix_auth_type === 'password'
            ? 'password'
            : 'token'
          : row.zabbix_auth_type === 'password'
            ? 'password'
            : 'token';
      const zabbix_api_token =
        b.zabbix_api_token !== undefined && String(b.zabbix_api_token).trim() !== ''
          ? String(b.zabbix_api_token).trim()
          : row.zabbix_api_token;
      const zabbix_username =
        b.zabbix_username !== undefined ? String(b.zabbix_username).trim() : row.zabbix_username;
      const zabbix_password =
        b.zabbix_password !== undefined && String(b.zabbix_password).trim() !== ''
          ? String(b.zabbix_password).trim()
          : row.zabbix_password;
      let hostsJson = row.zabbix_hosts_json;
      if (Array.isArray(b.zabbix_hosts)) {
        hostsJson = JSON.stringify(b.zabbix_hosts.filter(Boolean));
      } else if (typeof b.zabbix_hosts_json === 'string') {
        hostsJson = b.zabbix_hosts_json;
      }
      const item_key_template =
        b.item_key_template !== undefined
          ? String(b.item_key_template).trim()
          : row.item_key_template;
      const min_seconds_between_events = Math.max(
        0,
        b.min_seconds_between_events !== undefined
          ? Number(b.min_seconds_between_events)
          : Number(row.min_seconds_between_events)
      );
      const initial_lookback_minutes = Math.max(
        1,
        b.initial_lookback_minutes !== undefined
          ? Number(b.initial_lookback_minutes)
          : Number(row.initial_lookback_minutes)
      );

      await db.run(
        `UPDATE integration_settings SET
          poller_enabled = ?,
          poll_interval_minutes = ?,
          zebra_base_url = ?,
          zebra_task_id = ?,
          zebra_api_key = ?,
          zabbix_api_url = ?,
          zabbix_auth_type = ?,
          zabbix_api_token = ?,
          zabbix_username = ?,
          zabbix_password = ?,
          zabbix_hosts_json = ?,
          item_key_template = ?,
          min_seconds_between_events = ?,
          initial_lookback_minutes = ?,
          updated_at = ${sqlNow(db)}
        WHERE id = 1`,
        [
          poller_enabled,
          poll_interval_minutes,
          zebra_base_url,
          zebra_task_id || null,
          zebra_api_key || null,
          zabbix_api_url || null,
          zabbix_auth_type,
          zabbix_api_token || null,
          zabbix_username || null,
          zabbix_password || null,
          hostsJson || '[]',
          item_key_template || 'alarm.{sensorId}',
          min_seconds_between_events,
          initial_lookback_minutes,
        ]
      );

      if (pollerCtl?.reschedule) {
        await pollerCtl.reschedule();
      }

      const saved = await db.get('SELECT * FROM integration_settings WHERE id = 1');
      res.json({ settings: maskRow(saved) });
    })
  );

  r.post(
    '/zabbix-poller/test-zabbix',
    asyncRoute(async (req, res) => {
      const b = req.body || {};
      const row = await db.get('SELECT * FROM integration_settings WHERE id = 1');
      const url = String(b.zabbix_api_url ?? row.zabbix_api_url ?? '').trim();
      const authType = b.zabbix_auth_type === 'password' ? 'password' : 'token';
      const creds = {
        apiToken: String(b.zabbix_api_token ?? row.zabbix_api_token ?? '').trim(),
        username: String(b.zabbix_username ?? row.zabbix_username ?? '').trim(),
        password: String(b.zabbix_password ?? row.zabbix_password ?? '').trim(),
      };
      const out = await testZabbixConnection(url, authType, creds);
      res.json(out);
    })
  );

  r.post(
    '/zabbix-poller/run-now',
    asyncRoute(async (_req, res) => {
      const result = await runZebraZabbixPollOnce(db, { manual: true });
      res.json(result);
    })
  );

  r.get(
    '/zabbix-poller/sensor-policies',
    asyncRoute(async (req, res) => {
      const taskId = String(req.query.task_id || '').trim();
      if (!taskId) {
        return res.status(400).json({ error: 'task_id requerido' });
      }
      const orderSnap =
        db.dialect === 'mysql'
          ? 'ORDER BY name ASC'
          : 'ORDER BY name COLLATE NOCASE';
      const snaps = await db.all(`SELECT zebra_id, name FROM sensor_snapshots ${orderSnap}`);
      const stateIds = await db.all(
        `SELECT DISTINCT sensor_zebra_id AS id FROM zebra_poll_sensor_state WHERE task_id = ?`,
        [taskId]
      );
      const polRows = await db.all(
        `SELECT sensor_zebra_id, polling_enabled FROM zebra_poll_sensor_policy WHERE task_id = ?`,
        [taskId]
      );
      const polMap = new Map(polRows.map((r) => [String(r.sensor_zebra_id), !!Number(r.polling_enabled)]));
      const idSet = new Set();
      for (const s of snaps) idSet.add(String(s.zebra_id));
      for (const r of stateIds) idSet.add(String(r.id));
      const ids = [...idSet].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      const nameById = new Map(snaps.map((s) => [String(s.zebra_id), s.name]));
      const sensors = ids.map((id) => ({
        sensor_zebra_id: id,
        name: nameById.get(id) || null,
        polling_enabled: polMap.has(id) ? polMap.get(id) : true,
      }));
      res.json({ task_id: taskId, sensors });
    })
  );

  r.put(
    '/zabbix-poller/sensor-policies',
    asyncRoute(async (req, res) => {
      const taskId = String(req.body?.task_id || '').trim();
      const policies = req.body?.policies;
      if (!taskId) {
        return res.status(400).json({ error: 'task_id requerido' });
      }
      if (!Array.isArray(policies)) {
        return res.status(400).json({ error: 'Body debe incluir policies: []' });
      }
      const nowF = sqlNow(db);
      let n = 0;
      if (db.dialect === 'mysql') {
        const sql = `INSERT INTO zebra_poll_sensor_policy (task_id, sensor_zebra_id, polling_enabled, updated_at)
          VALUES (?, ?, ?, ${nowF})
          ON DUPLICATE KEY UPDATE polling_enabled = VALUES(polling_enabled), updated_at = VALUES(updated_at)`;
        for (const p of policies) {
          const sid = String(p.sensor_zebra_id || '').trim();
          if (!sid) continue;
          const en = p.polling_enabled === false || p.polling_enabled === 0 ? 0 : 1;
          await db.run(sql, [taskId, sid, en]);
          n += 1;
        }
      } else {
        const sql = `INSERT INTO zebra_poll_sensor_policy (task_id, sensor_zebra_id, polling_enabled, updated_at)
          VALUES (?, ?, ?, ${nowF})
          ON CONFLICT(task_id, sensor_zebra_id) DO UPDATE SET
            polling_enabled = excluded.polling_enabled,
            updated_at = excluded.updated_at`;
        for (const p of policies) {
          const sid = String(p.sensor_zebra_id || '').trim();
          if (!sid) continue;
          const en = p.polling_enabled === false || p.polling_enabled === 0 ? 0 : 1;
          await db.run(sql, [taskId, sid, en]);
          n += 1;
        }
      }
      res.json({ ok: true, saved: n });
    })
  );

  r.get(
    '/zabbix-poller/sensor-state',
    asyncRoute(async (req, res) => {
      const taskId = String(req.query.task_id || '').trim();
      if (!taskId) {
        return res.status(400).json({ error: 'task_id requerido' });
      }
      const rows = await db.all(
        `SELECT sensor_zebra_id, last_event_timestamp, last_value_text, last_zabbix_push_at, updated_at
         FROM zebra_poll_sensor_state WHERE task_id = ? ORDER BY sensor_zebra_id`,
        [taskId]
      );
      res.json({ sensors: rows });
    })
  );

  r.get(
    '/zabbix-poller/runs',
    asyncRoute(async (_req, res) => {
      const rows = await db.all(
        `SELECT id, started_at, finished_at, status, events_fetched, events_pushed, error_message
         FROM zebra_poll_runs ORDER BY id DESC LIMIT 50`
      );
      res.json({ runs: rows });
    })
  );

  return r;
}
