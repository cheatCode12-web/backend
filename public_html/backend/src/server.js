


// STEP 0: Load environment variables as early as possible
const fs = require('fs');
fs.appendFileSync('/home/bailord3/logs/debug.log', 'SERVER STARTED\n');

require("dotenv").config();

console.log("STEP 1: env loaded", {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  FRONTEND_URL: process.env.FRONTEND_URL
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

// Handle uncaught errors and rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

module.exports = server;
