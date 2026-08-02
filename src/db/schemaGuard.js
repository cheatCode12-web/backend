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
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

function isSafeIdentifier(identifier) {
  return IDENTIFIER_PATTERN.test(identifier);
}

async function tableExists(tableName) {
  const row = await queryOne(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_catalog = current_database()
        AND table_schema = current_schema()
        AND table_name = $1
    `,
    [tableName]
  );
  return Number(row && row.count) > 0;
}

async function columnInfo(tableName, columnName) {
  return queryOne(
    `
      SELECT column_name AS columnName,
             data_type AS columnType,
             udt_name AS udtName
      FROM information_schema.columns
      WHERE table_catalog = current_database()
        AND table_schema = current_schema()
        AND table_name = $1
        AND column_name = $2
    `,
    [tableName, columnName]
  );
}

async function getTableColumns(tableName) {
  await ensurePool();

  try {
    const result = await pool.query(
      `
        SELECT column_name AS columnName
        FROM information_schema.columns
        WHERE table_catalog = current_database()
          AND table_schema = current_schema()
          AND table_name = $1
      `,
      [tableName]
    );

    return new Set(result.rows.map((row) => row.columnName));
  } catch (error) {
    if (!isSafeIdentifier(tableName)) {
      throw error;
    }

    return new Set();
  }
}

async function indexExists(tableName, indexName) {
  const row = await queryOne(
    `
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = $1
        AND c.relkind = 'i'
        AND n.nspname = current_schema()
    `,
    [indexName]
  );
  return Boolean(row);
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

async function ensureEnumType(typeName, values) {
  if (!isSafeIdentifier(typeName)) {
    throw new Error(`Unsafe enum type name: ${typeName}`);
  }

  const exists = await queryOne(
    `SELECT 1 FROM pg_type WHERE typname = $1`,
    [typeName]
  );

  if (!exists) {
    await pool.query(
      `CREATE TYPE ${typeName} AS ENUM (${values.map((value) => `'${value}'`).join(', ')})`
    );
  }
}

async function ensureUsersTable() {
  await ensureEnumType('user_role', ['admin', 'staff', 'retailer']);
  await ensureEnumType('user_status', ['active', 'inactive', 'pending', 'suspended']);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role user_role NOT NULL DEFAULT 'staff',
      status user_status NOT NULL DEFAULT 'active',
      refresh_token VARCHAR(512),
      last_token_refresh TIMESTAMP NULL,
      company VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn('users', 'refresh_token', 'refresh_token VARCHAR(512) NULL');
  await ensureColumn('users', 'last_token_refresh', 'last_token_refresh TIMESTAMP NULL');
  await ensureColumn('users', 'company', 'company VARCHAR(255) NULL');
  await ensureColumn('users', 'phone', 'phone VARCHAR(50) NULL');
  await ensureColumn('users', 'address', 'address TEXT NULL');
  await ensureColumn('users', 'description', 'description TEXT NULL');
  await ensureColumn('users', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await ensureIndex('users', 'idx_email', 'CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
  await ensureIndex('users', 'idx_role', 'CREATE INDEX IF NOT EXISTS idx_role ON users(role)');
  await ensureIndex('users', 'idx_status', 'CREATE INDEX IF NOT EXISTS idx_status ON users(status)');
}

async function ensureTokenBlacklistTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id SERIAL PRIMARY KEY,
      token VARCHAR(512) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER NULL
    )
  `);

  await ensureIndex('token_blacklist', 'idx_token', 'CREATE INDEX IF NOT EXISTS idx_token ON token_blacklist(token)');
  await ensureIndex('token_blacklist', 'idx_expires_at', 'CREATE INDEX IF NOT EXISTS idx_expires_at ON token_blacklist(expires_at)');
}

async function ensureMessagesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INT NOT NULL,
      recipient_id INT NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn('messages', 'is_read', 'is_read BOOLEAN DEFAULT FALSE');
  await ensureColumn('messages', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await ensureIndex('messages', 'idx_sender_recipient', 'CREATE INDEX IF NOT EXISTS idx_sender_recipient ON messages(sender_id, recipient_id)');
  await ensureIndex('messages', 'idx_created_at', 'CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at)');
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
