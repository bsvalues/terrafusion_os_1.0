# CP-18 Compliance Evidence Map

Date: 2026-03-19
Phase: CP-18
Gate: G9
Status: COMPLETE

## Control Mapping

| Control Family | Control ID | Required Evidence | Evidence Source | Owner | Freshness Date | Status |
|---|---|---|---|---|---|---|
| Access Control | AC-1 | County-scoped RBAC with JWT claims | CP-14 `ControllerSecurityBoundaryTests` 7/7 | Security | 2026-03-19 | ✅ PASS |
| Access Control | AC-2 | Multi-tenant data isolation (CountyId) | CP-14 G3+G4 sealed | Security | 2026-03-19 | ✅ PASS |
| Audit & Accountability | AU-1 | TerraTrace append-only event log | `sovereign.yaml` Law 5 (audit chain) + TerraTrace event model | Security | 2026-03-19 | ✅ PASS |
| Audit & Accountability | AU-2 | correlationId linkage on all tool invocations | TerraTrace spec — invoke+result events verified | Security | 2026-03-19 | ✅ PASS |
| Configuration Management | CM-1 | No hardcoded secrets in compose files | SEC-001 remediated — Cowlitz credential replaced with env var | Security | 2026-03-19 | ✅ PASS |
| Configuration Management | CM-2 | Environment variable hygiene for all ports | Copilot-instructions port rules enforced; type-check PASS | Security | 2026-03-19 | ✅ PASS |
| Incident Response | IR-1 | Break-glass drill procedure defined | CP-17 `sre-pack.md` + `.github/workflows/autonomy-break-glass-guard.yml` | SRE | 2026-03-19 | ✅ PASS (static) |
| Incident Response | IR-2 | Hypercare plan with P0-P3 classification | CP-17 `hypercare-plan.md` | SRE | 2026-03-19 | ✅ PASS |
| Software Integrity | SI-1 | Dependency quarantine gate | `ci:dependency-scope-quarantine:gate` PASS (15 vs 141 baseline) | Security | 2026-03-19 | ✅ PASS |
| Software Integrity | SI-2 | Governance gates (phase83/85/86) | `phase83` 56/56, `phase85` 22/22, `phase86` 9/9 | Security | 2026-03-19 | ✅ PASS |
| System & Communications | SC-1 | MCP tool validation (87 tools, 9 categories) | `validate:compliance` EXIT 0 | Security | 2026-03-19 | ✅ PASS |
| AI Operational Safety | AI-1 | HITL requirement (sovereign Law 1) | `sovereign.yaml` Law 1 verified | Security | 2026-03-19 | ✅ PASS |
| AI Operational Safety | AI-2 | Swarm load / queue guard / break-glass runtime proof | `swarm-load-proof.md`, `swarm-queue-guard-proof.md`, `swarm-break-glass-proof.md` | SRE | — | ⏸ DEFERRED (staging) |

## Coverage Notes

- All static controls: PASS
- AI-2 (swarm runtime proofs): DEFERRED — requires live staging environment with Docker + authorized AI Swarm lane. Not a Copilot lane action (`specialized/` read-only).
- Stale evidence threshold: 90 days. All entries current as of 2026-03-19.
