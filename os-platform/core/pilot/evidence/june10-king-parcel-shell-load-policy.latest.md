# King Parcel Shell Load Policy

Generated: 2026-05-26T16:22:00.587Z

## Verdict

- Trust label: KING_PUBLIC_PARCEL_SHELL
- Parcel shell rows allowed in canonical runtime: yes
- Shell rows workflow complete: no
- Production binding allowed: no
- Certification allowed: no
- Database mutation attempted: no

## Loadability Matrix

| Metric | Count |
| --- | ---: |
| Source-only PINs | 1161 |
| Present in richer source artifact | 1161 |
| Loadable as runtime parcel shell | 1161 |
| Shell-load candidates | 1137 |
| Placeholder review queue | 24 |
| Workflow-complete rows | 0 |
| Certification rows | 0 |

## Allowed Actions

- parcel_identity_context_representation
- county_scoped_parcel_lookup
- source_lineage_review
- future_enrichment_queueing

## Blocked Actions

- owner_address_value_dependent_workflows
- valuation_or_cost_claims
- appeal_defense_packet_generation
- taxpayer_notice_or_official_explanation
- sales_ratio_or_assessment_analytics
- workflow_certification_or_county_readiness_claim

## Receipt Language

- King source-only rows loaded under this policy are KING_PUBLIC_PARCEL_SHELL rows.
- KING_PUBLIC_PARCEL_SHELL means source-backed parcel identity/context only, not certified workflow-complete parcel data.
- Owner, situs address, assessed value, valuation, sales, appeal, and official workflow claims remain blocked until a future enrichment receipt proves those fields.
- 1137 normal source-only PINs may be treated as shell-load candidates if a future authorized load transaction preserves this policy.
- 24 placeholder/tract-style PINs remain in review queue unless explicitly approved by a separate load policy.
- Source artifact SHA256: 9f72b9fa3bd633d8f383214f97011d4438cd48376c113f25c085a7b0473e6c6f

## Blockers

- King parcel shell rows lack owner/address/value fields; workflow-complete certification is blocked.
- 24 King source-only PINs are placeholder/tract-style rows and remain in review queue.
