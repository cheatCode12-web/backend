-- Add progress column to projects table if it doesn't exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0 AFTER end_date;