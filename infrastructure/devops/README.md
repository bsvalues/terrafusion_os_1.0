# DevOps Kit Overview (TMR-156)

## Overview

Infrastructure and deployment tooling for TerraFusion OS DataMining services.

## Components

### Docker

- `Dockerfile` per microservice in `backend/`
- Multi-stage builds: restore, build, publish, runtime
- Base images: `mcr.microsoft.com/dotnet/aspnet:8.0`
- No secrets baked into images; use environment variables

### Helm / Kubernetes

- Helm charts define service deployments, services, ingress
- ConfigMaps for non-sensitive configuration
- Secrets managed via Kubernetes Secrets or external vault
- Resource limits and health probes configured per service

### CI/CD

- GitHub Actions workflows in `.github/workflows/`
- Pipeline stages: lint, build, test, publish, deploy
- Branch protection on `main`; PRs require passing checks
- Container images pushed to registry on merge

### Terraform

- Infrastructure-as-code for cloud resources
- State stored remotely (never in repo)
- Modules for networking, compute, database, monitoring
- Environment-specific variable files (no secrets in code)

### Prometheus / Grafana

- Prometheus scrapes `/metrics` endpoints from each service
- Grafana dashboards for system health, ETL status, alerts
- Alert rules defined in Prometheus config
- `MonitoringBackgroundService` exposes custom metrics

## Port Allocation

| Service | Port |
|---------|------|
| Frontend | 3000 |
| API (Kernel) | 5000 |
| Gateway | 3002 |
| Consciousness | 3004 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Consul | 8500 |
| Prometheus | 9090 |
| Grafana | 3001 |

## Environment Variables

All sensitive configuration is provided via environment variables or secret stores. Reference `appsettings.json` for key names; never commit actual values.

## Quick Start

```bash
# Build all services
docker-compose -f backend/docker-compose.microservices.yml build

# Run locally
docker-compose -f backend/docker-compose.microservices.yml up -d

# Validate deployment
./scripts/validate-deployment.sh
```
