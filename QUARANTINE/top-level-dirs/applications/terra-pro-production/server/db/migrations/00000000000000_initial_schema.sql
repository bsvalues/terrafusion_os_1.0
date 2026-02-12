-- Initial Schema Migration
-- This script sets up the initial database schema

-- Create schema_version table to track migrations
CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(255)
);

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES ('00000000000000', 'Initial schema setup');