# RAG Drive FTP Hub - Deployment Guide

This guide provides step-by-step instructions for deploying the RAG Drive FTP Hub application to production environments.

## Prerequisites

Before deploying, ensure you have:

- Access to the production environment
- Database credentials for production
- API keys for external services (OpenAI, Slack, etc.)
- SSL certificates for secure connections
- Docker installed (if using containerized deployment)
- Node.js v20.x and npm installed
- PostgreSQL v15.x or higher

## Deployment Options

The RAG Drive FTP Hub can be deployed using one of the following methods:

### Option 1: Docker Deployment (Recommended)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/rag-drive-ftphub.git
   cd rag-drive-ftphub
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Build and Run with Docker Compose**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Verify Deployment**
   ```bash
   docker-compose logs -f
   # Check application logs for successful startup
   ```

### Option 2: Manual Deployment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/rag-drive-ftphub.git
   cd rag-drive-ftphub
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build the Application**
   ```bash
   npm run build
   ```

5. **Set Up the Database**
   ```bash
   npm run db:push
   ```

6. **Start the Application**
   ```bash
   npm run start
   ```

## Environment Variables

The following environment variables must be configured:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Port to run the server on | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/database` |
| `SESSION_SECRET` | Secret for session cookies | `your-secure-session-secret` |
| `OPENAI_API_KEY` | OpenAI API key for RAG features | `sk-...` |
| `SLACK_API_TOKEN` | Slack API token for notifications | `xoxb-...` |
| `FTP_USER` | Default FTP username | `ftpuser` |
| `FTP_PASSWORD` | Default FTP password | `secure-password` |
| `FTP_PORT` | FTP server port | `21` |
| `SSL_CERT_PATH` | Path to SSL certificate | `/path/to/cert.pem` |
| `SSL_KEY_PATH` | Path to SSL private key | `/path/to/key.pem` |

## Post-Deployment Steps

After deploying the application, complete these steps:

1. **Run Database Migrations**
   The database schema should be automatically updated during deployment, but verify it:
   ```bash
   npm run db:push
   ```

2. **Verify Application Health**
   Access the application health endpoint:
   ```bash
   curl https://your-domain.com/api/health
   ```

3. **Create Admin User**
   If this is a fresh installation, create an admin user:
   ```bash
   npm run create-admin
   ```

4. **Configure Monitoring**
   Set up monitoring and alerting:
   ```bash
   ./scripts/setup-monitoring.sh
   ```

5. **Set Up Backups**
   Configure automated backups:
   ```bash
   ./scripts/setup-backups.sh
   ```

## Scaling Considerations

The RAG Drive FTP Hub can be scaled in several ways:

### Horizontal Scaling

To handle increased load:
- Deploy multiple application instances behind a load balancer
- Configure sticky sessions for user authentication
- Ensure the database can handle the increased connection load

### Vertical Scaling

For higher performance on a single node:
- Increase CPU and memory resources
- Optimize the Node.js garbage collection settings
- Increase database connection pool size

### Database Scaling

For improved database performance:
- Use connection pooling
- Consider read replicas for heavy read workloads
- Implement database sharding for very large installations

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Verify DATABASE_URL is correct
   - Check database server is running
   - Ensure network allows connections

2. **Application Startup Failures**
   - Check logs for error messages
   - Verify all required environment variables are set
   - Confirm port is not already in use

3. **FTP Connection Issues**
   - Verify FTP_PORT is open in the firewall
   - Check SSL certificates are valid
   - Ensure uploads directory is writable

### Getting Help

If you encounter issues not covered in this guide:
- Check the logs at `./logs/combined.log` and `./logs/error.log`
- Run the diagnostics script: `./scripts/diagnose.sh`
- Contact support at support@ragdrive-ftphub.com

## Version Updates

When updating to a new version:

1. **Back Up Data**
   ```bash
   ./scripts/db-backup.sh
   ```

2. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

3. **Update Dependencies**
   ```bash
   npm install
   ```

4. **Rebuild Application**
   ```bash
   npm run build
   ```

5. **Restart Services**
   ```bash
   # For Docker deployment
   docker-compose down
   docker-compose up -d
   
   # For manual deployment
   npm run restart
   ```

## Rollback Procedure

If you need to roll back to a previous version:

1. **Stop the Current Version**
   ```bash
   # For Docker deployment
   docker-compose down
   
   # For manual deployment
   npm run stop
   ```

2. **Restore Database**
   ```bash
   ./scripts/db-restore.sh backup_filename.sql
   ```

3. **Check Out Previous Version**
   ```bash
   git checkout v1.x.x
   ```

4. **Rebuild and Restart**
   ```bash
   npm install
   npm run build
   
   # For Docker deployment
   docker-compose up -d
   
   # For manual deployment
   npm run start
   ```

## Security Considerations

### Production Hardening

1. **Set Secure HTTP Headers**
   - Ensure proper Content-Security-Policy
   - Enable Strict-Transport-Security
   - Configure X-Content-Type-Options

2. **Restrict Network Access**
   - Use firewall to limit access to application ports
   - Implement IP allowlisting where appropriate
   - Keep the database in a private network

3. **Regular Updates**
   - Keep dependencies up to date
   - Apply security patches promptly
   - Run regular security scans

## Maintenance

### Regular Maintenance Tasks

1. **Database Optimization**
   Run weekly:
   ```bash
   ./scripts/optimize-db.js
   ```

2. **Log Rotation**
   Configure logrotate or run:
   ```bash
   ./scripts/rotate-logs.sh
   ```

3. **Performance Monitoring**
   Check performance dashboard:
   ```bash
   ./scripts/performance-dashboard.js
   ```

4. **Security Scans**
   Run monthly:
   ```bash
   npm audit
   ./scripts/security-scan.sh
   ```

---

For additional deployment assistance, contact the DevOps team or refer to internal documentation.