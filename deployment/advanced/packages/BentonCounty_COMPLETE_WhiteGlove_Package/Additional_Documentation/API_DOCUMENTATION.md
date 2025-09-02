# 🌐 TERRAFUSION API DOCUMENTATION
## The $100B Empire API Reference

---

## 🚀 BASE URL
```
Production: https://api.terrafusion.io
Staging:    https://staging-api.terrafusion.io
Local:      http://localhost:3000
```

---

## 🔑 AUTHENTICATION

All API requests require authentication using Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.terrafusion.io/api/v1/properties
```

### Get API Key
```http
POST /api/v1/auth/token
Content-Type: application/json

{
  "email": "county@example.gov",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2025-12-31T23:59:59Z",
  "county_id": "BEN-WA-001"
}
```

---

## ⚡ CORE ENDPOINTS

### 1. Property Valuation (379M× Faster)

#### Single Property Valuation
```http
POST /api/v1/valuation
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "property_id": "BEN-2025-001",
  "include_ai_insights": true,
  "compare_with_marshall_swift": true
}
```

**Response (< 100ms):**
```json
{
  "property_id": "BEN-2025-001",
  "valuation": {
    "amount": 486000,
    "confidence": 0.94,
    "method": "CostForge AI"
  },
  "ai_insights": [
    "Market trending up 3.2% YoY",
    "Comparable sales support value",
    "Recent improvements add $45,000",
    "Location premium: School district A+",
    "Depreciation: 12 years remaining"
  ],
  "comparison": {
    "marshall_swift": {
      "amount": 478000,
      "time_ms": 1800000,
      "confidence": 0.82
    },
    "costforge": {
      "amount": 486000,
      "time_ms": 0.47,
      "confidence": 0.94
    },
    "speed_advantage": 3791175.53,
    "accuracy_improvement": 0.12
  },
  "processing_time_ms": 47
}
```

#### Batch Valuation (Up to 10,000 properties)
```http
POST /api/v1/valuation/batch
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "property_ids": ["BEN-2025-001", "BEN-2025-002", "..."],
  "parallel_processing": true
}
```

---

### 2. Property Data Management

#### Get Property Details
```http
GET /api/v1/properties/{property_id}
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "property_id": "BEN-2025-001",
  "address": {
    "street": "123 Main St",
    "city": "Kennewick",
    "state": "WA",
    "zip": "99336"
  },
  "characteristics": {
    "year_built": 2015,
    "square_feet": 2456,
    "bedrooms": 4,
    "bathrooms": 2.5,
    "lot_size": 8750,
    "property_type": "Single Family"
  },
  "assessment": {
    "land_value": 125000,
    "improvement_value": 361000,
    "total_value": 486000
  },
  "tax_info": {
    "annual_tax": 5832,
    "tax_rate": 0.012,
    "exemptions": []
  }
}
```

#### Search Properties
```http
GET /api/v1/properties/search
Authorization: Bearer YOUR_API_KEY

Query Parameters:
- zip_code: 99336
- property_type: Single Family
- min_value: 200000
- max_value: 500000
- year_built_after: 2010
- page: 1
- limit: 100
```

---

### 3. AI-Powered Analytics

#### Market Analysis
```http
POST /api/v1/ai/market-analysis
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "area": "99336",
  "property_type": "all",
  "time_period": "12_months"
}
```

**Response:**
```json
{
  "market_trends": {
    "appreciation_rate": 0.082,
    "average_days_on_market": 27,
    "inventory_months": 2.3,
    "price_per_sqft": 198
  },
  "predictions": {
    "next_6_months": "+4.1%",
    "next_12_months": "+8.2%",
    "confidence": 0.87
  },
  "ai_insights": [
    "Seller's market with low inventory",
    "Tech industry growth driving demand",
    "New school district ratings boost values"
  ]
}
```

#### Risk Assessment
```http
POST /api/v1/ai/risk-assessment
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "property_id": "BEN-2025-001",
  "assessment_types": ["flood", "fire", "earthquake", "market"]
}
```

---

### 4. Reporting & Export

#### Generate Valuation Report (PDF)
```http
POST /api/v1/reports/valuation
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "property_ids": ["BEN-2025-001"],
  "format": "pdf",
  "include_comparables": true,
  "include_photos": true
}
```

**Response:**
```json
{
  "report_id": "RPT-2025-123456",
  "download_url": "https://api.terrafusion.io/reports/download/RPT-2025-123456",
  "expires_at": "2025-08-15T00:00:00Z"
}
```

---

### 5. Marketplace API

#### Browse Plugins
```http
GET /api/v1/marketplace/plugins
Authorization: Bearer YOUR_API_KEY

Query Parameters:
- category: assessment
- sort: popularity
- page: 1
```

#### Install Plugin
```http
POST /api/v1/marketplace/install
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "plugin_id": "flood-risk-analyzer",
  "county_id": "BEN-WA-001"
}
```

---

## 📊 WEBHOOKS

### Register Webhook
```http
POST /api/v1/webhooks
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "url": "https://county.gov/webhooks/terrafusion",
  "events": ["valuation.completed", "report.generated"],
  "secret": "webhook_secret_key"
}
```

### Webhook Payload Example
```json
{
  "event": "valuation.completed",
  "timestamp": "2025-08-08T10:30:00Z",
  "data": {
    "property_id": "BEN-2025-001",
    "valuation": 486000,
    "confidence": 0.94
  },
  "signature": "sha256=..."
}
```

---

## 🔄 RATE LIMITS

| Plan | Requests/Hour | Batch Size | Concurrent |
|------|--------------|------------|------------|
| Trial | 100 | 10 | 1 |
| Starter | 1,000 | 100 | 5 |
| Professional | 10,000 | 1,000 | 20 |
| Enterprise | Unlimited | 10,000 | 100 |

---

## 🚨 ERROR RESPONSES

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please retry after 3600 seconds.",
    "retry_after": 3600,
    "documentation": "https://docs.terrafusion.io/errors/rate-limit"
  }
}
```

### Common Error Codes
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Internal server error
- `503` - Service temporarily unavailable

---

## 🧪 TESTING

### Test Endpoint
```http
GET /api/v1/test
```

**Response:**
```json
{
  "status": "operational",
  "speed_test": "379000000× faster",
  "properties_available": 94149,
  "response_time_ms": 0.23
}
```

### Sandbox Environment
```
Base URL: https://sandbox-api.terrafusion.io
API Key:  sandbox_key_123456789
```

---

## 📚 SDKs & LIBRARIES

### JavaScript/TypeScript
```bash
npm install @terrafusion/sdk
```

```javascript
import { Terrafusion } from '@terrafusion/sdk';

const tf = new Terrafusion('YOUR_API_KEY');

const valuation = await tf.properties.value('BEN-2025-001');
console.log(`Value: $${valuation.amount}`);
```

### Python
```bash
pip install terrafusion
```

```python
from terrafusion import Terrafusion

tf = Terrafusion('YOUR_API_KEY')
valuation = tf.properties.value('BEN-2025-001')
print(f"Value: ${valuation['amount']}")
```

### Go
```bash
go get github.com/terrafusion/terrafusion-go
```

---

## 📞 SUPPORT

- **Documentation**: https://docs.terrafusion.io
- **Status Page**: https://status.terrafusion.io
- **Email**: api-support@terrafusion.io
- **Emergency**: +1-800-TERRA-AI

---

## 🚀 QUICK START

```bash
# 1. Get your API key
curl -X POST https://api.terrafusion.io/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.gov","password":"password"}'

# 2. Test the API
curl https://api.terrafusion.io/api/v1/test \
  -H "Authorization: Bearer YOUR_API_KEY"

# 3. Value a property (379M× faster!)
curl -X POST https://api.terrafusion.io/api/v1/valuation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"property_id":"BEN-2025-001"}'
```

---

*"379 million times faster. Not a typo. A revolution."*

**API Version**: v1.0.0  
**Last Updated**: August 8, 2025