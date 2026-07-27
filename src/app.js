const express = require("express");
const cors = require("cors");

console.log("APP: Loading dependencies");

let authRoutes;
let retailerRoutes;
let projectRoutes;
let messageRoutes;
let searchRoutes;
let analyticsRoutes;
let pool;
let warmCoreSchema;

try {
  authRoutes = require("./routes/authRoutes");
  retailerRoutes = require("./routes/retailerRoutes");
  projectRoutes = require("./routes/projectRoutes");
  messageRoutes = require("./routes/messageRoutes");
  searchRoutes = require("./routes/searchRoutes");
  analyticsRoutes = require("./routes/analyticsRoutes");
  console.log("APP: All routes loaded successfully");
} catch (err) {
  console.error("APP: Route loading failed:", err.message || err);
}

try {
  ({ pool } = require("./config/db"));
  ({ warmCoreSchema } = require("./db/schemaGuard"));
  console.log("APP: DB module loaded");
} catch (err) {
  console.error("DB load failed:", err.message || err.code || err);
}

console.log("APP: configuring middleware");

const app = express();

const allowedOrigins = Array.from(
  new Set(
    [
      process.env.FRONTEND_URL,
      "https://bailordpulse.com",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:5173",
    ].filter(Boolean)
  )
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

if (pool && typeof warmCoreSchema === "function") {
  void warmCoreSchema();
}

app.get(["/", "/backend", "/backend/"], (req, res) => {
  res.send("Backend is working");
});

app.get("/backend/test-token", (req, res) => {
  const jwt = require("jsonwebtoken");
  const token = jwt.sign(
    { id: 1, email: "john@gmail.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

app.use("/api/auth", authRoutes);
app.use("/api/retailers", retailerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/backend/api/auth", authRoutes);
app.use("/backend/api/retailers", retailerRoutes);
app.use("/backend/api/projects", projectRoutes);
app.use("/backend/api/messages", messageRoutes);
app.use("/backend/api/search", searchRoutes);
app.use("/backend/api/analytics", analyticsRoutes);

if (process.env.NODE_ENV !== "production" && pool) {
  (async () => {
    try {
      const conn = await pool.getConnection();
      console.log("MySQL connected successfully");
      conn.release();
    } catch (err) {
      console.error("Database connection error:", err.message || err.code || err);
    }
  })();
}

app.use((err, req, res, next) => {
  console.error("APP ERROR:", err.stack || err);
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
