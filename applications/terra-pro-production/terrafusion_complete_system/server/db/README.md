# Database Migration System

This directory contains the database migration system for TerraFusionPlatform. It provides a structured way to manage schema changes, track versions, and ensure database schema compatibility with application code.

## Overview

The migration system consists of the following components:

1. **Migration Files**: SQL files in the `migrations/` directory that define schema changes.
2. **Migration Runner**: A script that applies migrations in order (`migrate.ts`).
3. **Schema Validation**: A utility that checks if the database schema matches the application models (`schema-check.ts`).
4. **Startup Checks**: Verification during application startup to ensure database compatibility (`startup-check.ts`).
5. **Migration Generator**: A utility to create new migration files (`create-migration.ts`).

## Usage

### Running Migrations

To apply all pending migrations:

```bash
npx tsx server/db/migrate.ts
```

### Checking Schema Compatibility

To validate the database schema against application models:

```bash
npx tsx server/db/schema-check.ts
```

### Creating New Migrations

To create a new migration file:

```bash
npx tsx server/db/create-migration.ts "Description of the migration"
```

This will generate a timestamped SQL file in the `migrations/` directory.

### Schema Version Tracking

Each migration updates the `schema_version` table with a new version number. The application can check this version to ensure compatibility.

## Best Practices

1. **Never modify existing migrations** that have been applied to production or shared databases.
2. **Keep migrations atomic** - each migration should focus on a specific change.
3. **Always test migrations** on a development database before applying to production.
4. **Include both "up" and "down" logic** where possible, to allow rollbacks.
5. **Use conditional statements** to check if changes are needed before applying them.

## Common Tasks

### Changing a Column Name

```sql
-- Check if column exists with old name and not with new name
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'my_table'
        AND column_name = 'old_name'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'my_table'
        AND column_name = 'new_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE my_table RENAME COLUMN old_name TO new_name;
    END IF;
END $$;
```

### Adding a New Table

```sql
CREATE TABLE IF NOT EXISTS new_table (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Adding a New Column

```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'my_table'
        AND column_name = 'new_column'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE my_table ADD COLUMN new_column TEXT;
    END IF;
END $$;
```
