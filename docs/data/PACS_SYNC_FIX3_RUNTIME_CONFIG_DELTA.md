# WO-DATA-004B-FIX3 — Runtime Config / Code Delta

**Status:** UNCOMMITTED — Program.cs change is live in working tree only
**Date captured:** 2026-06-18
**Branch (main working tree):** `docs/wo-data-004b-fix2a-pacs-copy-evidence`

---

## What Is Uncommitted

**File:** `backend/src/TerraFusion.API/Program.cs`
**Location in repo:** unchanged from prior commit `c73d3b8cf` (main working tree)
**Lines changed:** +18 (insertions only, no deletions)
**Staged:** NO

### Exact Diff

```diff
+// Slice S1: PACS property raw landing — PACS property table → legacy_pacs_raw.property.
+// Required by parcel drain endpoint (DoctrineDrainController.DrainParcel).
+builder.Services.AddScoped<
+    TerraFusion.Core.Sync.PacsProperty.IPacsPropertyLandingService,
+    TerraFusion.Data.Services.LegacyPacsRaw.PacsPropertyLandingService>();
+
+// Slice S2-B: parcel spine truth promoter — legacy_pacs_raw.property → truth_pacs.parcel_spine.
+// prop_type_cd='R' filter; idempotent by PropertyLoadBatchId.
+builder.Services.AddScoped<
+    TerraFusion.Core.Sync.PacsParcelTruth.IPacsParcelSpineTruthPromoter,
+    TerraFusion.Data.Services.TruthPacs.PacsParcelSpineTruthPromoter>();
+
+// Slice S3: parcel canonical projector — truth_pacs.parcel_spine → canonical_tf.tf_parcel.
+// Writes source_xref(TfEntityType="parcel"); idempotent by TfParcelId.
+builder.Services.AddScoped<
+    TerraFusion.Core.Sync.PacsParcelCanonical.IPacsParcelCanonicalProjector,
+    TerraFusion.Data.Services.CanonicalTf.PacsParcelCanonicalProjector>();
```

Inserted after the existing `IPacsLandCurrentTruthPromoter` registration block, before the `IPacsOwnerCurrentCanonicalProjector` block.

---

## Why It Was Needed

`POST /api/sync/doctrine/drain/parcel` (DoctrineDrainController.DrainParcel) requires three
services injected via constructor DI:

| Interface | Implementation | Purpose |
|---|---|---|
| `IPacsPropertyLandingService` | `PacsPropertyLandingService` | S1: Query PACS → land into `legacy_pacs_raw.property` |
| `IPacsParcelSpineTruthPromoter` | `PacsParcelSpineTruthPromoter` | S2-B: Promote to `truth_pacs.parcel_spine` (prop_type_cd='R' filter) |
| `IPacsParcelCanonicalProjector` | `PacsParcelCanonicalProjector` | S3: Project to `canonical_tf.tf_parcel` + write `source_xref` |

Without all three registrations the endpoint fails at request time with a DI resolution error.
The implementations exist in the codebase and compile correctly — they were simply never wired
into `Program.cs`.

---

## Classification

| Attribute | Value |
|---|---|
| Type | Production code (DI registration) |
| Is local config | NO — this is not in appsettings or `.local.json` |
| Is env-specific | NO — needed in all environments where parcel drain is called |
| Is temporary | NO — required for the endpoint to function permanently |
| Is safe for main | YES — additive only; wires existing compiled implementations |
| Risk of adding | LOW — these are scoped services; no startup side effects |
| Risk of omitting | HIGH — parcel drain endpoint is broken without them |

---

## Recommendation

**Option A: Commit in a separate minimal work order.**

- New branch: `fix/wo-data-004b-parcel-di-registration` (off `main`)
- Commit contains ONLY: `backend/src/TerraFusion.API/Program.cs`
- Message: `fix(sync): register 3 parcel drain DI services in Program.cs`
- No other files in the diff
- Does NOT merge with `docs/wo-data-004b-fix3-parcel-drain` (evidence stays in docs branch)
- Operator approves before commit or merge

**Do NOT:**
- Move to appsettings (these are code bindings, not config values)
- Move to a local override (permanent production requirement)
- Discard (without this change, the parcel drain is broken in any clean checkout)
- Bundle with the docs branch (code and evidence stay separated)

---

## Note on Owner-WSDOR Readiness

Before running WO-DATA-004B-FIX4 (owner-wsdor lane), the same DI gap audit should be run
against `DoctrineDrainController.DrainOwner` to identify any missing registrations for:
- `IPacsOwnerLandingService` or equivalent
- Owner truth promoter
- Owner canonical projector

Those registrations may also be missing. Check before starting FIX4.

---

## Current State of Uncommitted Changes (Main Working Tree)

The following files are modified but not staged in `docs/wo-data-004b-fix2a-pacs-copy-evidence`:

| File | Classification |
|---|---|
| `backend/src/TerraFusion.API/Program.cs` | **Code change — needs separate work order** |
| `.claude/launch.json` | Dev tooling — not for main |
| `.claude/scheduled_tasks.lock` | Dev tooling — not for main |
| `.claude/settings.local.json` | Local-only — never commit |
| `.ai/README.md` | Doc/AI tooling |
| `docs/brain/00_TODAY.md` | Brain working surface — not for main |
| `docs/brain/canon/current-release.json` | Brain canon — separate release workflow |
| `docs/brain/canon/reserved-staging.json` | Brain canon — separate release workflow |
| `docs/brain/memory/decisions-adr.md` | Brain memory — separate release workflow |
| `frontend/apps/os-shell/src/__tests__/...` | Frontend — unrelated to sync |
| `frontend/apps/os-shell/src/auth/...` | Frontend — unrelated to sync |
| `frontend/apps/os-shell/src/pages/...` | Frontend — unrelated to sync |
| `frontend/apps/os-shell/src/shell/...` | Frontend — unrelated to sync |

Only `Program.cs` is sync-critical. All others are either local tooling, brain working surface,
or unrelated frontend work that predates FIX3.

**appsettings.Development.local.json** is local-only (NOT in git), contains PacsConnection
and DefaultConnection pointing to `pacs_oltp_verify` and `terrafusion_dev_clean`. This file
must remain untracked and is not a concern for any commit.
