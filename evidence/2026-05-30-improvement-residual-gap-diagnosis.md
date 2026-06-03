# Improvement Lane — Residual Gap Diagnosis (2026-05-30)

## Context
Forward improvement sweep reached cursor exhaustion (`landing_parcels_ahead_of_cursor = 0`,
landing max prop_id 322,469; PACS max improvement prop_id 322,769). Watchdog + recon
**paused** (scheduled tasks disabled + `halted` flag set) to stop zero-yield churn before
diagnosis. 0 in-flight batches at pause.

## Denominator correction (proven)
The improvement lane ceiling is **NOT** all 89,247 Benton parcels — only parcels that have
improvements. Queried live from PACS source:
- **PACS 2026 improvement universe = 75,912 distinct prop_ids** (`pacs_oltp.dbo.imprv WHERE prop_val_yr=2026`)
- All owner-backed (75,912/75,912 have 2026 owner rows), all ≤ prop_id 322,769.

## Coverage vs true ceiling
- truth_pacs.imprv_current distinct parcels = **71,239 = 93.8% of 75,912**
- duplication = **1.000×** (truth rows = distinct natural keys)
- residual gap = **4,673 parcels**

Gap table persisted: `sync_bridge.benton_improvement_gap_2026` (built from
`sync_bridge.pacs_imprv_universe_2026` LEFT JOIN truth).

## Gap classified by reason (proven, not hypothesized)

### Cohort A — never landed: 4,176 parcels
prop_id range 81,216–322,769 (scattered; median ~85,890; only 4 above landing max — NOT a high-end cliff).

Evidence chain:
| layer | present? |
|---|---|
| PACS source: imprv | ✓ (all 4,176) |
| PACS source: owner | ✓ |
| PACS source: property_val | ✓ (all 4,176 in `pacs_oltp.dbo.property_val` 2026) |
| landing: owner (`legacy_pacs_raw.owner`) | ✓ (all 4,176) |
| **landing: property_val (`legacy_pacs_raw.property_val`)** | **✗ (0 of 4,176)** |
| landing: imprv | ✗ |
| truth_pacs.parcel_spine | ✗ (all 4,176 never seeded) |

**Root cause (proven):** PACS has full data, and these parcels' **owners landed but their
`property_val` rows never landed**. The parcel-spine promoter depends on landed property_val
→ no property_val → no spine row → never seeded → improvement drain never reached them.
Root-cause class = **property_val landing gap** (upstream of improvement landing).

### Cohort B — landed but not promoted: 497 parcels
Evidence:
- in truth_pacs.parcel_spine: ✓ (497/497 seeded)
- landing property_val: ✓ (497/497)
- landing imprv rows: ✓ (632 rows / 497 parcels, all `PropValYr=2026`)
- SupNum: landing imprv sup=0 (497) **matches** prop_supp_assoc sup=0 (497) — no SupNum join mismatch
- year: all 2026 — no year mismatch

**Root cause (narrowed):** these had every input the promoter needs (spine + property_val +
imprv rows, matching year + SupNum=0) yet never reached truth. Not a year/SupNum filter drop.
Most likely a promotion-timing/chunk-coverage miss (their landing happened in a chunk whose
promoter pass didn't re-cover them, or a natural-key delete/insert edge). A targeted re-drain
of exactly these prop_ids should re-run the promoter and resolve — and will confirm if it's a
timing miss (resolves) vs a real promoter bug (persists).

## Remediation plan (bounded — NO broad sweep)
Targeted backfill of the 4,673 prop_ids in `sync_bridge.benton_improvement_gap_2026` only:
1. Cohort A: must land property_val (+ parcel prelude) for these prop_ids, then improvement.
2. Cohort B: re-run improvement promoter for these prop_ids.

Mechanism TBD: drain endpoint currently advances by `afterPropId` cursor / FullCorpus / TopN.
A targeted prop_id-list seed is the next implementation question (avoid cursor reset = avoid
broad re-sweep).

## Backfill mechanism (proven constraint)
The improvement drain is **owner-cursor-anchored**: `SqlServerPacsOwnerSource(topN)` streams
owners ordered by prop_id, the cursor advances by `afterPropId`, and the resulting
`seedPropIds` drive the entire downstream chain via KEYED sources
(`KeyedSqlServerPacsPropertySource` → `KeyedSqlServerPacsPropertyValSource` → spine →
`KeyedSqlServerPacsImprvSource`/Detail/Attr → truth → canonical). All keyed sources for an
explicit prop_id list ALREADY EXIST.

`DoctrineDrainRequest(OperatorName, WorkingYear, FullCorpus, TopN, LaneResultId, ResumeFromStage)`
has **no field to inject an explicit prop_id list**. So a targeted backfill needs one bounded
code change:
1. Add optional `IReadOnlyList<int>? SeedPropIds` to `DoctrineDrainRequest`.
2. In `DrainImprovement`: when `SeedPropIds` is non-empty, set `seedPropIds = request.SeedPropIds`
   and SKIP the owner-seed cursor stage. Downstream keyed chain is unchanged.
This bypasses the missing keyed-owner-source entirely (owners for the 4,176 are already landed;
the chain only needs seedPropIds to feed parcel-S1 → property_val landing → spine).

**Build/deploy caveat:** the running backend is the deployed build from `a844ffe15`
(pre-`dotnet format` source under `C:/Users/bsval/.tf-old-backend-a844ffe15/...`). This is a
DIFFERENT tree than the current worktree branch `claude/nostalgic-napier-b38c1a`. A rebuild must
target the deployed tree to avoid regressing the live cursor/idempotency fixes, OR carefully
reconcile the two. This is the main risk in the backfill step.

## State at diagnosis
- watchdog TF-DrainWatchdog + TF-ReconMonitor = Disabled; watchdog-state.halted=true
- cursor = 322,770 (exhausted)
- NOT declaring 93.8% the final ceiling until the 4,673 backfill is attempted (co-founder directive).
