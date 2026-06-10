# TerraFusion Sync — Runtime Production Proof
<!-- Production readiness evidence. Canonical record. Do NOT modify post-seal. -->

**Date**: 2026-06-09  
**Branch**: `fix/projector-delete-insert-atomicity`  
**HEAD**: `f81a8efa6`  
**DB target**: `terrafusion @ 127.0.0.1:5432`  
**Operator**: TerraFusion Copilot  

---

## tf-sync Doctor Result

Command: `node tools/sync/tf-sync-doctor.mjs`

```
══════════════════════════════════════════════════════════
  tf-sync doctor — TerraFusion Sync Health Check
══════════════════════════════════════════════════════════

  DB: terrafusion @ 127.0.0.1:5432

  #0  Harris PACS Pack Validator ...
      ✓  PASS — 65 checks pass  (1 info)

  #1  Identity-Drift Detector ...
      ✓  PASS — all tables clean

  #2  Seal-Check Runner ...
      ✓  PASS — 22/22 gates hold

  #3  Domain-Coverage Audit ...
      ✓  12 SEALED
      ⚠  3 LANDED_ONLY · 3 DISCOVERED_DEFERRED · 1 EMPTY_IN_SOURCE (all expected)

  ⚠  OVERALL: WARN — substrate clean, known deferred items present
     Safe to start a Sync session or run drains.
══════════════════════════════════════════════════════════
```

**Verdict**: WARN is the correct steady-state. All unexpected FAIL items resolved. WARN is driven exclusively by known-deferred domains in #3.

---

## Identity-Drift Result (full per-table)

All 11 parcel-bearing canonical tables have 0 dangling rows.

| table | total | live | dangling | null_ref | verdict |
|---|---|---|---|---|---|
| canonical_tf.tf_assessment | 83,326 | 83,326 | 0 | 0 | PASS |
| canonical_tf.tf_assessment_bill_current | 79,078 | 79,078 | 0 | 0 | PASS |
| canonical_tf.tf_assessment_bill_line | 313,139 | 313,139 | 0 | 0 | PASS |
| canonical_tf.tf_exemption | 5,643 | 5,643 | 0 | 0 | PASS |
| canonical_tf.tf_improvement | 99,694 | 99,694 | 0 | 0 | PASS |
| canonical_tf.tf_land | 87,767 | 87,767 | 0 | 0 | PASS |
| canonical_tf.tf_parcel_owner_link | 714,553 | 714,553 | 0 | 0 | PASS |
| canonical_tf.tf_parcel_tax_area | 83,326 | 83,326 | 0 | 0 | PASS |
| canonical_tf.tf_tax_bill_current | 79,767 | 79,767 | 0 | 0 | PASS |
| canonical_tf.tf_tax_bill_line | 990,665 | 990,665 | 0 | 0 | PASS |
| gis_tf.tf_parcel_geom | 80,075 | 79,105 | 0 | 970 | PASS |

Notes:
- `tf_parcel_owner_link`: 714,553 live rows, 0 dangling — F2 cleanup cleared all 1,397,252 prior dangling rows (commits `3057891b4` + `481955026`).
- `gis_tf.tf_parcel_geom`: 970 `null_ref` rows are the documented geometry residual (APN not in live spine); verdict is PASS because `null_ref ≠ dangling` per Learned Law #9.

---

## Seal-Check Result

22/22 gates hold. Revenue-A gates:

| gate | measured | expected | verdict |
|---|---|---|---|
| revenue-a / amount-due | $8,841,075.97 | $8,841,075.97 | PASS |
| revenue-a / bill-current-count | 79,078 | ≥ 79,078 | PASS |
| revenue-a / bill-line-count | 313,139 | ≥ 313,139 | PASS |

All other lanes (land, improvement, sales, owner, assessment-value, exemption, jurisdiction, revenue-L, payment net-paid): PASS.

---

## Domain-Coverage Summary

**12 SEALED** (alphabetical):

| domain | lane | canonical rows | notes |
|---|---|---|---|
| parcel | property + prop_supp_assoc | 83,326 | Live spine; F2 debris cleared |
| owner | owner + account | 312,532 | Current-year active-supplement |
| land | land_detail | 87,767 | Current-year active-supplement |
| improvement | imprv + imprv_detail + imprv_attr | 1,045,323 | incl. 945,629 features |
| sales-qualified | sale | 29,608 | DOR ratio-coded qualified sales |
| geometry | ArcGIS REST | 80,075 | Direct REST ingestion; 970 null-APN residual documented |
| assessment-value | property_val | 83,326 | Current-year 2025 |
| owner-wsdor | wash_prop_owner_val | 686,820 | WSDOR DOR audit roll |
| exemption | property_exemption | 5,643 | 844 non-real-property excluded |
| jurisdiction | property_tax_area | 83,326 | 109 tax areas / 37 districts / 487 area-districts |
| revenue-l-levy-bills | tax_bill_line | 990,665 | $308.9M due penny-exact |
| revenue-a-assessment-bills | assessment_bill_line | 313,139 | $8.8M due penny-exact |

**3 LANDED_ONLY** (by decision, not unknown gaps):
- `assessment-value-history` — full 1968–2026 history in landing; only 2025 sealed
- `land-improvement-history` — multi-year landing; only current-year sealed
- `sales-disqualified-historical` — disqualified sales in landing; qualified-only sealed

**3 DISCOVERED_DEFERRED**:
- `payment-collection-ledger` — Stage 3B proved bill.amount_paid ≡ SUM(base_amount_pd); ledger not required
- `fund-distribution-accounting` — Treasurer-grade; out of scope for assessor workbench
- `delinquency` — prior-year delinquent tracking; Treasurer-grade; out of scope

**1 EMPTY_IN_SOURCE**:
- `appeals-corrections-arb` — Benton County ARB volume = 0 meaningful rows per 2026-06-03 discovery

---

## Runtime Infrastructure State

| component | status |
|---|---|
| PostgreSQL | LISTENING :5432 |
| TerraFusion.API | LISTENING :5000 |
| tf-mssql (PACS) Docker | Up |
| Harris PACS pack validator | 65 checks PASS, 1 info |

---

## Known WARN (Expected — Not Blocking)

The doctor OVERALL: WARN is driven entirely by Domain-Coverage #3 showing deferred domains. This is the correct steady-state for a Benton current-year operational substrate. No unexpected FAIL items remain.

---

## What Is Still Deferred

| item | status | reason |
|---|---|---|
| History lanes (land/imprv/assessment-value) | DISCOVERED_DEFERRED | Multi-year history scope; future mission |
| Treasurer accounting (fund/distribution) | DISCOVERED_DEFERRED | Out of scope for assessor workbench |
| Delinquency lane | DISCOVERED_DEFERRED | Prior-year; Treasurer-grade |
| Payment collection ledger | DISCOVERED_DEFERRED | Bill grain net-paid model sufficient |
| ARB appeals | EMPTY_IN_SOURCE | Benton has no ARB volume |
| OS Shell approval/release gate | Not implemented | No authorized work item |
| Branch merge to main | Not done | Requires operator approval |

---

## Explicit Runtime-Proven Statement

**TerraFusion Sync is runtime-proven as a governed Sync preflight/proof substrate for Benton County current-year operational data.** The substrate includes: parcel identity (83,326 live parcels), land (87,767 segments), improvement (99,694 parcels / 945,629 features), sales (29,608 qualified), geometry (80,075 parcels), assessment values, exemptions, jurisdiction, levy bills ($308.9M), assessment bills ($8.8M), owner + WSDOR rolls — all identity-clean, seal-verified, and domain-covered.

Not proven: history lanes, Treasurer accounting, delinquency, approval/release workflow.
