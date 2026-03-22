# Frontend PropertySummary Permit-Flag Honesty

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded honesty slice that stops the mounted PropertySummary permit stat from presenting a store-backed parcel flag as if the route independently proves active permit records or fresher permit status.

## Scope

This quality lane was intentionally limited to the mounted PropertySummary route and its direct workbench test:

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertySummary.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertySummary.test.tsx`

No permit workflow tooling, parcel-store hydration logic, Dais write paths, or release-gate logic was changed.

## Change Summary

- The mounted PropertySummary permit stat no longer says `Active permits on file`.
- The stat now says `Loaded parcel is marked with active permits.`, which matches the current route behavior that renders the `hasActivePermits` boolean already present on the loaded parcel summary.
- The stat now adds a disclosure line stating that the card is shown from the parcel summary currently loaded for the parcel, rather than implying separately loaded permit records or a more precise freshness claim.
- The direct PropertySummary test now exercises the permit-flag case, locks the loaded-parcel wording, and rejects regression to the old `Active permits on file` copy.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/workbench/PropertySummary.test.tsx` = `20 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`

Current governed security posture remains the previously reconciled PASS state recorded in `os-platform/core/pilot/ops/snyk-findings-rerun-reconciliation-2026-03-21.md`: `69 findings` (`13 error`, `40 warning`, `16 note`) and `pnpm run security:check` = `PASS`.

Note: the governed Snyk scan/check scope remains `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`; it does not scan the frontend shell files touched in this slice.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.