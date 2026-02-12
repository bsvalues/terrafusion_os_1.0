# TerraFusionPro Deployment Guide

This guide provides instructions for deploying the TerraFusionPro platform to various environments.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Environments](#deployment-environments)
3. [Deployment Strategies](#deployment-strategies)
4. [Prerequisites](#prerequisites)
5. [Deployment Steps](#deployment-steps)
6. [Verification](#verification)
7. [Rollback Procedure](#rollback-procedure)
8. [CI/CD Pipeline](#cicd-pipeline)

## Architecture Overview

TerraFusionPro is a distributed platform with the following components:

### Core Services
- Web Client: Frontend user interface (Port 5000)
- API Gateway: Central API for all services (Port 5002)
- User Service: User management and authentication (Port 5004)
- Property Service: Property data management (Port 5003)
- Form Service: Dynamic form creation and management (Port 5005)
- Analysis Service: Property data analysis and insights (Port 5006)
- Report Service: Report generation and management (Port 5007)
- Apollo Federation Gateway: GraphQL API gateway (Port 4000/4001)

### Integrated Applications
- TerraFusionSync (Port 3001)
- TerraFusionPro (Port 3002)
- TerraFlow (Port 3003)
- TerraMiner (Port 3004)
- TerraAgent (Port 3005)
- TerraF (Port 3006)
- TerraLegislativePulsePub (Port 3007)
- BCBSCostApp (Port 3008)
- BCBSGeoAssessmentPro (Port 3009)
- BCBSLevy (Port 3010)
- BCBSWebHub (Port 3011)
- BCBSDataEngine (Port 3012)
- BCBSPacsMapping (Port 3013)
- GeoAssessmentPro (Port 3014)
- BSBCMaster (Port 3015)
- BSIncomeValuation (Port 3016)
- TerraFusionMockup (Port 3017)

## Deployment Environments

### Local Development
- Uses Node.js and npm/nx for running services
- PostgreSQL database
- Each service runs independently on its assigned port

### Staging Environment
- Kubernetes-based deployment
- Blue/Green deployment strategy
- Automated CI/CD pipeline from GitHub Actions
- Accessible at https://staging.terrafusion.io

### Production Environment
- Kubernetes-based deployment
- Blue/Green deployment strategy
- Manual promotion from Staging after verification
- Accessible at https://app.terrafusion.io

## Deployment Strategies

### Blue/Green Deployment

TerraFusionPro uses a Blue/Green deployment strategy to minimize downtime and risk:

1. Two identical environments (Blue and Green) are maintained
2. Only one environment is active at any time
3. New deployments are made to the inactive environment
4. After verification, traffic is switched to the new environment
5. If issues occur, traffic can be immediately switched back

## Prerequisites

### Tools Required
- Node.js 20.x or later
- npm 9.x or later
- Docker and Docker Compose
- kubectl (for Kubernetes deployments)
- Access to container registry

### Environment Configuration
- Database connection strings
- API keys and secrets
- Environment-specific configuration

## Deployment Steps

### Local Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/terrafusionpro.git
   cd terrafusionpro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the database:
   ```bash
   docker-compose up -d postgres
   ```

4. Start all services:
   ```bash
   npm run start-all
   ```

5. Verify service health:
   ```bash
   chmod +x smoke-test.sh
   ./smoke-test.sh
   ```

### Kubernetes Deployment

1. Build and push Docker images:
   ```bash
   npm run build-images
   npm run push-images
   ```

2. Deploy to staging using the automated script:
   ```bash
   node scripts/deploy.js --env=staging --strategy=blue-green
   ```

3. Verify deployment in staging:
   ```bash
   kubectl get pods -n terrafusion-staging
   ```

4. Run smoke tests against staging:
   ```bash
   STAGING_URL=https://staging.terrafusion.io ./smoke-test.sh
   ```

5. If successful, promote to production:
   ```bash
   node scripts/deploy.js --env=production --strategy=blue-green --promote-from=staging
   ```

## Verification

After deployment, verify that all services are running correctly:

1. Check service status:
   ```bash
   kubectl get pods -n terrafusion-core
   ```

2. Run smoke tests:
   ```bash
   BASE_URL=https://app.terrafusion.io ./smoke-test.sh
   ```

3. Verify application functionality in the browser:
   - Open https://app.terrafusion.io
   - Log in with a test account
   - Create a test property
   - Generate a test report

## Rollback Procedure

If issues are detected after deployment, perform a rollback:

1. For Blue/Green deployments:
   ```bash
   node scripts/deploy.js --env=production --rollback
   ```

2. For traditional deployments:
   ```bash
   kubectl rollout undo deployment/[service-name] -n terrafusion-core
   ```

3. Verify rollback:
   ```bash
   ./smoke-test.sh
   ```

## CI/CD Pipeline

TerraFusionPro uses GitHub Actions for continuous integration and deployment:

1. Pull Request Workflow:
   - Runs on PR creation and updates
   - Builds all packages
   - Runs linting and tests
   - Reports test coverage

2. Main Branch Workflow:
   - Runs on merge to main
   - Builds and pushes Docker images
   - Deploys to staging environment
   - Runs smoke tests
   - Notifies team of deployment status

3. Release Workflow:
   - Triggered manually or by tag creation
   - Promotes staging environment to production
   - Runs smoke tests against production
   - Creates release notes
   - Notifies team of production deployment

### Pipeline Configuration

The CI/CD pipeline is configured in `.github/workflows/ci.yml` and includes:

- Matrix builds for all services
- Parallel testing
- Database setup for tests
- Docker build and push
- Kubernetes deployment
- Slack notifications

To view the status of the CI/CD pipeline, visit the GitHub Actions tab in the repository.