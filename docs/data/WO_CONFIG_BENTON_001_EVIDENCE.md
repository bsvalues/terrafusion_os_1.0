# WO-CONFIG-BENTON-001 — County Config Hardening Evidence

**Date:** 2026-06-30  
**WO:** WO-CONFIG-BENTON-001  
**Status:** COMPLETE  
**Stop type:** Config hardening only — no schema changes, no data mutations, no deployment

---

## Goal

Harden county config before Azure App Service preflight:
- Make `expectedBentonParcelCount` non-null so the runtime-truth gate can verify Benton count
- Update `ExpectedJune10Database` to reflect the demo DB target
- Document known gaps

---

## Files Changed

| File | Changes |
|------|---------|
| `backend/src/TerraFusion.API/appsettings.Development.json` | Added `RuntimeTruth.ExpectedBentonParcelCount: 84388`; changed `RuntimeTruth.ExpectedJune10Database` from `"terrafusion"` to `"terrafusion_benton_demo"`; corrected `BentonCounty.ParcelCount` from `89447` to `84388` |
| `backend/src/TerraFusion.API/appsettings.BentonCounty.json` | Corrected `County.PropertyCount` from `89447` to `84388`; added `RuntimeTruth.ExpectedBentonParcelCount: 84388` |

---

## Acceptance Criteria: All Met

### 1. `expectedBentonParcelCount` is no longer null

**Endpoint:** `GET /api/runtime/truth/db-content`

```
passed: True
blockers: []
expectedBentonParcelCount: 84388
```

**Result: PASS** ✅

### 2. `/api/runtime/truth/db-identity` confirms `terrafusion_benton_demo`

**Endpoint:** `GET /api/runtime/truth/db-identity`

```
database: terrafusion_benton_demo
expectedJune10Database: terrafusion_benton_demo
isExpectedJune10RuntimeDb: True
```

**Result: PASS** ✅ — DB name confirmed; legacy-name check passes.

---

## Known Gaps (Documented, Not Fixed)

### WO-DATA-BENTON-DUPE-001: Raw row count vs. distinct parcel count

`db-identity` reports `passed: False` with one remaining blocker:

```
"Runtime canonical_tf.tf_parcel count 84418 does not match configured Benton parcel count 84388."
```

**Root cause:** `canonical_tf.tf_parcel` contains 14 duplicate parcel-number groups (each with 2+ rows), yielding 84,418 raw EF rows. The configured 84,388 is the correct count of *distinct* parcel numbers. The `db-identity` check uses `CountAsync()` (raw rows), not distinct-parcel logic.

**Not a config error.** 84,388 is the semantically correct expected count. The data cleanup is WO-DATA-BENTON-DUPE-001. Until duplicates are resolved, `db-identity.passed` will remain `False` on the count gate.

**Mitigation:** `db-content` passes because it checks distinct parcel numbers against the configured expectation and returns `passed: True`.

### Address / Legal Description fields null

`address` and `legalDescription` are null in `canonical_tf.tf_parcel`. PACS text fields not loaded in this sync pass. Not blocking — documented in WO-DEPLOY-BENTON-003A.

---

## Count Lineage

| Metric | Value | Source |
|--------|-------|--------|
| Raw rows in `canonical_tf.tf_parcel` | 84,418 | `SELECT COUNT(*) FROM canonical_tf.tf_parcel` |
| Distinct parcel numbers | 84,388 | `SELECT COUNT(DISTINCT parcel_number) FROM canonical_tf.tf_parcel` |
| Duplicate parcel-number groups | 14 | `SELECT ... HAVING COUNT(*) > 1` |
| Configured `expectedBentonParcelCount` | 84,388 | `appsettings.Development.json` → `RuntimeTruth.ExpectedBentonParcelCount` |
| `stale_count` field (was 89,447) | 89,447 | Legacy PACS property count — stale; now corrected to 84,388 |

---

## No-Mutation Confirmation

| Check | Result |
|-------|--------|
| Schema changes | NONE |
| Data mutations | NONE |
| Migrations run | NONE |
| PACS connected | NO |
| ArcGIS touched | NO |
| Production deployed | NO |
| Secrets committed | NO |

Changes are config files only (`appsettings.Development.json`, `appsettings.BentonCounty.json`).

---

## WO-CONFIG-BENTON-001: COMPLETE

**Primary goal achieved:** `expectedBentonParcelCount: 84388` — no longer null. `db-content` passes. `db-identity` confirms `terrafusion_benton_demo`.  
**Next WO:** WO-DEPLOY-BENTON-003B — Azure App Service Deployment Preflight.
