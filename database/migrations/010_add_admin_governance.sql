-- Migration 010: Add admin governance features
-- Admin audit log, disputed providers, enhanced reports, and emergency mode

-- Create enums for audit log and reports
CREATE TYPE admin_action_type AS ENUM (
  'VERIFY',
  'ARCHIVE',
  'UNARCHIVE',
  'MARK_DISPUTED',
  'UNMARK_DISPUTED',
  'REPORT_STATUS_CHANGED',
  'EMERGENCY_MODE_TOGGLED'
);

CREATE TYPE report_type AS ENUM (
  'WRONG_NUMBER',
  'NOT_IN_BUSINESS',
  'UNSAFE_SCAM',
  'OTHER'
);

CREATE TYPE report_status AS ENUM (
  'NEW',
  'IN_REVIEW',
  'RESOLVED'
);

-- Admin audit log table
CREATE TABLE admin_audit_log (
  id SERIAL PRIMARY KEY,
  action_type admin_action_type NOT NULL,
  admin_actor TEXT NOT NULL,
  provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
  report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add disputed fields to providers
ALTER TABLE providers ADD COLUMN is_disputed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE providers ADD COLUMN disputed_at TIMESTAMP NULL;

-- Enhance reports table
ALTER TABLE reports ADD COLUMN report_type report_type NOT NULL DEFAULT 'OTHER';
ALTER TABLE reports ADD COLUMN status report_status NOT NULL DEFAULT 'NEW';
ALTER TABLE reports ADD COLUMN admin_notes TEXT;
ALTER TABLE reports ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create app_settings table for feature flags
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_provider_id_created_at ON admin_audit_log(provider_id, created_at DESC);
CREATE INDEX idx_admin_audit_log_report_id_created_at ON admin_audit_log(report_id, created_at DESC);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_providers_is_disputed ON providers(is_disputed);

-- Seed emergency mode setting
INSERT INTO app_settings (key, value) VALUES ('emergency_mode', '{"enabled": false}');

-- Update trigger for reports updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at_trigger
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();