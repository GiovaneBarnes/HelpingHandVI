-- Add status column to reports table
ALTER TABLE reports ADD COLUMN status report_status DEFAULT 'NEW';
ALTER TABLE reports ADD COLUMN admin_notes TEXT;
ALTER TABLE reports ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create report_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing reports to have NEW status
UPDATE reports SET status = 'NEW' WHERE status IS NULL;