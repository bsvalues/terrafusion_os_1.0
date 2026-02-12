# Benton County GIS API Documentation

This document provides guidelines for integrating with the Benton County GIS API. The API allows third-party applications and microservices to interact with the Benton County GIS database.

## Authentication

All API requests require authentication using an API key. The API key must be included in the request headers as `X-API-Key` or as a query parameter `api_key`.

```
GET /api/v1/data/users?limit=10
X-API-Key: your_api_key_here
```

Contact the Benton County GIS administrator to obtain an API key for your application.

## Base URL

The base URL for all API endpoints is:

```
https://{host}/api/v1
```

## Connection Management

For microservices and third-party applications that need to maintain connections to the database, we provide a connection management system to ensure proper connection pooling, load balancing, and security.

### Service Registration

Services must register with the connection manager before obtaining connections:

```python
from api.connection_manager import connection_manager

# Register a service
service_id = connection_manager.register_service(
    service_name="my_service",
    service_type="microservice",  # or "third-party"
    max_connections=5,  # Maximum number of connections
    metadata={
        "description": "My service description",
        "version": "1.0",
        "contact": "admin@example.com"
    }
)

# Store the service_id for future requests
```

### Getting Connections

Once registered, services can obtain database connections:

```python
# Get a connection
connection = connection_manager.get_connection(service_id)

# Use the connection
# ...

# Release the connection when done
connection_manager.release_connection(connection, service_id)
```

### Executing with Connections

For simple operations, use the `execute_with_connection` method:

```python
def my_query(connection):
    # Use the connection
    result = connection.execute("SELECT * FROM users")
    return result

# Execute with a connection
result = connection_manager.execute_with_connection(my_query, service_id)
```

### Service Cleanup

When a service is no longer needed, unregister it:

```python
connection_manager.unregister_service(service_id)
```

## Available Endpoints

### GET /api/v1/status

Returns the API status.

```
GET /api/v1/status
```

Response:
```json
{
  "status": "operational",
  "version": "1.0",
  "timestamp": "2025-04-12T15:55:21.670376"
}
```

### GET /api/v1/schema

Returns the database schema information.

```
GET /api/v1/schema
```

You can also specify a table name to get schema for a specific table:

```
GET /api/v1/schema?table=users
```

### GET /api/v1/data/{table_name}

Retrieves data from a specific table.

```
GET /api/v1/data/users
```

Query parameters:
- `limit`: Maximum number of records to return
- `offset`: Number of records to skip
- `order_by`: Column to order by
- `order_dir`: Order direction ("asc" or "desc")
- Any other parameters will be used as filters

Examples:
```
GET /api/v1/data/users?limit=10&offset=20&order_by=username&order_dir=desc
GET /api/v1/data/users?username=admin
```

### POST /api/v1/data/{table_name}

Creates a new record in the specified table.

```
POST /api/v1/data/users
Content-Type: application/json

{
  "username": "new_user",
  "email": "new_user@example.com"
}
```

### PUT /api/v1/data/{table_name}/{id_value}

Updates an existing record in the specified table.

```
PUT /api/v1/data/users/1
Content-Type: application/json

{
  "email": "updated_email@example.com"
}
```

You can specify a different ID column using the `id_column` query parameter:

```
PUT /api/v1/data/users/admin?id_column=username
```

### DELETE /api/v1/data/{table_name}/{id_value}

Deletes a record from the specified table.

```
DELETE /api/v1/data/users/1
```

You can specify a different ID column using the `id_column` query parameter:

```
DELETE /api/v1/data/users/admin?id_column=username
```

### POST /api/v1/query

Executes a custom SQL query.

```
POST /api/v1/query
Content-Type: application/json

{
  "query": "SELECT * FROM users WHERE username = :username",
  "params": {
    "username": "admin"
  }
}
```

### GET /api/v1/files/{file_id}

Retrieves information about a file.

```
GET /api/v1/files/1
```

### GET /api/v1/gis/{layer_name}

Retrieves GIS data for a specific layer.

```
GET /api/v1/gis/parcels
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in case of errors:

```json
{
  "error": "Error message"
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Internal server error

## Rate Limiting

To ensure fair usage, the API has rate limits. Excessive requests will receive a 429 (Too Many Requests) response. Please implement appropriate retry logic with backoff.

## Support

For API support or to report issues, contact the Benton County GIS administrator.