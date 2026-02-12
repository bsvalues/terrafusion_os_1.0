# Terrafusion AI Production Deployment Guide

## Pre-Deployment Checklist

### SSL Certificate Setup
Place your SSL certificates in the `nginx/ssl/` directory:
- `cert.pem` - Your SSL certificate
- `key.pem` - Your private key

### Environment Configuration
Copy `.env.template` to `.env` and configure:
```bash
cp .env.template .env
```

Update the following values:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key for GPT-4o
- `SESSION_SECRET` - Random string for session security
- `POSTGRES_PASSWORD` - Secure database password

### System Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM
- 20GB available disk space

## Deployment Process

### Automated Deployment
Execute the deployment script:
```bash
bash scripts/deploy.sh
```

The script performs:
1. Dependency verification
2. SSL certificate validation
3. Environment configuration check
4. Container build and deployment
5. Service health verification

### Manual Deployment
If automated deployment fails:

```bash
# Build containers
docker-compose build --no-cache

# Start services
docker-compose up -d

# Verify deployment
docker-compose ps
```

## Post-Deployment Verification

### Service Health Checks
- Application: `https://localhost`
- Metrics: `https://localhost/metrics`
- Database: Internal container network

### API Testing
Test core endpoints:
```bash
# System status
curl -k https://localhost/api/system_status

# Sample query
curl -k -X POST https://localhost/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me property count", "type": "general"}'
```

### Log Monitoring
Monitor service logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f terra-fusion-app
```

## Performance Optimization

### Database Tuning
PostgreSQL configuration optimizations:
- Connection pooling: 20 connections
- Shared buffers: 256MB
- Work memory: 4MB
- Maintenance work memory: 64MB

### Application Scaling
Horizontal scaling options:
- Increase Gunicorn workers (current: 4)
- Load balancer configuration
- Database read replicas
- Redis caching layer

### Monitoring Setup
Prometheus metrics available at `/metrics`:
- Request rate and latency
- Database connection pool usage
- Error rates by query type
- Memory and CPU utilization

## Security Hardening

### Network Security
- All external traffic encrypted via SSL/TLS
- Internal container communication on private network
- Database accessible only from application containers

### Application Security
- Environment-based secret management
- SQL injection prevention via parameterized queries
- Input validation and sanitization
- Session-based authentication

### Database Security
- PostgreSQL user with limited privileges
- Connection encryption enabled
- Regular security updates via container rebuilds

## Backup and Recovery

### Database Backup
Automated backup configuration:
```bash
# Create backup
docker-compose exec postgres pg_dump -U terra_admin terra_fusion > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U terra_admin terra_fusion < backup.sql
```

### Configuration Backup
Version control recommended files:
- Docker Compose configuration
- Nginx configuration
- Environment templates
- SSL certificate renewal scripts

## Troubleshooting

### Common Issues

**SSL Certificate Errors**
- Verify certificate files exist in `nginx/ssl/`
- Check certificate validity with `openssl x509 -in cert.pem -text`
- Ensure certificate matches domain name

**Database Connection Issues**
- Verify PostgreSQL container is running
- Check database credentials in `.env`
- Review connection pool settings

**OpenAI API Errors**
- Validate API key in environment variables
- Check API usage limits and billing
- Monitor rate limiting responses

**Memory Issues**
- Increase Docker memory allocation
- Reduce Gunicorn worker count
- Optimize database query performance

### Log Analysis
Critical log patterns to monitor:
- `ERROR` - Application errors requiring attention
- `CRITICAL` - System failures needing immediate response
- `WARNING` - Performance issues or degraded functionality

## Maintenance Schedule

### Daily
- Monitor system metrics and logs
- Verify backup completion
- Check SSL certificate expiration

### Weekly
- Review security logs
- Update container images
- Performance analysis and optimization

### Monthly
- SSL certificate renewal
- Database maintenance and optimization
- Security patch updates

## Support Contacts

For production support:
- Application logs: `docker-compose logs terra-fusion-app`
- Database logs: `docker-compose logs postgres`
- Nginx logs: `docker-compose logs nginx`
- Metrics dashboard: `https://localhost/metrics`