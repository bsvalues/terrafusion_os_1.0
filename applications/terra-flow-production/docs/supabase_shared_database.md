# Supabase Shared Database Configuration

This document outlines the configuration and best practices for setting up Supabase as a shared database for multiple modules, microservices, and third-party applications in the GeoAssessmentPro system.

## Architecture Overview

In a shared database architecture with Supabase, multiple applications access the same database but interact with their own distinct schemas or tables. This design provides:

- **Data consistency**: A single source of truth for all applications
- **Simplified data integration**: No need for complex ETL processes between services
- **Centralized authentication**: All services use the same authentication system
- **Cost efficiency**: A single database instance serves multiple applications

## Required Components

### Database Schema Segregation

Use Postgres schemas to logically separate application data:

```sql
-- Create schemas for different modules/services
CREATE SCHEMA core;        -- Core system functionality
CREATE SCHEMA gis;         -- GIS-specific tables and functions
CREATE SCHEMA valuation;   -- Property valuation module
CREATE SCHEMA sync;        -- Data synchronization service
CREATE SCHEMA analytics;   -- Analytics and reporting
CREATE SCHEMA external;    -- Third-party application integration
```

### Service Account Management

Create dedicated service accounts for different modules and third-party applications:

```sql
-- Create service roles with limited permissions
CREATE ROLE gis_service WITH LOGIN PASSWORD 'strong_password';
CREATE ROLE valuation_service WITH LOGIN PASSWORD 'strong_password';
CREATE ROLE analytics_service WITH LOGIN PASSWORD 'strong_password';
CREATE ROLE sync_service WITH LOGIN PASSWORD 'strong_password';
```

Grant specific permissions:

```sql
-- Grant permissions to GIS service
GRANT USAGE ON SCHEMA gis TO gis_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA gis TO gis_service;
GRANT SELECT ON ALL TABLES IN SCHEMA core TO gis_service;

-- Grant permissions to Valuation service
GRANT USAGE ON SCHEMA valuation TO valuation_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA valuation TO valuation_service;
GRANT SELECT ON ALL TABLES IN SCHEMA core TO valuation_service;
GRANT SELECT ON ALL TABLES IN SCHEMA gis TO valuation_service;
```

### API Security and Rate Limiting

Configure Supabase API security settings:

1. **JWT Token Expiration**: Set appropriate token expiration times
2. **Rate Limiting**: Implement rate limits for API endpoints
3. **IP Allowlisting**: Restrict access to known IP addresses for service accounts

### Cross-Schema Functions

Create functions to safely access data across schemas:

```sql
-- Create a function to join data across schemas
CREATE OR REPLACE FUNCTION core.get_property_with_valuation(property_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'property', row_to_json(p),
        'valuation', row_to_json(v),
        'gis_data', row_to_json(g)
    ) INTO result
    FROM core.properties p
    LEFT JOIN valuation.assessments v ON p.id = v.property_id
    LEFT JOIN gis.property_geometries g ON p.id = g.property_id
    WHERE p.id = property_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Event-Driven Integration

Set up Postgres triggers and functions for event-driven integration:

```sql
-- Create a notification function
CREATE OR REPLACE FUNCTION notify_property_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'property_updates',
        json_build_object(
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'operation', TG_OP,
            'record_id', NEW.id
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to property table
CREATE TRIGGER property_update_trigger
AFTER INSERT OR UPDATE ON core.properties
FOR EACH ROW EXECUTE PROCEDURE notify_property_update();
```

### Data Sharing Policies

Configure Row-Level Security (RLS) policies for secure data sharing:

```sql
-- Enable RLS on shared tables
ALTER TABLE core.properties ENABLE ROW LEVEL SECURITY;

-- Create policies for different service roles
CREATE POLICY valuation_service_access 
ON core.properties 
FOR ALL 
TO valuation_service
USING (true);  -- Full access for valuation service

CREATE POLICY analytics_read_only 
ON core.properties 
FOR SELECT 
TO analytics_service
USING (true);  -- Read-only access for analytics
```

### Audit Trail

Implement audit logging for tracking changes across services:

```sql
-- Create audit log table
CREATE TABLE audit.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT NOT NULL,
    service_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    service_name TEXT;
BEGIN
    -- Get the current application name (set by services when connecting)
    service_name := current_setting('app.service_name', true);
    
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit.logs (
            schema_name, table_name, operation, record_id, 
            old_data, new_data, changed_by, service_name
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id,
            row_to_json(OLD), row_to_json(NEW), 
            current_user, service_name
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit.logs (
            schema_name, table_name, operation, record_id,
            new_data, changed_by, service_name
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id,
            row_to_json(NEW), current_user, service_name
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.logs (
            schema_name, table_name, operation, record_id,
            old_data, changed_by, service_name
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, OLD.id,
            row_to_json(OLD), current_user, service_name
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## Service Connection Template

Here's a template for how services should connect to the shared Supabase database:

```python
def get_service_supabase_client(service_name, api_key=None):
    """Get a Supabase client configured for a specific service."""
    url = os.environ.get("SUPABASE_URL")
    key = api_key or os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        raise ValueError("Missing Supabase URL or key")
    
    # Create the client
    client = create_client(url, key)
    
    # Set the application name to identify the service in audit logs
    client.postgrest.request_builder.session.headers.update({
        "X-Application-Name": service_name
    })
    
    # Execute setup query to set the application name in the connection
    client.sql(f"SET app.service_name TO '{service_name}';").execute()
    
    return client
```

## Third-Party Integration

For third-party applications that need to integrate with the shared database:

1. **Create a dedicated API schema**: Contains views and functions specifically for third-party access
2. **Generate API keys with limited permissions**: Only allow access to the API schema
3. **Use PostgreSQL Foreign Data Wrappers (FDW)** for direct database integrations 
4. **Implement webhooks** for event-driven integrations

Example API view for third-party access:

```sql
CREATE SCHEMA api;

-- Create a sanitized view for third-party applications
CREATE VIEW api.properties AS
    SELECT 
        id,
        parcel_number,
        address,
        property_class,
        zoning,
        -- Exclude sensitive information
        NULL as owner_name,
        NULL as owner_contact,
        assessed_value,
        last_assessment_date,
        ST_AsGeoJSON(location)::jsonb as geometry
    FROM 
        core.properties;

-- Grant access to external applications
GRANT USAGE ON SCHEMA api TO external_app_role;
GRANT SELECT ON api.properties TO external_app_role;
```

## Connection Pool Management

Configure connection pooling for efficient resource usage:

1. **Use PgBouncer**: Set up connection pooling for high-traffic applications
2. **Configure service-specific pools**: Allocate resources based on service priority
3. **Set connection timeouts**: Prevent resource exhaustion 

## Monitoring and Alerting

Set up monitoring for cross-service database usage:

1. **Query performance tracking**: Monitor slow queries across all services
2. **Resource usage alerts**: Set up alerts for high CPU/memory usage
3. **Error rate monitoring**: Track database errors by service
4. **Connection saturation alerts**: Monitor connection pool utilization

## Backup and Recovery Strategy

Configure comprehensive backup strategy:

1. **Automated backups**: Schedule regular point-in-time backups
2. **Cross-region replication**: Set up geographic redundancy
3. **Service-specific recovery plans**: Document recovery procedures for each service
4. **Testing recovery**: Regularly test restoration procedures

## Access Control Management

Implement a process for managing access across services:

1. **Service credential rotation**: Regularly rotate service account passwords
2. **Access request workflow**: Formalize the process for new service integration
3. **Permission audit**: Regularly review and audit service permissions
4. **Centralized access control**: Manage all service credentials in a secure vault