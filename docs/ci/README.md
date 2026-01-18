# CI Governance & Tooling

This directory contains documentation and specifications for the Continuous Integration (CI) and Governance checkpoints of TerraFusion OS.

## Index

- [GOVERNANCE_CONTRACT.json](./GOVERNANCE_CONTRACT.json): **Canonical source** of expected branch protection posture.
- [GOVERNANCE_LOCK_RUNBOOK.md](./GOVERNANCE_LOCK_RUNBOOK.md): Admin procedure for enabling/modifying branch protection.
- [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md): Rules for branch protection and required status checks.
- [PREFLIGHT_GUIDE.md](./PREFLIGHT_GUIDE.md): Documentation for the "Scope Drift Guard" fail-fast mechanism.
- [audits/](./audits/): Timestamped enforcement seals and governance audit records.

## Key Scripts

- `scripts/ci/toolingPreflight.js`: Zero-dependency fail-fast on tooling misconfig (pre-install).
- `scripts/ci/governanceSentinel.js`: Zero-dependency drift detector for branch protection settings.
- `scripts/ci/tests/`: Unit tests for both validators.

## Workflows

- `.github/workflows/scope-drift-guard.yml`: **Required check** — blocks merge on scope drift.
- `.github/workflows/governance-sentinel.yml`: **Scheduled audit** — detects branch protection drift weekly + on workflow changes.

## Policy Overview

1.  **Fail Fast**: Tooling misconfigurations must fail *before* `pnpm install` in CI.
2.  **Single Source of Truth**: `package.json` (`packageManager`) is the authority on pnpm version.
3.  **Isolation**: Tools like `scope-classifier` must use explicit `root: __dirname` vitest configs.
4.  **Self-Auditing Governance**: Branch protection is validated against `GOVERNANCE_CONTRACT.json` automatically.
