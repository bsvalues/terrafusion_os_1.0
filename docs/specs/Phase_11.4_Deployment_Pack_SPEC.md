# Phase 11.4: Deployment Pack Specification

## Objective
Create a self-contained "Go-Bag" (Artifact) for deployment to the sovereign host `jcharrispacs`. This artifact must contain only the necessary files for runtime operations, stripping away development source code and git history.

## Artifact Structure

The build script will generate a folder `dist/v1.1.0-sov/` containing:

```text
/dist/v1.1.0-sov/
├── docker-compose.yml       # Renamed from ops/prod/docker-compose.prod.server.yml
├── docker-compose.obs.yml   # Mirrored from root docker-compose.observability.yml (for optional monitoring)
├── secrets.env              # Renamed from ops/prod/secrets.prod.template.env (Template)
├── setup_host.ps1           # Mirrored from ops/prod/setup_host.ps1
├── verify.ps1               # Mirrored from ops/prod/verify_connection_string.ps1
├── config/                  # Complete copy of root config/ directory (Prometheus, Grafana, alerts)
└── scripts/                 #
    └── gates/               # Copy of validation scripts for on-server health checks
```

## Packaging
*   **Format**: Zip Archive (`TerraFusion_v1.1.0_SOVEREIGN.zip`)
*   **Seal**: SHA256 checksum generated after zipping.

## Usage
This artifact is copied to `C:\TerraFusion` on the production server. The `secrets.env` is renamed to `secrets.prod.env` and populated with real credentials before launch.
