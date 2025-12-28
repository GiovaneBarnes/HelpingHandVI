-- Fix activity_events table to use event_type column instead of type
-- This migration updates the existing table structure to match the code expectations

-- First, add the event_type column
ALTER TABLE activity_events ADD COLUMN event_type activity_event_type;

-- Migrate existing data from type to event_type (map old values to new enum values)
UPDATE activity_events SET event_type =
  CASE
    WHEN type = 'PROFILE_UPDATED' THEN 'PROFILE_UPDATED'::activity_event_type
    WHEN type = 'STATUS_UPDATED' THEN 'STATUS_UPDATED'::activity_event_type
    WHEN type = 'VERIFIED' THEN 'VERIFIED'::activity_event_type
    WHEN type = 'ARCHIVED' THEN 'ARCHIVED'::activity_event_type
    ELSE 'PROFILE_UPDATED'::activity_event_type  -- Default fallback
  END;

-- Make event_type NOT NULL
ALTER TABLE activity_events ALTER COLUMN event_type SET NOT NULL;

-- Drop the old type column
ALTER TABLE activity_events DROP COLUMN type;

-- Add provider_id NOT NULL constraint if it doesn't exist
ALTER TABLE activity_events ALTER COLUMN provider_id SET NOT NULL;