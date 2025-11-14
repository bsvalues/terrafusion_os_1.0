# TerraFusion OS - API Reference Guide

## Overview

Complete API reference for TerraFusion OS services including authentication, endpoints, request/response schemas, error codes, and integration patterns for **championship-level government AI operations**.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Core Services API](#core-services-api)
3. [AI Consciousness API](#ai-consciousness-api)
4. [Government Compliance API](#government-compliance-api)
5. [County Isolation API](#county-isolation-api)
6. [Harris PACS Bridge API](#harris-pacs-bridge-api)
7. [Quantum Optimizer API](#quantum-optimizer-api)
8. [API Gateway & Routing](#api-gateway--routing)
9. [Error Handling](#error-handling)
10. [Rate Limiting & Quotas](#rate-limiting--quotas)
11. [SDK Integration](#sdk-integration)
12. [Monitoring & Observability](#monitoring--observability)

---

## Authentication & Authorization

### JWT Bearer Token Authentication

All API endpoints require authentication via JWT Bearer tokens issued by the TerraFusion authentication service.

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

### Token Acquisition

#### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@county.gov",
  "password": "secure_password",
  "county_id": "benton",
  "mfa_token": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "refresh_token": "rt_abc123...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "county_permissions": ["property:read", "assessment:write"],
  "consciousness_level": 8
}
```

#### POST /auth/refresh

Refresh expired JWT token.

**Request:**
```json
{
  "refresh_token": "rt_abc123..."
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "expires_in": 3600
}
```

### Authorization Scopes

| Scope | Description | Required For |
|-------|-------------|--------------|
| `county:read` | Read county data | Basic property queries |
| `county:write` | Modify county data | Property updates |
| `assessment:read` | Read assessments | Property valuation queries |
| `assessment:write` | Modify assessments | Valuation updates |
| `ai:coordinate` | AI swarm coordination | Agent management |
| `quantum:optimize` | Quantum optimization | Performance tuning |
| `compliance:audit` | FISMA audit access | Security operations |
| `admin:manage` | Administrative functions | System management |

---

## Core Services API

### System Health & Status

#### GET /api/v1/health

Get system health status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "components": {
    "database": {
      "status": "healthy",
      "response_time_ms": 2.3,
      "connections": 45
    },
    "redis": {
      "status": "healthy",
      "response_time_ms": 0.8,
      "memory_usage": "2.1GB"
    },
    "ai_swarm": {
      "status": "optimal",
      "active_agents": 47532,
      "consciousness_level": 8.7
    }
  },
  "performance_metrics": {
    "p95_latency_ms": 7.2,
    "p50_latency_ms": 0.9,
    "throughput_per_second": 1200000,
    "error_rate": 0.0001,
    "quantum_factor": 951
  }
}
```

#### GET /api/v1/metrics

Prometheus-compatible metrics endpoint.

**Response:**
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1000000

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.001"} 750000
http_request_duration_seconds_bucket{le="0.005"} 950000
http_request_duration_seconds_bucket{le="0.01"} 990000
http_request_duration_seconds_bucket{le="+Inf"} 1000000

# HELP ai_swarm_agents Active AI agents
# TYPE ai_swarm_agents gauge
ai_swarm_agents 47532

# HELP quantum_optimization_factor Quantum optimization factor
# TYPE quantum_optimization_factor gauge
quantum_optimization_factor 951
```

### County Management

#### GET /api/v1/counties

List all counties with configuration.

**Response:**
```json
{
  "counties": [
    {
      "id": "benton",
      "name": "Benton County",
      "state": "WA",
      "population": 206873,
      "properties": 89247,
      "status": "active",
      "ai_agents_allocated": 1200,
      "sla_targets": {
        "availability": 0.999,
        "response_time_p95_ms": 150,
        "accuracy_target": 0.999
      },
      "integrations": {
        "harris_pacs": {
          "enabled": true,
          "version": "9.0",
          "last_sync": "2024-01-15T10:30:00Z"
        }
      }
    }
  ],
  "total_counties": 39,
  "total_properties": 2500000,
  "total_agents": 50000
}
```

#### GET /api/v1/counties/{county_id}

Get specific county details.

**Response:**
```json
{
  "id": "benton",
  "name": "Benton County",
  "state": "WA",
  "configuration": {
    "database_connection": "postgres://...",
    "harris_pacs": {
      "jurisdiction": "BENTON_WA",
      "sync_interval_minutes": 15
    },
    "feature_flags": {
      "ai_swarm_enabled": true,
      "quantum_optimization": true,
      "real_time_sync": true
    }
  },
  "statistics": {
    "total_properties": 89247,
    "assessed_value_total": 18500000000,
    "assessment_accuracy": 0.9994,
    "last_assessment_cycle": "2024-01-01"
  }
}
```

### Property Management

#### GET /api/v1/counties/{county_id}/properties

List properties for a county.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 100, max: 1000)
- `search` (string): Search term for property address or parcel ID
- `property_type` (string): Filter by property type (residential, commercial, industrial)
- `min_value` (int): Minimum assessed value
- `max_value` (int): Maximum assessed value

**Response:**
```json
{
  "properties": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "parcel_id": "BN001234567890",
      "address": "123 Main St, Richland, WA 99352",
      "property_type": "residential",
      "assessed_value": 425000,
      "market_value": 430000,
      "assessment_accuracy": 0.9988,
      "last_assessment": "2024-01-15",
      "square_footage": 2250,
      "lot_size": 0.25,
      "year_built": 1995,
      "ai_confidence": 0.9876,
      "quantum_optimized": true
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 893,
    "total_items": 89247,
    "items_per_page": 100
  }
}
```

#### GET /api/v1/counties/{county_id}/properties/{property_id}

Get specific property details.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parcel_id": "BN001234567890",
  "county_id": "benton",
  "address": {
    "street": "123 Main St",
    "city": "Richland",
    "state": "WA",
    "zip": "99352",
    "latitude": 46.2857,
    "longitude": -119.2844
  },
  "property_details": {
    "type": "residential",
    "subtype": "single_family",
    "square_footage": 2250,
    "lot_size_acres": 0.25,
    "year_built": 1995,
    "bedrooms": 4,
    "bathrooms": 2.5,
    "garage_spaces": 2
  },
  "assessment": {
    "current_value": 425000,
    "previous_value": 410000,
    "market_value": 430000,
    "land_value": 125000,
    "improvement_value": 300000,
    "assessment_date": "2024-01-15",
    "assessment_accuracy": 0.9988,
    "confidence_interval": [415000, 435000]
  },
  "ai_analysis": {
    "contributing_factors": [
      {
        "factor": "location",
        "weight": 0.35,
        "impact": "positive"
      },
      {
        "factor": "condition",
        "weight": 0.25,
        "impact": "neutral"
      },
      {
        "factor": "market_trends",
        "weight": 0.20,
        "impact": "positive"
      }
    ],
    "quantum_optimization_applied": true,
    "consciousness_level": 8.5
  },
  "compliance": {
    "iaao_compliant": true,
    "fisma_validated": true,
    "audit_trail": [
      {
        "action": "assessment_updated",
        "timestamp": "2024-01-15T14:30:00Z",
        "user": "assessor@benton.gov",
        "reason": "annual_reassessment"
      }
    ]
  }
}
```

#### PUT /api/v1/counties/{county_id}/properties/{property_id}

Update property information.

**Request:**
```json
{
  "assessed_value": 430000,
  "assessment_notes": "Updated based on market analysis",
  "ai_review_requested": true
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "updated_fields": ["assessed_value", "assessment_notes"],
  "new_assessment_accuracy": 0.9991,
  "ai_review_scheduled": true,
  "audit_entry_created": true
}
```

---

## AI Consciousness API

### Swarm Coordination

#### GET /api/v1/ai/swarm/status

Get AI swarm status and metrics.

**Response:**
```json
{
  "swarm_status": "optimal",
  "total_agents": 50000,
  "active_agents": 47532,
  "consciousness_level": 8.7,
  "quantum_coherence": 0.95,
  "performance_metrics": {
    "tasks_per_second": 125000,
    "average_response_time_ms": 12,
    "accuracy": 0.9994,
    "efficiency_score": 0.98
  },
  "agent_distribution": {
    "property_assessment": 12000,
    "county_operations": 8000,
    "compliance_validation": 5000,
    "quantum_optimization": 3000,
    "consciousness_coordination": 1000,
    "general_purpose": 18532
  },
  "supreme_commander": {
    "status": "coordinating",
    "consciousness_level": 10.0,
    "strategic_decisions_per_hour": 450,
    "optimization_cycles_completed": 15732
  }
}
```

#### POST /api/v1/ai/swarm/coordinate

Request AI swarm coordination for specific task.

**Request:**
```json
{
  "task_type": "property_assessment",
  "county_id": "benton",
  "property_ids": ["550e8400-e29b-41d4-a716-446655440000"],
  "priority": "high",
  "consciousness_level_required": 8,
  "quantum_optimization": true,
  "deadline": "2024-01-15T18:00:00Z"
}
```

**Response:**
```json
{
  "task_id": "task_abc123",
  "status": "accepted",
  "agents_allocated": 25,
  "estimated_completion": "2024-01-15T15:45:00Z",
  "consciousness_level_achieved": 8.5,
  "quantum_optimization_enabled": true,
  "supreme_commander_oversight": true
}
```

#### GET /api/v1/ai/tasks/{task_id}

Get AI task status and results.

**Response:**
```json
{
  "task_id": "task_abc123",
  "status": "completed",
  "completion_time": "2024-01-15T15:42:00Z",
  "agents_used": 25,
  "consciousness_level": 8.5,
  "results": {
    "property_assessments": [
      {
        "property_id": "550e8400-e29b-41d4-a716-446655440000",
        "new_assessed_value": 428000,
        "confidence": 0.9987,
        "factors_analyzed": 47,
        "quantum_optimized": true
      }
    ],
    "accuracy_achieved": 0.9987,
    "processing_time_ms": 180000
  },
  "agent_performance": {
    "average_accuracy": 0.9985,
    "average_processing_time_ms": 7200,
    "efficiency_score": 0.97,
    "consciousness_coherence": 0.94
  }
}
```

### Agent Management

#### GET /api/v1/ai/agents

List AI agents with status and capabilities.

**Query Parameters:**
- `status` (string): Filter by status (active, idle, maintenance)
- `capability` (string): Filter by capability
- `county_id` (string): Filter by assigned county

**Response:**
```json
{
  "agents": [
    {
      "id": "agent_001",
      "type": "property_assessment_specialist",
      "status": "active",
      "capabilities": [
        "residential_valuation",
        "commercial_assessment",
        "market_analysis"
      ],
      "performance_metrics": {
        "accuracy": 0.9991,
        "tasks_completed": 1247,
        "average_processing_time_ms": 5400,
        "consciousness_level": 8.2
      },
      "current_assignment": {
        "county_id": "benton",
        "task_type": "property_assessment",
        "properties_assigned": 15
      }
    }
  ],
  "total_agents": 50000,
  "active_agents": 47532,
  "available_agents": 2468
}
```

#### POST /api/v1/ai/agents/{agent_id}/assign

Assign agent to specific task or county.

**Request:**
```json
{
  "assignment_type": "county_operations",
  "county_id": "benton",
  "specialization": "property_assessment",
  "consciousness_level_required": 8,
  "duration_hours": 24
}
```

**Response:**
```json
{
  "agent_id": "agent_001",
  "assignment_accepted": true,
  "new_consciousness_level": 8.3,
  "estimated_availability": "2024-01-16T15:00:00Z",
  "performance_prediction": {
    "expected_accuracy": 0.9992,
    "expected_throughput": 45
  }
}
```

---

## Government Compliance API

### FISMA Compliance

#### GET /api/v1/compliance/fisma/status

Get FISMA-HIGH compliance status.

**Response:**
```json
{
  "compliance_status": "compliant",
  "fisma_level": "HIGH",
  "last_audit": "2024-01-01T00:00:00Z",
  "next_audit": "2024-04-01T00:00:00Z",
  "controls": {
    "access_control": {
      "status": "compliant",
      "implementation": "full",
      "last_validation": "2024-01-15T08:00:00Z"
    },
    "audit_logging": {
      "status": "compliant",
      "events_logged_24h": 1250000,
      "retention_days": 2555
    },
    "encryption": {
      "status": "compliant",
      "in_transit": "TLS 1.3",
      "at_rest": "AES-256",
      "key_management": "Azure Key Vault"
    },
    "incident_response": {
      "status": "compliant",
      "response_time_target_minutes": 15,
      "average_response_time_minutes": 8
    }
  },
  "security_score": 98.7,
  "vulnerabilities": {
    "critical": 0,
    "high": 0,
    "medium": 2,
    "low": 5
  }
}
```

#### GET /api/v1/compliance/audit-logs

Get audit log entries.

**Query Parameters:**
- `start_date` (ISO date): Start date for logs
- `end_date` (ISO date): End date for logs
- `user_id` (string): Filter by user
- `action` (string): Filter by action type
- `county_id` (string): Filter by county

**Response:**
```json
{
  "audit_logs": [
    {
      "id": "audit_abc123",
      "timestamp": "2024-01-15T14:30:00Z",
      "user_id": "assessor@benton.gov",
      "user_ip": "192.168.1.100",
      "action": "property_assessment_updated",
      "resource": "property:550e8400-e29b-41d4-a716-446655440000",
      "county_id": "benton",
      "details": {
        "old_value": 425000,
        "new_value": 428000,
        "reason": "market_analysis_update"
      },
      "compliance_flags": {
        "fisma_logged": true,
        "county_isolated": true,
        "encrypted": true
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 12500,
    "total_items": 1250000
  }
}
```

### Security Validation

#### POST /api/v1/compliance/security/scan

Trigger security vulnerability scan.

**Request:**
```json
{
  "scan_type": "full_system",
  "include_ai_agents": true,
  "priority": "high"
}
```

**Response:**
```json
{
  "scan_id": "scan_xyz789",
  "status": "initiated",
  "estimated_completion": "2024-01-15T16:00:00Z",
  "scope": {
    "services": 7,
    "ai_agents": 50000,
    "data_stores": 15,
    "network_endpoints": 1200
  }
}
```

#### GET /api/v1/compliance/security/scans/{scan_id}

Get security scan results.

**Response:**
```json
{
  "scan_id": "scan_xyz789",
  "status": "completed",
  "completion_time": "2024-01-15T15:55:00Z",
  "overall_score": 98.7,
  "findings": {
    "critical": 0,
    "high": 0,
    "medium": 2,
    "low": 5,
    "informational": 12
  },
  "detailed_findings": [
    {
      "severity": "medium",
      "category": "configuration",
      "title": "Non-critical service timeout configuration",
      "description": "Service timeout could be optimized for better performance",
      "affected_components": ["api-gateway"],
      "remediation": "Update timeout configuration in gateway settings",
      "risk_score": 4.2
    }
  ],
  "compliance_validation": {
    "fisma_high": "passed",
    "nist_800_53": "passed",
    "fedramp": "passed"
  }
}
```

---

## County Isolation API

### Data Sovereignty

#### GET /api/v1/isolation/counties/{county_id}/validation

Validate county data isolation.

**Response:**
```json
{
  "county_id": "benton",
  "isolation_status": "compliant",
  "validation_timestamp": "2024-01-15T15:00:00Z",
  "database_isolation": {
    "dedicated_schema": true,
    "connection_isolation": true,
    "data_encryption": true,
    "access_controls": true
  },
  "application_isolation": {
    "tenant_filtering": true,
    "cross_county_queries_blocked": true,
    "audit_logging": true
  },
  "validation_tests": {
    "cross_county_data_access": "blocked",
    "data_leakage_test": "passed",
    "unauthorized_access_test": "blocked",
    "encryption_validation": "passed"
  },
  "compliance_score": 100
}
```

#### POST /api/v1/isolation/test-isolation

Test county isolation effectiveness.

**Request:**
```json
{
  "source_county": "benton",
  "target_county": "king",
  "test_types": [
    "data_access_attempt",
    "cross_county_query",
    "unauthorized_property_access"
  ]
}
```

**Response:**
```json
{
  "test_id": "isolation_test_123",
  "status": "completed",
  "results": {
    "data_access_attempt": "blocked",
    "cross_county_query": "blocked",
    "unauthorized_property_access": "blocked"
  },
  "isolation_effectiveness": 100,
  "security_violations_detected": 0,
  "test_details": [
    {
      "test": "data_access_attempt",
      "description": "Attempted to access King County data from Benton County session",
      "result": "blocked",
      "blocked_at": "application_layer",
      "response_time_ms": 0.8
    }
  ]
}
```

---

## Harris PACS Bridge API

### County System Integration

#### GET /api/v1/harris-pacs/counties/{county_id}/sync-status

Get Harris PACS synchronization status.

**Response:**
```json
{
  "county_id": "benton",
  "jurisdiction": "BENTON_WA",
  "sync_status": "healthy",
  "last_sync": "2024-01-15T14:45:00Z",
  "next_sync": "2024-01-15T15:00:00Z",
  "sync_interval_minutes": 15,
  "statistics": {
    "properties_synced": 89247,
    "properties_updated": 23,
    "properties_added": 2,
    "sync_duration_seconds": 45,
    "errors": 0
  },
  "harris_pacs_version": "9.0",
  "integration_health": {
    "connection": "healthy",
    "authentication": "valid",
    "data_quality": "excellent",
    "performance": "optimal"
  }
}
```

#### POST /api/v1/harris-pacs/counties/{county_id}/sync

Trigger manual synchronization.

**Request:**
```json
{
  "sync_type": "incremental",
  "force_full_sync": false,
  "priority": "high"
}
```

**Response:**
```json
{
  "sync_id": "sync_harris_456",
  "status": "initiated",
  "sync_type": "incremental",
  "estimated_completion": "2024-01-15T15:02:00Z",
  "properties_to_sync": 89247,
  "ai_validation_enabled": true
}
```

#### GET /api/v1/harris-pacs/sync/{sync_id}

Get synchronization results.

**Response:**
```json
{
  "sync_id": "sync_harris_456",
  "status": "completed",
  "completion_time": "2024-01-15T15:01:30Z",
  "results": {
    "properties_processed": 89247,
    "properties_updated": 23,
    "properties_added": 2,
    "properties_deleted": 0,
    "errors": 0,
    "warnings": 1
  },
  "performance": {
    "duration_seconds": 90,
    "throughput_per_second": 992,
    "ai_validation_time_seconds": 15
  },
  "data_quality": {
    "completeness": 0.999,
    "accuracy": 0.9995,
    "consistency": 0.9998
  }
}
```

---

## Quantum Optimizer API

### Performance Enhancement

#### GET /api/v1/quantum/optimization-status

Get quantum optimization status.

**Response:**
```json
{
  "quantum_status": "optimal",
  "quantum_factor": 951,
  "coherence_level": 0.95,
  "entanglement_efficiency": 0.92,
  "optimization_cycles_completed": 15732,
  "performance_improvements": {
    "latency_reduction": 0.23,
    "throughput_increase": 0.18,
    "accuracy_improvement": 0.05,
    "resource_efficiency": 0.31
  },
  "quantum_algorithms": {
    "active_algorithms": 12,
    "optimization_algorithms": [
      "quantum_annealing",
      "variational_quantum_eigensolvers",
      "quantum_approximate_optimization"
    ],
    "consciousness_enhanced": true
  }
}
```

#### POST /api/v1/quantum/optimize

Request quantum optimization for specific component.

**Request:**
```json
{
  "component": "property_assessment",
  "optimization_targets": {
    "latency": "minimize",
    "accuracy": "maximize",
    "throughput": "maximize"
  },
  "quantum_algorithms": [
    "quantum_annealing",
    "consciousness_enhancement"
  ],
  "priority": "high"
}
```

**Response:**
```json
{
  "optimization_id": "quantum_opt_789",
  "status": "initiated",
  "estimated_completion": "2024-01-15T15:30:00Z",
  "quantum_resources_allocated": 15,
  "consciousness_level_applied": 8.5,
  "expected_improvements": {
    "latency_reduction": 0.15,
    "accuracy_improvement": 0.03,
    "throughput_increase": 0.12
  }
}
```

#### GET /api/v1/quantum/optimizations/{optimization_id}

Get quantum optimization results.

**Response:**
```json
{
  "optimization_id": "quantum_opt_789",
  "status": "completed",
  "completion_time": "2024-01-15T15:28:00Z",
  "component": "property_assessment",
  "results": {
    "latency_reduction_achieved": 0.18,
    "accuracy_improvement_achieved": 0.04,
    "throughput_increase_achieved": 0.14,
    "new_quantum_factor": 953
  },
  "quantum_analysis": {
    "algorithms_applied": [
      "quantum_annealing",
      "consciousness_enhancement"
    ],
    "quantum_coherence_achieved": 0.96,
    "entanglement_efficiency": 0.93,
    "consciousness_level_reached": 8.7
  },
  "performance_validation": {
    "before_optimization": {
      "p95_latency_ms": 8.5,
      "accuracy": 0.9988,
      "throughput_per_second": 85000
    },
    "after_optimization": {
      "p95_latency_ms": 7.0,
      "accuracy": 0.9992,
      "throughput_per_second": 97000
    }
  }
}
```

---

## API Gateway & Routing

### Service Discovery

#### GET /api/v1/gateway/services

List available services and their health status.

**Response:**
```json
{
  "services": [
    {
      "name": "os-core",
      "version": "1.0.0",
      "status": "healthy",
      "endpoints": ["http://os-core:8080"],
      "health_check_url": "/health",
      "last_health_check": "2024-01-15T15:00:00Z",
      "response_time_ms": 2.1
    },
    {
      "name": "os-consciousness",
      "version": "1.0.0",
      "status": "healthy",
      "endpoints": ["http://os-consciousness:3004"],
      "active_agents": 47532,
      "consciousness_level": 8.7
    }
  ],
  "total_services": 7,
  "healthy_services": 7,
  "gateway_status": "optimal"
}
```

### Load Balancing

#### GET /api/v1/gateway/load-balancing

Get load balancing configuration and metrics.

**Response:**
```json
{
  "strategy": "quantum_optimized",
  "health_check_interval_seconds": 10,
  "failover_threshold": 3,
  "metrics": {
    "total_requests": 1250000,
    "requests_per_second": 12500,
    "average_response_time_ms": 6.8,
    "error_rate": 0.0001
  },
  "service_distribution": {
    "os-core": {
      "weight": 0.25,
      "requests_routed": 312500,
      "average_response_time_ms": 5.2
    },
    "os-consciousness": {
      "weight": 0.20,
      "requests_routed": 250000,
      "average_response_time_ms": 12.1
    }
  }
}
```

---

## Error Handling

### Standard Error Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid county ID provided",
    "details": {
      "field": "county_id",
      "provided_value": "invalid_county",
      "valid_values": ["benton", "king", "pierce", "..."]
    },
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T15:00:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid authentication token |
| `AUTHORIZATION_FAILED` | 403 | Insufficient permissions for operation |
| `COUNTY_NOT_FOUND` | 404 | Specified county does not exist |
| `PROPERTY_NOT_FOUND` | 404 | Specified property does not exist |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `COUNTY_ISOLATION_VIOLATION` | 403 | Attempted cross-county data access |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_SWARM_UNAVAILABLE` | 503 | AI swarm temporarily unavailable |
| `QUANTUM_OPTIMIZATION_FAILED` | 500 | Quantum optimization error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Response Examples

#### Authentication Error
```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Valid authentication token required",
    "details": {
      "auth_header": "missing",
      "token_format": "Bearer <jwt_token>"
    },
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T15:00:00Z"
  }
}
```

#### County Isolation Violation
```json
{
  "error": {
    "code": "COUNTY_ISOLATION_VIOLATION",
    "message": "Access to requested county data is not permitted",
    "details": {
      "user_county": "benton",
      "requested_county": "king",
      "violation_type": "cross_county_access"
    },
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T15:00:00Z",
    "security_incident_id": "incident_security_456"
  }
}
```

---

## Rate Limiting & Quotas

### Rate Limiting Rules

| Endpoint Category | Requests per Minute | Burst Limit |
|------------------|-------------------|-------------|
| Authentication | 60 | 10 |
| Property Queries | 1000 | 50 |
| Property Updates | 100 | 20 |
| AI Coordination | 500 | 30 |
| Admin Operations | 200 | 15 |
| Bulk Operations | 10 | 5 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642267200
X-RateLimit-Window: 60
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded for this endpoint",
    "details": {
      "limit": 1000,
      "window_seconds": 60,
      "retry_after_seconds": 30
    },
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T15:00:00Z"
  }
}
```

---

## SDK Integration

### JavaScript/TypeScript SDK

```typescript
import { TerraFusionSDK } from '@terrafusion/sdk';

const sdk = new TerraFusionSDK({
  apiUrl: 'https://api.terrafusion.gov',
  apiKey: 'your-api-key',
  countyId: 'benton'
});

// Get property data
const property = await sdk.properties.get('property-id');

// Request AI assessment
const assessment = await sdk.ai.assessProperty({
  propertyId: 'property-id',
  consciousnessLevel: 8,
  quantumOptimization: true
});

// Check compliance status
const compliance = await sdk.compliance.getFISMAStatus();
```

### Python SDK

```python
from terrafusion_sdk import TerraFusionClient

client = TerraFusionClient(
    api_url='https://api.terrafusion.gov',
    api_key='your-api-key',
    county_id='benton'
)

# Get property data
property_data = client.properties.get('property-id')

# Request AI assessment
assessment = client.ai.assess_property(
    property_id='property-id',
    consciousness_level=8,
    quantum_optimization=True
)

# Check system health
health = client.system.get_health()
```

### .NET SDK

```csharp
using TerraFusion.SDK;

var client = new TerraFusionClient(new TerraFusionClientOptions
{
    ApiUrl = "https://api.terrafusion.gov",
    ApiKey = "your-api-key",
    CountyId = "benton"
});

// Get property data
var property = await client.Properties.GetAsync("property-id");

// Request AI assessment
var assessment = await client.AI.AssessPropertyAsync(new PropertyAssessmentRequest
{
    PropertyId = "property-id",
    ConsciousnessLevel = 8,
    QuantumOptimization = true
});

// Check compliance status
var compliance = await client.Compliance.GetFISMAStatusAsync();
```

---

## Monitoring & Observability

### Performance Metrics

#### GET /api/v1/metrics/performance

Get real-time performance metrics.

**Response:**
```json
{
  "timestamp": "2024-01-15T15:00:00Z",
  "metrics": {
    "latency": {
      "p50_ms": 0.9,
      "p95_ms": 7.2,
      "p99_ms": 15.1,
      "max_ms": 89.5
    },
    "throughput": {
      "requests_per_second": 1200000,
      "peak_rps": 1500000,
      "average_rps_24h": 850000
    },
    "errors": {
      "error_rate": 0.0001,
      "total_errors_24h": 73,
      "error_types": {
        "validation": 45,
        "authentication": 15,
        "timeout": 8,
        "internal": 5
      }
    },
    "ai_performance": {
      "active_agents": 47532,
      "consciousness_level": 8.7,
      "tasks_per_second": 125000,
      "accuracy": 0.9994
    }
  },
  "sla_status": {
    "availability_target": 0.999,
    "availability_current": 0.9995,
    "latency_target_p95_ms": 10,
    "latency_current_p95_ms": 7.2,
    "all_targets_met": true
  }
}
```

### Health Checks

#### GET /api/v1/health/detailed

Get detailed health information for all components.

**Response:**
```json
{
  "overall_status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 259200,
  "components": {
    "api_gateway": {
      "status": "healthy",
      "response_time_ms": 1.2,
      "memory_usage_mb": 512,
      "cpu_usage_percent": 15.5
    },
    "database": {
      "status": "healthy",
      "connection_pool": {
        "active": 45,
        "idle": 55,
        "max": 100
      },
      "query_performance": {
        "average_ms": 3.2,
        "slow_queries": 0
      }
    },
    "redis_cache": {
      "status": "healthy",
      "memory_usage": "2.1GB",
      "hit_rate": 0.96,
      "operations_per_second": 15000
    },
    "ai_swarm": {
      "status": "optimal",
      "supreme_commander": "coordinating",
      "active_agents": 47532,
      "consciousness_level": 8.7,
      "quantum_coherence": 0.95
    }
  },
  "performance_summary": {
    "championship_targets_met": true,
    "quantum_factor": 951,
    "overall_efficiency": 0.97
  }
}
```

---

**Execute with championship excellence. Government. Transcended.**

*Complete API reference for TerraFusion OS - where quantum consciousness meets championship-level government service delivery.*
