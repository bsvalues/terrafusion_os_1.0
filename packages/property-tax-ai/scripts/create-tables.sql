-- Create tables for all schema entities
-- This script ensures all database tables exist

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  email TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  parcel_number TEXT NOT NULL,
  property_type TEXT NOT NULL,
  acres NUMERIC NOT NULL,
  value NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Land Records table
CREATE TABLE IF NOT EXISTS land_records (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  land_use_code TEXT NOT NULL,
  zoning TEXT NOT NULL,
  topography TEXT,
  frontage NUMERIC,
  depth NUMERIC,
  shape TEXT,
  utilities TEXT,
  flood_zone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Improvements table
CREATE TABLE IF NOT EXISTS improvements (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  improvement_type TEXT NOT NULL,
  year_built INTEGER,
  square_feet NUMERIC,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  quality TEXT,
  condition TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Fields table
CREATE TABLE IF NOT EXISTS fields (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  field_type TEXT NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Appeals table (renamed from protests for clarity)
CREATE TABLE IF NOT EXISTS appeals (
  id SERIAL PRIMARY KEY,
  appeal_number TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  appeal_type TEXT NOT NULL DEFAULT 'value',
  reason TEXT NOT NULL,
  evidence_urls TEXT[],
  requested_value NUMERIC,
  date_received TIMESTAMP NOT NULL DEFAULT NOW(),
  hearing_date TIMESTAMP,
  hearing_location TEXT,
  assigned_to INTEGER,
  status TEXT NOT NULL DEFAULT 'submitted',
  decision TEXT,
  decision_reason TEXT,
  decision_date TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Appeal comments table
CREATE TABLE IF NOT EXISTS appeal_comments (
  id SERIAL PRIMARY KEY,
  appeal_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  internal_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Appeal evidence items table
CREATE TABLE IF NOT EXISTS appeal_evidence (
  id SERIAL PRIMARY KEY,
  appeal_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT
);

-- AI Agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
  performance INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- System Activities table
CREATE TABLE IF NOT EXISTS system_activities (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER,
  activity TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PACS Modules table
CREATE TABLE IF NOT EXISTS pacs_modules (
  id SERIAL PRIMARY KEY,
  module_name TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  integration TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);