const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const databaseName = process.env.DB_NAME || 'bailord_dev';

const setup = async () => {
  try {
    // First connect without database to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DB_PASS || ''
    });

    console.log('✅ Connected to MySQL server');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    await connection.query(`USE \`${databaseName}\``);
    
    console.log('✅ Database created/selected');

    // Drop existing tables in correct order (child tables first)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS token_blacklist');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create users table
    await connection.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff', 'retailer') NOT NULL DEFAULT 'staff',
        status ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'active',
        refresh_token VARCHAR(512),
        last_token_refresh TIMESTAMP NULL,
        company VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      )
    `);

    console.log('✅ Users table created');

    // Create token blacklist table
    await connection.query(`
      CREATE TABLE token_blacklist (
        id INT PRIMARY KEY AUTO_INCREMENT,
        token VARCHAR(512) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expires_at (expires_at)
      )
    `);

    console.log('✅ Token blacklist table created');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT INTO users (name, email, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `, ['Admin User', 'admin@bailord.com', hashedPassword, 'admin', 'active']);

    console.log('✅ Default admin user created');
    console.log('✅ Database setup completed successfully');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

setup();
