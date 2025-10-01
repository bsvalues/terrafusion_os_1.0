# 🔧 Terrafusion Troubleshooting Guide

## Benton County Championship Demo - Complete Problem Resolution

---

## 🎯 Quick Diagnosis

### System Health Check

```bash
# One-command health verification
curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/health | jq '.'

# Expected healthy response:
{
  "status": "healthy",
  "uptime": 3600,
  "response_time": 4,
  "error_rate": 0,
  "memory_usage": 55,
  "active_alerts": 0
}
```

### Service Status Check

```bash
# Check all Docker services
docker-compose ps

# Expected output: All services "Up" status
# If any service shows "Exit" or "Restarting", see specific sections below
```

### Quick Recovery Commands

```bash
# Restart all services
docker-compose restart

# Full system reset (caution: data loss)
docker-compose down && docker-compose up -d

# Force rebuild and restart
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

---

## 🚨 Common Issues & Solutions

### 1. Application Won't Start

#### Symptoms

- `curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}` returns connection refused
- Docker container exits immediately
- Error messages in logs about port binding

#### Diagnosis Commands

```bash
# Check if port \${{TF_FRONTEND_PORT:-3000}} is in use
netstat -tuln | grep :3000
lsof -i :3000

# Check Docker logs
docker-compose logs benton-county-demo

# Check system resources
free -h
df -h
```

#### Solutions

**A. Port Already in Use**

```bash
# Find and kill process using port \${{TF_FRONTEND_PORT:-3000}}
sudo lsof -t -i:3000 | xargs kill -9

# Or use different port
PORT=\${{TF_SHELL_PORT:-3001}} docker-compose up -d
```

**B. Insufficient Resources**

```bash
# Clear Docker system
docker system prune -a

# Increase Docker memory limits (Docker Desktop)
# Settings > Resources > Memory > 4GB+
```

**C. Permission Issues**

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x *.sh

# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

### 2. Database Connection Issues

#### Symptoms

- API returns "Database connection failed"
- Health check shows database errors
- Properties endpoint returns empty data

#### Diagnosis Commands

```bash
# Check PostgreSQL container
docker-compose logs postgres

# Test database connection
docker exec -it terrafusion-postgres psql -U terrafusion -d terrafusion_benton -c "SELECT 1;"

# Check database process
docker exec -it terrafusion-postgres ps aux
```

#### Solutions

**A. Database Not Started**

```bash
# Start database container
docker-compose up -d postgres

# Wait for initialization (first time)
sleep 30

# Verify database is ready
docker exec -it terrafusion-postgres pg_isready -U terrafusion
```

**B. Wrong Credentials**

```bash
# Check environment variables
docker-compose config | grep -A 10 -B 10 POSTGRES

# Reset database with correct credentials
docker-compose down
docker volume rm $(docker volume ls -q | grep postgres)
docker-compose up -d postgres
```

**C. Database Corruption**

```bash
# Restore from backup
./restore-from-backup.sh latest

# Or reinitialize database
docker-compose down
docker volume rm terrafusion_postgres_data
docker-compose up -d postgres
```

### 3. Slow Performance

#### Symptoms

- Response times > 100ms
- High CPU or memory usage
- Timeouts on API requests

#### Diagnosis Commands

```bash
# Check system performance
top
htop
docker stats

# Check application performance
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/overview

# Monitor real-time metrics
watch -n 1 'curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/monitoring/performance | jq .'
```

#### Solutions

**A. High Memory Usage**

```bash
# Restart application to clear memory
docker-compose restart benton-county-demo

# Increase memory limits
echo 'NODE_OPTIONS=--max-old-space-size=4096' >> .env
docker-compose up -d
```

**B. Database Performance**

```bash
# Check database connections
docker exec -it terrafusion-postgres psql -U terrafusion -d terrafusion_benton -c "SELECT count(*) FROM pg_stat_activity;"

# Restart database
docker-compose restart postgres

# Optimize database (if needed)
docker exec -it terrafusion-postgres psql -U terrafusion -d terrafusion_benton -c "VACUUM ANALYZE;"
```

**C. Network Issues**

```bash
# Check Docker network
docker network ls
docker network inspect terrafusion_terrafusion-network

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

### 4. Redis Cache Issues

#### Symptoms

- Slow response times
- Cache miss errors in logs
- Redis connection failures

#### Diagnosis Commands

```bash
# Check Redis container
docker-compose logs redis

# Test Redis connection
docker exec -it terrafusion-redis redis-cli ping

# Check Redis memory usage
docker exec -it terrafusion-redis redis-cli info memory
```

#### Solutions

**A. Redis Not Responding**

```bash
# Restart Redis
docker-compose restart redis

# Check Redis configuration
docker exec -it terrafusion-redis redis-cli config get "*"
```

**B. Redis Memory Full**

```bash
# Clear Redis cache
docker exec -it terrafusion-redis redis-cli flushall

# Increase Redis memory limit
echo 'REDIS_MAXMEMORY=512mb' >> .env
docker-compose up -d
```

### 5. Monitoring Stack Issues

#### Symptoms

- Grafana dashboard not loading (port \${{TF_FRONTEND_PORT:-3000}})
- Prometheus metrics not available (port \${{TF_FRONTEND_PORT:-3000}})
- Missing performance data

#### Diagnosis Commands

```bash
# Check monitoring services
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/health
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/-/healthy

# Check Prometheus targets
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/v1/targets

# Check Grafana logs
docker-compose logs grafana
```

#### Solutions

**A. Grafana Not Starting**

```bash
# Reset Grafana data
docker volume rm terrafusion_grafana_data
docker-compose up -d grafana

# Check Grafana permissions
docker exec -it terrafusion-grafana ls -la /var/lib/grafana
```

**B. Prometheus Scraping Issues**

```bash
# Check Prometheus configuration
docker exec -it terrafusion-prometheus cat /etc/prometheus/prometheus.yml

# Reload Prometheus config
curl -X POST http://localhost:\${{TF_FRONTEND_PORT:-3000}}/-/reload
```

---

## 🔍 Advanced Diagnostics

### Log Analysis

#### Application Logs

```bash
# Real-time application logs
docker-compose logs -f benton-county-demo

# Search for specific errors
docker-compose logs benton-county-demo 2>&1 | grep -i error

# Export logs for analysis
docker-compose logs --no-color benton-county-demo > app-logs.txt
```

#### System Logs

```bash
# Docker daemon logs
journalctl -u docker -f

# System resource logs
dmesg | tail -n 50

# Disk space usage
du -sh /var/lib/docker
```

### Performance Profiling

#### Node.js Performance

```bash
# Enable Node.js profiling
NODE_OPTIONS="--inspect=0.0.0.0:\${{TF_PORT_9229:-9229}}" docker-compose up -d

# Connect Chrome DevTools to localhost:\${{TF_FRONTEND_PORT:-3000}}
# Or use clinic.js for detailed profiling
```

#### Database Performance

```bash
# Check slow queries
docker exec -it terrafusion-postgres psql -U terrafusion -d terrafusion_benton -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check database size
docker exec -it terrafusion-postgres psql -U terrafusion -d terrafusion_benton -c "SELECT pg_size_pretty(pg_database_size('terrafusion_benton'));"
```

### Network Diagnostics

```bash
# Check Docker network connectivity
docker exec -it terrafusion-benton-demo ping postgres
docker exec -it terrafusion-benton-demo ping redis

# Check DNS resolution
docker exec -it terrafusion-benton-demo nslookup postgres

# Monitor network traffic
docker exec -it terrafusion-benton-demo netstat -i
```

---

## 🛡️ Security Issues

### SSL/TLS Problems

#### Symptoms

- Browser security warnings
- Certificate expired errors
- Mixed content warnings

#### Solutions

```bash
# Check certificate validity
openssl x509 -in certificate.crt -text -noout

# Renew Let's Encrypt certificate
certbot renew --dry-run
certbot renew

# Generate new self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout private.key -out certificate.crt
```

### Access Control Issues

#### Symptoms

- Unauthorized access attempts
- API rate limiting triggered
- Suspicious log entries

#### Solutions

```bash
# Check access logs
docker-compose logs traefik | grep -i "403\|401"

# Update rate limiting
# In docker-compose.yml traefik configuration

# Block suspicious IPs
# Add to traefik rules or firewall
```

---

## 💾 Data Issues

### Backup and Recovery Problems

#### Backup Failures

```bash
# Check backup service
curl -X POST http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/backup/create

# Manual backup creation
docker exec -it terrafusion-benton-demo node -e "
const BackupSystem = require('./backup-system');
const backup = new BackupSystem();
backup.createBackup().then(console.log);
"

# Check backup directory
ls -la /opt/terrafusion/backups/
```

#### Data Corruption

```bash
# Check data integrity
docker exec -it terrafusion-postgres psql -U terrafusion -d terrafusion_benton -c "SELECT count(*) FROM properties;"

# Restore from known good backup
./restore-from-backup.sh backup-name-2025-08-05

# Verify restoration
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/overview
```

### Data Synchronization Issues

#### Symptoms

- Stale data in responses
- Inconsistent property counts
- Cache not updating

#### Solutions

```bash
# Clear application cache
docker exec -it terrafusion-redis redis-cli flushall

# Restart application
docker-compose restart benton-county-demo

# Force data refresh
curl -X POST http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/cache/refresh
```

---

## 🔄 Integration Issues

### Launcher Integration Problems

#### Symptoms

- Terrafusion Launcher not showing demo
- Web apps not opening in browser
- Native app conflicts

#### Solutions

```bash
# Check launcher configuration
cat ../launcher-v3/src/terrafusion-apps-registry.ts | grep -A 10 "benton-county-demo"

# Rebuild launcher
cd ../launcher-v3
npm run tauri build

# Test web app opening
curl -I http://localhost:\${{TF_FRONTEND_PORT:-3000}}
```

### API Integration Issues

#### Symptoms

- External API calls failing
- Webhook delivery failures
- Third-party service timeouts

#### Solutions

```bash
# Test external connectivity
docker exec -it terrafusion-benton-demo curl -I https://api.example.com

# Check webhook endpoints
curl -X POST http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/webhooks/test

# Verify API keys and credentials
docker-compose config | grep -i api_key
```

---

## 📱 Mobile and Browser Issues

### PWA Installation Problems

#### Symptoms

- "Add to Home Screen" not appearing
- PWA not working offline
- Service worker registration failures

#### Solutions

```bash
# Check PWA manifest
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/manifest.json

# Verify service worker
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/sw.js

# Check HTTPS requirement
# PWAs require HTTPS in production
```

### Browser Compatibility Issues

#### Symptoms

- Features not working in specific browsers
- CSS rendering problems
- JavaScript errors

#### Solutions

```bash
# Check browser console errors
# Open browser DevTools > Console

# Verify CSS compatibility
# Check mobile-enhancements.css for media queries

# Test in different browsers
# Chrome, Firefox, Safari, Edge
```

---

## 🎯 Environment-Specific Issues

### Development Environment

#### Common Problems

- Hot reloading not working
- Debug ports not accessible
- File permission issues

#### Solutions

```bash
# Enable development mode
NODE_ENV=development docker-compose up -d

# Enable debug port
NODE_OPTIONS="--inspect=0.0.0.0:\${{TF_PORT_9229:-9229}}" node demo-server.js

# Fix file watching
# Add to docker-compose.yml:
# volumes:
#   - .:/app
#   - /app/node_modules
```

### Production Environment

#### Common Problems

- Performance degradation
- Memory leaks
- High availability issues

#### Solutions

```bash
# Production optimization
NODE_ENV=production docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale benton-county-demo=3

# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## 🆘 Emergency Procedures

### Complete System Recovery

#### When Everything Fails

```bash
# 1. Stop all services
docker-compose down

# 2. Clean Docker system
docker system prune -a --volumes

# 3. Remove all containers and images
docker container prune -f
docker image prune -a -f
docker volume prune -f

# 4. Fresh deployment
git pull origin main
./deploy-championship.sh
```

### Disaster Recovery Checklist

#### Step-by-Step Recovery

1. **Assess Damage**

   ```bash
   # Check what's broken
   docker-compose ps
   curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/health
   ```

2. **Backup Current State**

   ```bash
   # Even if broken, backup what you can
   docker-compose logs --no-color > emergency-logs.txt
   ```

3. **Restore from Backup**

   ```bash
   # Restore from latest backup
   ls -la backups/
   ./restore-from-backup.sh latest
   ```

4. **Verify Recovery**

   ```bash
   # Run full health checks
   ./health-check-comprehensive.sh
   ```

5. **Document Incident**
   ```bash
   # Create incident report
   echo "$(date): Emergency recovery completed" >> incident-log.txt
   ```

---

## 📞 Getting Help

### Self-Service Resources

#### Log Collection Script

```bash
#!/bin/bash
# collect-logs.sh - Comprehensive log collection

echo "Collecting Terrafusion diagnostic information..."

mkdir -p diagnostic-$(date +%Y%m%d-%H%M%S)
cd diagnostic-$(date +%Y%m%d-%H%M%S)

# System information
uname -a > system-info.txt
docker --version >> system-info.txt
docker-compose --version >> system-info.txt

# Service status
docker-compose ps > service-status.txt

# Application logs
docker-compose logs --no-color benton-county-demo > app-logs.txt
docker-compose logs --no-color postgres > postgres-logs.txt
docker-compose logs --no-color redis > redis-logs.txt

# System metrics
docker stats --no-stream > docker-stats.txt
free -h > memory-usage.txt
df -h > disk-usage.txt

# API health check
curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/health > health-check.txt
curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/monitoring/performance > performance-metrics.txt

echo "Diagnostic information collected in: $(pwd)"
```

#### Health Check Script

```bash
#!/bin/bash
# comprehensive-health-check.sh

echo "🏆 Terrafusion Championship Health Check"
echo "========================================"

# Service checks
echo "📊 Service Status:"
docker-compose ps

echo -e "\n🌐 API Health:"
curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/health | jq '.'

echo -e "\n📈 Performance Metrics:"
curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/monitoring/performance | jq '.'

echo -e "\n💾 Backup Status:"
curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/backup/list | jq '.'

echo -e "\n🔧 System Resources:"
echo "Memory: $(free -h | grep '^Mem' | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"

echo -e "\n✅ Health check completed"
```

### Support Escalation

#### Level 1: Self-Service

- Check this troubleshooting guide
- Run diagnostic scripts
- Review application logs
- Attempt basic recovery procedures

#### Level 2: Community Support

- Terrafusion community forum
- GitHub issues and discussions
- Stack Overflow with 'terrafusion' tag
- Docker community support

#### Level 3: Professional Support

- Terrafusion enterprise support
- System administrator escalation
- Vendor support contacts
- Emergency hotline (if available)

### Creating Support Tickets

#### Required Information

```bash
# Gather this information before contacting support:

1. System Information:
   - Operating system and version
   - Docker and Docker Compose versions
   - Hardware specifications
   - Network configuration

2. Error Details:
   - Exact error messages
   - Steps to reproduce
   - Expected vs actual behavior
   - Timeline of when issue started

3. Diagnostic Data:
   - Run ./collect-logs.sh
   - Include all generated files
   - Recent configuration changes
   - Any attempted solutions

4. Impact Assessment:
   - Services affected
   - Users impacted
   - Business processes disrupted
   - Urgency level
```

---

## 📚 Additional Resources

### External Documentation

- **Docker Troubleshooting**:
  https://docs.docker.com/config/daemon/troubleshoot/
- **Node.js Debugging**:
  https://nodejs.org/en/docs/guides/debugging-getting-started/
- **PostgreSQL Issues**: https://www.postgresql.org/docs/current/problems.html
- **Redis Troubleshooting**: https://redis.io/topics/problems

### Internal Resources

- **API Reference**: `/docs/api/API_REFERENCE.md`
- **Deployment Guide**: `/docs/deployment/DEPLOYMENT_GUIDE.md`
- **User Manual**: `/docs/user-guides/USER_MANUAL.md`
- **Security Guide**: `/docs/security/SECURITY.md`

### Monitoring Tools

- **Application Dashboard**: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/analytics-dashboard.html
- **Grafana Monitoring**: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
- **Prometheus Metrics**: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
- **Traefik Dashboard**: http://localhost:\${{TF_FRONTEND_PORT:-3000}}

---

_Built with championship precision for reliable troubleshooting_  
_Terrafusion Troubleshooting Guide v3.0.0 - Solving Problems with Excellence_
