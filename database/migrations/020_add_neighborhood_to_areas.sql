-- Add neighborhood column to areas table if it doesn't exist
ALTER TABLE areas
ADD COLUMN IF NOT EXISTS neighborhood TEXT;