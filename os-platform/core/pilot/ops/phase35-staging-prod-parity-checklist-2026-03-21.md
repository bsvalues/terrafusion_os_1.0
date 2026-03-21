# Phase 35 — Staging/Prod Parity Checklist

**Date**: 2026-03-21
**Status**: INVENTORY ONLY (SRE owns execution)
**Baseline**: `199f0f931`

---

## Purpose

Before Phase 35 K8s gate opens, staging must be parity with production intent.
This checklist is a pre-flight inventory. Each item has an owner and a gate.

---

## Tier 1 — Must Match Before Phase 35 Opens

### Database

| Item | Staging State | Prod Intent | Gate |
|------|--------------|-------------|------|
| PostgreSQL version | unknown | 16.x | Must match before cluster bring-up |
| Schema migrations applied | unknown | `446d84021` baseline | `dotnet ef migrations list` must show all applied |
| EF Core seeding | SQLite dev seed | PostgreSQL real schema | Requires `db:seed` against Postgres |
| PACS connection | localhost:1433 (tf-mssql) | county-hosted MSSQL | Phase 35 SRE: wire production MSSQL endpoint |

### Authentication

| Item | Staging State | Prod Intent | Gate |
|------|--------------|-------------|------|
| JWT secret | Dev static (`TerraFusion-Dev-Secret-Key-2026-Do-Not-Use-In-Production!!`) | `TF_JWT_SECRET` (≥256-bit random, rotated per runbook) | **Must rotate before Phase 35** |
| JWT issuer | `TerraFusion.API` | `TerraFusion.API` | Match |
| JWT audience | `TerraFusion.Client` | `TerraFusion.Client` | Match |
| Token expiry | 60 min / 7-day refresh | Same (unless SRE overrides) | Match by default |

### AI Swarm

| Item | Staging State | Prod Intent | Gate |
|------|--------------|-------------|------|
| `AI__SwarmSize` | 50 (Phase 34 rehearsal) | 1,008 (production target) | Phase 35 K8s only — multi-node required |
| Consciousness image | local build | pinned image tag | SRE must tag before deploy |
| SignalR backplane | Redis (compose internal) | Redis (prod cluster) | Parity by default if Redis k8s secret matches |

### Networking

| Item | Staging State | Prod Intent | Gate |
|------|--------------|-------------|------|
| TLS termination | None (dev) | TLS at gateway (port 443) | SRE: cert + Ocelot TLS config before Phase 35 |
| Allowed origins | localhost:3000, localhost:3001 | county domain(s) | Add prod domains to `AllowedOrigins` in appsettings |
| Consul service mesh | Optional (Phase 34) | Required (Phase 35) | SRE: Consul cluster + service registrations |

---

## Tier 2 — Must Match Before Production Cut

### Observability

| Item | Staging State | Prod Intent | Gate |
|------|--------------|-------------|------|
| Prometheus scrape config | Not wired | `/metrics` endpoint on all services | Phase 35 SRE |
| Grafana dashboards | Not provisioned | County ops dashboard | Phase 35 SRE |
| Jaeger tracing | Not wired | OTLP export to Jaeger | Phase 35 SRE |
| Log retention | Dev file sink (30 days) | Prod file sink + external sink | SRE config |

### Security

| Item | Staging State | Prod Intent | Gate |
|------|--------------|-------------|------|
| Audit log table | SQLite dev | PostgreSQL prod | Parity after Postgres migration |
| FISMA audit fields | Auto-populated | Auto-populated | Match — no change needed |
| Security event table | SQLite dev | PostgreSQL prod | Parity after Postgres migration |
| CORS policy | Dev origins | Prod origins | Must update `AllowedOrigins` |

---

## Tier 3 — Phase 36+ (Not Phase 35 Critical Path)

- Keycloak SSO integration
- PVC persistence across node failure testing
- Rolling deploy without downtime
- Multi-county routing (single-county Benton sufficient through Phase 35)
- JWT rotation automation (manual rotation covers Phase 35)

---

## Current Parity Gaps (Known)

1. **JWT secret** — dev static in all running binaries. Rotate before Phase 35 staging.
2. **Postgres** — API runs SQLite in dev. Phase 35 requires Postgres container or cluster. Compose `postgres:5432` service in Phase 34 compose provides local Postgres; SRE wires real cluster for Phase 35.
3. **TLS** — None in compose slice. Phase 35 needs cert provisioning.
4. **Consciousness image tag** — No pinned tag. SRE must `docker build` and tag before cluster deploy.
5. **PACS endpoint** — Phase 34 bridges via `host.docker.internal:1433`. Phase 35 needs county-hosted or replicated MSSQL endpoint with production credentials.
