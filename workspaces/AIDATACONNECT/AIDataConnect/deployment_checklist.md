# RAG Drive FTP Hub Deployment Checklist

This document provides a comprehensive checklist for deploying the RAG Drive FTP Hub application to production environments.

## Pre-Deployment Checks

- [ ] All tests are passing with at least 80% code coverage
- [ ] All linting and code quality checks pass
- [ ] Database schema is up-to-date with the latest migrations
- [ ] Environment variables are properly configured
- [ ] Security scans have been performed and no vulnerabilities found
- [ ] Performance testing has been completed
- [ ] Documentation is up-to-date

## Environment Setup

- [ ] Node.js v20 or later is installed
- [ ] PostgreSQL 15 or later is configured and accessible
- [ ] Docker and docker-compose are installed (for containerized deployment)
- [ ] Network ports 5000 (application) and 21 (FTP) are open
- [ ] SSL certificates are valid and installed
- [ ] Firewall rules are configured properly
- [ ] DNS records are updated

## Required Environment Variables

- [ ] `DATABASE_URL`: PostgreSQL connection string
- [ ] `OPENAI_API_KEY`: OpenAI API key for AI features
- [ ] `NODE_ENV`: Set to `production` for production deployments
- [ ] `PORT`: Application port (default: 5000)
- [ ] `SESSION_SECRET`: Secret for session encryption
- [ ] `SLACK_WEBHOOK_URL`: (Optional) For deployment notifications

## Deployment Process

1. [ ] Run the deployment readiness script: `./scripts/deployment-readiness.sh`
2. [ ] Backup the database: `./scripts/db-backup.sh pre_deploy`
3. [ ] Build the application: `npm run build`
4. [ ] Deploy using the automated script: `./scripts/deploy.sh`
5. [ ] Verify application is accessible and functioning correctly

## Post-Deployment Verification

- [ ] User authentication works correctly
- [ ] File uploads and downloads function properly
- [ ] Data sources can be connected and accessed
- [ ] Pipeline builder is operational
- [ ] FTP connections can be established
- [ ] Analytics dashboard displays correct data
- [ ] All API endpoints return expected responses
- [ ] Error logging and monitoring is functioning

## Rollback Procedure

If deployment fails or critical issues are found:

1. [ ] Stop the application: `./scripts/restart.sh` or `docker-compose down`
2. [ ] Restore the database: `./scripts/db-restore.sh <backup_file>`
3. [ ] Redeploy the previous version or use the rollback feature in your CI/CD tool
4. [ ] Verify the rollback was successful

## Monitoring and Maintenance

- [ ] Set up server monitoring (CPU, memory, disk usage)
- [ ] Configure application performance monitoring
- [ ] Set up error alerting and notification
- [ ] Schedule regular database backups with `./scripts/db-backup.sh`
- [ ] Schedule regular security updates and patches

## Troubleshooting

Common issues and their solutions:

### Database Connection Issues
- Check the `DATABASE_URL` environment variable
- Verify database server is running and accessible
- Check network configuration and firewall rules

### Application Not Starting
- Check the application logs in `./logs/`
- Verify all dependencies are installed
- Ensure there are no port conflicts

### Authentication Problems
- Check session configuration
- Verify database tables for users are intact
- Check for environment configuration issues

## Support and Contact

For additional assistance with deployment issues, contact:
- Developer Team: [dev-team@example.com](mailto:dev-team@example.com)
- DevOps Support: [devops@example.com](mailto:devops@example.com)

*Last updated: March 2, 2025*