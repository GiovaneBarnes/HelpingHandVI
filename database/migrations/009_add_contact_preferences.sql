-- Add contact method enum
CREATE TYPE contact_method AS ENUM ('CALL', 'WHATSAPP', 'SMS');

-- Add new columns to providers table
ALTER TABLE providers ADD COLUMN contact_call_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE providers ADD COLUMN contact_whatsapp_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE providers ADD COLUMN contact_sms_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE providers ADD COLUMN preferred_contact_method contact_method NULL;
ALTER TABLE providers ADD COLUMN typical_hours TEXT NULL;
ALTER TABLE providers ADD COLUMN emergency_calls_accepted BOOLEAN NOT NULL DEFAULT false;

-- Update areas table to use name instead of neighborhood and proper island codes
ALTER TABLE areas RENAME COLUMN neighborhood TO name;
UPDATE areas SET island = 'STT' WHERE island = 'St. Thomas';
UPDATE areas SET island = 'STJ' WHERE island = 'St. John';
UPDATE areas SET island = 'STX' WHERE island = 'St. Croix';
UPDATE areas SET island = 'STT' WHERE island = 'Water Island'; -- Water Island belongs to STT

-- Update providers table to use canonical island codes
UPDATE providers SET island = 'STT' WHERE island = 'St. Thomas';
UPDATE providers SET island = 'STJ' WHERE island = 'St. John';
UPDATE providers SET island = 'STX' WHERE island = 'St. Croix';

-- Add indexes for search performance
CREATE INDEX idx_areas_island_name ON areas(island, name);
CREATE INDEX idx_provider_areas_area_id_provider_id ON provider_areas(area_id, provider_id);