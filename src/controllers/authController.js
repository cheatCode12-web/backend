const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { getTableColumns, safeEnsureAuthSchema } = require("../db/schemaGuard");
const { TokenService } = require("../services/tokenService");

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

const verifyPassword = async (plainPassword, storedPassword) => {
  if (!plainPassword || !storedPassword) {
    return false;
  }

  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  return plainPassword === storedPassword;
};

const upgradeLegacyPasswordIfNeeded = async (userId, plainPassword, storedPassword) => {
  if (!userId || !plainPassword || !storedPassword || isBcryptHash(storedPassword)) {
    return;
  }

  if (plainPassword !== storedPassword) {
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
  console.log("[AUTH] Upgraded legacy plain-text password for user:", userId);
};

const FALLBACK_USER_COLUMNS = new Set([
  "id",
  "name",
  "email",
  "password",
  "role",
  "status",
  "company",
  "phone",
  "address",
  "description",
  "refresh_token",
  "last_token_refresh",
]);

const getUsersColumns = async () => {
  const columns = await getTableColumns("users");
  return columns.size > 0 ? columns : FALLBACK_USER_COLUMNS;
};

const selectAvailableColumns = (availableColumns, desiredColumns) =>
  desiredColumns.filter((column) => availableColumns.has(column));

const buildUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || "staff",
});

module.exports.registerUser = async (req, res) => {
  try {
    await safeEnsureAuthSchema();
    const availableColumns = await getUsersColumns();

    const {
      name,
      email,
      password,
      type,
      businessName,
      phone,
      address,
      description,
    } = req.body;

    console.log("[REGISTER] Incoming request:", {
      name,
      email,
      type,
      phone: phone ? "***" : undefined,
    });

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!availableColumns.has("email") || !availableColumns.has("password")) {
      throw new Error("users table is missing required auth columns");
    }

    const existingResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const existing = existingResult.rows;
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = type === "retailer" ? "retailer" : "staff";
    const status = type === "retailer" ? "pending" : "active";

    const userFields = ["name", "email", "password"];
    const userValues = [name, email, hashedPassword];

    if (availableColumns.has("role")) {
      userFields.push("role");
      userValues.push(role);
    }

    if (availableColumns.has("status")) {
      userFields.push("status");
      userValues.push(status);
    }

    if (type === "retailer") {
      if (availableColumns.has("company")) {
        userFields.push("company");
        userValues.push(businessName || null);
      }
      if (availableColumns.has("phone")) {
        userFields.push("phone");
        userValues.push(phone || null);
      }
      if (availableColumns.has("address")) {
        userFields.push("address");
        userValues.push(address || null);
      }
      if (availableColumns.has("description")) {
        userFields.push("description");
        userValues.push(description || null);
      }
    }

    const placeholders = userFields.map((_, index) => `$${index + 1}`).join(", ");

    await pool.query(
      `INSERT INTO users (${userFields.join(", ")}) VALUES (${placeholders})`,
      userValues
    );

    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];

    console.log("[REGISTER] User created:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    try {
      await TokenService.updateRefreshToken(user.id, refreshToken);
    } catch (err) {
      console.error("[REGISTER] TokenService failed:", err.message || err);
    }

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("[REGISTER] Registration error:", error);
    console.error("[REGISTER] Environment check:", {
      JWT_SECRET: process.env.JWT_SECRET ? "SET" : "MISSING",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? "SET" : "MISSING",
      DB_HOST: process.env.DB_HOST ? "SET" : "MISSING",
      DB_NAME: process.env.DB_NAME ? "SET" : "MISSING",
    });

    res.status(500).json({
      message: "Server error",
      accessToken: null,
      refreshToken: null,
      user: null,
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports.loginUser = async (req, res) => {
  try {
    await safeEnsureAuthSchema();
    const availableColumns = await getUsersColumns();

    const { email, password } = req.body;

    console.log("[LOGIN] Incoming request:", {
      email,
      password: password ? "***" : undefined,
    });
    console.log("[LOGIN] Environment check:", {
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      JWT_REFRESH_SECRET_SET: !!process.env.JWT_REFRESH_SECRET,
      DB_HOST: process.env.DB_HOST,
    });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!availableColumns.has("email") || !availableColumns.has("password")) {
      throw new Error("users table is missing required auth columns");
    }

    const loginResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = loginResult.rows[0];

    if (!user) {
      console.log("[LOGIN] User not found:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("[LOGIN] User found:", {
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      console.log("[LOGIN] Password mismatch for user:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await upgradeLegacyPasswordIfNeeded(user.id, password, user.password);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    try {
      await TokenService.updateRefreshToken(user.id, refreshToken);
    } catch (err) {
      console.error("[LOGIN] TokenService failed:", err.message || err);
    }

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("[LOGIN] Login error:", error.message || error);
    console.error("[LOGIN] Stack:", error.stack);
    console.error("[LOGIN] Environment check:", {
      JWT_SECRET: process.env.JWT_SECRET ? "SET" : "MISSING",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? "SET" : "MISSING",
      DB_HOST: process.env.DB_HOST ? "SET" : "MISSING",
      DB_NAME: process.env.DB_NAME ? "SET" : "MISSING",
    });

    res.status(500).json({
      message: "Server error",
      accessToken: null,
      refreshToken: null,
      user: null,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      env: {
        JWT_SECRET: process.env.JWT_SECRET ? "SET" : "MISSING",
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? "SET" : "MISSING",
        DB_HOST: process.env.DB_HOST ? "SET" : "MISSING",
      },
    });
  }
};

module.exports.getUserProfile = async (req, res) => {
  try {
    await safeEnsureAuthSchema();
    const availableColumns = await getUsersColumns();

    const userId = req.user.id;
    console.log("[PROFILE] Fetching profile for user:", userId);

    const fields = selectAvailableColumns(availableColumns, [
      "id",
      "name",
      "email",
      "role",
      "company",
      "phone",
      "address",
      "description",
      "status",
    ]);

    const profileResult = await pool.query(
      `SELECT ${fields.join(", ")} FROM users WHERE id = $1`,
      [userId]
    );
    const user = profileResult.rows[0];

    if (!user) {
      console.log("[PROFILE] User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("[PROFILE] Profile found:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });
    res.json(user);
  } catch (error) {
    console.error("[PROFILE] Profile error:", error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

module.exports.updateUserProfile = async (req, res) => {
  try {
    await safeEnsureAuthSchema();
    const availableColumns = await getUsersColumns();

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, email, role, phone, company, address, description } = req.body;

    const fields = [];
    const values = [];
let placeholderIndex = 1;
      if (typeof name !== "undefined" && availableColumns.has("name")) {
        fields.push(`name = $${placeholderIndex++}`);
        values.push(name);
      }
      if (typeof email !== "undefined" && availableColumns.has("email")) {
        fields.push(`email = $${placeholderIndex++}`);
        values.push(email);
      }
      if (typeof role !== "undefined" && availableColumns.has("role")) {
        fields.push(`role = $${placeholderIndex++}`);
        values.push(role);
      }
      if (typeof phone !== "undefined" && availableColumns.has("phone")) {
        fields.push(`phone = $${placeholderIndex++}`);
        values.push(phone);
      }
      if (typeof company !== "undefined" && availableColumns.has("company")) {
        fields.push(`company = $${placeholderIndex++}`);
        values.push(company);
      }
      if (typeof address !== "undefined" && availableColumns.has("address")) {
        fields.push(`address = $${placeholderIndex++}`);
        values.push(address);
      }
      if (typeof description !== "undefined" && availableColumns.has("description")) {
        fields.push(`description = $${placeholderIndex++}`);
        values.push(description);
      }

      if (fields.length === 0) {
        return res.status(400).json({ message: "No profile fields provided to update" });
      }

      values.push(userId);
      const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = $${placeholderIndex}`;
    await pool.query(sql, values);

    const responseFields = selectAvailableColumns(availableColumns, [
      "id",
      "name",
      "email",
      "role",
      "company",
      "phone",
      "address",
      "description",
    ]);
    const updatedResult = await pool.query(
      `SELECT ${responseFields.join(", ")} FROM users WHERE id = $1`,
      [userId]
    );

    res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error("[PROFILE] Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    await safeEnsureAuthSchema();
    const availableColumns = await getUsersColumns();

    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }

    if (!availableColumns.has("password")) {
      throw new Error("users table is missing password column");
    }

    const passwordResult = await pool.query("SELECT password FROM users WHERE id = $1", [userId]);
    const user = passwordResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("[AUTH] Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

module.exports.invalidateToken = async (req, res) => {
  try {
    await safeEnsureAuthSchema();

    const userId = req.user.id;
    const currentToken = req.headers.authorization?.split(" ")[1];

    if (!currentToken) {
      return res.status(400).json({ message: "No token provided" });
    }

    const decodedToken = jwt.decode(currentToken);
    if (!decodedToken?.exp) {
      return res.status(400).json({ message: "Invalid token format" });
    }

    await TokenService.blacklist(
      currentToken,
      userId,
      new Date(decodedToken.exp * 1000)
    );
    await TokenService.invalidateAllUserTokens(userId);

    res.json({ message: "Tokens invalidated successfully" });
  } catch (error) {
    console.error("[AUTH] Token invalidation error:", error);
    res.status(500).json({ message: "Failed to invalidate tokens" });
  }
};

module.exports.refreshToken = async (req, res) => {
  try {
    await safeEnsureAuthSchema();
    const availableColumns = await getUsersColumns();

    const { refreshToken } = req.body;
    console.log("[REFRESH] Refresh token request received");

    if (!refreshToken) {
      console.log("[REFRESH] No refresh token provided");
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log("[REFRESH] Token verified for user:", decoded.id);

    if (!availableColumns.has("refresh_token")) {
      return res.status(501).json({ message: "Refresh tokens are not enabled on this database schema" });
    }

    const refreshResult = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND refresh_token = $2",
      [decoded.id, refreshToken]
    );

    if (!refreshResult.rows[0]) {
      console.log("[REFRESH] Stored refresh token mismatch for user:", decoded.id);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken(decoded.id);

    res.json({
      accessToken,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("[REFRESH] Token refresh error:", error.message || error);
    console.error("[REFRESH] Error details:", {
      JWT_REFRESH_SECRET_SET: !!process.env.JWT_REFRESH_SECRET,
      errorName: error.name,
    });
    res.status(401).json({ message: "Invalid refresh token" });
  }
};
