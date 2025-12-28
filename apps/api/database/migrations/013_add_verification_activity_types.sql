-- Add new activity event types for behavior-based verification
ALTER TYPE activity_event_type ADD VALUE 'PROFILE_VIEW';
ALTER TYPE activity_event_type ADD VALUE 'LOGIN';
ALTER TYPE activity_event_type ADD VALUE 'CUSTOMER_CALL';
ALTER TYPE activity_event_type ADD VALUE 'CUSTOMER_SMS';
ALTER TYPE activity_event_type ADD VALUE 'CUSTOMER_WHATSAPP';
ALTER TYPE activity_event_type ADD VALUE 'STATUS_OPEN_FOR_WORK';