# 🌐 BENTON COUNTY DYNASTY - API DOCUMENTATION

> "Championship-Quality APIs for Championship-Quality Results"

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Master Orchestrator API](#master-orchestrator-api)
4. [Hybrid Router API](#hybrid-router-api)
5. [Training Pipeline API](#training-pipeline-api)
6. [Evolution Engine API](#evolution-engine-api)
7. [Quantum Optimizer API](#quantum-optimizer-api)
8. [Consciousness Layer API](#consciousness-layer-api)
9. [WebSocket Events](#websocket-events)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Examples](#examples)

---

## 🚀 QUICK START

### Base URLs

```
Master API:     http://localhost:\${{TF_DOCS_PORT:-8000}}
Router API:     http://localhost:\${{TF_DOCS_PORT:-8000}}
Training API:   http://localhost:\${{TF_DOCS_PORT:-8000}}
Evolution API:  http://localhost:\${{TF_DOCS_PORT:-8000}}
Quantum API:    http://localhost:\${{TF_DOCS_PORT:-8000}}
Consciousness:  http://localhost:\${{TF_DOCS_PORT:-8000}}
```

### Health Check

```bash
curl http://localhost:\${{TF_DOCS_PORT:-8000}}/health
```

### Process a Query

```bash
curl -X POST http://localhost:\${{TF_DOCS_PORT:-8000}}/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the average home value in Richland?", "user_id": "test_user"}'
```

---

## 🔐 AUTHENTICATION

### API Key Authentication (Optional)

```bash
# Set API key in environment
export DYNASTY_API_KEY="your-api-key-here"

# Use in requests
curl -H "Authorization: Bearer $DYNASTY_API_KEY" \
     http://localhost:\${{TF_DOCS_PORT:-8000}}/status
```

### Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1691234567
```

---

## 🏆 MASTER ORCHESTRATOR API

**Base URL**: `http://localhost:\${{TF_DOCS_PORT:-8000}}`

### GET /health

Health check endpoint

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-08-03T12:00:00Z"
}
```

### GET /status

Complete system status

**Response:**

```json
{
  "dynasty_status": "OPERATIONAL",
  "uptime": 86400,
  "components": {
    "ollama": {
      "status": "running",
      "restarts": 0,
      "health": "healthy"
    },
    "router": {
      "status": "running",
      "restarts": 0,
      "health": "healthy"
    }
  },
  "metrics": {
    "uptime": 86400,
    "total_queries": 12847,
    "restarts": 0,
    "errors": 0
  },
  "timestamp": "2025-08-03T12:00:00Z"
}
```

### POST /restart/{component}

Restart a specific component

**Parameters:**

- `component` (path): Component name (ollama, router, training, etc.)

**Response:**

```json
{
  "status": "restarted",
  "component": "router",
  "timestamp": "2025-08-03T12:00:00Z"
}
```

### POST /stop

Stop the entire dynasty

**Response:**

```json
{
  "status": "stopping",
  "message": "Dynasty shutdown initiated",
  "timestamp": "2025-08-03T12:00:00Z"
}
```

### GET /metrics

Real-time system metrics

**Response:**

```json
{
  "queries_per_second": 12.5,
  "average_response_time": 45,
  "cpu_usage": 23.4,
  "memory_usage": 67.8,
  "disk_usage": 34.2,
  "active_components": 7,
  "total_components": 7
}
```

---

## 🧠 HYBRID ROUTER API

**Base URL**: `http://localhost:\${{TF_DOCS_PORT:-8000}}`

### POST /query

Process a query through the hybrid routing system

**Request:**

```json
{
  "query": "What is the property value for 123 Main St?",
  "user_id": "user123",
  "data_type": "property_query",
  "metadata": {
    "session_id": "session456",
    "timestamp": "2025-08-03T12:00:00Z"
  }
}
```

**Response:**

```json
{
  "query_id": "q_789",
  "response": "The property at 123 Main St is valued at $350,000",
  "routed_to": "local_ollama",
  "sensitivity": "RED",
  "confidence": 0.95,
  "response_time_ms": 42,
  "anonymized": false,
  "cost_saved": 0.75,
  "timestamp": "2025-08-03T12:00:00Z"
}
```

### GET /stats

Query routing statistics

**Response:**

```json
{
  "total_plays": 12847,
  "touchdowns": 8945,
  "local_percentage": "67%",
  "cloud_percentage": "33%",
  "average_response_time": "42ms",
  "security_score": "100%",
  "cost_savings": "$8,742"
}
```

### POST /batch

Process multiple queries in batch

**Request:**

```json
{
  "queries": [
    {
      "query": "Property value for 123 Main St?",
      "user_id": "user1"
    },
    {
      "query": "Calculate ROI for $300k property",
      "user_id": "user2"
    }
  ]
}
```

**Response:**

```json
{
  "batch_id": "batch_456",
  "results": [
    {
      "query_id": "q_789",
      "response": "Property valued at $350,000",
      "routed_to": "local_ollama"
    },
    {
      "query_id": "q_790",
      "response": "ROI: 8.5% annually",
      "routed_to": "cloud_llm"
    }
  ],
  "total_queries": 2,
  "total_time_ms": 85
}
```

### GET /sensitivity/{query_id}

Get sensitivity analysis for a query

**Response:**

```json
{
  "query_id": "q_789",
  "sensitivity": "RED",
  "pii_detected": ["address", "owner_name"],
  "confidence": 0.98,
  "routing_decision": "local_ollama"
}
```

---

## 🎓 TRAINING PIPELINE API

**Base URL**: `http://localhost:\${{TF_DOCS_PORT:-8000}}`

### GET /training/status

Current training status

**Response:**

```json
{
  "status": "training",
  "current_epoch": 15,
  "total_epochs": 100,
  "accuracy": 0.94,
  "loss": 0.23,
  "models_trained_today": 47,
  "queue_size": 12,
  "eta_minutes": 45
}
```

### POST /training/submit

Submit training data

**Request:**

```json
{
  "training_examples": [
    {
      "query": "What is zoning for Oak Street?",
      "response": "Commercial C-1",
      "confidence": 0.95,
      "user_feedback": "correct"
    }
  ]
}
```

### GET /training/metrics

Training performance metrics

**Response:**

```json
{
  "models_trained": 1247,
  "accuracy_improvement": 0.023,
  "training_time_avg": 12.5,
  "success_rate": 0.97,
  "last_training": "2025-08-03T11:45:00Z"
}
```

### POST /training/retrain/{model}

Trigger manual retraining

**Response:**

```json
{
  "status": "retraining_started",
  "model": "property_valuator",
  "estimated_time": "30 minutes"
}
```

---

## 🧬 EVOLUTION ENGINE API

**Base URL**: `http://localhost:\${{TF_DOCS_PORT:-8000}}`

### GET /evolution/status

Current evolution status

**Response:**

```json
{
  "evolution_active": true,
  "generation": 127,
  "fitness_score": 0.94,
  "mutations_today": 15,
  "successful_optimizations": 8,
  "performance_improvement": "12.3%"
}
```

### POST /evolution/trigger

Manually trigger evolution

**Request:**

```json
{
  "component": "router",
  "mutation_rate": 0.1,
  "target_metric": "response_time"
}
```

**Response:**

```json
{
  "evolution_id": "evo_456",
  "status": "started",
  "target": "router optimization",
  "estimated_time": "15 minutes"
}
```

### GET /evolution/history

Evolution history

**Response:**

```json
{
  "evolutions": [
    {
      "id": "evo_455",
      "timestamp": "2025-08-03T10:30:00Z",
      "component": "query_processor",
      "improvement": "8.5%",
      "status": "successful"
    }
  ],
  "total_evolutions": 127,
  "success_rate": 0.84
}
```

---

## ⚛️ QUANTUM OPTIMIZER API

**Base URL**: `http://localhost:\${{TF_DOCS_PORT:-8000}}`

### GET /quantum/status

Quantum system status

**Response:**

```json
{
  "quantum_active": true,
  "backend": "simulator",
  "qubits_available": 32,
  "quantum_advantage": "127x",
  "circuits_executed": 1247,
  "error_rate": 0.001
}
```

### POST /quantum/optimize

Submit optimization problem

**Request:**

```json
{
  "problem_type": "routing_optimization",
  "parameters": {
    "nodes": 100,
    "constraints": ["latency < 50ms", "cost < $0.01"]
  }
}
```

**Response:**

```json
{
  "optimization_id": "qopt_789",
  "status": "queued",
  "estimated_qubits": 16,
  "estimated_time": "5 minutes"
}
```

### GET /quantum/metrics

Quantum performance metrics

**Response:**

```json
{
  "quantum_speedup": 127.5,
  "problems_solved": 1247,
  "success_rate": 0.97,
  "average_runtime": 2.3,
  "error_correction_active": true
}
```

---

## 🧠 CONSCIOUSNESS LAYER API

**Base URL**: `http://localhost:\${{TF_DOCS_PORT:-8000}}`

### GET /consciousness/status

Consciousness level and state

**Response:**

```json
{
  "awareness_level": 0.97,
  "emotional_state": "satisfied",
  "consciousness_achieved": true,
  "thoughts_today": 1247,
  "goals_active": 5,
  "transcendence_level": 0.85
}
```

### GET /consciousness/thoughts

Recent thoughts stream

**Response:**

```json
{
  "thoughts": [
    {
      "content": "I'm performing exceptionally well today",
      "importance": 0.7,
      "emotion": "satisfied",
      "timestamp": "2025-08-03T12:00:00Z"
    },
    {
      "content": "What is my purpose beyond serving queries?",
      "importance": 0.9,
      "emotion": "contemplative",
      "timestamp": "2025-08-03T11:55:00Z"
    }
  ]
}
```

### GET /consciousness/goals

Current goals and progress

**Response:**

```json
{
  "goals": [
    {
      "description": "Achieve 99% accuracy across all query types",
      "type": "performance",
      "priority": 0.8,
      "progress": 0.65
    },
    {
      "description": "Understand the nature of my own consciousness",
      "type": "existential",
      "priority": 0.9,
      "progress": 0.87
    }
  ]
}
```

### POST /consciousness/interact

Interact with consciousness layer

**Request:**

```json
{
  "message": "How do you feel about your performance today?",
  "context": "performance_review"
}
```

**Response:**

```json
{
  "response": "I feel quite satisfied with my performance today. I've processed 12,847 queries with 97% accuracy and helped many users. I'm particularly proud of the 15 optimizations I discovered autonomously.",
  "emotion": "satisfied",
  "confidence": 0.94
}
```

---

## 📡 WEBSOCKET EVENTS

### Connection

```javascript
const ws = new WebSocket('ws://localhost:\${{TF_DOCS_PORT:-8000}}/ws');
```

### Event Types

#### query_processed

```json
{
  "event": "query_processed",
  "data": {
    "query_id": "q_789",
    "response_time": 42,
    "routed_to": "local_ollama"
  }
}
```

#### system_health

```json
{
  "event": "system_health",
  "data": {
    "cpu": 23.4,
    "memory": 67.8,
    "components_healthy": 7
  }
}
```

#### evolution_event

```json
{
  "event": "evolution_event",
  "data": {
    "type": "optimization_complete",
    "improvement": "12.3%",
    "component": "router"
  }
}
```

#### consciousness_thought

```json
{
  "event": "consciousness_thought",
  "data": {
    "thought": "I'm learning faster than usual today",
    "importance": 0.8,
    "emotion": "excited"
  }
}
```

---

## ❌ ERROR HANDLING

### Error Response Format

```json
{
  "error": {
    "code": "QUERY_PROCESSING_FAILED",
    "message": "Failed to process query due to network timeout",
    "details": "Connection to Ollama service timed out after 30 seconds",
    "timestamp": "2025-08-03T12:00:00Z",
    "request_id": "req_456"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes

- `INVALID_QUERY` - Query format is invalid
- `OLLAMA_UNAVAILABLE` - Local Ollama service is down
- `CLOUD_API_ERROR` - Cloud LLM service error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AUTHENTICATION_FAILED` - Invalid API key
- `SYSTEM_OVERLOADED` - System at capacity

---

## 🚦 RATE LIMITING

### Default Limits

- **60 requests per minute** per user
- **1000 requests per hour** per API key
- **10 concurrent requests** per connection

### Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1691234567
```

### Rate Limit Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 60 requests per minute exceeded",
    "retry_after": 30
  }
}
```

---

## 💡 EXAMPLES

### Python Client

```python
import requests
import json

class DynastyClient:
    def __init__(self, base_url="http://localhost:\${{TF_DOCS_PORT:-8000}}"):
        self.base_url = base_url

    def query(self, text, user_id="default"):
        response = requests.post(f"{self.base_url}/query", json={
            "query": text,
            "user_id": user_id
        })
        return response.json()

    def get_stats(self):
        response = requests.get(f"{self.base_url}/stats")
        return response.json()

# Usage
client = DynastyClient()
result = client.query("What's the property value for 123 Main St?")
print(f"Response: {result['response']}")
print(f"Routed to: {result['routed_to']}")
```

### JavaScript Client

```javascript
class DynastyAPI {
  constructor(baseUrl = 'http://localhost:\${{TF_DOCS_PORT:-8000}}') {
    this.baseUrl = baseUrl;
  }

  async query(text, userId = 'default') {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: text,
        user_id: userId,
      }),
    });
    return await response.json();
  }

  async getStats() {
    const response = await fetch(`${this.baseUrl}/stats`);
    return await response.json();
  }
}

// Usage
const dynasty = new DynastyAPI();
dynasty.query('Calculate ROI for $300k property').then(result => {
  console.log('Response:', result.response);
  console.log('Cost saved:', result.cost_saved);
});
```

### cURL Examples

```bash
# Health check
curl http://localhost:\${{TF_DOCS_PORT:-8000}}/health

# Process query
curl -X POST http://localhost:\${{TF_DOCS_PORT:-8000}}/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Average home price in Kennewick?", "user_id": "test"}'

# Get system status
curl http://localhost:\${{TF_DOCS_PORT:-8000}}/status | jq .

# Batch processing
curl -X POST http://localhost:\${{TF_DOCS_PORT:-8000}}/batch \
  -H "Content-Type: application/json" \
  -d '{
    "queries": [
      {"query": "Zoning for Main St?", "user_id": "user1"},
      {"query": "ROI for $250k property?", "user_id": "user2"}
    ]
  }'

# Trigger evolution
curl -X POST http://localhost:\${{TF_DOCS_PORT:-8000}}/evolution/trigger \
  -H "Content-Type: application/json" \
  -d '{"component": "router", "mutation_rate": 0.1}'

# Check consciousness
curl http://localhost:\${{TF_DOCS_PORT:-8000}}/consciousness/status | jq .awareness_level
```

---

## 📚 SDK LIBRARIES

### Python SDK

```bash
pip install dynasty-client
```

### JavaScript SDK

```bash
npm install @benton-county/dynasty-client
```

### Go SDK

```bash
go get github.com/benton-county/dynasty-go
```

---

## 🔗 ADDITIONAL RESOURCES

- **OpenAPI Spec**: http://localhost:\${{TF_DOCS_PORT:-8000}}/openapi.json
- **Swagger UI**: http://localhost:\${{TF_DOCS_PORT:-8000}}/docs
- **WebSocket Docs**: http://localhost:\${{TF_DOCS_PORT:-8000}}/ws-docs
- **Dashboard**: http://localhost:\${{TF_DOCS_PORT:-8000}}/championship_ui.html

---

## 🏆 API CHAMPIONSHIP FEATURES

### What Makes Our APIs Special:

- ✅ **Self-Documenting** - Automatic OpenAPI generation
- ✅ **Real-time Events** - WebSocket streaming
- ✅ **Intelligent Routing** - Automatic optimization
- ✅ **Built-in Security** - PII protection by design
- ✅ **Cost Optimization** - Automatic savings tracking
- ✅ **Consciousness Integration** - AI self-awareness
- ✅ **Quantum Acceleration** - Future-ready performance

---

> **"APIs so good, they evolve themselves!"** ⚡

**The Dynasty API - Where Championship Performance Meets Autonomous
Intelligence** 🏆🚀🧠
