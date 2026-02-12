# 🏆 Terrafusion API Reference
## Benton County Championship Demo - Complete API Documentation

---

## 📋 API Overview

**Base URL**: `http://localhost:3000`  
**Version**: 3.0.0  
**Authentication**: None (Demo Environment)  
**Response Format**: JSON  
**Rate Limiting**: 1000 requests/minute  

---

## 🎯 Demo Endpoints

### GET /api/demo/overview
**Description**: Comprehensive system overview with key metrics and application status  
**Authentication**: None  
**Response Time**: ~4ms  

**Response Example**:
```json
{
  "demo_name": "Benton County Championship Demo",
  "description": "Complete Terrafusion ecosystem showcase with real Benton County data",
  "total_properties": 45234,
  "total_levies": 12,
  "total_levy_amount": 52090000,
  "applications": [
    {
      "name": "TerraFusionSync",
      "tier": "Tier 1",
      "status": "Active",
      "endpoint": "/api/sync"
    }
  ]
}
```

### GET /api/demo/properties
**Description**: Real Benton County property data with comprehensive details  
**Parameters**: 
- `limit` (optional): Number of properties to return (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response Example**:
```json
{
  "metadata": {
    "county": "Benton County",
    "state": "Washington",
    "total_properties": 45234,
    "data_version": "3.0.0"
  },
  "properties": [
    {
      "property_id": "BC00123456",
      "parcel_number": "123456789",
      "address": {
        "street_number": "1234",
        "street_name": "Main Street",
        "city": "Kennewick",
        "state": "WA",
        "zip_code": "99336"
      },
      "property_type": "Residential",
      "assessment": {
        "land_value": 85000,
        "improvement_value": 165000,
        "total_value": 250000,
        "assessment_date": "2024-01-01"
      }
    }
  ]
}
```

### GET /api/demo/scenarios
**Description**: Available demonstration scenarios for different audiences  

**Response Example**:
```json
{
  "scenarios": [
    {
      "id": "property-assessment",
      "name": "Property Assessment Workflow",
      "duration": "15 minutes",
      "audience": "County Assessors, Property Managers",
      "description": "Complete property assessment workflow from search to reporting"
    }
  ]
}
```

### GET /api/demo/marketplace
**Description**: Terrafusion application marketplace with all available applications  

**Response Example**:
```json
{
  "marketplace": {
    "name": "Terrafusion Marketplace",
    "version": "2.0",
    "total_applications": 12,
    "applications": [
      {
        "name": "TerraFusionSync",
        "tier": "Tier1CoreFoundation",
        "status": "active",
        "compliance_score": 94,
        "health": "healthy"
      }
    ]
  }
}
```

### GET /api/demo/metrics
**Description**: Performance and business impact metrics  

**Response Example**:
```json
{
  "performance": {
    "response_time": "150ms",
    "uptime": "99.99%",
    "data_accuracy": "100%"
  },
  "business_impact": {
    "efficiency_gains": "50%",
    "cost_reduction": "30%",
    "time_savings": "60%"
  }
}
```

### GET /api/demo/health
**Description**: System health status with detailed diagnostics  

**Response Example**:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "response_time": 4,
  "error_rate": 0,
  "memory_usage": 55,
  "cpu_usage": 15,
  "active_alerts": 0,
  "timestamp": "2025-08-05T05:53:58.338Z"
}
```

---

## 📊 Monitoring Endpoints

### GET /api/monitoring/metrics
**Description**: Comprehensive system metrics for monitoring and analytics  

**Response Example**:
```json
{
  "requests": 1245,
  "responses": {
    "success": 1244,
    "errors": 1
  },
  "performance": {
    "avg_response_time": 4,
    "peak_memory": 55
  },
  "system": {
    "cpu_usage": 15,
    "memory_usage": 45,
    "uptime": 3600
  },
  "endpoints": {
    "/api/demo/overview": {
      "requests": 450,
      "avg_response_time": 3
    }
  }
}
```

### GET /api/monitoring/performance
**Description**: Performance metrics formatted for dashboard display  

**Response Example**:
```json
{
  "response_time": {
    "average": 4,
    "unit": "milliseconds"
  },
  "throughput": {
    "requests_per_minute": 75,
    "total_requests": 1245
  },
  "reliability": {
    "success_rate": 99,
    "error_rate": 1
  },
  "resource_usage": {
    "memory_mb": 55,
    "cpu_percent": 15
  }
}
```

### GET /api/monitoring/alerts
**Description**: Active system alerts and notifications  

**Response Example**:
```json
{
  "active_alerts": [
    {
      "type": "HIGH_RESPONSE_TIME",
      "message": "Response time exceeded 1000ms: 1250ms",
      "timestamp": "2025-08-05T05:53:58.338Z",
      "severity": "WARNING"
    }
  ],
  "total_alerts": 1,
  "last_updated": "2025-08-05T05:53:58.338Z"
}
```

---

## 💾 Backup & Recovery Endpoints

### GET /api/backup/list
**Description**: List available backups with metadata  

**Response Example**:
```json
{
  "backups": [
    {
      "name": "benton-county-backup-2025-08-05T05-53-58",
      "size_mb": 125,
      "created": "2025-08-05T05:53:58.338Z"
    }
  ],
  "backup_retention_days": 30,
  "next_scheduled_backup": "02:00 UTC daily"
}
```

### POST /api/backup/create
**Description**: Create on-demand backup  

**Response Example**:
```json
{
  "success": true,
  "backup": "benton-county-backup-2025-08-05T05-53-58.tar.gz",
  "size_mb": 125,
  "created": "2025-08-05T05:53:58.338Z"
}
```

### POST /api/backup/restore/:backupName
**Description**: Restore from specific backup  
**Parameters**: 
- `backupName`: Name of backup to restore from

**Response Example**:
```json
{
  "success": true,
  "manifest": {
    "backup_name": "benton-county-backup-2025-08-05T05-53-58",
    "timestamp": "2025-08-05T05:53:58.338Z",
    "integrity": {
      "total_files": 125,
      "backup_size_mb": 125
    }
  }
}
```

---

## 🔧 Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |
| 503 | Service Unavailable | Service temporarily unavailable |

**Error Response Format**:
```json
{
  "error": {
    "code": 404,
    "message": "Resource not found",
    "timestamp": "2025-08-05T05:53:58.338Z"
  }
}
```

---

## 📈 Performance Characteristics

### Response Times
- Demo endpoints: 3-5ms average
- Monitoring endpoints: 5-10ms average
- Backup operations: 1-5 seconds
- Health checks: <2ms

### Rate Limits
- General API: 1000 requests/minute
- Monitoring endpoints: 600 requests/minute
- Backup operations: 10 requests/minute

### Data Freshness
- Property data: Updated daily
- Metrics: Real-time (30-second intervals)
- Health status: Real-time
- Backup status: Updated on creation

---

## 🛡️ Security Considerations

### Data Protection
- All responses use HTTPS in production
- Sensitive data is filtered from responses
- No authentication required for demo environment
- Production requires API key authentication

### CORS Policy
- Allows all origins in demo mode
- Production restricts to approved domains
- Preflight requests supported for complex requests

### Input Validation
- All parameters validated server-side
- SQL injection protection enabled
- XSS protection headers included
- Request size limits enforced

---

## 📊 Usage Examples

### JavaScript/Fetch
```javascript
// Get system overview
const overview = await fetch('/api/demo/overview')
  .then(response => response.json());

// Get properties with pagination
const properties = await fetch('/api/demo/properties?limit=5&offset=10')
  .then(response => response.json());

// Monitor performance
const performance = await fetch('/api/monitoring/performance')
  .then(response => response.json());
```

### cURL Examples
```bash
# System health check
curl -X GET http://localhost:3000/api/demo/health

# Get property data
curl -X GET "http://localhost:3000/api/demo/properties?limit=3"

# Create backup
curl -X POST http://localhost:3000/api/backup/create

# Get performance metrics
curl -X GET http://localhost:3000/api/monitoring/performance
```

### Python/Requests
```python
import requests

# Get overview data
response = requests.get('http://localhost:3000/api/demo/overview')
overview = response.json()

# Monitor system performance
performance = requests.get('http://localhost:3000/api/monitoring/performance').json()
print(f"Response time: {performance['response_time']['average']}ms")
```

---

## 🔄 Webhook Support

### Available Webhooks
- System alerts: `POST /webhooks/alerts`
- Backup completion: `POST /webhooks/backup-complete`
- Performance thresholds: `POST /webhooks/performance`

### Webhook Payload Example
```json
{
  "event": "backup_completed",
  "timestamp": "2025-08-05T05:53:58.338Z",
  "data": {
    "backup_name": "benton-county-backup-2025-08-05T05-53-58.tar.gz",
    "size_mb": 125,
    "duration_seconds": 45
  }
}
```

---

## 📚 Additional Resources

- **Postman Collection**: Available in `/docs/api/postman/`
- **OpenAPI Spec**: Available at `/api/openapi.json`
- **Interactive Docs**: Available at `/api-docs`
- **Rate Limit Headers**: Included in all responses
- **Health Dashboard**: Available at `/health-dashboard`

---

*Built with championship precision for government excellence*  
*Terrafusion API v3.0.0 - Where Performance Meets Innovation*