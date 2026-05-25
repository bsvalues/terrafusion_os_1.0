# Current Use DevOps Release Guide

## First Alpha Enabled Slices

- Core Workbench
- Rollback Calculator
- Notice Preview
- TerraTrace Audit
- Policy Governance

## Commands

```bash
bash scripts/current-use-quality-gate.sh
bash scripts/current-use-smoke.sh
node scripts/current-use-boundary-check.mjs src/modules/terra-current-use
```

## CI Gate

The PR must pass:

- frontend typecheck
- frontend Current Use tests
- backend build
- backend Current Use tests
- boundary check

## Release Philosophy

Do not promote slices because they exist.

Promote only when:

- compile passes
- smoke test passes
- demo path is clean
- domain boundaries are intact
- human-review disclaimers are visible
