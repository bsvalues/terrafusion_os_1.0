# TerraFusion CI Governance Index

**Version:** 1.0  
**Stable Release:** `v1.4.0-ci-stable`  
**Last Updated:** 2026-01-30

---

## Quick Reference

This is the canonical starting point for anyone touching CI workflows.

### Current Posture

| Property | Value |
|----------|-------|
| Required checks | `🔒 SEAL` only |
| Heavy workflows | Informational (not blocking) |
| Queue protection | Concurrency + cancel-in-progress |
| Dependency PRs | Fast-lane routing |
| Invariant enforcement | Drift tests |

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [SEAL_ONLY_REQUIRED_CHECK_POLICY.md](SEAL_ONLY_REQUIRED_CHECK_POLICY.md) | Policy rationale and configuration |
| [AUTONOMY_V1_GOVERNANCE_CONTRACT.md](../../AUTONOMY_V1_GOVERNANCE_CONTRACT.md) | Autonomy v1 operational guarantees |
| [🏆_PHASE_4D_DEPENDENCY_CONVERGENCE_ACHIEVEMENT_🏆.md](../../🏆_PHASE_4D_DEPENDENCY_CONVERGENCE_ACHIEVEMENT_🏆.md) | Achievement log with merge statistics |
| [required-check-drift.test.ts](../../tests/governance/required-check-drift.test.ts) | Hard invariant tests |

---

## Key Workflows

| Workflow | Role | Required? |
|----------|------|-----------|
| [seal-gate-fast.yml](../../.github/workflows/seal-gate-fast.yml) | Fast gate (~90s), scope/build/lint | ✅ Yes |
| [deps-fast-lane.yml](../../.github/workflows/deps-fast-lane.yml) | Dependency PR validation | Runs automatically |
| [autonomy-pr-lane.yml](../../.github/workflows/autonomy-pr-lane.yml) | Tier 0 autonomous patching (opens PRs) | ❌ Informational |
| [terrafusion-gate-enforcement.yml](../../.github/workflows/terrafusion-gate-enforcement.yml) | Integration gates (E/F) | ❌ Informational |
| [ci-cd-pipeline.yml](../../.github/workflows/ci-cd-pipeline.yml) | Full CI/CD | ❌ Informational |
| [nightly.yml](../../.github/workflows/nightly.yml) | Heavy checks (E2E, security scans) | ❌ Nightly only |
| [perf-skill-audit.yml](../../.github/workflows/perf-skill-audit.yml) | Vercel performance audit | ❌ Nightly + Manual |

---

## Invariants (Tested)

These are enforced by `tests/governance/required-check-drift.test.ts`:

1. **Only SEAL is required** — Gate E/F cannot be added to required checks
2. **SEAL has no path filters** — Cannot be bypassed by `paths:` or `paths-ignore:`
3. **SEAL triggers on PR + push** — Covers all merge paths

Run the tests:
```bash
pnpm vitest run tests/governance/required-check-drift.test.ts
```

---

## Phase History

| Phase | Date | Achievement |
|-------|------|-------------|
| **4C** | 2026-01-29 | `v1.4.0-ci-stable` released with deps-fast-lane |
| **4D** | 2026-01-30 | 27 → 0 PRs merged, 156-run queue cleared |
| **4E** | 2026-01-30 | Concurrency + actor guards added |
| **4F** | 2026-01-30 | SEAL unskippable assertions added |
| **4G** | 2026-01-30 | Performance Skill Audit lane (informational) |
| **4M6** | 2026-01-30 | Autonomy v1: determinism, proofs, rollback contracts |
| **4M7** | 2026-01-30 | Autonomy v1 merged to main with governance contract |

---

## Verification Commands

```powershell
# Unit tests pass
pnpm test:unit

# No open PRs stuck
gh pr list --state open

# Queue health
gh run list --limit 20 --json status,name --jq 'group_by(.status)|map({status:.[0].status,count:length})'

# Branch protection check
gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.checks[].context'
```

---

## Modification Procedure

Before changing any CI workflow:

1. **Read this index** — understand current invariants
2. **Check drift tests** — run `pnpm vitest run tests/governance/`
3. **Respect concurrency groups** — use `${{ github.workflow }}-${{ github.ref }}`
4. **Update documentation** — keep this index current

---

**Government. Transcended. Governed.**
