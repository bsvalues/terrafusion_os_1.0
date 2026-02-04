# Developer Velocity Lane: Kickoff

**Lane:** Option 1 - Developer Velocity  
**Goal:** CI time < 5 min consistent, local loop < 30s  
**Date:** 2026-02-04  
**Status:** ACTIVE

---

## Current State Baseline

### CI Gate: seal-gate-fast.yml

**Target:** 3-8 minutes (currently unknown - needs baseline)  
**Critical Path:** Must measure actual runtime per job

**Job Graph (from workflow):**
```
classify (2 min timeout)
  ├─> frontend-fast (8 min timeout) [if not skipped]
  ├─> backend-fast (8 min timeout) [if not skipped]
  └─> governance-fast (5 min timeout) [if not skipped]
        └─> seal (2 min timeout) [always runs]
```

**Known Steps (identify slow ones):**

**Frontend-fast job:**
1. Checkout
2. pnpm setup + install (frozen lockfile)
3. Lint (non-blocking until 2026-02-15)
4. Type check (blocking)
5. Unit tests (blocking)
6. IPC tests (blocking)
7. Build (blocking)
8. Bundle analysis (blocking)

**Backend-fast job:**
1. Checkout
2. .NET setup
3. NuGet cache restore
4. dotnet restore
5. dotnet build (warnings-as-errors)
6. dotnet test (unit only, no DB)

**Governance-fast job:**
1. Checkout
2. pnpm setup + install
3. Workspace sanity check
4. Governance enforcement (AGENTS.md compliance)
5. Drift guard (dotnet canonical enforcement)
6. OS Core typecheck (if exists)
7. Scope classifier (optional)
8. Critical files verification

---

## Measurement Phase (Commit 1)

### Task 1.1: Capture Baseline Timing
**Done When:** JSON artifact with per-job, per-step timing from last 5 runs

```powershell
# Option A: GitHub CLI (if authenticated)
gh run list --workflow=seal-gate-fast.yml --limit 5 --json databaseId,conclusion,createdAt
gh run view <run-id> --log  # Extract job timings

# Option B: Manual (GitHub UI)
# Navigate to: Actions > 🔒 TerraFusion Seal Gate (fast) > Recent runs
# Screenshot or record:
#   - Total workflow duration
#   - classify job duration
#   - frontend-fast job duration
#   - backend-fast job duration
#   - governance-fast job duration
#   - seal job duration
```

**Output:** `docs/ops/ci-timing-baseline.json`

**Example structure:**
```json
{
  "measured_at": "2026-02-04T00:00:00Z",
  "workflow": "seal-gate-fast.yml",
  "runs": [
    {
      "run_id": "123456",
      "conclusion": "success",
      "total_duration_sec": 420,
      "jobs": {
        "classify": { "duration_sec": 45 },
        "frontend-fast": { "duration_sec": 180 },
        "backend-fast": { "duration_sec": 150 },
        "governance-fast": { "duration_sec": 90 },
        "seal": { "duration_sec": 30 }
      },
      "critical_path": "frontend-fast"
    }
  ],
  "analysis": {
    "bottleneck": "frontend-fast",
    "cache_effectiveness": "unknown",
    "parallelization": "good (jobs run concurrently)"
  }
}
```

---

## Optimization Phase (Commit 2+)

### Likely Hotspots (predict before measuring)

1. **pnpm install** (happens 2x: frontend + governance)
   - **Fix:** Verify pnpm cache is working (`cache: pnpm` in actions/setup-node)
   - **Fix:** Consider workspace-level install once, then run tests from workspace root

2. **dotnet restore** (backend)
   - **Fix:** Verify NuGet cache is working
   - **Fix:** Consider using `--locked-mode` or `--no-restore` on later steps

3. **Frontend build** (blocking, likely slow)
   - **Fix:** Incremental builds if vite/rollup supports
   - **Fix:** Production vs dev build mode (use dev for CI gate)

4. **Multiple checkouts** (4 checkouts total)
   - **Fix:** Consider shared workspace + job artifacts
   - **Fix:** Use `fetch-depth: 1` (shallow clone) if not already

5. **Lint** (non-blocking until 2026-02-15, but still runs)
   - **Fix:** Move to nightly after escape hatch expires
   - **Fix:** Consider pre-commit hook enforcement instead of CI

### Optimization Candidates (ordered by likely impact)

| Optimization | Expected Savings | Effort | Risk |
|--------------|------------------|--------|------|
| Shared pnpm install | 30-60s | LOW | LOW |
| Shallow clone all jobs | 10-20s | LOW | LOW |
| Frontend dev build (not prod) | 60-120s | MEDIUM | MEDIUM |
| Parallel lint (don't wait) | 0s (already non-blocking) | LOW | LOW |
| Cache .NET NuGet properly | 20-40s | LOW | LOW |
| Move lint to nightly | 30-60s | LOW | LOW |
| Workspace root install | 30-60s | MEDIUM | MEDIUM |

**Target Achievement Path (example):**
- Baseline: 420s (7 min) - FAILS target
- After shallow clones: 400s (6.7 min)
- After shared pnpm: 340s (5.7 min)
- After dev build: 220s (3.7 min) - **HITS target** ✅

---

## Local Loop Optimization

**Current unknown. Measure:**
```powershell
Measure-Command { pnpm run type-check } | Select-Object TotalSeconds
Measure-Command { node --test os-platform/core/tests/phase83-tools.test.mjs } | Select-Object TotalSeconds
```

**Target:**
- `pnpm run type-check`: < 20s
- `phase83-tools`: < 5s
- **Total local gate:** < 30s

**Optimization Candidates:**
- TypeScript incremental builds (tsconfig `incremental: true`)
- Test targeting (run only changed tests locally, full suite in CI)
- Pre-push git hook (run gates before push, not after)

---

## Success Criteria (Lane Complete)

- [ ] CI timing baseline captured (JSON artifact)
- [ ] At least 2 optimizations implemented
- [ ] `seal-gate-fast.yml` consistently < 5 min (3+ successful runs)
- [ ] Local loop < 30s (measured)
- [ ] Before/after evidence documented
- [ ] All gates still PASS:
  - [ ] `pnpm run type-check`
  - [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs`
  - [ ] No Zone A paths touched
  - [ ] CI green

---

## Commands (Quick Reference)

### CI Timing Baseline
```powershell
# If gh CLI available:
gh run list --workflow=seal-gate-fast.yml --limit 5

# Manual fallback:
# Visit: https://github.com/<org>/<repo>/actions/workflows/seal-gate-fast.yml
```

### Local Timing Baseline
```powershell
# Measure current state
Measure-Command { pnpm run type-check } | Select-Object TotalSeconds
Measure-Command { node --test os-platform/core/tests/phase83-tools.test.mjs } | Select-Object TotalSeconds

# After optimizations, re-measure and compare
```

### Implementation Test Loop
```powershell
# After each change:
pnpm run type-check  # Must pass
node --test os-platform/core/tests/phase83-tools.test.mjs  # Must pass
git diff --name-only | grep -E '^docs/ops/WAVE_1'  # Must be empty
```

---

## Next Step

**RIGHT NOW:** Capture baseline timing.

**Option A (GitHub CLI):**
```powershell
gh auth status  # Check if authenticated
gh run list --workflow=seal-gate-fast.yml --limit 1 --json databaseId,conclusion,createdAt,url
# Pick a successful run, view logs, extract timings
```

**Option B (Manual):**
1. Open GitHub Actions tab
2. Find last successful `seal-gate-fast.yml` run
3. Record per-job timings
4. Create `docs/ops/ci-timing-baseline.json`

Once baseline exists:
```powershell
git add docs/ops/ci-timing-baseline.json
git commit -m "test(ci): baseline seal-gate-fast timing for velocity lane"
```

Then implement first optimization (likely: shallow clones or shared pnpm).

---

*Government. Transcended.*
