-- Migration 015: Add change requests system
-- Allows providers to request changes to their name or island, which admins can approve/reject

CREATE TYPE change_request_field AS ENUM ('name', 'island');
CREATE TYPE change_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE change_requests (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    field change_request_field NOT NULL,
    current_value TEXT NOT NULL,
    requested_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    status change_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by TEXT NULL,
    admin_notes TEXT NULL
);

-- Index for efficient querying by status and provider
CREATE INDEX idx_change_requests_status ON change_requests(status);
CREATE INDEX idx_change_requests_provider ON change_requests(provider_id);

-- Index for admin dashboard queries
CREATE INDEX idx_change_requests_created_at ON change_requests(created_at DESC);