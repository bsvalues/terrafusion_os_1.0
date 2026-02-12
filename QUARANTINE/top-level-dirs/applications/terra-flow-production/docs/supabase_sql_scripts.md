# Supabase SQL Scripts

These SQL scripts need to be executed in the Supabase SQL Editor to set up required functions and extensions.

## Required PostgreSQL Extensions

Run these commands to enable required extensions:

```sql
-- Enable PostGIS for spatial data handling
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

## Utility Functions

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

### SQL Execution Function

```sql
CREATE OR REPLACE FUNCTION exec_sql(query TEXT) 
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE 'SELECT to_jsonb(t) FROM (' || query || ') AS t' INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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

## GIS Utility Functions

### Create Point Function

```sql
CREATE OR REPLACE FUNCTION create_point(lat DOUBLE PRECISION, lon DOUBLE PRECISION)
RETURNS GEOMETRY AS $$
BEGIN
    RETURN ST_SetSRID(ST_MakePoint(lon, lat), 4326);
END;
$$ LANGUAGE plpgsql;
```

### Distance Calculation Function

```sql
CREATE OR REPLACE FUNCTION distance_meters(
    lat1 DOUBLE PRECISION, 
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, 
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql;
```

### GeoJSON Conversion Function

```sql
CREATE OR REPLACE FUNCTION to_geojson(geometry_column geometry)
RETURNS JSONB AS $$
BEGIN
    RETURN ST_AsGeoJSON(geometry_column)::jsonb;
END;
$$ LANGUAGE plpgsql;
```

## Creating Database Tables

### Files Table

```sql
-- Create the files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    user_id UUID NOT NULL,
    project_id UUID,
    description TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    file_metadata JSONB DEFAULT '{}'::JSONB,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);
```

### GIS Projects Table

```sql
-- Create the GIS projects table
CREATE TABLE IF NOT EXISTS gis_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT now(),
    project_metadata JSONB DEFAULT '{}'::JSONB,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_gis_projects_user_id ON gis_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_gis_projects_name ON gis_projects(name);
```

### Data Quality Alerts Table

```sql
-- Create the quality alerts table
CREATE TABLE IF NOT EXISTS data_quality_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    query TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::JSONB,
    threshold NUMERIC,
    comparison_operator TEXT DEFAULT '>', -- >, <, =, !=, etc.
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_triggered TIMESTAMP WITH TIME ZONE,
    alert_count INTEGER DEFAULT 0,
    notification_channels JSONB DEFAULT '["log"]'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB
);
```

### Data Quality Reports Table

```sql
-- Create the quality reports table
CREATE TABLE IF NOT EXISTS data_quality_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES data_quality_alerts(id),
    execution_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    result_value NUMERIC,
    threshold_value NUMERIC,
    is_triggered BOOLEAN DEFAULT FALSE,
    query_execution_time_ms INTEGER,
    query_results JSONB,
    details TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    acknowledgment_status TEXT DEFAULT 'unacknowledged',
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_data_quality_reports_alert_id ON data_quality_reports(alert_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_reports_execution_time ON data_quality_reports(execution_time);
CREATE INDEX IF NOT EXISTS idx_data_quality_reports_is_triggered ON data_quality_reports(is_triggered);
```

## Row Level Security (RLS) Policies

These policies control access to the tables:

### Files Table Policies

```sql
-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own files"
  ON files
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON files
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON files
  FOR DELETE
  USING (auth.uid() = user_id);
```

### GIS Projects Table Policies

```sql
-- Enable Row Level Security
ALTER TABLE gis_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects"
  ON gis_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON gis_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON gis_projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON gis_projects
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Verification Queries

After executing all the scripts, you can verify that everything is set up correctly by running these queries:

### Check Extensions

```sql
SELECT extname, extversion FROM pg_extension;
```

### Test Utility Functions

```sql
-- Test the check_extension function
SELECT check_extension('postgis');

-- Test the exec_sql function
SELECT exec_sql('SELECT current_timestamp');

-- Test PostGIS functions
SELECT ST_AsText(create_point(47.6062, -122.3321));
SELECT distance_meters(47.6062, -122.3321, 47.6097, -122.3331);
```

### Verify Tables

```sql
-- List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```