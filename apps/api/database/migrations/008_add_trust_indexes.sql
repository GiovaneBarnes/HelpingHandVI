-- Add indexes for trust system performance
CREATE INDEX idx_activity_events_provider_created ON activity_events(provider_id, created_at DESC);
CREATE INDEX idx_providers_lifecycle_status ON providers(lifecycle_status);
CREATE INDEX idx_providers_plan ON providers(plan);
CREATE INDEX idx_providers_status_last_updated ON providers(status_last_updated_at DESC);