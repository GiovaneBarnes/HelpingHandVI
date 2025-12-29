-- Seed sample providers (removed for production)
-- INSERT INTO providers (name, phone, whatsapp, island, profile, status) VALUES
-- ('John Electric', '340-123-4567', '340-123-4567', 'STT', '{"experience": "10 years", "certified": true}', 'OPEN_NOW'),
-- ('Mary Plumbing', '340-234-5678', '340-234-5678', 'STJ', '{"specialties": ["residential", "commercial"]}', 'BUSY_LIMITED'),
-- ('Bob AC Services', '340-345-6789', NULL, 'STX', '{"emergency_service": true}', 'NOT_TAKING_WORK');

-- Assign categories to providers (removed for production)
-- INSERT INTO provider_categories (provider_id, category_id) VALUES
-- (1, 1), -- John Electric -> Electrician
-- (2, 2), -- Mary Plumbing -> Plumber
-- (3, 3); -- Bob AC -> AC Technician

-- Assign areas to providers (removed for production)
-- INSERT INTO provider_areas (provider_id, area_id) VALUES
-- (1, 1), (1, 2), -- John covers Charlotte Amalie and East End St. Thomas
-- (2, 5), (2, 6), -- Mary covers Cruz Bay and Coral Bay St. John
-- (3, 8), (3, 9); -- Bob covers Christiansted and Frederiksted St. Croix

-- Assign badges (removed for production)
-- INSERT INTO provider_badges (provider_id, badge, assigned_by, notes) VALUES
-- (1, 'VERIFIED', 'admin', 'Verified through documentation'),
-- (2, 'EMERGENCY_READY', 'admin', 'Available for emergencies'),
-- (3, 'GOV_APPROVED', 'government', 'Approved by local authorities');

-- Sample activity events (removed for production)
-- INSERT INTO activity_events (type, provider_id) VALUES
-- ('profile_updated', 1),
-- ('service_completed', 2),
-- ('badge_assigned', 3);