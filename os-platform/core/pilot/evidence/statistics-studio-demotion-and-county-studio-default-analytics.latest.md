# Statistics Studio Demotion And County Studio Default Analytics

Checked: 2026-04-30T20:31:02.828Z
Status: PASS
Decision: COUNTY_STUDIO_DEFAULT_ANALYTICS_STATISTICS_STUDIO_SHELL_RETIRED

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| generic-statistics-aliases-route-to-county-studio | PASS | `frontend/apps/os-shell/src/config/moduleComponents.tsx:61`<br>`frontend/apps/os-shell/src/config/moduleComponents.tsx:62` | Normal analytics aliases now open County Studio instead of the standalone Statistics Studio shell. |
| canonical-statistics-studio-now-resolves-to-county-studio | PASS | `frontend/apps/os-shell/src/config/moduleComponents.tsx:63` | The legacy Statistics Studio id now resolves into County Studio instead of launching a separate shell. |
| forge-suite-does-not-list-statistics-studio | PASS | `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx` | Statistics Studio is no longer shown as a Forge suite card. |
| county-studio-is-default-analytics-workbench | PASS | `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx:596`<br>`frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx:601` | Forge now presents County Studio as the normal study-anchored analytics path. |
| retirement-gap-audit-supports-full-shell-retirement | PASS | `os-platform/core/pilot/evidence/statistics-studio-retirement-gap-audit.latest.json` | The audit now supports full shell retirement: analytics and VEI exploration are covered by County Studio. |

## Next Closure

- Keep shared statistics panels in place; County Studio imports them as native workbench capabilities.
- Treat StatisticsStudio.tsx source removal as a separate import-graph cleanup, not a product-gate blocker.

