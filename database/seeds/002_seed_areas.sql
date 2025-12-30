-- Seed initial areas (islands and neighborhoods)
INSERT INTO areas (island, name) VALUES
-- St. Thomas (STT)
('STT', 'Charlotte Amalie'),
('STT', 'East End'),
('STT', 'West End'),
('STT', 'North Shore'),

-- St. John (STJ)
('STJ', 'Cruz Bay'),
('STJ', 'Coral Bay'),
('STJ', 'East End'),

-- St. Croix (STX)
('STX', 'Christiansted'),
('STX', 'Frederiksted'),
('STX', 'East End')
ON CONFLICT (island, name) DO NOTHING;