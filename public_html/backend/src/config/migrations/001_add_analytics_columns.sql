-- Add analytics columns to retailers table
ALTER TABLE retailers
ADD COLUMN total_orders INT DEFAULT 0,
ADD COLUMN total_sales DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN business_type VARCHAR(50);

-- Add index for analytics queries
CREATE INDEX idx_retailers_status ON retailers(status);
CREATE INDEX idx_retailers_joined_date ON retailers(joined_date);
CREATE INDEX idx_retailers_business_type ON retailers(business_type);

-- Add index for project analytics
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_start_date ON projects(start_date);