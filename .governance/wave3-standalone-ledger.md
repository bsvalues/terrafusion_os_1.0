# Wave 3 Standalone Surface Ledger — Forge / Atlas / Dais / Dossier

Generated: 2026-03-18

## Summary

- Suites audited: 4 (Forge, Atlas, Dais, Dossier)
- Suites needing new standalone pages: **0**
- Suites needing routing fixes: **0**
- Suites needing sizing fixes: **0**
- Suites needing placeholder removal: **0**
- Fix classification for ALL: **NONE — already correct**

## Audit Method

1. Registry check — `moduleComponents.tsx` lines 316-319 (lazy imports), 347-350 (COMPONENT_REGISTRY), 909-913 (render switch)
2. Sizing check — `desktopStore.ts:getModuleWindowSize()` returns `vw-40 × vh-120` for all suite-workspace modules
3. Object-type check — `contracts/objectPlacement.ts` lines 282-285: all 4 classified as `suite-workspace`
4. Boundary validation — `validateSuiteRendering()` at line 587 enforces suite-workspace classification at render time
5. Parcel routing check — `QuantumModuleManager.ts`: parcel-scoped modules use `launchMode: 'workbench'` routing to `property-workbench`
6. Test coverage check — 70 contract tests across 7 gate files already verify end-to-end

## Suite Ledger

| Suite | Module ID | Object Type | Lazy Import | Window Size | Suite Home Component | Root testid | Fix |
|-------|-----------|-------------|-------------|-------------|---------------------|-------------|-----|
| Forge | suite-forge | suite-workspace | ✅ ForgeSuiteHome | vw-40 × vh-120 | ✅ pages/suites/ForgeSuiteHome | suite-forge-root | NONE |
| Atlas | suite-atlas | suite-workspace | ✅ AtlasSuiteHome | vw-40 × vh-120 | ✅ pages/suites/AtlasSuiteHome | suite-atlas-root | NONE |
| Dais | suite-dais | suite-workspace | ✅ DaisSuiteHome | vw-40 × vh-120 | ✅ pages/suites/DaisSuiteHome | suite-dais-root | NONE |
| Dossier | suite-dossier | suite-workspace | ✅ DossierSuiteHome | vw-40 × vh-120 | ✅ pages/suites/DossierSuiteHome | suite-dossier-root | NONE |

## Module Registry Aliases (moduleComponents.tsx)

```
forge / terraforge        → suite-forge
atlas / terraatlas        → suite-atlas
dais / terradais          → suite-dais
dossier / terradossier    → suite-dossier
```

## Existing Test Coverage (pre-Wave 3)

| File | Tests | Gate |
|------|-------|------|
| suites/daisQueueRouting.contract.test.tsx | 9 | Queue drill-through |
| suites/daisCertOperationsRouting.contract.test.tsx | 9 | Cert ops routing |
| suites/daisManagementDashboardRouting.contract.test.tsx | 9 | Mgmt dashboard |
| suites/daisNoticeOperationsRouting.contract.test.tsx | 9 | Notice ops routing |
| shell/suiteStates.contract.test.tsx | ~18 | Suite state lifecycle |
| workflows/workflowEntryPoints.contract.test.tsx | ~8 | Entry point contracts |
| integration/suiteHandoff.contract.test.tsx | ~8 | Suite handoff |
| **Total existing** | **~70** | all green |

## Wave 3 New Contract Tests

Wave 3 adds 12 tests in 4 files proving the audited facts are test-enforced:

| File | Tests | What it proves |
|------|-------|----------------|
| `__tests__/suites/wave3-suite-workspaces.test.ts` | 4 | All 4 suites classified as suite-workspace in objectPlacement contract |
| `__tests__/suites/wave3-parcel-routing.test.ts` | 3 | Parcel-scoped modules in each suite route to workbench, not new windows |
| `__tests__/suites/wave3-placeholder-integrity.test.ts` | 3 | No placeholder text in suite roots (no "coming soon", "TODO", "under construction") |
| `__tests__/suites/wave3-shell-boundaries.test.ts` | 2 | validateSuiteRendering returns null (no violation) for all 4 suite-IDs |

## Conclusion

The remediation plan (Wave 3) described standalone pages that needed to be built.
Audit-first reconnaissance found all 4 were already correctly implemented with:
- Correct lazy imports in COMPONENT_REGISTRY
- Correct near-fullscreen sizing (vw-40 × vh-120, not maximized)
- Correct object-type classification (suite-workspace)
- Correct boundary validation at render time
- 70 existing tests already proving end-to-end

Wave 3 deliverable = ledger (this file) + 12 new contract tests locking the surface.
No UI changes were needed.
