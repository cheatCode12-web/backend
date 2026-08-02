const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
const dbHost = process.env.DB_HOST || "127.0.0.1";
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || "";
const dbName = process.env.DB_NAME || "bailord_dev";
const useSsl =
  process.env.DB_SSL === "true" ||
  process.env.PGSSLMODE === "require" ||
  /render\.com$/.test(dbHost) ||
  /render\.com/.test(connectionString || "");

// Log DB config on load (for debugging)
console.log("[DB CONFIG]", {
  DATABASE_URL_SET: !!connectionString,
  DB_HOST: dbHost,
  DB_PORT: dbPort,
  DB_USER: dbUser,
  DB_NAME: dbName,
  DB_HOST_SET: !!process.env.DB_HOST,
  DB_USER_SET: !!process.env.DB_USER,
  DB_PASSWORD_SET: !!process.env.DB_PASSWORD || !!process.env.DB_PASS,
  DB_NAME_SET: !!process.env.DB_NAME,
  DB_SSL: useSsl ? "ENABLED" : "DISABLED",
  PGSSLMODE: process.env.PGSSLMODE || "unset",
});

// PostgreSQL connection pool
let pool;
try {
  const poolConfig = connectionString
    ? {
        connectionString,
        ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      }
    : {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      };

  pool = new Pool({
    ...poolConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected PostgreSQL pool error:', err.stack || err.message || err);
  });

  console.log("[DB] PostgreSQL Pool created successfully");
} catch (err) {
  console.error("[DB] Pool creation failed:", err.message || err);
  pool = null;
}

const verifyDbConnection = async () => {
  if (!pool) {
    throw new Error("Database pool is not available");
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};

module.exports = { pool, verifyDbConnection };
