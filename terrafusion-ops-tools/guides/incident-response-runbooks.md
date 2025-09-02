# Terrafusion Incident Response Runbooks

## Overview
This document contains step-by-step procedures for responding to common incidents in the Terrafusion platform. Each runbook follows a consistent format for quick action during emergencies.

## Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1 - Critical** | Complete service outage or data loss risk | <15 minutes | Site down, database corruption |
| **P2 - High** | Major feature broken, significant degradation | <1 hour | API errors >50%, login failures |
| **P3 - Medium** | Minor feature broken, workaround available | <4 hours | Report generation slow |
| **P4 - Low** | Cosmetic issues, minimal impact | <24 hours | UI alignment issues |

## Communication Protocol

### Incident Channels
- **Slack**: #terrafusion-incidents (automated alerts)
- **Slack**: #terrafusion-war-room (active incident discussion)
- **Email**: incidents@terrafusion.com
- **Phone**: On-call engineer via PagerDuty
- **Status Page**: https://status.terrafusion.com

### Roles During Incident
- **Incident Commander (IC)**: Overall coordination
- **Technical Lead**: Technical investigation and fixes
- **Communications Lead**: Stakeholder updates
- **Scribe**: Documentation and timeline

---

## Runbook 1: Complete Service Outage

**Symptoms**: Main website and API are not responding

### Immediate Actions (0-5 minutes)

1. **Verify the Issue**
   ```bash
   # Check service status
   curl -I https://terrafusion.com
   curl -I https://api.terrafusion.com
   
   # Check from different locations
   # Use status page or uptime monitoring
   ```

2. **Declare Incident**
   - Post in #terrafusion-incidents: "@here P1 Incident: Complete service outage detected"
   - Start incident timer
   - Assign IC role

3. **Initial Diagnostics**
   ```bash
   # SSH to production servers
   ssh prod-server-1
   
   # Check service status
   sudo systemctl status terrafusion-backend
   sudo systemctl status terrafusion-frontend
   sudo systemctl status nginx
   
   # Check recent logs
   sudo journalctl -u terrafusion-backend -n 100
   tail -f /var/log/nginx/error.log
   ```

### Investigation Phase (5-15 minutes)

4. **Check Infrastructure**
   ```bash
   # Server resources
   free -h
   df -h
   top
   
   # Network connectivity
   ping 8.8.8.8
   netstat -tulpn | grep LISTEN
   
   # Database connectivity
   psql -h localhost -U terrafusion_user -d terrafusion_production -c "SELECT 1;"
   
   # Redis connectivity
   redis-cli ping
   ```

5. **Check Recent Changes**
   - Review deployment history
   - Check recent commits
   - Review infrastructure changes

### Recovery Actions

6. **Service Recovery Attempts**
   ```bash
   # Restart services
   sudo systemctl restart terrafusion-backend
   sudo systemctl restart terrafusion-frontend
   sudo systemctl restart nginx
   
   # If database issues
   sudo systemctl restart postgresql
   
   # Clear Redis cache if needed
   redis-cli FLUSHALL
   ```

7. **Rollback if Needed**
   ```bash
   # Execute rollback script
   cd /opt/terrafusion
   ./scripts/emergency-rollback.sh
   ```

### Post-Recovery

8. **Verify Services**
   ```bash
   # Health checks
   curl http://localhost:8080/health
   curl http://localhost:3003/health
   
   # Functional tests
   ./scripts/smoke-tests.sh
   ```

9. **Communication**
   - Update status page
   - Send all-clear notification
   - Schedule post-mortem

---

## Runbook 2: Database Performance Crisis

**Symptoms**: Slow queries, timeouts, connection pool exhaustion

### Immediate Actions

1. **Assess Impact**
   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;
   
   -- Long running queries
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
   
   -- Lock conflicts
   SELECT blocked_locks.pid AS blocked_pid,
          blocking_locks.pid AS blocking_pid,
          blocked_activity.query AS blocked_query,
          blocking_activity.query AS blocking_query
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;
   ```

2. **Kill Problematic Queries**
   ```sql
   -- Kill specific query
   SELECT pg_cancel_backend(PID);
   
   -- Force terminate if needed
   SELECT pg_terminate_backend(PID);
   
   -- Kill all queries from specific user
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE usename = 'problematic_user'
   AND pid <> pg_backend_pid();
   ```

3. **Emergency Maintenance Mode**
   ```bash
   # Enable maintenance mode
   touch /opt/terrafusion/MAINTENANCE_MODE
   
   # Restart with limited connections
   sudo systemctl stop terrafusion-backend
   # Edit config to reduce connection pool
   sudo systemctl start terrafusion-backend
   ```

### Investigation

4. **Analyze Query Performance**
   ```sql
   -- Enable query logging temporarily
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   
   -- Check table statistics
   SELECT schemaname, tablename, n_dead_tup, last_vacuum, last_autovacuum
   FROM pg_stat_user_tables
   ORDER BY n_dead_tup DESC;
   
   -- Missing indexes
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   AND n_distinct > 100
   AND correlation < 0.1
   ORDER BY n_distinct DESC;
   ```

5. **Emergency Optimization**
   ```sql
   -- Emergency VACUUM
   VACUUM ANALYZE;
   
   -- Rebuild specific indexes
   REINDEX TABLE projects;
   REINDEX TABLE costs;
   
   -- Update statistics
   ANALYZE;
   ```

---

## Runbook 3: High Error Rate

**Symptoms**: API returning 500 errors, error rate >5%

### Immediate Actions

1. **Identify Error Pattern**
   ```bash
   # Check error logs
   tail -f /var/log/terrafusion/backend.log | grep ERROR
   
   # Count errors by endpoint
   grep "500" /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20
   
   # Recent application errors
   journalctl -u terrafusion-backend --since "10 minutes ago" | grep -i error
   ```

2. **Check Dependencies**
   ```bash
   # Database connectivity
   nc -zv localhost 5432
   
   # Redis connectivity
   nc -zv localhost 6379
   
   # External API health
   curl -I https://external-api.example.com/health
   ```

### Mitigation

3. **Circuit Breaker Activation**
   ```python
   # Enable circuit breaker for failing service
   redis-cli SET "circuit_breaker:external_api" "open" EX 300
   
   # Disable specific features
   redis-cli SET "feature_flag:ai_predictions" "false"
   ```

4. **Scale Resources**
   ```bash
   # Add more workers
   docker-compose up -d --scale worker=5
   
   # Increase backend instances
   kubectl scale deployment terrafusion-backend --replicas=5
   ```

---

## Runbook 4: Security Incident

**Symptoms**: Suspicious activity, unauthorized access, data breach indicators

### Immediate Actions

1. **Containment**
   ```bash
   # Block suspicious IPs
   sudo iptables -A INPUT -s SUSPICIOUS_IP -j DROP
   
   # Disable compromised accounts
   psql -d terrafusion_production -c "UPDATE users SET is_active = false WHERE email = 'compromised@example.com';"
   
   # Revoke all sessions
   redis-cli FLUSHDB
   ```

2. **Evidence Collection**
   ```bash
   # Preserve logs
   sudo tar -czf /secure/incident_$(date +%Y%m%d_%H%M%S).tar.gz \
     /var/log/nginx/ \
     /var/log/terrafusion/ \
     /var/log/auth.log
   
   # Capture network traffic
   sudo tcpdump -i any -w /secure/capture_$(date +%Y%m%d_%H%M%S).pcap
   
   # System snapshot
   sudo tar -czf /secure/system_state_$(date +%Y%m%d_%H%M%S).tar.gz \
     /etc/ \
     /opt/terrafusion/
   ```

3. **Immediate Remediation**
   ```bash
   # Force password reset for all users
   psql -d terrafusion_production -c "UPDATE users SET force_password_reset = true;"
   
   # Rotate all secrets
   ./scripts/rotate-secrets.sh
   
   # Enable enhanced logging
   ./scripts/enable-audit-mode.sh
   ```

---

## Runbook 5: Data Corruption

**Symptoms**: Inconsistent data, calculation errors, missing records

### Immediate Actions

1. **Stop Data Modifications**
   ```bash
   # Enable read-only mode
   psql -U postgres -c "ALTER DATABASE terrafusion_production SET default_transaction_read_only = on;"
   
   # Stop background workers
   sudo systemctl stop terrafusion-worker terrafusion-scheduler
   ```

2. **Assess Damage**
   ```sql
   -- Check data integrity
   SELECT COUNT(*), COUNT(DISTINCT id) FROM projects;
   SELECT COUNT(*), COUNT(DISTINCT id) FROM costs;
   
   -- Find orphaned records
   SELECT c.* FROM costs c
   LEFT JOIN projects p ON c.project_id = p.id
   WHERE p.id IS NULL;
   
   -- Verify calculations
   SELECT project_id, 
          SUM(amount) as calculated_total,
          (SELECT total_cost FROM projects WHERE id = c.project_id) as stored_total
   FROM costs c
   GROUP BY project_id
   HAVING SUM(amount) != (SELECT total_cost FROM projects WHERE id = c.project_id);
   ```

3. **Recovery Options**
   ```bash
   # Option 1: Restore from backup
   ./scripts/db_restore.sh -t  # Test restore first
   
   # Option 2: Fix in place
   psql -d terrafusion_production < /recovery/fix_corruption.sql
   
   # Option 3: Partial restore
   pg_dump -t affected_table backup_db | psql terrafusion_production
   ```

---

## Runbook 6: AI Engine Failure

**Symptoms**: Predictions failing, model not responding, high latency

### Immediate Actions

1. **Failover to Backup**
   ```bash
   # Switch to simple calculation mode
   redis-cli SET "ai_engine:fallback_mode" "true" EX 3600
   
   # Route traffic to backup model
   ./scripts/switch-ai-model.sh backup
   ```

2. **Diagnose AI Service**
   ```bash
   # Check service health
   curl http://localhost:8001/health
   
   # Check model loading
   docker logs terrafusion-ai-engine --tail 100
   
   # Memory usage
   docker stats terrafusion-ai-engine
   ```

3. **Recovery Steps**
   ```bash
   # Restart with fresh model
   docker-compose restart ai-engine
   
   # Clear model cache
   rm -rf /opt/terrafusion/models/cache/*
   
   # Reload model
   curl -X POST http://localhost:8001/admin/reload-model
   ```

---

## Generic Incident Response Checklist

### During Incident
- [ ] Acknowledge alert within SLA
- [ ] Assess severity and impact
- [ ] Declare incident if needed
- [ ] Assign roles (IC, Tech Lead, Comms)
- [ ] Create war room channel/call
- [ ] Start incident timeline
- [ ] Communicate status every 30 minutes
- [ ] Track all actions taken
- [ ] Consider customer impact
- [ ] Evaluate need for escalation

### After Resolution
- [ ] Verify fix is working
- [ ] Monitor for 30 minutes
- [ ] Send all-clear notification
- [ ] Update status page
- [ ] Document timeline
- [ ] Schedule post-mortem
- [ ] Create follow-up tickets
- [ ] Update runbooks if needed

## Escalation Matrix

| Time Elapsed | P1 Critical | P2 High | P3 Medium | P4 Low |
|--------------|-------------|---------|-----------|--------|
| 15 min | Team Lead | - | - | - |
| 30 min | Director | Team Lead | - | - |
| 1 hour | VP/CTO | Director | Team Lead | - |
| 2 hours | CEO | VP | Director | Team Lead |

## Tools and Scripts

### Monitoring Commands
```bash
# Quick system health
./scripts/health-check.sh

# Service status dashboard
./scripts/service-status.sh

# Database health
./scripts/db-health.sh

# Performance metrics
./scripts/perf-check.sh
```

### Recovery Scripts
```bash
# Emergency rollback
./scripts/emergency-rollback.sh

# Service restart with checks
./scripts/safe-restart.sh [service_name]

# Database recovery
./scripts/db-recovery.sh

# Cache clear
./scripts/clear-all-caches.sh
```

## Post-Mortem Template

```markdown
# Incident Post-Mortem: [Incident Title]

**Date**: [Date]
**Duration**: [Start Time] - [End Time]
**Severity**: P[1-4]
**Impact**: [User impact description]

## Summary
[Brief description of what happened]

## Timeline
- [Time]: [Event]
- [Time]: [Event]

## Root Cause
[Detailed explanation of root cause]

## Resolution
[How the incident was resolved]

## Impact
- Users affected: [Number]
- Revenue impact: [Amount]
- SLA impact: [Percentage]

## What Went Well
- [Positive point]

## What Went Wrong
- [Issue]

## Action Items
- [ ] [Owner]: [Action] by [Date]

## Lessons Learned
[Key takeaways]
```

## Contact Information

### Primary Contacts
- **On-Call Engineer**: Via PagerDuty
- **Incident Commander Pool**: ic-pool@terrafusion.com
- **Management Escalation**: management-escalation@terrafusion.com

### External Contacts
- **AWS Support**: [Support case URL]
- **Database Vendor**: +1-XXX-XXX-XXXX
- **Security Team**: security@terrafusion.com

### Communication Templates

**Initial Alert**:
```
🚨 P[1-4] Incident Declared

Issue: [Brief description]
Impact: [User impact]
Status: Investigating
Next Update: In 30 minutes

Incident Commander: [Name]
```

**Update Template**:
```
📊 Incident Update - [Time]

Current Status: [Investigating/Mitigating/Monitoring]
Progress: [What's been done]
Next Steps: [What's planned]
ETA: [Resolution estimate]
```

**Resolution Notice**:
```
✅ Incident Resolved

Duration: [Total time]
Root Cause: [Brief description]
Resolution: [What fixed it]
Follow-up: Post-mortem scheduled for [Date]
```

---

Remember: Stay calm, follow the runbook, communicate clearly, and document everything!