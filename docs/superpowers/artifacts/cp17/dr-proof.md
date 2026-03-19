# CP-17 Disaster Recovery Proof

Date: 2026-03-19
Phase: Phase 6 — SRE / Operations
Gate: G8 (SRE Rehearsals)
Status: PENDING — staging environment required

## Failover Rehearsal (Roadmap Phase 6-B)

### Procedure

1. Simulate primary service failure
2. Verify failover activates correctly
3. Verify recovery to normal state

### Scenarios

| Scenario | Method | Expected Result |
|---|---|---|
| Backend API failure | `docker stop terrafusion-backend` | Load balancer routes to replica |
| Postgres primary failure | Stop primary, promote replica | Application reconnects to replica |
| Redis failure | `docker stop terrafusion-redis` | Circuit breaker engages, app degrades gracefully |

### Commands

```bash
# Simulate backend failure
docker stop terrafusion-backend
# Verify: requests route to replica or return appropriate error
curl http://localhost:${TF_API_PORT:-5046}/health  # expect 200 from replica

# Simulate DB failover
docker stop terrafusion-postgres-primary
# Verify: replica promoted, app reconnects
pwsh -File ops/dev/tf.ps1 status  # expect services healthy

# Recovery verification
docker start terrafusion-backend terrafusion-postgres-primary
pwsh -File ops/dev/tf.ps1 status  # expect all services restored
```

### Evidence Fields (to fill after rehearsal)

| Scenario | Failure Method | Failover Result | Recovery Time | Status |
|---|---|---|---|---|
| Backend API failure | docker stop | — | — | PENDING |
| DB primary failure | container stop | — | — | PENDING |
| Redis failure | container stop | — | — | PENDING |
| Full recovery | restart all | — | — | PENDING |

## Pass Condition

All specified failure scenarios tested. Failover activates correctly. Recovery to normal state verified.
Recovery time objectives (RTO) documented.
