# Wave A 5-Adapter Quality Review

Generated: 2026-05-22T19:37:15.202Z

## Summary

- Reviewed adapters: 5
- Verified adapters: 5
- Runtime claim allowed: false
- DB mutation allowed: false
- Staging contract consistent: true
- Lineage receipt consistent: true
- High-confidence parcel identity: 5
- Conditional load-path candidates: 2
- Identity-ready only: 3
- Passed: true

## County Review

| County | Parcel ID | Confidence | Missing fields | Terms/access risk | Geometry limitations | Classification |
|---|---|---:|---|---|---:|---|
Clark | Prop_id | high | assessedValue | low_public_metadata_risk | 0 | identity_ready_only
Cowlitz | PARCNO | high | none | terms_or_access_review_required | 0 | conditional_load_path_candidate
King | PIN | high | ownerName, situsAddress, assessedValue | low_public_metadata_risk | 2 | identity_ready_only
Spokane | PID_NUM | high | assessedValue | low_public_metadata_risk | 0 | identity_ready_only
Yakima | parcel_number | high | none | terms_or_access_review_required | 0 | conditional_load_path_candidate

## Limitations

### Clark

- Parcel semantics: Clark MapsOnline PropertyFinder Taxlots layer exposes Prop_id as the Property ID display field in public ArcGIS REST metadata.
- Missing fields: assessedValue
- Terms/access: low_public_metadata_risk
- Geometry: No geometry limitation captured in verification receipt.
- Classification: identity_ready_only

### Cowlitz

- Parcel semantics: PARCNO is the public ArcGIS parcel layer search field and exists in the parcel layer metadata.
- Missing fields: none
- Terms/access: License text warns against en masse owner/tax parcel dissemination without data share agreement.
- Geometry: No geometry limitation captured in verification receipt.
- Classification: conditional_load_path_candidate

### King

- Parcel semantics: King County parcel_area metadata states parcel numbers may include leading zeros in PIN, Major, or Minor and exposes PIN plus MAJOR/MINOR fields.
- Missing fields: ownerName, situsAddress, assessedValue
- Terms/access: low_public_metadata_risk
- Geometry: King parcel_area metadata notes placeholder/stacked polygon geometry; parcel counts require later semantic filtering. King parcel_area metadata says boundaries are general location only and not for survey purposes.
- Classification: identity_ready_only

### Spokane

- Parcel semantics: Spokane SCOUT Queries Parcels layer exposes PID_NUM with alias Parcel Number in public ArcGIS REST schema metadata.
- Missing fields: assessedValue
- Terms/access: low_public_metadata_risk
- Geometry: No geometry limitation captured in verification receipt.
- Classification: identity_ready_only

### Yakima

- Parcel semantics: Spatialest search config exposes Parcel # search and public result/schema fields expose parcel_number on the Yakima parcel layer.
- Missing fields: none
- Terms/access: Public config exposes Excel export permission, but this adapter does not download exports until terms are reviewed.
- Geometry: No geometry limitation captured in verification receipt.
- Classification: conditional_load_path_candidate

## Rules

- No new county expansion in this slice.
- No production DB mutation.
- No runtime claim.
- Verified means read-only metadata/schema adapter verification only.
- Load-path classification does not authorize data capture or product runtime registration.

## Blockers

- none
