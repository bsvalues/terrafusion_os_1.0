# Frontend Dais Suite Fallback Disclosure

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded TerraDais suite-home honesty slice that discloses when the mounted `/dais` route is rendering county-provider aggregate fallback instead of TerraDais API metrics.

## Scope

This quality lane was intentionally limited to the mounted TerraDais suite route and a direct contract:

- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`
- `frontend/apps/os-shell/src/__tests__/shell/daisSuiteSourceHonesty.contract.test.tsx`

No queue wiring, TerraDais API calls, county stats composition, module launcher behavior, or release-gate logic was changed.

## Change Summary

- The mounted `/dais` route now shows a visible provenance disclosure when `useDaisSuiteStats()` is sourcing route metrics from `county-provider` fallback.
- The disclosure makes clear that the overview, certification, and notice panels are using county-wide provider aggregates rather than TerraDais API metrics.
- A focused contract locks that disclosure for fallback mode and verifies it stays hidden when the route is actually on `dais-api` source.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/shell/daisSuiteSourceHonesty.contract.test.tsx` = `2 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`
- `pnpm run security:scan` = `PASS`; governed scope remained `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`, with the same existing `73 findings`

Note: the required repo-owned security scan does not scan the frontend shell files touched in this slice because its governed scope remains limited to the core/governance targets above.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.