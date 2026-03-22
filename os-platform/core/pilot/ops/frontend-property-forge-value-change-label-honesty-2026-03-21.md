# Frontend PropertyForge Value-Change Label Honesty

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded honesty slice that stops the mounted PropertyForge value-change card from presenting the selected tax-year result as an unqualified current value.

## Scope

This quality lane was intentionally limited to the mounted PropertyForge overview sub-tab and its direct workbench test:

- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeOverview.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx`

No backend valuation contract, parcel-store hydration logic, tool semantics, or release-gate logic was changed.

## Change Summary

- The mounted PropertyForge value-change card no longer labels the selected tax-year result as `Current`.
- The comparison panels now read `Prior Year (<year>)` and `Selected Year (<year>)`, which matches the route behavior that submits the selected tax year and compares it against the prior year.
- The card now adds a disclosure line stating that the comparison shown is between the selected tax year and the prior year returned for the parcel.
- The direct PropertyForge test now drives the tax-year selector, invokes the value-change tool, locks the selected-year wording, and rejects regression to the old `Current` label.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx` = `15 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`
- `pnpm run security:scan` = `PASS`; governed scope remained `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`, with the same existing `73 findings`

Note: the required repo-owned security scan does not scan the frontend shell files touched in this slice because its governed scope remains limited to the core/governance targets above.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.