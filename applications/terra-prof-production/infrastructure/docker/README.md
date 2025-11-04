# Docker Configuration for TerraFusionPro

This directory contains Docker configurations for containerizing the TerraFusionPro
microservices and frontend applications.

## Directory Structure

- `base/`: Base Dockerfile templates
- `services/`: Service-specific Dockerfiles
- `development/`: Development environment configurations
- `production/`: Production environment configurations
- `scripts/`: Helper scripts for Docker operations

## Building Images

To build a single service:

```bash
docker build -t terrafusion/service-name -f services/service-name/Dockerfile .
