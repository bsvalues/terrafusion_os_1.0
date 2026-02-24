# PR #398 Vault Auto-Merge Forensic Note

**Date:** 2026-02-23
**Author:** GitHub Copilot + bsvalues (co-founder)

## Summary

PR #398 (`rescue/sync-2026-02-23` → `main`) shows as **MERGED** on GitHub,
but this is a **cosmetic auto-merge** — no frontend content landed on `main`.

## What happened

1. PR #399 (`rescue/core-landing-2026-02-23` → `main`) was the real landing craft.
2. `rescue/core-landing-2026-02-23` was branched from `rescue/sync-2026-02-23` (the vault branch) with frontend changes reverted.
3. When GitHub merged #399, `rescue/sync-2026-02-23` became a git ancestor of `main`.
4. GitHub auto-closed PR #398 as "merged" because the branch tip was reachable from `main`.

## Verification

```
main before merge: 4abe2b169
main after merge:  852ef7029

git diff --name-only 4abe2b169..852ef7029 -- "frontend/apps/"
→ 0 files changed

git merge-base --is-ancestor origin/rescue/sync-2026-02-23 origin/main
→ exit 0 (yes, ancestor — but only because of shared git history, not content)
```

**377 files** actually changed on `main`: all `os-platform/core/` tests, governance tooling, and infrastructure. **Zero** `frontend/apps/` files.

## Dragon pile location

The 319 frontend files (110 TSX, 148 TS, 64 CSS) remain available on:

- **Branch:** `rescue/sync-2026-02-23`
- **Status:** preserved, do not delete

## Future extraction (if needed)

Use file-scoped checkout from the vault branch into a new small PR:

```powershell
git switch main
git switch -c extract/canon-trace-pilot
git checkout origin/rescue/sync-2026-02-23 -- frontend/apps/os-shell/src/canon
git checkout origin/rescue/sync-2026-02-23 -- frontend/apps/os-shell/src/components/pilot
# Add minimal router wiring as needed
git commit -m "feat(terracanon): extract canon/trace/pilot operator surface"
git push -u origin extract/canon-trace-pilot
```

**Extraction shortlist:**
- `frontend/apps/os-shell/src/canon/**`
- Trace UI page(s)
- Minimal router wiring
- NO CSS sweeps, NO global token sweeps
