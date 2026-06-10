# TerraFusion Sync — Source Pack Template

_Version 1.0 · 2026-06-08_  
_See `TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md` §5 for the Source Pack definition._  
_Benton/Harris PACS is the reference implementation: `harris-pacs/HARRIS_PACS_SOURCE_PACK.md`._

---

> **Fill this template once per source-system family.**  
> A Source Pack answers the question: *"What does it take to convert any county that uses this source system into a sealed TerraFusion substrate?"*  
> It is not per-county — it is per source system. County-specific deviations go in §14 overrides.

---

## 1. Pack Identity

```
Pack name:
Source system:
Version / release:
CAMA / PACS vendor:
Pack author:
Pack status:          DRAFT / REFERENCE / DEPRECATED
Reference county:     (county where the pack was developed and validated)
Date sealed:
```

---

## 2. Source Connection Profile

```
Connection type:      (SQL Server / Oracle / PostgreSQL / REST / file export)
Default database name:
Default schema:
Auth method:
Required access:      READ ONLY
Tables required:      (list table families — see §5 per-lane)
TerraFusion landing schema: legacy_pacs_raw  (or override)
```

**Minimum access check:**  
Validate connectivity and table access before any drain. Confirm read-only. Confirm source database name against county-specific override (§14).

---

## 3. Identity Spine Doctrine

The identity spine is the foundation. Every canonical surface keys to it. Fill in completely; errors here cause the F1-class identity fork (land/improvement/geometry not joinable on the same parcel key).

```
Source identity key:     (e.g. prop_id)
Source parcel table:     (e.g. pacs_oltp.dbo.prop_val)
Source denominator:      (what defines "all active parcels" in this source system)

TerraFusion spine table: sync_bridge.source_xref
Spine filter:            TfEntityType='parcel' AND IsActive = true
Live spine canonical:    canonical_tf.tf_parcel

WARNING: NEVER blind-join canonical_tf.tf_parcel directly.
  The raw tf_parcel table carries historical/debris parcel generations.
  Always resolve parcel identity through the active source_xref rows.

Debris caution:          (how many debris/historical rows exist in tf_parcel for this county)
Key linkage rule:        source_id → source_xref.SourceKeyJson → TfParcelId → canonical_tf.tf_parcel
```

---

## 4. Active Supplement Doctrine

PACS-family systems track corrections to parcel values over time using a supplement number (`sup_num`). **`sup_num=0` is NOT always the current record.** This doctrine must be confirmed per county before any lane can be sealed.

```
Supplement column:       (e.g. sup_num)
Active rule:             MAX(sup_num) per grain/year IS the current record for that domain
                         (prove this per domain — do not assume it holds everywhere)

Per-domain supplement grains:
  improvement/land:      (prop_id, prop_val_yr)
  owner:                 (prop_id, owner_tax_yr)
  assessment value:      (prop_id, prop_val_yr)
  exemption:             (prop_id, owner_id, exmpt_tax_yr, exmpt_type_cd)
  sales:                 (prop_id, owner_tax_yr)  — history years are not sup=0

Supplement table:        (e.g. prop_supp_assoc — tracks which supplement is active per year)
County override:         (note if any domain uses a different supplement key)
```

**Caution:** Sales lanes require special attention — sales reference historical years where `MAX(sup_num)` is frequently non-zero. Promoters that blindly use `sup_num=0` for sales will miss active supplements and produce incorrect rows.

---

## 5. Year Semantics

```
Operational year:        (current certified year, e.g. 2025)
In-progress year:        (current working year, e.g. 2026 — supplements often sup=0)
Year column per domain:
  improvement/land:      prop_val_yr
  owner/assessment:      owner_tax_yr  (or prop_val_yr in some systems)
  exemption:             exmpt_tax_yr
  sales:                 YEAR(sl_dt) = owner_tax_yr
  bills:                 year

Prior-year history:      LANDED_ONLY (source data exists, no sealed lane) or OUT_OF_SCOPE
County override:         (note if county uses a different current year — some counties lag by one)
```

---

## 6. Lane Contracts

_One entry per lane. Copy the template block for each._

### Lane: [Lane Name]

```
Status:                  SEALED / LANDED_ONLY / DISCOVERED_DEFERRED / OUT_OF_SCOPE
Source table family:
Source grain:            (natural key tuple)
Operational year:
Active supplement rule:  (MAX(sup_num) per grain/year — or exception if different)

Truth table:             truth_pacs.[table_name]
Truth natural key:       (columns that define a unique row in truth)
Canonical table:         canonical_tf.[table_name]

Identity resolution:     source_key → source_xref(TfEntityType=N, IsActive) → TfParcelId

Dictionary dependencies: (reference tables needed for type codes — list name + table)

Expected source denominator:  (how many rows qualify as "the universe to promote")
Expected truth rows:
Expected canonical rows:
Duplication invariant:        1.0000× (truth rows = distinct natural keys)

Allowed unresolved (canonical < truth):
  Reason 1:             (e.g. outside real-property spine — MH/personal-property)
  Count:                (or range/pct)

Quarantine rule:         (what causes a row to be quarantined, not promoted)

Readback claim:
  County Studio may say: "[verbatim authorized claim]"
Out-of-scope claim:
  County Studio must NOT say: "[verbatim forbidden claim]"

Required seal gates:     (list gate names from seal-check-runner)
Evidence artifact:       evidence/[date]-[lane]-seal.md

Benton reference:        (Benton-specific numbers — row counts, amounts, etc.)
County override points:  (what must be confirmed or changed per county)
```

---

## 7. Dictionary Dependencies (cross-lane)

List all reference / lookup tables that multiple lanes depend on. Include:
- Dictionary table name (source + canonical)
- What it backs (which lanes consume it)
- How it's seeded (automatic from source, manual, or hybrid)
- County override (is the dictionary county-specific or universal?)

---

## 8. Bill Type Rules

_Applicable to revenue-spine source systems only._

```
Bill type column:        (e.g. bill.bill_type)
Levy bill type code:     (e.g. 'L')
Special-assessment code: (e.g. 'A')
Active bill filter:      (e.g. is_active = 1)
Year filter:             (e.g. year = [operational_year])

Levy bill join table:    (e.g. levy_bill — 1:1 with bill for type='L')
Agency bill join table:  (e.g. assessment_bill — 1:1 with bill for type='A')

Bill identity:           bill_id
Bill-to-parcel join:     bill.prop_id → source_xref → TfParcelId
```

---

## 9. Payment Net-Paid Attestation Doctrine

_Required before any "paid / balance" figure is surfaced in County Studio._

```
Net paid column:         (e.g. bill.amount_paid)
Collection ledger table: (e.g. coll_transaction)
Collection grain:        (e.g. trans_group_id = bill_id)
Collection sum column:   (e.g. base_amount_pd)

Attestation claim:
  [net_paid_column] ≡ SUM([collection_sum]) WHERE trans_group_id = bill_id
  Prove at corpus scale (not just a sample) before surfacing paid/balance.
  Delta must be $0.00.

What this authorizes:   bill-grain net paid / balance served verbatim (no payment model needed)
What it does NOT authorize:
  Receipt-level history / tender detail / void-refund / penalty-interest paid breakdown

Benton proof:            Δ=$0.00 corpus-wide, 1,417,646 current-year active bills
```

---

## 10. Known Deferred Domains

_Complete this before sealing. Every domain that exists in the source but is NOT sealed must be declared here. Undeclared deferrals become surprises for the next county._

| Domain | Status | Reason deferred | Reopen condition |
|--------|--------|-----------------|------------------|
| (example: payment receipt ledger) | DISCOVERED_DEFERRED | Treasurer-grade; not assessment scope | Treasurer workstream authorized |
| | | | |

---

## 11. Known WARN Conditions

_Items that produce WARN (not FAIL) in the automation triad. Document them so the next county knows they are expected, not regressions._

| Condition | Tool | Verdict | Notes |
|-----------|------|---------|-------|
| | | | |

---

## 12. Readback Sample Profiles

_Risk-shaped parcel set for the post-seal acceptance readback. Select parcels that exercise each conditional path._

| Profile | Selection criteria | What it exercises |
|---------|--------------------|-------------------|
| 1 · plain parcel | no exemption, no special assessment, active owner | baseline surface join |
| 2 · with exemption | has exemption record | tf_exemption + dict_exemption_type |
| 3 · non-zero supplement | any lane has active sup_num > 0 | active-supplement resolution |
| 4 · with special-assessment bill | has 'A' bill | tf_assessment_bill_* |
| 5 · paid amount > 0 | bill.amount_paid > 0 | due/paid/balance rollup + net-paid attestation |
| 6 · complex district set | many tax districts | jurisdiction + levy bill breadth |

For each profile, record: `prop_id`, canonical parcel id, and the specific surface exercise.

---

## 13. Required Seal Gates

_These gates must pass before any lane can be declared SEALED. Reference `tools/sync/seal-check-runner.sql` for the automated versions._

**Universal gates (all lanes):**
- [ ] Source denominator determined (qualified universe, not "all rows")
- [ ] Active supplement rule proved for this domain
- [ ] Truth duplication = 1.0000× (rows = distinct natural keys)
- [ ] Canonical row count ≤ truth row count (no phantom canonical rows)
- [ ] Unresolved gap diagnosed by class/reason (not assumed)
- [ ] Pipeline is idempotent (re-run produces same result, no new duplicates)
- [ ] Advancement cursor present (drain can continue from last batch without re-pulling)
- [ ] Evidence artifact created

**Lane-specific gates (fill in per lane):**
- [ ] [Lane-specific gate 1]
- [ ] [Lane-specific gate 2]

**Automation triad gate:**
- [ ] `tf-sync doctor` result = PASS or WARN after sealing (not FAIL)

---

## 14. County-Specific Override Points

_These are the fields that MUST be confirmed per county before using this pack._

| Override point | How to determine | Default (reference county) |
|----------------|-----------------|---------------------------|
| Source database name | appsettings.{county}.json | (reference value) |
| Operational year | DOR certification calendar | (reference year) |
| Sales qualification policy | PACS doctrine tables | (reference codes) |
| Property type universe | prop_type_cd mapping | (reference mapping) |
| MH handling | County assessment policy | (reference behavior) |
| Geometry source | County GIS endpoint | (reference URL) |
| Improvement attribute dictionary | PACS attr code values | (county-specific) |

---

## 15. Anti-Patterns (what went wrong in the reference county)

_Document painful discoveries so the next county doesn't repeat them._

| Anti-pattern | Symptom | Root cause | Fix |
|-------------|---------|-----------|-----|
| | | | |

---

## 16. Pack Changelog

| Date | Version | Change |
|------|---------|--------|
| | 1.0 | Initial |

---

_Next: Apply pack → profile county diffs → confirm/override doctrine → run gates → seal._  
_When items 1–8 of the automation backlog exist, applying this pack to a new county replaces three weeks of discovery with days of confirmation._
