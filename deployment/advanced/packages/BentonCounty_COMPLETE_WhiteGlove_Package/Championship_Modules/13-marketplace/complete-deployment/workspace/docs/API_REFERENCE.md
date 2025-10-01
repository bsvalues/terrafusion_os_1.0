# Terrafusion API Reference

## Base Configuration

- **Base URL**: `http://localhost:\${{TF_ADMIN_PORT:-8080}}`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

## Authentication

### Login

```http
POST /auth/login
```

**Request Body**:

```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:

```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "uuid",
    "username": "string",
    "roles": ["admin", "user"]
  }
}
```

### Refresh Token

```http
POST /auth/refresh
```

## Property Endpoints

### Get All Properties

```http
GET /api/v1/properties
```

**Query Parameters**:

- `page` (number): Page number
- `limit` (number): Items per page
- `filter` (string): Search filter
- `sort` (string): Sort field

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "address": "string",
      "value": 0,
      "type": "residential",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Get Property by ID

```http
GET /api/v1/properties/:id
```

### Create Property

```http
POST /api/v1/properties
```

**Request Body**:

```json
{
  "address": "string",
  "type": "residential|commercial|industrial",
  "details": {
    "sqft": 0,
    "bedrooms": 0,
    "bathrooms": 0
  }
}
```

### Update Property

```http
PUT /api/v1/properties/:id
```

### Delete Property

```http
DELETE /api/v1/properties/:id
```

## Cost Estimation Endpoints

### Calculate Cost Estimate

```http
POST /api/v1/cost/estimate
```

**Request Body**:

```json
{
  "property_id": "uuid",
  "parameters": {
    "region": "string",
    "quality": "standard|premium|luxury",
    "complexity": 1-10
  }
}
```

**Response**:

```json
{
  "estimate": {
    "total": 0,
    "breakdown": {
      "materials": 0,
      "labor": 0,
      "overhead": 0
    },
    "confidence": 0.95
  }
}
```

### Get Historical Costs

```http
GET /api/v1/cost/history/:property_id
```

## Analytics Endpoints

### Market Trends

```http
GET /api/v1/analytics/trends
```

**Query Parameters**:

- `region` (string): Geographic region
- `period` (string): Time period (day|week|month|year)
- `metric` (string): Metric type

### Risk Assessment

```http
POST /api/v1/analytics/risk
```

**Request Body**:

```json
{
  "property_id": "uuid",
  "factors": ["market", "environmental", "regulatory"]
}
```

## MCP Trigger Endpoints

### Execute Trigger

```http
POST /api/v1/mcp/trigger
```

**Request Body**:

```json
{
  "trigger": "property:cost:simulate",
  "params": {
    "property_id": "uuid",
    "scenarios": ["best", "worst", "likely"]
  }
}
```

### Get Trigger Status

```http
GET /api/v1/mcp/trigger/:id/status
```

## WebSocket Events

### Connection

```javascript
const ws = new WebSocket('ws://localhost:\${{TF_ADMIN_PORT:-8080}}/ws');
```

### Event Types

#### Property Update

```json
{
  "type": "property.updated",
  "data": {
    "property_id": "uuid",
    "changes": {}
  }
}
```

#### Cost Calculation Complete

```json
{
  "type": "cost.calculated",
  "data": {
    "property_id": "uuid",
    "estimate_id": "uuid"
  }
}
```

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED`: Authentication required
- `AUTH_INVALID`: Invalid credentials
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `INTERNAL_ERROR`: Server error

## Rate Limiting

- **Default**: 100 requests per minute
- **Authenticated**: 1000 requests per minute
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Health Check

### System Health

```http
GET /health
```

**Response**:

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ml_service": "ready"
  }
}
```

## Pagination

All list endpoints support pagination:

```http
GET /api/v1/properties?page=2&limit=50
```

**Headers**:

- `X-Total-Count`: Total number of items
- `Link`: RFC 5988 links for navigation

## Filtering

Use query parameters for filtering:

```http
GET /api/v1/properties?type=residential&min_value=100000
```

## Sorting

Use `sort` parameter:

```http
GET /api/v1/properties?sort=-created_at,value
```

- Prefix with `-` for descending order

## Batch Operations

### Batch Create

```http
POST /api/v1/properties/batch
```

**Request Body**:

```json
{
  "operations": [
    {
      "method": "create",
      "data": {}
    }
  ]
}
```

## API Versioning

- Current version: `v1`
- Version in URL: `/api/v1/`
- Deprecation notices in headers

---

_Generated: August 2025_  
_API Version: 1.0_
