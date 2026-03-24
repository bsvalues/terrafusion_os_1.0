# CP-18 Compliance Evidence Map

Date: 2026-03-21 (Phase 27 update; original 2026-03-19)
Phase: CP-18 / Phase 27 (Claude Code) — Security & Compliance Seal
Gate: G9
Status: ✅ COMPLETE — Phase 27 sealed 2026-03-21

## Control Mapping

| Control Family | Control ID | Required Evidence | Evidence Source | Owner | Freshness Date | Status |
|---|---|---|---|---|---|---|
| Access Control | AC-1 | County-scoped RBAC with JWT claims | CP-14 `ControllerSecurityBoundaryTests` 7/7 | Security | 2026-03-19 | ✅ PASS |
| Access Control | AC-2 | Multi-tenant data isolation (CountyId) | CP-14 G3+G4 sealed | Security | 2026-03-19 | ✅ PASS |
| Audit & Accountability | AU-1 | TerraTrace append-only event log | `sovereign.yaml` Law 5 (audit chain) + TerraTrace event model | Security | 2026-03-19 | ✅ PASS |
| Audit & Accountability | AU-2 | correlationId linkage on all tool invocations | TerraTrace spec — invoke+result events verified | Security | 2026-03-19 | ✅ PASS |
| Configuration Management | CM-1 | No hardcoded secrets in compose files | SEC-001 through SEC-025 all remediated | Security | 2026-03-19 | ✅ PASS |
| Configuration Management | CM-2 | Environment variable hygiene for all ports | Copilot-instructions port rules enforced; type-check PASS | Security | 2026-03-21 | ✅ PASS |
| Incident Response | IR-1 | Break-glass drill executed | CP-19 Phase 26-C: 17/17 guard checks PASS — drill `drill-20260321-004100-local` at 2026-03-21T00:41:10Z | SRE | 2026-03-21 | ✅ PASS (live drill) |
| Incident Response | IR-2 | Hypercare plan with P0-P3 classification | CP-19 `hypercare-plan.md` sealed 2026-03-21 (30-day window, SLA targets defined) | SRE | 2026-03-21 | ✅ PASS |
| Software Integrity | SI-1 | Dependency quarantine gate | `ci:dependency-scope-quarantine:gate` PASS (15 vs 141 baseline) | Security | 2026-03-19 | ✅ PASS |
| Software Integrity | SI-2 | Governance gates (phase83/85/86) | `phase83` 56/56, `phase85` 22/22, `phase86` 9/9 | Security | 2026-03-19 | ✅ PASS |
| System & Communications | SC-1 | MCP tool validation (87 tools, 9 categories) | `validate:compliance` EXIT 0 | Security | 2026-03-19 | ✅ PASS |
| AI Operational Safety | AI-1 | HITL requirement (sovereign Law 1) | `sovereign.yaml` Law 1 verified | Security | 2026-03-19 | ✅ PASS |
| AI Operational Safety | AI-2 | Swarm load / queue guard / break-glass runtime proof | `swarm-load-proof.md`, `swarm-queue-guard-proof.md`, `swarm-break-glass-proof.md` | SRE | — | ⏸ DEFERRED (staging) |
| Code Quality | CQ-1 | TypeScript type-check clean | `tsc --noEmit` EXIT 0 — 2026-03-21 | Platform | 2026-03-21 | ✅ PASS |
| Code Quality | CQ-2 | Production build clean | `pnpm run build` EXIT 0 — 2026-03-21; CSS @media minification warnings = known Vite/Tailwind artifact | Platform | 2026-03-21 | ✅ PASS |
| Component Wiring | CW-1 | R3-CX tabs use governed API (not stubs) | CP-18 Phase 25 honesty sweep — 57/57 wiring contract tests PASS | Platform | 2026-03-21 | ✅ PASS |

## Phase 27 Updates (2026-03-21)

- IR-1 upgraded from PASS (static) → PASS (live drill): Phase 26-C break-glass drill executed at 2026-03-21T00:41:10Z, 17/17 checks
- SRE-LIVE risk: RESOLVED — Phase 26 completed all 4 drills (26-A backup PASS, 26-B failover tabletop PASS, 26-C break-glass 17/17 PASS, 26-D hypercare sealed)
- CQ-1 / CQ-2 added: type-check PASS, build EXIT 0 confirmed 2026-03-21
- CW-1 added: R3-CX honesty sweep contract (Phase 25) — 57/57 tests confirming real API wiring

## Coverage Notes

- All static controls: PASS
- AI-2 (swarm runtime proofs): DEFERRED — requires live staging environment with Docker + authorized AI Swarm lane. Not a Copilot lane action (`specialized/` read-only).
- WCAG 2.1 AA: `eslint-plugin-jsx-a11y` not installed; `@storybook/addon-a11y` present for Storybook stories. No a11y violations detected in base ESLint run. 10 pre-existing TypeScript code-quality lint errors (no-useless-catch ×4, no-explicit-any ×4, no-unsafe-finally ×1, no-useless-escape ×1) in legacy terra-levy/collaboration components — all pre-date Phase 25. `government:compliance` script broken on Windows (single-quote shell quoting); classified as platform limitation.
- Stale evidence threshold: 90 days. All entries current as of 2026-03-21.
