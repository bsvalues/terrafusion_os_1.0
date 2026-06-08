# Benton Current-Year Spine — Seal Packet / Production Handoff

_Date: 2026-06-07 · Source of truth: live Harris PACS (`pacs_oltp`) · Target: TerraFusion DB
(`legacy_pacs_raw` → `truth_pacs` → `canonical_tf` / `gis_tf`)_

> **Amended 2026-06-07 — Mission 2 Addendum:** Revenue Spine **Stage 1** (current-year levy tax
> bill explanation) is now **sealed** (commit `5845c5360`). The "Revenue Spine deferred" disposition
> below is superseded for Stage 1 only; payment transactions, 'A' assessment bills, fund/distribution,
> delinquency, and history remain deferred. See `docs/sync/seals/benton-revenue-spine-stage1-addendum.md`.

---

## 1. Executive Seal Statement

**Benton County's current-year valuation and jurisdiction spines are sealed, runtime-proven
against live Harris PACS, and ready for production readback / county acceptance.**

This does **not** claim Revenue Spine (billing/levy/payment) completion. It claims that every
active Benton parcel can be resolved, valued, exemption-qualified, and placed in its taxing
jurisdiction — the complete current-year operational substrate for assessment context.

---

## 2. Scope

Current-year operational substrate: **valuation + jurisdiction**.

```
parcel identity + owner + land + improvement + sales + geometry
+ assessed value + exemptions + tax area + districts
```

Operational year: **2025** (current certified year; 2026 is in-progress). Current truth is taken
at the **active supplement**, not blindly `sup_num = 0`.

Explicitly out of scope (see §6): Revenue Spine; full multi-year history; WSDOR re-drive tail.

---

## 3. Sealed Lane Registry

| Spine | Lane | Status |
|---|---|---|
| Valuation | Owner | ✅ SEALED |
| Valuation | Improvement | ✅ SEALED |
| Valuation | Land | ✅ SEALED |
| Valuation | Sales | ✅ SEALED |
| Valuation | Geometry | ✅ SEALED |
| Valuation | Assessment Value | ✅ SEALED |
| Valuation | Exemption | ✅ SEALED |
| Jurisdiction | Tax Area → District | ✅ SEALED |

Detail registry: `docs/sync/seals/benton-lane-status.md`.

---

## 4. Runtime Proof Table

| Lane | Denominator | Truth | Canonical | Dup | Notes |
|---|---|---|---|---|---|
| Owner | 816,849 owner rows (active-supp) | 816,849 | tf_owner (acct) + 2.1M links | 1.0000× | +42,089 class-2 vs 95.72% ceiling; stalesup 0 / nosupp 0 |
| Improvement | 71,736 R-type imprv parcels | — | 99,694 features | 1.0000× | 4,176 MH excluded by spine doctrine |
| Land | 82,012 R-type land parcels | — | 87,767 | 1.0000× | |
| Sales | 29,914 qualified sales | — | 29,608 | 1.0000× | DOR-or-county qualification |
| Geometry | 80,076 ArcGIS features | — | 80,075 | 1.0000× | 98.8% crosswalked to tf_parcel |
| Assessment Value | 95,455 (2025 active-supp) | 95,455 | 83,326 | 1.0000× | assessed_val 100%; 1,041 nonzero active-supp; 12,129 outside spine |
| Exemption | 6,487 (2025 active-supp) | 6,487 | 5,643 | 1.0000× | dict 6 types 0 unbacked; 126 nonzero active-supp; 844 outside spine |
| Jurisdiction | 95,455 landed (2025 active-supp) | — | 83,326 parcel→TCA | 1.0000× | tf_tax_area 109; tf_tax_district 37; tf_tax_area_district 487; 0 unbacked |

Canonical-layer counts of 83,326 (assessment / jurisdiction) reflect the sealed real-property
**parcel spine** (mobile-home / personal-property parcels are excluded by spine doctrine; the
truth layer holds the full active-supp denominator). This is consistent across lanes, not loss.

---

## 5. Doctrine Record

**The active-supplement rule (Benton PACS doctrine, proven across four domains).**
```
For current operational Benton PACS facts, current truth is the ACTIVE supplement,
NOT blindly sup_num = 0.

The active row must be proven per domain using MAX(sup_num) over the relevant
source grain and operational year.
```
Proven on: **Owner** (34,636 class-2 keys recovered), **Assessment Value** (1,041 nonzero active),
**Exemption** (126 nonzero active), **Jurisdiction** (1,041 nonzero active). In every case
`sup_num = 0` would have served stale truth.

**Year semantics.** Operational year keys differ by domain and must be used verbatim:
`owner_tax_yr`, `prop_val_yr` (assessment), `exmpt_tax_yr` (exemption), `year` (property_tax_area).
Context-only year variants (`owner_tax_yr`, `effective_tax_yr`, `qualify_yr`) are retained as
lineage, never used as the operational key.

**2018 ProVal/Ascend conversion caution.** Benton PACS spans converted history (assessment to
1968, exemption to 1994, tax-area to 1968). Converted rows carry sentinels (e.g. `PropCreateDt`
1980-01-01) and flags ("Converted", `is_inactive_after_year`). These are retained as metadata and
must **not** be used to suppress current active rows. History is deferred (§6).

**Landed ≠ usable truth.** A table being "landed" does not mean it carries the needed payload:
`legacy_pacs_raw.property_val` was landed for classification only (no value columns) — proven and
corrected during the Assessment Value seal. Always verify the payload, not just the table.

---

## 6. Boundary Register

| Boundary | Disposition |
|---|---|
| Revenue Spine — current-year **levy** tax bill (due / paid / balance, district, rate) | **✅ Stage 1 sealed** 2026-06-07 (`5845c5360`, read-only PACS-verbatim). See addendum. |
| Revenue Spine — payment txn / 'A' bills / fund / distribution / delinquency / history | **Deferred** — separate treasurer-grade stages. `fund_id` deliberately excluded from canonical revenue/jurisdiction entities. |
| Historical lanes (assessment 1968–, exemption 1994–, tax-area 1968–) | **Deferred** — current-year only sealed; history is a follow-on. |
| WSDOR `wash_prop_owner_val` re-drive | **Non-blocking** — owner-current truth seal does not depend on it; re-drive is an optional EF tail. |
| `tax_district_id` vs levy/fund | Jurisdiction stops at `tax_district_id`; no rates/bills/payments/levy amounts introduced. |

---

## 7. Evidence Index

**This session (current-year spines):**
```
388b30cbe  domain coverage audit (valuation-complete, not county-data complete)
f1a733c76  owner: resolve active owner supplement numbers (supp source)
d90b2b200  owner: land active-supp owner records + COPY landing (the real fix)
74a11168f  owner: seal at 100% — evidence + registry
cdc9c24e1  owner: runtime truth seal proof
3da96c176  assessment value lane seal (current-year active-supp)
d9543b6bb  exemption fact lane seal (current-year active-supp)
d196ef176  jurisdiction spine seal (tax area / district assignment)
```
**Prior-session foundation lane seals:**
```
6fed3db4a  improvement lane seal (71,736 @ 1.0×)
007862a43  land lane seal (82,012 @ 1.0×)
8c62d8304  sales lane seal (29,914 qualified @ 1.0×)
b4fe0831d  geometry lane seal (80,075 @ 1.0×)
1e49f13cb  owner lane seal @ 95.72% (later broken to 100% — see above)
```
**Evidence artifacts:** `evidence/2026-06-07-owner-supnum-resolution.md`,
`evidence/2026-06-07-assessment-value-lane-seal.md`,
`evidence/2026-06-07-exemption-fact-lane-seal.md`,
`evidence/2026-06-07-jurisdiction-spine-seal.md` (+ prior 2026-05/06 lane-seal artifacts).

---

## 8. Production Readback Checklist

- [x] **County Studio parcel lookup** — parcel identity (`tf_parcel`) + geometry (`gis_tf.tf_parcel_geom`) resolvable.
- [x] **TerraForge valuation context** — assessed/market/appraised (`tf_assessment`) + component land/improvement values per active parcel-year.
- [x] **Owner context** — `tf_owner` + parcel-owner links at active supplement.
- [x] **Exemption context** — `tf_exemption` (type/subtype/pct, dict-backed) per parcel.
- [x] **Jurisdiction/district context** — parcel → tax area (`tf_parcel_tax_area`) → districts (`tf_tax_area_district` + `tf_tax_district`).
- [x] **No revenue claims** — no levy/fund/rate/bill/payment exposed; billing truth not asserted.

---

## 9. Handoff Statement

**Benton current-year valuation and jurisdiction spines are sealed, runtime-proven against live
Harris PACS, and ready for current-year assessment-context acceptance / production readback.**

This packet does not claim Revenue Spine completion, nor historical-lane completion. Those are
discovered, bounded, and intentionally deferred as separate missions. Every seal in this packet
was proven by runtime drains against live PACS to 1.0000× duplication, with the active-supplement
doctrine applied per domain, and committed with full governance discipline (no hook bypass, no
contamination of concurrent work).

---

*Prepared 2026-06-07. Process discipline: every false seal was rejected until root cause was
proven; no `--no-verify`; concurrent untracked governed-path files parked, never inherited.*
