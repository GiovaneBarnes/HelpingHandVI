-- Migration 016: Add change request audit actions
-- Extend admin_action_type enum to include change request actions

ALTER TYPE admin_action_type ADD VALUE 'NAME_CHANGED';
ALTER TYPE admin_action_type ADD VALUE 'ISLAND_CHANGED';
ALTER TYPE admin_action_type ADD VALUE 'CHANGE_REQUEST_REJECTED';