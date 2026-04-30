# County Data Trust Launch Context Contract

Checked: 2026-04-30T23:07:01.893Z
Status: PASS
Decision: COUNTY_DATA_TRUST_LAUNCH_CONTEXT_CONTRACT_REGISTERED_AND_ECHOED

Contract: `county_data_trust_launch_context_v1`
Population: Atlas Live county context resolved from County Studio route scope and Washington launch/county trust posture
Read path: GET /launch-data/washington/counties/status.json plus county detail route

## Tier Rules

- Benton: production_provisional + sync_derived + converted_legacy_sensitive
- Washington reference default: reference_demo

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| contract-registered | PASS | `os-platform/core/pilot/terrafusion-suite-contracts.json` | County data-trust launch-context contract is registered. |
| contract-required | PASS | `terraforge_operational_health_v1`<br>`terraforge_statistics_compat_v1`<br>`terraforge_segment_derivation_v1`<br>`terraforge_correction_priority_v1`<br>`costforge_calibration_priority_v1`<br>`county_data_trust_launch_context_v1` | Contract is included in the required suite contract list. |
| trust-tier-source-present | PASS | `os-platform/core/pilot/county-data-trust-tiers.json` | Contract depends on explicit Benton operational/provisional and 39-county reference/demo posture. |
| atlas-api-runtime-echo | PASS | `frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts` | Atlas county context API emits contract id, trust tier, DB posture, and production-claim posture. |
| atlas-ui-exposes-posture | PASS | `frontend/apps/os-shell/src/pages/forge/atlas-live/AtlasLivePage.tsx` | Atlas Live county context card exposes trust posture and contract id. |
| adoption-audit-promoted | PASS | `os-platform/core/pilot/contract-adoption-audit.json` | Contract adoption audit treats Atlas county context as contract-backed. |

## Failures

- None.

