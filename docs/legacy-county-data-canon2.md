# Legacy County Data Canon

**Status:** Draft v0.2 — repo-ready working canon  
**Owners:** TerraFusion OS data architecture, county connector authors, PACS integration owners  
**Last Updated:** 2026-03-21

---

## Purpose

Define the canonical data-model posture TerraFusion should use when integrating county assessor systems, especially:

- legacy desktop / ProVal / Ascend / Manatron-style systems,
- PACS-family normalized systems,
- county-specific overlay layers,
- and the identifier/search contracts that must remain stable across connectors.

This document exists to reduce connector guesswork, prevent search-semantics drift, and keep county-specific behavior out of ad hoc controller logic.

## Scope

This canon governs:

- county data family classification,
- stable identity versus year-layer modeling,
- identifier semantics,
- search/filter API contracts,
- adapter projection rules,
- county onboarding expectations,
- and documentation requirements for county-specific overlays.

## Non-goals

This document does **not**:

- replace county-specific source-of-truth documentation,
- claim every county has the same schema,
- define every field in every source system,
- force legacy systems to mimic PACS internally,
- or authorize hidden “smart search” behavior that changes field semantics.

---

## Canonical county data families

### 1. Legacy Desktop Archetype

Typical characteristics:

- desktop-era workflows,
- Access-fronted or Access-adjacent tooling,
- denormalized parcel master rows,
- repeated land/improvement slots,
- memo/image/sketch sidecars,
- multiple parcel identifiers used operationally,
- GIS-linked lookup helpers and reporting caches.

TerraFusion should treat this as a legitimate source family, not as a broken version of PACS.

### 2. PACS Core Archetype

Typical characteristics:

- `property` as the stable identity layer,
- `property_val` as the year/supplement valuation layer,
- detail tables hanging off year/supplement semantics,
- current-state resolution through schema rules rather than intuition,
- clear distinction between parcel-facing identifiers and normalized/internal keys.

TerraFusion should treat this as the primary normalized county archetype.

### 3. County Overlay Archetype

Typical characteristics:

- custom views,
- GIS helpers,
- exemption or state-reporting helpers,
- levy/tax-area overlays,
- permit integrations,
- confidentiality or web-suppression rules,
- county-specific denormalized bridge views.

**Rule:** core archetypes may be portable; overlay layers are county-specific until proven otherwise.

---

## PACS-family working canon

### Stable identity layer

Treat `property` as the stable identity surface for:

- durable parcel identity,
- parcel-facing identifier fields,
- and non-year-scoped property metadata.

### Year/supplement layer

Treat `property_val` as the year/supplement valuation surface for:

- appraisal-year facts,
- supplement-specific records,
- current roll state,
- and value-year dependent search/display fields.

### Detail-table posture

Land, improvement, profile, and detail tables should be joined with explicit year/supplement semantics. Do not assume a detail row is “current” unless the county’s rules prove it.

### Current-row posture

Resolve “current” through the schema’s actual rules, commonly including:

- current appraisal year from a system table,
- active-row filtering,
- and current/non-sale detail-row rules.

---

## Identifier canon

### `prop_id`

- internal durable property key,
- best for joins and internal identity,
- not the default operator-facing search contract.

### `geo_id`

- legacy parcel-facing identifier,
- text field,
- must not be silently coerced to numeric,
- must not be silently normalized into another identifier contract.

**Default TerraFusion rule:** `geo_id` is a first-class text-first search key.

### `simple_geo_id`

- normalized parcel identifier,
- separate from `geo_id`,
- valid for normalized-search mode only.

### Legacy desktop identifiers

Examples may include:

- `pin`,
- `gpin`,
- `lrsnum`,
- or county-specific parcel aliases.

Treat these as source-specific aliases unless the county appendix says otherwise.

---

## Decision rules

1. **Do not collapse stable identity and year-layer state.**
   If the source system separates parcel identity from valuation year/supplement, TerraFusion must preserve that distinction.

2. **Do not blur identifier semantics.**
   `geo_id`, `simple_geo_id`, `prop_id`, and generic `query` must remain separate filter concepts.

3. **Do not hide normalization.**
   If normalized fallback exists, it must be explicit, documented, and ideally exposed as its own filter path.

4. **Counts and rows must share the same filtered base.**
   Any paged API returning `totalCount` must derive both items and count from the same filtered query.

5. **Current-row logic must be proven, not guessed.**
   Use system tables, active-row rules, and county appendix documentation instead of assumptions like “latest row wins.”

6. **County overlays must be documented, not implied.**
   Custom views, GIS bridges, confidentiality rules, and state-specific helpers belong in county docs, not hidden controller logic.

7. **Prefer bridge views and adapter mappings over controller hacks.**
   If source complexity needs translation, solve it in adapter/bridge design first.

8. **Preserve county truth.**
   Do not flatten away county-specific meaning just to make the code look cleaner.

---

## TerraFusion search contract canon

### `geo_id`

- exact or legacy-text search against the county’s true parcel-facing identifier,
- should map to the real legacy/public parcel field,
- should not silently fall through to normalized matching.

### `simple_geo_id`

- normalized identifier search,
- separate filter path,
- appropriate only when normalized search is the user’s actual intent.

### `prop_id`

- exact internal key lookup,
- appropriate for service-to-service lookups, deep links, and internal joins.

### `query`

- generic free text across owner, situs, legal, and similar human-facing text surfaces,
- must not replace dedicated identifier filters.

**Hard rule:** TerraFusion must never use a generic “smart search” layer to hide which identifier field is actually being queried.

---

## Adapter projection canon

Adapters should project source systems into four stable layers.

### 1. Canonical parcel identity

Recommended fields:

- `county_id`
- `source_system`
- `source_prop_id`
- `parcel_id_public`
- `parcel_id_normalized`
- `parcel_id_legacy_aliases[]`

### 2. Current valuation slice

Recommended fields:

- `tax_year`
- `sup_num`
- `active_flag`
- `property_type`
- `use_code`
- `land_value`
- `improvement_value`
- `appraised_value`
- `assessed_value`

### 3. Ownership / situs layer

Recommended fields:

- `owner_display_name`
- `mailing_address`
- `situs_address`
- `confidentiality_flag`
- `web_suppression_flag`

### 4. Detail sidecars

Recommended groups:

- land segments,
- improvement details,
- permits,
- sales/change-of-owner,
- images,
- sketches,
- memos,
- supporting documents.

---

## County onboarding checklist

Before TerraFusion treats a county connector as understood, verify:

1. stable parcel identity table(s),
2. year/supplement valuation layer,
3. public parcel-facing identifier(s),
4. normalized identifier(s),
5. current-year resolution rule,
6. active/inactive row rule,
7. detail-table join rule,
8. confidentiality/web-suppression rule,
9. GIS bridge surfaces,
10. county-specific views/helpers,
11. permit/sales/document sidecars,
12. exact search semantics for each identifier field.

---

## County Appendix Template

Use one appendix per county connector.

### County Summary

- **County:**
- **State:**
- **Source system family:** Legacy Desktop / PACS / Hybrid / Other
- **Primary source system(s):**
- **Adapter owner:**
- **Last verified date:**

### Source Surfaces

- **Stable identity table/view:**
- **Year/supplement table/view:**
- **Bridge/helper views:**
- **GIS bridge surfaces:**
- **Document/image/sketch sidecars:**

### Identifier Semantics

- **Public parcel identifier:**
- **Normalized parcel identifier:**
- **Internal durable key:**
- **Legacy aliases:**
- **Exact `geo_id` semantics:**
- **Normalized-search semantics:**

### Current-Row Rules

- **Current year resolution:**
- **Active-row rule:**
- **Current detail-row rule:**
- **Known supplement rules:**

### Search Contract

- **`geo_id` behavior:**
- **`simple_geo_id` behavior:**
- **`prop_id` behavior:**
- **generic `query` behavior:**
- **known exclusions/edge cases:**

### County Overlay Notes

- **Confidentiality/web suppression:**
- **Levy/tax area customizations:**
- **Exemption/reporting customizations:**
- **Permit/workflow customizations:**
- **Known deviations from canon:**

### Verification

- **Live contract proof location:**
- **Smoke test location:**
- **Known gaps / open follow-ups:**

---

## Immediate implementation guidance

1. keep `geo_id` and `simple_geo_id` as separate API filters,
2. keep `prop_id` as the internal durable join key,
3. keep generic `query` separate from identifier lookup,
4. document county overlay assumptions in connector docs,
5. prefer bridge views and adapter mappings over controller-specific hacks.

## Change control

Any county connector that diverges from this canon must record the divergence in its county appendix or connector design note. Silent divergence is not allowed.

## Sources used to draft this canon

- PACS database guide
- Schema 2023
- PACS Queries 2018
- direct inspection of uploaded legacy ProVal/Ascend Access artifacts
