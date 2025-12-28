-- Create custom types
CREATE TYPE availability_status AS ENUM ('OPEN_NOW', 'BUSY_LIMITED', 'NOT_TAKING_WORK');
CREATE TYPE verification_badge AS ENUM ('VERIFIED', 'EMERGENCY_READY', 'GOV_APPROVED');