# Enforcement Seal Audit Record

**Date**: 2026-01-16  
**Repository**: bsvalues/terrafusion_os_1.0  
**Branch**: main  
**Posture**: Option A — Government-Grade w/ Controlled Break-Glass

---

## API Verification Output

**Required status check context (API):** `["scope-drift-guard"]`

```json
{
  "enforce_admins": false,
  "required_status_checks": [
    "scope-drift-guard"
  ],
  "strict": true
}
```

**Command used:**
```powershell
gh api "repos/bsvalues/terrafusion_os_1.0/branches/main/protection" --jq "{required_status_checks: .required_status_checks.contexts, strict: .required_status_checks.strict, enforce_admins: .enforce_admins.enabled}"
```

**Executed at:** 2026-01-16T~16:00 (local time, US Pacific)

---

## Protection Settings Summary

| Setting | Value | Effect |
|---------|-------|--------|
| **Required Check** | `scope-drift-guard` | No merge without passing CI |
| **Strict** | `true` | PR must be up-to-date with `main` before merge |
| **Enforce Admins** | `false` | Break-glass allowed (audit required) |

---

## Enforcement Chain

1. **Pre-install**: `node scripts/ci/toolingPreflight.js` — pnpm pins, vitest isolation
2. **Post-install**: `pnpm run ci:scope-proof` — classifier tests + drift guard
3. **Merge gate**: GitHub requires `scope-drift-guard` ✅ before merge
4. **Stale protection**: `strict=true` requires rebase/update before merge

---

## Break-Glass Protocol

Per `docs/ci/GOVERNANCE_LOCK_RUNBOOK.md`:

- Admin bypass allowed (`enforce_admins=false`)
- Requires: Audit note + screenshot in `docs/ci/audits/`
- Scope Drift bypass **STRONGLY DISCOURAGED**

---

## Screenshot

> **TODO**: Attach screenshot of GitHub Branch Protection settings page showing:
> - "Require status checks to pass before merging" ✅
> - "scope-drift-guard" listed as required check
> - "Require branches to be up to date before merging" ✅

---

## Audit Line

```
OPTION_A_ENFORCEMENT_SEALED: 2026-01-16
  required_check=scope-drift-guard
  strict=true
  enforce_admins=false
  break_glass=audit_note+screenshot
```
