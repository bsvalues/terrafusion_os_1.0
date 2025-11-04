-- Initial database schema for TerraFusionPro

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'appraiser', 'reviewer', 'client', 'field_agent');

-- Property type enum
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'industrial', 'land', 'mixed_use');

-- Report status enum
CREATE TYPE report_status AS ENUM ('draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived');

-- Form type enum
CREATE TYPE form_type AS ENUM ('property_details', 'site_inspection', 'valuation', 'comparable', 'environmental');

-- Property image type enum
CREATE TYPE image_type AS ENUM ('exterior', 'interior', 'aerial', 'site', 'floor_plan', 'other');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'appraiser',
    company VARCHAR(255),
    phone VARCHAR(50),
    avatar VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    county VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'USA',
    latitude VARCHAR(50),
    longitude VARCHAR(50),
    property_type property_type NOT NULL,
    year_built INTEGER,
    lot_size VARCHAR(50),
    building_size VARCHAR(50),
    bedrooms INTEGER,
    bathrooms INTEGER,
    description TEXT,
    features JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Property Images table
CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    image_type image_type NOT NULL,
    caption VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Appraisal Reports table
CREATE TABLE IF NOT EXISTS appraisal_reports (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_number VARCHAR(100) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    appraisal_date TIMESTAMP NOT NULL,
    effective_date TIMESTAMP NOT NULL,
    status report_status NOT NULL DEFAULT 'draft',
    valuation INTEGER,
    value_per_sqft INTEGER,
    methodology VARCHAR(100),
    conclusions TEXT,
    appraiser INTEGER REFERENCES users(id),
    reviewer INTEGER REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Comparables table
CREATE TABLE IF NOT EXISTS comparables (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES appraisal_reports(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id),
    external_property_id VARCHAR(100),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    sale_price INTEGER,
    sale_date TIMESTAMP,
    property_type property_type NOT NULL,
    year_built INTEGER,
    lot_size VARCHAR(50),
    building_size VARCHAR(50),
    bedrooms INTEGER,
    bathrooms INTEGER,
    adjustments JSONB,
    adjusted_price INTEGER,
    description TEXT,
    similarity_score VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    form_name VARCHAR(255) NOT NULL,
    form_type form_type NOT NULL,
    schema JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Form Submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id),
    report_id INTEGER REFERENCES appraisal_reports(id),
    data JSONB NOT NULL,
    submitted_by INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_properties_address ON properties(address);
CREATE INDEX idx_properties_city_state ON properties(city, state);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_appraisal_reports_property_id ON appraisal_reports(property_id);
CREATE INDEX idx_appraisal_reports_status ON appraisal_reports(status);
CREATE INDEX idx_appraisal_reports_appraiser ON appraisal_reports(appraiser);
CREATE INDEX idx_comparables_report_id ON comparables(report_id);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_property_id ON form_submissions(property_id);
CREATE INDEX idx_form_submissions_report_id ON form_submissions(report_id);

-- Create admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role, active)
VALUES ('admin@terrafusionpro.com', '$2a$10$ZOzS/lKy09TiIToHm3svFuY6TrQ3sC0aJwYoH8u2B5jZ3ZKR2g1dy', 'Admin', 'User', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;