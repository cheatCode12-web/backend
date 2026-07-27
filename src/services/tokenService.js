const { pool } = require("../config/db");
const {
  getTableColumns,
  safeEnsureAuthSchema,
  tableExists,
} = require("../db/schemaGuard");

const validateEnvVariables = () => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    const missing = [];
    if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
    if (!process.env.JWT_REFRESH_SECRET) missing.push("JWT_REFRESH_SECRET");
    console.warn("[ENV WARNING] Missing variables:", missing.join(", "));
    return false;
  }

  return true;
};

validateEnvVariables();

let tokenCapabilitiesPromise = null;

const getTokenCapabilities = async () => {
  if (!tokenCapabilitiesPromise) {
    tokenCapabilitiesPromise = (async () => {
      await safeEnsureAuthSchema();

      const userColumns = await getTableColumns("users");
      const blacklistExists = await tableExists("token_blacklist").catch(() => false);

      return {
        blacklistExists,
        hasLastTokenRefresh: userColumns.has("last_token_refresh"),
        hasRefreshToken: userColumns.has("refresh_token"),
      };
    })().catch((error) => {
      tokenCapabilitiesPromise = null;
      console.warn(
        "[TOKEN] Capability check failed:",
        error.message || error.code || error
      );

      return {
        blacklistExists: false,
        hasLastTokenRefresh: false,
        hasRefreshToken: false,
      };
    });
  }

  return tokenCapabilitiesPromise;
};

const TokenService = {
  isBlacklisted: async (token) => {
    const capabilities = await getTokenCapabilities();
    if (!capabilities.blacklistExists) {
      return false;
    }

    const result = await pool.query(
      "SELECT * FROM token_blacklist WHERE token = $1 AND expires_at > NOW()",
      [token]
    );
    return result.rows.length > 0;
  },

  blacklist: async (token, userId, expiresAt) => {
    const capabilities = await getTokenCapabilities();
    if (!capabilities.blacklistExists) {
      console.warn("[TOKEN] Skipping blacklist insert because token_blacklist is unavailable");
      return;
    }

    await pool.query(
      "INSERT INTO token_blacklist (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [token, userId, expiresAt]
    );
  },

  updateRefreshToken: async (userId, refreshToken) => {
    const capabilities = await getTokenCapabilities();

    if (!capabilities.hasRefreshToken) {
      console.warn("[TOKEN] Skipping refresh token storage because refresh_token column is unavailable");
      return;
    }

    if (capabilities.hasLastTokenRefresh) {
      await pool.query(
        "UPDATE users SET refresh_token = $1, last_token_refresh = NOW() WHERE id = $2",
        [refreshToken, userId]
      );
      return;
    }

    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      userId,
    ]);
  },

  invalidateAllUserTokens: async (userId) => {
    const capabilities = await getTokenCapabilities();

    if (!capabilities.hasRefreshToken) {
      console.warn("[TOKEN] Skipping token invalidation because refresh_token column is unavailable");
      return;
    }

    const result = await pool.query(
      "SELECT refresh_token FROM users WHERE id = $1",
      [userId]
    );

    const existingRefreshToken = result.rows[0]?.refresh_token;

    if (capabilities.hasLastTokenRefresh) {
      await pool.query(
        "UPDATE users SET refresh_token = NULL, last_token_refresh = NULL WHERE id = $1",
        [userId]
      );
    } else {
      await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [userId]);
    }

    if (existingRefreshToken && capabilities.blacklistExists) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await pool.query(
        "INSERT INTO token_blacklist (token, user_id, expires_at) VALUES ($1, $2, $3)",
        [existingRefreshToken, userId, expiresAt]
      );
    }
  },

  cleanupExpiredTokens: async () => {
    const capabilities = await getTokenCapabilities();
    if (!capabilities.blacklistExists) {
      return;
    }

    await pool.query("DELETE FROM token_blacklist WHERE expires_at < NOW()");
  },
};

module.exports.TokenService = TokenService;
