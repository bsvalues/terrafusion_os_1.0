# County Studio Data Truth Matrix

Checked: 2026-04-30T17:32:03.818Z

Status: FAIL

API base: `http://localhost:5173/api`
County: `19190019-1919-1919-1919-191919191919`
Study: `52eb120f-99d3-4790-a69c-49b6de80cd5e`

| Surface | Metric/Behavior | Source of truth | Verified? | Notes |
| --- | --- | --- | --- | --- |
| County Studio | Derivation source path | CountyStudySegmentDerivationService canonical tables | partial | Code path reads Properties, CamaCharacteristics, and ComparableSales. Independent row recomputation still required. |
| County Studio | Direct source-data recomputation | Independent source ledger or DB recompute artifact | yes | Direct source recomputation proof accepted. |
| TerraFusion Sync | 2017 conversion / qualified-sale risk posture | SyncController qualification-status/backfill-ratios + direct source proof dependency | partial | Direct proof exists, but qualification conversion coverage still needs explicit row-level classification. |
| Database posture | Benton operational DB vs legacy sync bridge | backend/src/TerraFusion.API/appsettings.Development.json | partial | Development API points at postgres DefaultConnection and keeps BentonCountyLegacy as a sync bridge. This proves configuration posture, not source truth. |
| Database posture | Washington 39-county data posture | washington-39-county-coverage proof | partial | 39-county proof is registry/acquisition-path inventory only; it does not prove official statewide ingestion, normalization, geometry, or runtime county data. |
| County Studio | County trust tier and UI label posture | county-data-trust-tiers.json | partial | Production Provisional; parity claims allowed=false. UI must surface badges: Production Provisional, Sync-Derived, Converted Legacy Sensitive. |
| Statistics Studio parity | County-sovereign statistics superset claim | dev-data-truth-gate direct proof + Benton leakage scan | no | Claim remains provisional: Benton-certified reference lanes are still present; possible Benton fallback/fixture references require review. |
| County Studio | Study metadata | GET /county-study/studies + selected study | yes | Selected 52eb120f-99d3-4790-a69c-49b6de80cd5e; taxYear=2026; countyId=19190019-1919-1919-1919-191919191919; countyName=Benton County. |
| County Studio | Study counts | segment sets, active segments, cohorts, scenarios endpoints | yes | segmentSets=3; segments=1393; ratioBearingSegments=525; cohorts=1; scenarios=2. |
| County Studio | Health summary backed by active segment set | GET /county-study/studies/{studyId}/health-summary | yes | median=0.9268; cod=41.28; prd=1.3993; ratioCount=5559; derivedAt=2026-04-28T05:59:41.419096Z. |
| County Studio | Segment derivation sample | GET /county-study/segment-sets/{id}/segments + /segments/{id}/detail | partial | Sampled 10; detail responses 10. API confirms shape, not independent source recomputation. |
| Cross-surface | County median/COD/PRD consistency and mismatch class | County health summary vs TerraForge ratio-study endpoint | no | scope mismatch: health median/COD/PRD=0.9268/41.28/1.3993; ratio-study=0.7224/40.24/2.1352. Population mismatch: County Studio health uses ratioCount=5559, while TerraForge ratio-study uses countWithRatio=36. This blocks parity until both surfaces compare the same cohort/window/qualification pool. |
| Statistics Studio parity | Population scope alignment proof | statistics-parity-scope-alignment.latest.json | partial | BLOCKED_SCOPE_MISMATCH; rootCause=scope_mismatch_different_population_definitions; countDifference={"countyStudioHealthRatioCount":5559,"terraForgeCountWithRatio":36,"delta":5523}. |
| Statistics Studio parity | Shared population contract | statistics-shared-population-contract.latest.json | partial | IMPLEMENTATION_GAP_SHARED_PARITY_MODE_MISSING; decision=PATH_A_REQUIRED_SHARED_PARITY_CONTRACT_DEFINED_NOT_IMPLEMENTED; contract=statistics_ratio_study_compat_v1. |
| Statistics Studio parity | Comparison snapshot availability | GET /terraforge/comparison-snapshots | partial | Loaded 238 neighborhood snapshots. Neighborhood-level parity still requires row matching to segment keys. |
| County Studio | Scenario preview | GET /county-study/scenarios/{scenarioId}/preview | partial | Preview returned for scenario 04f34e2a-6cfe-4adc-9d0c-f10710cc81ca; source recomputation still required. |
| Fixture leakage | Nonexistent county does not receive Benton data | TerraForge county-stats with fake county scope | yes | Fake county returned HTTP 400, not live Benton-looking data. |
| Fixture leakage | Static Benton/fallback scan | frontend/backend source scan | partial | Found 1 possible fallback/fixture Benton references requiring review. |

## Failures

- Statistics Studio parity: County-sovereign statistics superset claim - Claim remains provisional: Benton-certified reference lanes are still present; possible Benton fallback/fixture references require review.
- Cross-surface: County median/COD/PRD consistency and mismatch class - scope mismatch: health median/COD/PRD=0.9268/41.28/1.3993; ratio-study=0.7224/40.24/2.1352. Population mismatch: County Studio health uses ratioCount=5559, while TerraForge ratio-study uses countWithRatio=36. This blocks parity until both surfaces compare the same cohort/window/qualification pool.

## Warnings

- County Studio: Derivation source path - Code path reads Properties, CamaCharacteristics, and ComparableSales. Independent row recomputation still required.
- TerraFusion Sync: 2017 conversion / qualified-sale risk posture - Direct proof exists, but qualification conversion coverage still needs explicit row-level classification.
- Database posture: Benton operational DB vs legacy sync bridge - Development API points at postgres DefaultConnection and keeps BentonCountyLegacy as a sync bridge. This proves configuration posture, not source truth.
- Database posture: Washington 39-county data posture - 39-county proof is registry/acquisition-path inventory only; it does not prove official statewide ingestion, normalization, geometry, or runtime county data.
- County Studio: County trust tier and UI label posture - Production Provisional; parity claims allowed=false. UI must surface badges: Production Provisional, Sync-Derived, Converted Legacy Sensitive.
- County Studio: Segment derivation sample - Sampled 10; detail responses 10. API confirms shape, not independent source recomputation.
- Statistics Studio parity: Population scope alignment proof - BLOCKED_SCOPE_MISMATCH; rootCause=scope_mismatch_different_population_definitions; countDifference={"countyStudioHealthRatioCount":5559,"terraForgeCountWithRatio":36,"delta":5523}.
- Statistics Studio parity: Shared population contract - IMPLEMENTATION_GAP_SHARED_PARITY_MODE_MISSING; decision=PATH_A_REQUIRED_SHARED_PARITY_CONTRACT_DEFINED_NOT_IMPLEMENTED; contract=statistics_ratio_study_compat_v1.
- Statistics Studio parity: Comparison snapshot availability - Loaded 238 neighborhood snapshots. Neighborhood-level parity still requires row matching to segment keys.
- County Studio: Scenario preview - Preview returned for scenario 04f34e2a-6cfe-4adc-9d0c-f10710cc81ca; source recomputation still required.
- Fixture leakage: Static Benton/fallback scan - Found 1 possible fallback/fixture Benton references requiring review.

## Leakage Matches

- frontend/apps/os-shell/src/auth/session.ts:13 [dev-session-normalization] export const BENTON_DEV_COUNTY_ID = '19190019-1919-1919-1919-191919191919';
- frontend/apps/os-shell/src/auth/session.ts:17 [dev-session-normalization] countyId: BENTON_DEV_COUNTY_ID,
- frontend/apps/os-shell/src/auth/session.ts:23 [dev-session-normalization] const BENTON_COUNTY_ALIASES = new Set([
- frontend/apps/os-shell/src/auth/session.ts:26 [reference] '53005',
- frontend/apps/os-shell/src/auth/session.ts:27 [reference] 'benton',
- frontend/apps/os-shell/src/auth/session.ts:28 [reference] 'benton county',
- frontend/apps/os-shell/src/auth/session.ts:29 [dev-session-normalization] BENTON_DEV_COUNTY_ID,
- frontend/apps/os-shell/src/auth/session.ts:38 [dev-session-normalization] return BENTON_COUNTY_ALIASES.has(key) ? BENTON_DEV_COUNTY_ID : trimmed;
- frontend/apps/os-shell/src/auth/useSession.ts:9 [dev-session-normalization] import { BENTON_DEV_COUNTY_ID } from './session';
- frontend/apps/os-shell/src/auth/useSession.ts:22 [dev-session-normalization] countyId: BENTON_DEV_COUNTY_ID,
- frontend/apps/os-shell/src/auth/useSession.ts:27 [dev-session-normalization] const BENTON_ALIASES = new Set(['5', '005', '53005', 'benton', 'benton county', BENTON_DEV_COUNTY_ID]);
- frontend/apps/os-shell/src/auth/useSession.ts:33 [dev-session-normalization] return BENTON_ALIASES.has(trimmed.toLowerCase()) ? BENTON_DEV_COUNTY_ID : trimmed;
- frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:54 [reference] interface BentonMarketDataResponse {
- frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:138 [reference] function buildMarketCondition(data: BentonMarketDataResponse | undefined) {
- frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:186 [reference] function buildMarketAnalytics(data: BentonMarketDataResponse | undefined) {
- frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:214 [reference] function buildEconomicIndicators(data: BentonMarketDataResponse | undefined) {
- frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:574 [reference] } = useQuery<BentonMarketDataResponse>({
- frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:578 [benton-certified-reference-lane] '/costforge/income-approach/market-data/benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/hooks/useStudyData.ts:174 [reference] * the actionable part ("HTTP 400: countyId 'benton' is not a valid Guid.").
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CityInspector.test.tsx:57 [test-fixture] studyId: 'study-benton-2026',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CityInspector.test.tsx:58 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CityInspector.test.tsx:59 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CityInspector.test.tsx:183 [test-fixture] expect(navigateMock.mock.calls[0]?.[0]).toContain('countyId=benton');
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CityInspector.test.tsx:201 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CityInspector.test.tsx:208 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CityInspector.test.tsx:215 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CohortCreationDialog.test.tsx:28 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CorrectionDefensePanel.test.tsx:81 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CorrectionDefensePanel.test.tsx:185 [test-fixture] expect(screen.getByTestId('defense-current-anchors')).toHaveTextContent('Benton County');
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyCommandStrip.test.tsx:10 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyCommandStrip.test.tsx:11 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyCommandStrip.test.tsx:25 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyDiagnosisModal.test.tsx:36 [test-fixture] countyName: 'Benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyDiagnosisModal.test.tsx:80 [test-fixture] narrative: 'Benton 2026 classifies as Model problem (confidence 65%). 4 of 12 segments carry a diagnosed problem.',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyHealthPanel.test.tsx:35 [test-fixture] studyId: 'study-1', countyId: 'benton', taxYear: 2026,
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyHealthPanel.test.tsx:61 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:45 [test-fixture] url.includes('income-approach/market-data/benton')
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:47 [test-fixture] county: 'Benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:58 [test-fixture] source: 'US Census ACS 2024, WA ESD, Benton-Franklin Trends',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:170 [test-fixture] countyId: '19190019-1919-1919-1919-191919191919',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:171 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:205 [test-fixture] countyId: '19190019-1919-1919-1919-191919191919',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:245 [test-fixture] '19190019-1919-1919-1919-191919191919',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:249 [test-fixture] countyId: '19190019-1919-1919-1919-191919191919',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/countyStudioStore.test.ts:22 [test-fixture] countyId: 'benton-wa',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/countyStudioStore.test.ts:30 [test-fixture] createdBy: 'assessor@benton.wa.gov',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/countyStudioStore.test.ts:31 [test-fixture] updatedBy: 'assessor@benton.wa.gov',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStudyPage.test.tsx:98 [test-fixture] studyId: 'study-1', countyId: 'benton', taxYear: 2026,
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStudyPage.test.tsx:110 [test-fixture] studyId: 'study-1', countyId: 'benton', taxYear: 2026,
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/evidencePacketMarkdown.test.ts:6 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/evidencePacketMarkdown.test.ts:56 [test-fixture] expect(md).toContain('Benton County');
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ExportPacketModal.test.tsx:25 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ExportPacketModal.test.tsx:79 [test-fixture] expect(screen.getByText('Benton County')).toBeInTheDocument();
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/LeftRail.test.tsx:53 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/NeighborhoodInspector.test.tsx:59 [test-fixture] studyId: 'study-benton-2026',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/NeighborhoodInspector.test.tsx:60 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/NeighborhoodInspector.test.tsx:61 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/NeighborhoodInspector.test.tsx:164 [test-fixture] expect(navigateMock.mock.calls[0]?.[0]).toContain('countyId=benton');
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/NeighborhoodInspector.test.tsx:180 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/NeighborhoodInspector.test.tsx:188 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/NeighborhoodInspector.test.tsx:196 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ObjectInspector.test.tsx:88 [test-fixture] studyId: 'study-1', countyId: 'benton', taxYear: 2026,
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ObjectInspector.test.tsx:104 [test-fixture] segmentId: 's1', segmentSetId: 'ss1', studyId: 'study-1', countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ObjectInspector.test.tsx:124 [test-fixture] segmentId: 's1', studyId: 'study-1', countyId: 'benton', taxYear: 2026,
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ObjectInspector.test.tsx:351 [test-fixture] expect(params.get('countyId')).toBe('benton');
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ObjectInspector.test.tsx:361 [test-fixture] metadata: expect.objectContaining({ segmentId: 's1', countyId: 'benton' }),
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/OpenStudyDialog.test.tsx:17 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/OpenStudyDialog.test.tsx:18 [test-fixture] headers: { 'x-county-id': 'benton' },
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/OpenStudyDialog.test.tsx:28 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/OpenStudyDialog.test.tsx:29 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/RightRail.test.tsx:50 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/RightRail.test.tsx:51 [test-fixture] countyName: 'Benton County',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/RightRail.test.tsx:130 [test-fixture] expect(screen.getByTestId('right-rail-scope-label')).toHaveTextContent('Benton County');
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx:20 [test-fixture] studyId: 'study-1', countyId: 'benton', taxYear: 2026,
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx:33 [test-fixture] countyId: 'benton',
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ScenarioWorksheet.test.tsx:113 [test-fixture] expect(screen.getByTestId('scenario-worksheet-scope')).toHaveTextContent(/benton/i);
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/SegmentFilters.nullGuard.test.tsx:44 [test-fixture] studyId: 'study-1', countyId: 'benton', taxYear: 2026,
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/segmentIdentity.test.ts:40 [test-fixture] it('extracts Benton neighborhood codes from compound labels without deriving reval from hood', () => {
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/segmentIdentity.test.ts:72 [test-fixture] it('treats numeric Benton hood codes as neighborhoods without inventing reval from the first digit', () => {
- frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/SegmentTable.test.tsx:78 [test-fixture] it('renders Benton-depth statistics parity signals in the table', () => {
