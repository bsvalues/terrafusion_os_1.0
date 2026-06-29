# Local Dev Smoke Gate

The local dev smoke gate is the smallest boring check for a TerraFusion developer worktree. It proves
that the documented local-dev command surface is reachable without installing packages, starting
services, creating env files, running migrations, reading secrets, or mutating Git.

## Authorization

This document and `scripts/dev/smoke.ps1` are created under `WO-DEVOPS-006J - Local Dev Smoke Gate`
in the TerraFusion local development chain. The authorized lane is local developer tooling and
onboarding documentation only.

This work order does not expand the root Core Governance Surface, modify repo-shape policy, or
authorize writes outside the local-dev smoke gate scope.

## Command

From the repository root of the intended worktree, run:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/smoke.ps1
```

If you are in a subdirectory, invoke the script with a path that is valid from the current directory.
For example, from `docs/`:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File ..\scripts\dev\smoke.ps1
```

The script locates the repository root after PowerShell has successfully opened the script file.

## What It Runs

The smoke gate runs:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1
```

`bootstrap.ps1` performs read-only Docker Compose config validation for:

- bare profile-gated config
- `tooling`
- `frontend`
- `backend`

## Pass Criteria

The smoke gate passes when readiness and bootstrap inspect complete with no hard failures.

Warnings are allowed for expected local-only conditions, including:

- missing `docker/dev/.env`
- dirty status in an active work-order branch
- local tool version warnings that do not block the current work order

## Failure Criteria

The smoke gate fails when:

- the current path is not inside a Git worktree
- `scripts/dev/readiness.ps1` is missing or fails
- `scripts/dev/bootstrap.ps1` is missing or fails
- required local-dev docs or Docker placeholder files are missing

## Non-Goals

This smoke gate does not prove:

- production readiness
- release readiness
- runtime application correctness
- package install success
- frontend dependency install success
- backend restore/build success
- Kubernetes or Helm readiness
- county runtime readiness

## Stop Gates

Stop and route through a separate work order if passing the smoke gate would require:

- real secrets, tokens, or credentials
- county data, PACS, or county SQL
- production Docker, Helm, Kubernetes, deployment, or release behavior
- package dependency changes
- runtime product behavior changes
- destructive Docker or filesystem cleanup
