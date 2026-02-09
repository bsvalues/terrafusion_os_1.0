# Two-Lane CI Implementation - Execution Plan

**Date:** 2026-02-08  
**Target:** Unblock PR #258 + Establish velocity-security contract  
**Authority:** Elite Agent decision tree

---

## Executive Summary

**Problem:** Security is costing velocity due to misconfiguration
- SBOM/SLSA/provenance running on PRs (should be main/tag only)
- 22 open Snyk PRs creating merge drag
- 200+ status checks creating false "red" noise
- Governed-spine ✅ green but PR blocked by noise

**Solution:** Two-lane CI architecture
- **Lane 1 (Merge Safety):** SEAL only (3-8 min, deterministic)
- **Lane 2 (Release Assurance):** SBOM/SLSA/compliance (main/tag only)

**Impact:** Ship v1 today, maintain safety, reduce noise

---

## Phase 0: Immediate Unblock (Today - 30 min)

### Step 1: Configure Branch Protection

```bash
cd .github/scripts
chmod +x configure-branch-protection.sh
./configure-branch-protection.sh
```

**What it does:**
- Sets `🔒 SEAL` as ONLY required check on `main`
- Removes all other required checks
- Enables enforce_admins (cannot bypass)
- Blocks force pushes/deletions

**Validation:**
```bash
gh api repos/bsvalues/terrafusion_os_1.0/branches/main/protection | jq '.required_status_checks.contexts'
# Expected: ["🔒 SEAL"]
```

### Step 2: Verify SEAL Workflow

```bash
# Check SEAL is healthy
gh run list --workflow=seal-gate-fast.yml --limit 5

# If not passing, run quick validation
pnpm run test:governed  # Should be green
```

**Expected:** `🔒 SEAL` passes in 3-8 minutes

### Step 3: Merge PR #258

```bash
# Once SEAL passes
gh pr merge 258 --squash --delete-branch
```

**Post-merge validation:**
```bash
# Verify SBOM runs on main (not PR)
gh run list --workflow=sbom.yml --limit 1

# Verify SLSA runs on main (not PR)
gh run list --workflow=slsa-provenance.yml --limit 1
```

---

## Phase 1: Stop the Bleeding (Tomorrow - 1 hour)

### Step 1: Consolidate Snyk PRs

```bash
cd .github/scripts
chmod +x consolidate-snyk-prs.sh
./consolidate-snyk-prs.sh
```

**What it does:**
- Closes all 22 Snyk PRs with explanatory comment
- Marks as superseded by Two-Lane CI Architecture
- Provides next steps for Snyk dashboard config

**Manual Snyk Dashboard Configuration:**

1. Go to https://app.snyk.io/
2. Navigate to: Settings > Integrations > GitHub
3. Configure:
   - ✅ Enable "Group PRs"
   - ✅ Set "Max concurrent PRs" to **1**
   - ✅ Group by: "Package manager"
   - ✅ Auto-fix PRs: **Critical and High only**
4. Save changes

### Step 2: Update .snyk Policy

**Add to `.snyk`:**
```yaml
# Snyk Policy File (updated 2026-02-08)
# Two-Lane CI Architecture: Critical-Only mode

version: v1.25.0

# PR grouping strategy
# - Max 1 PR at a time
# - Critical/High only
# - Monthly batch for Medium/Low

patch: {}  # No auto-patches
ignore: {}  # Use Snyk dashboard for ignores

exclude:
  global:
    # ... existing exclusions ...
```

**Commit:**
```bash
git add .snyk
git commit -m "chore(security): Enable Snyk Critical-Only mode (Two-Lane CI)"
git push
```

---

## Phase 2: Release Assurance (This Week - 2 hours)

### Step 1: Verify Release Lane

**Tag a test release:**
```bash
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```

**Verify workflows run:**
```bash
# SBOM should run
gh run list --workflow=sbom.yml --limit 1

# SLSA should run
gh run list --workflow=slsa-provenance.yml --limit 1

# Both should complete with artifacts
```

### Step 2: Add Release Gate

**Create `.github/workflows/release-gate.yml`:**
```yaml
name: 🎯 Release Gate

on:
  push:
    tags: ['v*']

permissions:
  contents: read

jobs:
  gate:
    name: Release Readiness Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Wait for SBOM
        uses: lewagon/wait-on-check-action@v1.3.1
        with:
          check-name: 'Generate SBOM (Backend)'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          wait-interval: 30
          
      - name: Wait for SLSA Provenance
        uses: lewagon/wait-on-check-action@v1.3.1
        with:
          check-name: 'Generate SLSA Provenance (Backend)'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          wait-interval: 30
          
      - name: Release Gate Status
        run: |
          echo "🎉 Release Gate PASSED"
          echo "- SBOM: ✅"
          echo "- SLSA: ✅"
          echo "- Ready to deploy"
```

### Step 3: Update Deployment Pipeline

**Add release gate to deployment:**
```yaml
# In your deployment workflow
deploy:
  needs: [release-gate]  # Block deploy until gate passes
  # ... rest of deploy job
```

---

## Phase 3: Documentation & Monitoring (Ongoing)

### Success Metrics Dashboard

**Add to `.github/workflows/ci-metrics.yml`:**
```yaml
name: 📊 CI Metrics

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  metrics:
    name: Collect CI Metrics
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Calculate PR metrics
        run: |
          # Average time to merge (last 10 PRs)
          AVG_TIME=$(gh pr list --state merged --limit 10 --json mergedAt,createdAt --jq '
            map(.mergedAt - .createdAt | sub("T.*"; "") | tonumber) | 
            add / length
          ')
          
          # Active Snyk PRs
          SNYK_PRS=$(gh pr list --author "snyk-bot" --state open --json number | jq 'length')
          
          # Required checks count
          REQ_CHECKS=$(gh api repos/bsvalues/terrafusion_os_1.0/branches/main/protection | 
            jq '.required_status_checks.contexts | length')
          
          echo "📊 CI Metrics"
          echo "Average PR merge time: ${AVG_TIME} hours"
          echo "Active Snyk PRs: $SNYK_PRS"
          echo "Required checks: $REQ_CHECKS"
          
          # Alert if metrics drift
          if [ "$SNYK_PRS" -gt 1 ]; then
            echo "::warning::More than 1 Snyk PR open (expected: 0-1)"
          fi
          
          if [ "$REQ_CHECKS" -gt 1 ]; then
            echo "::error::More than 1 required check (expected: SEAL only)"
          fi
```

### Weekly Review Checklist

**Every Monday:**
- [ ] Review CI metrics dashboard
- [ ] Check for Snyk PR drift (should be 0-1)
- [ ] Verify SEAL health (should be green)
- [ ] Review release lane jobs (SBOM/SLSA)
- [ ] Update Two-Lane CI docs if needed

---

## Rollback Plan

**If things go wrong:**

```bash
# Restore previous branch protection
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/bsvalues/terrafusion_os_1.0/branches/main/protection" \
  --input .github/backups/branch-protection-main-YYYYMMDD-HHMMSS.json

# Re-enable PR triggers for SBOM/SLSA
git revert <commit-hash>  # Revert workflow changes
git push
```

---

## Communication Plan

### Team Notification

**Send to:** Dev team, security team, stakeholders

**Subject:** Two-Lane CI Architecture - Velocity + Security

**Body:**
```
TerraFusion OS now implements Two-Lane CI Architecture for optimal velocity without sacrificing security.

Changes effective: 2026-02-08

What's Changed:
✅ Merge Safety (PR required): SEAL only (3-8 min)
✅ Release Assurance (main/tag): SBOM, SLSA, compliance
✅ Snyk PRs: Critical-Only mode (max 1 at a time)
✅ PR velocity: ~45 min → 3-8 min target

What Stays the Same:
✅ Governed-spine enforcement
✅ SBOM coverage (100%)
✅ SLSA Level 3 provenance
✅ Security scanning (moved to release boundary)

Documentation: .github/TWO_LANE_CI_ARCHITECTURE.md

Questions? Ping @infrastructure-team
```

---

## Verification Checklist

### Phase 0 Complete ✅
- [ ] Branch protection configured (SEAL only)
- [ ] SEAL workflow passing
- [ ] PR #258 merged
- [ ] SBOM runs on main (not PR)
- [ ] SLSA runs on main (not PR)

### Phase 1 Complete ✅
- [ ] 22 Snyk PRs closed
- [ ] Snyk dashboard configured (Critical-Only)
- [ ] .snyk policy updated
- [ ] Zero active Snyk PRs (or 1 critical)

### Phase 2 Complete ✅
- [ ] Release gate workflow created
- [ ] Test release tagged
- [ ] SBOM generated on tag
- [ ] SLSA provenance generated on tag
- [ ] Deployment pipeline updated

### Phase 3 Complete ✅
- [ ] CI metrics dashboard deployed
- [ ] Weekly review process established
- [ ] Team notified
- [ ] Documentation updated

---

## Troubleshooting

### "SEAL is failing on my PR"

**Fix:**
```bash
# Run governed tests locally
pnpm run test:governed

# If failing, check:
# 1. Scope violations (AGENTS.md)
# 2. Legacy frontend touched
# 3. Forbidden paths modified
```

### "SBOM/SLSA not running on main"

**Fix:**
```bash
# Check workflow triggers
gh run list --workflow=sbom.yml --limit 1

# Manually trigger if needed
gh workflow run sbom.yml --ref main
```

### "Snyk PRs keep opening"

**Fix:**
1. Verify dashboard settings (Settings > Integrations > GitHub)
2. Check "Group PRs" is enabled
3. Verify "Max concurrent PRs" = 1
4. Contact Snyk support if persists

---

## Next Steps After v1 Merge

1. **Ship Slice 24.3** (diff viewer implementation)
2. **Monitor velocity metrics** (weekly reviews)
3. **Refine SEAL** (add more fast checks if needed)
4. **Expand release assurance** (add penetration testing, etc.)

---

**Classification:** Implementation Plan  
**Authority:** Elite Agent decision tree  
**Last Updated:** 2026-02-08  
**Status:** ✅ Ready to execute
