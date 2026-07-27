const { pool } = require('./db');
const fs = require('fs/promises');
const path = require('path');

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Get the migration files content
    const addColumnsSQL = await fs.readFile(
      path.join('src', 'config', 'migrations', '001_add_analytics_columns.sql'),
      'utf8'
    );
    const tokenStorageSQL = await fs.readFile(
      path.join('src', 'db', 'migrations', '002_add_token_storage.sql'),
      'utf8'
    );
    const sampleDataSQL = await fs.readFile(
      path.join('src', 'config', 'migrations', '002_add_sample_data.sql'),
      'utf8'
    );

    // Get a connection from the pool
    const conn = await pool.getConnection();
    
    try {
      // Run migrations in order
      console.log('Adding analytics columns...');
      const queries1 = addColumnsSQL.split(';').filter(q => q.trim());
      for (const query of queries1) {
        if (query.trim()) {
          await conn.query(query);
        }
      }

      console.log('Adding auth token storage...');
      const queriesTokens = tokenStorageSQL.split(';').filter(q => q.trim());
      for (const query of queriesTokens) {
        if (query.trim()) {
          await conn.query(query);
        }
      }
      
      console.log('Adding sample data...');
      const queries2 = sampleDataSQL.split(';').filter(q => q.trim());
      for (const query of queries2) {
        if (query.trim()) {
          await conn.query(query);
        }
      }
      
      console.log('✅ Migrations completed successfully');
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations();
