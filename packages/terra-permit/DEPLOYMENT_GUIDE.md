# TerraFusion-AI Deployment Guide

## Overview

This guide provides comprehensive deployment instructions for TerraFusion-AI Civil Infrastructure Simulation Framework across development, staging, and production environments.

## Prerequisites

### System Requirements
- Docker 20.10+
- Kubernetes 1.24+ (for production)
- Node.js 20+ (for development)
- PostgreSQL 15+
- Redis 7+

### Required Services
- OpenAI API access
- Pinecone vector database (optional for production)
- AWS S3 or compatible storage
- SMTP service for notifications

## Environment Setup

### 1. Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/terrafusion-ai.git
cd terrafusion-ai

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

### 2. Docker Development

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f terrafusion-app

# Stop services
docker-compose down
```

### 3. Production Deployment

#### Option A: Docker Compose Production

```bash
# Set environment variables
export POSTGRES_PASSWORD="your_secure_password"
export GRAFANA_PASSWORD="your_grafana_password"

# Deploy with production configuration
docker-compose -f docker-compose.production.yml up -d

# Monitor deployment
docker-compose -f docker-compose.production.yml ps
```

#### Option B: Kubernetes Deployment

```bash
# Create namespace and deploy
kubectl apply -f k8s-deployment.yaml

# Monitor deployment
kubectl get pods -n terrafusion -w

# Check service status
kubectl get svc -n terrafusion

# View application logs
kubectl logs -f deployment/terrafusion-app -n terrafusion
```

## Configuration Management

### Environment Variables

#### Required Variables
```env
DATABASE_URL=postgresql://username:password@localhost:5432/terrafusion_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_minimum_32_chars
SESSION_SECRET=your_session_secret_minimum_32_chars
OPENAI_API_KEY=sk-your_openai_key
```

#### Optional Variables
```env
PINECONE_API_KEY=your_pinecone_key
TWILIO_ACCOUNT_SID=your_twilio_sid
STRIPE_SECRET_KEY=sk_your_stripe_key
AWS_ACCESS_KEY_ID=your_aws_key
SENDGRID_API_KEY=SG.your_sendgrid_key
```

### Security Configuration

#### SSL/TLS Setup
```bash
# Generate self-signed certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/private.key \
  -out docker/nginx/ssl/certificate.crt

# For production, use Let's Encrypt or commercial certificates
```

#### Firewall Rules
```bash
# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SSH (adjust port as needed)
ufw allow 22/tcp

# Database (restrict to application servers)
ufw allow from 10.0.0.0/8 to any port 5432
```

## Database Setup

### PostgreSQL Configuration

```sql
-- Create database and user
CREATE DATABASE terrafusion_prod;
CREATE USER terrafusion WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE terrafusion_prod TO terrafusion;

-- Enable required extensions
\c terrafusion_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Database Migration

```bash
# Apply schema changes
npm run db:push

# Backup database
pg_dump -h localhost -U terrafusion terrafusion_prod > backup.sql

# Restore database
psql -h localhost -U terrafusion terrafusion_prod < backup.sql
```

## Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'terrafusion-app'
    static_configs:
      - targets: ['terrafusion-app:3000']
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']
```

### Grafana Dashboards

1. Import provided dashboard configurations from `docker/grafana/dashboards/`
2. Configure data sources pointing to Prometheus
3. Set up alerting rules for critical metrics

## Health Checks

### Application Health Endpoints

```bash
# Basic health check
curl http://localhost:3000/health

# Database connectivity
curl http://localhost:3000/health/database

# Redis connectivity
curl http://localhost:3000/health/redis

# AI services status
curl http://localhost:3000/health/ai-services
```

### System Health Monitoring

```bash
# Check container status
docker ps

# Monitor resource usage
docker stats

# Check logs for errors
docker logs terrafusion-app --tail 100
```

## Backup and Recovery

### Automated Backups

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > "backup_${DATE}.sql"
aws s3 cp "backup_${DATE}.sql" s3://your-backup-bucket/
```

### File Storage Backup

```bash
# Backup uploaded documents
tar -czf documents_backup_$(date +%Y%m%d).tar.gz uploads/
aws s3 cp documents_backup_*.tar.gz s3://your-backup-bucket/documents/
```

## Performance Optimization

### Application Tuning

```javascript
// Node.js production optimizations
process.env.NODE_ENV = 'production';
process.env.UV_THREADPOOL_SIZE = '16';
```

### Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_permits_status ON permits(status);
CREATE INDEX CONCURRENTLY idx_permits_created_at ON permits(created_at);
CREATE INDEX CONCURRENTLY idx_documents_permit_id ON documents(permit_id);
```

### Redis Configuration

```conf
# redis.conf optimizations
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Scaling

### Horizontal Scaling

```yaml
# Kubernetes HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: terrafusion-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: terrafusion-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Load Balancing

```nginx
# nginx.conf
upstream terrafusion_backend {
    least_conn;
    server terrafusion-app-1:3000;
    server terrafusion-app-2:3000;
    server terrafusion-app-3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://terrafusion_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check environment variables
env | grep -E "(DATABASE_URL|REDIS_URL|OPENAI_API_KEY)"

# Verify database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check Redis connectivity
redis-cli -u $REDIS_URL ping
```

#### High Memory Usage
```bash
# Check Node.js heap usage
curl http://localhost:3000/health/memory

# Monitor container resources
docker stats terrafusion-app

# Check for memory leaks
node --inspect server/index.js
```

#### Database Connection Issues
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill long-running queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'active' AND query_start < now() - interval '5 minutes';
```

### Log Analysis

```bash
# Application logs
docker logs terrafusion-app --tail 1000 | grep ERROR

# Database logs
docker logs postgres | grep -E "(ERROR|FATAL)"

# System logs
journalctl -u docker.service --since "1 hour ago"
```

## Security Checklist

- [ ] HTTPS enabled with valid certificates
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] File upload restrictions enforced
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF protection implemented
- [ ] Security headers configured
- [ ] Regular security updates applied
- [ ] Audit logging enabled
- [ ] Backup encryption enabled
- [ ] Access controls properly configured
- [ ] Network segmentation implemented

## Maintenance

### Regular Tasks

- Daily: Monitor application and system health
- Weekly: Review security logs and alerts
- Monthly: Apply security updates and patches
- Quarterly: Performance review and optimization
- Annually: Security audit and penetration testing

### Update Process

```bash
# Backup before updates
./scripts/backup.sh

# Pull latest code
git pull origin main

# Build new image
docker build -t terrafusion/icsf:latest .

# Rolling update (Kubernetes)
kubectl set image deployment/terrafusion-app terrafusion-app=terrafusion/icsf:latest -n terrafusion

# Verify deployment
kubectl rollout status deployment/terrafusion-app -n terrafusion
```

## Support

For deployment issues or questions:
- Documentation: [docs/](docs/)
- GitHub Issues: [GitHub Issues](https://github.com/your-org/terrafusion-ai/issues)
- Professional Support: enterprise@terrafusion-ai.com