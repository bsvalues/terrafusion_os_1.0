# Terrafusion API Reference

## Overview

The Terrafusion API provides programmatic access to all platform capabilities
across three evolutionary phases. This reference covers authentication,
endpoints, request/response formats, and best practices.

## Base URLs

| Environment | Base URL                                 |
| ----------- | ---------------------------------------- |
| Production  | `https://api.terrafusion.gov/v1`         |
| Staging     | `https://staging-api.terrafusion.gov/v1` |
| Development | `http://localhost:\${{TF_PORT_4000:-4000}}/v1`               |

## Authentication

Terrafusion uses JWT-based authentication with refresh tokens.

### Obtaining Tokens

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.gov",
  "password": "secure-password"
}
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

### Using Tokens

Include the access token in the Authorization header:

```http
GET /api/v1/tenants
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Refreshing Tokens

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Common Headers

| Header            | Description                                   | Required                      |
| ----------------- | --------------------------------------------- | ----------------------------- |
| `Authorization`   | Bearer token for authentication               | Yes (except public endpoints) |
| `X-Tenant-ID`     | Tenant identifier for multi-tenant operations | Sometimes                     |
| `X-Request-ID`    | Unique request identifier for tracing         | No                            |
| `Accept-Language` | Preferred language for responses              | No                            |

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2025-01-30T10:00:00Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "resource": "tenant",
      "id": "123e4567-e89b-12d3-a456-426614174000"
    }
  },
  "metadata": {
    "timestamp": "2025-01-30T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

## Error Codes

| Code                 | HTTP Status | Description              |
| -------------------- | ----------- | ------------------------ |
| `UNAUTHORIZED`       | 401         | Authentication required  |
| `FORBIDDEN`          | 403         | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404         | Resource doesn't exist   |
| `VALIDATION_ERROR`   | 400         | Invalid request data     |
| `CONFLICT`           | 409         | Resource conflict        |
| `RATE_LIMITED`       | 429         | Too many requests        |
| `INTERNAL_ERROR`     | 500         | Server error             |

## Rate Limiting

Rate limits are enforced per API key:

- **Standard**: 1,000 requests per minute
- **Premium**: 10,000 requests per minute
- **Enterprise**: Custom limits

Rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1614556800
```

## Pagination

List endpoints support pagination:

```http
GET /api/v1/tenants?page=2&limit=50
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 245,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Filtering and Sorting

### Filtering

```http
GET /api/v1/tenants?status=active&createdAfter=2025-01-01
```

### Sorting

```http
GET /api/v1/tenants?sort=createdAt:desc,name:asc
```

### Field Selection

```http
GET /api/v1/tenants?fields=id,name,status
```

## Webhooks

### Registering a Webhook

```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://example.com/webhook",
  "events": ["tenant.created", "tenant.updated"],
  "secret": "webhook-secret-key"
}
```

### Webhook Payload

```json
{
  "id": "evt_123",
  "type": "tenant.created",
  "timestamp": "2025-01-30T10:00:00Z",
  "data": {
    // Event-specific data
  }
}
```

### Verifying Webhooks

Verify the signature in the `X-Terrafusion-Signature` header:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## API Endpoints by Category

### Core Platform (V1)

#### Authentication

- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user

#### Tenants

- `GET /tenants` - List all tenants
- `POST /tenants` - Create new tenant
- `GET /tenants/:id` - Get tenant details
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant

#### Analytics

- `GET /analytics/reports` - List reports
- `POST /analytics/reports/:id/execute` - Execute report
- `GET /analytics/dashboards` - List dashboards
- `POST /analytics/dashboards` - Create dashboard

### AI & Edge (V2)

#### AI Workflows

- `POST /ai/workflows/generate` - Generate workflow from description
- `GET /ai/workflows` - List workflows
- `POST /ai/workflows/:id/execute` - Execute workflow
- `GET /ai/models` - List available models

#### Edge Federation

- `GET /edge/nodes` - List edge nodes
- `POST /edge/nodes` - Register edge node
- `GET /edge/sync/status` - Get sync status
- `POST /edge/jobs` - Submit edge job

#### Quantum Operations

- `POST /quantum/jobs` - Submit quantum job
- `GET /quantum/jobs/:id` - Get job status
- `POST /quantum/entangle` - Create entangled qubits
- `GET /quantum/simulators` - List available simulators

### Cosmic Governance (V3)

#### Quantum Governance

- `POST /quantum/governance/proposals` - Create proposal
- `POST /quantum/governance/vote` - Cast quantum vote
- `GET /quantum/governance/timeline-analysis` - Analyze timelines

#### Species Accord

- `POST /species/register` - Register new species
- `POST /species/translate` - Universal translation
- `GET /species/directory` - List known species

#### Celestial Harmony

- `GET /harmony/field/status` - Get harmony field status
- `POST /harmony/generate` - Generate harmony field
- `POST /harmony/heal` - Initiate healing

## Code Examples

### JavaScript/TypeScript

```typescript
import { TerraFusionClient } from '@terrafusion/sdk';

const client = new TerraFusionClient({
  apiKey: process.env.TERRAFUSION_API_KEY,
});

// List tenants
const tenants = await client.tenants.list({
  status: 'active',
  limit: 50,
});

// Execute AI workflow
const workflow = await client.ai.executeWorkflow('wf_123', {
  input: { document: 'base64...' },
});
```

### Python

```python
from terrafusion import TerraFusionClient

client = TerraFusionClient(
    api_key=os.environ['TERRAFUSION_API_KEY']
)

# Create report
report = client.analytics.create_report(
    name="Monthly Summary",
    query={"timeframe": "last_month"}
)

# Submit quantum job
job = client.quantum.submit_job(
    algorithm="optimization",
    parameters={"qubits": 10}
)
```

### cURL

```bash
# Get tenant details
curl -X GET https://api.terrafusion.gov/v1/tenants/123 \
  -H "Authorization: Bearer $TOKEN"

# Create workflow
curl -X POST https://api.terrafusion.gov/v1/ai/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Document Processing",
    "steps": ["ocr", "classify", "extract"]
  }'
```

## Best Practices

### Request Optimization

1. Use field selection to reduce payload size
2. Implement pagination for large datasets
3. Cache responses when appropriate
4. Use webhook events instead of polling

### Error Handling

1. Implement exponential backoff for retries
2. Log all errors with request IDs
3. Handle rate limits gracefully
4. Parse error details for better user feedback

### Security

1. Never expose API keys in client-side code
2. Rotate API keys regularly
3. Use webhook secrets for verification
4. Implement request signing for sensitive operations

### Performance

1. Use connection pooling
2. Implement request timeouts
3. Compress request/response payloads
4. Monitor API usage and optimize calls

## API Versioning

Terrafusion uses URL-based versioning:

- Current version: `v1`
- Version in URL: `https://api.terrafusion.gov/v1/...`
- Deprecation notice: 6 months
- Sunset period: 12 months

## Support

- **API Status**: https://status.terrafusion.gov
- **Documentation**: https://docs.terrafusion.gov/api
- **Support**: api-support@terrafusion.gov
- **Community**: https://community.terrafusion.gov
