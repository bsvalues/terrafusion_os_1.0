# Statistics Studio Demotion And County Studio Default Analytics

Checked: 2026-04-30T19:13:32.583Z
Status: PASS
Decision: COUNTY_STUDIO_DEFAULT_ANALYTICS_STATISTICS_STUDIO_DEMOTED_TO_LEGACY_SPECIALIST

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| generic-statistics-aliases-route-to-county-studio | PASS | `frontend/apps/os-shell/src/config/moduleComponents.tsx:61`<br>`frontend/apps/os-shell/src/config/moduleComponents.tsx:62` | Normal analytics aliases now open County Studio instead of the standalone Statistics Studio shell. |
| canonical-statistics-studio-remains-specialist-entry | PASS | `frontend/apps/os-shell/src/config/moduleComponents.tsx:181`<br>`frontend/apps/os-shell/src/config/moduleComponents.tsx:826` | The canonical Statistics Studio module remains launchable for specialist legacy use. |
| forge-suite-labels-statistics-studio-as-legacy-specialist | PASS | `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx:145`<br>`frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx:141` | Statistics Studio is no longer described as parity evidence or the default analytics workflow. |
| county-studio-is-default-analytics-workbench | PASS | `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx:607`<br>`frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx:612` | Forge now presents County Studio as the normal study-anchored analytics path. |
| retirement-gap-audit-supports-demotion-not-full-retirement | PASS | `os-platform/core/pilot/evidence/statistics-studio-retirement-gap-audit.latest.json` | The prior audit still supports demotion: analytics are covered, but standalone shell and VEI exploration remain product distinctions. |

## Next Closure

- Decide whether ad hoc VEI tax-year exploration belongs inside County Studio.
- If VEI exploration is migrated or intentionally retired, remove the standalone Statistics Studio shell.

