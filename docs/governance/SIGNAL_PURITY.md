# TerraFusion Signal Purity Protocols

## Overview

Signal Purity is the doctrine of ensuring that CI/CD signals (Output Drift, Test Failures) reflect *actual code changes*, not environmental noise or transient states.

This system enforces three layers of protection:
1. **Git State Sanity** (Environment Guard)
2. **Output Determinism** (Serialization Guard)
3. **Dependency Scope Hardening** (Renovate Guard)

---

## 1. Git State Sanity

We block CI/CD execution if the repository is in a dangerous transient state (e.g., interrupted merge, rebase, or bisect).

- **Mechanism**: `scripts/ci/gitStateSanity.js`
- **Triggers**: Presence of `.git/MERGE_HEAD`, `.git/REBASE_HEAD`, `.git/BISECT_LOG`, etc.
- **Outcome**: Immediate failure with **Exit Code 3** (Environment Failure).
- **Why**: Prevents "Drift Detection" from flagging merge conflicts as code drift.

### Manual Verification
```bash
npm run ci:git-sanity
```

---

## 2. Output Determinism

We ensure that all generated configuration files (Scope Classifiers, JSON reports) are mathematically identical across runs, regardless of the underlying file system or Node version.

- **Mechanism**: Deep Recursive Key Sorting in `tools/scope-classifier`.
- **Logic**: `{ "b": 1, "a": 2 }` is always serialized as `{ "a": 2, "b": 1 }`.
- **Validation**: "Double-Tap" verification script runs generation twice and diffs the output.

### Verification Drill
```bash
npm run ci:test:determinism
```

---

## 3. Renovate Hardening

We strictly limit the scope of the Renovate dependency bot to prevent "Infinite PR Loops" caused by scanning 700+ auxiliary `package.json` files in build outputs or templates.

- **Mechanism**: Strict `includePaths` in `.github/renovate.json`.
- **Whitelist**:
  - `package.json` (Root)
  - `frontend/**`
  - `tools/**`
  - `backend/**`
  - `SDK/**`
  - `os-platform/**`
  - `terrabuild-modernization/**`
- **Impact**: Reduces surface area from ~700 manifests to <50 relevant operational manifests.

---

## Incident Response

If you encounter **Exit Code 3**:
1. Check your git state: `git status`.
2. Abort any pending operations: `git merge --abort` or `git rebase --abort`.
3. Clean the workspace: `git clean -fd`.

**"Government. Transcended."**
