-- Create tables
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    island VARCHAR(100) NOT NULL,
    profile JSONB,
    status availability_status DEFAULT 'NOT_TAKING_WORK',
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    island VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    UNIQUE(island, neighborhood),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE provider_categories (
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, category_id)
);

CREATE TABLE provider_areas (
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    area_id INTEGER REFERENCES areas(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, area_id)
);

CREATE TABLE provider_badges (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    badge verification_badge NOT NULL,
    assigned_by VARCHAR(255),
    notes TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);