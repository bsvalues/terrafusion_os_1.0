# Wave 0 Hygiene Inventory (2026-03-17)

## console.log
- Total files with console.log: 98
- Top 10 hotspots:
  - `tests/security/PenetrationTesting.test.tsx`: 26
  - `tests/accessibility/ScreenReaderCompatibility.test.tsx`: 25
  - `services/enhancementCommunicationService.ts`: 24
  - `tests/performance/MemoryLeakDetection.test.tsx`: 21
  - `tests/accessibility/AccessibilityCompliance.test.tsx`: 18
  - `services/monitoring/AlertingEngine.ts`: 16
  - `tests/integration/EliteIntegrationTestSuite.test.ts`: 15
  - `tests/e2e/complete-workflow.spec.ts`: 14
  - `services/signalRClient.ts`: 14
  - `config/elite-production-config.ts`: 14

All paths relative to `frontend/apps/os-shell/src/`.

## @ts-ignore / @ts-expect-error
- Total instances: 17
- Files:
  - `hooks/__tests__/useSystemGptAtlasLive.test.ts` (lines 71, 330, 367)
  - `__tests__/workbench/workbenchEntrypoints.registryCompleteness.test.ts` (lines 143, 146)
  - `components/ecosystem/ModuleEcosystemDashboard.tsx` (lines 302, 304, 339, 341)
  - `__tests__/standalone/standaloneHomes.registryCompleteness.test.ts` (lines 172, 175, 178)
  - `services/performance.ts` (lines 250, 255)
  - `setupTests.ts` (line 13)
  - `shell/desktop/__tests__/DesktopErrorBoundary.test.tsx` (lines 134, 170)

All paths relative to `frontend/apps/os-shell/src/`.

## `any` type hotspots
- Total files with `any`: 200
- Top 10 hotspots:
  - `api/researchServices.ts`: 39
  - `components/brand/WebGLEffects.tsx`: 22
  - `__tests__/forge/forgeAnalytics.contract.test.tsx`: 22
  - `__tests__/forge/forgeModeling.contract.test.tsx`: 18
  - `setupTests.ts`: 16
  - `services/performance.ts`: 15
  - `applications/terra-levy/hooks/useAIAssistant.ts`: 14
  - `__tests__/workflows/workflowEntryPoints.contract.test.tsx`: 13
  - `services/gptHub.ts`: 12
  - `services/enhancementCommunicationService.ts`: 12

All paths relative to `frontend/apps/os-shell/src/`.

## useLogger
- Existing useLogger hook: **missing** (no `useLogger` found anywhere in source)
- Candidate substitution sites: 22 hook files contain `console.(log|warn|error|info)` calls
- Notable hooks with heavy console usage:
  - `useWorkflowHub.ts`: 11 console.log calls
  - `useCollaborationHub.ts`: 8 calls
  - `useAnalyticsHub.ts`: 8 calls
  - `useNotebookHub.ts`: 7 calls
  - `useBackendConnection.tsx`: 6 calls
