# TerraFusion API Gateway - Helm Chart

🌐 **Government. Transcended.** - Production-ready Ocelot API Gateway on port 3002

## Overview

Enterprise API Gateway with routing, rate limiting, load balancing, and FISMA-High compliance.

**Features:**
- Ocelot API Gateway with dynamic routing
- Rate limiting (1000 RPS global, per-route customization)
- Circuit breaker pattern
- CORS support
- Load balancing (Round Robin)
- Distributed tracing (Jaeger)
- FISMA-High compliance

## Installation

```bash
helm install terrafusion-gateway ./terrafusion-gateway \
  --namespace terrafusion \
  --values values-production.yaml
```

## Configuration

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `3` |
| `service.port` | Service port | `3002` |
| `rateLimiting.global.requestsPerSecond` | Global rate limit | `1000` |
| `autoscaling.minReplicas` | Min replicas | `3` |
| `autoscaling.maxReplicas` | Max replicas | `20` |

### Backend Routes

Routes automatically configured for:
- `/api/*` → terrafusion-api:5000
- `/consciousness/*` → terrafusion-consciousness:3004
- `/operations/*` → terrafusion-operations:5003

## Monitoring

Access metrics:
```bash
kubectl port-forward svc/terrafusion-gateway 3002:3002 -n terrafusion
curl http://localhost:3002/metrics
```

## Support

- Documentation: https://docs.terrafusion.gov/gateway
- Email: gateway-support@terrafusion.gov

---

🌐 **Government. Transcended.** - API Gateway excellence for 39 Washington State counties.
