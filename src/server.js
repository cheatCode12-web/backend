
// STEP 0: Load environment variables as early as possible
const fs = require('fs');
const path = require('path');

const debugLogPath = process.env.DEBUG_LOG_PATH
  || (process.env.HOME ? path.join(process.env.HOME, 'logs', 'debug.log') : null);

if (debugLogPath) {
  try {
    fs.mkdirSync(path.dirname(debugLogPath), { recursive: true });
    fs.appendFileSync(debugLogPath, 'SERVER STARTED\n');
  } catch (err) {
    console.warn('Debug log write skipped:', err.message || err);
  }
}

require("dotenv").config();

console.log("STEP 1: env loaded", {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER ? "SET" : "MISSING",
  FRONTEND_URL: process.env.FRONTEND_URL,
  RUN_MIGRATIONS: process.env.RUN_MIGRATIONS,
  RUN_DB_INIT: process.env.RUN_DB_INIT,
});

const app = require("./app");
const { createServer } = require('http');

console.log("STEP 2: app module loaded");

// Use simple app.listen for Passenger compatibility
const PORT = process.env.PORT || 5000;

let server;
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log("STEP 3: server started", { port: PORT });
  });
} catch (err) {
  console.error("Server start failed:", err);
}

// Initialize Socket.IO safely
try {
  const { initializeSocket } = require('./socket/socketManager');
  const io = initializeSocket(server);
  global.io = io;
  console.log("Socket initialized");
} catch (err) {
  console.error("Socket failed:", err.message || err);
}

// Optional one-time migrations runner. Set RUN_MIGRATIONS=true to run
// `src/config/runMigrations.js` once on startup. Set RUN_DB_INIT=true to
// also run `npm run db:init` after migrations. Disable these env vars
// after successful run to avoid re-running on every restart.
if (process.env.RUN_MIGRATIONS === 'true') {
  try {
    const { exec } = require('child_process');
    console.log('RUN_MIGRATIONS=true — executing migrations...');
    exec('node src/config/runMigrations.js', { env: process.env }, (err, stdout, stderr) => {
      if (err) {
        console.error('Migrations process failed:', err.message || err);
        return;
      }
      if (stdout) console.log('Migrations stdout:', stdout);
      if (stderr) console.error('Migrations stderr:', stderr);

      if (process.env.RUN_DB_INIT === 'true') {
        console.log('RUN_DB_INIT=true — running DB init (seed)...');
        exec('npm run db:init', { env: process.env }, (ie, out, errOut) => {
          if (ie) {
            console.error('DB init failed:', ie.message || ie);
            return;
          }
          if (out) console.log('DB init stdout:', out);
          if (errOut) console.error('DB init stderr:', errOut);
        });
      }
    });
  } catch (e) {
    console.error('Failed to start migrations runner:', e.message || e);
  }
}

// Handle uncaught errors and rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

module.exports = server;
