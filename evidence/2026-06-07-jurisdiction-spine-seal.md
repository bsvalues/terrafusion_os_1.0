# Jurisdiction Spine / Tax Area-District Assignment — SEAL (2026-06-07)

## Outcome
**Jurisdiction Spine / Tax Area-District Assignment sealed for current-year 2025.** This proves
every active parcel can resolve to its tax code area and jurisdiction districts. Revenue concepts
(levy, fund, rate, bill, payment, distribution) remain out of scope.

```
tf_tax_area (TCA dict)        = 109
tf_tax_district (jurisdiction dict) = 37
tf_tax_area_district (TCA→district map, 2025) = 487 distinct pairs
tf_parcel_tax_area            = 83,326 / 83,326 distinct (parcel,year) = 1.0000x
```

## Scope (approved)
- Current-year only: **2025**. Source parcel link: `property_tax_area`.
- Active rule: **MAX(sup_num) per (prop_id, year)** — not sup=0.
- Dictionaries: `tax_area` → `tf_tax_area`; `tax_district` → `tf_tax_district`.
- Expansion: `tax_area_fund_assoc`, **only `tax_area_id → tax_district_id`**.
- Deferred (Revenue Spine): `levy_cd`, `fund_id`, rates, billing, payments, distribution, history.

## Clean spine boundary
```
Jurisdiction Spine:  parcel → tax area → tax district     (THIS SEAL)
Revenue Spine:       district → levy / fund / rate / bill / payment   (deferred)
```

## Required gates (co-founder) — results
```
 1 source active denominator   : property_tax_area 2025 active-supp = 95,455 (landed)  ✓
 2 truth/canonical count       : tf_parcel_tax_area = 83,326 @ 1.0000x spine-resolved
                                  (12,129 delta = parcels outside the real-property spine — explained)  ✓
 3 supplement preservation     : 1,041 non-zero active-supplement assignments preserved (landing)  ✓
 4 TCA dictionary              : tf_tax_area populated (109); parcel tax_area_id unbacked = 0  ✓
 5 district dictionary         : tf_tax_district populated (37); expanded district id unbacked = 0  ✓
 6 TCA → district expansion    : tf_tax_area_district = 487 distinct 2025 (tax_area_id, tax_district_id)  ✓
 7 revenue boundary            : levy_cd / fund_id excluded from all canonical entities; no rates/bills/payments  ✓
 8 conversion artifacts        : tax_area Converted note + is_inactive_after_year retained as dict metadata,
                                  not used to suppress current active assignments  ✓
 9 parcel resolution           : every tf_parcel_tax_area resolves through the parcel spine xref; 0 empty CountyId  ✓
10 quarantine                  : 0 quarantine delta  ✓
```

## End-to-end proof (parcel → its districts)
```
parcel 10007 → TCA 34 → CTYGEN, PRTB, CTYROD, STATE, SCH116, HOSP, WBRFA, LIB
parcel 10009 → TCA 20 → STATE, SCH400, CTYROD, HOSP, LIB, CTYGEN, PRTB
```
(county general, port, county road, state school, local school district, hospital, fire, library.)

## What was built
`legacy_pacs_raw.property_tax_area` (landing, COPY) + `SqlServerPacsJurisdictionSource`
(active-supp parcel→TCA; tax_area / tax_district dicts; tax_area_fund_assoc TCA→district,
levy/fund excluded) + `PacsJurisdictionService` (dict upserts + TCA→district map +
parcel→TCA projection with parcel-resolve + dict-backing gates) + 4 canonical entities
(`tf_tax_area`, `tf_tax_district`, `tf_parcel_tax_area`, `tf_tax_area_district`) +
`DrainJurisdiction` + `jurisdiction` lane + DI + EF migration
`20260607232337_AddJurisdictionSpineLane`.

## Sealed-lane integrity (unchanged)
```
improvement 99,694 · land 87,767 · sale 29,608 · geometry 80,075 · owner 816,849
assessment 95,455 · exemption 6,487
```

## Classification
**SEALED — Jurisdiction Spine current-year (2025), 1.0000x.** Every active parcel resolves to its
tax code area and jurisdiction districts. Revenue concepts remain a separate future mission.

---

*Evidence collected 2026-06-07 against live Harris PACS. Migration `20260607232337_AddJurisdictionSpineLane`.*
