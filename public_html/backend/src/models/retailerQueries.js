module.exports.CREATE_RETAILERS_TABLE = `
  CREATE TABLE IF NOT EXISTS retailers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nigeria',
    business_name VARCHAR(255) NOT NULL,
    business_type ENUM('Grocery', 'Electronics', 'Fashion', 'Food & Beverage', 'Health & Beauty', 'Other') NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    account_name VARCHAR(255),
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_city (city),
    INDEX idx_business_type (business_type),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

module.exports.INSERT_RETAILER = `
  INSERT INTO retailers (
    id, name, email, phone, street_address, city, state, zip_code, country,
    business_name, business_type, registration_number, bank_name, account_number, account_name
  ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

module.exports.GET_RETAILERS = `
  SELECT * FROM retailers
  WHERE
    CASE WHEN ? IS NOT NULL THEN business_type = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN status = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN city = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN (
      name LIKE ? OR
      email LIKE ? OR
      business_name LIKE ?
    ) ELSE 1 END
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?;
`;

module.exports.COUNT_RETAILERS = `
  SELECT COUNT(*) as total FROM retailers
  WHERE
    CASE WHEN ? IS NOT NULL THEN business_type = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN status = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN city = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN (
      name LIKE ? OR
      email LIKE ? OR
      business_name LIKE ?
    ) ELSE 1 END;
`;

module.exports.GET_RETAILER = `
  SELECT * FROM retailers WHERE id = ?;
`;

module.exports.UPDATE_RETAILER = `
  UPDATE retailers
  SET
    name = ?,
    phone = ?,
    street_address = ?,
    city = ?,
    state = ?,
    zip_code = ?,
    country = ?,
    business_name = ?,
    business_type = ?,
    registration_number = ?,
    bank_name = ?,
    account_number = ?,
    account_name = ?
  WHERE id = ?;
`;

module.exports.UPDATE_RETAILER_METRICS = `
  UPDATE retailers
  SET
    total_sales = ?,
    total_orders = ?,
    average_rating = ?
  WHERE id = ?;
`;

module.exports.DELETE_RETAILER = `
  DELETE FROM retailers WHERE id = ?;
`;
