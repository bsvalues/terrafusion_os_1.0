# GeoAssessmentPro Deployment Guide

This document provides detailed instructions for deploying the GeoAssessmentPro application in various environments.

## Deployment Environments

The application supports the following deployment environments:

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

## Prerequisites

Before deploying the application, ensure the following prerequisites are met:

- Python 3.10+ installed
- PostgreSQL 13+ with PostGIS extension
- Node.js 16+ (for optional frontend build tools)
- Git

## Environment Configuration

Each environment has its own configuration file in the `deployment/configs` directory:

- `development.json`: Configuration for local development
- `staging.json`: Configuration for staging environment
- `production.json`: Configuration for production environment

These configuration files use environment variable placeholders (`${VAR_NAME}`) that are replaced with actual values during deployment.

## Required Environment Variables

The following environment variables must be set before deployment:

### Database Connection
- `PGHOST`: PostgreSQL host
- `PGPORT`: PostgreSQL port
- `PGUSER`: PostgreSQL username
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name

### Application Security
- `SESSION_SECRET`: Secret key for session encryption

### External Services
- `SUPABASE_URL`: Supabase URL
- `SUPABASE_KEY`: Supabase API key
- `SUPABASE_JWT`: Supabase JWT secret
- `GIS_API_KEY`: GIS service API key (if using external GIS service)

### Storage (Production)
- `AWS_ACCESS_KEY`: AWS access key (for S3 storage)
- `AWS_SECRET_KEY`: AWS secret key (for S3 storage)
- `AWS_REGION`: AWS region (for S3 storage)
- `S3_BUCKET`: S3 bucket name (for S3 storage)

### Caching (Production)
- `REDIS_URL`: Redis connection URL (for production caching)

### Monitoring (Production)
- `SENTRY_DSN`: Sentry DSN for error reporting

## Deployment Process

The application deployment is handled by the `deploy.py` script in the `deployment/scripts` directory.

### Basic Deployment

To deploy the application to an environment:

```bash
python deployment/scripts/deploy.py --env [environment]
```

For example, to deploy to the production environment:

```bash
python deployment/scripts/deploy.py --env production
```

### Deployment Options

The deployment script supports several options:

- `--env`, `-e`: Deployment environment (development, staging, production)
- `--skip-migration`, `-m`: Skip database migration
- `--skip-tests`, `-t`: Skip running tests
- `--debug`, `-d`: Enable debug output
- `--backup`, `-b`: Perform database backup before deployment

Example:

```bash
python deployment/scripts/deploy.py --env staging --backup --debug
```

## Database Migration

During deployment, the script automatically runs database migrations using Flask-Migrate. This ensures the database schema is up to date with the application code.

If you need to skip migrations (for example, if they were already applied), use the `--skip-migration` flag.

## Backup and Restore

### Creating a Backup

To create a database backup before deployment:

```bash
python deployment/scripts/deploy.py --env production --backup
```

Backups are stored in the `backup/[timestamp]` directory.

### Restoring from Backup

To restore from a backup:

```bash
# Using pg_restore
pg_restore -h [host] -p [port] -U [username] -d [database] -c backup/[timestamp]/database.dump
```

## Deployment Verification

After deployment, verify the application is running correctly:

1. Check application logs for errors
2. Access the application URL and verify the homepage loads
3. Test key functionality (map viewer, property search, etc.)
4. Check monitoring dashboards for any anomalies

## Troubleshooting

If you encounter issues during deployment:

1. Check the deployment logs in `deployment/logs/deploy.log`
2. Verify environment variables are set correctly
3. Check database connection and permissions
4. Ensure all required services (PostgreSQL, Redis, etc.) are running
5. Check application logs for runtime errors

## Rollback Procedure

If a deployment fails or causes issues in production:

1. Roll back database changes:
   ```bash
   flask db downgrade
   ```

2. Restore from the most recent backup:
   ```bash
   pg_restore -h [host] -p [port] -U [username] -d [database] -c backup/[timestamp]/database.dump
   ```

3. Restart the application:
   ```bash
   sudo systemctl restart geoassessmentpro
   ```

## Continuous Deployment

For continuous deployment, integrate the deployment script with your CI/CD pipeline:

1. Run tests in the CI environment
2. If tests pass, deploy to staging
3. After manual verification, deploy to production

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.10
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      - name: Deploy to staging
        run: python deployment/scripts/deploy.py --env staging
        env:
          # Set environment variables here
          PGHOST: ${{ secrets.STAGING_PGHOST }}
          PGPORT: ${{ secrets.STAGING_PGPORT }}
          # ... other environment variables
```

## Security Considerations

- Never store sensitive information (passwords, API keys, etc.) in the configuration files
- Always use environment variables for sensitive information
- Ensure the application is running with the minimum required permissions
- Use HTTPS for all production deployments
- Regularly update dependencies to address security vulnerabilities
- Implement rate limiting for API endpoints to prevent abuse