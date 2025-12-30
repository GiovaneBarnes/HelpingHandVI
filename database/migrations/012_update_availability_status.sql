-- Update availability status enum (idempotent)
DO $$
BEGIN
  -- Check if we need to update the enum
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'availability_status'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'availability_status'
    AND e.enumlabel IN ('OPEN_NOW', 'BUSY_LIMITED', 'NOT_TAKING_WORK')
    HAVING COUNT(*) = 3
  ) THEN
    -- Drop default first
    ALTER TABLE providers ALTER COLUMN status DROP DEFAULT;

    -- Create new enum
    CREATE TYPE availability_status_new AS ENUM ('OPEN_NOW', 'BUSY_LIMITED', 'NOT_TAKING_WORK');

    -- Update the column to use new enum, mapping old values
    ALTER TABLE providers ALTER COLUMN status TYPE availability_status_new USING (
      CASE status
        WHEN 'TODAY' THEN 'OPEN_NOW'::availability_status_new
        WHEN 'NEXT_3_DAYS' THEN 'BUSY_LIMITED'::availability_status_new
        WHEN 'THIS_WEEK' THEN 'BUSY_LIMITED'::availability_status_new
        WHEN 'NEXT_WEEK' THEN 'NOT_TAKING_WORK'::availability_status_new
        WHEN 'UNAVAILABLE' THEN 'NOT_TAKING_WORK'::availability_status_new
        ELSE 'NOT_TAKING_WORK'::availability_status_new
      END
    );

    -- Set new default
    ALTER TABLE providers ALTER COLUMN status SET DEFAULT 'NOT_TAKING_WORK';

    -- Drop old enum and rename new one
    DROP TYPE availability_status;
    ALTER TYPE availability_status_new RENAME TO availability_status;
  END IF;
END $$;