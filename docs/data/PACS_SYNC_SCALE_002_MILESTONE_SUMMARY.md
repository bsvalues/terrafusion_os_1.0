# WO-DATA-004B-SCALE-002 — Milestone Summary

**Work Order:** WO-DATA-004B (SCALE-002 packet)
**Date:** 2026-06-19
**Status:** COMPLETE — All five drainable lanes proven at 5× parcel scale. Geometry excluded by design.
**Codex review:** PASS (all lanes)
**Prerequisite:** SCALE-001 accepted (TopN=500 baseline), SCALE-001Z credential hygiene (PR #1052)

---

## What This Proves

SCALE-002 demonstrates that TerraFusion Sync correctly drains, promotes, and canonicalizes Benton County PACS data at **TopN=2,500 parcels** (parcel/owner/land) and **TopN=1,000** (improvement/sales) — 5× and 2× the SCALE-001 baseline respectively — with:

- No new FAIL gate classes introduced
- All known failure modes scaling proportionally with data volume
- Dev-clean DB (`terrafusion_dev_clean`) untouched throughout
- PACS source read-only (`pacs_oltp_verify` D: copy, not the original `tf_mssql_data` volume)
- Zero credential leakage in committed evidence

---

## Lane Results

| Lane | Work Order | TopN | Rows Landed | Rows Promoted | Rows Canonicalized | Gate Result | Quarantine | Notable |
|---|---|---|---|---|---|---|---|---|
| Z — baseline | SCALE-002Z | — | 0 | 0 | 0 | — | 0 | Fresh DB, post-seed snapshot taken |
| A — parcel | SCALE-002A | 2,500 | 2,500 | 2,500 | 2,500 | 17P / 0F | 0 | Clean |
| B — owner-wsdor | SCALE-002B | 2,500 | 4,999 | 4,999 | 7,118 cumul. | 49P / 0F | 0 | 2,500 owner_current + 2,499 wash_prop_owner_val |
| C — improvement | SCALE-002C | 1,000 | 12,922 | 1,222 | 5,055 at drain (+7,867 ATTR-POP) | 52P / 1F | 0 after ATTR-POP | Dup-tuple waiver (3→6, §below) |
| D — land | SCALE-002D | 2,500 | 2,666 | 2,666 | 2,666 | 34P / 0F | 0 | Clean |
| E — sales | SCALE-002E | 1,000 | 1,000 | 386 | 385 | 30P / 1W / 0F | 1 (unproven.sale) | noSuppPointer=210 WARN; +372 parcel auto-canon |

---

## Cumulative Final State (`terrafusion_scale_proof`)

| Table | Count |
|---|---|
| `canonical_tf.tf_parcel` | **2,872** (2,500 original + 372 sale-referenced auto-canon) |
| `canonical_tf.tf_owner` | **2,119** |
| `canonical_tf.tf_parcel_owner_link` | **2,500** |
| `canonical_tf.tf_assessment_wsdor` | **2,499** |
| `canonical_tf.tf_improvement` | **1,222** |
| `canonical_tf.tf_improvement_feature` | **11,700** |
| `canonical_tf.attribute_definition` | **35 total / 34 active** |
| `canonical_tf.tf_land` | **2,666** |
| `canonical_tf.tf_sale` | **385** |
| `truth_pacs.parcel_spine` | **2,500** |
| `truth_pacs.owner_current` | **2,500** |
| `truth_pacs.wash_prop_owner_val` | **2,499** |
| `truth_pacs.imprv_current` | **1,222** |
| `truth_pacs.land_current` | **2,666** |
| `truth_pacs.sale` | **386** |
| `legacy_tf_unproven.unresolved_imprv_attr` | **0** |
| `legacy_tf_unproven.sale` | **1** |
| `sync_bridge.source_xref` | **11,763** |
| `sync_bridge.load_batch` | **46** |
| `sync_bridge.promotion_gate_result` | **200** |

---

## Known Conditions and Dispositions

### 1. Improvement duplicate attr tuple count: 3 → 6 (SCALE-002C)

**Gate:** `imprv-attr-key-uniqueness` / `SOURCE_TO_RAW` / FAIL
**SCALE-001 baseline:** 3 duplicate 6-key tuples
**SCALE-002C observed:** 6 duplicate 6-key tuples
**Assessment:** Proportional 2× scaling of a known PACS source-data condition. Same gate, same stage, same class. No new code failure.
**Disposition:** Explicit operator waiver granted for SCALE-002C only (documented in SCALE-002C evidence §12a).
**New baseline:** 6. Any count >6 in future drains stops for review unless separately waived.

### 2. Sales WARN — `truth-pacs-supp-aware-join` (SCALE-002E)

**Gate:** `truth-pacs-supp-aware-join` / `RAW_TO_TRUTH` / WARN
**Detail:** `noSuppPointer=210 staleSupNum=0`
**Assessment:** 210 of 1,000 raw sale rows had no supplement pointer — filtered at RAW_TO_TRUTH, not promoted. Known PACS data characteristic. WARN, not FAIL. No blocking condition.
**Disposition:** Documented, accepted. Not a new failure class.

### 3. Sales parcel auto-canonicalization: +372 (SCALE-002E)

**`canonical_tf.tf_parcel` change:** 2,500 → 2,872
**Assessment:** Sales drain co-canonicalizes parcels referenced by promoted sale records that were outside the original TopN=2,500 parcel sample. Expected design behavior — ensures valid parcel FK for every canonical sale row. All 372 are real Benton County PACS parcels. `terrafusion_dev_clean` unaffected.
**Disposition:** Documented, accepted.

### 4. ATTR-POP required on fresh DB (SCALE-002C)

**Condition:** On a fresh `terrafusion_scale_proof` DB, `canonical_tf.attribute_definition` starts at 0. All 7,867 `imprv_attr` rows quarantine during the improvement drain. ATTR-POP-1 + ATTR-POP-2 resolve them.
**Final state:** `unresolved_imprv_attr = 0` after both ATTR-POP steps.
**Disposition:** Expected. ATTR-POP is a required post-drain step on fresh DB, not a defect.

### 5. Sales quarantine: 1 row in `legacy_tf_unproven.sale` (SCALE-002E)

**Count:** 1 row
**Assessment:** Single unqualified sale row quarantined to `legacy_tf_unproven.sale`. Minor; does not affect promotion counts or canonical integrity.
**Disposition:** Documented, accepted.

---

## Safety Record

| Control | Status |
|---|---|
| `terrafusion_dev_clean` touched? | **No** — 83,326/83,687/61/137 unchanged throughout |
| `tf_mssql_data` Docker volume touched? | **No** |
| PACS source mutated? | **No** — read-only contact only (`pacs_oltp_verify`) |
| Manual mutation SQL used? | **No** |
| Code changed? | **No** |
| DB reset? | **No** |
| Full corpus run? | **No** — all drains used `FullCorpus=false` with explicit TopN |
| Credentials in committed docs? | **No** — secret scan CLEAN on all lane docs |

---

## Snapshot

`terrafusion_scale_proof_scale002_postseed_baseline.dump` — local only, not committed, not in PR. Documents the post-seeder / pre-drain state of `terrafusion_scale_proof`.

---

## Committed Evidence Artifacts

| Lane | File |
|---|---|
| Summary (this doc) | `docs/data/PACS_SYNC_SCALE_002_MILESTONE_SUMMARY.md` |
| SCALE-002Z | `docs/data/PACS_SYNC_SCALE_002Z_BASELINE_RESULTS.md` |
| SCALE-002A | `docs/data/PACS_SYNC_SCALE_002A_PARCEL_2500_RESULTS.md` |
| SCALE-002B | `docs/data/PACS_SYNC_SCALE_002B_OWNER_WSDOR_2500_RESULTS.md` |
| SCALE-002C | `docs/data/PACS_SYNC_SCALE_002C_IMPROVEMENT_1000_RESULTS.md` |
| SCALE-002D | `docs/data/PACS_SYNC_SCALE_002D_LAND_2500_RESULTS.md` |
| SCALE-002E | `docs/data/PACS_SYNC_SCALE_002E_SALES_1000_RESULTS.md` |

All files are under `docs/data/` (gitignored by default, force-added for evidence commits on branch `docs/wo-data-004b-scale-001-results`).

---

## Local Commit Chain (This Branch)

| Commit | Description |
|---|---|
| `4cf8fe19d` | SCALE-002Z baseline |
| `c9f72bfd3` | SCALE-001 evidence (prior) |
| `d1f512984` | SCALE-001 patched evidence |
| `7aefe47ac` | SCALE-002A parcel evidence |
| `32851b8a0` | SCALE-002A patch |
| `9911546ad` | SCALE-002B owner-wsdor evidence |
| `613928fcb` | SCALE-002C improvement evidence |
| `a1c90ac77` | SCALE-002C patch (canonicalization + dup-tuple waiver) |
| `e530882d0` | SCALE-002C closeout (SCALE_002D_READINESS → READY) |
| `0022b18e6` | SCALE-002D land evidence |
| `df69eb498` | SCALE-002E sales evidence |
| (this commit) | SCALE-002 milestone summary |

---

## Next Steps

SCALE-002 packet is complete. Geometry lane excluded by design (requires separate WO-DATA-004C-GEOM-001 slice with code changes, tracked separately).

**Awaiting operator authorization to open milestone PR.**
