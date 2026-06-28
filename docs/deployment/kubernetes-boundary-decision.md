# Kubernetes Boundary Decision

## Decision

Kubernetes and Helm are deferred for the local-platform onboarding lane.

Existing backend Helm charts and production-like container surfaces are evidence that deployment
infrastructure exists, not authorization to edit or run it. Local developer onboarding remains Docker
Compose based and limited to `docker/dev/**`.

## What Exists

- Backend Helm chart surfaces under `backend/helm/**`.
- Production-like Compose and operations surfaces outside `docker/dev/**`.
- Local Docker dev support under `docker/dev/**`.

## What Is Deferred

- New Kubernetes manifests.
- Helm chart edits.
- Cluster access.
- `kubectl` against real clusters.
- Image publishing.
- Production deployment.
- County runtime overlays.

## Why Production-Like Surfaces Are Excluded

Production-like container and Helm files can carry deployment, secret, county, PACS, SQL, or runtime
assumptions. Reusing them for local onboarding would blur the boundary between developer experience
and production infrastructure.

## Prerequisites For Future Kubernetes Work

A future Kubernetes readiness work order must define:

- The target environment and whether it is local-only, dev-only, or production.
- Image build contract and tags.
- Environment variable contract using secret names only.
- Health checks.
- Rollback expectations.
- County overlay boundary.
- Explicit no-secrets and no-county-data handling.
- Validation commands that do not touch production unless separately authorized.

## Hard Boundary

No secrets, county data, PACS, county SQL, production resources, or live cluster mutation are
authorized by this decision.
