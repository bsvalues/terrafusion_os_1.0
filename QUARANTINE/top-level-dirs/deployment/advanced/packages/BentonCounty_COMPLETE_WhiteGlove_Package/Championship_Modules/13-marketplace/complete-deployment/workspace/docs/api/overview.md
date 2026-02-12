# Terrafusion API Overview

The Terrafusion platform provides a comprehensive suite of APIs designed for property intelligence, valuation, and analytics. Our APIs are built with modern REST principles, GraphQL capabilities, and real-time WebSocket connections.

## 🏗️ API Architecture

### Multi-Layered API Design
```
┌─────────────────────────────────────────┐
│            Client Applications          │
├─────────────────────────────────────────┤
│             API Gateway                 │
├─────────────────────────────────────────┤
│   REST API   │  GraphQL  │  WebSocket   │
├─────────────────────────────────────────┤
│          Core Business Logic           │
├─────────────────────────────────────────┤
│          Data Layer & ML Models        │
└─────────────────────────────────────────┘
```

## 🔌 API Types

### 1. REST API
- **Base URL**: `https://api.terrafusion.ai/v1`
- **Format**: JSON
- **Authentication**: JWT Bearer Token + API Key
- **Rate Limits**: 1000 requests/hour (Premium: 10,000)
- **HTTPS Only**: All endpoints require SSL

### 2. GraphQL API
- **Endpoint**: `https://api.terrafusion.ai/graphql`
- **Schema**: Self-documenting with introspection
- **Real-time**: Subscription support
- **Batching**: Multiple queries in single request

### 3. WebSocket API
- **Endpoint**: `wss://ws.terrafusion.ai/v1`
- **Real-time**: Property value updates, market alerts
- **Connection**: Persistent with auto-reconnection
- **Channels**: Subscribe to specific data streams

## 🔐 Authentication & Security

### API Key Authentication
```bash
curl -H "X-API-Key: your-api-key" \
     -H "Authorization: Bearer jwt-token" \
     https://api.terrafusion.ai/v1/properties
```

### JWT Token Structure
```json
{
  "sub": "user-id",
  "iss": "terrafusion.ai",
  "aud": "api.terrafusion.ai",
  "exp": 1625097600,
  "iat": 1625011200,
  "permissions": ["property:read", "valuation:write"],
  "tier": "premium"
}
```

## 📊 Core API Domains

### 1. Property Intelligence API
- **Properties**: CRUD operations, search, filtering
- **Valuations**: AI-powered property valuations
- **Comparables**: Find similar properties
- **Market Analysis**: Local market trends and insights

### 2. Geospatial API
- **GIS Data**: Property boundaries, zoning, utilities
- **Mapping**: Interactive maps and overlays
- **Location Services**: Geocoding, reverse geocoding
- **Spatial Analysis**: Distance, area, proximity calculations

### 3. Financial API
- **Investment Analysis**: ROI, cash flow, appreciation
- **Loan Analysis**: Mortgage calculations, affordability
- **Tax Assessment**: Property tax calculations
- **Portfolio Management**: Multi-property analytics

### 4. Market Intelligence API
- **Market Trends**: Price trends, inventory levels
- **Demographic Data**: Population, income, employment
- **Economic Indicators**: Interest rates, market conditions
- **Forecasting**: Predictive market analytics

## 🚀 Quick Start Examples

### Get Property Information
```bash
GET /v1/properties/{property-id}
```

### Search Properties
```bash
GET /v1/properties/search?location=Seattle&type=residential&max_price=500000
```

### Get Property Valuation
```bash
POST /v1/valuations
{
  "property_id": "prop_123",
  "valuation_type": "instant",
  "include_comparables": true
}
```

### GraphQL Query
```graphql
query PropertyWithValuation($id: ID!) {
  property(id: $id) {
    address
    sqft
    bedrooms
    bathrooms
    currentValuation {
      estimate
      confidence
      lastUpdated
    }
    marketTrends {
      oneYear
      threeYear
      fiveYear
    }
  }
}
```

## ⚡ Response Formats

### Standard Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-08-03T12:00:00Z",
    "version": "v1",
    "request_id": "req_abc123"
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "Property with ID 'prop_123' not found",
    "details": {
      "property_id": "prop_123",
      "suggestion": "Verify the property ID and try again"
    }
  },
  "meta": {
    "timestamp": "2025-08-03T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

## 📈 Rate Limits & Quotas

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1625097600
X-RateLimit-Retry-After: 60
```

### Subscription Tiers
| Tier | Requests/Hour | Real-time Streams | ML Valuations/Month |
|------|---------------|-------------------|---------------------|
| Free | 100 | 1 | 10 |
| Pro | 1,000 | 5 | 1,000 |
| Premium | 10,000 | 25 | 10,000 |
| Enterprise | Unlimited | Unlimited | Unlimited |

## 🔍 Error Handling

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Code Categories
- `PROPERTY_*` - Property-related errors
- `VALUATION_*` - Valuation service errors
- `AUTH_*` - Authentication/authorization errors
- `VALIDATION_*` - Input validation errors
- `RATE_LIMIT_*` - Rate limiting errors

## 📚 Additional Resources

- [REST API Reference](./rest-api.md)
- [GraphQL Schema](./graphql-api.md)
- [WebSocket Documentation](./websocket-api.md)
- [SDK Documentation](./sdks/)
- [Postman Collection](./postman/)
- [API Changelog](./changelog.md)

## 🧪 Testing & Development

### Sandbox Environment
- **Base URL**: `https://sandbox-api.terrafusion.ai/v1`
- **Test Data**: Synthetic property data for testing
- **Rate Limits**: Relaxed for development
- **API Keys**: Separate sandbox keys required

### Interactive API Explorer
Visit our [API Explorer](https://api.terrafusion.ai/docs) to:
- Browse all endpoints
- Test API calls directly
- View real-time responses
- Generate code samples

---

*For detailed endpoint documentation, see the specific API reference guides.*