# Terrafusion Production Deployment Guide

## Overview
Terrafusion is a production-ready AI-powered property assessment platform designed for county assessor offices. This guide covers deployment, configuration, and operational procedures for government environments.

## System Requirements

### Hardware Specifications
- **CPU**: 4+ cores (Intel Xeon or AMD EPYC recommended)
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 500GB SSD minimum, 1TB recommended
- **Network**: Gigabit ethernet, redundant connections preferred

### Software Dependencies
- **OS**: Ubuntu 20.04 LTS or RHEL 8+
- **Docker**: 20.10+ with Docker Compose
- **Node.js**: 18+ (for development)
- **PostgreSQL**: 15+ with PostGIS extension
- **Redis**: 7+ for caching and session management
- **Nginx**: Latest stable for reverse proxy

## Security Configuration

### SSL/TLS Setup
1. Obtain certificates from your organization's CA
2. Place certificates in `./ssl/` directory:
   - `cert.pem` - Certificate chain
   - `key.pem` - Private key
3. Configure nginx with strong cipher suites (included in nginx.conf)

### Environment Variables
Create `.env.production` file:

```bash
# Database Configuration
DATABASE_URL=postgresql://terrafusion:SECURE_PASSWORD@postgres:5432/terrafusion_prod
POSTGRES_PASSWORD=SECURE_PASSWORD

# Redis Configuration  
REDIS_PASSWORD=SECURE_REDIS_PASSWORD

# Application Settings
NODE_ENV=production
PORT=3000
JWT_SECRET=GENERATE_256_BIT_SECRET
ENCRYPTION_KEY=GENERATE_32_BYTE_KEY

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Monitoring
HEALTH_CHECK_INTERVAL=30
LOG_LEVEL=info
```

### Network Security
- Configure firewall to allow only ports 80, 443, and SSH
- Use VPN for administrative access
- Implement network segmentation for database tier
- Configure intrusion detection systems

## Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-org/terrafusion.git
cd terrafusion

# Set up environment
cp .env.example .env.production
# Edit .env.production with secure values

# Generate SSL certificates (if not using existing CA)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# Build and deploy
docker-compose -f docker-compose.production.yml up -d
```

### 3. Database Initialization
```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec terrafusion-app npm run db:push

# Import initial data (if available)
docker-compose -f docker-compose.production.yml exec terrafusion-app node import-benton-data.js
```

## Data Import and Migration

### Property Data Import
1. Prepare CSV files in the required format:
   - `properties.csv` - Main property records
   - `sales.csv` - Sales comparable data
   - `improvements.csv` - Property improvements

2. Use the import script:
```bash
node import-benton-data.js --file=properties.csv --type=properties
```

### Database Backup and Recovery
```bash
# Create backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U terrafusion terrafusion_prod > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose -f docker-compose.production.yml exec -i postgres psql -U terrafusion terrafusion_prod < backup_20240101.sql
```

## Monitoring and Maintenance

### Health Monitoring
- **Health Check Endpoint**: `https://your-domain.gov/health`
- **Metrics Dashboard**: `https://your-domain.gov/api/system/metrics`
- **Performance Analytics**: `https://your-domain.gov/api/system/analytics`

### Log Management
```bash
# View application logs
docker-compose -f docker-compose.production.yml logs -f terrafusion-app

# View system metrics
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain.gov/api/system/metrics
```

### Automated Maintenance
Set up cron jobs for:
```bash
# Daily database backup (2 AM)
0 2 * * * /opt/terrafusion/scripts/backup.sh

# Weekly log rotation (Sunday 3 AM)  
0 3 * * 0 /opt/terrafusion/scripts/log-rotate.sh

# Monthly system health report (1st day, 6 AM)
0 6 1 * * /opt/terrafusion/scripts/health-report.sh
```

## Performance Optimization

### Database Tuning
```sql
-- Optimize PostgreSQL for property data
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
SELECT pg_reload_conf();
```

### Caching Strategy
- Redis for session storage and API response caching
- Browser caching for static assets (1 year)
- CDN deployment for global access (if applicable)

### Load Balancing
For high-availability deployments:
```yaml
# docker-compose.ha.yml
services:
  terrafusion-app:
    deploy:
      replicas: 3
  nginx-lb:
    image: nginx:alpine
    # Load balancer configuration
```

## Security Hardening

### Application Security
- All inputs sanitized and validated
- Rate limiting on API endpoints
- SQL injection protection via parameterized queries
- XSS protection headers
- CSRF protection for forms

### Infrastructure Security
- Regular security updates via automated patching
- File system permissions locked down
- Database access restricted to application user
- Audit logging enabled for all administrative actions

### Compliance Requirements
- NIST Cybersecurity Framework alignment
- SOC 2 Type II controls implementation
- Regular vulnerability assessments
- Incident response procedures documented

## Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Check PostgreSQL service status
   - Verify network connectivity
   - Review connection string format

2. **High Memory Usage**
   - Monitor Node.js heap usage
   - Check for memory leaks in agent processing
   - Scale horizontally if needed

3. **Performance Degradation**
   - Review slow query logs
   - Check database index utilization
   - Monitor system resource usage

### Support Contacts
- **Technical Support**: [your-support-email]
- **Emergency Escalation**: [emergency-contact]
- **Documentation**: [docs-url]

## Disaster Recovery

### Backup Strategy
- **Database**: Daily full backup, hourly incrementals
- **Application Files**: Version control with Git
- **Configuration**: Encrypted backup of environment files

### Recovery Procedures
1. Restore from most recent backup
2. Verify data integrity
3. Test all critical functions
4. Update monitoring systems
5. Document incident and lessons learned

## Version Updates

### Update Process
1. Test updates in staging environment
2. Schedule maintenance window
3. Create full system backup
4. Deploy new version using blue-green strategy
5. Verify system functionality
6. Monitor for 24 hours post-deployment

This deployment guide ensures Terrafusion operates securely and efficiently in production government environments.