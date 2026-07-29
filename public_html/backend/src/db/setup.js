const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await pool.query(statement);
    }

    // Hash admin password and update
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `UPDATE users SET password = ? WHERE email = 'admin@bailord.com'`,
      [hashedPassword]
    );

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();