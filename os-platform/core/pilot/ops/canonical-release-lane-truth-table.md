# Canonical Release Lane Truth Table

## Authoritative Path
- Deploy model: `VPS + GHCR + SSH`
- Authoritative deploy workflow: `.github/workflows/release-lane.yml`
- Authoritative rollback workflow: `.github/workflows/rollback-staging.yml`
- Authoritative runtime bundle:
  - `ops/prod/runtime-compose.template.yml`
  - `ops/proxy/Caddyfile`
  - generated `release.env`
  - VPS-local `app.env`
  - copied `docs/spec-lock/**`
- Authoritative public probes:
  - `https://staging.terrafusionmarket.com/health`
  - `https://terrafusionmarket.com/health`
- Authoritative GitHub environment configuration names:
  - `DEPLOY_HOST`
  - `DEPLOY_PORT`
  - `DEPLOY_USER`
  - `DEPLOY_SSH_KEY`
  - `PUBLIC_URL`
  - `APP_ROOT`

## Runtime Contract
- Backend image: `ghcr.io/<owner>/terrafusion-os-backend:<sha>`
- Frontend image: `ghcr.io/<owner>/terrafusion-os-frontend:<sha>`
- SHA tracking files on the VPS:
  - `requested.sha`
  - `current.sha`
  - `previous.sha`
- Health proof contract:
  - `curl -I $PUBLIC_URL/health` returns `200`
  - `X-Release-Sha` matches the requested SHA
  - `requested.sha == current.sha == header sha`

## Required Runtime Facts
- Backend Dockerfile requires repo-root build context.
- Frontend Dockerfile requires repo-root build context.
- Backend startup hard-fails without `docs/spec-lock/AUTHORITIES.state.json`.
- Backend can run on SQLite with `data/` mounted.
- Redis is optional for the first staging closeout.

## Non-Authoritative / Legacy Paths
- `.github/workflows/deployment.yml` remains non-authoritative until it performs a real deploy.
- `ops/prod/docker-compose.prod.server.yml` is a legacy/full-stack reference, not the raw release input for this lane.
- Heroku, Azure, ArgoCD, Terraform, and other historical references discovered by `scan-infra.sh` are documentary until proven live.
