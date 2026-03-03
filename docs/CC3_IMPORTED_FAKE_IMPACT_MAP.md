# CC-3 Imported Fake Dependency Impact Map

## Scope
Read-only impact mapping for imported fake-signal hooks/services in `frontend/apps/os-shell/src`.
No code changes included in this slice.

## Method
- Import scan for hooks/services
- Fake-signal keyword scan (`QUANTUM`, `TRANSCENDENT`, `SIMULATION`, `Math.random`, `mock`, `demo`, `hardcoded`)
- Importer tracing per module

## Imported Fake-Signal Hooks

### `useEliteConsciousnessEngine`
- Why fake: heavy synthetic metrics/randomized outputs and transcendence labels.
- Importers:
  - `components/validation/EliteSystemValidator.tsx`
  - `components/performance/EliteQuantumDashboard.tsx`
  - `components/testing/ExcellenceVerificationTest.tsx`
  - (also chained by `hooks/useEliteExcellenceAnalytics.ts`)
- Route surface: component-only; no canonical workbench route dependency found.
- Disposition: quarantine/importer refactor in CC-3; replace UI panels with `FeatureUnavailable` if needed.

### `useEliteExcellenceAnalytics`
- Why fake: derived from elite/quantum hooks and transcendence grading.
- Importers:
  - `components/performance/EliteQuantumDashboard.tsx`
  - `components/validation/EliteSystemValidator.tsx`
  - `components/testing/ExcellenceVerificationTest.tsx`
  - `hooks/useQuantumModuleEcosystem.ts`
- Route surface: component-only.
- Disposition: refactor importer chain or quarantine dependent panels.

### `useEliteGovernmentSecurity`
- Why fake: mode includes `QUANTUM_SIMULATION`; synthetic grade states.
- Importers:
  - `hooks/useEliteExcellenceAnalytics.ts`
  - `components/validation/EliteSystemValidator.tsx`
  - `components/performance/EliteQuantumDashboard.tsx`
  - `components/testing/ElitePerformanceVerificationTest.tsx`
  - `components/testing/ExcellenceVerificationTest.tsx`
- Route surface: component/testing surfaces.
- Disposition: quarantine/refactor; no direct dependency for governed R1 execution spine.

### `useEliteQuantumPerformance`
- Why fake: transcendence grading and random metric adjustments.
- Importers:
  - `hooks/useEliteExcellenceAnalytics.ts`
  - `hooks/useEliteConsciousnessEngine.ts`
  - `components/validation/EliteSystemValidator.tsx`
  - `components/testing/ExcellenceVerificationTest.tsx`
  - `components/performance/EliteQuantumDashboard.tsx`
  - `components/performance/ElitePerformanceIndicator.tsx`
- Route surface: component-only.
- Disposition: quarantine/refactor.

### `useQuantumModuleEcosystem`
- Why fake: chained to elite analytics/security abstractions.
- Importers:
  - `components/performance/EliteQuantumDashboard.tsx`
  - `components/validation/EliteSystemValidator.tsx`
  - `components/testing/ExcellenceVerificationTest.tsx`
- Route surface: component-only.
- Disposition: quarantine/refactor.

### `useQuantumConsciousness`
- Why fake: randomized synthetic agent metrics and pattern generation.
- Importers:
  - `consciousness/QuantumConsciousnessInterface.tsx`
  - `components/analytics/ImmersiveAnalyticsSuite.tsx`
  - `components/consciousness/QuantumConsciousnessResearchDashboard.tsx`
  - `components/experiments/EliteExperimentalInterface.tsx`
- Route surface: non-core consciousness/experiments UIs.
- Disposition: quarantine/refactor; not part of R1 governed execution path.

### `useResearchAnalytics`
- Why fake: synthetic analytics values and random factors.
- Importers:
  - `consciousness/QuantumConsciousnessInterface.tsx`
  - `components/analytics/ImmersiveAnalyticsSuite.tsx`
  - `components/consciousness/QuantumConsciousnessResearchDashboard.tsx`
- Route surface: analytics/consciousness pages.
- Disposition: quarantine/refactor.

### `useQuantumPerformance`
- Why fake: transcendence status and synthetic performance heuristics.
- Importers:
  - `components/ai/ConsciousnessEngine.tsx`
  - `components/analytics/ExcellenceAnalytics.tsx`
- Route surface: non-core analytics/AI components.
- Disposition: quarantine/refactor.

### `useExperimentsSignalR` (candidate, not fake by default)
- Why flagged: keyword scan candidate only; appears to be real SignalR hook.
- Importers:
  - `pages/experiments/ExperimentsList.tsx`
- Route surface: `/experiments` page.
- Disposition: keep; do not classify as fake without behavior evidence.

## Imported Fake-Signal Services

### `TerraFusionEliteAPI`
- Why fake: service exposes `QUANTUM_SIMULATION` source and elite cache simulation patterns.
- Importers:
  - `components/ai/GovernmentAIStatus.tsx`
  - `hooks/useEliteGovernmentSecurity.ts`
  - `components/status/GovernmentExcellenceStatus.tsx`
  - `components/testing/ElitePerformanceVerificationTest.tsx`
  - `components/testing/EliteAPITestDashboard.tsx`
- Route surface: status/testing components; not R1 execution spine.
- Disposition: quarantine/refactor; remove production usage in CC-3.

### `QuantumModuleManager`
- Why fake: mock analysis/report methods (`mockCostForgeAnalysis`, `mockMLForecast`, `mockGenerateReport`).
- Importers:
  - `components/modules/GovernmentModuleHub.tsx`
- Route surface: module hub UI.
- Disposition: quarantine/refactor, replace with real module orchestration path.

### `EliteSystemMonitor`
- Why fake: elite/transcendent/quantum scoring with randomized metrics.
- Importers:
  - `components/monitoring/EliteSystemDashboard.tsx`
- Route surface: monitoring dashboard component.
- Disposition: quarantine/refactor.

## CC-3 Safe Execution Rules
- No direct deletions of shared shell plumbing.
- If importer is on governed surfaces, replace view with `FeatureUnavailable` instead of hard delete.
- Prioritize removal/quarantine of isolated testing/demo/elite dashboards first.
- Keep SignalR hooks unless proven fake by behavior.

## Proposed CC-3 Order
1. Quarantine isolated `components/testing/**` consumers of fake modules.
2. Quarantine elite dashboards (`EliteQuantumDashboard`, `EliteSystemDashboard`, related indicators).
3. Refactor/remove service dependencies (`TerraFusionEliteAPI`, `QuantumModuleManager`, `EliteSystemMonitor`) from remaining importers.
4. Re-run type-check and frontend build after each slice.
