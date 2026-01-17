# CI Preflight Guide

## Overview

The **CI Preflight** check runs as the *first* step in the Scope Drift Guard workflow. Its purpose is to fail fast (before `pnpm install`) if critical tooling configurations have drifted.

## Failure Codes

If you see `CI_PREFLIGHT_FAIL: ...` in the logs, it means one of the following non-negotiable invariants was violated:

1.  **Drifted pnpm Source of Truth**
    *   *Error*: `scope-drift-guard.yml pins pnpm version...`
    *   *Fix*: Remove `with: version: x.x.x` from the workflow file. The `packageManager` field in `package.json` is the single source of truth.

2.  **Missing `packageManager`**
    *   *Error*: `package.json must define packageManager...`
    *   *Fix*: Add `"packageManager": "pnpm@9.x.x"` to the root `package.json`.

3.  **Vitest Isolation Breach (Scope Classifier)**
    *   *Error*: `scope-classifier vitest.config.ts must set 'root: __dirname'...`
    *   *Error*: `scope-classifier vitest.config.ts must not set 'setupFiles'...`
    *   *Fix*: Ensure `tools/scope-classifier/vitest.config.ts` explicitly sets `root: __dirname` and `environment: "node"`, and define NO `setupFiles`. This prevents the tool from accidentally inheriting the root repo's frontend-heavy test environment or setup scripts.

4.  **Loose Test Script**
    *   *Error*: `tools/scope-classifier package.json scripts.test must be...`
    *   *Fix*: Update the `test` script in `tools/scope-classifier/package.json` to explicitly use the config: `vitest run -c vitest.config.ts`.

## Running Locally

To verify your environment passes preflight:

```bash
# Run the validator (Zero dependencies - runs with pure Node)
node scripts/ci/toolingPreflight.js

# Run the unit tests for the validator
pnpm vitest run scripts/ci/tests/toolingPreflight.test.ts
```

## Why this exists

We enforce these checks *before* install to prevent "false positive" drift failues caused by config inheritance (e.g., a Vitest update at root breaking a tool that shouldn't know about root).
