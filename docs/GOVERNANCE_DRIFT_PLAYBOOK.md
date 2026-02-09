# Governance Drift Playbook

**Purpose**: Operator guide for debugging governance deadlocks and context name mismatches

**Last Updated**: 2026-02-09 (v1.0.0 dual governance resolution)

---

## Overview

TerraFusion OS uses **dual-layer governance** to enforce code quality:

1. **Classic Branch Protection** (`/repos/.../branches/main/protection`)
   - 5 required contexts with exact names
   - Configured via GitHub API
   - Enforcement: `enforce_admins: true`, `strict: true`

2. **GitHub Repository Rules** (`/repos/.../rulesets`)
   - Separate ruleset system (newer GitHub feature)
   - Required context: `🔒 SEAL` (legacy name)
   - Discovery: Ruleset ID 11126105

**Critical Pattern**: Both layers must be satisfied simultaneously. If context names drift, merge deadlocks even when all checks are GREEN.

---

## Symptom: "Expected check never reported"

### Manifestation
- PR shows "Merging is blocked - Required status check X is expected"
- Workflow runs successfully, shows green checkmark
- Check never shows in "Required Checks" section

### Root Cause Chain
1. **Context name mismatch**: Workflow job name ≠ branch protection context name
2. **Path filters on required checks**: Check only runs on specific file patterns, skips on others
3. **Dual governance mismatch**: Branch Protection satisfied, but Repository Rules expecting different name

### Diagnostic Steps

#### Step 1: Verify exact context names
```bash
# Get configured required contexts from Branch Protection
gh api /repos/bsvalues/terrafusion_os_1.0/branches/main/protection \
  --jq '.required_status_checks.contexts'

# Expected output:
# [
#   "phase85-tools",
#   "phase86-toolrunner",
#   "governed-spine",
#   "🔒 TerraFusion Seal Gate",
#   "🧪 Tier-1 UI Harness Validation"
# ]

# Check Repository Rules (newer governance layer)
gh api /repos/bsvalues/terrafusion_os_1.0/rulesets -X GET | \
  jq '.[] | select(.name | contains("main")) | {id, name, conditions}'

# Look for required_status_checks in ruleset conditions
```

#### Step 2: Verify workflow job names
```bash
# Check SEAL workflow job name
grep -A 2 'jobs:' .github/workflows/seal-gate-fast.yml | grep 'name:'

# Expected: name: 🔒 TerraFusion Seal Gate  (PRIMARY)
# Expected: name: 🔒 SEAL  (LEGACY for Repository Rules)

# Check Tier-1 workflow job name  
grep -A 2 'jobs:' .github/workflows/tier1-ui-harness.yml | grep 'name:'

# Expected: name: 🧪 Tier-1 UI Harness Validation
```

**Key Rule**: Job `name:` field in workflow YAML MUST match branch protection context EXACTLY (including emojis, spelling, spacing)

#### Step 3: Check for path filters
```bash
# Path filters cause conditional skips → "expected but never reported"
grep -A 5 'pull_request:' .github/workflows/tier1-ui-harness.yml

# ❌ FORBIDDEN (causes deadlock):
# pull_request:
#   branches: [main]
#   paths:  # <-- conditional trigger
#     - 'frontend/**'

# ✅ CORRECT (universal):
# pull_request:
#   branches: [main]  # <-- no paths filter
```

**Constitutional Rule**: Required checks CANNOT have path filters. They must run on ALL PRs targeting protected branches.

#### Step 4: Check for dual governance deadlock
```bash
# If all Branch Protection checks are GREEN but merge still blocked:
# - Check Repository Rules for legacy context requirement

# Verify seal-gate-fast.yml emits BOTH contexts:
grep -E 'name: 🔒.*SEAL' .github/workflows/seal-gate-fast.yml

# Expected 2 matches:
# 1. name: 🔒 TerraFusion Seal Gate  (primary job - Branch Protection)
# 2. name: 🔒 SEAL  (legacy job - Repository Rules)
```

### Fix Patterns

#### Fix 1: Context name mismatch
```yaml
# BEFORE (mismatch):
jobs:
  seal:
    name: 🔒 SEAL Gate  # ❌ Branch Protection expects "TerraFusion Seal Gate"

# AFTER (aligned):
jobs:
  seal:
    name: 🔒 TerraFusion Seal Gate  # ✅ Exact match
```

**Commit Example**: `3fd979628` (PR #262)

#### Fix 2: Path filter on required check
```yaml
# BEFORE (conditional):
on:
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'  # ❌ Skips non-frontend PRs

# AFTER (universal):
on:
  pull_request:
    branches: [main]  # ✅ No path filter
```

**Commit Example**: `6a6439608` (PR #262)

#### Fix 3: Dual governance compatibility
```yaml
# Add legacy job that inherits primary result:
jobs:
  seal:
    name: 🔒 TerraFusion Seal Gate  # Branch Protection requirement
    # ... actual gate logic ...

  seal-legacy:
    name: 🔒 SEAL  # Repository Rules requirement
    needs: [seal]
    if: always()
    steps:
      - run: |
          if [ "${{ needs.seal.result }}" == "success" ]; then
            exit 0
          else
            exit 1
          fi
```

**Commit Examples**: `133eac499`, `186d20008` (PR #262)

---

## Symptom: "Pull request is not mergeable"

### Manifestation
- GitHub API returns: `"mergeable": false, "mergeStateStatus": "BLOCKED"`
- All visible checks are GREEN
- Direct push attempt returns: `GH013: Repository rule violations found`

### Root Cause
Repository Rules layer blocking despite Branch Protection satisfied. Most common cause: legacy context name missing.

### Diagnostic Steps
```bash
# Check PR status via API
gh pr view 262 --json mergeStateStatus,statusCheckRollup

# If "BLOCKED" with all checks SUCCESS:
# - Check for missing legacy SEAL context
gh pr view 262 --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name | contains("SEAL"))'

# Expected 2 results:
# 1. {"name": "🔒 TerraFusion Seal Gate", "conclusion": "SUCCESS"}
# 2. {"name": "🔒 SEAL", "conclusion": "SUCCESS"}

# If only 1 result: Add seal-legacy job pattern (Fix 3 above)
```

---

## Symptom: Grep guard false positives

### Manifestation
- Tier-1 workflow fails at "Guard against expect(value, message) smell" step
- Flagged code is actually valid (e.g., `expect([a, b]).toContain(item)`)

### Root Cause
Grep pattern complexity with shell escaping causes false positives.

### Fix Pattern
```yaml
# BEFORE (complex regex with nested quotes):
if grep -Rn -E 'expect\([^[\{]+,\s*["`'\''][^)`'\'']*["`'\'\']\s*\);' ...
# ❌ Shell EOF errors, false positives on arrays

# AFTER (simplified - double-quote only):
if grep -Rn -E 'expect\([^[{]+, *"[^"]*"\);' ...
# ✅ Reliable, no shell escaping issues
# Trade-off: Single quotes/backticks not caught (acceptable - manual review)
```

**Commit Examples**: `777c4e9a8` (failed), `9bb7748da` (success) - PR #262

**Key Learning**: YAML → bash quote escaping is fragile. Prefer simple patterns over complex regex.

---

## Symptom: Strict mode not working

### Manifestation
- PR behind `main` (outdated) merges successfully
- Expected: Merge blocked until PR updated

### Diagnostic Steps
```bash
# Check strict mode configuration
gh api /repos/bsvalues/terrafusion_os_1.0/branches/main/protection \
  --jq '.required_status_checks.strict'

# Expected: true
# If false or null: Strict mode not enabled
```

### Fix
```bash
# Apply strict mode via API
gh api /repos/bsvalues/terrafusion_os_1.0/branches/main/protection \
  --method PUT \
  --input .tmp/protection.json  # See DURABILITY_MEASURES.md for full config

# Verify
gh api /repos/bsvalues/terrafusion_os_1.0/branches/main/protection \
  --jq '{strict: .required_status_checks.strict, enforce_admins: .enforce_admins.enabled}'
```

### Empirical Test
```bash
# Create test PR
git checkout -b test/strict-mode
echo "# Test" >> README.md
git commit -m "test: strict mode verification"
git push origin test/strict-mode
gh pr create --title "test: strict mode" --body "Should block until updated"

# Create divergence (commit to main)
git checkout main
echo "# Diverge" >> CHANGELOG.md
git commit -m "chore: create divergence"
git push origin main

# Attempt merge (should be blocked)
gh pr view <PR_NUMBER> --json mergeStateStatus
# Expected: "BLOCKED" with message about outdated branch
```

---

## Context Name Reference (Canonical)

| Context Name | Workflow | Job Name | Layer |
|--------------|----------|----------|-------|
| `phase85-tools` | `ci.yml` (legacy) | phase85-tools | Branch Protection |
| `phase86-toolrunner` | `ci.yml` (legacy) | phase86-toolrunner | Branch Protection |
| `governed-spine` | `ci.yml` (legacy) | governed-spine | Branch Protection |
| `🔒 TerraFusion Seal Gate` | `seal-gate-fast.yml` | seal (primary) | Branch Protection |
| `🧪 Tier-1 UI Harness Validation` | `tier1-ui-harness.yml` | tier1-harness | Branch Protection |
| `🔒 SEAL` | `seal-gate-fast.yml` | seal-legacy | Repository Rules |

**Critical Rule**: To change context name:
1. Update workflow job `name:` field
2. Update branch protection via API
3. Update Repository Rules via GitHub UI (if applicable)
4. Update this table
5. Test on non-critical PR before applying to main

**DO NOT** rename contexts without coordination between all three systems (workflow + Branch Protection + Repository Rules).

---

## Quick Reference: Common Commands

### Check protection status
```bash
gh api /repos/bsvalues/terrafusion_os_1.0/branches/main/protection \
  --jq '{admins: .enforce_admins.enabled, strict: .required_status_checks.strict, contexts: .required_status_checks.contexts}'
```

### List workflow runs for PR
```bash
gh pr view <PR_NUMBER> --json statusCheckRollup --jq '.statusCheckRollup[] | {name, conclusion}'
```

### Test direct push block
```bash
git commit --allow-empty -m "test: verify protection"
git push origin main --no-verify
# Expected: GH013 rejection
```

### Trigger governance audit manually
```bash
gh workflow run governance-audit.yml --ref main
gh run list --workflow governance-audit.yml --limit 1
```

---

## Escalation Path

If governance deadlock persists after following this playbook:

1. **Gather evidence**:
   ```bash
   gh api /repos/bsvalues/terrafusion_os_1.0/branches/main/protection > protection.json
   gh pr view <PR_NUMBER> --json statusCheckRollup > pr-checks.json
   gh run list --workflow seal-gate-fast.yml --limit 5 > recent-runs.txt
   ```

2. **Check for recent workflow changes**:
   ```bash
   git log --oneline --since="1 week ago" -- .github/workflows/
   ```

3. **Review PR #262** (governance rollout reference):
   - Commits: `4d99ceb12` → `186d20008`
   - Fixes applied: context name alignment, path filters, dual governance
   - GitHub URL: https://github.com/bsvalues/terrafusion_os_1.0/pull/262

4. **Consult canonical documentation**:
   - `DURABILITY_MEASURES.md` - Branch protection configuration
   - `AGENTS.md` - Governance rules and forbidden paths
   - `.github/copilot-instructions.md` - AI agent guidelines

---

## Related Documentation

- [DURABILITY_MEASURES.md](../DURABILITY_MEASURES.md) - Branch protection configuration
- [AGENTS.md](../AGENTS.md) - Governance rules and constitutional enforcement
- [.github/workflows/governance-audit.yml](../.github/workflows/governance-audit.yml) - Automated drift detection

---

**Government. Transcended.** 🏛️
