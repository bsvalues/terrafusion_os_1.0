# Docker Dev Onboarding

TerraFusion local Docker support is a developer-experience baseline only. It is not a production
architecture decision and does not authorize deployment, image publishing, Helm, Kubernetes, PACS,
county SQL, county data, or secrets handling.

Start with `docs/onboarding/DEVELOPER_ONBOARDING.md` before running Docker commands. Use
`docs/onboarding/DOCKER_TROUBLESHOOTING.md` for local Docker failures.

## What This Baseline Provides

- A Node 20 / pnpm 9 toolbox container.
- A .NET 8 SDK toolbox container.
- A frontend Vite dev profile.
- A backend restore-check profile.
- Placeholder-only environment values.

## Authorization Boundary

WO-DEVOPS-005B approved a fresh local-only Docker developer baseline after WO-DEVOPS-005A
identified existing production-like and county/PACS-marked surfaces. The approved implementation
lane is limited to `docker/dev/**` and this onboarding document. Existing production Compose, Helm,
county demo, PACS, SQL, and quarantined artifacts are excluded rather than reused.

## What This Baseline Excludes

- `backend/helm/**`
- `compose.prod*`
- `compose.production*`
- `ops/prod/**`
- `QUARANTINE/**`
- County demo compose files
- PACS or county SQL runtime paths
- Real secrets or service credentials

## First Run

From the repository root:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
```

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
```

The bare Compose config command validates the file and placeholder env values. It is expected to
render `services: {}` because local-dev services are only enabled through profiles.

Validate the profile-specific service definitions before running a toolbox or local service:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config
```

## Command Truth Table

| Command | Purpose | Creates Docker resources? | Starts long-running service? | Cleanup command | Safe for audit? |
| --- | --- | --- | --- | --- | --- |
| `pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1` | Check local prerequisites and repo path assumptions. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config` | Validate YAML and placeholder env rendering. Expected to show `services: {}` because services are profile-gated. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config` | Validate toolbox service definitions. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config` | Validate frontend service definition. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config` | Validate backend restore-check service definition. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example run --rm node-toolbox` | Open an interactive Node/pnpm toolbox. | Yes: may build image, create network, and create cache volumes. | No | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down` | No, mutates local Docker state |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example run --rm dotnet-toolbox` | Open an interactive .NET SDK toolbox. | Yes: may build image, create network, and create cache volumes. | No | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down` | No, mutates local Docker state |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling run --rm node-toolbox pnpm --filter ./frontend install --frozen-lockfile` | Install frontend dependencies into Docker-managed volumes. | Yes: creates/updates toolbox image, network, and dependency volumes. | No | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down --volumes` | No, mutates local Docker state |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend up frontend-dev` | Start the local Vite dev server. | Yes | Yes | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down` | No |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend run --rm backend-check` | Run .NET SDK info and backend restore check. | Yes: may build image, create network, and create NuGet cache volume. | No | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down --volumes` | No, mutates local Docker state |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down` | Remove local-dev containers and networks for all profiles. | Removes resources | No | Not needed | Yes, for local-dev cleanup only |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down --volumes` | Remove local-dev containers, networks, and cache volumes for all profiles. | Removes resources and cache volumes | No | Not needed | No, destructive to local caches |

Start an interactive Node toolbox:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example run --rm node-toolbox
```

Start an interactive .NET toolbox:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example run --rm dotnet-toolbox
```

## Frontend Dev

Install frontend dependencies into the Docker-managed `frontend-node-modules` volume first:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling run --rm node-toolbox pnpm --filter ./frontend install --frozen-lockfile
```

Then start Vite:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend up frontend-dev
```

Open `http://localhost:${TF_VITE_PORT:-5173}`. The frontend API URL is derived from
`${TF_API_PORT:-5000}`.

## Backend Check

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend run --rm backend-check
```

This runs `dotnet --info` and restores `backend/TerraFusion.sln`. It does not launch production
services or connect to external databases.

## Local Docker Artifacts

The first toolbox build or `run --rm` command can create local Docker state:

- images: `terrafusion/local-node-toolbox:dev` and `terrafusion/local-dotnet-toolbox:dev`
- network: `<compose project>_default`
- volumes: `<compose project>_pnpm-store`, `<compose project>_root-node-modules`,
  `<compose project>_frontend-node-modules`, and `<compose project>_nuget-packages`

With the provided `docker/dev/.env.example`, the typical Compose project prefix is
`terrafusion-dev`; Compose may report `terrafusion-local-dev` if the top-level Compose name wins in
your environment.

This is local developer machine state, not repo mutation and not deployment behavior. Cleanup for
profile-gated services must enable the profiles that created the resources:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile "*" down --volumes
```

These commands remove containers, networks, and optionally volumes for the selected profiles. They do
not remove the local toolbox images.

Avoid global Docker prune commands unless a separate cleanup decision authorizes them.

## Governance Notes

- Use placeholders only.
- Do not copy values out of production Compose, Helm, county demos, or quarantined artifacts.
- If a task requires PACS, county SQL, county data, real secrets, image publishing, or production
  infrastructure, stop and route it through a separate authorized work order.
