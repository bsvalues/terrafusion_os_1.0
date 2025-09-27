# API Testing Documentation

**Terrafusion OS 1.0 - Testing API Reference**

## Overview

This document provides comprehensive API documentation for all testing endpoints
used in the PHASE 6 Week 10 comprehensive testing framework.

## Base URLs

- **Development**: `http://localhost:\${{TF_API_PORT:-5000}}`
- **Staging**: `https://staging.terrafusion.gov`
- **Production**: `https://api.terrafusion.gov`

## Authentication

All testing endpoints require JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2025-08-19T15:00:00Z",
  "user": {
    "id": "string",
    "username": "string",
    "role": "admin|user"
  }
}
```

#### Jurisdiction Login

```http
POST /api/auth/jurisdiction-login
Content-Type: application/json

{
  "jurisdictionId": "string",
  "userType": "government-employee",
  "role": "admin|user"
}
```

## System Health Endpoints

### Comprehensive Health Check

```http
GET /api/health/comprehensive
```

**Response**:

```json
{
  "status": "healthy|degraded|unhealthy",
  "components": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "lastCheck": "2025-08-18T15:00:00Z"
    },
    "ai-swarm": {
      "status": "healthy",
      "responseTime": 120,
      "lastCheck": "2025-08-18T15:00:00Z"
    }
  },
  "aiSwarm": {
    "activeAgents": 1008,
    "performance": 95.7,
    "emergentIntelligence": 89.3
  },
  "quantum": {
    "speedupFactor": 379000000,
    "coherenceLevel": 97.8,
    "entanglementStrength": 94.2
  }
}
```

### Component Health Checks

```http
GET /api/health/system
GET /api/health/database
GET /api/health/ai-swarm
GET /api/health/quantum
GET /api/health/harris-pacs
GET /api/health/analytics
GET /api/health/security
```

## Performance Testing Endpoints

### Classical Benchmark

```http
POST /api/performance/classical-benchmark
Content-Type: application/json

{
  "complexity": "high|medium|low",
  "iterations": 1000
}
```

### Quantum Benchmark

```http
POST /api/performance/quantum-benchmark
Content-Type: application/json

{
  "complexity": "high|medium|low",
  "iterations": 1000,
  "quantumEnhanced": true
}
```

### Query Performance

```http
GET /api/performance/slow-queries
POST /api/performance/optimize-query
Content-Type: application/json

{
  "queryId": "string",
  "optimizations": ["indexing", "caching", "partitioning"]
}
```

### Cache Configuration

```http
POST /api/cache/configure
Content-Type: application/json

{
  "strategy": "redis",
  "ttl": 3600,
  "maxMemory": "2gb",
  "evictionPolicy": "allkeys-lru"
}
```

```http
POST /api/cache/enable
Content-Type: application/json

{
  "endpoint": "/api/properties/search",
  "duration": 1800
}
```

### Performance Configuration

```http
POST /api/performance/gc-config
Content-Type: application/json

{
  "strategy": "generational",
  "heapSize": "8gb",
  "gcInterval": 30000
}
```

```http
POST /api/performance/object-pooling
Content-Type: application/json

{
  "enabled": true,
  "poolSize": 10000
}
```

## Security Testing Endpoints

### Security Status

```http
GET /api/security/access-control-status
GET /api/security/audit-status
GET /api/security/config-management
GET /api/security/contingency-plan
GET /api/security/identity-auth
GET /api/security/communications
GET /api/security/integrity
```

**Example Response**:

```json
{
  "rbac_enabled": true,
  "mfa_enabled": true,
  "encryption_enabled": true,
  "monitoring_enabled": true,
  "backup_enabled": true,
  "baseline_configured": true,
  "logging_enabled": true
}
```

### Rate Limiting

```http
POST /api/security/rate-limit
Content-Type: application/json

{
  "windowMs": 900000,
  "max": 1000,
  "skipSuccessfulRequests": false,
  "skipFailedRequests": false
}
```

## AI Swarm Testing Endpoints

### Swarm Intelligence

```http
POST /api/swarmintelligence/initialize
Content-Type: application/json

{
  "agentCount": 1000,
  "roles": ["scout", "worker", "queen", "sentinel", "communicator"]
}
```

```http
POST /api/swarmintelligence/optimize
Content-Type: application/json

{
  "jurisdiction": "string",
  "optimizationTarget": "revenue|efficiency|compliance"
}
```

```http
POST /api/swarmintelligence/batch-optimize
Content-Type: application/json

{
  "jurisdictions": ["benton", "clark", "king"],
  "optimizationTarget": "revenue"
}
```

```http
GET /api/swarmintelligence/performance
GET /api/swarmintelligence/patterns
GET /api/swarmintelligence/status
GET /api/swarmintelligence/monitor
```

### AI Processing

```http
POST /api/ai/swarm-optimization
Content-Type: application/json

{
  "jurisdiction": "string",
  "agentCount": 1000,
  "optimizationTarget": "revenue"
}
```

```http
GET /api/ai/predictions
X-Jurisdiction-ID: string
```

## Phase Integration Endpoints

### Omniscient Orchestrator

```http
POST /api/omniscientorchestrator/initialize
Content-Type: application/json

{
  "fractalLevels": 7,
  "quantumEnhancement": true
}
```

```http
POST /api/omniscientorchestrator/optimize
POST /api/omniscientorchestrator/batch-optimize
GET /api/omniscientorchestrator/status
GET /api/omniscientorchestrator/emergent-patterns
PUT /api/omniscientorchestrator/configuration
```

### Consciousness Status

```http
GET /api/consciousness/status
```

**Response**:

```json
{
  "emergenceLevel": 0.89,
  "autonomousAwareness": 0.99,
  "consciousnessUnits": 100000000
}
```

### Advanced Phase Endpoints

```http
GET /api/multiversal/status
GET /api/cosmic/consciousness-level
GET /api/harmony/protocol-status
GET /api/reality/synthesis-capability
GET /api/infinite/matrix-status
GET /api/omnipotent/capability-assessment
GET /api/singularity/transcendence-status
```

## Harris PACS Integration

### Connectivity

```http
GET /api/harris-pacs/health
```

**Response**:

```json
{
  "connected": true,
  "responseTime": 150,
  "lastSync": "2025-08-18T14:30:00Z"
}
```

### Data Operations

```http
GET /api/harris-pacs/properties/{parcelId}
POST /api/harris-pacs/sync
Content-Type: application/json

{
  "jurisdiction": "string",
  "syncType": "incremental|full"
}
```

## Data Management Endpoints

### Data Ingestion

```http
POST /api/data-ingestion/property
Content-Type: application/json

{
  "parcelId": "string",
  "source": "harris-pacs"
}
```

### Analytics

```http
GET /api/analytics/property/{parcelId}
GET /api/analytics/dashboard
X-Jurisdiction-ID: string
```

## Administrative Endpoints

### System Metrics

```http
GET /api/admin/system/metrics
```

**Response**:

```json
{
  "activeUsers": 1500,
  "responseTimeP95": 1847,
  "requestsPerSecond": 847.32,
  "memoryUsageBytes": 8589934592,
  "cpuUtilization": 67.5,
  "errorRate": 0.03,
  "activeJurisdictions": 5,
  "dataVolumeBytes": 107374182400
}
```

### Database Metrics

```http
GET /api/admin/database/metrics
```

**Response**:

```json
{
  "activeConnections": 150,
  "queryPerformance": {
    "averageQueryTime": 45,
    "slowQueries": 3
  },
  "sharding": {
    "enabled": true,
    "shardCount": 5,
    "replicationFactor": 3
  }
}
```

### Jurisdiction Management

```http
POST /api/admin/jurisdiction/initialize
Content-Type: application/json

{
  "jurisdictionId": "string",
  "name": "string",
  "population": 95000,
  "propertyCount": 45000,
  "region": "west|east|central"
}
```

```http
POST /api/admin/jurisdiction/{jurisdictionId}/seed-data
Content-Type: application/json

{
  "propertyCount": 10000,
  "generateAnalytics": true,
  "enableAIProcessing": true
}
```

### Audit Logs

```http
GET /api/admin/audit-logs
```

## WebSocket Endpoints

### System Hub

```
ws://localhost:\${{TF_API_PORT:-5000}}/hubs/system
wss://staging.terrafusion.gov/hubs/system
```

**Message Format**:

```json
{
  "type": "system-status|performance-update|security-alert",
  "data": {
    "timestamp": "2025-08-18T15:00:00Z",
    "payload": {}
  }
}
```

### Omniscient Hub

```
ws://localhost:\${{TF_API_PORT:-5000}}/hubs/omniscient
```

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {},
    "timestamp": "2025-08-18T15:00:00Z",
    "requestId": "string"
  }
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

## Rate Limiting

### Default Limits

- **Authentication**: 10 requests per minute
- **Health Checks**: 60 requests per minute
- **Performance Tests**: 5 requests per minute
- **Security Tests**: 3 requests per minute
- **General API**: 1000 requests per 15 minutes

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1755555600
```

## Testing Best Practices

### Request Headers

Always include:

```http
Content-Type: application/json
Authorization: Bearer <token>
X-Jurisdiction-ID: <jurisdiction> (when applicable)
User-Agent: Terrafusion-Testing/1.0
```

### Retry Logic

Implement exponential backoff for failed requests:

- Initial delay: 1 second
- Maximum delay: 30 seconds
- Maximum retries: 3

### Timeout Configuration

- **Health checks**: 5 seconds
- **Performance tests**: 30 seconds
- **Security tests**: 60 seconds
- **Load tests**: 120 seconds

---

**Document Version**: 1.0  
**Last Updated**: August 18, 2025  
**API Version**: v1  
**Classification**: Government Use - Controlled Unclassified Information (CUI)
