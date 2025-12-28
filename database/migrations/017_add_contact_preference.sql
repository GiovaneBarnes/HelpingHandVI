-- Add contact preference enum and field
CREATE TYPE contact_preference AS ENUM ('PHONE', 'EMAIL', 'BOTH');

-- Add contact preference column to providers table
ALTER TABLE providers ADD COLUMN contact_preference contact_preference NOT NULL DEFAULT 'BOTH';