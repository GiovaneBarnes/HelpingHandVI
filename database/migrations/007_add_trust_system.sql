-- Add lifecycle status enum and column
CREATE TYPE lifecycle_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

ALTER TABLE providers ADD COLUMN lifecycle_status lifecycle_status DEFAULT 'ACTIVE' NOT NULL;
ALTER TABLE providers ADD COLUMN archived_at TIMESTAMP NULL;

-- Update existing archived providers
UPDATE providers SET lifecycle_status = 'ARCHIVED', archived_at = CURRENT_TIMESTAMP WHERE archived = true;

-- Add status_last_updated_at to providers (since we don't have a separate provider_status table)
ALTER TABLE providers ADD COLUMN status_last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Update activity_events to use proper enum for event types
CREATE TYPE activity_event_type AS ENUM (
  'PROFILE_UPDATED',
  'STATUS_UPDATED',
  'ADMIN_VERIFIED',
  'ADMIN_ARCHIVED',
  'ADMIN_UNARCHIVED'
);

ALTER TABLE activity_events ADD COLUMN event_type activity_event_type;
-- Migrate existing data (assuming all existing events are profile updates)
UPDATE activity_events SET event_type = 'PROFILE_UPDATED' WHERE event_type IS NULL;
ALTER TABLE activity_events ALTER COLUMN event_type SET NOT NULL;
ALTER TABLE activity_events DROP COLUMN type;