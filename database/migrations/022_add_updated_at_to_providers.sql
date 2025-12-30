ALTER TABLE providers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Backfill so existing rows aren't null
UPDATE providers
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Optional: make it NOT NULL if you want strictness
-- ALTER TABLE providers ALTER COLUMN updated_at SET NOT NULL;
