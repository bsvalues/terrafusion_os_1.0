# Terrafusion Rollback and Recovery Procedures

## Overview

This document provides step-by-step procedures for rolling back deployments and
recovering from various failure scenarios. These procedures are critical for
maintaining service availability and data integrity.

## Quick Reference - Emergency Contacts

| Role               | Contact                  | Phone           | Available      |
| ------------------ | ------------------------ | --------------- | -------------- |
| Incident Commander | [Name]                   | +1-XXX-XXX-XXXX | 24/7           |
| Database Admin     | [Name]                   | +1-XXX-XXX-XXXX | 24/7           |
| DevOps Lead        | [Name]                   | +1-XXX-XXX-XXXX | Business hours |
| Security Team      | security@terrafusion.com | -               | 24/7           |

## Rollback Decision Matrix

| Scenario                     | Severity | Rollback Time | Decision                   |
| ---------------------------- | -------- | ------------- | -------------------------- |
| >5% API errors               | Critical | Immediate     | Automatic rollback         |
| Database corruption          | Critical | Immediate     | Stop all services, restore |
| Performance degradation >50% | High     | 15 minutes    | Monitor then rollback      |
| UI breaking changes          | High     | 30 minutes    | Rollback or hotfix         |
| Minor feature broken         | Medium   | Next window   | Hotfix preferred           |
| Cosmetic issues              | Low      | No rollback   | Fix forward                |

## Pre-Deployment Checklist

**Before ANY Production Deployment**:

- [ ] Full database backup completed
- [ ] Application backup created
- [ ] Configuration backup taken
- [ ] Rollback scripts tested
- [ ] Team notification sent
- [ ] Monitoring alerts configured
- [ ] Health check URLs verified

## Rollback Procedures

### 1. Application Rollback

#### 1.1 Backend Service Rollback

**Time Required**: 5-10 minutes

```bash
#!/bin/bash
# Quick Backend Rollback Script

echo "Starting backend rollback..."

# 1. Stop current service
sudo systemctl stop terrafusion-backend

# 2. Backup current (failed) deployment
sudo cp -r /opt/terrafusion/backend /opt/terrafusion/backend.failed.$(date +%Y%m%d-%H%M%S)

# 3. Restore previous version
sudo rm -rf /opt/terrafusion/backend
sudo cp -r /opt/terrafusion/backend.previous /opt/terrafusion/backend

# 4. Restore configuration
sudo cp /opt/terrafusion/configs/backend.env.previous /opt/terrafusion/backend/.env

# 5. Start service
sudo systemctl start terrafusion-backend

# 6. Verify health
curl -f http://localhost:\${{TF_ADMIN_PORT:-8080}}/health || exit 1

echo "Backend rollback completed"
```

#### 1.2 Frontend Rollback

**Time Required**: 3-5 minutes

```bash
#!/bin/bash
# Frontend Rollback Script

echo "Starting frontend rollback..."

# 1. Backup current build
sudo mv /var/www/terrafusion /var/www/terrafusion.failed.$(date +%Y%m%d-%H%M%S)

# 2. Restore previous build
sudo cp -r /var/www/terrafusion.previous /var/www/terrafusion

# 3. Clear CDN cache (if applicable)
# aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"

# 4. Restart web server
sudo systemctl restart nginx

echo "Frontend rollback completed"
```

#### 1.3 AI Engine Rollback

```bash
#!/bin/bash
# AI Engine Rollback

echo "Starting AI engine rollback..."

# 1. Stop AI service
sudo systemctl stop terrafusion-ai

# 2. Restore previous model and code
sudo rm -rf /opt/terrafusion/ai_engine
sudo cp -r /opt/terrafusion/ai_engine.previous /opt/terrafusion/ai_engine

# 3. Restore model files
sudo cp -r /opt/terrafusion/models.previous/* /opt/terrafusion/models/

# 4. Start service
sudo systemctl start terrafusion-ai

echo "AI engine rollback completed"
```

### 2. Database Rollback

#### 2.1 PostgreSQL Point-in-Time Recovery

**Time Required**: 30-60 minutes (depends on database size)

```bash
#!/bin/bash
# Database Recovery Script

# CRITICAL: Stop all application services first!
sudo systemctl stop terrafusion-backend terrafusion-ai

echo "Starting database recovery..."

# 1. Backup current (corrupted) state
pg_dump -h localhost -U terrafusion_user -d terrafusion_production > \
  /backups/corrupted_$(date +%Y%m%d-%H%M%S).sql

# 2. Drop and recreate database
psql -h localhost -U postgres << EOF
DROP DATABASE IF EXISTS terrafusion_production;
CREATE DATABASE terrafusion_production OWNER terrafusion_user;
EOF

# 3. Restore from backup
psql -h localhost -U terrafusion_user -d terrafusion_production < \
  /backups/terrafusion_production_$(date +%Y%m%d -d "yesterday").sql

# 4. Apply any critical patches if needed
# psql -h localhost -U terrafusion_user -d terrafusion_production < /patches/critical_fix.sql

# 5. Verify restoration
psql -h localhost -U terrafusion_user -d terrafusion_production -c "SELECT COUNT(*) FROM projects;"

echo "Database recovery completed"

# 6. Restart services
sudo systemctl start terrafusion-backend terrafusion-ai
```

#### 2.2 Redis Cache Recovery

```bash
#!/bin/bash
# Redis Recovery (if persistent storage enabled)

# 1. Stop Redis
sudo systemctl stop redis

# 2. Backup current RDB
sudo cp /var/lib/redis/dump.rdb /var/lib/redis/dump.rdb.corrupted

# 3. Restore previous RDB
sudo cp /backups/redis/dump.rdb.$(date +%Y%m%d -d "yesterday") /var/lib/redis/dump.rdb

# 4. Start Redis
sudo systemctl start redis

# 5. Verify
redis-cli ping
```

### 3. Configuration Rollback

```bash
#!/bin/bash
# Configuration Rollback

echo "Rolling back configuration..."

# 1. Backend config
sudo cp /etc/terrafusion/backend.conf.previous /etc/terrafusion/backend.conf

# 2. Nginx config
sudo cp /etc/nginx/sites-available/terrafusion.previous /etc/nginx/sites-available/terrafusion
sudo nginx -t && sudo systemctl reload nginx

# 3. Environment variables
sudo cp /opt/terrafusion/.env.previous /opt/terrafusion/.env

echo "Configuration rollback completed"
```

## Recovery Procedures

### 1. Data Corruption Recovery

**Symptoms**: Inconsistent data, application errors, query failures

**Steps**:

1. **Immediate Actions**

   ```bash
   # Stop writes to prevent further corruption
   sudo systemctl stop terrafusion-backend

   # Set database to read-only
   psql -U postgres -c "ALTER DATABASE terrafusion_production SET default_transaction_read_only = on;"
   ```

2. **Assess Damage**

   ```sql
   -- Check for corruption
   SELECT schemaname, tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
   FROM pg_tables
   WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

   -- Run integrity checks
   VACUUM ANALYZE;
   ```

3. **Recovery Options**
   - Option A: Restore from backup (data loss)
   - Option B: Fix corruption in place (risky)
   - Option C: Restore specific tables only

### 2. Service Failure Recovery

**Backend Service Won't Start**:

```bash
# 1. Check logs
sudo journalctl -u terrafusion-backend -n 100

# 2. Verify dependencies
sudo systemctl status postgresql redis

# 3. Check disk space
df -h

# 4. Verify permissions
ls -la /opt/terrafusion/backend/

# 5. Try manual start for debugging
cd /opt/terrafusion/backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port \${{TF_ADMIN_PORT:-8080}}
```

### 3. Complete System Recovery

**From Total Failure** (all services down):

1. **Infrastructure Recovery**

   ```bash
   # 1. Verify hardware/VM status
   # 2. Check network connectivity
   ping 8.8.8.8

   # 3. Start core services in order
   sudo systemctl start postgresql
   sudo systemctl start redis
   sudo systemctl start nginx
   ```

2. **Application Recovery**

   ```bash
   # 4. Start backend
   sudo systemctl start terrafusion-backend

   # 5. Start AI engine
   sudo systemctl start terrafusion-ai

   # 6. Verify all services
   sudo systemctl status terrafusion-*
   ```

3. **Verification**
   ```bash
   # Health checks
   curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/health
   curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/health
   curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/
   ```

## Disaster Recovery

### 1. Complete Data Loss Scenario

**If Primary Database is Unrecoverable**:

1. **Switch to DR Site** (if available)

   ```bash
   # Update DNS to point to DR site
   # Update load balancer configuration
   ```

2. **Restore from Off-site Backup**

   ```bash
   # Download latest backup from S3/GCS
   aws s3 cp s3://terrafusion-backups/daily/terrafusion_$(date +%Y%m%d).sql.gz .
   gunzip terrafusion_*.sql.gz

   # Restore to new database
   createdb -U postgres terrafusion_production
   psql -U postgres terrafusion_production < terrafusion_*.sql
   ```

3. **Rebuild from Source**

   ```bash
   # Clone repositories
   git clone https://github.com/terrafusion/backend.git
   git clone https://github.com/terrafusion/frontend.git
   git clone https://github.com/terrafusion/ai_engine.git

   # Deploy using standard procedures
   ```

### 2. Security Breach Recovery

**If System Compromise Detected**:

1. **Immediate Isolation**

   ```bash
   # 1. Disconnect from network (if possible)
   # 2. Preserve evidence
   sudo tar -czf /evidence/system_state_$(date +%Y%m%d-%H%M%S).tar.gz /var/log /opt/terrafusion

   # 3. Stop all services
   sudo systemctl stop terrafusion-* nginx postgresql redis
   ```

2. **Assessment**
   - Review access logs
   - Check for unauthorized changes
   - Identify breach vector

3. **Recovery**
   - Rebuild from known-good backups
   - Reset all credentials
   - Apply security patches
   - Implement additional monitoring

## Testing Procedures

### Monthly Rollback Drills

**Test Schedule**:

- 1st Monday: Backend rollback test
- 2nd Monday: Frontend rollback test
- 3rd Monday: Database recovery test
- 4th Monday: Full system recovery

**Test Script**:

```bash
#!/bin/bash
# Rollback Test Script (run in staging)

echo "Starting rollback drill..."

# 1. Deploy "bad" version
./deploy_test_version.sh

# 2. Verify failure
curl -f http://staging.terrafusion.com/health && echo "ERROR: Should have failed" && exit 1

# 3. Execute rollback
time ./rollback_application.sh

# 4. Verify recovery
curl -f http://staging.terrafusion.com/health || exit 1

echo "Rollback drill completed successfully"
```

## Post-Incident Procedures

### 1. Immediate Actions

- [ ] Services restored and verified
- [ ] Users notified of resolution
- [ ] Monitoring confirmed normal
- [ ] Data integrity verified

### 2. Within 24 Hours

- [ ] Incident report drafted
- [ ] Root cause identified
- [ ] Timeline documented
- [ ] Stakeholders briefed

### 3. Within 1 Week

- [ ] Post-mortem conducted
- [ ] Procedures updated
- [ ] Preventive measures implemented
- [ ] Team training scheduled

## Rollback Automation

### Jenkins/GitLab CI Pipeline

```yaml
# .gitlab-ci.yml rollback job
rollback-production:
  stage: rollback
  script:
    - ssh deploy@prod "cd /opt/terrafusion && ./scripts/rollback.sh"
  when: manual
  only:
    - master
```

### Monitoring Integration

```python
# Automatic rollback trigger
def check_deployment_health():
    error_rate = get_error_rate()
    response_time = get_avg_response_time()

    if error_rate > 0.05 or response_time > 2000:
        send_alert("Deployment issues detected")
        if auto_rollback_enabled:
            execute_rollback()
            notify_team("Automatic rollback executed")
```

## Important Notes

1. **Always** verify backups before any major deployment
2. **Never** skip the pre-deployment checklist
3. **Document** any deviations from standard procedures
4. **Test** rollback procedures regularly in staging
5. **Communicate** status updates every 15 minutes during incidents

## Appendix: Quick Commands

```bash
# Service Management
sudo systemctl status terrafusion-*
sudo systemctl restart terrafusion-backend
sudo journalctl -f -u terrafusion-backend

# Database Queries
psql -U terrafusion_user -d terrafusion_production -c "SELECT version();"
psql -U terrafusion_user -d terrafusion_production -c "SELECT COUNT(*) FROM projects;"

# Health Checks
curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/health
curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/health
curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/health

# Backup Commands
pg_dump -U terrafusion_user terrafusion_production > backup_$(date +%Y%m%d).sql
redis-cli BGSAVE

# Log Locations
/var/log/terrafusion/backend.log
/var/log/nginx/access.log
/var/log/postgresql/postgresql-16-main.log
```

---

Remember: When in doubt, prioritize data integrity over service availability.
It's better to have downtime than data loss.
