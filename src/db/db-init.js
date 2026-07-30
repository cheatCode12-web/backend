const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const databaseName = process.env.DB_NAME || 'bailord_dev';

const initDatabase = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: databaseName
  });

  try {
    console.log(`Initializing PostgreSQL database: ${databaseName}`);

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, '../config/schema-postgres.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log('✓ Executed schema statement');
      } catch (error) {
        console.warn('⚠ Schema statement warning:', error.message.substring(0, 100));
      }
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         status = EXCLUDED.status`,
      ['Admin User', 'admin@bailord.com', hashedPassword, 'admin', 'active']
    );

    console.log(`✅ Database "${databaseName}" initialized successfully`);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

initDatabase();
