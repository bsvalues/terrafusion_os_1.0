# Branch Protection Audit - Enforcement Sealed

**Date**: 2026-01-16
**Branch**: `main`
**Repository**: `bsvalues/terrafusion_os_1.0`

## Required Status Checks

| Check Name | Status |
|------------|--------|
| `scope-drift-guard` | ✅ Required |

## Protection Settings

```json
{
  "required_status_checks": ["scope-drift-guard"],
  "strict": true,
  "enforce_admins": false
}
```

> **Note**: Run this command to capture live proof:
> ```powershell
> gh api "repos/bsvalues/terrafusion_os_1.0/branches/main/protection" --jq "{required_status_checks: .required_status_checks.contexts, strict: .required_status_checks.strict, enforce_admins: .enforce_admins.enabled}"
> ```

## Break-Glass Policy

- **`strict: true`** — PRs must be up-to-date with `main` before merging
- **`enforce_admins: false`** — Admins can bypass in emergencies (break-glass)

## Governance Pipeline

The `scope-drift-guard` check validates:
1. **Preflight** (`ci:preflight`) — Tooling version locks
2. **CRLF Guard** (`ci:crlf`) — No CRLF in shell scripts  
3. **Scope Classifier** — Dependency scope consistency
4. **Git Diff** — No uncommitted scope drift

## Regression Drill Instructions

To prove blocking works:

1. Create branch: `git checkout -b test/prove-block`
2. Break invariant: Remove `root: __dirname` from `scripts/ci/vitest.config.ts`
3. Push and create PR to `main`
4. Confirm: Merge blocked, error shows `CI_PREFLIGHT_FAIL:`
5. Revert the change
6. Confirm: Check goes green
7. Close PR without merging

---

**Enforcement Status**: ✅ SEALED
