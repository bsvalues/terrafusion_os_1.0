# Legacy County Data Canon

**Status:** Draft v0.1  
**Purpose:** Define a practical county-data archetype for TerraFusion adapters, with special attention to legacy assessor systems, PACS-family systems, and the search/identity rules that must remain stable across connectors.

---

## 1. Why this document exists

County data systems are not all shaped the same way, but they do tend to fall into recognizable families. TerraFusion needs a stable canon that separates:

- **true cross-county invariants** from county-specific customizations,
- **legacy parcel identifiers** from normalized/internal keys,
- **operator-facing search semantics** from backend join logic,
- and **stable parcel identity** from **year-layer valuation state**.

This document is intended to guide:

- adapter design,
- search/filter API contracts,
- bridge-view design,
- migration planning,
- and future county onboarding.

---

## 2. County data families

### 2.1 Legacy desktop / ProVal / Ascend / Manatron-style family

This family is typically characterized by:

- desktop-era data handling,
- Access-fronted or Access-adjacent workflows,
- denormalized parcel master tables,
- repeated land/improvement slots,
- memo/image/sketch side tables,
- and multiple parcel identifiers used interchangeably by operators.

Operationally, these systems are optimized for appraiser workflow speed rather than strict relational clarity. They often feel like a blend of:

- search cache,
- reporting layer,
- data-entry shell,
- and workflow helper tables.

### 2.2 PACS-family normalized systems

This family has a cleaner relational backbone. The key pattern is:

- **`property`** = stable identity layer,
- **`property_val`** = year/supplement valuation layer,
- detail tables hang off the year/supplement layer,
- and “current year” is resolved through system tables rather than hardcoded assumptions.

For TerraFusion, this family should be treated as the modern normalized county archetype.

### 2.3 County overlay layer

Even when the core schema is recognizable, counties often add their own overlays:

- custom views,
- GIS helpers,
- levy/tax area helpers,
- exemption/reporting helpers,
- permit integrations,
- confidentiality/web suppression behavior,
- and county-specific denormalized bridge views.

**Rule:** TerraFusion should assume the **core archetype is portable**, but the **overlay layer is county-specific**.

---

## 3. PACS-family canon

### 3.1 Stable identity layer

The stable parcel identity lives on **`property`**.

This layer should be treated as the source of truth for:

- stable parcel identity,
- public/legacy parcel identifiers,
- and non-year-scoped property metadata.

### 3.2 Year/supplement valuation layer

The mutable annual valuation state lives on **`property_val`**.

This layer should be treated as the source of truth for:

- appraisal-year facts,
- value-year records,
- supplement-specific records,
- and many “current roll” fields that should not be assumed to live on `property`.

### 3.3 Detail-table pattern

Land, improvement, and profile/detail tables typically hang off the year-layer keys and must be joined with the correct year/supplement semantics.

### 3.4 Current-row semantics

A PACS-family query should not assume “latest” by intuition. It should resolve current-state through the schema’s actual rules, commonly including:

- current appraisal year from a system table,
- active-row filtering,
- and current/non-sale detail-row patterns.

---

## 4. Identifier canon

This is the most important practical section.

### 4.1 `prop_id`

- Internal durable property key.
- Best used for joins and internal identity.
- Not the best default operator-facing search key.

### 4.2 `geo_id`

- Legacy parcel-facing identifier.
- Must be treated as a **text field**.
- Must not be silently coerced to numeric.
- Must not be silently normalized into another identifier contract.

**Default TerraFusion contract:** `geo_id` is a first-class, text-first search key.

### 4.3 `simple_geo_id`

- Normalized parcel identifier.
- Separate from `geo_id`.
- Appropriate for normalized-search mode, not for hidden fallback.

### 4.4 Legacy desktop identifiers

Legacy counties may also expose identifiers like:

- `pin`,
- `gpin`,
- `lrsnum`,
- or county-specific parcel aliases.

These should be treated as **legacy aliases**, not assumed universal canonical keys.

---

## 5. TerraFusion search contract canon

TerraFusion should keep these search modes distinct.

### 5.1 `geo_id`

- Exact or legacy-text search against the true legacy parcel-facing identifier.
- Should map to the actual legacy parcel field.
- Should not silently fall through to normalized matching unless that behavior is explicitly requested and documented.

### 5.2 `simple_geo_id`

- Normalized identifier search.
- Separate filter path.
- Appropriate when punctuation/spacing normalization is the user’s explicit intent.

### 5.3 `prop_id`

- Exact internal key lookup.
- Best for service-to-service or deep-link scenarios.

### 5.4 `query`

- Generic free text across owner, situs, legal, and other human-facing text surfaces.
- Must not replace or blur the semantics of dedicated identifier filters.

**Hard rule:** TerraFusion must never hide identifier semantics behind a generic “smart search” layer that changes which field is actually being queried.

---

## 6. Query/join invariants for PACS-family counties

The following invariants are strong enough to guide adapters:

1. Start from the correct identity layer.
2. Join to the year/supplement layer for current valuation facts.
3. Resolve “current” through system tables and active-row rules.
4. Apply filters before count/paging logic.
5. Keep identifier search and free-text search separate.
6. Do not assume county helper views exist unless verified.

---

## 7. Legacy desktop archetype canon

Legacy desktop counties often present a flatter, operator-optimized model.

Common traits include:

- one master parcel row used for daily work,
- flattened land/improvement/value columns,
- memo sidecars,
- image/sketch sidecars,
- GIS-linked search helpers,
- and multiple parcel IDs in active operator use.

These systems are not “wrong.” They are optimized for a different era and workflow. TerraFusion should treat them as a legitimate source family and map them into canonical shapes rather than forcing the legacy source to behave like PACS.

---

## 8. TerraFusion adapter strategy

Adapters should project county data into four stable layers.

### 8.1 Canonical parcel identity

Recommended canonical fields:

- `county_id`
- `source_system`
- `source_prop_id`
- `parcel_id_public`
- `parcel_id_normalized`
- `parcel_id_legacy_aliases[]`

### 8.2 Current valuation slice

Recommended canonical fields:

- `tax_year`
- `sup_num`
- `active_flag`
- `property_type`
- `use_code`
- `land_value`
- `improvement_value`
- `appraised_value`
- `assessed_value`

### 8.3 Ownership / situs layer

Recommended canonical fields:

- `owner_display_name`
- `mailing_address`
- `situs_address`
- `confidentiality_flag`
- `web_suppression_flag`

### 8.4 Detail sidecars

Recommended canonical groups:

- land segments,
- improvement details,
- permits,
- sales/change-of-owner,
- images,
- sketches,
- memos,
- supporting documents.

---

## 9. County-specific variation points

These should be treated as expected, not exceptional:

- helper views,
- GIS bridges,
- state-specific reporting tables,
- levy/tax area helpers,
- exemption overlays,
- confidentiality rules,
- and custom search shortcuts.

**Implementation rule:** every new county connector should document its local overlay layer explicitly instead of hiding those assumptions inside controller code.

---

## 10. Onboarding checklist for a new county

Before TerraFusion treats a new county connector as “understood,” verify:

1. Stable parcel identity table(s)
2. Year/supplement valuation layer
3. Public parcel-facing identifier(s)
4. Normalized identifier(s)
5. Current-year resolution rule
6. Active/inactive row rule
7. Detail-table join rule
8. Confidentiality/web suppression rule
9. GIS bridge surfaces
10. County-specific views/helpers
11. Permit/sales/document sidecars
12. Search semantics for each identifier field

---

## 11. Design rules for backend APIs

### 11.1 Keep identifier filters explicit

Do not collapse these into one field:

- `geo_id`
- `simple_geo_id`
- `prop_id`
- generic `query`

### 11.2 Count and item queries must share the same filtered base

If an API supports pagination and `totalCount`, the count query must be derived from the same filtered query as the result set.

### 11.3 Avoid “smart normalization” as hidden behavior

If normalized fallback exists, it should be:

- explicit,
- documented,
- and ideally surfaced as a separate filter path.

### 11.4 Preserve county truth

Do not normalize away county-specific meaning just to make the code look cleaner.

---

## 12. Strategic conclusion

TerraFusion should operate with a **county data archetype framework** rather than a one-size-fits-all assumption.

That framework should recognize:

- a **Legacy Desktop Archetype**,
- a **PACS Core Archetype**,
- and a **County Overlay Archetype**.

This allows TerraFusion to:

- onboard counties faster,
- design safer adapters,
- preserve real search semantics,
- reduce controller-level guessing,
- and avoid flattening all county systems into one misleading model.

---

## 13. Immediate implementation guidance

1. Treat `geo_id` and `simple_geo_id` as separate API filters.
2. Keep `prop_id` as the internal durable join key.
3. Keep generic `query` separate from identifier lookup.
4. Document county overlay assumptions in connector docs.
5. Prefer bridge views and adapter mappings over controller-specific hacks.

---

## 14. Future expansion

This document should later gain county-specific appendices for:

- Benton,
- Island,
- Yakima,
- Franklin,
- Spokane,
- and any legacy ProVal/Ascend-family county onboarded into TerraFusion.

Each appendix should record:

- actual source tables/views,
- identifier semantics,
- current-year rules,
- confidentiality rules,
- and local deviations from the canon.

---

## Sources used to draft this canon

- PACS database guide
- Schema 2023
- PACS Queries 2018
- direct inspection of uploaded legacy ProVal/Ascend Access artifacts
