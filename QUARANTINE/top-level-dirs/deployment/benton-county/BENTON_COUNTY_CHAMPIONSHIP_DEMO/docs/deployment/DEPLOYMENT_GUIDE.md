# 🚀 Terrafusion Deployment Guide
## Benton County Championship Demo - Complete Deployment Documentation

---

## 📋 Deployment Overview

### Deployment Options
1. **Quick Development**: Single-command local setup
2. **Docker Compose**: Containerized multi-service deployment
3. **Production Deployment**: Enterprise-grade with monitoring
4. **CI/CD Pipeline**: Automated deployment with GitHub Actions
5. **Kubernetes**: Scalable container orchestration

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores, 2.4GHz
- **RAM**: 4GB
- **Disk**: 20GB free space
- **Network**: 100Mbps connection
- **OS**: Linux, macOS, or Windows 10/11

#### Recommended (Production)
- **CPU**: 8+ cores, 3.0GHz+
- **RAM**: 16GB+
- **Disk**: 100GB+ SSD
- **Network**: 1Gbps connection
- **OS**: Ubuntu 20.04 LTS or RHEL 8+

#### Software Dependencies
- **Node.js**: v18.x or higher
- **Docker**: v20.10+ with Docker Compose
- **Git**: v2.30+
- **Curl**: For health checks and testing

---

## 🎯 Quick Development Deployment

### One-Command Setup
```bash
# Clone and start in one command
git clone <repository-url>
cd BENTON_COUNTY_CHAMPIONSHIP_DEMO
./launch-championship.sh
```

### Manual Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Start the demo server
node demo-server.js

# 3. Verify deployment
curl http://localhost:3000/api/demo/health
```

### Development Environment Verification
```bash
# Check all endpoints
curl http://localhost:3000/api/demo/overview
curl http://localhost:3000/api/demo/properties
curl http://localhost:3000/api/demo/scenarios
curl http://localhost:3000/api/monitoring/performance
```

**Expected Response Time**: <10ms  
**Expected Memory Usage**: 50-80MB  
**Expected Status**: All endpoints return HTTP 200

---

## 🐳 Docker Compose Deployment

### Prerequisites
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (if not included)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Environment Configuration
```bash
# 1. Create environment file
cp .env.example .env

# 2. Generate secure passwords
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25  # For database
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25  # For Redis
openssl rand -base64 64 | tr -d "=+/" | cut -c1-50  # For JWT

# 3. Update .env with generated passwords
nano .env
```

### Docker Deployment Process
```bash
# 1. Build and start all services
docker-compose up -d

# 2. Verify all containers are running
docker-compose ps

# 3. Check application logs
docker-compose logs -f benton-county-demo

# 4. Verify service health
curl http://localhost:3000/api/demo/health
curl http://localhost:3001  # Grafana dashboard
curl http://localhost:9090  # Prometheus metrics
```

### Service Architecture
```yaml
Services Deployed:
- benton-county-demo:3000   # Main application
- postgres:5432             # Database
- redis:6379               # Cache
- prometheus:9090          # Metrics collection
- grafana:3001            # Dashboard
- traefik:80,443,8080     # Reverse proxy
```

---

## 🏆 Production Deployment

### Automated Production Setup
```bash
# 1. Run the championship deployment script
./deploy-championship.sh

# Script performs:
# - Prerequisites check
# - Environment setup
# - Security configuration
# - Service deployment
# - Health verification
# - Post-deployment validation
```

### Manual Production Steps

#### 1. Infrastructure Preparation
```bash
# Create production directories
mkdir -p /opt/terrafusion/{data,logs,backups,config}

# Set proper ownership
useradd -r -s /bin/false terrafusion
chown -R terrafusion:terrafusion /opt/terrafusion

# Configure firewall
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw enable
```

#### 2. SSL/TLS Configuration
```bash
# Generate SSL certificates (Let's Encrypt recommended)
certbot --nginx -d your-domain.com

# Or use self-signed for testing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/terrafusion/certs/private.key \
  -out /opt/terrafusion/certs/certificate.crt
```

#### 3. Database Setup
```bash
# Initialize PostgreSQL
docker run --name terrafusion-postgres \
  -e POSTGRES_DB=terrafusion_benton \
  -e POSTGRES_USER=terrafusion \
  -e POSTGRES_PASSWORD=your_secure_password \
  -v /opt/terrafusion/data/postgres:/var/lib/postgresql/data \
  -p 5432:5432 -d postgres:15-alpine

# Verify database connection
docker exec -it terrafusion-postgres psql -U terrafusion -d terrafusion_benton -c "\dt"
```

#### 4. Application Deployment
```bash
# Deploy with production configuration
ENVIRONMENT=production docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale application for high availability
docker-compose up -d --scale benton-county-demo=3
```

### Production Verification Checklist
- [ ] All services running and healthy
- [ ] SSL certificates installed and valid
- [ ] Database connectivity verified
- [ ] Backup system operational
- [ ] Monitoring dashboards accessible
- [ ] Performance metrics within targets
- [ ] Security scans completed
- [ ] Load testing passed

---

## 🔄 CI/CD Pipeline Deployment

### GitHub Actions Setup

#### 1. Repository Configuration
```bash
# Create GitHub repository secrets
GITHUB_TOKEN        # For container registry access
DOCKER_USERNAME     # Docker Hub username
DOCKER_PASSWORD     # Docker Hub password
POSTGRES_PASSWORD   # Database password
REDIS_PASSWORD      # Redis password
```

#### 2. Automated Deployment Trigger
```yaml
# Deployment triggers:
- Push to main branch
- Push to production branch
- Manual workflow dispatch
- Pull request to main (testing only)
```

#### 3. Pipeline Stages
```yaml
Stages:
1. Test & Quality Check
   - Code linting
   - Security audit
   - Unit tests
   - Integration tests

2. Build Images
   - Docker image build
   - Multi-architecture support
   - Container registry push
   - Image vulnerability scan

3. Deploy to Staging
   - Staging environment deployment
   - Smoke tests
   - Performance validation
   - User acceptance testing

4. Deploy to Production
   - Production deployment
   - Health checks
   - Performance monitoring
   - Success notification
```

### Manual Pipeline Trigger
```bash
# Trigger deployment via GitHub CLI
gh workflow run championship-deploy.yml \
  --ref main \
  -f environment=production
```

---

## ☸️ Kubernetes Deployment

### Prerequisites
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
mv kubectl /usr/local/bin/

# Install Helm
curl https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz | tar xz
mv linux-amd64/helm /usr/local/bin/
```

### Kubernetes Configuration
```yaml
# Create namespace
kubectl create namespace terrafusion

# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Scaling Configuration
```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: terrafusion-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: benton-county-demo
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 🔧 Configuration Management

### Environment Variables

#### Required Variables
```bash
# Application Configuration
NODE_ENV=production
PORT=3000
DEMO_MODE=championship

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=terrafusion_benton
POSTGRES_USER=terrafusion
POSTGRES_PASSWORD=secure_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure_password

# Security Configuration
JWT_SECRET=super_secret_jwt_key
API_KEY=api_key_for_integrations
```

#### Optional Variables
```bash
# Monitoring Configuration
GRAFANA_PASSWORD=monitoring_password
PROMETHEUS_HOST=prometheus
LOG_LEVEL=info

# Performance Tuning
MAX_CONCURRENT_REQUESTS=1000
RESPONSE_TIMEOUT_MS=30000
CACHE_TTL_SECONDS=3600
```

### Configuration Files

#### Docker Compose Override
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  benton-county-demo:
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./logs:/app/logs
    ports:
      - "3000:3000"
      - "9229:9229"  # Debug port
```

#### Nginx Configuration
```nginx
# nginx.conf for reverse proxy
upstream terrafusion_backend {
    server localhost:3000;
    server localhost:3001 backup;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://terrafusion_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitoring and Observability

### Health Check Endpoints
```bash
# Application health
curl http://localhost:3000/api/demo/health

# Detailed metrics
curl http://localhost:3000/api/monitoring/performance

# System alerts
curl http://localhost:3000/api/monitoring/alerts
```

### Prometheus Metrics
```yaml
# Key metrics monitored:
- http_requests_total
- http_request_duration_seconds
- nodejs_heap_size_used_bytes
- nodejs_gc_duration_seconds
- process_cpu_usage_ratio
```

### Grafana Dashboards
- **System Overview**: High-level health and performance
- **Application Metrics**: Request rates, response times, errors
- **Infrastructure**: CPU, memory, disk, network usage
- **Business Metrics**: User activity, data processing rates

### Log Management
```bash
# View application logs
docker-compose logs -f benton-county-demo

# View system logs
journalctl -u docker -f

# Log rotation configuration
logrotate -d /etc/logrotate.d/terrafusion
```

---

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Generate production certificates
certbot --nginx -d your-domain.com -d www.your-domain.com

# Automated renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### Security Headers
```nginx
# Security headers in Nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Content-Security-Policy "default-src 'self'";
```

### Database Security
```bash
# PostgreSQL security configuration
# In postgresql.conf:
ssl = on
ssl_cert_file = '/path/to/certificate.crt'
ssl_key_file = '/path/to/private.key'
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'
```

---

## 💾 Backup and Disaster Recovery

### Automated Backup Setup
```bash
# Backup service configuration
systemctl enable terrafusion-backup.timer
systemctl start terrafusion-backup.timer

# Manual backup execution
/opt/terrafusion/scripts/backup.sh

# Backup verification
/opt/terrafusion/scripts/verify-backup.sh
```

### Disaster Recovery Procedure
```bash
# 1. Stop services
docker-compose down

# 2. Restore from backup
./restore-from-backup.sh backup-name-2025-08-05

# 3. Verify data integrity
./verify-restoration.sh

# 4. Restart services
docker-compose up -d

# 5. Run health checks
./post-recovery-checks.sh
```

### Backup Storage Options
- **Local Storage**: `/opt/terrafusion/backups`
- **Network Storage**: NFS, SMB shares
- **Cloud Storage**: AWS S3, Azure Blob, Google Cloud
- **Tape Backup**: Enterprise tape systems

---

## 🎯 Performance Optimization

### Application Tuning
```javascript
// Node.js optimization
process.env.UV_THREADPOOL_SIZE = 128;
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Express.js optimization
app.use(compression());
app.use(helmet());
app.set('trust proxy', 1);
```

### Database Optimization
```sql
-- PostgreSQL performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
SELECT pg_reload_conf();
```

### Caching Strategy
```javascript
// Redis caching configuration
const redis = require('redis');
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    retry_strategy: (options) => {
        return Math.min(options.attempt * 100, 3000);
    }
});
```

---

## 🆘 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check Docker daemon
systemctl status docker

# Check port availability
netstat -tuln | grep :3000

# Check disk space
df -h

# Check logs
docker-compose logs benton-county-demo
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Check database connections
docker exec -it postgres psql -U terrafusion -c "SELECT * FROM pg_stat_activity;"

# Check memory usage
free -h
```

#### Database Connection Issues
```bash
# Test database connectivity
docker exec -it terrafusion-postgres psql -U terrafusion -d terrafusion_benton -c "SELECT 1;"

# Check database logs
docker logs terrafusion-postgres

# Reset database connection pool
docker-compose restart benton-county-demo
```

### Support Resources
- **System Logs**: `/var/log/terrafusion/`
- **Application Logs**: `docker-compose logs`
- **Health Dashboard**: `http://localhost:3000/health-dashboard`
- **Metrics Dashboard**: `http://localhost:3001`

---

## 📚 Additional Resources

### Documentation Links
- **API Reference**: `/docs/api/API_REFERENCE.md`
- **User Manual**: `/docs/user-guides/USER_MANUAL.md`
- **Troubleshooting**: `/docs/troubleshooting/TROUBLESHOOTING.md`
- **Security Guide**: `/docs/security/SECURITY.md`

### External Resources
- **Docker Documentation**: https://docs.docker.com
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Kubernetes Documentation**: https://kubernetes.io/docs/

---

*Built with championship precision for government excellence*  
*Terrafusion Deployment Guide v3.0.0 - Empowering Reliable Deployments*