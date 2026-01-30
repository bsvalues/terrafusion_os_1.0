# Phase 4C: CI Fan-Out Fix - Results

**Date**: 2026-01-30  
**PRs**: #208, #209, #210, #211

## Problem Statement

Docs-only PRs (e.g., a single `.md` file change) triggered **123+ workflow runs**, saturating the CI queue and delaying the required SEAL gate.

## Solution

1. **Paths filters** on 16 heavy workflows
2. **Docs Fast Lane** workflow with git-diff optimization
3. **SEAL docs-only fast pass** to skip unnecessary jobs

## Before/After Metrics

| Metric | Before | After |
|--------|--------|-------|
| Workflows on docs-only PR | 123+ | 2-3 |
| SEAL time (docs-only) | 3-8 min | ~15 sec |
| Docs Fast Lane time | N/A | <10 sec |
| Queue pressure | Saturated | Normal |

## Workflows Updated (PR #208)

Added `paths:` filters to prevent triggering on docs-only changes:

- `ci-cd-main.yml`
- `testing.yml`
- `e2e-smoke.yml`
- `build-validation.yml`
- `ai-swarm-safety.yml`
- `security-compliance.yml`
- `sbom.yml`
- `accessibility.yml`
- `terrafusion-ci-cd-production.yml`
- `ci.yml`
- `governance-proof.yml`
- `code-intel.yml`
- `baseline-guard.yml`
- `slsa-provenance.yml`
- `spec-gates.yml`
- `tag-lint.yml`

## Docs Fast Lane (PRs #209, #210)

**File**: `.github/workflows/markdown-lint.yml`

Key features:
- Lints ONLY changed markdown files (not entire repo)
- Concurrency group cancels stale runs
- Soft-fail (never blocks merge)
- Shows exact files in summary

## SEAL Docs Fast Pass (PR #211)

**File**: `.github/workflows/seal-gate-fast.yml`

Change: `governance-fast` job now skips when `docs_only=true`

```yaml
governance-fast:
  needs: classify
  if: needs.classify.outputs.docs_only != 'true'
```

SEAL aggregator treats `skipped` as success for docs-only PRs.

## Invariants (DO NOT REGRESS)

### 1. `docs_only` Definition is Strict

```bash
# Must be: ALL changed files ⊆ docs patterns
# NOT: contains any markdown file
NON_DOC=$(echo "$CHANGED" | grep -Ev '^(docs/|.*\.md$|...)' | head -1 || true)
if [ -z "$NON_DOC" ]; then
  docs_only=true
fi
```

This prevents mixed PRs (e.g., `README.md + backend/**`) from skipping governance.

### 2. SEAL Aggregator Treats Skipped as Success

```yaml
case "${{ needs.governance-fast.result }}" in
  success) # ✅ passed
  skipped) # ⏭️ OK for docs-only
  *)       # ❌ FAILED
esac
```

### 3. Docs Fast Lane Uses `fetch-depth: 0`

Git diff needs full history to compute base/head on PRs.

### 4. Concurrency Group is Per-Ref

```yaml
concurrency:
  group: docs-fast-lane-${{ github.ref }}
  cancel-in-progress: true
```

## Example Run IDs

- Pre-fix docs-only PR: 123+ workflows triggered
- Post-fix docs-only PR: 2-3 workflows (SEAL + Docs Fast Lane)

## Validation

To verify the fix is working:

```bash
# Create a docs-only PR
echo "test" >> docs/test.md
git add docs/test.md
git commit -m "docs: test phase 4c"
pnpm tf:ship --fast

# Check workflow count
gh pr checks <PR_NUMBER> | wc -l
# Expected: < 10 (was 123+)
```

---

**Government. Transcended.**
