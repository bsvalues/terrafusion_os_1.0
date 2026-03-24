# CP-16 Risk Register

Date: 2026-03-19
Phase: CP-16
Gate: G7
Status: CLOSED — no active hard-stops; all risks classified

## Residual Risks at Close

| Risk | Classification | Rationale / Owner / Deadline |
|---|---|---|
| Live environment Docker startup verification | **Deferred** | Docker Desktop + WSL2 unreachable in current build environment (exit code 1 on `docker ps`). Contract layer proven via registry tests. Live startup deferred to CP-17 SRE rehearsal window. Owner: SRE. Deadline: CP-17 execution. |
| Cowlitz compose hardcoded credentials | **Deferred** | `compose/docker-compose.cowlitz.yml` uses static password `terrafusion_cowlitz_secure_2024`. Must move to env var before production. Non-blocking for G7 contract verification. Owner: Platform Security. Deadline: CP-18 security sweep. |
| Yakima live assessor journey (end-to-end) | **Deferred** | Requires live staging environment. Controller-level isolation proven at CP-14. Full E2E journey deferred to CP-17 SRE window. Owner: SRE + Suite Runtime Owner. Deadline: CP-17. |
| Cowlitz live cross-county isolation test | **Deferred** | Requires live staging environment with all 3 county environments running. Controller-level isolation proven at CP-14. Deferred to CP-17. Owner: SRE. Deadline: CP-17. |

## No Blocked Risks

No hard-stop active. All items are deferred with declared owners and deadlines.

## No Accepted Risks

All items are explicitly deferred — none silently accepted.

## CP-17 Entry Conditions

CP-17 (G8 — SRE/Restore/DR/Hypercare) is now unblocked:
- G7 Service Registry Activation: ✅ PASS (contract layer)
- All open risks have owners and CP-17 as the resolution deadline
- No hard-stops
