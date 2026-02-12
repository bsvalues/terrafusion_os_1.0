# TerraFusion Federation System - API Reference Documentation

## Overview

The TerraFusion Federation System provides a comprehensive REST API and WebSocket interface for real-time government-grade federation management. This document details all available endpoints, request/response formats, authentication requirements, and integration examples.

**Base URL:** `https://api.terrafusion.gov`  
**WebSocket URL:** `wss://api.terrafusion.gov/ws`  
**API Version:** v1.0.0  
**Authentication:** JWT Bearer Token  

## Authentication

### JWT Token Authentication

All API requests must include a valid JWT token in the Authorization header.

```http
Authorization: Bearer <jwt_token>
```

### Token Acquisition

**Endpoint:** `POST /auth/token`

**Request:**
```json
{
  "username": "admin@agency.gov",
  "password": "secure_password",
  "mfa_code": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

### Token Refresh

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

## Core API Endpoints

### Federation Dashboard

#### Get System Metrics

**Endpoint:** `GET /api/federation/dashboard`

**Description:** Retrieves comprehensive federation system metrics and health data.

**Headers:**
```http
Authorization: Bearer <token>
Accept: application/json
```

**Response:**
```json
{
  "timestamp": 1729123456789,
  "total_counties": 3,
  "active_counties": 3,
  "total_connections": 4,
  "active_connections": 4,
  "avg_latency_ms": 45.2,
  "total_throughput_gbps": 12.8,
  "security_incidents": 0,
  "system_health": 0.997,
  "geographic_coverage": 0.98,
  "redundancy_factor": 2.5,
  "api_version": "1.0.0",
  "last_updated": 1729123456789,
  "source": "terrafusion-backend"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal Server Error
- `503` - Service Unavailable

### County Management

#### Get All Counties

**Endpoint:** `GET /api/federation/counties`

**Description:** Retrieves all county nodes in the federation system.

**Query Parameters:**
- `status` (optional): Filter by status (`Online`, `Degraded`, `Offline`, `Maintenance`)
- `security_level` (optional): Filter by security clearance level
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Result offset for pagination (default: 0)

**Example Request:**
```http
GET /api/federation/counties?status=Online&limit=50&offset=0
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "fips_code": "06037",
    "county_name": "Los Angeles County",
    "state_code": "CA",
    "coordinates": [-118.2437, 34.0522],
    "population": 10014009,
    "active_connections": 2,
    "total_throughput_mbps": 850.5,
    "avg_latency_ms": 12.3,
    "status": "Online",
    "last_updated": 1729123456789,
    "security_clearance": "Confidential"
  },
  {
    "fips_code": "36061",
    "county_name": "New York County",
    "state_code": "NY",
    "coordinates": [-73.9712, 40.7831],
    "population": 1694251,
    "active_connections": 1,
    "total_throughput_mbps": 720.8,
    "avg_latency_ms": 8.7,
    "status": "Online",
    "last_updated": 1729123456789,
    "security_clearance": "Secret"
  }
]
```

#### Get County Details

**Endpoint:** `GET /api/federation/counties/{fips_code}`

**Description:** Retrieves detailed information for a specific county.

**Path Parameters:**
- `fips_code` (string): County FIPS code (e.g., "06037")

**Response:**
```json
{
  "fips_code": "06037",
  "county_name": "Los Angeles County",
  "state_code": "CA",
  "coordinates": [-118.2437, 34.0522],
  "population": 10014009,
  "active_connections": 2,
  "total_throughput_mbps": 850.5,
  "avg_latency_ms": 12.3,
  "status": "Online",
  "last_updated": 1729123456789,
  "security_clearance": "Confidential",
  "detailed_metrics": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "network_utilization": 34.5,
    "storage_usage": 23.1
  },
  "connection_history": [
    {
      "timestamp": 1729123456000,
      "connection_count": 2,
      "throughput_mbps": 850.5
    }
  ]
}
```

#### Update County Status

**Endpoint:** `PUT /api/federation/counties/{fips_code}/status`

**Description:** Updates the operational status of a county node.

**Request Body:**
```json
{
  "status": "Maintenance",
  "reason": "Scheduled maintenance window",
  "estimated_completion": "2025-10-16T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "County status updated successfully",
  "updated_at": 1729123456789
}
```

### Connection Management

#### Get All Connections

**Endpoint:** `GET /api/federation/connections`

**Description:** Retrieves all inter-county connections.

**Query Parameters:**
- `status` (optional): Filter by connection status
- `connection_type` (optional): Filter by type (`Primary`, `Backup`, `Emergency`, `Satellite`)
- `security_level` (optional): Filter by security level
- `source_county` (optional): Filter by source county name
- `target_county` (optional): Filter by target county name

**Response:**
```json
[
  {
    "id": "conn-la-ny-001",
    "source_county": "Los Angeles County",
    "target_county": "New York County",
    "source_fips": "06037",
    "target_fips": "36061",
    "status": "Active",
    "latency_ms": 76.2,
    "throughput_mbps": 2850.5,
    "last_updated": 1729123456789,
    "connection_type": "Primary",
    "security_level": "Confidential",
    "packet_loss_percent": 0.02,
    "bandwidth_utilization": 0.67
  }
]
```

#### Get Connection Details

**Endpoint:** `GET /api/federation/connections/{connection_id}`

**Description:** Retrieves detailed information for a specific connection.

**Response:**
```json
{
  "id": "conn-la-ny-001",
  "source_county": "Los Angeles County",
  "target_county": "New York County",
  "source_fips": "06037",
  "target_fips": "36061",
  "status": "Active",
  "latency_ms": 76.2,
  "throughput_mbps": 2850.5,
  "last_updated": 1729123456789,
  "connection_type": "Primary",
  "security_level": "Confidential",
  "packet_loss_percent": 0.02,
  "bandwidth_utilization": 0.67,
  "performance_history": [
    {
      "timestamp": 1729123456000,
      "latency_ms": 76.2,
      "throughput_mbps": 2850.5,
      "packet_loss_percent": 0.02
    }
  ],
  "health_checks": {
    "last_check": 1729123456789,
    "status": "healthy",
    "response_time_ms": 45
  }
}
```

#### Test Connection

**Endpoint:** `POST /api/federation/connections/{connection_id}/test`

**Description:** Initiates a connection health test.

**Request Body:**
```json
{
  "test_type": "full",
  "timeout_seconds": 30
}
```

**Response:**
```json
{
  "test_id": "test-12345",
  "status": "running",
  "estimated_completion": "2025-10-16T12:05:00Z"
}
```

### Health and Monitoring

#### System Health Check

**Endpoint:** `GET /health`

**Description:** Basic system health endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1729123456789,
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "external_api": "healthy"
  }
}
```

#### Detailed System Status

**Endpoint:** `GET /api/system/status`

**Description:** Comprehensive system status information.

**Response:**
```json
{
  "system": {
    "status": "operational",
    "uptime_seconds": 86400,
    "load_average": [0.45, 0.52, 0.48],
    "memory_usage": {
      "used_mb": 1024,
      "total_mb": 4096,
      "percentage": 25.0
    },
    "cpu_usage": 15.2
  },
  "services": {
    "federation_service": "active",
    "websocket_service": "active",
    "monitoring_service": "active"
  },
  "metrics": {
    "active_connections": 1542,
    "requests_per_minute": 2850,
    "error_rate": 0.02
  }
}
```

## WebSocket API

### Connection Establishment

**Endpoint:** `wss://api.terrafusion.gov/ws/federation`

**Authentication:** Include JWT token as query parameter or in Sec-WebSocket-Protocol header.

```javascript
const ws = new WebSocket('wss://api.terrafusion.gov/ws/federation?token=<jwt_token>');
```

### Message Format

All WebSocket messages follow a standardized format:

```json
{
  "message_type": "string",
  "timestamp": 1729123456789,
  "data": {}
}
```

### Message Types

#### Initial Data (`federation_initial_data`)

Sent immediately after connection establishment.

```json
{
  "message_type": "federation_initial_data",
  "timestamp": 1729123456789,
  "data": {
    "counties": [...],
    "connections": [...]
  }
}
```

#### Real-time Metrics (`federation_metrics`)

Periodic system metrics updates (every 30 seconds).

```json
{
  "message_type": "federation_metrics",
  "timestamp": 1729123456789,
  "data": {
    "timestamp": 1729123456789,
    "total_counties": 3,
    "active_counties": 3,
    "system_health": 0.997
  }
}
```

#### Connection Updates (`connections_update`)

Real-time connection status changes.

```json
{
  "message_type": "connections_update",
  "timestamp": 1729123456789,
  "data": [
    {
      "id": "conn-la-ny-001",
      "status": "Degraded",
      "latency_ms": 125.4
    }
  ]
}
```

#### Security Alerts (`security_alert`)

Critical security incident notifications.

```json
{
  "message_type": "security_alert",
  "timestamp": 1729123456789,
  "data": {
    "alert_id": "alert-12345",
    "severity": "high",
    "description": "Unusual traffic pattern detected",
    "affected_resources": ["conn-la-ny-001"],
    "recommended_action": "Review connection logs"
  }
}
```

#### Heartbeat (`ping`/`pong`)

Connection health monitoring.

```json
{
  "message_type": "ping",
  "timestamp": 1729123456789,
  "data": null
}
```

Response:
```json
{
  "message_type": "pong",
  "timestamp": 1729123456789,
  "data": null
}
```

### Client Implementation Examples

#### JavaScript/TypeScript

```typescript
interface WebSocketMessage {
  message_type: string;
  timestamp: number;
  data: any;
}

class TerraFusionClient {
  private ws: WebSocket;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(`wss://api.terrafusion.gov/ws/federation?token=${this.token}`);
    
    this.ws.onopen = () => {
      console.log('Connected to TerraFusion Federation');
    };

    this.ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from TerraFusion Federation');
      setTimeout(() => this.connect(), 5000); // Auto-reconnect
    };
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.message_type) {
      case 'federation_initial_data':
        this.handleInitialData(message.data);
        break;
      case 'federation_metrics':
        this.handleMetrics(message.data);
        break;
      case 'security_alert':
        this.handleSecurityAlert(message.data);
        break;
    }
  }

  public sendPing() {
    this.ws.send(JSON.stringify({
      message_type: 'ping',
      timestamp: Date.now(),
      data: null
    }));
  }
}
```

#### Python

```python
import asyncio
import websockets
import json
from typing import Dict, Any

class TerraFusionClient:
    def __init__(self, token: str):
        self.token = token
        self.uri = f"wss://api.terrafusion.gov/ws/federation?token={token}"
    
    async def connect(self):
        async with websockets.connect(self.uri) as websocket:
            print("Connected to TerraFusion Federation")
            
            async for message in websocket:
                data = json.loads(message)
                await self.handle_message(data)
    
    async def handle_message(self, message: Dict[str, Any]):
        message_type = message.get('message_type')
        
        if message_type == 'federation_initial_data':
            await self.handle_initial_data(message['data'])
        elif message_type == 'federation_metrics':
            await self.handle_metrics(message['data'])
        elif message_type == 'security_alert':
            await self.handle_security_alert(message['data'])
    
    async def handle_initial_data(self, data: Dict[str, Any]):
        print(f"Received initial data: {len(data.get('counties', []))} counties")
    
    async def handle_metrics(self, data: Dict[str, Any]):
        print(f"System health: {data.get('system_health', 0) * 100:.1f}%")
    
    async def handle_security_alert(self, data: Dict[str, Any]):
        print(f"Security alert: {data.get('description', 'Unknown alert')}")

# Usage
async def main():
    client = TerraFusionClient("your_jwt_token_here")
    await client.connect()

if __name__ == "__main__":
    asyncio.run(main())
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Rate Limited
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request parameters are invalid",
    "details": {
      "field": "status",
      "issue": "Invalid status value provided"
    },
    "timestamp": 1729123456789,
    "request_id": "req-12345-abcde"
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - Missing or invalid authentication
- `AUTHORIZATION_DENIED` - Insufficient permissions
- `INVALID_REQUEST` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource does not exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server-side error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Rate Limiting

### Limits

- **Authenticated requests:** 1000 requests per hour per user
- **WebSocket connections:** 10 concurrent connections per user
- **Unauthenticated requests:** 100 requests per hour per IP

### Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1729127056
X-RateLimit-Window: 3600
```

## Versioning

The API uses semantic versioning with the version specified in the URL path:

- Current version: `v1`
- Base URL: `https://api.terrafusion.gov/v1`

### Backward Compatibility

- Minor version updates maintain backward compatibility
- Major version updates may include breaking changes
- Deprecated endpoints are supported for 12 months after deprecation notice

## Security Considerations

### HTTPS/WSS Only

All communication must use encrypted connections (HTTPS/WSS).

### Content Security Policy

```http
Content-Security-Policy: default-src 'self'; connect-src 'self' wss://api.terrafusion.gov
```

### CORS Policy

```http
Access-Control-Allow-Origin: https://terrafusion.gov
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

---

**Document Version:** 1.0.0  
**Last Updated:** October 16, 2025  
**Classification:** Government Grade  
**API Status:** Production Ready