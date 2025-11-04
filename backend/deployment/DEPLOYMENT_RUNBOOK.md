# TerraFusion Platform — Deployment Runbook

This runbook standardizes how to safely deploy the platform with zero downtime. Use Blue‑Green for API/Operations/Consciousness and Canary for Gateway.

## Pre‑Deployment Checklist

- [ ] Change ticket approved and linked
- [ ] Release notes published and reviewed
- [ ] Helm values for target env verified
- [ ] Database migration plan prepared (and dry‑run tested)
- [ ] On‑call SRE and comms channel confirmed
- [ ] Rollback criteria validated; AUTO_CONFIRM set for emergencies

## Blue‑Green Procedure (API / Operations / Consciousness)

```powershell
# Example: API
$env:NAMESPACE="terrafusion"
$env:SERVICE="terrafusion-api"
$env:IMAGE_TAG="2.4.0"
./backend/deployment/strategies/deploy-blue-green.sh
```

1) Script validates cluster access and determines active (blue/green)
2) Deploys to inactive color, waits for rollout completion
3) Performs health and smoke checks (health, metrics, version)
4) Switches traffic with safety delay and monitors 60s
5) Scales down old color; retains for at least 1 hour for instant fallback

### Service‑specific smoke checks

- API: GET /health, GET /health/ready, GET /api/version
- Consciousness: GET /health, GET /health/agents (expect ≥ 99.5% agents healthy)
- Operations: GET /health, GET /health/counties (39 counties OK)

## Canary Procedure (Gateway)

```powershell
# Example: Gateway
$env:NAMESPACE="terrafusion"
$env:SERVICE="terrafusion-gateway"
$env:IMAGE_TAG="2.4.0"
./backend/deployment/strategies/deploy-canary.sh
```

1) Ensures Flagger CRD present, applies Canary resource
2) Increments traffic (10% → 50%) while Flagger evaluates metrics
3) Promotes to 100% if success thresholds met; rolls back on failure

### Metrics watched (Prometheus)

- Request success rate ≥ 99%
- P99 request duration ≤ 500ms
- Error rate ≤ 1%

## Live Monitoring During Rollout

- Grafana Dashboards: Deployment Overview, Service Health, AI Agents
- Validate:
  - 5xx does not increase
  - P95/P99 latency stable
  - Pod restarts not spiking
  - AI agent health (Consciousness) ≥ 99.5%
  - County sync OK (Operations)

## Failure Handling

- Hit Ctrl+C before traffic switch (Blue‑Green) to abort
- If post‑switch metrics degrade: execute rollback immediately

```powershell
$env:NAMESPACE="terrafusion"
$env:SERVICE="terrafusion-api"
$env:AUTO_CONFIRM="true"
./backend/deployment/strategies/rollback.sh
```

- Declare incident if user impact observed; follow Communications SOP

## Post‑Deployment

- Keep previous color (BG) for ≥ 1 hour
- Review metrics for 60–120 minutes
- Post final status in #terrafusion-deployments with links to dashboards
- Close change ticket with outcomes and action items
