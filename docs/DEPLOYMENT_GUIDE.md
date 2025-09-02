# Terrafusion OS 1.0 - Production Deployment Guide

**Version:** 1.0.0  
**Last Updated:** December 26, 2024  
**Status:** Production Ready

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Development Deployment](#development-deployment)
4. [Production Deployment](#production-deployment)
5. [Cloud Deployment](#cloud-deployment)
6. [Configuration](#configuration)
7. [Security](#security)
8. [Monitoring](#monitoring)
9. [Maintenance](#maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum (Development):**
- CPU: 4 cores
- RAM: 8GB
- Storage: 20GB
- OS: Windows 10/11, Ubuntu 20.04+, macOS 12+

**Recommended (Production):**
- CPU: 8+ cores
- RAM: 16GB+
- Storage: 100GB+ SSD
- OS: Ubuntu 22.04 LTS or RHEL 8+

### Required Software

- Docker 24.0+
- Docker Compose 2.20+
- Git 2.40+
- Node.js 20+ (for local development)
- .NET SDK 8.0+ (for local development)

### Network Requirements

- Ports: 80, 443, 3000, 5000, 3001-3003, 5432, 6379
- SSL certificates for production
- Domain name (production)

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/terrafusion-os.git
cd terrafusion-os
```

### 2. Configure Environment

```bash
# Copy environment template
cp env.template .env

# Edit configuration (use your favorite editor)
nano .env
```

### 3. Start with Docker Compose

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Verify Installation

```bash
# Check services
docker-compose ps

# Check health
curl http://localhost:5000/api/health
```

### 5. Access Application

- Frontend: http://localhost:3000
- API: http://localhost:5000
- API Docs: http://localhost:5000/swagger

**Default Credentials:**
- Username: `admin`
- Password: `TerraFusion2025!`

---

## Development Deployment

### Local Development Setup

```bash
# Backend
cd backend
dotnet restore
dotnet run --project Terrafusion.API

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# AI Services (new terminal)
cd compose/ai-services
npm install
npm start
```

### Docker Development

```bash
# Build and start with hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Watch logs
docker-compose logs -f

# Rebuild after changes
docker-compose build --no-cache
```

### VS Code Development

1. Install extensions:
   - C# Dev Kit
   - Docker
   - ESLint
   - Prettier

2. Open workspace:
```bash
code terrafusion-os.code-workspace
```

3. Use integrated terminal for commands

---

## Production Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
```

### 3. Production Configuration

```bash
# Create production .env
cp env.template .env
nano .env

# Update critical settings:
# - JWT_SECRET (use strong random string)
# - DB_PASSWORD (use strong password)
# - SSL_ENABLED=true
# - SSL_CERT_PATH and SSL_KEY_PATH
# - ASPNETCORE_ENVIRONMENT=Production
```

### 4. Database Setup

```bash
# PostgreSQL (recommended for production)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres

# Wait for database
sleep 10

# Run migrations
docker-compose exec terrafusion-api dotnet ef database update
```

### 5. Deploy Application

```bash
# Build images
./scripts/docker-build.ps1 -Environment prod -Version 1.0.0

# Deploy with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose ps
curl https://yourdomain.com/api/health
```

### 6. Configure Firewall

```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Cloud Deployment

### AWS Deployment

```bash
# Using AWS ECS
aws ecs create-cluster --cluster-name terrafusion-prod

# Create task definition
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json

# Create service
aws ecs create-service \
  --cluster terrafusion-prod \
  --service-name terrafusion-api \
  --task-definition terrafusion:1 \
  --desired-count 2
```

### Azure Deployment

```bash
# Create resource group
az group create --name terrafusion-rg --location westus2

# Create container instances
az container create \
  --resource-group terrafusion-rg \
  --name terrafusion-app \
  --image terrafusion/api:latest \
  --dns-name-label terrafusion \
  --ports 80 443
```

### Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n terrafusion
kubectl get services -n terrafusion
```

---

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing key | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `REDIS_CONNECTION` | Redis connection | `redis:6379` | No |
| `AI_SWARM_SIZE` | Number of AI agents | `1008` | No |
| `LOG_LEVEL` | Logging level | `Information` | No |

### Database Configuration

**SQLite (Development):**
```env
DATABASE_PATH=/app/data/terrafusion.db
```

**PostgreSQL (Production):**
```env
DATABASE_CONNECTION=Host=postgres;Database=terrafusion;Username=terrafusion;Password=YourPassword
```

### AI Services Configuration

```env
AI_COMMAND_BRAIN_URL=http://ai-command-brain:3001
AI_SWARM_URL=http://ai-swarm:3002
AI_ADVANCED_URL=http://ai-advanced:3003
AI_SWARM_SIZE=1008
AI_MCP_TOOLS=87
```

---

## Security

### Security Checklist

- [ ] Change default passwords
- [ ] Generate strong JWT secret
- [ ] Enable SSL/TLS
- [ ] Configure firewall
- [ ] Enable audit logging
- [ ] Set up backup strategy
- [ ] Configure rate limiting
- [ ] Enable CORS properly
- [ ] Scan for vulnerabilities
- [ ] Review security headers

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

### Backup Strategy

```bash
# Database backup
docker-compose exec postgres pg_dump -U terrafusion terrafusion > backup-$(date +%Y%m%d).sql

# Application data backup
tar -czf terrafusion-data-$(date +%Y%m%d).tar.gz ./data ./logs

# Automated backup (crontab)
0 2 * * * /opt/terrafusion/scripts/backup.sh
```

---

## Monitoring

### Health Checks

```bash
# API Health
curl http://localhost:5000/api/health

# Detailed health
curl http://localhost:5000/api/health/detailed

# Metrics
curl http://localhost:5000/api/health/metrics
```

### Log Monitoring

```bash
# View all logs
docker-compose logs

# Follow specific service
docker-compose logs -f terrafusion-api

# Check audit logs
docker-compose exec terrafusion-api cat /app/logs/audit.log
```

### Performance Monitoring

```bash
# Docker stats
docker stats

# System resources
htop

# Network monitoring
netstat -tulpn
```

---

## Maintenance

### Regular Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build --no-cache

# Restart services
docker-compose restart
```

### Database Maintenance

```bash
# Vacuum database (PostgreSQL)
docker-compose exec postgres psql -U terrafusion -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec postgres psql -U terrafusion -c "SELECT pg_database_size('terrafusion');"
```

### Log Rotation

```bash
# Configure logrotate
cat > /etc/logrotate.d/terrafusion << EOF
/var/terrafusion/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 terrafusion terrafusion
    sharedscripts
    postrotate
        docker-compose restart terrafusion-api
    endscript
}
EOF
```

---

## Troubleshooting

### Common Issues

**1. Services not starting:**
```bash
# Check logs
docker-compose logs terrafusion-api

# Check resources
docker system df
docker system prune -a
```

**2. Database connection errors:**
```bash
# Test connection
docker-compose exec terrafusion-api nc -zv postgres 5432

# Check migrations
docker-compose exec terrafusion-api dotnet ef database update
```

**3. Port conflicts:**
```bash
# Find process using port
sudo lsof -i :5000
sudo netstat -tulpn | grep 5000

# Kill process
sudo kill -9 <PID>
```

**4. SSL certificate issues:**
```bash
# Renew certificate
sudo certbot renew

# Restart nginx
docker-compose restart nginx
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=Debug
export ASPNETCORE_ENVIRONMENT=Development

# Start with verbose output
docker-compose up
```

### Recovery Procedures

```bash
# Restore from backup
docker-compose down
psql -U terrafusion -d terrafusion < backup-20240826.sql
docker-compose up -d

# Reset to clean state
docker-compose down -v
docker system prune -a
git clean -fdx
docker-compose up -d
```

---

## Support

### Documentation

- [API Documentation](/docs/api/README.md)
- [Architecture Guide](/docs/architecture/README.md)
- [Development Guide](/docs/development/README.md)

### Contact

- **Email:** support@terrafusion.gov
- **Issues:** https://github.com/your-org/terrafusion-os/issues
- **Security:** security@terrafusion.gov

### License

Terrafusion OS is licensed under [MIT License](LICENSE).

---

**© 2024 Terrafusion OS - Government. Transcended.**
