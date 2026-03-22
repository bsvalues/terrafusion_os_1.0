# Frontend PropertyForge Baseline Disclosure

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded honesty slice that stops the mounted PropertyForge route from presenting overview baseline values as if they automatically tracked the selected tax year or an unqualified current state.

## Scope

This quality lane was intentionally limited to the mounted PropertyForge workbench route, its overview sub-tab, and the direct workbench test:

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeOverview.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx`

No backend valuation contract, model behavior, parcel-store hydration logic, or release-gate logic was changed.

## Change Summary

- The mounted PropertyForge route now includes a baseline disclosure directly under the tax-year selector stating that the overview values reflect the parcel snapshot already loaded in the workbench.
- That disclosure also states that changing the tax year changes the governed tool requests below, but does not relabel the overview baseline cards until a tool result returns.
- The two headline overview cards now read `Loaded Market Value` and `Loaded Assessed` instead of `Current Market Value` and `Current Assessed`.
- The idle explanation prompt now says `Get tool-generated analysis of the selected valuation model results`, avoiding an unnecessary present-tense overclaim around the overview baseline.
- The direct PropertyForge workbench test now locks the new disclosure text and rejects regression to the prior `Current` baseline labels.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx` = `14 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`
- `pnpm run security:scan` = `PASS`; governed scope remained `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`, with the same existing `73 findings`

Note: the required repo-owned security scan does not scan the frontend shell files touched in this slice because its governed scope remains limited to the core/governance targets above.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.