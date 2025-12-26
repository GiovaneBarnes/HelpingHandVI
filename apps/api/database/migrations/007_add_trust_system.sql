-- Add trust system schema
-- Add lifecycle_status enum
CREATE TYPE lifecycle_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- Add activity_event_type enum
CREATE TYPE activity_event_type AS ENUM (
  'PROFILE_UPDATED',
  'STATUS_UPDATED',
  'VERIFIED',
  'ARCHIVED'
);

-- Add lifecycle_status column to providers
ALTER TABLE providers ADD COLUMN lifecycle_status lifecycle_status DEFAULT 'ACTIVE';

-- Add status_last_updated_at for tracking lifecycle changes
ALTER TABLE providers ADD COLUMN status_last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create activity_events table
CREATE TABLE activity_events (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  event_type activity_event_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set default lifecycle status for existing providers
UPDATE providers SET lifecycle_status = 'ACTIVE' WHERE lifecycle_status IS NULL;