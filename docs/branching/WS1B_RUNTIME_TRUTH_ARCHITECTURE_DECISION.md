# WS-1b — RuntimeTruthController dev39 reconciliation (OPERATOR DECISION REQUIRED)

**Branch**: `feat/june10-dev39-runtime-truth` (WS-1a already committed at `ffa10dd03`)
**Date**: 2026-06-10
**Status**: BLOCKED on architectural decision — not auto-resolved by design.

---

## What WS-1a already landed (safe, committed)

- `useTodaysWork.ts` — dev39 host guard (no-op off dev39)
- `.gitignore` — june10 artifact quarantine + dev39 read-only script exceptions

## What WS-1b is (blocked)

`backend/src/TerraFusion.API/Controllers/RuntimeTruthController.cs` and its tests.

The dev39 stash work and **main** independently rewrote the **same** `db-content`
endpoint of this **June-10 readiness-gating** controller, in incompatible directions.
A 3-way apply produced an **incoherent** file (would not compile), so it was reverted
to main and escalated.

### The fork

| dimension | main (current, on `0ca7ccc95`) | dev39 stash work (backstop `19a4754ea`) |
|---|---|---|
| db-content data source | `_db.Properties` per county | `_db.TfParcels` WHERE `ParcelStatus='ACTIVE'` (canonical) |
| parcel count | EF `.Count()` | receipt-backed bounded count (`product_load_receipts`) + `pg_class` estimate fallback |
| per-county summary shape | rich: `DistinctParcelIds`, `DistinctPropertyIds`, `DuplicateParcelIdGroups`, `MaxRowsPerParcelId`, `TaxYears` | lean: `DistinctParcelNumbers`, `DuplicateParcelNumberGroups`, `MaxRowsPerParcelNumber` |
| Benton-absent | always a blocker if count mismatches | `BentonAbsentByDesign` escape hatch on dev39 |
| response record | main's `RuntimeDbContentResponse` | adds `CanonicalParcelRowCount`, `ReceiptLoadCount`, `BentonRequired`, `BentonAbsentByDesign` |

The shared `BentonDecision` block reads main's rich summary fields
(`DistinctParcelIds`, `DuplicateParcelIdGroups`) — dev39's lean summary doesn't
populate them, which is why the two cannot be naively merged. The tests are coupled
(9 references to dev39/canonical fields), so they move with whichever side wins.

### Why this is an operator decision, not an agent merge

This controller **gates June-10 readiness**. The choice — does readiness audit
`Properties` (main) or canonical `tf_parcel` (dev39), and may Benton be absent on the
statewide preview — changes what "ready" means. Per the control-plane doctrine
(human approves architecture) and the proof standard (no plausible→proven promotion),
an agent should not silently pick.

### Options

1. **dev39-superset** — adopt dev39's canonical-`tf_parcel` + receipt-backed
   db-content and re-graft main's richness (`DistinctParcelIds`, `TaxYears`) onto the
   lean summary. Most work; preserves both. Recommended if the statewide preview is
   going forward and canonical parcel is the truth source.
2. **main-keeps, graft escape-hatch only** — keep main's `Properties`-based audit
   verbatim; add ONLY `IsDev39Runtime` + `BentonAbsentByDesign` so dev39 doesn't
   hard-fail on absent Benton. Smallest, safest; drops dev39's canonical/receipt probe.
3. **defer** — leave RuntimeTruthController on main as-is; dev39 work stays in the
   backstop. Choose later when statewide-preview direction is locked.

### Where the full dev39 version lives (loss-proof)

- branch `workstream/stash-recovery-triage` @ `19a4754ea`
- tag `triage-backstop-snapshot`
- the dev39 RuntimeTruthController is `git show 19a4754ea:backend/src/TerraFusion.API/Controllers/RuntimeTruthController.cs`

## Also out of WS-1 scope (discovered)

`truth:june10-dev39-*` package.json scripts can't be registered on main: their `.mjs`
files are not on main (live only on the Sync lineage). Registering them = porting the
~30-file dev39 script suite — a separate workstream, not this dirty-stash slice.
