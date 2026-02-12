# Terrafusion Platform - Production Deployment Guide

## 🎯 Quick Start Deployment

### Prerequisites Checklist

- [ ] Docker & Docker Compose installed
- [ ] Node.js 20+ and npm installed
- [ ] Python 3.11+ installed
- [ ] PostgreSQL 15+ accessible
- [ ] API keys for AI services ready
- [ ] SSL certificates prepared (for HTTPS)

### 1. Initial Setup (5 minutes)

```bash
# Clone and enter directory
git clone <repository-url>
cd terrafusion-platform

# Configure environment
cp devops-kit/.env.example .env
# Edit .env with your actual values

# Make deployment script executable
chmod +x devops-kit/scripts/deploy.sh
```

### 2. Configure Environment Variables

Edit `.env` file with your actual values:

```bash
# Required for basic operation
DATABASE_URL=postgresql://user:password@database:5432/terrafusion
JWT_SECRET=your_secure_jwt_secret_here
OPENAI_API_KEY=sk-your_openai_key_here

# Optional but recommended
REDIS_URL=redis://:password@redis:6379/0
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
```

### 3. Deploy to Production (10 minutes)

```bash
# Run automated deployment
./devops-kit/scripts/deploy.sh production

# Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Verify Deployment

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Test application endpoints
curl http://localhost/health
curl http://localhost/api/health
curl http://localhost/ai/health
```

## 🏗️ Manual Deployment Steps

### Database Setup

```bash
# Start PostgreSQL
docker-compose -f docker-compose.prod.yml up -d database

# Wait for database to be ready
docker-compose -f docker-compose.prod.yml exec database pg_isready -U terrafusion

# Run migrations
docker-compose -f docker-compose.prod.yml run --rm backend npm run db:push

# Optional: Seed initial data
docker-compose -f docker-compose.prod.yml run --rm backend npm run db:seed
```

### Service Startup Order

```bash
# 1. Infrastructure services
docker-compose -f docker-compose.prod.yml up -d database redis

# 2. AI engine (requires model loading time)
docker-compose -f docker-compose.prod.yml up -d ai-engine

# 3. Backend API
docker-compose -f docker-compose.prod.yml up -d backend

# 4. Frontend and load balancer
docker-compose -f docker-compose.prod.yml up -d frontend nginx

# 5. Monitoring (optional)
docker-compose -f docker-compose.prod.yml up -d prometheus grafana
```

## 🌐 Service Endpoints

After successful deployment, access these URLs:

| Service        | URL                     | Purpose                    |
| -------------- | ----------------------- | -------------------------- |
| **Frontend**   | http://localhost        | Main application interface |
| **API**        | http://localhost/api    | REST API endpoints         |
| **AI Engine**  | http://localhost/ai     | AI valuation services      |
| **WebSocket**  | ws://localhost/basic-ws | Real-time communication    |
| **Grafana**    | http://localhost:3000   | Monitoring dashboard       |
| **Prometheus** | http://localhost:9090   | Metrics collection         |

## 🔧 Configuration Details

### Feature Flags

Enable/disable features in `.env`:

```bash
FEATURE_AI_VALUATIONS=true
FEATURE_MLS_INTEGRATION=false
FEATURE_REAL_TIME_COLLABORATION=true
FEATURE_ADVANCED_REPORTING=true
FEATURE_MOBILE_SYNC=false
```

### Security Configuration

```bash
# JWT Configuration
JWT_SECRET=your_256_bit_secret
JWT_EXPIRES_IN=24h

# CORS Settings
CORS_ORIGIN=https://yourdomain.com

# SSL/TLS (for HTTPS)
SSL_CERT_PATH=/etc/ssl/certs/certificate.crt
SSL_KEY_PATH=/etc/ssl/certs/private.key
```

### Performance Tuning

```bash
# Database Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis Cache
CACHE_TTL=3600
CACHE_MAX_SIZE=100MB

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## 📊 Monitoring & Health Checks

### Built-in Health Endpoints

```bash
# Application health
curl http://localhost/health

# API health
curl http://localhost/api/health

# AI engine health
curl http://localhost/ai/health

# Database health
docker-compose -f docker-compose.prod.yml exec database pg_isready
```

### Monitoring Setup

The platform includes Prometheus + Grafana for monitoring:

1. **Prometheus** (http://localhost:9090)

   - Metrics collection
   - Alert rule management
   - Query interface

2. **Grafana** (http://localhost:3000)
   - Visual dashboards
   - Alert notifications
   - Performance analytics

### Log Management

```bash
# View all service logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs ai-engine

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

## 🛡️ Security Hardening

### SSL/TLS Setup

```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/certificate.crt -days 365 -nodes

# Or use Let's Encrypt (production)
certbot certonly --standalone -d yourdomain.com
```

### Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### Database Security

```bash
# Use strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Enable SSL connections
PGSSLMODE=require
```

## 🔄 Backup & Recovery

### Automated Backups

```bash
# Enable backup in environment
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
```

### Manual Backup

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec database pg_dump -U terrafusion terrafusion > backup_$(date +%Y%m%d).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Configuration backup
cp .env .env.backup
```

### Recovery Procedure

```bash
# Restore database
docker-compose -f docker-compose.prod.yml exec -T database psql -U terrafusion terrafusion < backup.sql

# Restore files
tar -xzf uploads_backup.tar.gz
```

## 🚀 Scaling Considerations

### Horizontal Scaling

```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Use load balancer
# Configure nginx upstream with multiple backend instances
```

### Database Scaling

```bash
# Read replicas for database
# Configure master-slave replication
# Use connection pooling (PgBouncer)
```

### Caching Strategy

```bash
# Redis clustering
# CDN for static assets
# Application-level caching
```

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Failed**

```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps database

# Verify connection string
docker-compose -f docker-compose.prod.yml exec backend npm run db:check
```

**2. AI Service Unavailable**

```bash
# Check API keys
echo $OPENAI_API_KEY

# Restart AI service
docker-compose -f docker-compose.prod.yml restart ai-engine
```

**3. WebSocket Connection Issues**

```bash
# Check nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Verify WebSocket proxy settings
curl -H "Upgrade: websocket" -H "Connection: Upgrade" http://localhost/basic-ws
```

### Getting Help

- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Review configuration: `cat .env`
- Test connectivity: Run health checks
- Contact support: Include logs and configuration details

## 📋 Post-Deployment Checklist

- [ ] All services running (green status)
- [ ] Health endpoints responding
- [ ] Database migrations completed
- [ ] SSL certificates configured
- [ ] Monitoring dashboards accessible
- [ ] Backup system configured
- [ ] Security headers verified
- [ ] Performance benchmarks met
- [ ] Documentation updated

---

**Deployment Status**: ✅ Production Ready  
**Last Updated**: 2025-05-28  
**Support**: devops@terrafusion.com
