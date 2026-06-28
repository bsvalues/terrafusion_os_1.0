# Developer Bootstrap Decision

## Decision

Do not create a mutating one-command bootstrap script yet.

Use this order instead:

1. Read-only readiness check.
2. Explicit documentation and manual commands.
3. Evidence packet showing what was validated.
4. Future bootstrap only after transparent, reversible behavior is defined.

## Why Bootstrap Is Deferred

The repo already contains multiple setup/start scripts with different assumptions. Promoting any of
them to the canonical onboarding path before documenting boundaries would hide behavior and increase
the chance of accidental installs, service starts, production-surface usage, or dirty-checkout
mutation.

## What The Readiness Script Does

`scripts/dev/readiness.ps1` reports local prerequisite and file-state information. It is read-only.
It may check tool availability, Git state, Docker reachability, required docs, and local Docker dev
files.

It does not install packages, start containers, restore .NET packages, read secrets, clean Git state,
or create environment files.

## What Bootstrap Must Never Do Silently

- Install or upgrade dependencies.
- Rewrite lockfiles or package manifests.
- Start production services.
- Connect to PACS, county SQL, county data, or production cloud resources.
- Read, create, or print secrets.
- Reset, clean, stash, or otherwise mutate unrelated Git work.
- Change ports, service contracts, or runtime behavior without explicit evidence.

## Future Criteria To Approve Bootstrap

A future bootstrap work order can be considered when:

- The readiness script is stable and documented.
- Docker dev commands are proven from a clean worktree.
- Package-governance blockers are not blocking local hooks.
- Every mutation is listed before execution.
- Dry-run mode is available.
- Rollback or undo steps are documented.
- Production, PACS, county SQL, county data, and secret boundaries remain explicit.

## Rollback Requirement

Any future bootstrap implementation must document what it creates or modifies and how to undo local
changes. If it cannot explain rollback, it should remain a guided manual runbook instead of a script.
