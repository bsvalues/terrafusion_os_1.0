# Frontend Forge Suite Source Disclosure

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded TerraForge suite-home honesty slice that discloses when the mounted `/forge` route is rendering county aggregate stats from non-live provider modes.

## Scope

This quality lane was intentionally limited to the mounted TerraForge suite route, the shared county-stats hook, and a direct contract:

- `frontend/apps/os-shell/src/hooks/useCountyStats.ts`
- `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`
- `frontend/apps/os-shell/src/__tests__/shell/forgeSuiteSourceHonesty.contract.test.tsx`

No Forge queue wiring, workbench launch behavior, batch valuation execution, county aggregate math, or release-gate logic was changed.

## Change Summary

- `useCountyStats()` now preserves the active provider mode so mounted suite homes can distinguish `live`, `snapshot`, and `fixtures` county aggregates.
- The mounted `/forge` route now shows a visible provenance disclosure when county stats are not backed by live backend metrics.
- The disclosure explicitly differentiates bundled snapshot data and fixture data from live backend metrics instead of presenting all county stats as equivalent live truth.
- A focused contract locks the disclosure for snapshot mode and verifies it stays hidden when the route is actually on live provider metrics.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/shell/forgeSuiteSourceHonesty.contract.test.tsx` = `2 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`
- `pnpm run security:scan` = `PASS`; governed scope remained `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`, with the same existing `73 findings`

Note: the required repo-owned security scan does not scan the frontend shell files touched in this slice because its governed scope remains limited to the core/governance targets above.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.