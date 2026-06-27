# Docker Dev Onboarding

TerraFusion local Docker support is a developer-experience baseline only. It is not a production
architecture decision and does not authorize deployment, image publishing, Helm, Kubernetes, PACS,
county SQL, county data, or secrets handling.

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
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
```

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

## Governance Notes

- Use placeholders only.
- Do not copy values out of production Compose, Helm, county demos, or quarantined artifacts.
- If a task requires PACS, county SQL, county data, real secrets, image publishing, or production
  infrastructure, stop and route it through a separate authorized work order.
