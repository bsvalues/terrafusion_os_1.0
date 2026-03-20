# Leak-Guard Governance Drift

Date: 2026-03-19
Status: OPEN
Lane: Separate governance remediation
Scope: Documentation and triage only. No changes to leak-guard tests or component coverage map in this slice.

## Summary

Full-root Vitest remains non-green due to pre-existing governance drift in:

- `os-platform/core/tests/leak-guard-strict-components-coverage.test.ts`

This failure is unrelated to the scoped frontend contract repair lane that fixed:

- `TerraCanonCrossTabSyncContract`
- `WorkbenchTabBar`
- `DesktopIntentContract`
- `AuthBoundaryIntent`

That repair lane was already proved separately and must not be used to claim leak-guard remediation.

## Failing Test

| Item | Value |
|---|---|
| Test file | `os-platform/core/tests/leak-guard-strict-components-coverage.test.ts` |
| Test name | `Leak guard STRICT coverage (components narrow root) — Phase 203 > every eligible file in os-shell components has a corresponding leak guard` |
| Result | FAIL |
| Exit code | 1 |
| Error | `Unguarded eligible files in narrow root (frontend/apps/os-shell/src/components): 63` |

## Reproduction

```powershell
pnpm exec vitest run os-platform/core/tests/leak-guard-strict-components-coverage.test.ts --reporter=verbose 2>&1
```

## First 20 Reported Unguarded Files

1. `frontend/apps/os-shell/src/components/atlas/AddressMapWidget.tsx`
2. `frontend/apps/os-shell/src/components/atlas/GamaMap.tsx`
3. `frontend/apps/os-shell/src/components/atlas/GisVisualization.tsx`
4. `frontend/apps/os-shell/src/components/atlas/MapContainerWidget.tsx`
5. `frontend/apps/os-shell/src/components/atlas/MarketHeatMapWidget.tsx`
6. `frontend/apps/os-shell/src/components/atlas/SchoolDistrictWidget.tsx`
7. `frontend/apps/os-shell/src/components/atlas/SentimentHeatMapWidget.tsx`
8. `frontend/apps/os-shell/src/components/atlas/SmartFilterBar.tsx`
9. `frontend/apps/os-shell/src/components/canon/CanonMinimapPanel.tsx`
10. `frontend/apps/os-shell/src/components/canon/CanonSnippetsPanel.tsx`
11. `frontend/apps/os-shell/src/components/dais/AppealCertificationPanel.tsx`
12. `frontend/apps/os-shell/src/components/dais/AppealDeadlinePanel.tsx`
13. `frontend/apps/os-shell/src/components/dais/AppealHearingPanel.tsx`
14. `frontend/apps/os-shell/src/components/dais/AppealNoticePanel.tsx`
15. `frontend/apps/os-shell/src/components/dais/AuditTab.tsx`
16. `frontend/apps/os-shell/src/components/dais/CertRollPanel.tsx`
17. `frontend/apps/os-shell/src/components/dais/ManagementDashboardPanel.tsx`
18. `frontend/apps/os-shell/src/components/dais/NoticeBatchQueuePanel.tsx`
19. `frontend/apps/os-shell/src/components/dais/WorkQueuePanel.tsx`
20. `frontend/apps/os-shell/src/components/datamining/EtlStatusPanel.tsx`

## Truth Boundary

- Scoped frontend contract regressions are fixed and verified.
- Full Vitest is not green.
- The blocking condition is pre-existing leak-guard governance drift outside that change set.
- Any remediation here must be tracked and proved as a separate slice.

## Recommended Next Steps

1. Inventory all 63 uncovered component paths and de-duplicate the reported list.
2. Decide whether the correct repair is additional guard files, coverage-map repair, or eligibility narrowing.
3. Land leak-guard remediation in a dedicated governance lane with its own proof run.
4. Re-run full-root Vitest only after the governance lane has independent evidence.