-- Migration 027: Add admin status to providers
-- Allows marking providers as admins for database-based admin checking

ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_providers_is_admin ON providers(is_admin) WHERE is_admin = true;