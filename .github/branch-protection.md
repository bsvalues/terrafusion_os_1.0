# Branch Protection Canon

This file documents the intended protection rules for `main`.

## Current Invariants

- branch: `main`
- require pull request: `true`
- include administrators: `true`
- require up-to-date branches: `true`
- approving reviews required: `0`
- allow force pushes: `false`

Required checks:

- `governed-spine`
- `phase85-tools`
- `phase86-toolrunner`
- `🔒 TerraFusion Seal Gate`
- `🧪 Tier-1 UI Harness Validation`

## Source of Truth

Primary canon:

- [AGENTS.md](../AGENTS.md)
- [../.governance/main.protection.json](../.governance/main.protection.json)

## Drift Audit

```bash
gh api repos/bsvalues/terrafusion_os_1.0/branches/main/protection > .tmp/main.protection.current.json
git diff --no-index .governance/main.protection.json .tmp/main.protection.current.json
```

If branch protection changes intentionally, update the snapshot and this doc in
the same PR.
