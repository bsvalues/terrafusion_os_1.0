# TerraFusionPro Development Documentation

This directory contains documentation for developers working on the TerraFusionPro platform.

## Getting Started

1. **Prerequisites**
   - Node.js 18+
   - Docker and Docker Compose
   - Git
   - MongoDB (local or Docker)
   - PostgreSQL (local or Docker)

2. **Setup Instructions**
   - [Environment Setup](./environment-setup.md)
   - [Development Workflow](./development-workflow.md)
   - [Testing Guide](./testing.md)

## Development Standards

- [Coding Style Guide](./style-guide.md)
- [Git Workflow](./git-workflow.md)
- [Code Review Process](./code-review.md)
- [Documentation Standards](./documentation-standards.md)

## Architecture

- [System Architecture](../architecture/README.md)
- [Data Models](./data-models.md)
- [API Design](../api/README.md)

## Monorepo Structure

TerraFusionPro is organized as a monorepo using Lerna. The repository structure is described in detail in the [Repository Structure](./repository-structure.md) document.

## Package Development

- [Shared Package Development](./packages/shared.md)
- [API Gateway Development](./packages/api.md)
- [Web Client Development](./packages/web-client.md)
- [Field App Development](./packages/field-app.md)
- [Agents Development](./packages/agents.md)

## Service Development

- [Property Service Development](./services/property-service.md)
- [User Service Development](./services/user-service.md)
- [Form Service Development](./services/form-service.md)
- [Analysis Service Development](./services/analysis-service.md)
- [Report Service Development](./services/report-service.md)

## Testing

- [Unit Testing](./testing/unit-testing.md)
- [Integration Testing](./testing/integration-testing.md)
- [End-to-End Testing](./testing/e2e-testing.md)
- [Performance Testing](./testing/performance-testing.md)

## Deployment

- [Development Deployment](./deployment/development.md)
- [Staging Deployment](./deployment/staging.md)
- [Production Deployment](./deployment/production.md)
- [CI/CD Pipeline](./deployment/ci-cd.md)

## Troubleshooting

- [Common Issues](./troubleshooting/common-issues.md)
- [Debugging Guide](./troubleshooting/debugging.md)
- [Logging and Monitoring](./troubleshooting/logging-monitoring.md)

## Version Control

- [Branching Strategy](./version-control/branching.md)
- [Commit Message Guidelines](./version-control/commit-messages.md)
- [Release Process](./version-control/releases.md)

## Security

- [Security Guidelines](./security/guidelines.md)
- [Authentication and Authorization](./security/auth.md)
- [Data Protection](./security/data-protection.md)
