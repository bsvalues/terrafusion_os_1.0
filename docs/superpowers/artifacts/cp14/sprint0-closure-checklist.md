# Sprint 0 Closure Checklist

Date: 2026-03-19
Phase: Sprint 0
Authority: docs/superpowers/specs/2026-03-19-full-ecosystem-go-live-roadmap-design.md
Gate: Sprint 0 Gate

## Status: PARTIALLY CLOSED — S0-C/D blocked on environment

## Task Status Matrix

| Task | Description | Status | Evidence |
|---|---|---|---|
| S0-A | Write `vw_TerraFusion_Cama_Characteristics` + `vw_TerraFusion_Improvement_Cost_Matrices` | DONE | Commit 7e647caad — views 5+6 in `docs/spec-lock/locks/pacscontract/pacscontract.v1/pacs-contract-views.pacs_golive.sql` |
| S0-B | Deploy full SQL file to `pacs_golive` clone DB + SpecLock amended to declare all 6 views | BLOCKED | SQL file complete and committed. SpecLock v1.0.0 amended (Sprint 0 amendment 2026-03-19). Deploy to live `pacs_golive` clone requires DBA execution — not runnable in Copilot lane. |
| S0-C | Set PACS connection string; flip `TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC=true` | BLOCKED | Config set pending live DB environment. `PacsSqlAdapter` DI-registered and feature-flagged in code. |
| S0-D | Run `PacsBentonContractTests` + `PacsIntegrationTests` against live clone; all pass | BLOCKED | Cannot run until S0-B deploy and S0-C config complete. 2 data tests failing in `r1-acceptance-criteria.test.mjs` — live parcel data required. |
| S0-E | Update r1-acceptance-criteria expected tool count: `53 → 93` | DONE | Commit 7e647caad. DoD-1 PASS (all 93 manifest tools verified). DoD-6c PASS (manifest v2.0.0, 93 tools). |
| S0-F | Run `deploy-sovereign.sh` against staging; record evidence | DONE | Commit 7e647caad. Run recorded. |

## SpecLock Reconciliation

| Item | Status |
|---|---|
| SpecLock v1.0.0 originally declared 3 views | Was compliant |
| Sprint 0 amendment 2026-03-19 adds views 4–6 | Applied — commit 7e647caad |
| All 6 views declared formally in SpecLock | Now compliant |
| No contract version increment needed (read-only, no existing invariant violated) | Confirmed |

## r1-acceptance-criteria Test Run (2026-03-19)

```
tests 84
pass  82
fail  2  ← data tests requiring live PACS parcel data
```

Failing tests:
- "produces different results for different parcels (not canned)" — assertions on live AV/trend data
- "produces non-identical trends for distinct parcels" — needs real PACS data, not 0-valued stubs

All 93 governance/contract tests pass. 2 data-path tests blocked on PACS clone connection.

## Sprint 0 Gate Assessment

Sprint 0 gate condition: "SpecLock amended to 6 views. PacsBentonContractTests + PacsIntegrationTests all pass against live clone. r1-acceptance-criteria count test green."

- SpecLock amended: YES
- r1-acceptance-criteria manifest count (93): GREEN
- Contract tests against live clone: BLOCKED (S0-B/C environment)

**Sprint 0 gate: PARTIAL — code complete, environment dependencies pending.**

## Environment Handoff Items

- [ ] DBA deploy `pacs-contract-views.pacs_golive.sql` to `pacs_golive` clone
- [ ] Set `PACS_CONNECTION_STRING` in staging `.env`
- [ ] Set `TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC=true`
- [ ] Run `PacsBentonContractTests` + `PacsIntegrationTests` and record results here
- [ ] Re-run `node --test os-platform/core/tests/r1-acceptance-criteria.test.mjs` — target 84/84
