CREATE TABLE IF NOT EXISTS logos (
    id SERIAL PRIMARY KEY,
    logo VARCHAR(255),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    website_link VARCHAR(255),
    duration VARCHAR(255),
    quote TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
