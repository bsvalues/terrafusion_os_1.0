# CP-19 Launch Packet

Date: 2026-03-19
Phase: CP-19
Gate: G10
Status: COMPLETE (pre-conditions pending — see risk-register.md)

## Launch Window

- Planned start: TBD (after live rehearsal pre-conditions met)
- Planned end: TBD + 4 hr change window
- Change window owner: Operations Owner
- Pilot counties: Yakima County, WA + Cowlitz County, WA

## Pre-Launch Gate (must be green before T-0)

| Item | Owner | Status |
|---|---|---|
| Swarm Phase 8-A/B/C live rehearsals | SRE / AI Swarm Lane | ⏸ Pre-condition |
| SRE live restore + DR rehearsals | SRE | ⏸ Pre-condition |
| Pre-launch DB snapshot captured | SRE | ⏸ Pre-condition |
| On-call rotation live + page-tested | Platform Lead | ⏸ Pre-condition |
| Founder/Release Authority sign-off | Founder | ⏸ Pre-condition |
| TF_COWLITZ_DB_PASSWORD env var set in prod | SRE | ⏸ Pre-condition |

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
