-- Add TODAY to availability_status enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'availability_status'
      AND e.enumlabel = 'TODAY'
  ) THEN
    ALTER TYPE availability_status ADD VALUE 'TODAY';
  END IF;
END $$;