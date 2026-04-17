# Sync Canonical Truth Restoration Evidence

**Date:** 2026-04-17
**Branch:** feat/sync-pacs-truth-p1
**Author:** TerraFusion OS Engineering

---

## Objective

Make `PacsToTerraFusionSyncService` the sole producer of all canonical data.
Eliminate bypass code. Wire all dormant PACS staging tables to canonical importers.

---

## Phase 1 — Sync Owns the Truth

### Changes

| Action | File |
|--------|------|
| Deleted | `TerraFusion.Data/Canonicalizers/PacsCanonicalizer.cs` |
| Deleted | `TerraFusion.API/Controllers/CanonicalAdminController.cs` |
| Removed | `IPacsCanonicalizer` DI registration from `Program.cs` |
| Added | `RunCamaSupplementPassAsync` — City + PropertyUseStratum from PacsSitus |
| Added | `EnsureSecondaryFeatureMatricesAsync` — 6 Benton %-of-BIV rates |
| Added | `ImportPropertyAssessmentsFromValuationsAsync` — PacsValuation → PropertyAssessments |
| Added | `EnsureSnapshotModeRegistrationAsync` — dev-mode bypass for snapshot_mode short-circuit |

### Verification Baseline (Benton County snapshot)

- PacsParcel rows: ~89,247
- PacsValuation rows (SupNum=0): ~91,949
- CamaCharacteristics rows: ~75,907
- SecondaryFeature CostMatrix rows: 6

---

## Phase 2 — Dormant Canonicalizers

### New Importers

| Method | Source Staging | Canonical Target | Note |
|--------|----------------|-----------------|------|
| `ImportExemptionsAsync` | `pacs_exemptions` (SupNum=0) | `Exemptions` | Status derived from TerminationDate |
| `ImportAppealsAsync` | `pacs_appeals` | `Appeals` | PacsCaseId stored in DecisionNotes as `[PACS:{id}]` |
| `ImportLevySummaryAsync` | `pacs_levy_rates` | `TaxLevies` | Aggregated by TaxDistrictId per year |
| `UpdateOwnerNamesFromPacsAsync` | `pacs_owners` (SupNum=0, max year) | `Property.OwnerName` | Most-recent year per parcel |
| `ValidateTaxAreaStagingAsync` | `pacs_tax_areas` | staging = canonical | Count + log only (no canonical entity exists) |
| `ValidateReetWacCodeStagingAsync` | `ReetWacCodes` | staging = canonical | Count + log only |
| `ValidatePropertyProfileStagingAsync` | `pacs_property_profiles` | staging = canonical | Count + log only |

### Known Gaps (documented for future phases)

- `TaxLevy` entity has no `UpdatedAt` field — add to entity + migration before FISMA audit required
- `PacsLevyRate` has no `CountyId` column — multi-county deployments must add discriminator first
- `PacsOwner` history across multiple tax years loaded in memory — push to server-side dedup when >10 years of history

---

## Canonicalization Gap Table — Status After Phase 2

| PACS Source | TF Staging | Canonical Importer | Status |
|-------------|------------|--------------------|--------|
| property | PacsParcel | Properties | ✅ live |
| situs | PacsSitus | Properties.Address + CamaCharacteristic.City (via RunCamaSupplementPassAsync) | ✅ live |
| property_val | PacsValuation | PropertyAssessments (ImportPropertyAssessmentsFromValuationsAsync) | ✅ live |
| imprv + detail + attr | PacsImprovement* | CamaCharacteristic + CamaImprovementDetail | ⚠️ importer exists; 0 rows in Benton snapshot |
| owner + account | PacsOwner | Property.OwnerName (UpdateOwnerNamesFromPacsAsync) | ✅ live |
| sale + chg_of_owner | PacsSale | ComparableSale | ✅ live |
| property_exemption | PacsExemption | Exemptions (ImportExemptionsAsync) | ✅ live |
| _arb_protest | PacsAppeal | Appeals (ImportAppealsAsync) | ✅ live |
| levy | PacsLevyRate | TaxLevies (ImportLevySummaryAsync) | ✅ live |
| property_tax_area | PacsTaxArea | staging = canonical (ValidateTaxAreaStagingAsync) | ✅ documented |
| wash_prop_owner_val | PacsOwnerVal | — | ❌ dormant (no entity) |
| property_profile | PacsPropertyProfile | staging = canonical (ValidatePropertyProfileStagingAsync) | ✅ documented |
| reet_wac_code | PacsReetWacCode | staging = canonical (ValidateReetWacCodeStagingAsync) | ✅ documented |

---

## Bypass Code — Before/After

```
BEFORE:
  Raw SQL INSERT INTO "PropertyAssessments"   → 91,949 rows
  Raw SQL INSERT INTO "CostMatrices"          → 6 rows  
  Raw SQL UPDATE "CamaCharacteristics"        → City/Stratum
  PacsCanonicalizer (Data layer bypass)       → duplicate logic
  CanonicalAdminController                    → exposed bypass

AFTER:
  PacsToTerraFusionSyncService owns all writes
  POST /api/TerraFusionSync/counties/Benton/sync → re-populates all canonical tables
  grep -rn "PacsCanonicalizer" backend/src → 0 matches (Data variant deleted)
```

---

## Commit History

(see: git log --oneline feat/sync-pacs-truth-p1)

```
ef33c9ffe fix(sync): Phase 2 quality fixes — AsNoTracking on appeals, key normalization, levy comments, owner DB filter, TaxArea county scope
fc8fda769 feat(sync): Phase 2 complete — all dormant canonicalizers wired; staging validations added
ff18341b1 feat(sync): add ImportLevySummaryAsync + UpdateOwnerNamesFromPacsAsync — Phase 2
494d0d450 feat(sync): add ImportExemptionsAsync + ImportAppealsAsync — Phase 2 canonical promotion
e419e1751 perf(sync): push situs filter to DB; AsNoTracking on CAMA load; collapse duplicate RecordSyncCompletion
4a73e98f7 feat(sync): dev-mode snapshot auto-registration — bypass snapshot_mode when staging has data
e394870aa feat(sync): add ImportPropertyAssessmentsFromValuationsAsync — valuations staging fallback
4515c948b feat(sync): add RunCamaSupplementPassAsync + EnsureSecondaryFeatureMatricesAsync
99e513a73 refactor(sync): delete PacsCanonicalizer bypass; CanonicalAdminController retired
```

---

*Evidence doc generated by TerraFusion OS Engineering Agent*
