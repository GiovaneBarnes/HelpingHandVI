-- Keep newest pending request per provider+field
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY provider_id, field
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM change_requests
  WHERE status='pending'
)
DELETE FROM change_requests
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Enforce one pending request per provider+field
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_change_request
ON change_requests (provider_id, field)
WHERE status = 'pending';
