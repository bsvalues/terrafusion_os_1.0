# Statistics Studio Standalone Shell Closure

Checked: 2026-04-30T20:40:31.339Z
Status: PASS
Decision: STATISTICS_STUDIO_STANDALONE_SHELL_RETIRED_COUNTY_STUDIO_IS_DEFAULT_ANALYTICS

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| direct-statistics-studio-launch-resolves-to-county-studio | PASS | `frontend/apps/os-shell/src/config/moduleComponents.tsx:63` | Direct legacy launch IDs now normalize into County Studio. |
| statistics-studio-renderer-shell-removed | PASS | `frontend/apps/os-shell/src/config/moduleComponents.tsx` | ModuleRenderer no longer has a standalone Statistics Studio shell path. |
| statistics-studio-hidden-from-default-gen2-modules | PASS | `frontend/apps/os-shell/src/config/modules.ts:63`<br>`frontend/apps/os-shell/src/config/modules.ts:67` | Generated catalog metadata remains, but the retired shell is filtered out of default Gen2 modules. |
| forge-suite-no-longer-lists-statistics-studio | PASS | `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx` | Forge suite no longer presents Statistics Studio as a user-selectable specialist card. |
| retirement-audit-is-green | PASS | `os-platform/core/pilot/evidence/statistics-studio-retirement-gap-audit.latest.json` | Retirement matrix has no remaining analytical or product gap requiring the shell. |

## Next Closure

- Do not remove shared statistics components; County Studio owns and imports them.
- Keep StatisticsStudio.tsx source deletion as a separate cleanup only after import graph verification.
