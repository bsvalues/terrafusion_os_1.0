# Phase 34 — Swarm Rehearsal Definition
**Date**: 2026-03-21
**Status**: DEFINITION (not executing)
**Baseline**: `446d84021`

---

## What Must Be Proven

Phase 34 is NOT about running 1,008 agents in production.
Phase 34 is about proving **orchestration semantics** at compose scale before any cluster spend.

Four minimum truths required before Phase 34 is declared green:

| # | Claim | Proof method |
|---|-------|-------------|
| 1 | All three service tiers start cleanly and reach `/health` | `docker-compose up` + health poll |
| 2 | API→Consciousness routing works (SignalR hub connects) | `/api/hubs/system` handshake log |
| 3 | Agent swarm initializes to configured size without OOM or crash loop | Consciousness `/health` + swarm status endpoint |
| 4 | PACS adapter reaches pacs_oltp from inside compose network | `ops/pacs/proof` contractValid=True from within compose |

Nothing else. Not 1,008 agents. Not Consul registration. Not Prometheus dashboards.

---

## Docker Compose Is Enough For Phase 34

K8s is **not required** for Phase 34. Here is why:

**What Compose proves:**
- Service boot order and dependency resolution (postgres → redis → consciousness → api → gateway)
- Inter-service DNS (consciousness:3004, api:5000, postgres:5432)
- Shared network isolation
- SignalR hub connectivity between API and clients
- PACS adapter connectivity (pacs_oltp is localhost:1433 — needs host network or compose override)

**What only K8s proves:**
- Horizontal pod autoscaling under real load
- Multi-node agent distribution (the 1,008-agent stunt)
- Rolling deploy without downtime
- PVC persistence across node failure

K8s is the Phase 35 SRE gate. Phase 34 proves the semantics are sound first.

---

## Compose Rehearsal Slice Design

### Pre-conditions
- `tf-mssql` container running with pacs_oltp/pacs_golive restored (already true at 446d84021)
- `appsettings.Development.local.json` wired with PACS credentials (already true)
- Docker Desktop running

### Scope: what docker-compose.yml must bring up

```
postgres:5432        ← TerraFusion app DB (not PACS)
redis:6379           ← Cache + SignalR backplane
consciousness:3004   ← Swarm orchestrator
api:5000             ← Kernel (must reach pacs_oltp on host)
gateway:3002         ← Shell (optional for this rehearsal)
```

### PACS adapter in compose context

The pacs_oltp database runs on `tf-mssql` container with port `localhost:1433` exposed on the host. When the API runs inside compose, it can't reach `localhost:1433` — it needs `host.docker.internal:1433` (Windows/Mac Docker) or `host-gateway`.

**Compose override needed for Phase 34:**
```yaml
# docker-compose.override.yml (Phase 34 rehearsal)
services:
  api:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      ConnectionStrings__PacsConnection: "Server=host.docker.internal,1433;Database=pacs_oltp;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;"
      ConnectionStrings__PacsSalesConnection: "Server=host.docker.internal,1433;Database=pacs_golive;User Id=sa;Password=TF_Pacs2026!;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;"
```

This is the only compose addition required to bridge Phase 33's live PACS proof into Phase 34.

### Rehearsal agent scale

Use **AI__SwarmSize: 50** for the rehearsal, not 1000. Proves initialization semantics without requiring the host RAM that 1,000 in-memory agents would need. The config path is proven; scale is a tuning variable.

---

## What Is NOT Phase 34

- Full 1,008-agent stunt → Phase 35 / K8s cluster
- Consul service mesh → compose has it but it's not critical path
- Prometheus/Grafana dashboards → monitoring, not orchestration proof
- Multi-county routing → single-county Benton rehearsal is sufficient
- JWT rotation → Phase 35 SRE gate

---

## Phase 34 Exit Criteria

All four minimum truths green + one governance commit:

```
seal(cp27): Phase 34 compose rehearsal — orchestration semantics proven
```

Evidence required:
- `docker-compose up` log showing all health checks green
- `GET /health` 200 from api:5000 inside compose
- `GET /ops/pacs/proof` contractValid=True from api:5000 inside compose
- Consciousness `/health` showing swarm initialized (N agents, no crash loop)
- SignalR hub connection log confirming API↔Consciousness routing

---

## Phase 34 Is Not Gated on SRE

The old memory file listed Phase 34 as "K8s staging — SRE gated."
That was before Phase 33 proved the contract layer.

**Revised gate:** Phase 34 needs only Docker Desktop (already on this machine) and the compose override for PACS bridge. SRE is not in the critical path for compose-slice rehearsal. SRE owns the K8s production gate (Phase 35).

**When to open Phase 34:** Immediately after this definition is committed. The only prerequisite is reading the Consciousness service health endpoint to confirm what it actually returns, then writing the rehearsal override file.

---

## Open Question (answer before coding Phase 34)

Does `GET /api/swarm/status` or equivalent exist on the running API?
Check: `http://localhost:5000/api/consciousness/status` or similar.
If not, the rehearsal proof falls back to Consciousness container `/health` alone — which is sufficient.
