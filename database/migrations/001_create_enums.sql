-- Create custom types
CREATE TYPE availability_status AS ENUM ('TODAY', 'NEXT_3_DAYS', 'THIS_WEEK', 'NEXT_WEEK', 'UNAVAILABLE');
CREATE TYPE verification_badge AS ENUM ('VERIFIED', 'EMERGENCY_READY', 'GOV_APPROVED');