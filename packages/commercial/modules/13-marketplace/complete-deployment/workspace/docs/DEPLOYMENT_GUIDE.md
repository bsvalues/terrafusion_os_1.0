# Terrafusion Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- 8GB RAM minimum
- 20GB free disk space

## Quick Start

### 1. Clone and Setup

```bash
cd /mnt/e/TerraFusion_Master_Workspace
```

### 2. Install Dependencies

```bash
# Install dependencies for all frontend apps
for app in Frontend/apps/*; do
  echo "Installing dependencies for $(basename $app)..."
  (cd "$app" && npm install)
done

# Install dependencies for workspace apps
for app in apps/*; do
  echo "Installing dependencies for $(basename $app)..."
  (cd "$app" && npm install)
done
```

### 3. Environment Configuration

```bash
# Create .env file
cat > .env << EOF
# Database
POSTGRES_USER=terrafusion
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=terrafusion

# Redis
REDIS_PASSWORD=redis_password_here

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# API
API_PORT=\${{TF_ADMIN_PORT:-8080}}
NODE_ENV=production

# Frontend URLs
VITE_API_URL=http://localhost:\${{TF_ADMIN_PORT:-8080}}
EOF
```

### 4. Build Docker Images

```bash
# Build all services
docker-compose -f docker-compose.production.yml build
```

### 5. Start Services

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

## Development Deployment

### Local Development

```bash
# Start individual app
cd Frontend/apps/costforge
npm run dev

# Start with specific port
npm run dev -- --port \${{TF_SHELL_PORT:-3001}}
```

### Full Stack Development

```bash
# Start backend
cd Backend
cargo run

# Start all frontends (in separate terminals)
./scripts/start_all_apps.sh
```

## Production Deployment

### 1. Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Backup procedures tested
- [ ] Monitoring configured

### 2. SSL/TLS Configuration

```bash
# Generate SSL certificates (Let's Encrypt)
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d yourdomain.com
```

Update `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
}
```

### 3. Database Migration

```bash
# Run database migrations
docker-compose exec backend /app/migrate

# Backup database
docker-compose exec postgres pg_dump -U terrafusion terrafusion > backup.sql
```

### 4. Deploy to Cloud

#### AWS Deployment

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
docker-compose build
docker-compose push

# Deploy to ECS
aws ecs update-service --cluster terrafusion --service terrafusion-app --force-new-deployment
```

#### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.production.yml terrafusion
```

#### Kubernetes

```bash
# Apply configurations
kubectl apply -f k8s/

# Check deployment
kubectl get pods -n terrafusion
```

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
for port in 3001 3002 3003 3005 3006 3007 5006 5007 5010 8080; do
  echo "Checking port $port..."
  curl -f http://localhost:$port/health || echo "Failed"
done
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose.production.yml logs -f

# View specific service
docker-compose -f docker-compose.production.yml logs -f costforge
```

### Performance Monitoring

```bash
# Resource usage
docker stats

# Database performance
docker-compose exec postgres psql -U terrafusion -c "SELECT * FROM pg_stat_activity;"
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### 2. Docker Network Issues

```bash
# Recreate network
docker network rm terrafusion-network
docker network create terrafusion-network
```

#### 3. Database Connection Failed

```bash
# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U terrafusion
```

#### 4. Frontend Can't Connect to Backend

- Check CORS configuration
- Verify API_URL environment variable
- Check network connectivity

## Backup & Recovery

### Automated Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U terrafusion terrafusion > backups/db_$DATE.sql
tar -czf backups/apps_$DATE.tar.gz Frontend/apps apps
EOF

# Schedule with cron
0 2 * * * /path/to/backup.sh
```

### Recovery Procedure

```bash
# Restore database
docker-compose exec -T postgres psql -U terrafusion terrafusion < backup.sql

# Restore files
tar -xzf backups/apps_20250803.tar.gz
```

## Scaling

### Horizontal Scaling

```bash
# Scale specific service
docker-compose -f docker-compose.production.yml up -d --scale costforge=3

# With load balancer
# Update nginx.conf with multiple upstreams
```

### Vertical Scaling

```yaml
# Update docker-compose.yml
services:
  costforge:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Security Hardening

### 1. Network Security

```bash
# Create firewall rules
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Container Security

```bash
# Run security scan
docker scan terrafusion/costforge:latest

# Non-root user in Dockerfile
USER node
```

### 3. Secret Management

```bash
# Use Docker secrets
echo "password" | docker secret create db_password -
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Terrafusion
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and Deploy
        run: |
          docker-compose build
          docker-compose push
          ssh $SERVER 'cd /app && docker-compose pull && docker-compose up -d'
```

## Post-Deployment

### 1. Verification

- [ ] All health checks passing
- [ ] User authentication working
- [ ] Data persistence verified
- [ ] Performance benchmarks met

### 2. Monitoring Setup

- [ ] Alerts configured
- [ ] Dashboards created
- [ ] Log aggregation working
- [ ] Backup automation verified

### 3. Documentation

- [ ] Update deployment notes
- [ ] Document any custom configurations
- [ ] Create runbooks for common issues

---

_Last Updated: August 2025_  
_Deployment Version: 2.0_
