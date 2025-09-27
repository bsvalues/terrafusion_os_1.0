# Terrafusion Commercial API Documentation

## Overview

The Terrafusion API provides programmatic access to property valuation services,
enabling integration with your existing systems. Commercial edition includes
rate-limited API access based on your subscription tier.

**Base URL**: `https://api.terrafusion.com/v1`  
**Authentication**: Bearer token (JWT)

---

## Quick Start

### 1. Get Your API Key

```bash
curl -X POST https://api.terrafusion.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "commercial.professional"
}
```

### 2. Make Your First Valuation

```bash
curl -X POST https://api.terrafusion.com/v1/valuations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main St, Seattle, WA 98101",
    "property_type": "residential"
  }'
```

---

## Authentication

All API requests require authentication using a Bearer token in the
Authorization header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Token Management

| Endpoint        | Method | Description            |
| --------------- | ------ | ---------------------- |
| `/auth/token`   | POST   | Get access token       |
| `/auth/refresh` | POST   | Refresh expiring token |
| `/auth/revoke`  | POST   | Revoke token           |

### Rate Limits

| Plan             | Requests/Hour | Burst Limit | Concurrent |
| ---------------- | ------------- | ----------- | ---------- |
| **Starter**      | 100           | 10/second   | 2          |
| **Professional** | 1,000         | 50/second   | 10         |
| **Enterprise**   | 10,000        | 200/second  | 50         |

Rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Core Endpoints

### Property Valuation

#### Single Property Valuation

```http
POST /valuations
```

**Request Body:**

```json
{
  "address": "123 Main St, Seattle, WA 98101",
  "property_type": "residential",
  "details": {
    "bedrooms": 3,
    "bathrooms": 2,
    "square_feet": 2500,
    "year_built": 1995,
    "lot_size": 7500
  },
  "valuation_method": "costforge_ai"
}
```

**Response:**

```json
{
  "valuation_id": "val_1234567890",
  "status": "completed",
  "processing_time_ms": 3247,
  "property": {
    "address": "123 Main St, Seattle, WA 98101",
    "parcel_id": "1234567890",
    "coordinates": {
      "lat": 47.6062,
      "lng": -122.3321
    }
  },
  "valuation": {
    "estimated_value": 750000,
    "confidence_score": 0.94,
    "value_range": {
      "low": 712500,
      "high": 787500
    },
    "methodology": "costforge_ai",
    "comparable_properties": 12,
    "market_trend": "appreciating",
    "annual_appreciation": 0.045
  },
  "cost_breakdown": {
    "land_value": 250000,
    "improvement_value": 500000,
    "total_value": 750000
  },
  "timestamp": "2025-01-10T15:30:00Z"
}
```

#### Bulk Valuation

```http
POST /valuations/bulk
```

**Request Body:**

```json
{
  "properties": [
    {
      "id": "prop_001",
      "address": "123 Main St, Seattle, WA 98101"
    },
    {
      "id": "prop_002",
      "address": "456 Oak Ave, Bellevue, WA 98004"
    }
  ],
  "callback_url": "https://yourapp.com/webhook/valuations"
}
```

**Response:**

```json
{
  "batch_id": "batch_abc123",
  "status": "processing",
  "total_properties": 2,
  "estimated_completion": "2025-01-10T15:35:00Z",
  "webhook_url": "https://yourapp.com/webhook/valuations"
}
```

### Property Search

#### Search Properties

```http
GET /properties/search
```

**Query Parameters:**

- `q` - Search query (address, parcel ID)
- `county` - County name
- `state` - State code
- `type` - Property type (residential, commercial, industrial)
- `min_value` - Minimum value
- `max_value` - Maximum value
- `page` - Page number (default: 1)
- `limit` - Results per page (max: 100)

**Example:**

```bash
curl "https://api.terrafusion.com/v1/properties/search?county=King&state=WA&type=residential&min_value=500000&max_value=1000000&limit=20"
```

### Reports

#### Generate Valuation Report

```http
POST /reports/valuation
```

**Request Body:**

```json
{
  "valuation_id": "val_1234567890",
  "format": "pdf",
  "include_comparables": true,
  "include_market_analysis": true,
  "branding": {
    "company_name": "Your Company",
    "logo_url": "https://yourcompany.com/logo.png"
  }
}
```

**Response:**

```json
{
  "report_id": "rpt_xyz789",
  "status": "generating",
  "format": "pdf",
  "download_url": null,
  "expires_at": null
}
```

#### Download Report

```http
GET /reports/{report_id}/download
```

Returns the generated report file (PDF, Excel, etc.)

### Data Export

#### Export Properties

```http
POST /export/properties
```

**Request Body:**

```json
{
  "filters": {
    "county": "King",
    "state": "WA",
    "property_type": "residential",
    "value_range": {
      "min": 500000,
      "max": 1000000
    }
  },
  "format": "csv",
  "fields": ["address", "value", "bedrooms", "bathrooms", "square_feet"]
}
```

### Market Analytics

#### Market Trends

```http
GET /analytics/market-trends
```

**Query Parameters:**

- `county` - County name
- `state` - State code
- `period` - Time period (1m, 3m, 6m, 1y, 5y)
- `property_type` - Property type filter

**Response:**

```json
{
  "location": {
    "county": "King",
    "state": "WA"
  },
  "period": "1y",
  "trends": {
    "median_value": 850000,
    "median_change_pct": 4.5,
    "total_sales": 12543,
    "days_on_market": 18,
    "inventory_months": 1.2
  },
  "forecast": {
    "next_quarter_change": 1.2,
    "next_year_change": 4.8,
    "confidence": 0.87
  }
}
```

---

## Webhooks

Configure webhooks to receive real-time updates:

### Webhook Events

| Event                 | Description                |
| --------------------- | -------------------------- |
| `valuation.completed` | Single valuation finished  |
| `batch.completed`     | Bulk valuation finished    |
| `report.ready`        | Report generation complete |
| `export.ready`        | Data export complete       |

### Webhook Payload

```json
{
  "event": "valuation.completed",
  "data": {
    "valuation_id": "val_1234567890",
    "status": "completed",
    "result": { ... }
  },
  "timestamp": "2025-01-10T15:30:00Z",
  "signature": "sha256=abcdef123456..."
}
```

### Webhook Security

Verify webhook signatures:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={expected}" == signature
```

---

## SDKs & Libraries

### Official SDKs

#### JavaScript/TypeScript

```bash
npm install @terrafusion/sdk
```

```javascript
import { Terrafusion } from '@terrafusion/sdk';

const client = new Terrafusion({
  apiKey: 'YOUR_API_KEY',
});

const valuation = await client.valuations.create({
  address: '123 Main St, Seattle, WA 98101',
  propertyType: 'residential',
});

console.log(`Value: $${valuation.estimatedValue}`);
```

#### Python

```bash
pip install terrafusion
```

```python
from terrafusion import Client

client = Client(api_key='YOUR_API_KEY')

valuation = client.valuations.create(
    address='123 Main St, Seattle, WA 98101',
    property_type='residential'
)

print(f"Value: ${valuation.estimated_value:,}")
```

#### C# / .NET

```bash
dotnet add package Terrafusion.SDK
```

```csharp
using Terrafusion;

var client = new TerraFusionClient("YOUR_API_KEY");

var valuation = await client.Valuations.CreateAsync(new ValuationRequest
{
    Address = "123 Main St, Seattle, WA 98101",
    PropertyType = PropertyType.Residential
});

Console.WriteLine($"Value: ${valuation.EstimatedValue:N0}");
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid property address",
    "details": {
      "field": "address",
      "reason": "Could not geocode address"
    }
  },
  "request_id": "req_abc123"
}
```

### Common Error Codes

| Code                  | HTTP Status | Description              |
| --------------------- | ----------- | ------------------------ |
| `UNAUTHORIZED`        | 401         | Invalid or expired token |
| `FORBIDDEN`           | 403         | Insufficient permissions |
| `NOT_FOUND`           | 404         | Resource not found       |
| `VALIDATION_ERROR`    | 400         | Invalid request data     |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests        |
| `INTERNAL_ERROR`      | 500         | Server error             |
| `SERVICE_UNAVAILABLE` | 503         | Temporary outage         |

### Retry Strategy

```javascript
async function makeRequestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = error.headers['retry-after'] || Math.pow(2, i);
        await sleep(retryAfter * 1000);
      } else if (error.status >= 500) {
        // Server error - exponential backoff
        await sleep(Math.pow(2, i) * 1000);
      } else {
        // Client error - don't retry
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Best Practices

### 1. Batch Operations

Instead of making individual requests:

```javascript
// ❌ Don't do this
for (const address of addresses) {
  await client.valuations.create({ address });
}

// ✅ Do this
await client.valuations.createBatch({
  properties: addresses.map(a => ({ address: a })),
});
```

### 2. Cache Responses

Cache valuations to reduce API calls:

```javascript
const cache = new Map();

async function getValuation(address) {
  if (cache.has(address)) {
    const cached = cache.get(address);
    if (cached.timestamp > Date.now() - 3600000) {
      return cached.data;
    }
  }

  const valuation = await client.valuations.create({ address });
  cache.set(address, {
    data: valuation,
    timestamp: Date.now(),
  });

  return valuation;
}
```

### 3. Handle Rate Limits

```javascript
class RateLimiter {
  constructor(limit, window) {
    this.limit = limit;
    this.window = window;
    this.calls = [];
  }

  async throttle() {
    const now = Date.now();
    this.calls = this.calls.filter(t => t > now - this.window);

    if (this.calls.length >= this.limit) {
      const oldestCall = this.calls[0];
      const waitTime = this.window - (now - oldestCall);
      await sleep(waitTime);
    }

    this.calls.push(Date.now());
  }
}

const limiter = new RateLimiter(50, 1000); // 50 calls per second

async function makeRequest() {
  await limiter.throttle();
  return client.valuations.create({ ... });
}
```

---

## Support

### Commercial Support

- Email: api-support@terrafusion.com
- Phone: 1-888-TERRA-API
- Slack: terrafusion.slack.com (Professional+)

### Resources

- API Status: status.terrafusion.com
- Changelog: docs.terrafusion.com/changelog
- Community: community.terrafusion.com

### SLA

| Plan         | Uptime SLA | Support Response |
| ------------ | ---------- | ---------------- |
| Starter      | 99.5%      | 24 hours         |
| Professional | 99.9%      | 4 hours          |
| Enterprise   | 99.99%     | 1 hour           |

---

_API Version: 1.0.0 | Last Updated: January 2025_
