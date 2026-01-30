# Branch Protection: SEAL-Only Required Check Policy

**Effective Date:** 2026-01-30  
**Policy Version:** 1.0  
**Related:** Phase 4D/4E Achievement

---

## Policy Statement

**Only `🔒 TerraFusion Seal Gate (fast)` is required** for merging to protected branches (main, develop).

All other checks are **informational** — they provide signal without blocking merge convergence.

---

## Rationale

### Data-Driven Discovery (Phase 4D)

During the Dependency Convergence Sprint, we observed:

| Metric | Value |
|--------|-------|
| Queue backlog | 156 runs |
| Auto-merge blocked | 20+ PRs |
| Root cause | All SEAL runs queued behind heavy workflows |

**Key insight:** Gate E/F failures were NOT actual blockers — only SEAL was required in branch protection. The queue saturation was causing *perceived* blocking.

### Cost-Benefit Analysis

| Check | Runtime | Value | Required? |
|-------|---------|-------|-----------|
| 🔒 SEAL | ~90s | Scope/lockfile sanity | ✅ Yes |
| Gate E/F | ~8-15min | Integration validation | ❌ No |
| Gatekeeper | ~10-20min | Full pipeline | ❌ No |
| Deploy | Variable | Staging deployment | ❌ No |

**Conclusion:** Heavy workflows add queue cost without proportional merge-safety benefit when SEAL already validates core invariants.

---

## Required Check Configuration

### Branch Protection Settings (GitHub)

```
Protected branches: main, develop
Required status checks:
  ✅ 🔒 SEAL (context: "🔒 SEAL")
  
NOT required (informational):
  - TerraFusion Integration Gates
  - TerraFusion Gatekeeper  
  - Pipeline Summary
  - Gate E/F
  - Deploy to *
```

### Verification

Query current settings:
```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '.required_status_checks.checks[].context'
```

Expected output:
```
🔒 SEAL
```

---

## Hardening Measures (Phase 4E)

### 1. Concurrency Blocks

All heavyweight workflows have:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

This prevents queue pileups by replacing old runs with new pushes.

### 2. Actor Guards

Heavyweight workflows skip for dependency PRs:
```yaml
if: ${{ github.actor != 'dependabot[bot]' && !contains(github.head_ref || github.ref_name, 'snyk-') }}
```

### 3. Drift Test

`tests/governance/required-check-drift.test.ts` asserts this policy as a hard invariant.

### 4. Unskippable Assertion (Phase 4F)

The drift test validates that `seal-gate-fast.yml` has:
- **No `paths:` or `paths-ignore:` filters** — SEAL cannot be accidentally bypassed
- **Triggers on both `pull_request:` and `push:`** — covers all merge paths

This prevents a well-meaning optimization from creating a blind spot in the only required gate.

---

## Why SEAL-Only? (Executive Summary)

| Phase | Problem | Solution |
|-------|---------|----------|
| **4D** | 156-run queue backlog blocked 27 PRs | Discovered only SEAL was actually required |
| **4E** | Heavy workflows caused queue storms | Added concurrency + actor guards |
| **4F** | Future drift could re-introduce bypass | Added unskippable test assertions |

**Result:** CI is now fail-closed where it matters, fail-open where it's informational, and self-thinning under pressure.

---

## Modification Procedure

To add a new required check:

1. **Document rationale** — Why does this check provide merge-safety proportional to its queue cost?
2. **Update drift test** — Modify `EXPECTED_REQUIRED_CHECKS` in `required-check-drift.test.ts`
3. **Update branch protection** — GitHub Settings → Branches → main → Edit
4. **Update this document** — Add to Required Check Configuration table

---

## References

- [🏆_PHASE_4D_DEPENDENCY_CONVERGENCE_ACHIEVEMENT_🏆.md](../../🏆_PHASE_4D_DEPENDENCY_CONVERGENCE_ACHIEVEMENT_🏆.md)
- [tests/governance/required-check-drift.test.ts](../../tests/governance/required-check-drift.test.ts)
- [.github/workflows/seal-gate-fast.yml](../../.github/workflows/seal-gate-fast.yml)

---

**Government. Transcended. Governed.**
