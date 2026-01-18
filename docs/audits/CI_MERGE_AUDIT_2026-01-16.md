# CI Merge Audit - 2026-01-16

## PR #129 (lockfile-sync) Merge Event

**Action**: Merged "vitest isolation" changes (originally tracking for PR #130) as part of PR #129 to unblock CI.

**Reason**:
* CI determinism ("Scope Drift Guard") required fixed lockfile status.
* PR #130 logic was required to pass checks on #129 branch.
* Decision made to bundle vitest isolation into #129 for a clean, deterministic merge to main.

**Outcome**:
* `fix/lockfile-sync` merged to `main`.
* Includes scope classifier config changes to quarantine backup folders (e.g., `Dev - Copy`).
* PR #130 is functionally merged via #129.

**Verification**:
* `pnpm install --frozen-lockfile`: PASS
* `pnpm -C tools/scope-classifier test`: PASS
* `pnpm tf:scope`: PASS
* `git diff --exit-code`: PASS (Clean state)
