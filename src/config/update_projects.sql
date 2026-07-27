-- Add missing columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS user_id INT AFTER description,
ADD COLUMN IF NOT EXISTS start_date DATE AFTER user_id,
ADD COLUMN IF NOT EXISTS end_date DATE AFTER start_date,
ADD FOREIGN KEY (user_id) REFERENCES users(id);