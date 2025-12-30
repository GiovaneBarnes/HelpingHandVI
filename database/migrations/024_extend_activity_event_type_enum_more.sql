ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'PROFILE_VIEW';
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'PROFILE_UPDATE';
-- Optional: if code ever uses this variant
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'STATUS_UPDATE';
