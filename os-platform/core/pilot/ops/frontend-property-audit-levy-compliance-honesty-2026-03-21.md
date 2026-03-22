# Frontend PropertyAudit Levy Compliance Honesty

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded honesty slice that stops the mounted PropertyAudit levy-compliance card from presenting a returned parcel-scoped tool result as if the route independently proves levy-rate compliance across all taxing districts.

## Scope

This quality lane was intentionally limited to the mounted PropertyAudit levy-compliance card and its direct test:

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAudit.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyAudit.test.tsx`

No levy tool manifest semantics, tool output contracts, county-wide levy workflows, or release-gate logic was changed.

## Change Summary

- The mounted PropertyAudit levy-compliance card no longer says `Check levy rate compliance across all taxing districts`.
- The card now says `Request returned levy compliance totals and issues for this parcel`, which matches the route behavior that invokes `check_levy_compliance` for the active parcel and renders the returned counts and issues.
- The success panel now adds a disclosure line stating that it shows the levy compliance totals and issues returned by the request, rather than implying that the route has independently proven a complete all-district compliance review.
- The direct PropertyAudit test now locks the returned-result wording, verifies the governed tool invocation, and rejects regression to the old `all taxing districts` claim.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/workbench/PropertyAudit.test.tsx` = `10 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`

Current governed security posture remains the previously reconciled PASS state recorded in `os-platform/core/pilot/ops/snyk-findings-rerun-reconciliation-2026-03-21.md`: `69 findings` (`13 error`, `40 warning`, `16 note`) and `pnpm run security:check` = `PASS`.

Note: the governed Snyk scan/check scope remains `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`; it does not scan the frontend shell files touched in this slice.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.