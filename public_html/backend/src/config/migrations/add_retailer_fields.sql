-- Add retailer-specific fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'active', 'inactive') DEFAULT 'pending' AFTER role;