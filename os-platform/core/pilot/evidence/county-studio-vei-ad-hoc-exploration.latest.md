# County Studio VEI Ad Hoc Exploration

Checked: 2026-04-30T19:18:49.321Z
Status: PASS
Decision: VEI_AD_HOC_EXPLORATION_MIGRATED_TO_COUNTY_STUDIO

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| county-studio-owns-vei-tax-year-state | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:701`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:734` | VEI exploration state lives in County Studio and resets when the active study changes. |
| vei-query-uses-exploration-tax-year | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:777`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:780` | Only the VEI neighborhood snapshot query moves with the exploration tax year. |
| vei-selector-is-not-noop | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:939`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:941` | County Studio VEI tax-year selector is interactive rather than pinned/no-op. |
| study-statistics-remain-anchored | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:728`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx:757` | Non-VEI statistics stay anchored to the active study tax year. |
| ui-test-covers-vei-exploration-without-study-filter-mutation | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:324`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx:342` | The regression test proves VEI exploration does not rewrite the study-scoped statistics filter. |

## Next Closure

- Rerun the Statistics Studio retirement gap audit after migration.
- If the audit reports standalone shell only, remove or hide the Statistics Studio entrypoint in a separate slice.

