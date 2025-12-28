-- Add missing tables for provider badges system
-- This migration adds the components needed for the gov-approve functionality

-- Create provider_badges table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS provider_badges (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    badge verification_badge NOT NULL,
    assigned_by VARCHAR(255),
    notes TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_provider_badges_provider_id ON provider_badges(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_badges_badge ON provider_badges(badge);