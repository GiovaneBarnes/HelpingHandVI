-- Add plan_source enum and column
CREATE TYPE plan_source AS ENUM ('FREE', 'TRIAL', 'PAID');

-- Add plan_source column to providers
ALTER TABLE providers ADD COLUMN plan_source plan_source NOT NULL DEFAULT 'FREE';

-- Update existing providers to have correct plan_source
UPDATE providers SET plan_source = 'TRIAL' WHERE plan = 'PREMIUM' AND trial_end_at IS NOT NULL;
UPDATE providers SET plan_source = 'FREE' WHERE plan = 'FREE';

-- Add indexes for plan and trial queries
CREATE INDEX idx_providers_plan ON providers(plan);
CREATE INDEX idx_providers_trial_end_at ON providers(trial_end_at);
CREATE INDEX idx_providers_created_at ON providers(created_at);