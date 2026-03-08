-- TerraFusion OS 1.0 — Database initialization
-- This script runs automatically when the postgres container starts for the first time.
-- EF Core migrations handle schema creation; this file ensures the database exists
-- and applies any extensions needed before migrations run.

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
