# Snyk Frontend Scan Lane

Date: 2026-03-22
Status: PASS
Owner lane: core pilot ops
Purpose: Extend the repo-owned Snyk runner so frontend shell honesty slices can use a truthful first-party scan path without redefining the ratified governed-core baseline.

## Scope

This infrastructure slice was intentionally limited to the repo-owned scan contract and its release evidence:

- `tools/registry/security-scan-runner.mjs`
- `package.json`
- `os-platform/core/pilot/ops/snyk-cli-canonical-scan-path-2026-03-21.md`
- `os-platform/core/pilot/ops/post-phase25-release-authorization-packet-2026-03-19.md`

No frontend UI code, Snyk baseline ceilings, or CI failure policy were changed in this slice.

## Change Summary

- The default `pnpm run security:scan` command remains the governed-core scan lane.
- The repo-owned runner now accepts explicit frontend-capable target selection.
- `pnpm run security:scan:frontend` now scans `frontend/apps/os-shell` only.
- `pnpm run security:scan:first-party` now scans the governed core lane plus `frontend/apps/os-shell`.
- The canonical scan note now states that frontend shell scans are opt-in and do not redefine the ratified core baseline.

## Verification

Bounded verification was executed on 2026-03-22.

Results:

- `pnpm run security:scan` = `PASS (exit 0; governed-core targets only; 69 findings)`
- `pnpm run security:check` = `PASS (governed-core baseline enforcement still passes after the runner extension)`
- `pnpm run security:scan:frontend` = `PASS (exit 0; frontend/apps/os-shell only; 18 findings)`
- `pnpm run security:scan:first-party` = `PASS (exit 0; governed core plus frontend/apps/os-shell; 87 findings)`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `PASS`

## Truth Statement

This slice adds a truthful frontend-capable scan path for future frontend work.

It does not change the ratified governed-core warning ceiling, and it does not by itself authorize any new production traffic posture.