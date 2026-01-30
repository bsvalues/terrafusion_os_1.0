# TerraFusion CI/CD Green Main - Execution Checklist

**Date:** 2026-01-21  
**Agent:** TerraFusion Elite Government OS Engineering Agent  
**Mission:** Achieve green CI on main branch  
**Approach:** Evidence-based, no assumptions, do it right the first time

---

## Pre-Execution Status

| Workflow | Failure Reason | Fix Type |
|----------|----------------|----------|
| Frontend CI (isolated) | Gitlinks detected (mode 160000) | Repo cleanup |
| Accessibility Tests | `aria-selected` invalid on `role="button"` | Code fix |
| Performance Budget | Vite preview port mismatch (3000 vs 4173) | Config fix |
| SBOM Generation | Missing nginx.conf in Dockerfile context | Dockerfile fix |
| Security/Slack | Missing secret guard | Workflow fix |

---

## PHASE 1: Code Fixes (Already Applied by Claude)

- [x] **DesktopIcon.tsx** - Changed `aria-selected` to `aria-pressed`
  - File: `frontend/apps/os-shell/src/shell/desktop/DesktopIcon.tsx`
  - Line: 99
  - Status: ✅ DONE

- [x] **vite.config.ts** - Fixed preview port from 3000 to 4173
  - File: `frontend/vite.config.ts`
  - Line: 118
  - Status: ✅ DONE

- [x] **Dockerfile.frontend** - Fixed nginx.conf path
  - File: `Dockerfile.frontend`
  - Line: 29
  - Status: ✅ DONE

- [x] **sbom.yml** - Added secret guard to Slack notification
  - File: `.github/workflows/sbom.yml`
  - Line: 502
  - Status: ✅ DONE

---

## PHASE 2: Gitlink Cleanup (Requires Manual Execution)

### Option A: Run the Script (Recommended)

```powershell
# Dry run first to see what will happen
.\scripts\cleanup-gitlinks-surgical.ps1 -DryRun

# Execute the cleanup
.\scripts\cleanup-gitlinks-surgical.ps1
```

### Option B: Manual Commands

```bash
# Step 1: Verify current gitlinks
git ls-files -s | awk '$1==160000{print $4}'

# Step 2: Create destination for AI Ethics implementation
mkdir -p governance/ai-ethics-board/implementation

# Step 3: Move AI Ethics Governance (valuable content)
cp -r packages/shock-and-awe/ai_systems/ai-ethics-governance/* governance/ai-ethics-board/implementation/
git add governance/ai-ethics-board/implementation/

# Step 4: Remove gitlinks from index
git ls-files -s | awk '$1==160000{print $4}' | xargs -I{} git rm --cached "{}"

# Step 5: Delete .gitmodules
rm .gitmodules
git add .gitmodules

# Step 6: Delete modules/ directory
rm -rf modules/
git add modules/

# Step 7: Delete shock-and-awe cruft
rm -rf packages/shock-and-awe/
git add packages/shock-and-awe/

# Step 8: Verify no gitlinks remain
git ls-files -s | awk '$1==160000{print $4}'
# Should output NOTHING
```

---

## PHASE 3: Verification Checklist

Run these checks before committing:

- [ ] `git ls-files -s | awk '$1==160000'` returns **empty** (zero gitlinks)
- [ ] `governance/ai-ethics-board/implementation/` exists with Python files
- [ ] `.gitmodules` does **not** exist
- [ ] `modules/` directory does **not** exist
- [ ] `packages/shock-and-awe/` does **not** exist
- [ ] `SDK/modules/` still exists (untouched)
- [ ] `git diff --cached --stat` shows expected changes

---

## PHASE 4: Commit

```bash
git commit -m "fix(ci): resolve workflow failures for green main

Code Fixes:
- fix(a11y): aria-selected → aria-pressed on DesktopIcon
- fix(ci): Vite preview port 3000 → 4173
- fix(docker): nginx.conf path in Dockerfile.frontend  
- fix(ci): add secret guard to SBOM Slack notification

Repo Cleanup:
- Relocated AI Ethics implementation to governance/ai-ethics-board/implementation/
- Removed broken gitlinks (mode 160000) from git index
- Deleted .gitmodules (11 orphaned submodule definitions)
- Deleted modules/ (broken stubs; real modules in SDK/modules/)
- Deleted packages/shock-and-awe/ (web demo cruft)

Verified:
- Zero gitlinks remaining
- AI Ethics Python tooling preserved
- SDK/modules/ untouched

Fixes: Frontend CI, Accessibility, Performance Budget, SBOM workflows"
```

---

## PHASE 5: Push and Verify

```bash
# Push to main
git push origin main

# Monitor CI
# https://github.com/bsvalues/TerraFusionOS/actions
```

### Expected CI Results

| Workflow | Expected Result |
|----------|-----------------|
| Frontend CI (isolated) | ✅ PASS (no gitlinks) |
| Accessibility Tests | ✅ PASS (aria-pressed valid) |
| Performance Budget | ✅ PASS (port 4173) |
| SBOM Generation | ✅ PASS (nginx.conf found) |
| Security Scanning | ⏭️ SKIP (no secrets configured) |

---

## Rollback Plan (If Needed)

```bash
# If something goes wrong, reset to HEAD~1
git reset --hard HEAD~1
git push --force origin main
```

---

## Post-Execution Verification

- [ ] All CI workflows pass (or skip cleanly)
- [ ] `governance/ai-ethics-board/implementation/` is accessible
- [ ] No broken imports or references
- [ ] pnpm install still works
- [ ] Frontend builds successfully

---

**THE TERRAFUSION WAY:** No shortcuts. Evidence-based. Done right the first time.
