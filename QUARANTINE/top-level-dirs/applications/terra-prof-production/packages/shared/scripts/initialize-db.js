/**
 * TerraFusionPro Database Initialization Script
 * 
 * This script initializes the database schema for the TerraFusionPro platform.
 * It uses pg directly to create tables and enums according to the defined schema.
 */

import pg from 'pg';

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('Database connection string not found in environment variables');
}

// Create a connection pool
const pool = new pg.Pool({ connectionString });

// SQL to create ENUM types
const createEnumTypesSql = `
  -- Create ENUM types if they don't exist
  DO $$
  BEGIN
    -- user_role
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      CREATE TYPE user_role AS ENUM ('admin', 'appraiser', 'reviewer', 'client', 'field_agent');
    END IF;
    
    -- property_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
      CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'industrial', 'land', 'mixed_use');
    END IF;
    
    -- report_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
      CREATE TYPE report_status AS ENUM ('draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived');
    END IF;
    
    -- form_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_type') THEN
      CREATE TYPE form_type AS ENUM ('property_details', 'site_inspection', 'valuation', 'comparable', 'environmental');
    END IF;
    
    -- image_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'image_type') THEN
      CREATE TYPE image_type AS ENUM ('exterior', 'interior', 'aerial', 'site', 'floor_plan', 'other');
    END IF;
  END
  $$;
`;

// SQL to create tables
const createTablesSql = `
  -- Create users table
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'appraiser',
    company VARCHAR(255),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- Create properties table
  CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    county VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    property_type property_type NOT NULL,
    year_built INTEGER,
    bedrooms DECIMAL(4, 1),
    bathrooms DECIMAL(4, 1),
    building_size DECIMAL(12, 2),
    lot_size DECIMAL(12, 2),
    lot_unit VARCHAR(10) DEFAULT 'sqft',
    parking_spaces INTEGER,
    parking_type VARCHAR(50),
    tax_assessed_value DECIMAL(12, 2),
    tax_year INTEGER,
    zoned_as VARCHAR(50),
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- Create property_images table
  CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id),
    url TEXT NOT NULL,
    caption VARCHAR(255),
    type image_type NOT NULL DEFAULT 'exterior',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- Create appraisal_reports table
  CREATE TABLE IF NOT EXISTS appraisal_reports (
    id SERIAL PRIMARY KEY,
    report_number VARCHAR(50) NOT NULL UNIQUE,
    property_id INTEGER NOT NULL REFERENCES properties(id),
    client_id INTEGER REFERENCES users(id),
    appraiser_id INTEGER NOT NULL REFERENCES users(id),
    reviewer_id INTEGER REFERENCES users(id),
    status report_status NOT NULL DEFAULT 'draft',
    effective_date DATE NOT NULL,
    inspection_date DATE,
    purpose VARCHAR(255) NOT NULL,
    approaches_used TEXT,
    estimated_value DECIMAL(12, 2),
    final_value DECIMAL(12, 2),
    confidence_score DECIMAL(3, 2),
    valuation_method VARCHAR(100),
    comments TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    finalized_at TIMESTAMP
  );

  -- Create comparables table
  CREATE TABLE IF NOT EXISTS comparables (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES appraisal_reports(id),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    property_type property_type NOT NULL,
    year_built INTEGER,
    bedrooms DECIMAL(4, 1),
    bathrooms DECIMAL(4, 1),
    building_size DECIMAL(12, 2),
    lot_size DECIMAL(12, 2),
    sale_price DECIMAL(12, 2) NOT NULL,
    sale_date DATE NOT NULL,
    days_on_market INTEGER,
    distance_in_miles DECIMAL(5, 2),
    similarity_score DECIMAL(3, 2),
    adjusted_price DECIMAL(12, 2),
    adjustments TEXT,
    description TEXT,
    image_url TEXT,
    added_by INTEGER REFERENCES users(id),
    added_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- Create forms table
  CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type form_type NOT NULL,
    schema TEXT NOT NULL,
    ui_schema TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    property_types TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- Create form_submissions table
  CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id),
    report_id INTEGER NOT NULL REFERENCES appraisal_reports(id),
    data TEXT NOT NULL,
    submitted_by INTEGER NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completion_status DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    validation_status BOOLEAN NOT NULL DEFAULT TRUE,
    validation_errors TEXT
  );

  -- Create market_data table
  CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    property_type property_type NOT NULL,
    period VARCHAR(20) NOT NULL,
    median_price DECIMAL(12, 2),
    average_price DECIMAL(12, 2),
    inventory_count INTEGER,
    days_on_market INTEGER,
    months_of_supply DECIMAL(4, 1),
    sold_count INTEGER,
    listed_count INTEGER,
    price_per_sqft DECIMAL(8, 2),
    year_over_year_change DECIMAL(5, 2),
    quarter_over_quarter_change DECIMAL(5, 2),
    update_date TIMESTAMP NOT NULL DEFAULT NOW(),
    data_source VARCHAR(100),
    UNIQUE(location, property_type, period)
  );
`;

// SQL to insert initial data
const initialDataSql = `
  -- Create admin user if it doesn't exist
  INSERT INTO users (
    email, password, first_name, last_name, role, company, active, created_at, updated_at
  )
  VALUES (
    'admin@terrafusionpro.com', 
    '$2a$10$JVbvwsXLtdC/jfbcDWUJy.J6aE22hF.MKAGMOgYTLCkyrhCNsz2sC', -- hashed 'admin123'
    'Admin', 
    'User', 
    'admin', 
    'TerraFusionPro', 
    TRUE, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;

  -- Create demo appraiser user if it doesn't exist
  INSERT INTO users (
    email, password, first_name, last_name, role, company, active, created_at, updated_at
  )
  VALUES (
    'appraiser@terrafusionpro.com', 
    '$2a$10$JVbvwsXLtdC/jfbcDWUJy.J6aE22hF.MKAGMOgYTLCkyrhCNsz2sC', -- hashed 'admin123'
    'Demo', 
    'Appraiser', 
    'appraiser', 
    'Appraisal Experts', 
    TRUE, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;

  -- Create demo client user if it doesn't exist
  INSERT INTO users (
    email, password, first_name, last_name, role, company, active, created_at, updated_at
  )
  VALUES (
    'client@terrafusionpro.com', 
    '$2a$10$JVbvwsXLtdC/jfbcDWUJy.J6aE22hF.MKAGMOgYTLCkyrhCNsz2sC', -- hashed 'admin123'
    'Demo', 
    'Client', 
    'client', 
    'ABC Mortgage', 
    TRUE, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;

  -- Insert sample property if none exist
  INSERT INTO properties (
    address, city, state, zip_code, property_type, year_built, bedrooms, bathrooms,
    building_size, lot_size, created_at, updated_at
  )
  SELECT 
    '123 Main St', 'Springfield', 'CA', '90001', 'residential', 2005, 4, 2,
    '2500', '7500', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM properties LIMIT 1);
`;

// Function to initialize the database
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database initialization...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Create enum types
    console.log('Creating ENUM types...');
    await client.query(createEnumTypesSql);
    
    // Create tables
    console.log('Creating tables...');
    await client.query(createTablesSql);
    
    // Insert initial data
    console.log('Inserting initial data...');
    await client.query(initialDataSql);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('Database initialization script completed.');
    pool.end();
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    pool.end();
    process.exit(1);
  });

export default initializeDatabase;