# CP-19 Go-Live Checklist

Date: 2026-03-19 (updated 2026-03-19 session 2)
Phase: CP-19
Gate: G10
Status: COMPLETE (static layer) — live rehearsals deferred pre-condition

## Current Authorization Reconciliation

Top-level reconciler:

- `os-platform/core/pilot/ops/post-phase25-release-authorization-packet-2026-03-19.md`

This checklist remains the CP-19 gate ledger for static evidence, but it must not be read as authority to open production traffic while the reconciled authorization packet remains `HOLD` on live pre-traffic conditions.

## Gate Evidence Checklist

| Gate | Evidence Reference | Owner | Status |
|---|---|---|---|
| G1 | .governance/workflow/TRUTH_GATE_2026-03-19.md | Orchestrator | pass |
| G2 | docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md | Orchestrator | pass |
| G3 | docs/superpowers/artifacts/cp14/isolation-proof.md | Platform Security Owner | ✅ SEALED 2026-03-19 — 7/7 controller security tests, county isolation verified |
| G4 | docs/superpowers/artifacts/cp14/rbac-proof.md | Platform Security Owner | ✅ SEALED 2026-03-19 — JWT county claims RBAC fully verified |
| G5 | docs/superpowers/artifacts/cp15/route-readiness-map.md | Suite Runtime Owner | ✅ SEALED 2026-03-19 — all routes classified REAL/SAMPLE-TRANSPARENT, 0 NOT-ASSESSED |
| G6 | docs/superpowers/artifacts/cp15/workbench-host-proof.md | Workbench Owner | ✅ SEALED 2026-03-19 — 8/8 tab surfaces verified (15/15 gate tests) |
| G7 | docs/superpowers/artifacts/cp16/registry-contract-proof.md + yakima-proof.md + cowlitz-proof.md | Platform Core Owner | ✅ SEALED 2026-03-19 — 29/29 registry contract tests; static verification PASS; live activation deferred to SRE |
| G8 | docs/superpowers/artifacts/cp17/restore-proof.md + dr-proof.md + sre-pack.md + hypercare-plan.md | Operations Owner | ✅ SEALED 2026-03-19 — all runbooks complete; live rehearsals deferred to SRE window |
| G9 | docs/superpowers/artifacts/cp18/security-closure-packet.md | Security Owner | ✅ SEALED 2026-03-19 — O1 sweep complete: SEC-001 through SEC-018 (9 CRITICAL + 9 HIGH) all remediated; 0 open criticals/highs; swarm Phase 8 deferred to AI Swarm lane |
| G10 | this checklist + decision-memo.md + rollback-plan.md + codex-integration-proof.md + `os-platform/core/pilot/ops/post-phase25-release-authorization-packet-2026-03-19.md` | Founder/Release Authority | ✅ STATIC LAYER PASS — production traffic still `HOLD` pending live rehearsals + formal signatures |

## Additional Required Evidence

| Item | Evidence | Status |
|---|---|---|
| Sprint 0 closed | docs/superpowers/artifacts/cp14/sprint0-closure-checklist.md | partial — S0-B/C/D env pending |
| PACS integration live | docs/superpowers/artifacts/cp14/pacs-proof.md | env pending |
| PR #656 integrity | docs/superpowers/artifacts/cp-r3/pr656-integrity-proof.md | pass |
| Post-Phase-3 gate rerun | docs/superpowers/artifacts/cp-r3/gate-rerun-results.md | pending Phase 3 |
| Honesty Sweep | .governance/workflow/HONESTY_SWEEP_2026-03-19.md | PASS — 4/4 surfaces REAL |
| TerraCanon Codex | docs/superpowers/artifacts/cp19/codex-integration-proof.md | reserved (post-2026-03-25) |

## Final Readiness

- G3–G9: ✅ All sealed 2026-03-19.
- O1 secrets sweep: ✅ COMPLETE — SEC-001 through SEC-018, all CLOSED.
- **Hard blockers (SRE-owned, no code changes required):**
  - SEC-005-ROTATE: generate new `TF_JWT_SECRET` (`openssl rand -base64 64`) and rotate in all environments
  - SRE-O1-OPS: deploy all `TF_*` env vars to staging + prod (see launch-packet.md env var table)
- PACS integration: deferred (environment dependency — not a launch blocker for pilot counties).
- Docker/WSL: `tf.ps1 status` exits 0; Docker daemon not running locally (expected — live in staging/prod via SRE).
- Swarm Phase 8 (8-A/B/C) live rehearsals: deferred to AI Swarm lane + staging window.
- SRE live restore/DR: deferred to SRE window.
- TerraCanon Codex: reserved post-2026-03-25 (not a G10 blocker).
- Readiness statement: static contract layer COMPLETE. Launch CONDITIONAL on env var deployment, live rehearsal completion, and formal signatures before production traffic.
