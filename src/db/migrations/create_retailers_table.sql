-- Create retailers table
CREATE TABLE IF NOT EXISTS retailers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
  average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_retailer_email ON retailers(email);
CREATE INDEX idx_retailer_city ON retailers(city);
CREATE INDEX idx_retailer_business_type ON retailers(business_type);
CREATE INDEX idx_retailer_status ON retailers(status);