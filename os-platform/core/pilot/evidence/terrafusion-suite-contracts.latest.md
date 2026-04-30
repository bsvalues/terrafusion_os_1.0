# TerraFusion Suite Contracts

Checked: 2026-04-30T21:10:30.349Z
Status: PASS_WITH_MIGRATION_GAPS
Decision: SUITE_CONTRACTS_REGISTERED_RUNTIME_IDS_STILL_MIGRATING

## Doctrine

- Operational record: TerraFusion DB
- Legacy role: Legacy Benton/PACS data is upstream input, not operational truth.
- Sync role: TerraFusion Sync is a bridge/projection layer, not source truth.
- Demo role: Washington 39-county data remains demo/reference unless county-specific official source, lineage, sync, and recomputation proof promote it.
- Solo-dev rule: Every important metric gets one blessed definition, one blessed read path, one proof artifact, and one visible trust posture.

## Contract Registry

| Contract | Status | Population | Read path | Trust posture |
| --- | --- | --- | --- | --- |
| terraforge_operational_health_v1 | registered_implicit_source | active County Studio segment-set parcel rollup | GET /county-study/studies/{studyId}/health-summary | county-data-trust-tier required<br>Benton production_provisional until row-level qualification lineage closes<br>39-county reference_demo cannot prove operational health |
| terraforge_statistics_compat_v1 | codified | qualified sale ratio rows using the shared Statistics/TerraForge ratio-study population contract | GET /county-study/studies/{studyId}/statistics-compat | statistics parity proven only for the exact shared population<br>Benton qualification fields remain converted_legacy_sensitive until sync lineage closes<br>Operational Health remains a different population |
| terraforge_segment_derivation_v1 | registered_implicit_source | canonical parcels grouped by neighborhood, reval area, building type, and quality grade for an active county study | POST /county-study/studies/{studyId}/derive-segments | direct-source recomputation required for production confidence<br>Benton sync-derived and converted-legacy-sensitive fields must stay visible<br>39-county reference_demo cannot certify segment derivation |
| terraforge_correction_priority_v1 | registered_implicit_source | County Studio active segment alerts ranked for correction and defense workflow | GET /county-study/studies/{studyId}/health-summary plus GET /county-study/studies/{studyId}/evidence-packet | uses operational health population, not Statistics Compat population<br>defense packet must carry segment-level trace<br>exceptions remain workflow state, not metric truth |

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| registry-has-required-contracts | PASS | `terraforge_operational_health_v1`<br>`terraforge_statistics_compat_v1`<br>`terraforge_segment_derivation_v1`<br>`terraforge_correction_priority_v1` | The first four suite population contracts are registered. |
| registry-contract-ids-are-unique | PASS | `terraforge_operational_health_v1`<br>`terraforge_statistics_compat_v1`<br>`terraforge_segment_derivation_v1`<br>`terraforge_correction_priority_v1` | Contract IDs must not fork. |
| county-trust-tier-model-present | PASS | `os-platform/core/pilot/county-data-trust-tiers.json` | Contract proof depends on explicit Benton operational/provisional and 39-county demo/reference posture. |
| all-contracts-have-required-fields | PASS | `terraforge_operational_health_v1`<br>`terraforge_statistics_compat_v1`<br>`terraforge_segment_derivation_v1`<br>`terraforge_correction_priority_v1` | Every contract must declare owner, population, read path, metrics, trust posture, proofs, and forbidden uses. |
| implementation-anchors-resolve | PASS | `backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:54`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:77`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:32`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:141`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:375`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:15`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:388`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:30`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:30`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:148`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:268`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:282`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts:279`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts:242`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts:305`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts:306`<br>`backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs:31`<br>`backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs:45`<br>`backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs:47`<br>`backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs:113`<br>`backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs:31`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:163`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:164`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:175`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:346`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:113`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:123`<br>`backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs:142`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:455`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:492`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:473`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CorrectionDefensePanel.tsx:215`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CorrectionDefensePanel.tsx:299`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CorrectionDefensePanel.tsx:302` | Registered contracts must point at real implementation anchors instead of prose-only intent. |
| proof-artifacts-are-attached | PASS | `os-platform/core/pilot/evidence/dev-data-truth-gate.latest.json`<br>`os-platform/core/pilot/evidence/direct-source-recompute.latest.json`<br>`os-platform/core/pilot/evidence/statistics-shared-population-contract.latest.json`<br>`os-platform/core/pilot/evidence/dev-data-truth-gate.latest.json`<br>`os-platform/core/pilot/evidence/direct-source-recompute.latest.json`<br>`os-platform/core/pilot/evidence/dev-data-truth-gate.latest.json`<br>`os-platform/core/pilot/evidence/county-studio-correction-and-defense.latest.json`<br>`os-platform/core/pilot/evidence/dev-data-truth-gate.latest.json` | Every contract must cite at least one proof artifact already in the repo. |
| agent-enforcement-is-explicit | PASS | `os-platform/core/pilot/terrafusion-suite-contracts.json` | The AI agent is required to report contract id, population, trust posture, and reject undocumented metric logic. |

## Migration Gaps

- `terraforge_operational_health_v1`: Echo contractId from runtime DTO/API and make consumers use the registry id directly.
- `terraforge_segment_derivation_v1`: Echo contractId from runtime DTO/API and make consumers use the registry id directly.
- `terraforge_correction_priority_v1`: Echo contractId from runtime DTO/API and make consumers use the registry id directly.

## Next Closure

- Add runtime contractId echo fields for registered_implicit_source contracts.
- Move remaining TerraForge ratio-study helper endpoints onto the statistics compat contract instead of copy/paste population filters.
- Make future AI summaries cite the contract id, population, trust tier, and proof artifact before making metric claims.

