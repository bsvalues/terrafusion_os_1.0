# 🚀 TERRAFUSION API DOCUMENTATION
## Infrastructure Intelligence, Infinite Scale

---

## 📋 API Overview

**Base URL**: `https://api.terrafusionmarket.io`  
**Version**: 1.0.0  
**Authentication**: Bearer Token / API Key  
**Rate Limit**: 1000 requests/minute  

---

## 🔐 Authentication

### API Key Authentication
```http
GET /api/v1/properties
Authorization: Bearer YOUR_API_KEY_HERE
```

### OAuth 2.0 Flow
```javascript
// Authorization URL
https://api.terrafusionmarket.io/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=read:properties write:assessments

// Token Exchange
POST /oauth/token
{
  "grant_type": "authorization_code",
  "code": "AUTH_CODE",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

---

## 🏠 Property Assessment API

### Get Property Details
```http
GET /api/v1/properties/{propertyId}
```

**Response**:
```json
{
  "propertyId": "BEN-2025-000001",
  "address": "123 Main St, Benton County",
  "owner": "John Doe",
  "assessment": {
    "landValue": 150000,
    "improvementValue": 350000,
    "totalValue": 500000,
    "lastAssessed": "2025-01-11",
    "confidence": 0.94
  },
  "characteristics": {
    "squareFeet": 2500,
    "bedrooms": 4,
    "bathrooms": 3,
    "yearBuilt": 2005,
    "lotSize": 0.25
  }
}
```

### Batch Property Lookup
```http
POST /api/v1/properties/batch
Content-Type: application/json

{
  "propertyIds": [
    "BEN-2025-000001",
    "BEN-2025-000002",
    "BEN-2025-000003"
  ]
}
```

### Search Properties
```http
GET /api/v1/properties/search?
  address=Main%20St&
  minValue=100000&
  maxValue=500000&
  limit=50&
  offset=0
```

---

## 💰 CostForge AI Valuation API

### Request Valuation
```http
POST /api/v1/costforge/valuation
Content-Type: application/json

{
  "propertyId": "BEN-2025-000001",
  "method": "comparative",
  "includeConfidence": true,
  "includeComparables": true
}
```

**Response**:
```json
{
  "valuationId": "VAL-2025-ABC123",
  "propertyId": "BEN-2025-000001",
  "timestamp": "2025-01-11T08:30:00Z",
  "valuation": {
    "method": "comparative",
    "estimatedValue": 525000,
    "confidence": 0.94,
    "range": {
      "low": 498750,
      "high": 551250
    }
  },
  "comparables": [
    {
      "propertyId": "BEN-2025-000045",
      "address": "456 Oak Ave",
      "salePrice": 515000,
      "saleDate": "2024-12-15",
      "similarity": 0.92
    }
  ],
  "processingTime": "3.2s",
  "speedFactor": "379000000x"
}
```

### Bulk Valuation
```http
POST /api/v1/costforge/bulk-valuation
Content-Type: application/json

{
  "propertyIds": ["BEN-2025-000001", "BEN-2025-000002"],
  "method": "all",
  "priority": "high"
}
```

---

## 🗺️ GIS Mapping API

### Get Parcel Geometry
```http
GET /api/v1/gis/parcels/{parcelId}/geometry
```

**Response**:
```json
{
  "parcelId": "BEN-PARCEL-12345",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-122.4194, 47.2529],
        [-122.4190, 47.2529],
        [-122.4190, 47.2525],
        [-122.4194, 47.2525],
        [-122.4194, 47.2529]
      ]
    ]
  },
  "area": 10890,
  "perimeter": 420
}
```

### Search by Location
```http
POST /api/v1/gis/search/location
Content-Type: application/json

{
  "latitude": 47.2529,
  "longitude": -122.4194,
  "radius": 500,
  "units": "meters"
}
```

### Get Zoning Information
```http
GET /api/v1/gis/zoning/{parcelId}
```

---

## 💳 Tax Management API

### Calculate Property Tax
```http
POST /api/v1/tax/calculate
Content-Type: application/json

{
  "propertyId": "BEN-2025-000001",
  "taxYear": 2025,
  "includeExemptions": true
}
```

**Response**:
```json
{
  "propertyId": "BEN-2025-000001",
  "taxYear": 2025,
  "assessment": {
    "taxableValue": 500000,
    "exemptions": [
      {
        "type": "homestead",
        "amount": 50000
      }
    ],
    "netTaxableValue": 450000
  },
  "taxes": {
    "county": 4500,
    "school": 5400,
    "city": 2250,
    "special": 900,
    "total": 13050
  },
  "dueDate": "2025-04-30",
  "installments": [
    {
      "number": 1,
      "amount": 6525,
      "dueDate": "2025-04-30"
    },
    {
      "number": 2,
      "amount": 6525,
      "dueDate": "2025-10-31"
    }
  ]
}
```

### Get Tax History
```http
GET /api/v1/tax/history/{propertyId}?years=5
```

---

## 📋 Permit Management API

### Submit Permit Application
```http
POST /api/v1/permits/apply
Content-Type: application/json

{
  "applicationType": "building",
  "propertyId": "BEN-2025-000001",
  "description": "Kitchen remodel",
  "estimatedCost": 25000,
  "contractor": {
    "name": "ABC Construction",
    "license": "CONT-12345"
  }
}
```

### Check Permit Status
```http
GET /api/v1/permits/{permitId}/status
```

### Get Permit History
```http
GET /api/v1/permits/property/{propertyId}
```

---

## 📊 Analytics & Reporting API

### Generate Market Report
```http
POST /api/v1/analytics/market-report
Content-Type: application/json

{
  "area": "Benton County",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "metrics": ["median_price", "sales_volume", "days_on_market"]
}
```

### Get County Statistics
```http
GET /api/v1/analytics/county-stats
```

**Response**:
```json
{
  "county": "Benton",
  "statistics": {
    "totalProperties": 94149,
    "totalAssessedValue": 47074500000,
    "averagePropertyValue": 500000,
    "medianPropertyValue": 425000,
    "propertyTypes": {
      "residential": 75000,
      "commercial": 15000,
      "agricultural": 4149
    }
  },
  "lastUpdated": "2025-01-11T08:00:00Z"
}
```

---

## 🤖 AI Swarm API

### Deploy Agent Task
```http
POST /api/v1/swarm/deploy
Content-Type: application/json

{
  "taskType": "mass_valuation",
  "parameters": {
    "county": "Benton",
    "propertyCount": 1000,
    "priority": "high"
  },
  "agents": {
    "coordinators": 5,
    "workers": 100
  }
}
```

### Monitor Swarm Status
```http
GET /api/v1/swarm/status/{taskId}
```

---

## 🔔 Webhooks

### Register Webhook
```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "events": [
    "property.assessed",
    "permit.approved",
    "tax.calculated"
  ],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload Example
```json
{
  "event": "property.assessed",
  "timestamp": "2025-01-11T08:30:00Z",
  "data": {
    "propertyId": "BEN-2025-000001",
    "previousValue": 475000,
    "newValue": 500000,
    "changePercent": 5.26
  },
  "signature": "sha256=abcd1234..."
}
```

---

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "Property with ID BEN-2025-999999 not found",
    "details": {
      "propertyId": "BEN-2025-999999",
      "timestamp": "2025-01-11T08:30:00Z"
    }
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 📈 Rate Limiting

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641900000
```

### Rate Limit Tiers
| Tier | Requests/Minute | Requests/Day |
|------|----------------|--------------|
| Free | 100 | 10,000 |
| Pro | 1,000 | 100,000 |
| Enterprise | 10,000 | Unlimited |

---

## 🧪 Testing Endpoints

### Health Check
```http
GET /api/v1/health
```

### API Status
```http
GET /api/v1/status
```

**Response**:
```json
{
  "status": "operational",
  "version": "1.0.0",
  "uptime": 864000,
  "services": {
    "database": "healthy",
    "costforge": "healthy",
    "gis": "healthy"
  }
}
```

---

## 🔧 SDKs & Libraries

### JavaScript/TypeScript
```javascript
import { TerraFusionClient } from '@terrafusion/sdk';

const client = new TerraFusionClient({
  apiKey: 'YOUR_API_KEY',
  environment: 'production'
});

const property = await client.properties.get('BEN-2025-000001');
const valuation = await client.costforge.valuate(property.id);
```

### Python
```python
from terrafusion import TerraFusionAPI

api = TerraFusionAPI(api_key='YOUR_API_KEY')

property = api.properties.get('BEN-2025-000001')
valuation = api.costforge.valuate(property['id'])
```

### cURL Examples
```bash
# Get property
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.terrafusionmarket.io/api/v1/properties/BEN-2025-000001

# Request valuation
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"BEN-2025-000001","method":"comparative"}' \
  https://api.terrafusionmarket.io/api/v1/costforge/valuation
```

---

## 📞 Support & Resources

- **API Status**: status.terrafusionmarket.io
- **Developer Portal**: developers.terrafusionmarket.io
- **Support Email**: api-support@terrafusionmarket.io
- **GitHub**: github.com/terrafusion/api-docs
- **Postman Collection**: [Download](https://api.terrafusionmarket.io/postman)

---

**Last Updated**: January 11, 2025  
**Version**: 1.0.0  
**Infrastructure Intelligence, Infinite Scale**