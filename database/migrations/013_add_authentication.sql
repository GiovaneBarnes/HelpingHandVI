-- Add authentication fields to providers table
ALTER TABLE providers ADD COLUMN email VARCHAR(255) UNIQUE;
ALTER TABLE providers ADD COLUMN password_hash VARCHAR(255);

-- Add password reset fields
ALTER TABLE providers ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE providers ADD COLUMN reset_token_expires TIMESTAMP;

-- Add index for email lookups
CREATE INDEX idx_providers_email ON providers(email);

-- Add constraint to ensure email is valid format (basic check)
ALTER TABLE providers ADD CONSTRAINT providers_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');