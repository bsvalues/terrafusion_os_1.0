# Cowlitz Parcel Identifier Semantics Root Cause

Generated: 2026-05-26T05:38:49.719Z

## Verdict

- Recommended root cause: county_prefix_transform_without_documented_crosswalk
- Confidence: high
- Summary: Canonical Cowlitz ParcelNumber appears to be source PARCNO with a 015- county prefix added, but no current evidence documents that transform as the canonical identity contract.
- Database writes attempted: no
- Production binding allowed: no
- Certification allowed: no
- Identity contract status: unapproved_transform_detected

## Samples

Source PARCNO examples:

- 403670200
- 725403
- WK3504006
- 62857
- 752407
- 507060143
- WJ0510001
- 08285
- 241280101
- 05360920
- 307800110
- 741069

Canonical ParcelNumber examples:

- 015-00001
- 015-00002
- 015-00003
- 015-00004
- 015-00005
- 015-00006
- 015-00007
- 015-00009
- 015-00010
- 015-00011
- 015-00012
- 015-00013

Prefix transform examples:

- 403670200 -> 015-403670200
- 725403 -> 015-725403
- WK3504006 -> 015-WK3504006
- 62857 -> 015-62857
- 752407 -> 015-752407
- 507060143 -> 015-507060143
- WJ0510001 -> 015-WJ0510001
- 08285 -> 015-08285
- 241280101 -> 015-241280101
- 05360920 -> 015-05360920
- 307800110 -> 015-307800110
- 741069 -> 015-741069

## Field Comparison

| Field | Role |
| --- | --- |
| PARCNO | public ArcGIS parcel identifier field |
| ParcelNumber | TerraFusion canonical parcel identity |

ParcelNumber is the source-native county parcel identifier after lossless whitespace/case cleanup only; it must not silently add county/FIPS/vendor prefixes.

## Metrics

| Metric | Value |
| --- | ---: |
| Source rows | 57705 |
| Source distinct non-null | 57558 |
| Source duplicate groups | 25 |
| Source null/blank rows | 0 |
| Canonical rows | 57362 |
| Canonical distinct non-null | 57362 |
| Canonical duplicate groups | 0 |
| Canonical null/blank rows | 0 |
| Exact overlap | 0 |
| Compact-format overlap | 1 |
| 015-prefix-removed overlap | 57237 |
| Canonical 015-00000 pattern count | 16601 |

## Canonical Identity Contract

- Status: unapproved_transform_detected
- Certification allowed by contract: no
- Transform receipt valid: no

## Hypotheses

| Hypothesis | Classification | Confidence | Evidence |
| --- | --- | --- | --- |
| county_prefix_transform_without_documented_crosswalk | likely_root_cause | high | Removing the canonical 015- county prefix creates 57237 source/canonical matches. Exact source PARCNO to canonical ParcelNumber overlap remains 0. |
| synthetic_generated_canonical_ids | not_proven | low | 16601 of 57362 canonical parcel numbers match the county-sequential pattern 015-\d{5}. Source PARCNO and canonical ParcelNumber common distinct count is 0. |
| transformed_padded_normalized_id_format | possible_root_cause | medium | Compact normalized source/canonical overlap is 1. Hyphen stripping, case normalization, and leading-zero trimming do not create overlap when this is zero. |
| wrong_source_field_used_in_original_seed | possible_root_cause | medium | Current captured source layer identifies PARCNO as the parcel identifier field. Canonical ParcelNumber does not match PARCNO; the original seed may have used a generated ordinal or a different field. |
| different_county_identifier_field_or_crosswalk | unproven | low | No crosswalk artifact is present in current evidence. Certification requires either canonical ParcelNumber preserving PARCNO or a documented crosswalk. |
| wrong_county_mapping | unlikely_root_cause | low | Canonical Cowlitz row count is near the public source count, which argues against a completely wrong county mapping. The identifier shape still indicates a seed/projection identity issue. |
| stale_canonical_seed | possible_contributor | low | Staleness can explain row-count deltas but does not explain zero identifier overlap by itself. Even stale rows should preserve PARCNO if the canonical identity semantics were correct. |
| source_duplicate_or_null | not_root_cause | high | Source duplicate groups: 25; source null/blank rows: 0. Duplicate/null source conditions are too small and cannot explain zero identity overlap. |

## Recommended Correction Path

- Do not certify Cowlitz.
- Trace the WA_INITIAL_SEED importer or projection that produced the 015- prefixed canonical IDs.
- Decide whether canonical ParcelNumber must equal source PARCNO or whether the 015- prefix is an approved TerraFusion canonical county-scope identity format.
- If source preservation is required, correct the importer/projection to preserve PARCNO as canonical ParcelNumber.
- If a different identifier field was intentionally used, produce a crosswalk proving deterministic mapping from canonical ParcelNumber to source PARCNO.
- If the 015- prefix remains, emit a documented transform receipt and update certification gates to compare the approved transform explicitly.
- Re-run the Cowlitz dry-run with receipt generation.
- Re-run Cowlitz row-count adjudication and require non-zero identity overlap before certification.
- Only then consider projection/import authorization; keep production binding blocked until receipts and identity semantics are reconciled.

## Blockers

- Canonical Cowlitz ParcelNumber does not preserve source PARCNO in current evidence.
- Canonical Cowlitz ParcelNumber appears to apply an undocumented 015- prefix transform to source PARCNO.
- ParcelNumber contract is source-native; canonical values apply a county prefix transform.
- Store county-scoped TerraFusion identity separately from ParcelNumber or provide an approved contract change.
- No approved identity transform receipt or crosswalk exists in current evidence.
- Cowlitz remains blocked from certification until parcel identity semantics are corrected or proven.
