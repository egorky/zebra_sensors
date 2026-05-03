import mysql from 'mysql2/promise';

export function createMysqlAdapter(config) {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: config.connectionLimit ?? 10,
    namedPlaceholders: false,
  });

  return {
    dialect: 'mysql',
    raw: pool,
    async exec(sql) {
      const statements = splitSqlStatements(sql);
      const conn = await pool.getConnection();
      try {
        for (const st of statements) {
          if (st.trim()) await conn.query(st);
        }
      } finally {
        conn.release();
      }
    },
    async all(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return rows;
    },
    async get(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return Array.isArray(rows) && rows[0] ? rows[0] : null;
    },
    async run(sql, params = []) {
      const [result] = await pool.execute(sql, params);
      return {
        changes: result.affectedRows ?? 0,
        lastInsertRowid: Number(result.insertId) || 0,
      };
    },
    async close() {
      await pool.end();
    },
  };
}

/** Best-effort split for simple DDL migrations (no semicolons inside strings). */
function splitSqlStatements(sql) {
  return String(sql)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}
