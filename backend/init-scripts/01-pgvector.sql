-- TerraFusion OS: pgvector extension initialization
-- Runs automatically when the container starts for the first time via docker-entrypoint-initdb.d
-- Required before EF Core migrations that reference the vector column type.
CREATE EXTENSION IF NOT EXISTS vector;
