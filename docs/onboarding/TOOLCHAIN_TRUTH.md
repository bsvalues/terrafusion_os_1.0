# Local Toolchain Truth

This sheet records the local development toolchain truth for TerraFusion onboarding. It is evidence
for developer setup only. It does not authorize dependency upgrades, package-manager migration,
runtime behavior changes, production deployment, secrets handling, county data access, PACS access,
or county SQL access.

## Canonical Sources

| Tool | Canonical source | Declared truth | Notes |
| --- | --- | --- | --- |
| Git | `AGENTS.md`, worktree policy docs | Required | Work must happen in a dedicated worktree per work order. |
| PowerShell | `scripts/dev/readiness.ps1`, `scripts/dev/bootstrap.ps1`, `scripts/dev/smoke.ps1` | Required for Windows onboarding scripts | Scripts are read-only by default and use `pwsh`. |
| Node.js | `package.json`, `.nvmrc`, Docker toolbox image | `package.json` allows `>=18.0.0 <25.0.0`; `.nvmrc` is `18.19.0`; Docker toolbox uses Node 20 | Do not infer a Node upgrade from local machine state. |
| pnpm | `package.json`, `pnpm-workspace.yaml` | `packageManager: pnpm@9.0.0` | `pnpm-workspace.yaml` carries compatibility metadata for newer pnpm behavior. |
| .NET SDK | `global.json` | SDK `8.0.0`, `rollForward: latestMajor` | Local machines may report a newer installed 8.x SDK through roll-forward. |
| Docker | `docker/dev/compose.yaml`, `docs/onboarding/DOCKER_DEV.md` | Required only for local Docker dev | Compose commands must use `docker/dev/.env.example` unless a local `.env` is intentionally created. |
| Azure CLI | `scripts/dev/readiness.ps1`, Azure DevOps docs | Optional for Azure DevOps inspection | Not required for basic local onboarding. Do not store tokens in repo files. |

## Observed Local Evidence

The following versions were observed during this work order in the dedicated toolchain truth
worktree:

| Tool | Observed version |
| --- | --- |
| Git | `git version 2.54.0.windows.1` |
| PowerShell | `PowerShell 7.6.3` |
| Node.js | `v24.6.0` |
| pnpm | `11.7.0` |
| .NET SDK | `8.0.422` |
| Docker | `Docker version 29.5.3, build d1c06ef` |
| Docker Compose | `Docker Compose version v5.1.4` |

Observed versions prove the read-only onboarding checks can run on this machine. They do not replace
the declared repository truth.

## Version Guidance

- Prefer the repo-pinned package-manager contract: `pnpm@9.0.0`.
- Treat pnpm 11 warnings as compatibility evidence, not as an authorization to upgrade pnpm.
- Treat `.nvmrc` `18.19.0` as the legacy Node baseline and `package.json` `>=18.0.0 <25.0.0` as the
  current compatibility range.
- Do not change `packageManager`, `.nvmrc`, `global.json`, or dependency versions as part of local
  onboarding work.
- If a tool version blocks local work, classify it in a package-governance or tooling work order
  instead of silently changing package metadata.

## Required vs Optional Tools

| Tool | Required for readiness | Required for Docker dev | Required for Azure inspection | May mutate local machine |
| --- | --- | --- | --- | --- |
| Git | yes | yes | yes | no, when used for read-only status checks |
| PowerShell | yes | yes | yes | no, for read-only scripts |
| Node.js | yes | likely | no | no, for version checks |
| pnpm | yes | likely | no | yes, if install commands are run |
| .NET SDK | yes | backend-dependent | no | no, for version checks |
| Docker Desktop/engine | warning only | yes | no | yes, when starting services or creating Docker resources |
| Docker Compose | warning only | yes | no | yes, when running profiles or cleanup |
| Azure CLI + Azure DevOps extension | optional | no | yes | yes, if configuring auth/defaults |

## Safe Validation Commands

These commands are read-only in the current onboarding contract:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/smoke.ps1
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config
```

Do not run install, restore, service startup, migration, cleanup, deployment, or credential commands
unless the active work order explicitly authorizes them.

## Stop Gates

Stop and open a separate work order if toolchain resolution requires:

- dependency upgrades or package-manager migration
- package lock rewrite beyond an approved governance repair
- Docker service startup beyond local-dev validation
- real secrets, tokens, connection strings, county data, PACS, or county SQL
- production Docker, Helm, Kubernetes, Azure resources, release, or deployment behavior
- runtime product behavior changes
