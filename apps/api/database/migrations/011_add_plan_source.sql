-- Add plan_source enum for trial system
CREATE TYPE plan_source AS ENUM ('FREE', 'TRIAL', 'PAID');

-- Add plan_source column to providers table
ALTER TABLE providers ADD COLUMN plan_source plan_source DEFAULT 'FREE';

-- Update existing providers to have appropriate plan_source based on their plan
UPDATE providers SET plan_source = 'PAID' WHERE plan = 'PREMIUM';
UPDATE providers SET plan_source = 'TRIAL' WHERE plan = 'PREMIUM' AND trial_end_at IS NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_providers_plan_source ON providers(plan_source);
CREATE INDEX idx_providers_trial_end_at ON providers(trial_end_at) WHERE trial_end_at IS NOT NULL;