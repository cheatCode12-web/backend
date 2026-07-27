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

SET @add_status = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE users ADD COLUMN status ENUM('active','inactive','pending') NOT NULL DEFAULT 'active'",
    "SELECT 'users.status already exists'"
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'status'
);
PREPARE stmt FROM @add_status;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_refresh_token = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE users ADD COLUMN refresh_token VARCHAR(512) NULL",
    "SELECT 'users.refresh_token already exists'"
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'refresh_token'
);
PREPARE stmt FROM @add_refresh_token;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_last_token_refresh = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE users ADD COLUMN last_token_refresh TIMESTAMP NULL",
    "SELECT 'users.last_token_refresh already exists'"
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'last_token_refresh'
);
PREPARE stmt FROM @add_last_token_refresh;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_company = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE users ADD COLUMN company VARCHAR(255) NULL",
    "SELECT 'users.company already exists'"
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'company'
);
PREPARE stmt FROM @add_company;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_phone = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL",
    "SELECT 'users.phone already exists'"
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'phone'
);
PREPARE stmt FROM @add_phone;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_address = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE users ADD COLUMN address TEXT NULL",
    "SELECT 'users.address already exists'"
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'address'
);
PREPARE stmt FROM @add_address;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_description = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE users ADD COLUMN description TEXT NULL",
    "SELECT 'users.description already exists'"
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'description'
);
PREPARE stmt FROM @add_description;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
