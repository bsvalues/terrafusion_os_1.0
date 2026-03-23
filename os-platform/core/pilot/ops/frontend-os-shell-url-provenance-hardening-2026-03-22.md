# Frontend OS Shell URL Provenance Hardening

Date: 2026-03-22
Status: PASS
Owner lane: core pilot ops
Purpose: Close the highest-value follow-up from the frontend shell Snyk triage by enforcing trusted URL provenance before iframe or popup launch.

## Scope

This slice was intentionally limited to the shell-host URL flows previously identified as the strongest real frontend follow-up:

- `frontend/apps/os-shell/src/components/PWAShell.tsx`
- `frontend/apps/os-shell/src/components/layout/ProfessionalDashboard.tsx`
- `frontend/apps/os-shell/src/pages/suites/TerraPrimeSuite.tsx`
- `frontend/apps/os-shell/src/lib/trustedShellUrl.ts`
- `frontend/apps/os-shell/src/__tests__/security/trustedShellUrl.test.ts`
- `frontend/apps/os-shell/src/__tests__/suites/TerraPrimeSuite.test.tsx`

No legacy frontend paths, no governed-core checker policy, and no Snyk baseline ceilings were changed in this slice.

## What Changed

- added `trustedShellUrl.ts` as the canonical os-shell helper for:
  - rejecting non-HTTP protocols
  - rejecting non-allowlisted absolute origins
  - resolving same-origin relative shell URLs into trusted absolute URLs
  - opening trusted popups with `noopener,noreferrer`
- changed `PWAShell.tsx` to validate backend/default module launch URLs before storing them as the active iframe target
- changed `ProfessionalDashboard.tsx` to validate module URLs before opening them in the dialog iframe
- changed `TerraPrimeSuite.tsx` to:
  - build the iframe URL through the shared trust resolver
  - constrain absolute suite hosting to the TerraPrime allowlist origins
  - post session handoff only to the trusted origin
  - open pop-out windows through the trusted popup helper
  - fail closed with a truthful trust-policy error surface when URL provenance cannot be established
- added focused tests for the resolver and hardened TerraPrime popup behavior

## Proof

Validation commands executed after the code change:

- `pnpm vitest run frontend/apps/os-shell/src/__tests__/security/trustedShellUrl.test.ts frontend/apps/os-shell/src/__tests__/suites/TerraPrimeSuite.test.tsx`
  - result: `2` files passed, `19` tests passed, `0` failed
- `pnpm run type-check`
  - result: pass
- `node --test os-platform/core/tests/phase83-tools.test.mjs`
  - result: `56` passed, `0` failed
- `pnpm run security:scan:frontend`
  - result: pass, `18` findings total
- direct SARIF extraction from the fresh frontend report
  - result: `PWAShell.tsx`, `ProfessionalDashboard.tsx`, `TerraPrimeSuite.tsx`, and `trustedShellUrl.ts` no longer appear in the current report
- `pnpm run security:scan`
  - result: pass, governed-core lane restored at `69` findings
- `pnpm run security:check`
  - result: pass, ratified governed-core ceiling unchanged

## Current Truth

The shell now fails closed on untrusted iframe and popup URLs instead of handing raw module URLs directly to browser sinks.

The strongest frontend shell review lane identified in the earlier triage is therefore implemented, tested, and no longer present in the fresh frontend Snyk report.

## Residual Risk

The frontend-only report still contains `18` total findings, but the remaining hits are outside the patched URL-host surfaces and remain the previously classified timer/download/test-pattern noise until a separate bounded lane proves otherwise.

## Truth Statement

The shell-host URL provenance follow-up is no longer a pending review recommendation.

It is now a completed, repo-evidenced security hardening slice with passing targeted tests, passing required gates, a restored governed-core baseline, and no fresh frontend Snyk matches on the patched files.