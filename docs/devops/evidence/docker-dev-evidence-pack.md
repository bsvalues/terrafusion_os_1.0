# Docker Dev Evidence Pack

This evidence pack closes the local Docker reality lane for TerraFusion developer onboarding. It is
local-development evidence only. It does not authorize production Docker, Helm, Kubernetes, image
publishing, release, deployment, secrets, PACS, county SQL, or county data access.

## Authorization

This document is created under `WO-DEVOPS-006I - Docker Dev Evidence Pack` in the TerraFusion DevOps
Local Docker Reality Closure chain. The authorized lane is documentation/evidence only and follows
the already-existing evidence path `docs/devops/evidence/**`.

This packet does not expand the root repository shape, modify governance policy, or authorize writes
outside the local-development evidence lane.

## Scope Proven

- Local Docker entrypoint is `docker/dev/compose.yaml`.
- Placeholder environment source is `docker/dev/.env.example`.
- Canonical onboarding starts at `docs/onboarding/DEVELOPER_ONBOARDING.md`.
- Docker command truth is documented in `docs/onboarding/DOCKER_DEV.md`.
- Docker troubleshooting is documented in `docs/onboarding/DOCKER_TROUBLESHOOTING.md`.
- Bootstrap inspect mode is read-only and validates Docker Compose config without starting services.

## Verified Read-Only Commands

Run from the repository root of the intended worktree:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config
```

Expected behavior:

- `readiness.ps1` reports tools, required paths, Docker engine/Compose availability, and missing
  local `.env` as a warning.
- `bootstrap.ps1` reports Git/worktree state, tool availability, required docs, placeholder env
  presence, and bare/profile Compose config validation.
- `docker compose config` may render `services: {}` when no profile is selected because local-dev
  services are profile-gated.
- Profile-specific config commands validate the service definitions without creating containers,
  networks, volumes, or images.

## Profile Behavior

| Profile | Purpose | Evidence command | Starts service? |
| --- | --- | --- | --- |
| none | Validate base Compose file and placeholder env rendering. | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config` | No |
| `tooling` | Validate Node/.NET toolbox service definitions. | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config` | No |
| `frontend` | Validate frontend Vite service definition. | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config` | No |
| `backend` | Validate backend restore-check service definition. | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config` | No |

## Artifact Behavior

Read-only config commands do not create Docker resources.

The first toolbox, frontend, or backend run can create local Docker state:

- images: `terrafusion/local-node-toolbox:dev`, `terrafusion/local-dotnet-toolbox:dev`
- network: `<compose project>_default`
- volumes: `<compose project>_pnpm-store`, `<compose project>_root-node-modules`,
  `<compose project>_frontend-node-modules`, `<compose project>_nuget-packages`

With `docker/dev/.env.example`, the typical project prefix is `terrafusion-dev`; Compose may report
`terrafusion-local-dev` if the top-level Compose name wins in the local environment.

## Cleanup Behavior

Cleanup is limited to the local-dev Compose project:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes
```

- `down` removes local-dev containers and networks for the Compose project and keeps named cache
  volumes.
- `down --volumes` also removes local-dev cache volumes.
- Neither command removes the local toolbox images.
- Global Docker prune commands are intentionally excluded from onboarding.
- Unrelated Docker containers, images, networks, and volumes are not inspected, stopped, removed, or
  pruned by this lane.

### Multi-Worktree Cleanup Risk

`docker/dev/.env.example` sets a shared Compose project name. In a multi-worktree setup, two
worktrees using the default env file can point at the same local Docker project and cache volumes.

Operator-safe cleanup therefore means:

- Run cleanup only for a local-dev Compose project you own.
- Check `docker ps`, `docker network ls`, and `docker volume ls` before deleting volumes when
  multiple TerraFusion worktrees are active.
- Prefer a per-worktree project name for isolated experiments, for example:

```powershell
docker compose -p terrafusion-dev-my-worktree -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
docker compose -p terrafusion-dev-my-worktree -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes
```

This evidence packet records the risk; it does not change `docker/dev/.env.example` or the Compose
contract.

## Known Non-Goals

- No production Docker contract.
- No Helm or Kubernetes implementation.
- No image publishing.
- No Azure deployment behavior.
- No service connections, variable groups, or Key Vault.
- No runtime product behavior change.
- No dependency modernization.
- No secrets, PACS, county SQL, or county data use.

## Remaining Risks

- Local Docker Desktop, WSL, or machine permissions can still block developer startup outside the
  repo.
- Backend restore can fail on network/NuGet issues or package/project problems outside the Docker
  docs lane.
- Frontend dependency install can expose package-governance/toolchain issues that must be handled in
  separate package/tooling work orders.
- Cleanup commands are safe for the local-dev Compose project, but operators still need to avoid
  global Docker prune commands on machines with unrelated workloads.
- The default Compose project name can collide across multiple local TerraFusion worktrees unless the
  operator uses a per-worktree `-p` project name.

## Evidence Boundary

This packet proves that the documented local Docker path is explicit, profile-gated, and
operator-safe. It does not prove production readiness, release readiness, county runtime readiness,
or deployment readiness.

## Next Recommended Lane

Close the Docker reality chain and proceed to a local developer smoke-gate or toolchain truth lane:

1. Define the smallest local smoke command/checklist that proves basic developer readiness.
2. Keep it read-only or explicitly local-only.
3. Do not expand into production Docker, Kubernetes, deployment, secrets, PACS, county SQL, or county
   data.
