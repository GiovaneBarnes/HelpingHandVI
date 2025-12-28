-- Add unique constraint to provider_badges table for ON CONFLICT support
ALTER TABLE provider_badges ADD CONSTRAINT provider_badges_provider_badge_unique UNIQUE (provider_id, badge);