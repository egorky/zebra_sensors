/**
 * Creates / migrates schema for the active dialect.
 */
export async function applySchema(adapter) {
  if (adapter.dialect === 'mysql') {
    await applyMysqlSchema(adapter);
  } else {
    await applySqliteSchema(adapter);
  }
}

async function applySqliteSchema(adapter) {
  await adapter.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'operator')),
      must_change_password INTEGER NOT NULL DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS integration_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      poller_enabled INTEGER NOT NULL DEFAULT 0,
      poll_interval_minutes INTEGER NOT NULL DEFAULT 6,
      zebra_base_url TEXT NOT NULL DEFAULT 'https://api.zebra.com/v2',
      zebra_api_key TEXT,
      zebra_task_id TEXT,
      zabbix_api_url TEXT,
      zabbix_auth_type TEXT NOT NULL DEFAULT 'token' CHECK (zabbix_auth_type IN ('token', 'password')),
      zabbix_api_token TEXT,
      zabbix_username TEXT,
      zabbix_password TEXT,
      zabbix_hosts_json TEXT NOT NULL DEFAULT '["Zebra Devices","Prologitec"]',
      item_key_template TEXT NOT NULL DEFAULT 'alarm.{sensorId}',
      min_seconds_between_events INTEGER NOT NULL DEFAULT 300,
      initial_lookback_minutes INTEGER NOT NULL DEFAULT 120,
      last_poll_at TEXT,
      last_poll_error TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS zebra_poll_cursors (
      task_id TEXT PRIMARY KEY,
      last_event_timestamp TEXT,
      last_window_end TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS zebra_poll_sensor_state (
      task_id TEXT NOT NULL,
      sensor_zebra_id TEXT NOT NULL,
      last_event_timestamp TEXT,
      last_value_text TEXT,
      last_zabbix_push_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (task_id, sensor_zebra_id)
    );
    CREATE TABLE IF NOT EXISTS zebra_poll_sensor_policy (
      task_id TEXT NOT NULL,
      sensor_zebra_id TEXT NOT NULL,
      polling_enabled INTEGER NOT NULL DEFAULT 1 CHECK (polling_enabled IN (0, 1)),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (task_id, sensor_zebra_id)
    );
    CREATE TABLE IF NOT EXISTS zebra_task_poll_config (
      task_zebra_id TEXT PRIMARY KEY,
      polling_enabled INTEGER NOT NULL DEFAULT 0 CHECK (polling_enabled IN (0, 1)),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS zebra_poll_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT,
      status TEXT NOT NULL,
      events_fetched INTEGER NOT NULL DEFAULT 0,
      events_pushed INTEGER NOT NULL DEFAULT 0,
      error_message TEXT
    );
  `);

  try {
    await adapter.get('SELECT must_change_password FROM users LIMIT 1');
  } catch {
    await adapter.exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
  }

  const row = await adapter.get('SELECT id FROM integration_settings WHERE id = 1');
  if (!row) {
    await adapter.run(
      `INSERT INTO integration_settings (id, poller_enabled, poll_interval_minutes, zebra_base_url, zabbix_hosts_json, item_key_template, min_seconds_between_events, initial_lookback_minutes)
       VALUES (1, 0, 6, 'https://api.zebra.com/v2', '["Zebra Devices","Prologitec"]', 'alarm.{sensorId}', 300, 120)`
    );
  }
  await migratePollSchemaSqlite(adapter);
}

async function migratePollSchemaSqlite(adapter) {
  try {
    await adapter.get('SELECT task_id FROM zebra_poll_runs LIMIT 1');
  } catch {
    await adapter.exec('ALTER TABLE zebra_poll_runs ADD COLUMN task_id TEXT');
  }
  await migrateLegacyZebraTaskToPollConfig(adapter);
}

async function applyMysqlSchema(adapter) {
  await adapter.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','operator') NOT NULL DEFAULT 'admin',
      must_change_password TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    CREATE TABLE IF NOT EXISTS sensor_snapshots (
      zebra_id VARCHAR(128) NOT NULL PRIMARY KEY,
      serial_number VARCHAR(255),
      name VARCHAR(512),
      status VARCHAR(128),
      battery_level INT,
      last_temperature DOUBLE,
      raw_json MEDIUMTEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    CREATE TABLE IF NOT EXISTS task_snapshots (
      zebra_id VARCHAR(128) NOT NULL PRIMARY KEY,
      name VARCHAR(512),
      status VARCHAR(128),
      raw_json MEDIUMTEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    CREATE TABLE IF NOT EXISTS integration_settings (
      id INT NOT NULL PRIMARY KEY,
      poller_enabled TINYINT(1) NOT NULL DEFAULT 0,
      poll_interval_minutes INT NOT NULL DEFAULT 6,
      zebra_base_url VARCHAR(512) NOT NULL DEFAULT 'https://api.zebra.com/v2',
      zebra_api_key TEXT,
      zebra_task_id VARCHAR(128),
      zabbix_api_url VARCHAR(1024),
      zabbix_auth_type ENUM('token','password') NOT NULL DEFAULT 'token',
      zabbix_api_token TEXT,
      zabbix_username VARCHAR(255),
      zabbix_password TEXT,
      zabbix_hosts_json TEXT NOT NULL,
      item_key_template VARCHAR(512) NOT NULL DEFAULT 'alarm.{sensorId}',
      min_seconds_between_events INT NOT NULL DEFAULT 300,
      initial_lookback_minutes INT NOT NULL DEFAULT 120,
      last_poll_at DATETIME NULL,
      last_poll_error TEXT,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    CREATE TABLE IF NOT EXISTS zebra_poll_cursors (
      task_id VARCHAR(128) NOT NULL PRIMARY KEY,
      last_event_timestamp VARCHAR(64),
      last_window_end VARCHAR(64),
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    CREATE TABLE IF NOT EXISTS zebra_poll_sensor_state (
      task_id VARCHAR(128) NOT NULL,
      sensor_zebra_id VARCHAR(128) NOT NULL,
      last_event_timestamp VARCHAR(64),
      last_value_text TEXT,
      last_zabbix_push_at VARCHAR(64),
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (task_id, sensor_zebra_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    CREATE TABLE IF NOT EXISTS zebra_poll_sensor_policy (
      task_id VARCHAR(128) NOT NULL,
      sensor_zebra_id VARCHAR(128) NOT NULL,
      polling_enabled TINYINT(1) NOT NULL DEFAULT 1,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (task_id, sensor_zebra_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    CREATE TABLE IF NOT EXISTS zebra_task_poll_config (
      task_zebra_id VARCHAR(128) NOT NULL PRIMARY KEY,
      polling_enabled TINYINT(1) NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    CREATE TABLE IF NOT EXISTS zebra_poll_runs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      task_id VARCHAR(128) NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME NULL,
      status VARCHAR(32) NOT NULL,
      events_fetched INT NOT NULL DEFAULT 0,
      events_pushed INT NOT NULL DEFAULT 0,
      error_message TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const row = await adapter.get('SELECT id FROM integration_settings WHERE id = 1');
  if (!row) {
    await adapter.run(
      `INSERT INTO integration_settings (id, poller_enabled, poll_interval_minutes, zebra_base_url, zabbix_hosts_json, item_key_template, min_seconds_between_events, initial_lookback_minutes)
       VALUES (1, 0, 6, 'https://api.zebra.com/v2', ?, 'alarm.{sensorId}', 300, 120)`,
      ['["Zebra Devices","Prologitec"]']
    );
  }
  await migratePollSchemaMysql(adapter);
}

async function migratePollSchemaMysql(adapter) {
  try {
    const col = await adapter.get(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'zebra_poll_runs' AND COLUMN_NAME = 'task_id'`
    );
    if (!col) {
      await adapter.exec('ALTER TABLE zebra_poll_runs ADD COLUMN task_id VARCHAR(128) NULL');
    }
  } catch {
    /* ignore */
  }
  await adapter.exec(`
    CREATE TABLE IF NOT EXISTS zebra_task_poll_config (
      task_zebra_id VARCHAR(128) NOT NULL PRIMARY KEY,
      polling_enabled TINYINT(1) NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await migrateLegacyZebraTaskToPollConfig(adapter);
}

async function migrateLegacyZebraTaskToPollConfig(adapter) {
  const row = await adapter.get('SELECT zebra_task_id, poller_enabled FROM integration_settings WHERE id = 1');
  if (!row?.zebra_task_id) return;
  const tid = String(row.zebra_task_id).trim();
  if (!tid) return;
  const has = await adapter.get('SELECT task_zebra_id FROM zebra_task_poll_config WHERE task_zebra_id = ?', [tid]);
  if (has) return;
  if (Number(row.poller_enabled)) {
    const n = sqlNow(adapter);
    await adapter.run(
      `INSERT INTO zebra_task_poll_config (task_zebra_id, polling_enabled, updated_at) VALUES (?, 1, ${n})`,
      [tid]
    );
  }
}

export function sqlNow(adapter) {
  return adapter.dialect === 'mysql' ? 'NOW()' : "datetime('now')";
}
