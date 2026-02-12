# Application Integration Guide for Shared Supabase Database

This guide explains how to integrate your application with the shared Supabase database architecture of the GeoAssessmentPro platform.

## Overview

The GeoAssessmentPro platform uses a shared Supabase database with a multi-schema architecture to allow different modules, microservices, and third-party applications to work together while maintaining data security and integrity.

## Integration Methods

There are three primary ways to integrate with the shared database:

1. **Direct Database Access**: For internal modules with service accounts
2. **API Integration**: For third-party applications using REST endpoints
3. **Webhook Integration**: For event-driven integration with external systems

## Prerequisites

- Supabase service account credentials specific to your application
- Assigned schema and tables for your application
- Necessary permissions configured in Row Level Security (RLS) policies

## Connection Information

Each service or application should connect to the shared database using its own service account credentials:

```
SUPABASE_URL: https://your-project-id.supabase.co
SERVICE_SUPABASE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Direct Database Access

### Python Integration Example

Using our service client library:

```python
from service_supabase_client import get_service_supabase_client

# Get a client for your specific service
client = get_service_supabase_client('your_service_name')

# Example query
result = client.table('your_schema.your_table').select('*').execute()
print(result.data)
```

Using the connection pool for efficient resource management:

```python
from supabase_connection_pool import with_connection

@with_connection('your_service_name')
def get_property_data(client, property_id):
    result = client.table('core.properties').select('*').eq('id', property_id).execute()
    return result.data[0] if result.data else None

# Use the function
property_data = get_property_data('property-123')
```

### JavaScript/TypeScript Integration Example

```typescript
import { createClient } from '@supabase/supabase-js'

// Connection with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
    },
    // Set application name for audit logging
    global: {
      headers: {
        'X-Application-Name': 'your_service_name',
      },
    },
  }
)

// Setup app name for audit tracking
const setupConnection = async () => {
  await supabase.rpc('set_config', {
    parameter: 'app.service_name',
    value: 'your_service_name',
    is_local: true
  })
}

// Example query
const fetchProperties = async () => {
  await setupConnection()
  const { data, error } = await supabase
    .from('core.properties')
    .select('*')
    .limit(10)
  
  return { data, error }
}
```

## Realtime Data Synchronization

Services can subscribe to database changes using Supabase Realtime:

```javascript
// Subscribe to changes
const channel = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',  // or 'INSERT', 'UPDATE', 'DELETE'
      schema: 'core',
      table: 'properties',
    },
    (payload) => {
      console.log('Change received!', payload)
      // Handle the change
    }
  )
  .subscribe()

// Later, unsubscribe
channel.unsubscribe()
```

## API Integration

For third-party applications, use the API views and functions to access data:

```javascript
// Using fetch API
const fetchProperty = async (propertyId) => {
  const response = await fetch(`https://your-project-id.supabase.co/rest/v1/rpc/get_property_by_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': YOUR_API_KEY,
      'Authorization': `Bearer ${YOUR_API_KEY}`
    },
    body: JSON.stringify({
      property_id: propertyId
    })
  })
  
  return response.json()
}
```

## Webhook Integration

To set up webhook integration:

1. Register your application in the `external.systems` table
2. Configure webhooks in the `external.webhooks` table
3. The platform will automatically trigger your webhooks when specified events occur

Example webhook registration:

```sql
-- Register your application
INSERT INTO external.systems (name, description, api_endpoint, auth_type, credentials)
VALUES (
  'MyExternalApp', 
  'External property management application', 
  'https://myapp.example.com/api', 
  'bearer_token',
  '{"token": "your-secret-token"}'
);

-- Configure webhook for property updates
INSERT INTO external.webhooks (
  system_id, 
  name, 
  event_type, 
  endpoint_url, 
  headers, 
  payload_template
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000', -- your system_id 
  'Property Update Notification', 
  'property_update',
  'https://myapp.example.com/webhooks/property-update',
  '{"Authorization": "Bearer your-secret-token"}',
  '{"property_id": "{{id}}", "parcel_number": "{{parcel_number}}", "event_type": "{{event_type}}"}'
);
```

## Cross-Schema Access

When your application needs data from multiple schemas, use the cross-schema functions instead of making multiple queries:

```javascript
// Using cross-schema function
const getPropertyWithValuation = async (propertyId) => {
  const { data, error } = await supabase
    .rpc('get_property_with_valuation', {
      property_id: propertyId
    })
  
  return { data, error }
}
```

## Environment Setup

Each service should set up its environment variables as follows:

```bash
# Supabase configuration
SUPABASE_URL=https://your-project-id.supabase.co

# Service-specific keys (using service pattern matching)
GIS_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VALUATION_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SYNC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service configuration
SERVICE_NAME=your_service_name
```

## Connection Pool Configuration

Configure a connection pool if your service will make frequent database calls:

```python
from supabase_connection_pool import get_connection_pool

# Get a connection pool with custom configuration
pool = get_connection_pool('your_service_name', {
    'max_size': 20,         # Maximum number of connections
    'min_size': 5,          # Minimum number of connections
    'max_idle_time': 120,   # Max seconds a connection can be idle
    'connection_timeout': 15 # Timeout when getting a connection
})

# Use the pool
with pool.connection() as client:
    result = client.table('your_schema.your_table').select('*').execute()
```

## Error Handling

When working with the shared database, implement appropriate error handling:

```javascript
const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('your_schema.your_table')
      .select('*')
    
    if (error) {
      // Handle database error
      console.error('Database error:', error)
      return { success: false, error }
    }
    
    return { success: true, data }
  } catch (e) {
    // Handle unexpected errors
    console.error('Unexpected error:', e)
    return { success: false, error: 'Unexpected error occurred' }
  }
}
```

## Audit Logging

All database changes are automatically tracked in the audit logging system. To view audit logs for your service:

```sql
SELECT * FROM audit.logs
WHERE service_name = 'your_service_name'
ORDER BY timestamp DESC
LIMIT 100;
```

## Schema Migrations

When your service needs to update the database schema:

1. Create a migration file with the changes
2. Submit the migration file to the database administrator
3. The administrator will review and apply the changes

Example migration file:

```sql
-- my_service_migration_v1.sql
-- Add a new column to your table
ALTER TABLE your_schema.your_table ADD COLUMN new_field TEXT;

-- Create a new index
CREATE INDEX idx_your_table_new_field ON your_schema.your_table(new_field);

-- Update RLS policy
CREATE POLICY "Your service can access new data" ON your_schema.your_table
    FOR ALL TO your_service_role
    USING (true);
```

## Testing Integration

To test your integration:

1. Use the provided `test_connection` function:

```python
from service_supabase_client import test_connection

# Test your service connection
success = test_connection('your_service_name')
print(f"Connection test successful: {success}")
```

2. Verify data access permissions:

```python
# Test table access
result = client.table('your_schema.your_table').select('count(*)').execute()
print(f"Found {result.data[0]['count']} records")

# Test cross-schema access
result = client.rpc('get_property_with_valuation', {'property_id': 'some-id'})
print(f"Cross-schema function result: {result.data}")
```

## Troubleshooting

Common issues and solutions:

1. **Permission Denied Errors**
   - Ensure your service account has the correct role
   - Check RLS policies for your tables

2. **Connection Pool Exhaustion**
   - Increase max_size in pool configuration
   - Ensure connections are properly released

3. **Missing Tables/Schemas**
   - Verify the schema migration was applied
   - Check for typos in table/schema names

4. **Slow Queries**
   - Use proper indexes
   - Review query patterns
   - Consider using cached results

## Support

For integration support, contact the database administrator at `admin@geoassessmentpro.example.com` with:

1. Your service name
2. Error messages or logs
3. The SQL queries you're trying to execute
4. The expected result

## Data Security Guidelines

When integrating with the shared database:

1. Always use parameterized queries to prevent SQL injection
2. Never expose service account keys in client-side code
3. Implement least privilege access (only request permissions you need)
4. Sanitize inputs before sending to the database
5. Store sensitive data only in designated secure fields