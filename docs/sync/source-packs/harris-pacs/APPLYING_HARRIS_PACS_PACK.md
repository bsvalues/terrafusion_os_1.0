# Applying the Harris PACS Source Pack — County Onboarding Runbook

_Version 1.0 · 2026-06-08_  
_For: the second (and every subsequent) Harris PACS county conversion_  
_Reference pack: `HARRIS_PACS_SOURCE_PACK.md`_  
_Reference county: Benton County, WA_

> This runbook turns three weeks of discovery into days of confirmation.  
> Benton already paid for the discovery. This county confirms or overrides it.

---

## Before you start

```
Read first:
  HARRIS_PACS_SOURCE_PACK.md      — the reference doctrine you are confirming
  docs/sync/TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md  — what Sync is and is not
  docs/sync/seals/benton-lane-status.md            — what SEALED looks like

Have ready:
  - PACS SQL Server credentials (read-only) for this county
  - County assessor contact (for doctrine confirmation)
  - GIS service endpoint (for geometry lane)
  - Certified operational year confirmed with county

Rule: Every step either CONFIRMS the Harris PACS pack applies as-is,
      or DOCUMENTS an override. No step is skipped.
```

---

## Step 0 — Public Recon (if available)

**Status: optional preflight — tool not yet built (parked as Stage -1)**

When Stage -1 (Public County Recon) exists, run it here:

```
Goal: gather county-level hypotheses from public sources before internal access
      (assessor website, county GIS, ArcGIS REST service, open-data portals)
Outputs: estimated parcel count, geometry source URL, APN format, TCA count
Use for: sizing expectations and flagging major deviations from Benton

Doctrine: public data informs, internal source data proves, seal gates decide.
```

If Stage -1 is not available: skip to Step 1. Note the estimated parcel count from any public source and carry it into Step 3 for sanity-checking.

---

## Step 1 — Connect Source

**Goal: confirm PACS access is read-only and all required tables are present**

```sql
-- 1a. Confirm connection and database name
SELECT @@SERVERNAME, DB_NAME()
-- Expected: county PACS server; confirm DB name matches appsettings.{County}.local.json

-- 1b. Confirm table presence (Harris PACS–universal)
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA='dbo'
  AND TABLE_NAME IN (
    'imprv','imprv_detail','imprv_attr','imprv_attr_val',
    'land_detail','owner','property_val',
    'exmpt','prop_supp_assoc',
    'chg_of_owner','tax_area','tax_area_fund_assoc','entity',
    'bill','levy_bill','assessment_bill','coll_transaction'
  )
ORDER BY TABLE_NAME
-- Expected: 16 rows (all tables present)
-- If any missing: document and flag — that lane may need a different source path

-- 1c. Confirm read-only (attempt should fail)
-- INSERT INTO dbo.property_val ... -- do NOT run; just confirm the account lacks write permission
```

**Pass criteria:** connection succeeds, DB name confirmed, all 16 tables present, credentials are read-only.

---

## Step 2 — Baseline Counts

**Goal: establish denominator expectations before any drain**

```sql
-- 2a. Active parcel denominator (real property)
SELECT COUNT(DISTINCT prop_id) FROM dbo.property_val
WHERE prop_type_cd = 'R'   -- [override: confirm real-property type code for this county]
  AND prop_val_yr = 2025   -- [override: confirm certified operational year]
-- Benton ref: ~95,455 (assessment value universe); parcel spine ~83,326

-- 2b. Improvement universe
SELECT COUNT(*) FROM dbo.imprv
WHERE prop_val_yr = 2025 AND prop_type_cd = 'R'
-- Benton ref: 71,736 improvement-bearing R parcels

-- 2c. Sales universe (all, not qualified)
SELECT COUNT(*) FROM dbo.chg_of_owner
WHERE owner_tax_yr >= 2010  -- adjust range as needed
-- Benton ref: ~75,678 total (29,914 qualify)

-- 2d. Bill universe
SELECT bill_type, COUNT(*) FROM dbo.bill
WHERE year = 2025 AND is_active = 1
GROUP BY bill_type
-- Benton ref: L = 1,104,507 / A = 313,139
```

Record all counts. If dramatically different from Benton (e.g. county has 200K parcels), the step 7 lane denominators will differ accordingly — that is expected, not an error. What matters is that each count is explainable.

---

## Step 3 — Domain Coverage Audit

**Goal: confirm which PACS domain families are present with real data**

Run the domain coverage audit (Automation #3) pointed at this county's data, or run the equivalent per-table COUNT(*) checks from the pack's table family list.

```
Expected: same 12 domain families as Benton have rows
Watch for: any table family that is empty or absent — document as EMPTY_IN_SOURCE or OUT_OF_SCOPE
Document every deviation from Benton's domain-coverage result
```

This surfaces any domain that exists in the Benton pack but is absent in this county, or any new domain present in this county but not in the pack.

---

## Step 4 — Schema Comparison

**Goal: confirm column names match the pack's expected columns**

For each lane, spot-check the key columns. Flag any missing or renamed columns.

```sql
-- Sample: confirm supplement model on imprv
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME='imprv' AND COLUMN_NAME IN ('prop_id','prop_val_yr','sup_num','imprv_id')
-- Expected: all 4 present

-- Sample: confirm sales qualification columns
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME='chg_of_owner'
  AND COLUMN_NAME IN ('chg_of_owner_id','prop_id','owner_tax_yr','sup_num','sl_dt',
                       'sl_ratio_type_cd','sl_county_ratio_cd')
-- Expected: all present; if sl_county_ratio_cd is missing, confirm ratio policy with county

-- Sample: confirm bill model
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME='bill'
  AND COLUMN_NAME IN ('bill_id','prop_id','year','bill_type','is_active','amount_due','amount_paid')
```

For any column listed in the pack that is missing here: consult Harris support or the county assessor before proceeding. Do not invent a workaround.

---

## Step 5 — Confirm Identity Spine Doctrine

**Goal: prove how parcel identity works in this county before touching any lane**

This is the most important step. Errors here cause the F1-class identity fork.

```sql
-- 5a. Confirm prop_id is the master parcel key
SELECT COUNT(DISTINCT prop_id) FROM dbo.property_val
-- Should match Step 2a approximately

-- 5b. Confirm the real-property type code
SELECT DISTINCT prop_type_cd, COUNT(*) cnt FROM dbo.property_val
WHERE prop_val_yr = [op_year]
GROUP BY prop_type_cd ORDER BY cnt DESC
-- Benton ref: 'R' is real property (~95K rows)
-- [Override: confirm which code is real-property for this county]

-- 5c. Confirm mobile-home handling (do MH parcels have land_detail?)
SELECT COUNT(*) FROM dbo.imprv i
JOIN dbo.property_val pv ON pv.prop_id=i.prop_id AND pv.prop_val_yr=i.prop_val_yr
WHERE pv.prop_val_yr=[op_year] AND i.prop_val_yr=[op_year]
  AND pv.prop_type_cd = 'MH'  -- [or whatever MH code applies]
-- If MH count > 0, confirm whether MH parcels should be included or excluded from the spine

-- 5d. Confirm F2 scope (how many total property_val rows vs active)
SELECT COUNT(*) total FROM dbo.property_val
SELECT COUNT(*) FROM dbo.property_val WHERE prop_val_yr=[op_year] AND prop_type_cd='R'
-- If total >> active, TerraFusion will have tf_parcel debris similar to Benton's 3.1M vs 83K
```

**Confirm and record:**
- [ ] `prop_id` confirmed as parcel key
- [ ] Real-property type code confirmed: ___
- [ ] MH handling confirmed: include / exclude / same as Benton
- [ ] Expected tf_parcel debris ratio estimated: ___

---

## Step 6 — Confirm Active Supplement Doctrine

**Goal: confirm MAX(sup_num) per grain/year produces current records in this county**

```sql
-- 6a. Confirm improvement supplement distribution for current working year
SELECT sup_num, COUNT(*) cnt FROM dbo.imprv
WHERE prop_val_yr = [working_year]  -- the in-progress year (not certified)
GROUP BY sup_num ORDER BY sup_num
-- Benton ref: all sup_num=0 for working year (no supplements issued yet)
-- If any sup_num>0: confirm with county — supplements may be issued mid-year

-- 6b. Confirm assessment value supplements for certified year
SELECT sup_num, COUNT(*) cnt FROM dbo.property_val
WHERE prop_val_yr = [certified_year]
GROUP BY sup_num ORDER BY sup_num
-- Benton ref: mostly sup_num=0; 1,041 rows at higher sup_num
-- If many rows at high sup_num: county may be in a supplement-heavy period

-- 6c. Confirm sales supplement distribution (critical — see anti-patterns)
SELECT sup_num, COUNT(*) cnt FROM dbo.chg_of_owner
WHERE owner_tax_yr BETWEEN 2018 AND [current_year]
GROUP BY sup_num ORDER BY sup_num
-- Benton ref: significant rows at sup_num>0 for historical years
-- If sup_num>0 appears: confirm MAX(sup_num) rule applies to sales

-- 6d. Spot-check: does MAX(sup_num) resolve to the operator's expected current value?
-- Pick one parcel known to have a supplement from the county assessor and confirm.
```

**Confirm and record:**
- [ ] Supplement model confirmed: MAX(sup_num) per grain/year = current record
- [ ] Sales supplements confirmed: present in historical years (expected)
- [ ] Any domain with deviation from standard supplement rule: ___

---

## Step 7 — Confirm Each Lane Contract

Walk through each lane in the Harris PACS pack. For each lane, run the confirmation queries and document the result. Use the pack's "County override points" as your checklist.

### 7a. Owner Lane
```sql
SELECT COUNT(*) FROM dbo.owner WHERE owner_tax_yr=[certified_year]
-- Compare to Benton ref 816,849 (scaled by county parcel count)
-- Confirm: does WSDOR ownership data also exist? If so, which is authoritative?
```

### 7b. Land Lane
```sql
SELECT COUNT(DISTINCT prop_id) FROM dbo.land_detail
WHERE prop_val_yr=[working_year]
-- Compare to Benton ref 82,012 R-type land-bearing parcels (scaled)
-- Confirm: do MH parcels have land_detail rows? (Benton: no)
```

### 7c. Improvement Lane
```sql
SELECT COUNT(DISTINCT prop_id) FROM dbo.imprv
WHERE prop_val_yr=[working_year]
-- Compare to Benton ref 71,736 R-type improvement-bearing parcels (scaled)

-- Confirm attribute dictionary size
SELECT COUNT(DISTINCT attr_val_cd) FROM dbo.imprv_attr_val
-- Benton ref: 193 codes; this will differ — that is expected
-- Document the code count; confirm the attribute drain will populate it after connection
```

### 7d. Sales Lane (most county-specific — do not skip this confirmation)
```sql
-- Confirm ratio qualification columns exist
SELECT DISTINCT sl_county_ratio_cd, sl_ratio_type_cd FROM dbo.chg_of_owner
WHERE owner_tax_yr >= 2015
-- Document all distinct code values

-- Confirm with county assessor:
-- "Which column and which code value defines a qualified (valid) sale for ratio study purposes?"
-- "Is this rule year-aware? (Did the county change from DOR to internal qualification at some point?)"
```

Seed `tf_doctrine_ratio_policy` with the county's confirmed policy codes, `effective_start_year`, and `evidence_source` before sealing the sales lane. Do not copy Benton's codes.

### 7e. Geometry Lane
```sql
-- Confirm geometry source endpoint with county GIS admin
-- Run: GET {arcgis_endpoint}/query?where=1=1&returnCountOnly=true
-- Expected: approx match to parcel count from Step 2a

-- Confirm APN field name in the geometry service
-- Benton ref: standard APN field; county may use different name
```

### 7f. Assessment Value Lane
```sql
SELECT COUNT(*) FROM dbo.property_val
WHERE prop_val_yr=[certified_year]
-- Compare to Benton ref 95,455

-- Confirm fields present: assessed_val, appraised_val, market_val
SELECT TOP 1 assessed_val, appraised_val, market_val FROM dbo.property_val
WHERE prop_val_yr=[certified_year] AND prop_type_cd='R'
```

### 7g. Exemption Lane
```sql
SELECT DISTINCT exmpt_type_cd, COUNT(*) cnt FROM dbo.exmpt
WHERE exmpt_tax_yr=[certified_year]
GROUP BY exmpt_type_cd ORDER BY cnt DESC
-- Document all type codes — these are county-specific
-- Benton ref: 6 types; this county will likely differ
-- Seed dict_exemption_type from this county's codes before sealing
```

### 7h. Jurisdiction Lane
```sql
SELECT COUNT(*) FROM dbo.tax_area  -- how many TCAs
SELECT COUNT(*) FROM dbo.entity    -- how many levy districts
-- Benton ref: 109 TCAs, 37 districts — will differ
```

### 7i–7j. Revenue Lanes (L-bills and A-bills)
```sql
-- Confirm bill model
SELECT bill_type, COUNT(*) cnt FROM dbo.bill
WHERE year=[certified_year] AND is_active=1
GROUP BY bill_type
-- Benton ref: L=1,104,507 / A=313,139
-- Note: if no 'A' bills exist, Revenue Stage 2B is EMPTY_IN_SOURCE for this county

-- Confirm levy_bill join (1:1 with L bills)
SELECT COUNT(*) FROM dbo.bill b
JOIN dbo.levy_bill lb ON lb.bill_id=b.bill_id
WHERE b.year=[certified_year] AND b.is_active=1 AND b.bill_type='L'
-- Should equal L bill count
```

### 7k. Payment Net-Paid Attestation
```sql
-- Run corpus-level proof BEFORE surfacing any paid/balance figures
SELECT SUM(amount_paid) bill_paid, COUNT(*) bill_cnt
FROM dbo.bill WHERE year=[certified_year] AND is_active=1

SELECT SUM(t.base_amount_pd) coll_paid, COUNT(*) coll_cnt
FROM dbo.coll_transaction t
JOIN dbo.bill b ON b.bill_id=t.trans_group_id
WHERE b.year=[certified_year] AND b.is_active=1

-- Required: both sums equal (delta = $0.00)
-- If delta != $0: do NOT surface paid/balance until root cause is found
```

---

## Step 8 — Run tf-sync doctor (baseline)

Before any drain, run the doctor and capture the baseline state.

```bash
node tools/sync/tf-sync-doctor.mjs
```

At this point, with an empty or partial substrate for the new county, expect:
- Tool #2 (seal-check) will likely FAIL (seals not yet established)
- Tool #1 (identity-drift) may WARN (county data not yet in canonical tables)
- Tool #3 (domain-coverage) will show no SEALED lanes

**Record the baseline output.** This is your "before" snapshot. After sealing each lane, re-run and confirm the verdict moves toward PASS/WARN.

---

## Step 9 — Seal Lanes

Seal each lane in dependency order. Suggested sequence:

```
1. Identity spine (parcel)     — prerequisite for everything
2. Owner                       — establishes the people layer
3. Land                        — prerequisite for improvement denominator
4. Improvement                 — most complex; run last in the physical layer
5. Sales                       — confirm ratio policy before sealing
6. Geometry                    — independent; can run after identity spine
7. Assessment value            — requires identity spine
8. Exemption                   — requires identity spine + owner
9. Jurisdiction                — requires identity spine
10. Revenue L-bill             — requires identity spine + jurisdiction (for district backing)
11. Revenue A-bill             — requires identity spine
12. Payment attestation        — corpus proof (Step 7k); NOT a drain — read-only SQL
```

For each lane:
1. Run the promoter / drain
2. Confirm truth row count matches the expected denominator (Step 2 baseline)
3. Confirm 1.0000× duplication invariant
4. Diagnose any unresolved gap by class/reason
5. Confirm pipeline is idempotent (re-run)
6. Run the relevant gates from `tools/sync/seal-check-runner.sql`
7. Create evidence artifact in `evidence/[date]-[county]-[lane]-seal.md`

**Do not declare a lane SEALED until all 7 steps pass.**

---

## Step 10 — Run tf-sync doctor (post-seal)

After all lanes are sealed, run the doctor and confirm the final verdict.

```bash
node tools/sync/tf-sync-doctor.mjs
```

Expected post-seal verdict: `OVERALL: WARN`

WARN is the correct steady state because:
- `tf_parcel_owner_link` drift will likely be present (deferred, as in Benton)
- LANDED_ONLY history lanes will appear (expected)
- DISCOVERED_DEFERRED Treasurer domains will appear (expected)

If the verdict is FAIL: stop. Diagnose the specific FAIL item using the individual automation tools before proceeding.

---

## Step 11 — Produce Packet

Produce the standard evidence packet for this county's sealed substrate.

```
Packet shape (from doctrine §8):
  executive claim
  scope
  sealed lanes
  runtime proof table (row counts, denominators, dup invariants, amounts)
  doctrine record (ratio policy, supplement rule, property type codes)
  boundary register (what is deferred and why)
  evidence index (links to per-lane seal evidence artifacts)
  readback set (6-parcel acceptance set for this county)
  out-of-scope list
  handoff statement
```

**Readback set:** select 6 parcels matching the profiles in HARRIS_PACS_SOURCE_PACK.md §12 from this county's live spine. Run the acceptance checklist from `docs/sync/seals/benton-current-year-production-readback-checklist.md` against this county's data.

File the packet at: `docs/sync/seals/{county}-current-year-spine-seal-packet.md`

---

## Override documentation template

For every step where this county deviates from the Benton reference, document:

```
Override: [lane or doctrine area]
Benton reference: [what the pack says]
This county: [what was confirmed here]
Evidence: [who confirmed it, where it came from]
Effective start year (if time-bound): [year]
```

Add these overrides to a `docs/sync/source-packs/harris-pacs/{county}-overrides.md` file.

---

## Runbook completion checklist

```
[ ] Step 0 — Public recon (if available)
[ ] Step 1 — Source connected; 16 tables confirmed; read-only access
[ ] Step 2 — Baseline counts recorded
[ ] Step 3 — Domain coverage audited; deviations documented
[ ] Step 4 — Schema comparison complete; no missing columns
[ ] Step 5 — Identity spine doctrine confirmed; override points noted
[ ] Step 6 — Active supplement doctrine confirmed per domain
[ ] Step 7 — All 11 lane contracts confirmed or overridden
[ ] Step 7k — Payment net-paid attestation proven at corpus scale (Δ=$0.00)
[ ] Step 8 — tf-sync doctor baseline captured
[ ] Step 9 — All lanes sealed with evidence artifacts
[ ] Step 10 — tf-sync doctor OVERALL: WARN (or PASS)
[ ] Step 11 — Evidence packet filed
[ ] County override file created if any deviations found
```

---

_Reference county seal: `docs/sync/seals/benton-lane-status.md`_  
_Pack: `HARRIS_PACS_SOURCE_PACK.md`_  
_Dashboard: `node tools/sync/tf-sync-doctor.mjs`_
