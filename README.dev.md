# TerraFusion cOS – Dev Quickstart

## Prereqs
- Docker + Compose v2
- .NET SDK 8.x
- Rust + cargo (stable)
- Node 18+ (optional for web apps)

## First run
```bash
make init
make build-ci
make up
make logs
```

API: http://localhost:5046
Postgres: localhost:5432 (`terrafusion` / `postgres` / `$POSTGRES_PASSWORD`)
Keycloak: http://localhost:8080 (admin/admin)

## Useful

```bash
make migrate   # run DB migrations
make seed      # seed RBAC/tenants/parcels
make test      # dotnet + cargo tests
make perf-smoke
make down
```

## CI notes

* PRs: Helm lint+template; Terraform fmt/validate+tflint; Compose smoke runs without cloud creds.
* main: Adds Terraform plan via AWS OIDC role.
# TerraFusion cOS – Dev Quickstart

## Prereqs
- Docker + Docker Compose v2
- .NET SDK 8.x (`dotnet --version`)
- Rust toolchain (`rustup`, `cargo --version`)
- Node 18+ if you run any web apps locally

## First run
```bash
make init        # creates .data/*, copies .env.example -> .env
make build       # builds API + Rust workers + images
make up          # starts db, redis, nats, keycloak, api, workers
make logs        # tail everything
```

API should be on [http://localhost:5046](http://localhost:5046)
Postgres (PostGIS) at `localhost:5432` (db: terrafusion / user: postgres / pass: from .env)
Keycloak at [http://localhost:8080](http://localhost:8080) (admin/admin)

## Common commands

```bash
make migrate          # run DB migrations via API container
make seed             # seed baseline RBAC/tenants/parcels
make test             # dotnet + cargo tests
make perf-smoke       # k6 smoke test against the API
make down             # stop + remove volumes
```

## Environment (.env)

```env
POSTGRES_PASSWORD=postgres
TF_JWT_AUDIENCE=terrafusion-api
TF_JWT_ISSUER=http://keycloak:8080/realms/terrafusion
```

> Edit `.env` after `make init`. Secrets belong in your local `.env`, not git.

## Troubleshooting

* **API can’t reach DB**: ensure `db` is healthy (`docker compose ls && docker compose ps`).
* **Keycloak realm missing**: `docker compose logs keycloak` – first boot can take ~30–60s to import realm; restart `api` after it’s ready.
* **Port conflicts**: change host ports in `docker-compose.dev.yml`.
* **Rust crate missing**: any `cargo build` “path not found” is fine (workers are optional); comment the image in `build-images`/compose if not needed.
* **Windows WSL2**: run `wsl.exe --shutdown` once if Docker networking acts up.

## What’s running

* **PostgreSQL + PostGIS** (db) – primary data store
* **Redis** – cache/queues (optional)
* **NATS (JetStream)** – event bus
* **Keycloak** – OIDC provider (imported `terrafusion` realm)
* **API** – cOS edge (.NET 8) at :5046
* **Workers** – valuation, GIS (Rust)

## Next steps

* Wire parity tests in `/parity` and make them part of CI gates.
* Add Grafana/Prometheus stack and dashboards.
* Add `tfctl` wrapper so devs can `tfctl stack up`.
