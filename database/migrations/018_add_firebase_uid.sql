-- Add Firebase UID to link Firebase Auth users to providers
ALTER TABLE providers ADD COLUMN firebase_uid VARCHAR(255) UNIQUE;