-- Seed sample providers
INSERT INTO providers (name, phone, whatsapp, island, profile, status) VALUES
('John Electric', '340-123-4567', '340-123-4567', 'St. Thomas', '{"experience": "10 years", "certified": true}', 'TODAY'),
('Mary Plumbing', '340-234-5678', '340-234-5678', 'St. John', '{"specialties": ["residential", "commercial"]}', 'NEXT_3_DAYS'),
('Bob AC Services', '340-345-6789', NULL, 'St. Croix', '{"emergency_service": true}', 'THIS_WEEK');

-- Assign categories to providers
INSERT INTO provider_categories (provider_id, category_id) VALUES
(1, 1), -- John Electric -> Electrician
(2, 2), -- Mary Plumbing -> Plumber
(3, 3); -- Bob AC -> AC Technician

-- Assign areas to providers
INSERT INTO provider_areas (provider_id, area_id) VALUES
(1, 1), (1, 2), -- John covers Charlotte Amalie and East End St. Thomas
(2, 4), (2, 5), -- Mary covers Cruz Bay and Coral Bay St. John
(3, 7), (3, 8); -- Bob covers Christiansted and Frederiksted St. Croix

-- Assign badges
INSERT INTO provider_badges (provider_id, badge, assigned_by, notes) VALUES
(1, 'VERIFIED', 'admin', 'Verified through documentation'),
(2, 'EMERGENCY_READY', 'admin', 'Available for emergencies'),
(3, 'GOV_APPROVED', 'government', 'Approved by local authorities');

-- Sample activity events
INSERT INTO activity_events (type, provider_id) VALUES
('profile_updated', 1),
('service_completed', 2),
('badge_assigned', 3);