# Frontend Governance Dashboard Polling Honesty

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded GovernanceLock dashboard honesty slice that stops the mounted `pilot/dashboard` route from presenting 30-second polling metrics as real-time telemetry.

## Scope

This quality lane was intentionally limited to the routed GovernanceLock dashboard and a direct contract:

- `frontend/apps/os-shell/src/pages/GovernanceDashboard.tsx`
- `frontend/apps/os-shell/src/__tests__/shell/governanceDashboardHonesty.contract.test.tsx`

No backend metrics endpoints, authorization behavior, polling cadence, or release-gate logic was changed.

## Change Summary

- The routed GovernanceLock dashboard now labels its surface as `Auto-refresh metrics (30s poll)` instead of `Real-time metrics`.
- The footer now matches the same truthful polling language.
- A focused contract locks that wording and prevents the previous `Real-Time Metrics` copy from reappearing.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/shell/governanceDashboardHonesty.contract.test.tsx` = `1 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`
- `pnpm run security:scan` = `PASS`; governed scope remained `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`, with the same existing `73 findings`

Note: the required repo-owned security scan does not scan the frontend shell files touched in this slice because its governed scope remains limited to the core/governance targets above.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.