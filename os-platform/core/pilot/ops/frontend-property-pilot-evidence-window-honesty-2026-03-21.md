# Frontend PropertyPilot Evidence Window Honesty

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded honesty slice that stops the mounted PropertyPilot evidence rail from claiming a 30-day empty-state trace window when the mounted route does not request or prove that time boundary.

## Scope

This quality lane was intentionally limited to the mounted PropertyPilot evidence rail and its direct tests:

- `frontend/apps/os-shell/src/components/pilot/EvidenceRail.tsx`
- `frontend/apps/os-shell/src/__tests__/pilot/EvidenceRail.test.tsx`
- `frontend/apps/os-shell/src/__tests__/pilot/EvidenceRail-lane-i.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx`

No Pilot trace API contract, polling cadence, manifest loading behavior, tool-authorization behavior, or release-gate logic was changed.

## Change Summary

- The mounted PropertyPilot evidence rail no longer says `No trace events in the last 30 days` when the route has no explicit 30-day filter applied.
- The default empty state now says `No trace events returned for this parcel`, which matches what the mounted route actually knows from the returned result set.
- The filtered empty state remains unchanged as `No matches for current filters.` because that wording is backed by the active filter state.
- The direct EvidenceRail tests now lock the new parcel-returned wording, and the existing PropertyPilot Muse-first contract continues to verify that the mounted route still exposes only read-only Muse tools.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/pilot/EvidenceRail.test.tsx apps/os-shell/src/__tests__/pilot/EvidenceRail-lane-i.test.tsx apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx` = `33 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`
- `pnpm run security:scan` = `PASS`; governed scope remained `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`, with the same existing `73 findings`

Note: the required repo-owned security scan does not scan the frontend shell files touched in this slice because its governed scope remains limited to the core/governance targets above.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.