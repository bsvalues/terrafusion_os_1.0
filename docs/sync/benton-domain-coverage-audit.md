# Benton PACS Domain Coverage Audit (2026-06-07)

**Question asked:** not "what lanes did we seal?" but **"what PACS domains exist that are
NOT represented in the Benton seal registry?"** — i.e. is Benton Sync *valuation-complete*
or *county-data complete*?

**Verdict: VALUATION-complete, NOT county-data complete.**

The five sealed lanes cover the parcel/valuation core. Several large, real, operational
PACS domains are entirely absent from `truth_pacs.*` / `canonical_tf.*` / the seal registry.

---

## Coverage matrix (live PACS row counts vs TerraFusion representation)

| PACS domain | PACS source (rows) | landed `legacy_pacs_raw` | `truth_pacs` | `canonical_tf` | Sealed? |
|---|---|---|---|---|---|
| Parcel master | property | ✅ property | ✅ parcel_spine | ✅ tf_parcel | ✅ (geometry/spine) |
| Owner | owner | ✅ owner | ✅ owner_current | ✅ tf_owner (+link) | ✅ **100%** |
| Account/party | account | ✅ account | (via owner) | (via tf_owner) | ✅ (in owner) |
| Improvement | imprv/detail/attr | ✅ | ✅ imprv_current | ✅ tf_improvement | ✅ |
| Land | land_detail | ✅ | ✅ land_current | ✅ tf_land | ✅ |
| Sale | sale | ✅ | ✅ sale | ✅ tf_sale | ✅ |
| Geometry | (ArcGIS) | — | — | gis_tf.tf_parcel_geom | ✅ |
| WSDOR assessed value | wash_prop_owner_val | ✅ | ✅ wash_prop_owner_val | ✅ tf_assessment_wsdor | ⏳ re-drive in progress |
| **Assessment value (core)** | **property_val = 2,539,028** | ✅ property_val (landed) | ❌ none | ❌ none | ❌ **landed only, NO seal** |
| **Tax / Bill** | **bill = 42,188,359** | ❌ | ❌ | ❌ | ❌ **ABSENT** |
| **Levy** | **levy = 2,147 · levy_bill = 34,925,866** | ❌ | ❌ | ❌ | ❌ **ABSENT** |
| **Payments** | **payment = 2,850,455** | ❌ | ❌ | ❌ | ❌ **ABSENT** |
| **Exemptions** | **property_exemption = 206,603** | ❌ | ❌ | dict only (`dict_exemption_type`) | ❌ **ABSENT (dict, no facts)** |
| **Tax area / district** | property_tax_area = 2,539,043 · tax_area = 109 · tax_district = 37 | ❌ | ❌ | ❌ | ❌ **ABSENT** |
| **Appraisal totals / certified roll** | appraisal_totals_* (~20 tables) | ❌ | ❌ | ❌ | ❌ ABSENT |
| Appeals / ARB / arbitration | arb_protest = 0 · arbitration = 0 | ❌ | ❌ | ❌ | n/a (no data in this PACS instance — verify w/ operator) |

---

## Findings

1. **Tax / Levy / Billing is the biggest gap — and it has real, massive data.**
   `bill` 42.2M rows, `levy_bill` 34.9M, `payment` 2.85M. Zero representation anywhere in
   TerraFusion. Any taxpayer/treasurer/billing workflow is uncovered. (The founder's
   immediate instinct — "what about tax?" — was correct.)

2. **Exemptions: 206,603 real `property_exemption` rows; TerraFusion has only an empty
   `dict_exemption_type`.** Senior/disabled-vet/open-space/current-use/forest/historic
   exemptions are not in canonical truth. Major valuation-adjacent domain missing.

3. **Tax area / district assignments absent.** 2.5M `property_tax_area` parcel→area links,
   109 tax areas, 37 tax districts. Geometry sealed parcel *shapes* only — not the
   school/fire/levy/special-assessment district *assignments*.

4. **Core assessment value (`property_val`, 2.5M rows) is LANDED but NOT sealed.** It is in
   `legacy_pacs_raw.property_val` (multi-year, so assessment history is present at the
   landing layer) but has no `truth_pacs`/`canonical_tf` projection or seal. The sealed
   value coverage is component-level (improvement/land) + WSDOR; the rolled-up
   assessed/market/appraised value-per-year is not its own sealed lane.

5. **Parcel master / account master are covered** (tf_parcel + account→tf_owner) — not a gap.

6. **Appeals/ARB:** `arb_protest` and `arbitration` are empty in this PACS instance. Not a
   data gap to seal unless the operator confirms appeals live elsewhere.

---

## The two finish lines

- **Valuation-complete (ACHIEVED):** parcel, owner, improvement, land, sale, geometry,
  WSDOR assessed value. The assessor's valuation model is sealed.
- **County-data complete (NOT achieved):** would additionally require Tax/Levy/Billing,
  Exemptions, Tax-area/District assignments, and a sealed core assessment-value lane.

**Recommended next domains, by impact × data volume:**
1. Tax / Levy / Billing (42M+ rows) — treasurer/taxpayer workflows
2. Exemptions (206K rows) — directly affects taxable value
3. Tax area / district assignments (2.5M rows) — levy attribution
4. Core assessment-value lane (`property_val`, 2.5M) — promote landed → truth → canonical + seal
5. Appraisal totals / certified-roll history — reconciliation/audit

*Audit method: enumerated `sys.tables` in live `pacs_oltp` by domain keyword (excluding
backup/temp tables), cross-referenced against `truth_pacs.*`, `canonical_tf.*`,
`legacy_pacs_raw.*`, and `docs/sync/seals/benton-lane-status.md`. Row counts from live PACS.*
