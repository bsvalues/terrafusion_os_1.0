# Supabase Migration Guide

This document outlines the process for setting up and configuring the Supabase infrastructure for the Benton County GIS Assessment Platform.

## Prerequisites

- Supabase account
- Supabase project created
- Supabase URL, public key (anon key), and service key

## Initial Setup

### Environment Variables

Configure the following environment variables in your application:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

Run the environment setup script to verify configuration:

```bash
python set_supabase_env.py
```

## Database Configuration

### Required Extensions

The following PostgreSQL extensions must be enabled in the Supabase Dashboard:

1. **PostGIS** - For spatial data handling
2. **uuid-ossp** - For UUID generation
3. **pg_stat_statements** - For query performance monitoring

#### Steps to Enable Extensions:

1. Log in to the Supabase Dashboard
2. Navigate to the SQL Editor
3. Execute the following SQL:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Database Schema and Functions

The database schema can be created using the provided SQL scripts:

1. Navigate to the SQL Editor in Supabase Dashboard
2. Open the file `docs/supabase_sql_scripts.md` from the project
3. Execute each SQL block in the file to create all required:
   - Custom functions
   - Database tables
   - Security policies

> **Important**: The SQL scripts must be executed in the correct order. Start with extensions, then functions, then tables, and finally security policies.

For a full list of required SQL scripts, see [Supabase SQL Scripts](supabase_sql_scripts.md).

## Storage Buckets

You need to create the following storage buckets in the Supabase Dashboard:

| Bucket Name | Public Access | Description |
|-------------|---------------|-------------|
| documents   | No (private)  | Project documentation and reports |
| maps        | Yes (public)  | GIS map exports and shared maps |
| images      | Yes (public)  | Images and graphics for the application |
| exports     | No (private)  | Data exports and backups |

### Steps to Create Buckets Manually:

1. Log in to the Supabase Dashboard
2. Navigate to the "Storage" section
3. Click "Create a new bucket"
4. Enter the bucket name (e.g., "documents")
5. Toggle the "Public bucket" option as needed:
   - Enable for public buckets (maps, images)
   - Disable for private buckets (documents, exports)
6. Click "Create bucket"
7. Repeat for each required bucket

### Setting Bucket Policies:

After creating buckets, set appropriate access policies:

#### For Public Buckets (maps, images):

1. Select the bucket
2. Go to the "Policies" tab
3. Click "Create a policy"
4. Select "Add a custom policy"
5. Name: "Allow public read access"
6. Policy definition:
   ```sql
   ((bucket_id = 'maps'::text) AND (auth.role() = 'anon'::text))
   ```
7. Operation: SELECT (this allows reading files)
8. Click "Save policy"

#### For Private Buckets (documents, exports):

1. Select the bucket
2. Go to the "Policies" tab
3. Click "Create a policy"
4. Select "Add a custom policy"
5. Name: "Allow authenticated read access"
6. Policy definition:
   ```sql
   ((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text))
   ```
7. Operation: SELECT
8. Click "Save policy"
9. Add another policy for upload:
   - Name: "Allow authenticated upload"
   - Policy definition: 
     ```sql
     ((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text))
     ```
   - Operation: INSERT
10. Add policies for UPDATE and DELETE as needed

> **Note**: Bucket creation via the API requires elevated permissions that may not be available with the current service role key. Creating buckets through the Supabase Dashboard is the recommended approach.

## Custom Functions

Create the following PostgreSQL functions in the SQL Editor:

### Extension Check Function

```sql
CREATE OR REPLACE FUNCTION check_extension(extension_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    ext_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = extension_name
    ) INTO ext_exists;
    RETURN ext_exists;
END;
$$ LANGUAGE plpgsql;
```

### Quality Check Function

```sql
CREATE OR REPLACE FUNCTION run_quality_check(
    sql_query TEXT,
    params JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE (result JSONB) AS $$
DECLARE
    query_with_params TEXT;
    param_keys TEXT[];
    param_values TEXT[];
    i INTEGER;
BEGIN
    -- Replace placeholders with parameter values
    query_with_params := sql_query;
    
    -- Extract parameter keys and values
    SELECT array_agg(key), array_agg(value #>> '{}')
    INTO param_keys, param_values
    FROM jsonb_each(params);
    
    -- Replace placeholders
    IF param_keys IS NOT NULL THEN
        FOR i IN 1..array_length(param_keys, 1) LOOP
            query_with_params := replace(
                query_with_params, 
                '$' || param_keys[i], 
                param_values[i]
            );
        END LOOP;
    END IF;
    
    -- Execute query and return results
    RETURN QUERY EXECUTE 'WITH query_result AS (' || query_with_params || ') 
                         SELECT row_to_json(query_result)::jsonb AS result 
                         FROM query_result';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Access Control Rules

Configure the following Row Level Security (RLS) policies in the Supabase Dashboard:

### Files Table Policy

```sql
-- Allow authenticated users to select their own files
CREATE POLICY "Users can view their own files"
  ON files
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own files
CREATE POLICY "Users can insert their own files"
  ON files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
  ON files
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON files
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Verification

After completing the setup, run the verification script to ensure everything is working correctly:

```bash
python check_supabase.py
```

This script will check:
- Environment variables
- Connection to Supabase
- Auth functionality
- Storage access
- PostGIS extension availability

## Migration

To migrate existing data from SQLite to Supabase:

1. Ensure all tables are created in Supabase
2. Export data from SQLite:
   ```bash
   python export_sqlite_data.py
   ```
3. Import data to Supabase:
   ```bash
   python import_to_supabase.py
   ```

## Client Integration

The application provides a client-side JavaScript library for Supabase integration in `static/js/supabase-client.js`. Include this in your HTML templates:

```html
<script src="https://unpkg.com/@supabase/supabase-js"></script>
<script src="/static/js/supabase-client.js"></script>
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure you're using the service role key for administrative operations
2. **PostGIS Functions Not Available**: Verify the extension is enabled
3. **RLS Blocking Access**: Check Row Level Security policies
4. **Storage Upload Fails**: Verify bucket exists and permissions are correctly set

### Getting Support

If you encounter issues not covered in this document, please refer to:
1. Supabase Documentation: https://supabase.io/docs
2. Project Issues: [GitHub Issues](https://github.com/benton-county/gis-assessment-platform/issues)

## Maintenance

### Backups

Supabase provides point-in-time recovery and daily backups. For additional safety:

1. Schedule regular database exports:
   ```bash
   python backup_supabase_data.py
   ```
2. Store backups in a secure location outside of Supabase

### Monitoring

Monitor your Supabase usage via the Dashboard:
- Database space usage
- API request volume
- Storage capacity

## Next Steps

After completing the migration:

1. Update application code to use Supabase client
2. Test all features with Supabase backend
3. Update CI/CD pipeline for Supabase integration
4. Deploy to production with Supabase backend