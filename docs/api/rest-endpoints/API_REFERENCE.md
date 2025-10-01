# TerraFusion OS API Reference
## Complete REST API Documentation

### 🌐 Base URL
```
Production: https://terrafusion.bentoncounty.gov/api
Development: http://localhost:5000/api
```

### 🔐 Authentication
All API requests require authentication using Bearer tokens.

```bash
# Obtain authentication token
curl -X POST https://terrafusion.bentoncounty.gov/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://terrafusion.bentoncounty.gov/api/properties
```

### 📊 Property Assessment API

#### Get All Properties
```http
GET /api/properties
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 100)
- `filter` (string): Filter criteria
- `sort` (string): Sort field and direction

**Response:**
```json
{
  "data": [
    {
      "id": "12345",
      "parcel_number": "R1234567890",
      "address": "123 Main St, Prosser, WA 99350",
      "assessed_value": 250000,
      "market_value": 275000,
      "property_type": "residential",
      "last_updated": "2025-09-19T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 892,
    "total_records": 89247,
    "per_page": 100
  }
}
```

#### Get Property by ID
```http
GET /api/properties/{property_id}
```

**Response:**
```json
{
  "id": "12345",
  "parcel_number": "R1234567890",
  "address": "123 Main St, Prosser, WA 99350",
  "owner": {
    "name": "John Smith",
    "mailing_address": "123 Main St, Prosser, WA 99350"
  },
  "assessment": {
    "land_value": 75000,
    "improvement_value": 175000,
    "total_assessed": 250000,
    "assessment_year": 2025
  },
  "characteristics": {
    "year_built": 1985,
    "square_feet": 2400,
    "bedrooms": 4,
    "bathrooms": 2.5,
    "lot_size": 0.25
  }
}
```

#### Update Property Assessment
```http
PUT /api/properties/{property_id}/assessment
```

**Request Body:**
```json
{
  "land_value": 80000,
  "improvement_value": 180000,
  "assessment_reason": "Market adjustment",
  "effective_date": "2025-01-01"
}
```

### 💰 Tax Collection API

#### Get Tax Account
```http
GET /api/tax-accounts/{account_id}
```

**Response:**
```json
{
  "account_id": "TAX-12345",
  "parcel_number": "R1234567890",
  "taxpayer": {
    "name": "John Smith",
    "address": "123 Main St, Prosser, WA 99350"
  },
  "current_balance": 3250.75,
  "payment_history": [
    {
      "date": "2025-08-15",
      "amount": 1625.00,
      "type": "partial_payment",
      "method": "check"
    }
  ],
  "due_dates": {
    "first_half": "2025-04-30",
    "second_half": "2025-10-31"
  }
}
```

#### Process Payment
```http
POST /api/tax-accounts/{account_id}/payments
```

**Request Body:**
```json
{
  "amount": 1625.00,
  "payment_method": "credit_card",
  "payment_date": "2025-09-19",
  "reference_number": "CC-789456123"
}
```

### 👥 Citizen Services API

#### Get Service Requests
```http
GET /api/service-requests
```

**Query Parameters:**
- `status` (string): open, in_progress, closed
- `department` (string): Filter by department
- `date_from` (string): Start date (YYYY-MM-DD)
- `date_to` (string): End date (YYYY-MM-DD)

**Response:**
```json
{
  "data": [
    {
      "id": "SR-2025-001234",
      "type": "pothole_repair",
      "status": "in_progress",
      "citizen": {
        "name": "Jane Doe",
        "email": "jane.doe@email.com",
        "phone": "(509) 555-0123"
      },
      "location": "Main St & 1st Ave",
      "description": "Large pothole causing vehicle damage",
      "priority": "high",
      "created_date": "2025-09-15T09:00:00Z",
      "assigned_to": "Public Works"
    }
  ]
}
```

#### Create Service Request
```http
POST /api/service-requests
```

**Request Body:**
```json
{
  "type": "pothole_repair",
  "citizen_name": "Jane Doe",
  "citizen_email": "jane.doe@email.com",
  "citizen_phone": "(509) 555-0123",
  "location": "Main St & 1st Ave",
  "description": "Large pothole causing vehicle damage",
  "priority": "medium"
}
```

### 🤖 AI Swarm API

#### Get AI Swarm Status
```http
GET /api/ai-swarm/status
```

**Response:**
```json
{
  "supreme_commander": {
    "status": "online",
    "last_heartbeat": "2025-09-19T10:29:45Z"
  },
  "total_agents": 49847,
  "active_agents": 49821,
  "field_generals": 1220,
  "operational_forces": 48627,
  "performance_metrics": {
    "average_response_time": "0.8ms",
    "task_completion_rate": "99.97%",
    "coordination_efficiency": "ELITE"
  }
}
```

#### Submit Task to AI Swarm
```http
POST /api/ai-swarm/tasks
```

**Request Body:**
```json
{
  "task_type": "property_analysis",
  "parameters": {
    "parcel_number": "R1234567890",
    "analysis_type": "market_comparison"
  },
  "priority": "normal",
  "department": "assessment"
}
```

### 🏗️ Module Management API

#### Get Available Modules
```http
GET /api/modules
```

**Response:**
```json
{
  "modules": [
    {
      "id": "ai-swarm",
      "name": "AI Swarm Coordination",
      "version": "1.0.0",
      "status": "active",
      "health": "healthy",
      "price": "$147/month"
    },
    {
      "id": "costforge-ai",
      "name": "CostForge AI Valuation",
      "version": "2.1.0",
      "status": "active",
      "health": "healthy",
      "price": "$89/month"
    }
  ]
}
```

#### Install Module
```http
POST /api/modules/{module_id}/install
```

**Request Body:**
```json
{
  "configuration": {
    "department": "assessment",
    "access_level": "department_staff",
    "auto_start": true
  }
}
```

### 📈 Analytics and Reporting API

#### Get Performance Metrics
```http
GET /api/analytics/performance
```

**Query Parameters:**
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)
- `metric_type` (string): response_time, throughput, errors

**Response:**
```json
{
  "metrics": {
    "average_response_time": 42.5,
    "total_requests": 125847,
    "error_rate": 0.02,
    "uptime_percentage": 99.97
  },
  "time_series": [
    {
      "timestamp": "2025-09-19T10:00:00Z",
      "value": 45.2
    }
  ]
}
```

### 🔐 Security API

#### Get Audit Logs
```http
GET /api/security/audit-logs
```

**Query Parameters:**
- `user_id` (string): Filter by user
- `action` (string): Filter by action type
- `start_date` (string): Start date
- `end_date` (string): End date

**Response:**
```json
{
  "logs": [
    {
      "id": "audit-12345",
      "timestamp": "2025-09-19T10:30:00Z",
      "user_id": "john.smith",
      "action": "property_update",
      "resource": "property/12345",
      "ip_address": "192.168.1.100",
      "result": "success"
    }
  ]
}
```

### 📱 Error Handling

All API endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than 0"
      }
    ],
    "request_id": "req-12345"
  }
}
```

### 🚀 Rate Limiting

API requests are rate limited to ensure system stability:
- **Government Staff**: 1000 requests/hour
- **System Integration**: 5000 requests/hour
- **Public API**: 100 requests/hour

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1632960000
```

### 📊 Webhooks

TerraFusion OS supports webhooks for real-time notifications:

#### Webhook Events
- `property.updated` - Property assessment changed
- `payment.received` - Tax payment processed
- `service_request.created` - New citizen service request
- `emergency.alert` - Emergency notification

#### Webhook Configuration
```http
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-system.com/webhooks/terrafusion",
  "events": ["property.updated", "payment.received"],
  "secret": "your_webhook_secret"
}
```

---

**Document Information**
- Version: 1.0 Production API
- Classification: Technical Documentation - Internal Use
- Owner: TerraFusion Development Team
- Last Updated: September 19, 2025
- Review Schedule: After each API version release
