import { sqlNow } from '../database/schema.js';
import {
  getZabbixAuthSession,
  normalizeZabbixApiUrl,
  zabbixHistoryPush,
} from './zabbixRpc.js';

function trimBase(url) {
  return String(url || '').replace(/\/+$/, '');
}

/** Prioridad: env del proceso Node (despliegue) → BD (sincronizado desde Configuración) → defecto. */
export function resolveZebraBaseUrlFromSettings(settings) {
  const env = String(process.env.ZEBRA_API_BASE_URL || '').trim();
  if (env) return trimBase(env);
  const db = String(settings?.zebra_base_url || '').trim();
  return db ? trimBase(db) : 'https://api.zebra.com/v2';
}

/** Prioridad: env del proceso Node → BD. */
export function resolveZebraApiKeyFromSettings(settings) {
  const env = String(process.env.ZEBRA_API_KEY || '').trim();
  if (env) return env;
  return String(settings?.zebra_api_key || '').trim();
}

function taskLogPath(baseUrl, taskId, query) {
  const base = trimBase(baseUrl);
  const id = encodeURIComponent(taskId);
  const q = query.startsWith('?') ? query : `?${query}`;
  if (/\/data\/environmental$/i.test(base)) {
    return `${base}/tasks/${id}/log${q}`;
  }
  return `${base}/data/environmental/tasks/${id}/log${q}`;
}

function toIsoUtc(d) {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function formatDateDdMmYyyyHms(iso) {
  const dateObj = new Date(iso);
  if (Number.isNaN(dateObj.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dateObj.getDate())}-${pad(dateObj.getMonth() + 1)}-${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
}

function filterEventsByMinGap(sortedAsc, minSeconds) {
  const gapMs = Math.max(0, Number(minSeconds) || 0) * 1000;
  const out = [];
  let lastTs = null;
  for (const item of sortedAsc) {
    const ts = item?.event?.timestamp;
    if (!ts) continue;
    const current = new Date(ts).getTime();
    if (Number.isNaN(current)) continue;
    if (lastTs === null) {
      out.push(item);
      lastTs = current;
    } else if (current - lastTs >= gapMs) {
      out.push(item);
      lastTs = current;
    }
  }
  return out;
}

function buildItemKey(template, sensorId) {
  const t = String(template || 'alarm.{sensorId}');
  return t.replace(/\{sensorId\}/g, String(sensorId));
}

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

async function loadSettings(db) {
  return db.get(`SELECT * FROM integration_settings WHERE id = 1`);
}

/** Map sensor_zebra_id -> true/false. Ausencia de fila = activo (true). */
async function loadSensorPollingPolicyMap(db, taskId) {
  const rows = await db.all(
    `SELECT sensor_zebra_id, polling_enabled FROM zebra_poll_sensor_policy WHERE task_id = ?`,
    [taskId]
  );
  const m = new Map();
  for (const r of rows || []) {
    m.set(String(r.sensor_zebra_id), !!Number(r.polling_enabled));
  }
  return m;
}

function sensorPollingEnabled(policyMap, sensorId) {
  if (sensorId == null) return true;
  const v = policyMap.get(String(sensorId));
  return v !== false;
}

async function insertPollRun(db, taskId, nowSql) {
  return db.run(
    `INSERT INTO zebra_poll_runs (task_id, started_at, status, events_fetched, events_pushed) VALUES (?, ${nowSql}, 'running', 0, 0)`,
    [taskId]
  );
}

async function runPollForSingleTask(db, settings, taskId, manual) {
  const zebraKey = resolveZebraApiKeyFromSettings(settings);
  const zebraBase = resolveZebraBaseUrlFromSettings(settings);
  const zabbixUrl = String(settings.zabbix_api_url || '').trim();
  const authType = settings.zabbix_auth_type === 'password' ? 'password' : 'token';
  const apiUrl = normalizeZabbixApiUrl(zabbixUrl);
  const creds = {
    apiToken: String(settings.zabbix_api_token || '').trim(),
    username: String(settings.zabbix_username || '').trim(),
    password: String(settings.zabbix_password || '').trim(),
  };

  const nowSql = sqlNow(db);
  const runInsert = await insertPollRun(db, taskId, nowSql);
  const runId = runInsert.lastInsertRowid;

  const now = new Date();
  const endIso = toIsoUtc(now);
  const lookbackMin = Math.max(1, Number(settings.initial_lookback_minutes) || 120);
  const defaultStart = toIsoUtc(new Date(now.getTime() - lookbackMin * 60 * 1000));

  const cursorRow = await db.get('SELECT * FROM zebra_poll_cursors WHERE task_id = ?', [taskId]);
  const startIso = cursorRow?.last_event_timestamp
    ? String(cursorRow.last_event_timestamp)
    : defaultStart;

  const logUrl = taskLogPath(
    zebraBase,
    taskId,
    `startTime=${encodeURIComponent(startIso)}&endTime=${encodeURIComponent(endIso)}`
  );

  let eventsFetched = 0;
  let eventsPushed = 0;
  let lastProcessedTs = null;

  try {
    const zRes = await fetch(logUrl, {
      headers: {
        apikey: zebraKey,
        Accept: 'application/json',
      },
    });
    const zText = await zRes.text();
    let zJson;
    try {
      zJson = zText ? JSON.parse(zText) : {};
    } catch {
      throw new Error(`Zebra: respuesta no JSON (${zRes.status})`);
    }
    if (!zRes.ok) {
      throw new Error(zJson?.message || zJson?.error || `Zebra HTTP ${zRes.status}`);
    }
    if (zJson.error) {
      throw new Error(String(zJson.error));
    }

    const results = Array.isArray(zJson.results) ? zJson.results : [];
    eventsFetched = results.length;

    results.sort((a, b) => new Date(a?.event?.timestamp || 0) - new Date(b?.event?.timestamp || 0));
    const minSec = Number(settings.min_seconds_between_events) || 300;
    const filtered = filterEventsByMinGap(results, minSec);

    const hosts = parseHostsJson(settings.zabbix_hosts_json);
    const keyTpl = settings.item_key_template || 'alarm.{sensorId}';
    const policyMap = await loadSensorPollingPolicyMap(db, taskId);

    const zabbixAuth = await getZabbixAuthSession(apiUrl, authType, creds);

    const dataRows = [];
    for (const item of filtered) {
      const ev = item.event;
      const sensorId = ev?.data?.id;
      const isoTs = ev?.timestamp;
      if (sensorId == null || !isoTs) continue;
      if (!sensorPollingEnabled(policyMap, sensorId)) continue;
      const sample = item?.decode?.temperature?.sample;
      const tempStr = sample != null && !Number.isNaN(Number(sample)) ? String(sample) : '';
      const formatted = formatDateDdMmYyyyHms(isoTs);
      const value = `${tempStr} ${formatted}`.trim();
      const key = buildItemKey(keyTpl, sensorId);
      const clock = Math.floor(new Date(isoTs).getTime() / 1000);
      for (const host of hosts) {
        dataRows.push({ host, key, value, clock, ns: 0 });
      }
    }

    const batchSize = 200;
    for (let i = 0; i < dataRows.length; i += batchSize) {
      const chunk = dataRows.slice(i, i + batchSize);
      await zabbixHistoryPush(apiUrl, zabbixAuth, chunk);
      eventsPushed += chunk.length;
    }

    if (filtered.length > 0) {
      const maxTs = filtered.reduce((acc, it) => {
        const t = it?.event?.timestamp;
        if (!t) return acc;
        const ms = new Date(t).getTime();
        return ms > acc ? ms : acc;
      }, 0);
      if (maxTs > 0) lastProcessedTs = toIsoUtc(new Date(maxTs));
    } else if (results.length > 0) {
      const maxAll = results.reduce((acc, it) => {
        const t = it?.event?.timestamp;
        const ms = t ? new Date(t).getTime() : 0;
        return ms > acc ? ms : acc;
      }, 0);
      if (maxAll > 0) lastProcessedTs = toIsoUtc(new Date(maxAll));
    } else {
      lastProcessedTs = endIso;
    }

    await finalizePollState(db, taskId, lastProcessedTs, endIso, filtered, nowSql, policyMap);

    await db.run(
      `UPDATE zebra_poll_runs SET finished_at = ${nowSql}, status = 'ok', events_fetched = ?, events_pushed = ?, error_message = NULL WHERE id = ?`,
      [eventsFetched, eventsPushed, runId]
    );

    return { ok: true, taskId, eventsFetched, eventsPushed, filtered: filtered.length };
  } catch (e) {
    const msg = String(e.message || e);
    await db.run(
      `UPDATE zebra_poll_runs SET finished_at = ${nowSql}, status = 'error', events_fetched = ?, events_pushed = ?, error_message = ? WHERE id = ?`,
      [eventsFetched, eventsPushed, msg.slice(0, 4000), runId]
    );
    return { ok: false, taskId, error: msg, eventsFetched, eventsPushed };
  }
}

export async function runZebraZabbixPollOnce(db, { manual = false, singleTaskId = null } = {}) {
  const settings = await loadSettings(db);
  if (!settings) return { skipped: true, reason: 'no_settings' };
  if (!manual && !Number(settings.poller_enabled)) return { skipped: true, reason: 'disabled' };

  const zebraKey = resolveZebraApiKeyFromSettings(settings);
  const zabbixUrl = String(settings.zabbix_api_url || '').trim();
  if (!zebraKey) {
    const msg =
      'Falta la API key de Zebra: guárdala en Configuración (como admin se sincroniza con el servidor) o define ZEBRA_API_KEY en el entorno del proceso Node.';
    await db.run(`UPDATE integration_settings SET last_poll_error = ?, updated_at = ${sqlNow(db)} WHERE id = 1`, [msg]);
    return { ok: false, error: msg };
  }
  if (!zabbixUrl) {
    const msg = 'Falta la URL de Zabbix en integración';
    await db.run(`UPDATE integration_settings SET last_poll_error = ?, updated_at = ${sqlNow(db)} WHERE id = 1`, [msg]);
    return { ok: false, error: msg };
  }

  let taskIds = [];
  if (singleTaskId && manual) {
    taskIds = [String(singleTaskId).trim()].filter(Boolean);
  } else {
    const rows = await db.all(`SELECT task_zebra_id FROM zebra_task_poll_config WHERE polling_enabled = 1`);
    taskIds = (rows || []).map((r) => String(r.task_zebra_id)).filter(Boolean);
  }

  if (!taskIds.length) {
    if (manual) {
      const msg =
        'No hay tareas con polling a Zabbix activado (actívalo en Gestión de tareas) o indica task_id en el cuerpo de la petición.';
      await db.run(`UPDATE integration_settings SET last_poll_error = ?, updated_at = ${sqlNow(db)} WHERE id = 1`, [msg]);
      return { ok: false, error: msg, reason: 'no_tasks' };
    }
    return { skipped: true, reason: 'no_tasks' };
  }

  const n = sqlNow(db);
  const results = [];
  for (const taskId of taskIds) {
    const r = await runPollForSingleTask(db, settings, taskId, manual);
    results.push(r);
  }

  const anyFail = results.some((r) => !r.ok);
  const errText = results
    .filter((r) => !r.ok)
    .map((r) => `${r.taskId}: ${r.error || 'error'}`)
    .join('; ')
    .slice(0, 3900);
  await db.run(`UPDATE integration_settings SET last_poll_at = ${n}, last_poll_error = ?, updated_at = ${n} WHERE id = 1`, [
    anyFail ? errText : null,
  ]);

  return { ok: !anyFail, tasks: results, error: anyFail ? errText : undefined };
}

async function finalizePollState(db, taskId, lastProcessedTs, endIso, filtered, nowSql, policyMap) {
  if (db.dialect === 'mysql') {
    if (lastProcessedTs) {
      await db.run(
        `INSERT INTO zebra_poll_cursors (task_id, last_event_timestamp, last_window_end, updated_at)
         VALUES (?, ?, ?, ${nowSql})
         ON DUPLICATE KEY UPDATE last_event_timestamp = VALUES(last_event_timestamp), last_window_end = VALUES(last_window_end), updated_at = VALUES(updated_at)`,
        [taskId, lastProcessedTs, endIso]
      );
    }
    for (const item of filtered) {
      const ev = item.event;
      const sensorId = ev?.data?.id;
      const isoTs = ev?.timestamp;
      if (sensorId == null || !isoTs) continue;
      const sample = item?.decode?.temperature?.sample;
      const tempStr = sample != null && !Number.isNaN(Number(sample)) ? String(sample) : '';
      const value = `${tempStr} ${formatDateDdMmYyyyHms(isoTs)}`.trim();
      const pushed = sensorPollingEnabled(policyMap, sensorId);
      await upsertSensorStateRow(db, taskId, String(sensorId), isoTs, value, pushed, nowSql);
    }
    return;
  }

  if (lastProcessedTs) {
    await db.run(
      `INSERT INTO zebra_poll_cursors (task_id, last_event_timestamp, last_window_end, updated_at)
       VALUES (?, ?, ?, ${nowSql})
       ON CONFLICT(task_id) DO UPDATE SET
         last_event_timestamp = excluded.last_event_timestamp,
         last_window_end = excluded.last_window_end,
         updated_at = excluded.updated_at`,
      [taskId, lastProcessedTs, endIso]
    );
  }
  for (const item of filtered) {
    const ev = item.event;
    const sensorId = ev?.data?.id;
    const isoTs = ev?.timestamp;
    if (sensorId == null || !isoTs) continue;
    const sample = item?.decode?.temperature?.sample;
    const tempStr = sample != null && !Number.isNaN(Number(sample)) ? String(sample) : '';
    const value = `${tempStr} ${formatDateDdMmYyyyHms(isoTs)}`.trim();
    const pushed = sensorPollingEnabled(policyMap, sensorId);
    await upsertSensorStateRow(db, taskId, String(sensorId), isoTs, value, pushed, nowSql);
  }
}

async function upsertSensorStateRow(db, taskId, sid, isoTs, value, pushedToZabbix, nowSql) {
  if (db.dialect === 'mysql') {
    if (pushedToZabbix) {
      const up = await db.run(
        `UPDATE zebra_poll_sensor_state SET last_event_timestamp = ?, last_value_text = ?, last_zabbix_push_at = ${nowSql}, updated_at = ${nowSql} WHERE task_id = ? AND sensor_zebra_id = ?`,
        [isoTs, value, taskId, sid]
      );
      if (up.changes === 0) {
        await db.run(
          `INSERT INTO zebra_poll_sensor_state (task_id, sensor_zebra_id, last_event_timestamp, last_value_text, last_zabbix_push_at, updated_at)
           VALUES (?, ?, ?, ?, ${nowSql}, ${nowSql})`,
          [taskId, sid, isoTs, value]
        );
      }
    } else {
      const up = await db.run(
        `UPDATE zebra_poll_sensor_state SET last_event_timestamp = ?, last_value_text = ?, updated_at = ${nowSql} WHERE task_id = ? AND sensor_zebra_id = ?`,
        [isoTs, value, taskId, sid]
      );
      if (up.changes === 0) {
        await db.run(
          `INSERT INTO zebra_poll_sensor_state (task_id, sensor_zebra_id, last_event_timestamp, last_value_text, last_zabbix_push_at, updated_at)
           VALUES (?, ?, ?, ?, NULL, ${nowSql})`,
          [taskId, sid, isoTs, value]
        );
      }
    }
    return;
  }

  if (pushedToZabbix) {
    const up = await db.run(
      `UPDATE zebra_poll_sensor_state SET last_event_timestamp = ?, last_value_text = ?, last_zabbix_push_at = ${nowSql}, updated_at = ${nowSql} WHERE task_id = ? AND sensor_zebra_id = ?`,
      [isoTs, value, taskId, sid]
    );
    if (up.changes === 0) {
      await db.run(
        `INSERT INTO zebra_poll_sensor_state (task_id, sensor_zebra_id, last_event_timestamp, last_value_text, last_zabbix_push_at, updated_at)
         VALUES (?, ?, ?, ?, ${nowSql}, ${nowSql})`,
        [taskId, sid, isoTs, value]
      );
    }
  } else {
    const up = await db.run(
      `UPDATE zebra_poll_sensor_state SET last_event_timestamp = ?, last_value_text = ?, updated_at = ${nowSql} WHERE task_id = ? AND sensor_zebra_id = ?`,
      [isoTs, value, taskId, sid]
    );
    if (up.changes === 0) {
      await db.run(
        `INSERT INTO zebra_poll_sensor_state (task_id, sensor_zebra_id, last_event_timestamp, last_value_text, last_zabbix_push_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ${nowSql})`,
        [taskId, sid, isoTs, value]
      );
    }
  }
}

export function startZebraZabbixPoller(db) {
  let timer = null;
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runZebraZabbixPollOnce(db, { manual: false });
    } catch (e) {
      console.error('[poller]', e);
    } finally {
      running = false;
    }
  };

  const schedule = async () => {
    const s = await loadSettings(db);
    const minutes = Math.max(1, Number(s?.poll_interval_minutes) || 6);
    const ms = minutes * 60 * 1000;
    if (timer) clearInterval(timer);
    timer = setInterval(tick, ms);
  };

  schedule().catch((e) => console.error('[poller] schedule', e));
  setInterval(() => {
    schedule().catch(() => {});
  }, 60 * 1000);
  setTimeout(tick, 15_000);

  return { tickNow: tick, reschedule: schedule };
}
