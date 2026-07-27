const { pool } = require('../config/db');

let authSchemaPromise = null;
let messageSchemaPromise = null;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_]+$/;

async function ensurePool() {
  if (!pool) {
    throw new Error('Database pool is not available');
  }
}

async function queryOne(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

function isSafeIdentifier(identifier) {
  return IDENTIFIER_PATTERN.test(identifier);
}

async function tableExists(tableName) {
  const row = await queryOne(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?
    `,
    [tableName]
  );
  return Number(row && row.count) > 0;
}

async function columnInfo(tableName, columnName) {
  return queryOne(
    `
      SELECT column_name AS columnName, column_type AS columnType
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
    `,
    [tableName, columnName]
  );
}

async function getTableColumns(tableName) {
  await ensurePool();

  try {
    const [rows] = await pool.query(
      `
        SELECT column_name AS columnName
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ?
      `,
      [tableName]
    );

    return new Set(rows.map((row) => row.columnName));
  } catch (error) {
    if (!isSafeIdentifier(tableName)) {
      throw error;
    }

    try {
      const [rows] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
      return new Set(rows.map((row) => row.Field));
    } catch (fallbackError) {
      return new Set();
    }
  }
}

async function indexExists(tableName, indexName) {
  const row = await queryOne(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
    `,
    [tableName, indexName]
  );
  return Number(row && row.count) > 0;
}

async function ensureColumn(tableName, columnName, definitionSql) {
  const existing = await columnInfo(tableName, columnName);
  if (!existing) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${definitionSql}`);
  }
}

async function ensureIndex(tableName, indexName, createSql) {
  if (!(await indexExists(tableName, indexName))) {
    await pool.query(createSql);
  }
}

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'staff', 'retailer') NOT NULL DEFAULT 'staff',
      status ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'active',
      refresh_token VARCHAR(512),
      last_token_refresh TIMESTAMP NULL,
      company VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureColumn('users', 'role', "role ENUM('admin', 'staff', 'retailer') NOT NULL DEFAULT 'staff'");
  await ensureColumn('users', 'status', "status ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'active'");
  await ensureColumn('users', 'refresh_token', 'refresh_token VARCHAR(512) NULL');
  await ensureColumn('users', 'last_token_refresh', 'last_token_refresh TIMESTAMP NULL');
  await ensureColumn('users', 'company', 'company VARCHAR(255) NULL');
  await ensureColumn('users', 'phone', 'phone VARCHAR(50) NULL');
  await ensureColumn('users', 'address', 'address TEXT NULL');
  await ensureColumn('users', 'description', 'description TEXT NULL');
  await ensureColumn('users', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  const role = await columnInfo('users', 'role');
  if (role && !String(role.columnType || '').includes("'retailer'")) {
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'retailer') NOT NULL DEFAULT 'staff'");
  }

  const status = await columnInfo('users', 'status');
  const statusType = String(status && status.columnType || '');
  if (status && (!statusType.includes("'pending'") || !statusType.includes("'suspended'"))) {
    await pool.query("ALTER TABLE users MODIFY COLUMN status ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'active'");
  }

  await ensureIndex('users', 'idx_email', 'CREATE INDEX idx_email ON users(email)');
  await ensureIndex('users', 'idx_role', 'CREATE INDEX idx_role ON users(role)');
  await ensureIndex('users', 'idx_status', 'CREATE INDEX idx_status ON users(status)');
}

async function ensureTokenBlacklistTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id INT PRIMARY KEY AUTO_INCREMENT,
      token VARCHAR(512) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id VARCHAR(191) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureIndex('token_blacklist', 'idx_token', 'CREATE INDEX idx_token ON token_blacklist(token)');
  await ensureIndex('token_blacklist', 'idx_expires_at', 'CREATE INDEX idx_expires_at ON token_blacklist(expires_at)');
}

async function ensureMessagesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      recipient_id INT NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureColumn('messages', 'is_read', 'is_read BOOLEAN DEFAULT FALSE');
  await ensureColumn('messages', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await ensureIndex('messages', 'idx_sender_recipient', 'CREATE INDEX idx_sender_recipient ON messages(sender_id, recipient_id)');
  await ensureIndex('messages', 'idx_created_at', 'CREATE INDEX idx_created_at ON messages(created_at)');
}

async function runCached(target) {
  await ensurePool();
  return target();
}

async function ensureAuthSchema() {
  if (!authSchemaPromise) {
    authSchemaPromise = runCached(async () => {
      await ensureUsersTable();
      await ensureTokenBlacklistTable();
    }).catch((error) => {
      authSchemaPromise = null;
      throw error;
    });
  }

  return authSchemaPromise;
}

async function safeEnsureAuthSchema() {
  try {
    await ensureAuthSchema();
    return true;
  } catch (error) {
    console.warn("Auth schema repair skipped:", error.message || error.code || error);
    return false;
  }
}

async function ensureMessageSchema() {
  if (!messageSchemaPromise) {
    messageSchemaPromise = runCached(async () => {
      await ensureAuthSchema();
      await ensureMessagesTable();
    }).catch((error) => {
      messageSchemaPromise = null;
      throw error;
    });
  }

  return messageSchemaPromise;
}

async function safeEnsureMessageSchema() {
  try {
    await ensureMessageSchema();
    return true;
  } catch (error) {
    console.warn("Message schema repair skipped:", error.message || error.code || error);
    return false;
  }
}

async function warmCoreSchema() {
  try {
    if (await tableExists('users') || await tableExists('messages')) {
      await ensureMessageSchema();
    } else {
      await ensureAuthSchema();
    }
  } catch (error) {
    console.error('Schema warmup failed:', error.message || error.code || error);
  }
}

module.exports = {
  ensureAuthSchema,
  ensureMessageSchema,
  getTableColumns,
  safeEnsureAuthSchema,
  safeEnsureMessageSchema,
  tableExists,
  warmCoreSchema,
};
