# CP-16 Service Registry Contract Proof

Date: 2026-03-19
Phase: Phase 3 — Service Registry + Multi-County Federation
Gate: G7 (Service Registry Activation)
Status: PENDING

## Registry Requirements

- All services registered against registry (`platform.json` → Consul)
- Health probes green for all registered services
- Contract-verified: registry matches `platform.json` declared services

## platform.json Declared Services

Source: `platform.json` at workspace root.

Services requiring registry confirmation:
- Backend API (TerraFusion Core)
- Frontend / OS Shell
- Postgres (primary data store)
- Redis (cache / pub-sub)
- AI Swarm (consciousness microservice)
- TerraCanon IDE (when active)

## Registry Activation Steps

```bash
# 1. Verify platform.json service declarations
cat platform.json | jq '.services | keys'

# 2. Start services with registry enabled
docker-compose -f docker-compose.yml up -d

# 3. Verify Consul registry
curl http://localhost:8500/v1/catalog/services

# 4. Health check all registered services
curl http://localhost:8500/v1/health/state/passing
```

## Pass Condition (G7)

- All `platform.json` services appear in Consul registry
- All health probes: passing
- No service declaration gaps between `platform.json` and actual registry

## Evidence Fields (to fill after activation)

| Service | Registry Status | Health Probe | Timestamp |
|---|---|---|---|
| Backend API | PENDING | PENDING | |
| OS Shell | PENDING | PENDING | |
| Postgres | PENDING | PENDING | |
| Redis | PENDING | PENDING | |
| AI Swarm | PENDING | PENDING | |

## Blocker

Docker/WSL currently unreachable (0x8007274c). Docker Desktop + WSL2 must be started by operator.
Registry activation is an environment execution responsibility.
