# TerraFusion Local Docker Dev

This directory defines a local-only Docker developer baseline. It is intentionally separate from
production Compose, backend Helm charts, county demos, PACS integrations, and quarantined container
artifacts.

## Boundary

Allowed:

- Local developer toolboxes for Node/pnpm and .NET SDK workflows.
- Placeholder-only environment values from `.env.example`.
- Named Docker volumes for dependency caches and `node_modules`.
- Local bind mount of the repository into `/workspace`.

Not allowed:

- Real secrets, tokens, credentials, or connection strings.
- County data, Benton-specific runtime data, PACS, or county SQL access.
- Production Docker, Helm, Kubernetes, image publishing, or deployment behavior.
- Reuse of `compose.prod*`, `compose.production*`, `ops/prod/**`, or `backend/helm/**`.

## Validate The Compose Contract

From the repository root:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
```

This bare config command validates the YAML and placeholder environment file. Because every service
in this local-dev compose file is profile-gated, the rendered output is expected to show
`services: {}`.

To validate the actual local-dev service definitions, include the profile you intend to inspect:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config
```

These commands still only render Compose configuration. They do not start services.

## Command Truth Table

| Command | Purpose | Creates Docker resources? | Starts long-running service? | Cleanup command | Safe for audit? |
| --- | --- | --- | --- | --- | --- |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config` | Validate YAML and placeholder env rendering. Expected to show `services: {}` because services are profile-gated. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config` | Validate toolbox service definitions. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config` | Validate frontend service definition. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config` | Validate backend restore-check service definition. | No | No | Not needed | Yes |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example run --rm node-toolbox` | Open an interactive Node/pnpm toolbox. | Yes: may build image, create network, and create cache volumes. | No | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes` for full cache cleanup | No, mutates local Docker state |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example run --rm dotnet-toolbox` | Open an interactive .NET SDK toolbox. | Yes: may build image, create network, and create cache volumes. | No | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes` for full cache cleanup | No, mutates local Docker state |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling run --rm node-toolbox pnpm --filter ./frontend install --frozen-lockfile` | Install frontend dependencies into Docker-managed volumes. | Yes: creates/updates toolbox image, network, and dependency volumes. | No | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes` | No, mutates local Docker state |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend up frontend-dev` | Start the local Vite dev server. | Yes | Yes | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down` | No |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend run --rm backend-check` | Run .NET SDK info and backend restore check. | Yes: may build image, create network, and create NuGet cache volume. | No | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes` | No, mutates local Docker state |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down` | Remove local-dev containers and networks for the Compose project. Keeps named cache volumes. | Removes containers and networks | No | Not needed | Yes, for local-dev cleanup only |
| `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes` | Remove local-dev containers, networks, and cache volumes for the Compose project. | Removes containers, networks, and cache volumes | No | Not needed | No, destructive to local caches |

## Tooling Shells

Open a Node/pnpm toolbox:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example run --rm node-toolbox
```

Open a .NET SDK toolbox:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example run --rm dotnet-toolbox
```

## Frontend Dev Server

Install frontend dependencies into the Docker-managed `frontend-node-modules` volume first:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling run --rm node-toolbox pnpm --filter ./frontend install --frozen-lockfile
```

Then start Vite:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend up frontend-dev
```

The Vite server is exposed on `http://localhost:${TF_VITE_PORT:-5173}`. The frontend API URL is
derived as `http://localhost:${TF_API_PORT:-5000}`.

## Backend Restore Check

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend run --rm backend-check
```

This validates the .NET SDK container and NuGet restore path only. It does not start a database,
PACS bridge, county integration, or production service.

## Cleanup

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down
```

Toolbox build/run commands can create local Docker images, a `<compose project>_default` network,
and named cache volumes for `pnpm`, `node_modules`, and NuGet packages. With the provided
`.env.example`, the typical Compose project prefix is `terrafusion-dev`; Compose may report
`terrafusion-local-dev` if the top-level Compose name wins in your environment.

`docker compose down` removes containers and networks for the Compose project. It does not remove
the toolbox images or named cache volumes. To also remove local cache volumes:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes
```

Do not use global Docker prune commands as part of this runbook; they can delete unrelated local
developer assets.
