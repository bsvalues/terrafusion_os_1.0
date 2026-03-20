# CP-19 Launch Packet

Date: 2026-03-19
Phase: CP-19
Gate: G10
Status: COMPLETE (pre-conditions pending — see risk-register.md)

## Current Authorization Reconciliation

Use the current operating authorization memo as the top-level truth reconciler for this packet:

- `os-platform/core/pilot/ops/post-phase25-release-authorization-packet-2026-03-19.md`

Interpretation:

- CP-19 static/repository readiness remains sufficient for launch-packet preparation.
- Production traffic authorization remains `HOLD` until the pre-launch gate below is fully green.

## Launch Window

- Planned start: TBD (after live rehearsal pre-conditions met)
- Planned end: TBD + 4 hr change window
- Change window owner: Operations Owner
- Pilot counties: Yakima County, WA + Cowlitz County, WA

## Pre-Launch Gate (must be green before T-0)

| Item | Owner | Status |
|---|---|---|
| **SEC-005-ROTATE**: Generate new `TF_JWT_SECRET` (`openssl rand -base64 64`) and rotate in all envs | Security / SRE | ⛔ HARD BLOCKER |
| **SRE-O1-OPS**: Deploy all `TF_*` env vars to staging + prod (see table below) | SRE | ⛔ REQUIRED |
| Pre-launch DB snapshot captured | SRE | ⏸ Pre-condition |
| On-call rotation live + page-tested | Platform Lead | ⏸ Pre-condition |
| Swarm Phase 8-A/B/C live rehearsals | SRE / AI Swarm Lane | ⏸ Pre-condition |
| SRE live restore + DR rehearsals | SRE | ⏸ Pre-condition |
| Founder/Release Authority sign-off | Founder | ⏸ Pre-condition |

### SRE-O1-OPS: Required Env Vars (all must be set before T-0)

| Env Var | Scope | Notes |
|---|---|---|
| `TF_JWT_SECRET` | Production + Staging | **CRITICAL — rotate from prior value; use `openssl rand -base64 64`** |
| `TF_PROD_DB_PASSWORD` | Production | Main DB password for `docker-compose.production-optimized.yml` |
| `TF_PROD_DB_REPLICATION_PASSWORD` | Production | Replication password |
| `TF_GRAFANA_PASSWORD` | Production + Staging | Grafana admin — all compose files |
| `TF_COWLITZ_DB_PASSWORD` | Cowlitz County | County-scoped DB password |
| `TF_YAKIMA_GRAFANA_PASSWORD` | Yakima County | County-scoped Grafana password |
| `TF_DB_PASSWORD` | Staging | Used by backend `appsettings.json` base configs |
| `TF_DEV_DB_PASSWORD` | Dev only | Dev stack only — not required in prod |
| `TF_DEV_JWT_SECRET` | Dev only | Dev stack only — not required in prod |
| `TF_DEV_PACS_PASSWORD` | Dev only | Harris PACS dev connection — not required in prod |

Full canonical list with descriptions: see `.env.example` at repo root.

## Run of Show

| Time | Action | Owner | Evidence |
|---|---|---|---|
| T − 60 min | Final `pnpm run governance:check` + `pnpm run validate:compliance` | Platform Team | Exit 0 both |
| T − 30 min | `pwsh -File ops/dev/tf.ps1 status` — all containers healthy | SRE | Green output |
| T − 15 min | Notify stakeholders (county contacts, on-call) | Operations Owner | Comms channel |
| T − 5 min | Open TerraTrace audit session — confirm correlationId active | Security Owner | Trace console |
| T+0 | Open traffic gate — pilot counties (Yakima + Cowlitz) | Operations Owner | WAF rule |
| T+5 min | Auth smoke test per county — JWT county claims verified | Platform Team | Log output |
| T+10 min | Parcel load smoke test per county | Platform Team | HTTP 200s |
| T+15 min | RBAC boundary check — cross-county request returns 403 | Security Owner | Log output |
| T+30 min | Error rate check — must be < 1% | SRE | Observability bridge |
| T+60 min | Go/no-go call — proceed to full window or trigger rollback | Operations Owner | All checks green |
| T+4 hr | Change window close — declare launch success | Operations Owner | Signed memo |

## Communications

| Audience | Channel | Owner | Trigger |
|---|---|---|---|
| Internal team | Internal comms | Operations Owner | T − 15 min |
| County IT contacts (Yakima, Cowlitz) | Designated channel | Operations Owner | T − 15 min |
| On-call roster | PagerDuty/Opsgenie | Platform Lead | T+0 auto-page if P0 fires |
| Rollback notice | Internal comms | Operations Owner | If RB trigger fires |

## Post-Launch Validation

| Checkpoint | Owner | Success Criteria | Status |
|---|---|---|---|
| Error rate < 1% at T+30 min | SRE | Observability bridge green | ⏸ At launch |
| County data isolation verified | Security Owner | No cross-county data in responses | ⏸ At launch |
| TerraTrace audit trail continuous | Security Owner | All events with correlationId | ⏸ At launch |
| Hypercare period (72 hr) active | SRE | On-call staffed per hypercare plan | ⏸ At launch |
