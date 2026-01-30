# Phase 4B: Telemetry Stack Slicing Plan

## Overview

Phase 4B introduced telemetry, sentinel, and system health infrastructure to TerraFusion OS. The initial implementation was shipped as a single mega-PR (#198). This document defines the **retroactive slicing plan** to establish reviewable, atomic units for future reference and to prevent future mega-diffs.

## Slicing Philosophy

1. **One concern per PR** - Each slice touches a single domain
2. **No behavior change across slices** - Slices are already merged; these are organizational checkpoints
3. **Deterministic file sets** - Each slice has explicit path ownership
4. **Independent review anchors** - Each slice can be reviewed/referenced in isolation

## Slice Sequence

| Slice | Branch | Scope | Files |
|-------|--------|-------|-------|
| 0 | `phase4b/organize-telemetry-stack` | Meta/docs | `docs/phase4b/**` |
| 1 | `phase4b/slice-1-ci-gates` | CI/Gates | `.github/workflows/**`, `tools/spec-gates/**`, `scripts/spec-gates/**`, `tools/registry/**` |
| 2 | `phase4b/slice-2-policy-contracts` | Policy schemas | `policy/contracts/**` |
| 3 | `phase4b/slice-3-backend-telemetry` | Backend API | `backend/src/TerraFusion.API/**`, `backend/tests/**` (telemetry-related) |
| 4 | `phase4b/slice-4-os-shell-sentinel` | OS Shell sentinel | `frontend/apps/os-shell/src/sentinel/**`, `frontend/apps/os-shell/src/ipc/**` |
| 5 | `phase4b/slice-5-ui-ambient` | Ambient UI | `frontend/apps/os-shell/src/components/ambient/**` |
| 6 | `phase4b/slice-6-app-updates` | App module updates | `applications/**` (terrafusion.app.json manifests) |

## Invariants (The TerraFusion Way)

### Test Runner Separation

- **Jest**: Runs `*.test.ts(x)` files in configured roots
- **Vitest**: Runs `*.vitest.test.ts` files (excluded from Jest via `testPathIgnorePatterns`)
- **Never cross-run**: Each file belongs to exactly one runner

### CI/Gate Contracts

- **SEAL Gate** (`seal-gate-fast.yml`): The ONE required check for PR merges
- **Classify → Gates → SEAL pattern**: Fast-path classification determines which gates run
- **Target**: 3-8 minutes max for full SEAL pass

### Files Fixed During #198 Stabilization

| Issue | Fix |
|-------|-----|
| `actions/cache` deprecated SHA | Updated to `@v4` tag |
| Jest `--passWithNoTests` as pattern | Moved flag to `package.json` script |
| Vitest files run by Jest | Renamed to `*.vitest.test.ts` |
| Next.js 16.0.3 CVE (RCE) | Updated to 16.0.7 |

## Automation

Use `pnpm tf:slice <n>` to auto-generate slice branches (see `tools/dev/tf-slice.mjs`).

## Success Criteria

- [ ] All 6 slices created as branches
- [ ] Each slice builds and tests independently
- [ ] Future changes follow this slice pattern
- [ ] No future PR exceeds 500 lines without explicit approval

---

*Phase 4B Slicing Plan - Established 2026-01-30*
