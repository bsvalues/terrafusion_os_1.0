# TerraFusion Sync — Harris PACS Source Pack Validator

_v1.0 · 2026-06-08_  
_Tool: `tools/sync/harris-pacs-pack-validator.sql`_  
_Companion: `docs/sync/source-packs/harris-pacs/HARRIS_PACS_SOURCE_PACK.md`_

---

## Purpose

One-command read-only check that answers: **"Does this landing layer conform to the Harris PACS Source Pack spec?"**

Run it before any county's first drain and after any schema change to `legacy_pacs_raw`. It replaces the manual table-and-column inventory that took days in the Benton prototype run.

---

## Usage

```bash
# Standard run (output to terminal)
psql "host=localhost port=5432 dbname=terrafusion user=postgres" \
     -f tools/sync/harris-pacs-pack-validator.sql \
     -t -A

# Capture output for evidence artifact
PGPASSWORD=devpassword123 \
psql "host=localhost port=5432 dbname=terrafusion user=postgres" \
     -f tools/sync/harris-pacs-pack-validator.sql \
     -t -A > evidence/YYYY-MM-DD-harris-pacs-pack-validator-{county}.txt
```

The file path on Windows:
```
"C:/Program Files/PostgreSQL/17/bin/psql.exe"
```

---

## Output Format

**Statement 1** — per-check detail (66 rows for a complete Harris PACS landing):

```
category|check_name|measured|expected|verdict|severity|notes
```

Sorted: FAIL first, then WARN, PASS, INFO.

**Statement 2** — summary line:

```
OVERALL: PASS|fail=0|warn=0|pass=66|info=0
```

---

## Check Sections

### 1. `table_presence` — 15 checks

11 CRITICAL + 4 WARN landing tables must exist in `legacy_pacs_raw`.

| Table | Severity | Purpose |
|-------|----------|---------|
| property | CRITICAL | Parcel identity anchor |
| property_val | CRITICAL | Assessment value + supplement head |
| owner | CRITICAL | Ownership + supplement model |
| imprv | CRITICAL | Improvement universe head |
| imprv_detail | CRITICAL | Improvement sub-type detail |
| imprv_attr | CRITICAL | Improvement attributes (dictionary-keyed) |
| land_detail | CRITICAL | Land segments + ag classification |
| sale | CRITICAL | Sales qualification + ratio policy |
| property_exemption | CRITICAL | Exemption facts |
| property_tax_area | CRITICAL | Tax area assignment |
| tax_bill_line | CRITICAL | Levy bill model |
| assessment_bill_line | CRITICAL | Special-assessment bill model |
| prop_supp_assoc | WARN | Supplement profiling |
| wash_prop_owner_val | WARN | WSDOR owner-value reporting |
| account | WARN | Tax account cross-reference |

### 2. `column_structure` — 38 checks

Covers all required fields per lane domain. CRITICAL = drain will produce wrong results if missing. WARN = county-specific or optional for some PACS configs. INFO = documentation-only.

Key checks by domain:
- **Identity**: `property.PropId`, `PropTypeCd`, `GeoId`
- **Assessment value**: `property_val.PropValYr`, `SupNum`, `AssessedVal`, `AppraisedVal`
- **Supplement model**: `SupNum` confirmed present on property_val, owner, imprv, land_detail, property_tax_area
- **Sales**: `sale.SlDt`, `ChgOfOwnerId`, `SlCountyRatioCd` (WARN), `SlRatioTypeCd` (WARN)
- **Bill model**: `BillType`, `IsActive`, `AmountPaid` on both bill tables
- **Conversion indicators**: `PropCreateDt`, `PropInactiveDt` (INFO — may be ProVal sentinel dates)

### 3. `dictionary` — 5 checks

Confirms canonical_tf dict tables are seeded (by the hosted service at startup, not in the landing layer):

| Table | Purpose |
|-------|---------|
| tf_tax_area | Levy tax-area codes |
| tf_tax_district | Levy district codes |
| tf_tax_area_district | Area-to-district junction |
| tf_levy_rate | Levy rate by year and district |
| tf_assessment_agency | Special-assessment agency codes |

All WARN severity — if any are missing, seed the canonical layer before sealing the revenue spine.

### 4. `data_content` — 8 checks

Direct table queries confirming the landing layer has meaningful data:

| Check | Threshold | Notes |
|-------|-----------|-------|
| levy_bills_L_active_count | > 0 | Active levy bills [Benton: 1,104,507] |
| assessment_bills_A_active_count | > 0 | Active assessment bills [Benton: 313,139] |
| sale_row_count | > 0 | Sale rows [Benton: 75,678] |
| sale_county_ratio_populated_count | > 0 | SlCountyRatioCd [Benton: 38,254] |
| sale_dor_ratio_populated_count | > 0 | SlRatioTypeCd [Benton: 75,157] |
| property_geo_id_population_pct | >= 95.00% | GeoId (APN) population [Benton: 99.98%] |
| property_val_nonzero_supnum_exists | > 0 | Non-zero SupNum rows confirm active-supplement model needed |
| coll_transaction_not_in_landing | absent | Payment collection ledger is in PACS MSSQL only |

---

## Verdict Interpretation

| Verdict | Meaning | Action |
|---------|---------|--------|
| **PASS** | Check satisfied | No action needed |
| **WARN** | Needs confirmation but does not block drain | Document county override in §14 of source pack |
| **FAIL** | Required structure missing | Stop — do not drain until resolved |
| **INFO** | Informational; documents expected behavior | No action — note in evidence artifact |

### Overall verdict

| OVERALL | Meaning |
|---------|---------|
| `PASS` | All checks satisfied. Landing layer is pack-compliant. |
| `WARN` | At least one WARN verdict. Confirm each WARN matches county override doc before sealing. |
| `FAIL` | At least one FAIL. Do not drain. Missing tables or required columns must be resolved. |

---

## Expected Benton Result

```
OVERALL: PASS|fail=0|warn=0|pass=65|info=1
```

65 PASS + 1 INFO on confirmed Benton County production data:
- `col_property__PropInactiveDt` → INFO (optional field; not present in Benton's landing model — expected)

See: `evidence/2026-06-08-harris-pacs-pack-validator-benton.md`

---

## Notes for New Counties

1. Run section 1 (table_presence) first — if any CRITICAL table FAILs, section 4 data checks may error.
2. WARN verdicts are not failures — they indicate fields where county-specific doctrine is needed.
3. `SlCountyRatioCd` low count is **expected** for counties that use DOR ratio only.
4. `coll_transaction_not_in_landing` PASS means the payment ledger is correctly absent from the landing layer — payment attestation must be proven via direct PACS MSSQL corpus proof before surfacing any paid/balance figure.
5. `PropCreateDt` = 1980-01-01 is a known ProVal-conversion sentinel in Benton. Document it in your county's §14 override if you see the same.
6. **`property_tax_area` year column is `TaxYr`, NOT `PropValYr`** — unlike other domains which use `PropValYr`, the tax area assignment table uses `TaxYr`. The validator checks `TaxYr`. If your county's EF model differs, update check `col_property_tax_area__TaxYr` in the source pack.
7. `PropInactiveDt` absent from `property` table is a Benton-confirmed INFO — the CONVERSION_LEGACY classification uses `PropCreateDt` (1980-01-01 sentinel), not `PropInactiveDt`. The check is intentionally INFO-severity so absence does not block drain.

---

## What This Validator Does NOT Check

- Active-supplement correctness (MAX-per-grain rule) — use Automation #4 active-supplement profiler
- Truth/canonical row counts vs sealed benchmarks — use `tools/sync/seal-check-runner.sql`
- Identity drift — use `tools/sync/identity-drift-detector.sql`
- Domain coverage — use `tools/sync/domain-coverage-audit.sql`
- Net-paid attestation correctness — must be proved directly against PACS MSSQL (`coll_transaction`)

---

_Next step after PASS: run the full automation triad (`tf-sync doctor`) to confirm overall substrate health._
