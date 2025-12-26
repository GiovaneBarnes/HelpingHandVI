-- Create indexes for search filters
CREATE INDEX idx_providers_island ON providers(island);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_last_updated_at ON providers(last_updated_at);
CREATE INDEX idx_provider_categories_category_id ON provider_categories(category_id);
CREATE INDEX idx_provider_areas_area_id ON provider_areas(area_id);
CREATE INDEX idx_activity_events_provider_id ON activity_events(provider_id);
CREATE INDEX idx_activity_events_created_at ON activity_events(created_at);