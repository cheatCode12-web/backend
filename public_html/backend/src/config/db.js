const mysql = require("mysql2/promise");

// Log DB config on load (for debugging)
console.log("[DB CONFIG]", {
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER ,
  DB_NAME: process.env.DB_NAME || "bailord_dev",
  DB_HOST_SET: !!process.env.DB_HOST,
  DB_USER_SET: !!process.env.DB_USER,
  DB_PASSWORD_SET: !!process.env.DB_PASSWORD,
  DB_NAME_SET: !!process.env.DB_NAME
});

// MySQL connection pool
let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
    database: process.env.DB_NAME || "bailord_dev",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log("[DB] Pool created successfully");
} catch (err) {
  console.error("[DB] Pool creation failed:", err.message || err);
  // Create a dummy pool that will fail gracefully on queries
  pool = null;
}

module.exports = { pool };
