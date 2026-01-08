# Phase 9.1: The Nervous System — SPEC

## Objective
Deploy TerraFusion telemetry stack: OpenTelemetry Collector, Prometheus, Jaeger, Grafana.
Prove the Brain (Python) and Muscle (C#) emit traces/metrics into the stack.

## Architecture

- Apps emit OTLP (grpc/http) → otel-collector
- Traces: otel-collector → jaeger (grpc)
- Metrics: otel-collector exposes prometheus exporter endpoint → prometheus scrapes
- Grafana reads Prometheus datasource

## Success Criteria (PASS CONDITIONS)
### Compose & Boot
- `docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml config` exits 0
- `docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up -d` exits 0
- No crashlooping containers: `docker ps` shows services Up

### UIs Reachable
- Grafana: http://localhost:3000 returns login page (200)
- Prometheus: http://localhost:9090 returns UI (200)
- Jaeger: http://localhost:16686 returns UI (200)

### Data Flow
- Prometheus shows target UP for otel-collector scrape endpoint
- Jaeger shows traces for BOTH services:
  - service.name = terrafusion-iron (or your API name)
  - service.name = terrafusion-cortex (or your Python app name)

### Regression
- Soul (frontend) still serves
- Iron (C#) still serves API endpoints
- Brain (Python) still serves /api/chat

## Verification Commands
```bash
# Compose validation
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml config

# Boot
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up -d

# Status
docker ps

# UI checks
curl -sS -I http://localhost:3000 | head
curl -sS -I http://localhost:9090 | head
curl -sS -I http://localhost:16686 | head

# Prometheus targets (simple)
curl -sS http://localhost:9090/-/healthy
curl -sS http://localhost:9090/api/v1/targets | head

# Generate traffic (hit both services)
curl -sS http://localhost:5000/health || true
curl -sS -X POST http://localhost:8000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"Telemetry smoke test.","context":{"user_role":"assessor"}}' | head
```

## Rollback Plan

* `docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml down`
* revert commits if needed

## AGENT SCRATCHPAD

(append-only notes)
