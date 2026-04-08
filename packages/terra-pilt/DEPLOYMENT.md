# 🚀 TerraFusionPilt V2.0.0 - Production Deployment Guide

## **Enterprise Deployment for Benton County**

This guide provides step-by-step instructions for deploying TerraFusionPilt to production environments with enterprise-grade security, monitoring, and scalability.

---

## 📋 **Pre-Deployment Checklist**

### Infrastructure Requirements
- [ ] Linux server (Ubuntu 20.04+ recommended)
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ database server
- [ ] Redis 6+ for caching
- [ ] Nginx for reverse proxy
- [ ] SSL certificates configured
- [ ] Domain name configured
- [ ] Firewall rules configured

### Security Requirements
- [ ] Database credentials secured
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Access control lists configured
- [ ] Backup procedures established
- [ ] Monitoring systems ready

---

## 🗄️ **Database Setup**

### PostgreSQL Installation
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Database Configuration
```sql
-- Create database and user
CREATE DATABASE terrafusion_pilt;
CREATE USER pilt_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE terrafusion_pilt TO pilt_user;

-- Enable required extensions
\c terrafusion_pilt
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Schema Deployment
```bash
# Run schema creation
psql -h localhost -U pilt_user -d terrafusion_pilt -f server/core/schema.sql
```

---

## 🐳 **Docker Deployment**

### Docker Compose Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5009:5009"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://pilt_user:${DB_PASSWORD}@db:5432/terrafusion_pilt
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=terrafusion_pilt
      - POSTGRES_USER=pilt_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/core/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  postgres_data:
  grafana_data:
```

### Environment Configuration
```bash
# .env.production
NODE_ENV=production
PORT=5009
DATABASE_URL=postgresql://pilt_user:${DB_PASSWORD}@localhost:5432/terrafusion_pilt
REDIS_URL=redis://localhost:6379
JWT_SECRET=${JWT_SECRET}
DB_PASSWORD=${DB_PASSWORD}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}
```

---

## 🌐 **Nginx Configuration**

### Reverse Proxy Setup
```nginx
# /etc/nginx/sites-available/terrafusion-pilt
server {
    listen 80;
    server_name pilt.bentoncounty.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pilt.bentoncounty.org;

    ssl_certificate /etc/nginx/ssl/terrafusion-pilt.crt;
    ssl_certificate_key /etc/nginx/ssl/terrafusion-pilt.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Main application
    location / {
        proxy_pass http://localhost:5009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:5009;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:5009;
    }
}
```

---

## 🔒 **Security Configuration**

### Firewall Setup
```bash
# UFW configuration
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### SSL Certificate Installation
```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pilt.bentoncounty.org
```

### Database Security
```sql
-- Restrict database access
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO pilt_user;
GRANT CREATE ON SCHEMA public TO pilt_user;

-- Enable row-level security
ALTER TABLE pilt_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
```

---

## 📊 **Monitoring Setup**

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'terrafusion-pilt'
    static_configs:
      - targets: ['localhost:5009']
    metrics_path: '/api/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

### Grafana Dashboards
```json
{
  "dashboard": {
    "title": "TerraFusionPilt Monitoring",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "http_request_duration_seconds",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "singlestat",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends"
          }
        ]
      }
    ]
  }
}
```

---

## 🔄 **CI/CD Pipeline**

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/terrafusion-pilt
            git pull origin main
            npm ci --production
            npm run build
            sudo systemctl restart terrafusion-pilt
```

---

## 🚀 **Deployment Steps**

### 1. Server Preparation
```bash
# Create application user
sudo useradd -m -s /bin/bash terrafusion
sudo usermod -aG sudo terrafusion

# Create application directory
sudo mkdir -p /opt/terrafusion-pilt
sudo chown terrafusion:terrafusion /opt/terrafusion-pilt
```

### 2. Application Deployment
```bash
# Clone repository
cd /opt/terrafusion-pilt
git clone [repository-url] .

# Install dependencies
npm ci --production

# Build application
npm run build

# Set permissions
sudo chown -R terrafusion:terrafusion /opt/terrafusion-pilt
```

### 3. Service Configuration
```ini
# /etc/systemd/system/terrafusion-pilt.service
[Unit]
Description=TerraFusionPilt Application
After=network.target postgresql.service

[Service]
Type=simple
User=terrafusion
WorkingDirectory=/opt/terrafusion-pilt
ExecStart=/usr/bin/node dist/server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/terrafusion-pilt/.env.production

[Install]
WantedBy=multi-user.target
```

### 4. Service Management
```bash
# Enable and start service
sudo systemctl enable terrafusion-pilt
sudo systemctl start terrafusion-pilt

# Check status
sudo systemctl status terrafusion-pilt

# View logs
sudo journalctl -u terrafusion-pilt -f
```

---

## 📋 **Health Checks**

### Application Health
```bash
# Health check endpoint
curl -f http://localhost:5009/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "2.0.0",
  "environment": "production"
}
```

### Database Health
```bash
# PostgreSQL connection test
psql -h localhost -U pilt_user -d terrafusion_pilt -c "SELECT 1;"
```

### Service Status
```bash
# Check all services
sudo systemctl status terrafusion-pilt
sudo systemctl status postgresql
sudo systemctl status nginx
sudo systemctl status redis
```

---

## 🔧 **Troubleshooting**

### Common Issues

#### Application Won't Start
```bash
# Check logs
sudo journalctl -u terrafusion-pilt -n 50

# Check environment variables
sudo -u terrafusion env

# Verify permissions
ls -la /opt/terrafusion-pilt
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U pilt_user -d terrafusion_pilt

# Check PostgreSQL status
sudo systemctl status postgresql

# Review PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Performance Issues
```bash
# Monitor resource usage
htop
iotop
netstat -tulpn

# Check application metrics
curl http://localhost:5009/api/metrics
```

---

## 📊 **Backup & Recovery**

### Database Backup
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/terrafusion-pilt"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U pilt_user -d terrafusion_pilt > \
  "$BACKUP_DIR/pilt_backup_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "pilt_backup_*.sql" -mtime +30 -delete
```

### Application Backup
```bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /opt/terrafusion-pilt
```

### Recovery Procedures
```bash
# Restore database
psql -h localhost -U pilt_user -d terrafusion_pilt < backup_file.sql

# Restore application
tar -xzf app_backup.tar.gz -C /opt/
sudo systemctl restart terrafusion-pilt
```

---

## 📈 **Performance Tuning**

### PostgreSQL Optimization
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 100
```

### Node.js Optimization
```bash
# PM2 process manager
npm install -g pm2

# PM2 configuration
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'terrafusion-pilt',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5009
    }
  }]
}

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🎯 **Post-Deployment Validation**

### Functional Testing
- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Database queries execute
- [ ] PILT calculations work
- [ ] Reports generate properly

### Performance Testing
- [ ] Response times < 200ms
- [ ] Database queries optimized
- [ ] Memory usage stable
- [ ] CPU usage reasonable

### Security Testing
- [ ] SSL certificates valid
- [ ] API rate limiting works
- [ ] Input validation active
- [ ] Audit logging functional

---

**🏆 Production deployment complete! TerraFusionPilt V2.0.0 is now live and ready to serve Benton County.** 