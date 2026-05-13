# Pre-Benton-Full-Corpus-Seal Anchor

**Date:** 2026-05-13
**Tag:** `pre-benton-full-corpus-seal`
**Commit SHA:** `f2ed0c2c1949e8448269aa95c791a86cde0c2fec`
**Branch:** `feat/prometheus-h9-release-hygiene`
**Working tree status at tag time:** clean (in main repo)

This anchor is the reproducibility / rollback point captured BEFORE the first full Benton corpus drain attempt. It records what was true at this SHA so that any later artifact (`evidence/YYYY-MM-DD-benton-full-corpus-{verification,ATTEMPT}.md`) can be traced to a deterministic precursor.

This anchor is itself NOT a verification artifact. It does not claim Benton truth has been proven. It claims only that the drain run is about to be attempted from a known clean state.

---

## 1. Why this anchor exists

Per [project_benton_truth_singular_gate.md](../../.claude/projects/C--Users-bsval-terrafusion-os-1-0/memory/project_benton_truth_singular_gate.md) (memory doctrine, 2026-05-13):

> "Does the TerraFusion DB now contain the correct Benton truth?"

That question is unresolved. Every prior live PACS replay (through V8 on 2026-05-07) was TopN=200. This anchor precedes the first FullCorpus attempt against live Harris PACS.

## 2. What landed at this SHA

Most recent commit (`f2ed0c2c1`) pivots the runtime truth probes from legacy `Property`/`ComparableSales` to canonical `TfParcel`/`TfSale`. Required precursor — without it, any verification artifact would measure the wrong tables.

Recent commits before the tag:

```
f2ed0c2c1 feat(runtime-truth): pivot probes to canonical_tf.{tf_parcel,tf_sale}
a844ffe15 test(readiness): authenticate runtime truth probes in development
72425e544 docs(june10): add operations command prompt pack
cf1840efb feat(release): PR-9 release hygiene v1.6.0 draft
f2cfe0a6c feat(cicd): PR-5 CI/CD criticals
6f7908066 feat(observability): PR-3 observability criticals
4e0e42f0a feat(security): PR-2 auth criticals
2db200d23 feat(infra): PR-4 infra criticals
04c519498 docs(security): retract premature FISMA-HIGH claim + add honest baseline
98e7e10fb feat(sync): SYNC-COMPLETE-2-V3 year-sliced ImprvAttr-S1
```

## 3. Configurations discoverable on disk

Backend appsettings under `backend/src/TerraFusion.API/`:

| File | Role |
|---|---|
| `appsettings.json` | Base |
| `appsettings.Development.json` | Dev overrides |
| `appsettings.Development.local.json` | Local dev overrides (gitignored — **overrides committed Development per the SA-auth gotcha**) |
| `appsettings.BentonCounty.json` | County-specific config |
| `appsettings.BentonCounty.local.json` | Local Benton overrides (gitignored — **overrides committed BentonCounty**) |
| `appsettings.HarrisPACS.json` | PACS connection profile |
| `appsettings.Production.json` | Production overrides |
| `appsettings.Staging.json` | Staging overrides |
| `appsettings.PropertyValuation.json` | Valuation profile |

**The drain operator must verify which `.local.json` files are present and what they override before Phase 3 begins.** Per prior incident (recorded in memory), `MSSQL_SA_PASSWORD` env vars are only honored on first Docker init — the live SA password is in `appsettings.{Env}.local.json`. Confusion here previously cost a debug session.

## 4. Doctrine state at this SHA (deterministic, code-derived)

Doctrine seeders on disk (hosted-service-driven at backend startup):

| Seeder | Hosted-service runner |
|---|---|
| `DoctrineRatioPolicySeeder.cs` | `DoctrineRatioPolicySeederHostedService.cs` |
| `DoctrinePropertyUniverseSeeder.cs` | `DoctrinePropertyUniverseSeederHostedService.cs` |
| `DoctrineAttributeDictionarySeeder.cs` | *(seeded by universe seeder hosted service)* |
| `SalesQualificationCodesSeeder.cs` | `SalesQualificationCodesSeederHostedService.cs` |

Doctrine migrations (PostgreSQL):

| Migration | Date | Purpose |
|---|---|---|
| `20260506024438_SyncDoctrine1AddRatioPolicy` | 2026-05-06 | Ratio policy doctrine table |
| `20260506042453_SyncDoctrine2DualSurfaceSale` | 2026-05-06 | Dual-surface sale fields |
| `20260506073029_SyncDoctrine4PropertyUniverseAndAttributeDictionary` | 2026-05-06 | Two new doctrine tables + 4 universe columns + 3 quarantine columns |
| `20260506162612_SyncDoctrine4V3LandDetailAgApply` | 2026-05-06 | `ag_apply` + `ag_use_cd` on `land_detail` |
| `20260506182219_SyncDoctrine4V4PropertyValLanding` | 2026-05-06 | `property_val` landing with `PropertyUseCd` + `PropInactiveDt` |
| `20260508161603_SyncComplete2FullCorpusRun` | 2026-05-08 | Durable full-corpus run state |
| `20260508172855_SyncDoctrine5SalesQualificationCodes` | 2026-05-08 | Sales qualification codes doctrine table |
| `20260509184340_SyncComplete2V2StageLevelResume` | 2026-05-09 | Stage-level resume state |

Live doctrine row counts in `doctrine_tf.tf_doctrine_*` tables are NOT recorded here — they are runtime data, not code-derived. They will be captured in Phase 3 prep as part of the pre-flight readback.

## 5. Drain execution surfaces available

### Path A — Durable orchestrator (preferred for the seal run)

`backend/src/TerraFusion.API/Controllers/FullCorpusController.cs` exposes `[Route("api/sync/corpus")]`:

| Method + path | Purpose |
|---|---|
| `POST /api/sync/corpus/start` | Begin a new full-corpus run; returns `runId` |
| `POST /api/sync/corpus/{runId}/resume` | Resume a failed/interrupted run at stage granularity |
| `GET /api/sync/corpus/{runId}` | Status — per-lane progress, current stage, counts |
| `GET /api/sync/corpus/{runId}/reconciliation` | Reconciliation artifact (PACS source vs landed vs promoted vs canonical) |
| `GET /api/sync/corpus/{runId}/evidence.zip` | Bundled evidence packet (CorpusEvidencePacketService) |

This path produces the seal artifact natively. It is the production-grade execution surface. Use it for the seal run.

### Path B — Per-lane doctrine drain (fallback / debugging)

`backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs` exposes `[Route("api/sync/doctrine/drain")]` with 6 per-lane POSTs:

| Lane | Endpoint | TopN default if not FullCorpus |
|---|---|---|
| Parcel | `POST /api/sync/doctrine/drain/parcel` | 200 |
| Owner-WSDOR | `POST /api/sync/doctrine/drain/owner-wsdor` | 200 |
| Improvement | `POST /api/sync/doctrine/drain/improvement` | 200 |
| Land | `POST /api/sync/doctrine/drain/land` | 200 |
| Sales | `POST /api/sync/doctrine/drain/sales` | 500 |
| Geometry | `POST /api/sync/doctrine/drain/geometry` | *(per-lane safe default)* |

**`FullCorpus` defaults to `true`** when no request body is supplied (line 1637 of `DoctrineDrainController.cs`). TopN=200 has always been an opt-in override, never the default.

Use Path B only if Path A fails to start. Mixing the two during a single seal run breaks reconciliation determinism.

## 6. Build / test green state at this SHA

- `dotnet build backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj` → 0 errors, 30 pre-existing nullability warnings (unrelated to this slice).
- `node --test scripts/truth/*.test.mjs` → 21 pass / 0 fail / 7.66s. All canonical_tf rename tests + new worktree-content-root check + slow-but-valid Clark County tolerance test pass.
- Pre-commit quality gate at commit time: UI token contract 1560 violations ≤ baseline 1580 (improved by 20). dotnet format, prettier, lint-staged, encoding all green.

## 7. Known not-handled-yet entering Phase 3

These are NOT seal blockers — they are honest acknowledgments that the system is not yet in its claimed end-state, captured here so the anchor remains accurate.

- `CLAUDE.md` still asserts FISMA-HIGH despite commit `04c519498` retraction. Documentation drift, not runtime drift.
- 2 pre-existing test failures (`Phase14/ControllerSecurityBoundaryTests`, `CountyStudy/ApprovalWorkflowTests`) still red ~7 days. Documented as known-unrelated to doctrine.
- 23 local unmerged `feat/sync-*` branches + 52 worktrees in the main repo — cleanup debt, not correctness debt.
- 3 release-gating PRs still open at this SHA: #824 secret hygiene, #825 v1.6.0 release hygiene, #826 dead Prometheus metrics.

## 8. Anti-cheat seal validity (reproduced for the operator)

Per `project_benton_truth_singular_gate.md`, a seal is **INVALID** unless all seven of these hold for the Phase 4 artifact. If any is missing or partial, the file is named `-ATTEMPT.md`, not `-verification.md`.

1. All six lanes execute (parcel, owner-wsdor, improvement, land, sales, geometry).
2. No silent fallback paths trigger.
3. Reconciliation artifacts are generated (per-lane diff: PACS source vs landed vs promoted vs canonical).
4. Quarantine deltas are recorded (pre, post, per-reason).
5. Replay timestamps are captured (start, end, per-lane elapsed).
6. PACS snapshot identifiers are preserved (uniquely pin source state at drain time).
7. TerraFusion API readback verifies promoted truth (independent read path confirms representative parcels round-trip).

Plus operational baseline (wall-clock, memory profile, peak ChangeTracker, retry counts, throughput, quarantine velocity, replay recovery timing) — not pass/fail, but required telemetry.

Plus hostile-reviewer trace: one parcel per universe (REAL_RESIDENTIAL, REAL_COMMERCIAL, AG_CURRENT_USE, MOBILE_HOME, PERSONAL_PROPERTY, CONVERSION_LEGACY) and three sales must trace cleanly from PACS source → landing → truth → canonical → API readback.

## 9. What Phase 3 prep needs (operator-supplied, not code-derived)

To advance from this anchor to a drain attempt, the operator must confirm:

- Which environment to target (Development / BentonCounty / Production).
- Which `appsettings.{Env}.local.json` is active and what it overrides.
- That the target TerraFusion DB (PostgreSQL) is up, migrated to head, and reachable.
- That live Harris PACS (MSSQL) is reachable from the backend host.
- The PACS snapshot identifier strategy (`max(prop_val_yr)`, `max(updated_dt)`, query timestamp — whatever is reproducible).
- That backend services boot cleanly with all doctrine hosted services emitting "seeded" log lines.
- That the `evidence/` directory is writable for the Phase 4 artifact.

These are operator preconditions, not Claude-runnable steps. They will be captured separately in the Phase 3 prep readback.

---

**Anchor status:** captured. Tree clean. Tag set. Next action requires operator decision on environment + credentials before Phase 3 prep can validate connectivity.
