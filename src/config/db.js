const { Pool } = require("pg");

const usingDatabaseUrl = Boolean(process.env.DATABASE_URL);
const dbConfig = usingDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
      database: process.env.DB_NAME || "bailord_dev",
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

// Log DB config on load (for debugging)
console.log("[DB CONFIG]", {
  DATABASE_URL: usingDatabaseUrl ? "SET" : "MISSING",
  DB_HOST: dbConfig.host || "(from DATABASE_URL)" || "127.0.0.1",
  DB_PORT: dbConfig.port || "5432",
  DB_USER: dbConfig.user ? "SET" : "MISSING",
  DB_NAME: dbConfig.database || "(from DATABASE_URL)",
  DB_HOST_SET: !!dbConfig.host,
  DB_USER_SET: !!dbConfig.user,
  DB_PASSWORD_SET: !!dbConfig.password,
  DB_NAME_SET: !!dbConfig.database,
});

// PostgreSQL connection pool
let pool;
try {
  pool = new Pool(dbConfig);
  console.log("[DB] PostgreSQL Pool created successfully");
} catch (err) {
  console.error("[DB] Pool creation failed:", err.message || err);
  // Create a dummy pool that will fail gracefully on queries
  pool = null;
}

module.exports = { pool };