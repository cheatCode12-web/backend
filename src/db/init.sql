-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS bailord_dev;
USE bailord_dev;

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
);

-- Token blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);

-- Insert a default admin user (password: admin123)
INSERT INTO users (name, email, password, role, status)
VALUES (
  'Admin User',
  'admin@bailord.com',
  '$2a$10$3QX3ZX3nJ3bJ3J3bJ3bJ3O3QX3ZX3nJ3bJ3J3bJ3J3bJ3J3bJ3bJ3',
  'admin',
  'active'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role),
  status = VALUES(status);