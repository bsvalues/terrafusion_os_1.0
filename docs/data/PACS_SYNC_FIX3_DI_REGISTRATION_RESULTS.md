# WO-DATA-004B-FIX3A — Parcel Drain DI Registration Audit Results

**Work Order:** WO-DATA-004B-FIX3A
**Date:** 2026-06-18
**Worktree:** `C:\Users\bsval\tf-fix3a-di`
**Branch:** `fix/wo-data-004b-parcel-di-registration` (from origin/main @ `a90e97ba7`)
**Status:** COMPLETE — no code change required

---

## Mission Recap

Determine whether the 3 parcel drain DI registrations that were "live and uncommitted"
in the FIX3 dirty working tree are actually missing from `origin/main`, and audit
whether owner-wsdor has any DI gaps before WO-DATA-004B-FIX4 proceeds.

---

## Finding 1 — Parcel DI: ALREADY CANONICAL ON MAIN

The 3 registrations flagged as "live uncommitted" in `PACS_SYNC_FIX3_RUNTIME_CONFIG_DELTA.md`
are **already present in origin/main** (`a90e97ba7`, `Program.cs` lines 1749–1771):

```csharp
// Slice S1 (SYNC-POP-4a): PACS property/parcel raw landing
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsProperty.IPacsPropertyLandingService,
    TerraFusion.Data.Services.LegacyPacsRaw.PacsPropertyLandingService>();

// Slice S2-B (SYNC-POP-4b): PACS parcel-spine truth promoter
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsParcelTruth.IPacsParcelSpineTruthPromoter,
    TerraFusion.Data.Services.TruthPacs.PacsParcelSpineTruthPromoter>();

// Slice S3 (SYNC-POP-4c): PACS parcel canonical projector
builder.Services.AddScoped<
    TerraFusion.Core.Sync.PacsParcelCanonical.IPacsParcelCanonicalProjector,
    TerraFusion.Data.Services.CanonicalTf.PacsParcelCanonicalProjector>();
```

**Root cause of the "gap" report:** The shared main working tree
(`docs/wo-data-004b-fix2a-pacs-copy-evidence`) had its `Program.cs` based on
a commit that predated these registrations being merged to main. They appeared
as "+18 line insertions" in the working-tree diff — but they were already merged
upstream. The registrations were NOT missing from main; the shared working tree
was behind main on that file.

**Implication:** `PACS_SYNC_FIX3_RUNTIME_CONFIG_DELTA.md`'s "Option A: commit in a
separate work order" recommendation is **moot**. Nothing to commit.

---

## Finding 2 — Owner-WSDOR DI: ALL REGISTERED, NO GAP

`DoctrineDrainController.DrainOwnerWsdor` injects 11 services (lines 400–413).
All 11 are registered in origin/main `Program.cs`:

| Service Interface | Program.cs Line | Status |
|---|---|---|
| `IPacsPropSuppAssocLandingService` | 1746 | ✅ Registered |
| `IPacsPropertyLandingService` | 1754 | ✅ Registered (parcel) |
| `IPacsParcelSpineTruthPromoter` | 1762 | ✅ Registered (parcel) |
| `IPacsParcelCanonicalProjector` | 1770 | ✅ Registered (parcel) |
| `IPacsAccountLandingService` | 1795 | ✅ Registered |
| `IPacsOwnerLandingService` | 1803 | ✅ Registered |
| `IPacsWashPropOwnerValLandingService` | 1811 | ✅ Registered |
| `IPacsOwnerCurrentTruthPromoter` | 2066 | ✅ Registered |
| `IPacsWashPropOwnerValTruthPromoter` | 2073 | ✅ Registered |
| `IPacsOwnerCanonicalProjector` | 2094 | ✅ Registered |
| `IPacsWsdorCanonicalProjector` | 2110 | ✅ Registered |

**Owner-WSDOR has NO DI gaps.** WO-DATA-004B-FIX4 is unblocked from a DI standpoint.

---

## Build Verification

Build run: `dotnet build TerraFusion.sln --no-restore -v:q` in worktree against origin/main.
See BUILD_STATUS field in Final Report below.

---

## Files Changed in This Work Order

**None.** No Program.cs edit was made. The worktree from origin/main is clean.

This doc (`PACS_SYNC_FIX3_DI_REGISTRATION_RESULTS.md`) is the only artifact.
It is committed to `docs/wo-data-004b-fix3-parcel-drain` (evidence branch) via the
docs worktree, not to `fix/wo-data-004b-parcel-di-registration` (which has no code delta
and will be removed).

---

## Correction to FIX3 Runtime Delta Doc

`PACS_SYNC_FIX3_RUNTIME_CONFIG_DELTA.md` states:
> "Option A: Commit in a separate minimal work order."

That recommendation is **superseded**. The registrations are already merged.
The doc remains as a historical record of the investigation but its recommendation
is no longer actionable.

The shared working tree (`docs/wo-data-004b-fix2a-pacs-copy-evidence`) should have its
`Program.cs` reconciled against current main before any future sync work — but that is
a rebase/update task for that branch, not a code fix.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | COMPLETE — no code change required |
| WORKTREE | `C:\Users\bsval\tf-fix3a-di` (origin/main @ `a90e97ba7`) |
| BRANCH | `fix/wo-data-004b-parcel-di-registration` |
| FILES_CHANGED | None (Program.cs NOT modified) |
| REGISTRATIONS_ADDED | 0 — all 3 parcel registrations already in origin/main |
| PARCEL_DI_STATUS | CANONICAL — all 3 services registered in main since before `a90e97ba7` |
| OWNER_WSDOR_DI_STATUS | CANONICAL — all 11 services registered, no gap |
| BUILD_STATUS | See build run (dotnet build TerraFusion.sln from origin/main worktree) |
| DB_MUTATIONS | None |
| PR_OR_LOCAL_ARTIFACT | This doc committed to `docs/wo-data-004b-fix3-parcel-drain` evidence branch |
| NEXT_WORK_ORDER | WO-DATA-004B-FIX4 — Controlled Owner/WSDOR Drain (DI unblocked; awaiting operator approval) |
