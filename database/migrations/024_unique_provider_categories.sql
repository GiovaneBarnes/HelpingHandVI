CREATE UNIQUE INDEX IF NOT EXISTS ux_provider_categories
ON provider_categories(provider_id, category_id);