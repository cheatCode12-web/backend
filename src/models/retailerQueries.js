module.exports.CREATE_RETAILERS_TABLE = `
  CREATE TABLE IF NOT EXISTS retailers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nigeria',
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    account_name VARCHAR(255),
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_email ON retailers (email);
  CREATE INDEX IF NOT EXISTS idx_city ON retailers (city);
  CREATE INDEX IF NOT EXISTS idx_business_type ON retailers (business_type);
  CREATE INDEX IF NOT EXISTS idx_status ON retailers (status);
`;

module.exports.INSERT_RETAILER = `
  INSERT INTO retailers (
    name, email, phone, street_address, city, state, zip_code, country,
    business_name, business_type, registration_number, bank_name, account_number, account_name
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
`;

module.exports.GET_RETAILERS = `
  SELECT * FROM retailers
  WHERE
    CASE WHEN $1 IS NOT NULL THEN business_type = $2 ELSE true END
    AND CASE WHEN $3 IS NOT NULL THEN status = $4 ELSE true END
    AND CASE WHEN $5 IS NOT NULL THEN city = $6 ELSE true END
    AND CASE WHEN $7 IS NOT NULL THEN (
      name ILIKE $8 OR
      email ILIKE $9 OR
      business_name ILIKE $10
    ) ELSE true END
  ORDER BY created_at DESC
  LIMIT $11 OFFSET $12;
`;

module.exports.COUNT_RETAILERS = `
  SELECT COUNT(*) as total FROM retailers
  WHERE
    CASE WHEN $1 IS NOT NULL THEN business_type = $2 ELSE true END
    AND CASE WHEN $3 IS NOT NULL THEN status = $4 ELSE true END
    AND CASE WHEN $5 IS NOT NULL THEN city = $6 ELSE true END
    AND CASE WHEN $7 IS NOT NULL THEN (
      name ILIKE $8 OR
      email ILIKE $9 OR
      business_name ILIKE $10
    ) ELSE true END;
`;

module.exports.GET_RETAILER = `
  SELECT * FROM retailers WHERE id = $1;
`;

module.exports.UPDATE_RETAILER = `
  UPDATE retailers
  SET
    name = $1,
    phone = $2,
    street_address = $3,
    city = $4,
    state = $5,
    zip_code = $6,
    country = $7,
    business_name = $8,
    business_type = $9,
    registration_number = $10,
    bank_name = $11,
    account_number = $12,
    account_name = $13,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $14
  RETURNING *;
`;

module.exports.UPDATE_RETAILER_METRICS = `
  UPDATE retailers
  SET
    total_sales = $1,
    total_orders = $2,
    average_rating = $3,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $4
  RETURNING *;
`;

module.exports.DELETE_RETAILER = `
  DELETE FROM retailers WHERE id = $1;
`;
