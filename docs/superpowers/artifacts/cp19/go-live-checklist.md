# CP-19 Go-Live Checklist

Date: 2026-03-21 (Phase 30 final update; original 2026-03-19)
Phase: CP-19 / Phase 30 (Claude Code Unified Phase Map 19-30) — Final Decision Gate
Gate: G10
Status: ✅ SEALED — G10 GREEN, Phase 30 complete 2026-03-21

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
| G8 | docs/superpowers/artifacts/cp17/restore-proof.md + dr-proof.md + sre-pack.md + hypercare-plan.md | Operations Owner | ✅ SEALED 2026-03-21 — Phase 26 drills COMPLETE: 26-A backup PASS, 26-B failover tabletop PASS, 26-C break-glass 17/17 PASS, 26-D hypercare sealed |
| G9 | docs/superpowers/artifacts/cp18/security-closure-packet.md + compliance-evidence-map.md | Security Owner | ✅ SEALED 2026-03-21 — Phase 27: SEC-001 through SEC-025 all remediated; 0 open criticals/highs; type-check PASS; build EXIT 0; SRE-LIVE risk RESOLVED |
| G10 | this checklist + decision-memo.md + rollback-plan.md + CP22 governance seal | Founder/Release Authority | ✅ SEALED 2026-03-21 — Phase 30 final gate complete |

## Phase 30 Evidence Chain (Unified Phase Map 19-30)

| Phase | Evidence | Status |
|---|---|---|
| Phase 19 — Truth Gate | `.governance/workflow/TRUTH_GATE_2026-03-20.md` | ✅ PASS |
| Phase 20 — PACS Integration (static) | `cp19/pacs-phase20-static.md` | ✅ PASS (static) — live DB DEFERRED, LOW risk accepted |
| Phase 21 — Security & Isolation | `CP14_ISOLATION_RBAC_PROOF_2026-03-20.md` | ✅ 7/7 controller tests |
| Phase 22 — Shell Contract | `CP15_ROUTE_READINESS_PROOF_2026-03-20.md` | ✅ 8/8 tab surfaces REAL |
| Phase 23 — Multi-County Federation | `CP16_FEDERATION_PROOF_2026-03-20.md` | ✅ 29/29 registry tests |
| Phase 24 — PR #656 Integrity | `CP17_PR656_INTEGRITY_PROOF_2026-03-21.md` | ✅ R1 evidence frozen at `eef087493` |
| Phase 25 — Honesty Sweep | `CP18_HONESTY_SWEEP_WIRING_2026-03-21.md` | ✅ 57/57 wiring contract tests |
| Phase 26 — SRE Rehearsal | `CP19_SRE_OPS_REHEARSAL_2026-03-21.md` | ✅ 4/4 drills (G8 GREEN) |
| Phase 27 — Compliance Seal | `CP20_SECURITY_COMPLIANCE_SEAL_2026-03-21.md` | ✅ FISMA + build EXIT 0 (G9 GREEN) |
| Phase 28 — AI Swarm Stability | `CP21_AI_SWARM_STABILITY_2026-03-21.md` | ✅ 20/20 backpressure + 1,008 config |
| Phase 29 — TerraCanon Codex | `CP23_TERRACANON_CODEX_2026-03-21.md` | ✅ STATIC PASS (29/29 canon tests) — live Codex DEFERRED 2026-03-25 |
| Phase 30 — Final Decision Gate | `CP22_FINAL_DECISION_GATE_2026-03-21.md` | ✅ THIS DOCUMENT |

## Final Governance Suite Re-Run (Phase 30 — 2026-03-21)

| Suite | Command | Result |
|---|---|---|
| TypeScript type-check | `tsc --noEmit` | ✅ EXIT 0 |
| Frontend build | `pnpm run build` | ✅ EXIT 0 |
| Vitest (full) | `pnpm run test --run` | ✅ 6168/6168 PASS |
| phase83 tools contract | `node --test phase83-tools.test.mjs` | ✅ 56/56 PASS |
| phase85+86 governance | `node --test phase85*.mjs phase86*.mjs` | ✅ 31/31 PASS |
| Canon governance | `node --test canon-doctor/ping/reopen/barrel` | ✅ 29/29 PASS |
| Backend contracts | `dotnet test --filter Phase35G|Phase9B|Phase13` | ✅ 31/31 PASS |
| dotnet build | `dotnet build TerraFusion.sln -c Release` | ✅ 0 errors (4 pre-existing warnings) |
| Backpressure contract | `node --test scaling.backpressure.contract.test.ts` | ✅ 20/20 PASS |
| R1 evidence | `node tools/r1/verify-evidence.mjs` | ✅ PASS (SHA `eef087493`) |

## Final Readiness

- G3–G10: ✅ All sealed 2026-03-21.
- Secrets sweep: ✅ COMPLETE — SEC-001 through SEC-025, all CLOSED.
- SRE drills: ✅ COMPLETE — Phase 26 (backup PASS, failover tabletop, break-glass 17/17, hypercare sealed).
- **Hard blockers remaining (SRE-owned, no code changes required):**
  - SEC-005-ROTATE: generate new `TF_JWT_SECRET` (`openssl rand -base64 64`) and rotate in all environments
  - SRE-O1-OPS: deploy all `TF_*` env vars to staging + prod (see launch-packet.md env var table)
- PACS integration: deferred (environment dependency — LOW risk, not a launch blocker for pilot counties).
- Swarm Phase 8 (8-A/B/C) live rehearsals: deferred to AI Swarm lane + staging window (MEDIUM risk, accepted).
- TerraCanon Codex: DEFERRED BY POLICY (Codex service post-March-25, non-blocking).
- Readiness statement: FULL STATIC + CONTRACT EVIDENCE LAYER COMPLETE. Launch CONDITIONAL on JWT rotation, env var deployment, and production PACS SQL Server (for counties with PACS sync dependency).
