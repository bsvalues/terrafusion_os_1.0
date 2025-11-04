# TerraFusion Quantum Research Portal - Operational Runbook

**Version:** 1.0.0
**Date:** November 3, 2025
**Audience:** DevOps Engineers, SREs, On-Call Teams
**Purpose:** Post-deployment operational procedures and incident response

---

## 📚 Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Incident Response Playbooks](#incident-response-playbooks)
4. [Capacity Planning](#capacity-planning)
5. [Maintenance Procedures](#maintenance-procedures)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Emergency Contacts](#emergency-contacts)

---

## 🌅 Daily Operations

### Morning Health Check Routine (8:00 AM UTC)

#### 1. System Health Dashboard Review
```bash
# Open System Health Dashboard
# URL: https://portal.terrafusion.gov/monitoring/health

# Verify dashboard displays:
✅ System uptime: ≥99.9%
✅ Average response time: <50ms
✅ Error rate: <1%
✅ All 7 services: "healthy" status
✅ Zero active critical alerts
✅ Resource utilization normal:
   - CPU: <70%
   - Memory: <80%
   - Disk: <75%
```

#### 2. Service Health Check via CLI
```bash
# Check all pod statuses
kubectl get pods -n terrafusion-research

# Expected output: All pods in "Running" state, 0 restarts

# Verify service endpoints
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s http://terrafusion-api:5000/health

# Expected: {"status":"healthy","timestamp":"..."}

# Check resource utilization
kubectl top pods -n terrafusion-research

# Flag any pods with:
# - CPU >80%
# - Memory >85%
# - Frequent restarts (>5 in 24h)
```

#### 3. Review Overnight Alerts
```bash
# Check AlertingEngine alert statistics
curl -s https://api.terrafusion.gov/api/alerts/statistics | jq

# Review output:
# {
#   "totalActive": 0,           # Should be 0 for normal operation
#   "totalResolved": X,
#   "bySeverity": {
#     "critical": 0,            # MUST be 0
#     "warning": 0-2,           # Acceptable: 0-2
#     "info": 0-5               # Acceptable: 0-5
#   },
#   "avgResolutionTimeMinutes": 4.5  # Target: <10 minutes
# }

# If any critical alerts active:
# 1. Acknowledge alert immediately
# 2. Follow incident response playbook
# 3. Notify on-call engineer
```

#### 4. Database Health Verification
```bash
# Check PostgreSQL pod status
kubectl get pods -l app=postgres -n terrafusion-research

# Verify database connectivity
kubectl exec -it deployment/terrafusion-api -n terrafusion-research -- \
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM research_sessions;"

# Expected: Query returns count without errors

# Check database storage usage
kubectl exec -it postgres-0 -n terrafusion-research -- \
  df -h /var/lib/postgresql/data

# Flag if disk usage >75%
```

---

## 📊 Monitoring & Alerting

### System Health Dashboard Usage

**Access:** https://portal.terrafusion.gov/monitoring/health
**Update Frequency:** 5 seconds (real-time polling)
**Data Retention:** 90 days historical metrics

#### Dashboard Sections

**1. Service Health Cards**
- Displays 7 services: researchSession, quantumVisualization, consciousnessParameter, statisticalAnalysis, aiSwarm, iaaCompliance, export
- Status indicators:
  - 🟢 Healthy: uptime ≥99.9%, responseTime <50ms, errorRate <1%
  - 🟡 Degraded: uptime 98-99.9%, responseTime 50-100ms, errorRate 1-3%
  - 🔴 Down: uptime <98%, responseTime >100ms, errorRate >3%

**2. System Metrics Overview**
- **System Uptime:** Current uptime percentage (target: ≥99.9%)
- **Average Response Time:** Across all services (target: <50ms P95)
- **Error Rate:** Total errors / total requests (target: <1%)
- **Resource Utilization:** CPU, Memory, Disk, Connection Pool, Database Query Performance

**3. Active Alerts Display**
- Real-time alerts with severity badges (info/warning/critical)
- Alert age, affected service, current value vs threshold
- Acknowledgment status and assigned owner

**4. Recent Downtime Incidents**
- Last 10 downtime events with timestamps, duration, severity, resolution status

### Alert Response Procedures

#### Alert Severity Levels

**🔴 CRITICAL (Immediate Response - <5 minutes)**
- System uptime <99%
- Any service completely down
- Database connection failures
- Error rate >5%
- P95 response time >150ms

**🟡 WARNING (Response within 1 hour)**
- System uptime 99-99.9%
- Service degraded performance
- Error rate 1-3%
- Resource utilization >80%
- P95 response time 50-100ms

**ℹ️ INFO (Response within 24 hours)**
- Minor performance fluctuations
- Non-critical configuration changes
- Capacity planning recommendations
- Routine maintenance notifications

#### Alert Notification Channels

**Slack (#terrafusion-alerts)**
- All severity levels
- Real-time notifications with rich formatting
- Thread discussions for incident coordination

**Email (ops@terrafusion.gov)**
- Critical and Warning alerts only
- Sent to on-call engineer rotation
- Includes alert details and suggested actions

**SMS (On-Call Engineer)**
- Critical alerts only
- Sent after 5 minutes if not acknowledged
- Triggers escalation to Level 2 (management)

**Console Logs**
- All alerts logged to application console
- Useful for debugging and post-incident analysis

### Weekly Capacity Planning Review (Mondays 9:00 AM UTC)

#### Review GitHub Actions Metrics Report

```bash
# View latest weekly report artifact
gh run list --workflow=historical-metrics.yml --limit=1

# Download latest report
gh run download RUN_ID --name=weekly-report

# Review capacity-planning.json
cat capacity-planning.json | jq

# Focus on:
# 1. Services with daysUntilThreshold <90
# 2. Metrics with "increasing" trend and confidence >0.7
# 3. Predictions exceeding thresholds within 30 days
```

#### Capacity Planning Actions

**If daysUntilThreshold <90 days:**
1. **Immediate Review Required**
   - Analyze trend slope and confidence score
   - Validate predictions with actual system behavior
   - Identify root cause (increased traffic, inefficient queries, memory leaks)

2. **Mitigation Options**
   - Horizontal scaling: Increase pod replicas
   - Vertical scaling: Increase CPU/memory limits
   - Optimize code: Identify performance bottlenecks
   - Add caching: Redis for frequently accessed data
   - Database tuning: Optimize slow queries, add indexes

3. **Document Decision**
   - Create GitHub issue with "capacity-planning" label
   - Document analysis, mitigation plan, timeline
   - Assign to appropriate team member
   - Schedule follow-up review

**If daysUntilThreshold <30 days:**
1. **URGENT ACTION REQUIRED**
   - Escalate to engineering lead immediately
   - Schedule emergency capacity review meeting
   - Implement temporary mitigation (scale up replicas)
   - Fast-track permanent solution development

---

## 🚨 Incident Response Playbooks

### Playbook 1: Service Down (CRITICAL)

**Symptoms:**
- Health check endpoint returns 500 error or times out
- Service status shows "down" in System Health Dashboard
- Users report complete inability to access functionality

**Immediate Actions (0-5 minutes):**
```bash
# 1. Acknowledge alert
curl -X POST https://api.terrafusion.gov/api/alerts/SERVICE_ALERT_ID/acknowledge \
  -H "Authorization: Bearer $ON_CALL_TOKEN" \
  -d '{"acknowledgedBy":"your-name"}'

# 2. Check pod status
kubectl get pods -n terrafusion-research -l app=SERVICE_NAME

# 3. If pod in CrashLoopBackOff or ImagePullBackOff:
kubectl describe pod POD_NAME -n terrafusion-research

# 4. Check recent logs
kubectl logs -l app=SERVICE_NAME -n terrafusion-research --tail=100
```

**Investigation (5-15 minutes):**
```bash
# 5. Check for resource exhaustion
kubectl top pods -n terrafusion-research -l app=SERVICE_NAME

# 6. Review events
kubectl get events -n terrafusion-research --sort-by='.lastTimestamp' | grep SERVICE_NAME

# 7. Test service endpoint directly
kubectl port-forward -n terrafusion-research svc/SERVICE_NAME 8080:PORT
curl http://localhost:8080/health
```

**Resolution (15-30 minutes):**
```bash
# If out of memory: Increase memory limit
kubectl set resources deployment/SERVICE_NAME -n terrafusion-research \
  --limits=memory=8Gi --requests=memory=4Gi

# If image pull error: Verify image exists and credentials valid
kubectl get secret -n terrafusion-research

# If application crash: Rollback to previous version
kubectl rollout undo deployment/SERVICE_NAME -n terrafusion-research

# If configuration error: Update ConfigMap and restart
kubectl edit configmap terrafusion-config -n terrafusion-research
kubectl rollout restart deployment/SERVICE_NAME -n terrafusion-research

# Verify service recovered
kubectl wait --for=condition=ready pod -l app=SERVICE_NAME -n terrafusion-research --timeout=300s
```

**Post-Incident (30-60 minutes):**
```bash
# 1. Resolve alert
curl -X POST https://api.terrafusion.gov/api/alerts/SERVICE_ALERT_ID/resolve \
  -H "Authorization: Bearer $ON_CALL_TOKEN"

# 2. Document incident in #terrafusion-incidents Slack channel
# Include:
# - Incident start/end times
# - Root cause
# - Resolution steps
# - Lessons learned
# - Preventive actions

# 3. Create post-incident review document
# Template: https://github.com/terrafusion/docs/templates/post-incident-review.md
```

---

### Playbook 2: High Error Rate (WARNING)

**Symptoms:**
- Error rate >1% on System Health Dashboard
- 4xx or 5xx errors in application logs
- Users report intermittent failures

**Investigation Steps:**
```bash
# 1. Identify error types
kubectl logs -l app=terrafusion-api -n terrafusion-research --tail=500 | grep -i error

# 2. Check error distribution (4xx vs 5xx)
curl -s https://api.terrafusion.gov/api/system/health | jq '.errorRates'

# Output analysis:
# - High 4xx errors: Client-side issues (bad requests, auth failures)
# - High 5xx errors: Server-side issues (application crashes, database errors)

# 3. If 4xx errors (client-side):
#    - Review request validation logs
#    - Check API documentation accuracy
#    - Verify client applications using correct endpoints

# 4. If 5xx errors (server-side):
#    - Check database connectivity
#    - Review application exception logs
#    - Verify external service integrations
```

**Resolution:**
```bash
# For database connection errors:
kubectl exec -it deployment/terrafusion-api -n terrafusion-research -- \
  psql "$DATABASE_URL" -c "SELECT 1;"

# If connection fails, restart database pod:
kubectl delete pod postgres-0 -n terrafusion-research
# StatefulSet will recreate pod automatically

# For rate limiting issues:
kubectl edit configmap terrafusion-config -n terrafusion-research
# Adjust RATE_LIMIT_REQUESTS and RATE_LIMIT_WINDOW_MINUTES
kubectl rollout restart deployment/terrafusion-api -n terrafusion-research

# Monitor error rate recovery:
watch -n 5 'curl -s https://api.terrafusion.gov/api/system/health | jq ".errorRates.errorPercentage"'
# Target: Error rate drops below 1% within 10 minutes
```

---

### Playbook 3: High Response Time (WARNING)

**Symptoms:**
- P95 response time >50ms
- Average response time >20ms
- Users report slow page loads

**Investigation:**
```bash
# 1. Identify slow services
curl -s https://api.terrafusion.gov/api/system/health | jq '.services[] | select(.responseTime > 50) | {serviceName, responseTime}'

# 2. Check database query performance
kubectl logs -l app=terrafusion-api -n terrafusion-research --tail=200 | grep -i "slow query"

# 3. Verify resource utilization
kubectl top pods -n terrafusion-research

# 4. Check for network issues
kubectl get svc -n terrafusion-research
kubectl describe ingress terrafusion-ingress -n terrafusion-research
```

**Resolution:**
```bash
# Option 1: Horizontal scaling (add more pods)
kubectl scale deployment/SERVICE_NAME --replicas=5 -n terrafusion-research

# Option 2: Optimize database queries
# - Add missing indexes
# - Analyze slow query logs
# - Implement query result caching

# Option 3: Enable connection pooling
kubectl edit configmap terrafusion-config -n terrafusion-research
# Set DATABASE_MAX_POOL_SIZE=50

# Option 4: Implement Redis caching
helm install redis bitnami/redis \
  --namespace terrafusion-research \
  --set auth.password=STRONG_PASSWORD

# Update application to use Redis for frequently accessed data

# Monitor response time improvement
watch -n 5 'curl -s https://api.terrafusion.gov/api/system/health | jq ".performanceMetrics.avgResponseTime"'
```

---

### Playbook 4: Database Issues (CRITICAL)

**Symptoms:**
- Database connection errors in application logs
- PostgreSQL pod in CrashLoopBackOff
- Data persistence failures

**Investigation:**
```bash
# 1. Check PostgreSQL pod status
kubectl get pods -l app=postgres -n terrafusion-research

# 2. View PostgreSQL logs
kubectl logs postgres-0 -n terrafusion-research --tail=100

# 3. Check persistent volume claim
kubectl get pvc postgres-pvc -n terrafusion-research

# 4. Verify storage capacity
kubectl exec -it postgres-0 -n terrafusion-research -- df -h
```

**Resolution:**
```bash
# If disk full (>90% usage):
# 1. Clean up old data (if retention policy allows)
kubectl exec -it postgres-0 -n terrafusion-research -- psql -U terrafusion_user -d terrafusion_research -c "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';"

# 2. Increase PVC size
kubectl patch pvc postgres-pvc -n terrafusion-research -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'

# If PostgreSQL pod crashed:
# 1. Check for OOM (Out of Memory) killer
kubectl describe pod postgres-0 -n terrafusion-research | grep -i oom

# 2. Increase memory limits
kubectl patch statefulset postgres -n terrafusion-research -p '{"spec":{"template":{"spec":{"containers":[{"name":"postgres","resources":{"limits":{"memory":"16Gi"}}}]}}}}'

# If data corruption detected:
# 1. Restore from latest backup
kubectl exec -it postgres-0 -n terrafusion-research -- \
  psql -U terrafusion_user -d terrafusion_research < /backups/latest_backup.sql

# 2. Verify data integrity
kubectl exec -it postgres-0 -n terrafusion-research -- \
  psql -U terrafusion_user -d terrafusion_research -c "SELECT COUNT(*) FROM research_sessions;"
```

---

## 📅 Maintenance Procedures

### Weekly Maintenance Tasks (Sundays 2:00 AM UTC)

#### 1. Database Backup
```bash
# Create database backup
kubectl exec -it postgres-0 -n terrafusion-research -- \
  pg_dump -U terrafusion_user -d terrafusion_research -F c -f /backups/terrafusion_$(date +%Y%m%d).backup

# Copy backup to external storage
kubectl cp terrafusion-research/postgres-0:/backups/terrafusion_$(date +%Y%m%d).backup \
  ./terrafusion_$(date +%Y%m%d).backup

# Upload to cloud storage (S3/Azure Blob/GCS)
aws s3 cp ./terrafusion_$(date +%Y%m%d).backup \
  s3://terrafusion-backups/database/terrafusion_$(date +%Y%m%d).backup

# Verify backup integrity
kubectl exec -it postgres-0 -n terrafusion-research -- \
  pg_restore -U terrafusion_user -d postgres -l /backups/terrafusion_$(date +%Y%m%d).backup

# Clean up local backup
rm ./terrafusion_$(date +%Y%m%d).backup
```

#### 2. Log Rotation & Cleanup
```bash
# Rotate Kubernetes pod logs (retain last 7 days)
kubectl get pods -n terrafusion-research -o name | \
  xargs -I {} kubectl logs {} -n terrafusion-research --since=168h > /dev/null

# Clean up old audit logs from database
kubectl exec -it postgres-0 -n terrafusion-research -- \
  psql -U terrafusion_user -d terrafusion_research -c \
  "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';"

# Vacuum database to reclaim storage
kubectl exec -it postgres-0 -n terrafusion-research -- \
  psql -U terrafusion_user -d terrafusion_research -c "VACUUM ANALYZE;"
```

#### 3. Security Updates
```bash
# Scan images for vulnerabilities
trivy image terrafusion/frontend:1.0.0
trivy image terrafusion/backend-api:1.0.0
trivy image terrafusion/consciousness-engine:1.0.0

# If critical CVEs found:
# 1. Review vulnerability details
# 2. Update base images or dependencies
# 3. Rebuild and push new images
# 4. Deploy updated images to cluster

# Update Kubernetes system components
kubectl get nodes -o wide  # Check current Kubernetes version
# Follow cluster provider's upgrade procedure (AKS/EKS/GKE)
```

### Monthly Maintenance Tasks

#### 1. Certificate Renewal (1st of each month)
```bash
# Check SSL/TLS certificate expiration
kubectl get secret terrafusion-tls -n terrafusion-research -o jsonpath='{.data.tls\.crt}' | \
  base64 -d | openssl x509 -noout -dates

# If expiration <30 days:
# 1. Generate new certificate via Let's Encrypt or CA
# 2. Update TLS secret
kubectl create secret tls terrafusion-tls \
  --namespace=terrafusion-research \
  --cert=/path/to/new_certificate.crt \
  --key=/path/to/new_private.key \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Verify new certificate active
curl -vI https://portal.terrafusion.gov 2>&1 | grep "expire date"
```

#### 2. Capacity Review & Planning
```bash
# Generate capacity planning report
curl -s https://api.terrafusion.gov/api/metrics/capacity-planning | jq

# Review metrics:
# - Services with increasing resource usage
# - Predictions exceeding thresholds within 90 days
# - Trend confidence scores >0.7

# Schedule capacity upgrade if needed:
# - Add cluster nodes
# - Increase pod replicas
# - Upgrade database instance size
```

#### 3. Performance Tuning
```bash
# Analyze slow database queries
kubectl exec -it postgres-0 -n terrafusion-research -- \
  psql -U terrafusion_user -d terrafusion_research -c \
  "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Optimize slow queries:
# - Add missing indexes
# - Refactor complex joins
# - Implement query result caching

# Test performance improvements
kubectl run load-test --image=loadimpact/k6 --rm -it --restart=Never -- \
  run --vus 100 --duration 60s /scripts/load-test.js
```

### Quarterly Maintenance Tasks

#### 1. Disaster Recovery Drill
```bash
# Simulate database failure and restore from backup
# 1. Create test namespace
kubectl create namespace terrafusion-test

# 2. Restore latest backup to test namespace
kubectl exec -it postgres-0 -n terrafusion-test -- \
  pg_restore -U terrafusion_user -d terrafusion_research /backups/latest_backup.backup

# 3. Verify data integrity
kubectl exec -it postgres-0 -n terrafusion-test -- \
  psql -U terrafusion_user -d terrafusion_research -c "SELECT COUNT(*) FROM research_sessions;"

# 4. Test application connectivity to restored database
# 5. Document recovery time (target: <30 minutes)
# 6. Clean up test namespace
kubectl delete namespace terrafusion-test
```

#### 2. Access Control Audit
```bash
# Review user access to Kubernetes cluster
kubectl get rolebindings,clusterrolebindings -n terrafusion-research -o json | \
  jq '.items[] | {name: .metadata.name, subjects: .subjects}'

# Verify SSO/SAML integration active
# Review JWT token expiration policies
# Audit API key usage and rotation

# Remove inactive users:
kubectl delete rolebinding INACTIVE_USER_BINDING -n terrafusion-research
```

---

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### Issue: "Service temporarily unavailable" errors

**Cause:** Backend service pods not ready or load balancer unhealthy

**Solution:**
```bash
# Check pod readiness
kubectl get pods -n terrafusion-research -l app=terrafusion-api

# If pods not ready, check readiness probe failures
kubectl describe pod POD_NAME -n terrafusion-research | grep -A 10 "Readiness"

# Common causes:
# - Health check endpoint returning non-200 status
# - Database connection not established
# - External dependency unavailable

# Fix: Increase readiness probe initial delay
kubectl patch deployment terrafusion-api -n terrafusion-research -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"api","readinessProbe":{"initialDelaySeconds":30}}]}}}}'
```

#### Issue: Memory leaks in long-running pods

**Symptoms:** Gradual memory increase, eventual OOMKilled

**Solution:**
```bash
# Identify memory leaks
kubectl top pods -n terrafusion-research --sort-by=memory

# Analyze heap dumps (if .NET application)
kubectl exec -it POD_NAME -n terrafusion-research -- \
  dotnet-dump collect --process-id 1 --output /tmp/heap.dmp

# Temporary fix: Restart pod
kubectl delete pod POD_NAME -n terrafusion-research

# Permanent fix: Implement memory profiling and optimize code
# Set memory limits to prevent OOMKilled:
kubectl set resources deployment/SERVICE_NAME -n terrafusion-research \
  --limits=memory=4Gi --requests=memory=2Gi
```

---

## 📞 Emergency Contacts

### On-Call Rotation

| Week | Primary Engineer | Secondary Engineer | Manager Escalation |
|------|-----------------|--------------------|--------------------|
| Nov 4-10 | Alice Johnson (alice@terrafusion.gov) | Bob Smith (bob@terrafusion.gov) | Carol Davis (carol@terrafusion.gov) |
| Nov 11-17 | Bob Smith | Charlie Brown | Carol Davis |
| Nov 18-24 | Charlie Brown | Alice Johnson | Carol Davis |

### Escalation Path

**Level 1 (On-Call Engineer):** Responds within 5 minutes for critical alerts
**Level 2 (Engineering Lead):** Escalated after 15 minutes if unresolved
**Level 3 (CTO):** Escalated after 30 minutes for critical system outage

### External Support

- **Cloud Provider Support:** [Provider]-specific support portal (Priority: Production)
- **Database Vendor:** PostgreSQL Enterprise Support (24/7 phone support)
- **Security Team:** security@terrafusion.gov (immediate response for security incidents)

---

**Operational Excellence:** Maintain 99.9% uptime through proactive monitoring, rapid incident response, and continuous improvement.

**Government. Transcended.** - Operate with championship-grade reliability.
