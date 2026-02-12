# Terrafusion Troubleshooting Guide

## Common Issues & Solutions

### Frontend Issues

#### React #130 Error: "Cannot access 'R' before initialization"
**Symptoms**: Application fails to start with React initialization error
**Root Cause**: Circular dependencies or incorrect import/export structure
**Solution**:
```bash
# 1. Check for circular dependencies
npm run lint:circular

# 2. Verify import/export syntax
grep -r "import.*from.*\." src/

# 3. Clear build cache
rm -rf node_modules/.cache
npm run build:clean

# 4. Restart development server
npm run dev
```

#### Setup Wizard Stuck or Not Loading
**Symptoms**: Setup wizard doesn't progress or shows blank screen
**Root Cause**: WebSocket connection issues or localStorage corruption
**Solution**:
```javascript
// Clear localStorage and restart
localStorage.clear();
sessionStorage.clear();

// Check WebSocket connection
const ws = new WebSocket('ws://localhost:1420');
ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
```

#### Tauri Desktop App Won't Start
**Symptoms**: Desktop application fails to launch or shows errors
**Root Cause**: Rust/Tauri configuration issues or missing dependencies
**Solution**:
```bash
# 1. Check Rust installation
rustc --version
cargo --version

# 2. Update Tauri CLI
cargo install tauri-cli --version "^2.0.0"

# 3. Clean and rebuild
cargo clean
npm run tauri build

# 4. Check tauri.conf.json
cat src-tauri/tauri.conf.json | jq .
```

### Backend Issues

#### Database Connection Failed
**Symptoms**: "Connection refused" or "Database unavailable" errors
**Root Cause**: PostgreSQL not running or incorrect connection string
**Solution**:
```bash
# 1. Check PostgreSQL status
sudo systemctl status postgresql
# or for Docker
docker ps | grep postgres

# 2. Verify connection string
echo $DATABASE_URL

# 3. Test connection manually
psql $DATABASE_URL -c "SELECT version();"

# 4. Restart database service
sudo systemctl restart postgresql
# or for Docker
docker-compose restart postgres
```

#### JWT Token Validation Errors
**Symptoms**: "Invalid token" or "Token expired" errors
**Root Cause**: Token expiration, clock skew, or secret key mismatch
**Solution**:
```javascript
// Check token expiration
const jwt = require('jsonwebtoken');
const decoded = jwt.decode(token, {complete: true});
console.log('Token expires:', new Date(decoded.payload.exp * 1000));

// Verify secret key
const verified = jwt.verify(token, process.env.JWT_SECRET);
console.log('Token valid:', !!verified);
```

#### Microservices Not Responding
**Symptoms**: Service timeouts or "Service unavailable" errors
**Root Cause**: Service discovery issues or resource constraints
**Solution**:
```bash
# 1. Check service health
curl http://localhost:8080/health

# 2. View service logs
docker logs terrafusion-backend
kubectl logs -f deployment/terrafusion-backend

# 3. Check resource usage
docker stats
kubectl top pods

# 4. Restart services
docker-compose restart
kubectl rollout restart deployment/terrafusion-backend
```

### Performance Issues

#### Slow Page Load Times
**Symptoms**: Pages take >3 seconds to load
**Root Cause**: Large bundle sizes, unoptimized images, or database queries
**Solution**:
```bash
# 1. Analyze bundle size
npm run build:analyze

# 2. Check image optimization
npm run optimize:images

# 3. Enable compression
# Add to nginx.conf:
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 4. Database query optimization
EXPLAIN ANALYZE SELECT * FROM properties WHERE county_id = $1;
```

#### High Memory Usage
**Symptoms**: Application crashes with "Out of memory" errors
**Root Cause**: Memory leaks, large data sets, or inefficient algorithms
**Solution**:
```javascript
// Monitor memory usage
const used = process.memoryUsage();
console.log('Memory usage:', {
  rss: Math.round(used.rss / 1024 / 1024) + ' MB',
  heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
  heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB'
});

// Enable garbage collection logging
node --expose-gc --trace-gc server.js
```

### Authentication Issues

#### Users Cannot Login
**Symptoms**: Login attempts fail with various error messages
**Root Cause**: Password hash mismatch, account lockout, or session issues
**Solution**:
```sql
-- Check user account status
SELECT id, username, is_active, last_login, failed_login_attempts 
FROM users WHERE username = 'problematic_user';

-- Reset failed login attempts
UPDATE users SET failed_login_attempts = 0 WHERE username = 'problematic_user';

-- Check password hash format
SELECT LENGTH(password_hash), SUBSTRING(password_hash, 1, 10) 
FROM users WHERE username = 'problematic_user';
```

#### Session Expires Too Quickly
**Symptoms**: Users logged out unexpectedly
**Root Cause**: Short session timeout or token refresh issues
**Solution**:
```javascript
// Check session configuration
const sessionConfig = {
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  rolling: true, // Extend on activity
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production'
};

// Implement token refresh
const refreshToken = async (oldToken) => {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${oldToken}` }
  });
  return response.json();
};
```

### Deployment Issues

#### Docker Build Failures
**Symptoms**: Docker build process fails with various errors
**Root Cause**: Missing dependencies, incorrect Dockerfile, or network issues
**Solution**:
```bash
# 1. Clear Docker cache
docker system prune -a

# 2. Build with verbose output
docker build --no-cache --progress=plain -t terrafusion/app .

# 3. Check Dockerfile syntax
docker run --rm -i hadolint/hadolint < Dockerfile

# 4. Test multi-stage build
docker build --target development -t terrafusion/app:dev .
```

#### Kubernetes Deployment Failures
**Symptoms**: Pods fail to start or remain in "Pending" state
**Root Cause**: Resource constraints, image pull issues, or configuration errors
**Solution**:
```bash
# 1. Check pod status
kubectl get pods -o wide
kubectl describe pod <pod-name>

# 2. View pod logs
kubectl logs <pod-name> --previous
kubectl logs -f <pod-name>

# 3. Check resource quotas
kubectl describe resourcequota
kubectl top nodes

# 4. Verify image availability
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Data Issues

#### Database Migration Failures
**Symptoms**: Migration scripts fail or database schema inconsistencies
**Root Cause**: Conflicting migrations, data constraints, or permission issues
**Solution**:
```bash
# 1. Check migration status
npx prisma migrate status

# 2. Resolve migration conflicts
npx prisma migrate resolve --applied <migration-name>

# 3. Reset database (development only)
npx prisma migrate reset

# 4. Manual migration rollback
psql $DATABASE_URL -c "DELETE FROM _prisma_migrations WHERE migration_name = 'problematic_migration';"
```

#### Data Corruption or Inconsistencies
**Symptoms**: Incorrect data values or referential integrity errors
**Root Cause**: Application bugs, concurrent access, or hardware issues
**Solution**:
```sql
-- Check referential integrity
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_catalog = 'terrafusion_production';

-- Find orphaned records
SELECT p.id, p.parcel_id 
FROM properties p 
LEFT JOIN counties c ON p.county_id = c.id 
WHERE c.id IS NULL;

-- Restore from backup
pg_restore -d terrafusion_production backup_file.dump
```

## Monitoring & Diagnostics

### Health Check Commands
```bash
#!/bin/bash
# health-check.sh - Comprehensive system health check

echo "=== Terrafusion Health Check ==="

# Frontend health
echo "Frontend Status:"
curl -s http://localhost:1420/health | jq .

# Backend health
echo "Backend Status:"
curl -s http://localhost:8080/health | jq .

# Database health
echo "Database Status:"
psql $DATABASE_URL -c "SELECT version();" > /dev/null && echo "✓ Connected" || echo "✗ Failed"

# Redis health
echo "Redis Status:"
redis-cli ping > /dev/null && echo "✓ Connected" || echo "✗ Failed"

# Disk space
echo "Disk Usage:"
df -h | grep -E "(/$|/var|/tmp)"

# Memory usage
echo "Memory Usage:"
free -h

# Process status
echo "Process Status:"
ps aux | grep -E "(node|postgres|redis)" | grep -v grep
```

### Log Analysis
```bash
#!/bin/bash
# log-analysis.sh - Analyze application logs for issues

# Error patterns
echo "Recent Errors:"
grep -i "error\|exception\|failed" /var/log/terrafusion/*.log | tail -20

# Performance issues
echo "Slow Queries:"
grep "slow query" /var/log/postgresql/postgresql.log | tail -10

# Authentication failures
echo "Failed Logins:"
grep "authentication failed" /var/log/terrafusion/auth.log | tail -10

# Memory warnings
echo "Memory Warnings:"
grep -i "memory\|oom" /var/log/syslog | tail -10
```

### Performance Monitoring
```javascript
// performance-monitor.js - Real-time performance monitoring
const performanceMonitor = {
  checkResponseTime: async (url) => {
    const start = Date.now();
    try {
      await fetch(url);
      return Date.now() - start;
    } catch (error) {
      return -1;
    }
  },

  checkMemoryUsage: () => {
    const used = process.memoryUsage();
    return {
      rss: used.rss / 1024 / 1024,
      heapTotal: used.heapTotal / 1024 / 1024,
      heapUsed: used.heapUsed / 1024 / 1024,
      external: used.external / 1024 / 1024
    };
  },

  checkDatabaseConnections: async () => {
    // Implementation depends on database client
    const result = await db.query('SELECT count(*) FROM pg_stat_activity');
    return result.rows[0].count;
  }
};
```

## Emergency Procedures

### System Recovery
```bash
#!/bin/bash
# emergency-recovery.sh - Emergency system recovery

echo "=== Emergency Recovery Procedure ==="

# 1. Stop all services
echo "Stopping services..."
docker-compose down
kubectl scale deployment --replicas=0 --all

# 2. Backup current state
echo "Creating emergency backup..."
pg_dump $DATABASE_URL > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Restore from last known good backup
echo "Restoring from backup..."
pg_restore -d $DATABASE_URL last_good_backup.sql

# 4. Start services in safe mode
echo "Starting services..."
docker-compose up -d postgres redis
sleep 30
docker-compose up -d backend
sleep 30
docker-compose up -d frontend

# 5. Verify system health
echo "Verifying system health..."
./health-check.sh
```

### Data Recovery
```sql
-- emergency-data-recovery.sql
-- Emergency data recovery procedures

-- 1. Check data integrity
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- 2. Identify corrupted data
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name LIKE '%corrupted%' OR column_name LIKE '%invalid%');

-- 3. Restore critical tables
CREATE TABLE properties_backup AS SELECT * FROM properties;
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE tax_bills_backup AS SELECT * FROM tax_bills;

-- 4. Verify restoration
SELECT COUNT(*) as total_properties FROM properties;
SELECT COUNT(*) as active_users FROM users WHERE is_active = true;
SELECT COUNT(*) as pending_tax_bills FROM tax_bills WHERE status = 'pending';
```

## Contact Information

### Technical Support
- **Primary**: support@terrafusion.gov
- **Emergency**: +1-555-SUPPORT
- **Hours**: 24/7 for critical issues

### Development Team
- **Lead Developer**: dev-lead@terrafusion.gov
- **DevOps Team**: devops@terrafusion.gov
- **Database Admin**: dba@terrafusion.gov

### Escalation Procedures
1. **Level 1**: Technical Support (0-2 hours)
2. **Level 2**: Development Team (2-8 hours)
3. **Level 3**: System Architects (8-24 hours)
4. **Level 4**: Executive Team (24+ hours)

---

**Support Philosophy**: Rapid resolution with minimal downtime  
**Monitoring**: Proactive issue detection and prevention  
**Recovery**: Government-grade disaster recovery procedures
