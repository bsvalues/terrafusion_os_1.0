# TerraFusion Governance Gates Policy (Phase 50.x)

This document defines governance gate behavior for local workflows and CI.

## Core Principles

- Governance steps are read-only by default.
- Any governed step that modifies repository state is a violation.
- Heavy checks are CI-first and env-gated locally.

## Environment Flags

- `TF_SECURITY_SCAN=1`
  - Enables security scan step.
  - Local default: off unless explicitly set.
- `TF_PERF_BENCH=1`
  - Enables performance benchmark step.
  - Local default: off unless explicitly set.
- `TF_AI_SWARM_MONITOR=1`
  - Enables AI swarm monitor step.
  - Local default: off unless explicitly set.
- `TF_GOV_COMPLIANCE=1`
  - Enables governance compliance step.
  - Local default: off unless explicitly set.
- `TF_ENFORCE_BRANCH_PROTECTION=1`
  - Enforces branch protection verification failure on drift.
  - When `0`, verification may be non-blocking if token permissions are insufficient.

## Write-Path Violation Policy

A write-path violation occurs when a governed step introduces:

- unstaged tracked file changes
- staged/index changes
- untracked generated artifacts

Common disallowed write-path commands in governed surfaces:

- `prettier --write`
- `eslint --fix`
- `stylelint --fix`
- `patch-package`
- `changeset version`
- `npm version`

Preferred alternatives are check-only modes (for example `prettier --check`).

## Explicit Allow (Discouraged)

If a write action is unavoidable, it must be explicitly gated behind `TF_ALLOW_WRITE=1` and documented in the owning workflow/step rationale.

## Post-Merge Mainline Invariants (Phase 50.5)

On pushes to `main`, CI re-validates:

- governed no-write audit
- branch protection verification (optional enforce via `TF_ENFORCE_BRANCH_PROTECTION`)
- clean-tree mutation assertion

