# WO-DATA-004B-FINAL — Controlled PACS/Sync Slice Summary

**Work Order:** WO-DATA-004B-FINAL
**Date:** 2026-06-18
**Branch:** `docs/wo-data-004b-fix2a-pacs-copy-evidence` (evidence branch)
**Status:** COMPLETE — 5 of 6 lanes proven; geometry explicitly skipped by design

---

## 1. Source Truth

| Field | Value |
|---|---|
| PACS Source | `pacs_oltp_verify` — SQL Server 2022, port 21433 |
| PACS Copy Location | `D:\TerraFusion_PACS_Verification\source-copy\pacs_oltp.mdf` |
| Copy Size | 572,901,883,904 bytes (533.56 GB) — size-matched to source |
| LDF Copy | `pacs_oltp_log.ldf` — 1,073,618,944 bytes — size-matched |
| Original Volume | `tf_mssql_data` Docker volume — **NOT mutated** |
| DB Target | `terrafusion_dev_clean` — PostgreSQL PG16, port 5432 |
| PACS Vintage | 774,728 qualifying rows, max owner_tax_yr = 2026 |
| API Worktree | `C:\Users\bsval\tf-fix4-owner` — Release build, origin/main |
| Dev Seeders | `TF_SKIP_DEV_SEEDERS=true` enforced for all drains |

---

## 2. Completed Lane Results

### Parcel — WO-DATA-004B-FIX3

| Metric | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/parcel` |
| TopN | 100 |
| Rows Landed | **100** → `legacy_pacs_raw.parcel_raw` |
| Rows Promoted | **100** → `truth_pacs.parcel_spine` |
| Rows Canonicalized | **100** → `canonical_tf.tf_parcel` |
| Rows Quarantined | 0 |
| Gates | 17 PASS / 0 FAIL |
| Errors | None |
| Evidence | `PACS_SYNC_FIX3_CONTROLLED_PARCEL_DRAIN_RESULTS.md` |

---

### Owner-WSDOR — WO-DATA-004B-FIX4

| Metric | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/owner-wsdor` |
| TopN | 100 |
| Rows Landed | **199** (100 owner + 99 WPOV) |
| Rows Promoted | **199** (100 owner_current + 99 WPOV truth) |
| Rows Canonicalized | **283** (84 tf_owner + 100 parcel_owner_link + 99 assessment_wsdor) |
| Rows Quarantined | 0 |
| Gates | 49 PASS / 0 FAIL |
| Errors | None |
| Evidence | `PACS_SYNC_FIX4_CONTROLLED_OWNER_WSDOR_DRAIN_RESULTS.md` |

---

### Improvement — WO-DATA-004B-FIX5

| Metric | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/improvement` |
| TopN | 100 |
| Rows Landed | **1,004** (104 imprv + 312 imprv_detail + 588 imprv_attr) |
| Rows Promoted | **104** → `truth_pacs.imprv_current` |
| Rows Canonicalized | **416** (104 tf_improvement + 312 tf_improvement_feature) |
| Rows Quarantined | **588** (`legacy_tf_unproven.unresolved_imprv_attr`) |
| Gates | 52 PASS / **1 FAIL** |
| Errors | 1 FAIL: `imprv-attr-key-uniqueness` — 3 duplicate 6-key tuples (known PACS source issue) |
| Status | Operationally successful **with quarantine** — not fully clean |
| Evidence | `PACS_SYNC_FIX5_IMPROVEMENT_DRAIN_RESULTS.md` |

**Improvement lane qualifiers (carry-forward through all subsequent reporting):**

> The improvement lane is operationally successful with quarantine handling, **not fully clean**.
> 588 unresolved imprv_attr codes remain in `legacy_tf_unproven.unresolved_imprv_attr` and
> require a future `attr-drain-1` release pass. The `imprv-attr-key-uniqueness` gate flagged
> 3 duplicate 6-key tuples in PACS source data. Count must remain visible in all reports.
> Acceptance conditional on count staying at 3.

---

### Land — WO-DATA-004B-FIX6

| Metric | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/land` |
| TopN | 100 |
| Rows Landed | **137** → `legacy_pacs_raw.land_detail` |
| Rows Promoted | **137** → `truth_pacs.land_current` |
| Rows Canonicalized | **137** → `canonical_tf.tf_land` |
| Rows Quarantined | 0 |
| Gates | 34 PASS / 0 FAIL |
| Errors | None |
| Evidence | `PACS_SYNC_FIX6_LAND_DRAIN_RESULTS.md` |

**Note:** `legacy_pacs_raw.land_detail` had 137 pre-existing rows from the improvement drain's
non-blocking LandDetail-S1 stage. Land drain added 137 more (274 total raw); promoter picked
137 unique records. Expected and documented.

---

### Sales — WO-DATA-004B-FIX7 / FIX7A / FIX7B

| Metric | Value |
|---|---|
| Endpoint | `POST /api/sync/doctrine/drain/sales` |
| TopN | 100 |
| Rows Landed | **100** → `legacy_pacs_raw.sale` |
| Rows Promoted | **61** → `truth_pacs.sale` (doctrine qualification filter) |
| Rows Canonicalized | **61** → `canonical_tf.tf_sale` |
| Rows Quarantined | 0 |
| Gates | 30 PASS / **1 WARN** / 0 FAIL |
| Promoted Sale Date Range | 2025-12-11 to 2026-01-08 |
| Errors | None |
| Evidence | `PACS_SYNC_FIX7B_SALES_DRAIN_RETRY_RESULTS.md` |

**Sales lane schema fix (FIX7A):**
`legacy_pacs_raw.sale.WacCd` was `varchar(8)` in the DB; PACS source contains WAC/RCW
exemption codes up to 19 characters. Migration `20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment`
aligned DB to EF config (WacCd varchar(8)→32, SlCountyRatioCd varchar(8)→10). Applied before retry.

**WARN — `truth-pacs-supp-aware-join`:** `noSuppPointer=4` — 4 sales have no supplement pointer.
Data quality observation, not a blocker.

**Parcel stubs from sales drain:**
61 canonical parcel stubs were created for sale-referenced properties not already in tf_parcel
from the initial parcel slice. tf_parcel 100→160. Confirmed via source_xref breakdown (61 parcel
xrefs from sales drain operator). Documented, investigated, and accepted — not a silent side effect.

---

## 3. Known Findings

| Finding | Detail | Status |
|---|---|---|
| Improvement unresolved attributes | 588 rows in `legacy_tf_unproven.unresolved_imprv_attr` | Quarantined — requires future `attr-drain-1` release pass |
| Improvement PACS duplicate 6-key tuples | `imprv-attr-key-uniqueness` gate: 3 duplicate tuples | Known PACS source issue — must remain visible in all reports; accepted at count=3 |
| Sales schema gap (WacCd varchar(8)) | PACS `wac_cd` values up to 19 chars; EF config was correct but migration was missing; orphaned `20260504000000_WidenLegacyPacsRawSaleCodeColumns.cs` had no Designer.cs | Fixed by `20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment` |
| Sales parcel stubs (+60) | Sales drain created 60 canonical parcel stubs for sale-referenced properties; tf_parcel 100→160 | Documented and accepted |
| Sales WARN noSuppPointer=4 | 4 sales have no supplement pointer in `prop_supp_assoc` | Data quality observation; WARN not FAIL |
| Geometry skipped | Not TopN-capable (pulls full 80,175-feature county set); county ID config mismatch | Deliberately excluded from this slice (see §5) |

---

## 4. Final Controlled-Slice Status

| Check | Status |
|---|---|
| PACS lanes completed through sales | ✅ |
| No full import was run | ✅ |
| No geometry import was run | ✅ Explicitly skipped |
| Original `tf_mssql_data` volume untouched | ✅ |
| No manual INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER | ✅ |
| Fake dev seeders suppressed (`TF_SKIP_DEV_SEEDERS=true`) | ✅ All drains |
| Canonical tables protected | ✅ |
| Quarantine handling works | ✅ 588 rows properly quarantined, not silently lost |
| Schema alignment migration generated and applied | ✅ WacCd/SlCountyRatioCd |
| Gate framework enforced | ✅ 182 PASS / 1 FAIL (known PACS) / 2 WARN across all lanes |
| API run from fresh origin/main worktree | ✅ `tf-fix4-owner` Release build |

---

## 5. Production Readiness Decision

**The controlled PACS/Sync slice is successful for parcel, owner-wsdor, improvement, land, and
sales.** The doctrine drain pipeline is proven end-to-end against a verified copy of the live
Benton County PACS (pacs_oltp_verify, 533 GB, current through 2026).

**Geometry is not approved for this controlled slice.** It has two independent blockers that
require their own design and fix work orders before it can run:
1. The geometry lane ignores TopN and would unconditionally import 80,175 ArcGIS features — a
   full-corpus pull that violates the bounded slice contract.
2. The Benton County Guid in the database (`4ec6e187-f053-4397-b87c-95d0ef9e99aa`) does not
   match the ArcGIS config key (`19190019-1919-1919-1919-191919191919`); the drain would fail
   at Stage D1 before writing a row even if full import were approved.

Running geometry would have silently converted the final lane into a full import. Containment
is the correct call.

---

## 6. Final Canonical State (Post-Slice)

| Table | Rows | Source |
|---|---|---|
| `canonical_tf.tf_parcel` | 160 | FIX3 (100) + FIX7B parcel stubs (60) |
| `canonical_tf.tf_owner` | 84 | FIX4 |
| `canonical_tf.tf_parcel_owner_link` | 100 | FIX4 |
| `canonical_tf.tf_assessment_wsdor` | 99 | FIX4 |
| `canonical_tf.tf_improvement` | 104 | FIX5 |
| `canonical_tf.tf_improvement_feature` | 312 | FIX5 |
| `canonical_tf.tf_land` | 137 | FIX6 |
| `canonical_tf.tf_sale` | 61 | FIX7B |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | FIX5 quarantine |
| `gis_tf.tf_parcel_geom` | 0 | Geometry skipped |
| `legacy_arcgis_raw.parcel_geom` | 0 | Geometry skipped |
| `truth_arcgis.parcel_geom_current` | 0 | Geometry skipped |

---

## 7. Sync Bridge Final State

| Table | Count | Notes |
|---|---|---|
| `sync_bridge.load_batch` | 49 | All drain stages across FIX3–FIX7B |
| `sync_bridge.source_xref` | 645 | Full provenance chain — parcel/owner/imprv/land/sale |
| `sync_bridge.promotion_gate_result` | 201 | 182 PASS / 1 FAIL / 2 WARN (across all lanes) |

---

## 8. Evidence Chain

| Work Order | Commit | File |
|---|---|---|
| FIX3 — Parcel drain | `tf-docs-fix3` | `PACS_SYNC_FIX3_CONTROLLED_PARCEL_DRAIN_RESULTS.md` |
| FIX4 — Owner-WSDOR drain | `tf-docs-fix3` | `PACS_SYNC_FIX4_CONTROLLED_OWNER_WSDOR_DRAIN_RESULTS.md` |
| FIX5 — Improvement drain | `tf-docs-fix3` | `PACS_SYNC_FIX5_IMPROVEMENT_DRAIN_RESULTS.md` |
| FIX6 — Land drain | `tf-docs-fix3` | `PACS_SYNC_FIX6_LAND_DRAIN_RESULTS.md` |
| FIX7 — Sales BLOCKED | `8b726278f` | `PACS_SYNC_FIX7_SALES_DRAIN_RESULTS.md` |
| FIX7A — Schema fix | `a23dcae` (tf-fix4-owner) | `PACS_SYNC_FIX7A_SALES_SCHEMA_WIDTH_ALIGNMENT.md` |
| FIX7B — Sales retry | `5b1e66f5b` | `PACS_SYNC_FIX7B_SALES_DRAIN_RETRY_RESULTS.md` |
| FIX8 — Geometry BLOCKED | `d420572b3` | `PACS_SYNC_FIX8_GEOMETRY_DRAIN_RESULTS.md` |
| FINAL — This file | (this commit) | `PACS_SYNC_CONTROLLED_SLICE_FINAL_SUMMARY.md` |

---

## 9. Next Work Orders

| Work Order | Scope |
|---|---|
| `WO-DATA-004C-GEOM-001` | Geometry Slice-Control Design — add TopN/pagination support to geometry lane so a bounded drain is possible |
| `WO-DATA-004C-GEOM-002` | Benton ArcGIS County Config Alignment — map actual Benton CountyId (`4ec6e187-f053-4397-b87c-95d0ef9e99aa`) in ArcGIS config |
| `WO-DATA-004B-SCALE-001` | Next PACS controlled batch size decision — review FIX3–FIX7B results, decide whether to scale TopN from 100 toward the full corpus for each completed lane |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **COMPLETE** (5 lanes) / **SKIPPED** (geometry — by design) |
| FILES_CHANGED | 1 new file: `PACS_SYNC_CONTROLLED_SLICE_FINAL_SUMMARY.md` |
| COMPLETED_LANES | parcel / owner-wsdor / improvement / land / sales |
| SKIPPED_LANE | geometry — not TopN-capable; county config mismatch; 80,175-feature corpus |
| CONTROLLED_SLICE_STATUS | **PROVEN** — doctrine drain pipeline end-to-end on 5 PACS lanes |
| GEOMETRY_DECISION | Deliberately excluded; requires `WO-DATA-004C-GEOM-001` and `WO-DATA-004C-GEOM-002` before any geometry drain |
| KNOWN_ISSUES | 588 imprv_attr quarantine; 3 PACS dup-key tuples; WacCd schema gap (fixed); sales parcel stubs (+60, documented); sales WARN noSuppPointer=4 |
| PR_OR_LOCAL_ARTIFACT | Local branch `docs/wo-data-004b-fix2a-pacs-copy-evidence`, this file |
| NEXT_WORK_ORDERS | `WO-DATA-004C-GEOM-001`, `WO-DATA-004C-GEOM-002`, `WO-DATA-004B-SCALE-001` |
