# Harris PACS Integration Troubleshooting Guide

## Overview

Comprehensive troubleshooting guide for Harris PACS (Property Assessment and
Collection System) integration with Terrafusion OS, covering common issues,
diagnostic procedures, and resolution strategies.

## Quick Reference

### Emergency Contacts

- **Harris PACS Support**: 1-800-HARRIS-1 (24/7)
- **Terrafusion Technical Support**: support@terrafusion.gov
- **System Administrator**: sysadmin@county.gov

### Critical Service Status

```bash
# Check all Harris PACS services
./scripts/harris-pacs-health-check.sh --full-diagnostic
```

## Common Integration Issues

### 1. Connection and Authentication Problems

#### Issue: Authentication Token Expired

**Symptoms**:

- HTTP 401 Unauthorized errors
- "Invalid or expired token" messages
- API calls failing intermittently

**Diagnostic Steps**:

```bash
# Check token expiration
curl -X GET "https://harris-pacs.county.gov/api/auth/validate" \
  -H "Authorization: Bearer $HARRIS_TOKEN" \
  -v

# Verify token format
echo $HARRIS_TOKEN | base64 -d | jq '.'
```

**Resolution**:

```typescript
// Refresh authentication token
POST /api/harris-pacs/auth/refresh
{
  "refreshToken": "your-refresh-token",
  "clientId": "terrafusion-integration"
}

// Update environment variables
export HARRIS_TOKEN="new-jwt-token"
export HARRIS_REFRESH_TOKEN="new-refresh-token"
```

#### Issue: SSL/TLS Certificate Problems

**Symptoms**:

- "SSL certificate verify failed" errors
- Connection timeouts
- Handshake failures

**Diagnostic Steps**:

```bash
# Test SSL connection
openssl s_client -connect harris-pacs.county.gov:443 -servername harris-pacs.county.gov

# Check certificate validity
curl -vI https://harris-pacs.county.gov/api/health
```

**Resolution**:

```bash
# Update certificate store
sudo apt-get update && sudo apt-get install ca-certificates

# Add Harris PACS certificate to trust store
sudo cp harris-pacs-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

### 2. Data Synchronization Issues

#### Issue: Property Data Sync Failures

**Symptoms**:

- Incomplete property records
- Missing assessment data
- Sync status showing "failed"

**Diagnostic Steps**:

```typescript
// Check sync status
GET /api/harris-pacs/sync/status/benton-county
Response: {
  "jurisdiction": "benton-county",
  "lastSyncTime": "2024-08-18T08:30:00Z",
  "status": "failed",
  "errorCount": 15,
  "recordsProcessed": 1250,
  "recordsFailed": 15
}
```

**Resolution**:

```bash
# Run incremental sync with error recovery
./scripts/harris-sync-recovery.sh \
  --jurisdiction benton-county \
  --mode incremental \
  --retry-failed-records

# Monitor sync progress
tail -f /var/log/terrafusion/harris-sync.log
```

#### Issue: Tax Record Discrepancies

**Symptoms**:

- Tax amounts don't match between systems
- Missing payment records
- Duplicate transactions

**Diagnostic Steps**:

```sql
-- Compare tax records between systems
SELECT
  tf.parcel_id,
  tf.tax_amount as terrafusion_amount,
  hp.tax_amount as harris_amount,
  ABS(tf.tax_amount - hp.tax_amount) as difference
FROM terrafusion_tax_records tf
JOIN harris_pacs_cache hp ON tf.parcel_id = hp.parcel_id
WHERE ABS(tf.tax_amount - hp.tax_amount) > 0.01;
```

**Resolution**:

```typescript
// Force data reconciliation
POST /api/harris-pacs/reconcile
{
  "jurisdiction": "benton-county",
  "dataTypes": ["tax-records", "payments"],
  "reconciliationMode": "bidirectional",
  "conflictResolution": "harris-pacs-wins"
}
```

### 3. Performance and Timeout Issues

#### Issue: API Response Timeouts

**Symptoms**:

- Requests timing out after 30+ seconds
- "Gateway timeout" errors
- Slow dashboard loading

**Diagnostic Steps**:

```bash
# Test API response times
time curl -X GET "https://harris-pacs.county.gov/api/properties?jurisdiction=benton-county&limit=100"

# Check network latency
ping -c 10 harris-pacs.county.gov
traceroute harris-pacs.county.gov
```

**Resolution**:

```typescript
// Implement request batching
const batchSize = 50; // Reduce from default 100
const timeout = 60000; // Increase timeout to 60 seconds

// Configure connection pooling
const httpAgent = new HttpAgent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 60000,
});
```

#### Issue: Memory Leaks in Integration Service

**Symptoms**:

- Increasing memory usage over time
- Service crashes with "out of memory" errors
- Performance degradation

**Diagnostic Steps**:

```bash
# Monitor memory usage
ps aux | grep terrafusion-harris-integration
top -p $(pgrep terrafusion-harris)

# Check for memory leaks
valgrind --tool=memcheck --leak-check=full ./terrafusion-harris-integration
```

**Resolution**:

```bash
# Restart integration service
systemctl restart terrafusion-harris-integration

# Configure memory limits
echo 'Environment="NODE_OPTIONS=--max-old-space-size=4096"' >> /etc/systemd/system/terrafusion-harris-integration.service
systemctl daemon-reload
systemctl restart terrafusion-harris-integration
```

## Advanced Troubleshooting

### Database Connection Issues

#### Issue: Harris PACS Database Connectivity

**Symptoms**:

- "Connection refused" errors
- Database query timeouts
- Stale connection errors

**Diagnostic Steps**:

```bash
# Test database connectivity
psql -h harris-db.county.gov -U harris_user -d harris_pacs -c "SELECT version();"

# Check connection pool status
curl -X GET "http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/harris-pacs/connection-pool/status"
```

**Resolution**:

```javascript
// Configure connection pool settings
const poolConfig = {
  host: 'harris-db.county.gov',
  port: 5432,
  database: 'harris_pacs',
  user: 'harris_user',
  password: process.env.HARRIS_DB_PASSWORD,
  max: 20, // Maximum connections
  min: 5, // Minimum connections
  idle: 10000, // Idle timeout
  acquire: 60000, // Acquire timeout
  evict: 1000, // Eviction interval
};
```

### Message Queue Problems

#### Issue: Event Processing Backlog

**Symptoms**:

- Delayed property updates
- Growing message queue size
- Processing lag indicators

**Diagnostic Steps**:

```bash
# Check message queue status
rabbitmqctl list_queues name messages consumers
redis-cli llen harris_pacs_events

# Monitor processing rates
curl -X GET "http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/harris-pacs/queue/metrics"
```

**Resolution**:

```bash
# Scale up message processors
kubectl scale deployment harris-pacs-processor --replicas=5

# Clear stuck messages
redis-cli del harris_pacs_events:failed
rabbitmqctl purge_queue harris_pacs_updates
```

## Monitoring and Alerting

### Health Check Endpoints

```typescript
// System health check
GET /api/harris-pacs/health
Response: {
  "status": "healthy",
  "components": {
    "database": "healthy",
    "api": "healthy",
    "messageQueue": "healthy",
    "authentication": "healthy"
  },
  "lastCheck": "2024-08-18T10:15:00Z"
}
```

### Performance Metrics

```bash
# Key metrics to monitor
curl -X GET "http://localhost:\${{TF_ADMIN_PORT:-8080}}/metrics" | grep harris_pacs

# Critical thresholds
- API Response Time: < 2 seconds
- Sync Success Rate: > 99%
- Error Rate: < 0.1%
- Queue Depth: < 1000 messages
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: harris-pacs-integration
    rules:
      - alert: HarrisPACSAPIDown
        expr: up{job="harris-pacs-api"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'Harris PACS API is down'

      - alert: HarrisPACSSyncFailure
        expr: harris_pacs_sync_success_rate < 0.95
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'Harris PACS sync success rate below 95%'
```

## Recovery Procedures

### Complete System Recovery

```bash
#!/bin/bash
# harris-pacs-recovery.sh

echo "Starting Harris PACS integration recovery..."

# 1. Stop all services
systemctl stop terrafusion-harris-integration
systemctl stop terrafusion-api

# 2. Clear caches
redis-cli flushdb
rm -rf /tmp/harris-pacs-cache/*

# 3. Reset database connections
psql -h harris-db.county.gov -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='harris_pacs';"

# 4. Restart services
systemctl start terrafusion-harris-integration
systemctl start terrafusion-api

# 5. Verify recovery
./scripts/harris-pacs-health-check.sh --full-diagnostic

echo "Recovery complete. Check logs for any remaining issues."
```

### Data Recovery from Backup

```bash
# Restore from Harris PACS backup
pg_restore -h harris-db.county.gov -U harris_user -d harris_pacs /backups/harris_pacs_backup.dump

# Resync Terrafusion data
curl -X POST "http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/harris-pacs/sync/full" \
  -H "Content-Type: application/json" \
  -d '{"jurisdiction": "benton-county", "force": true}'
```

## Configuration Management

### Environment Variables

```bash
# Required Harris PACS environment variables
export HARRIS_PACS_API_URL="https://harris-pacs.county.gov/api"
export HARRIS_PACS_CLIENT_ID="terrafusion-integration"
export HARRIS_PACS_CLIENT_SECRET="your-client-secret"
export HARRIS_PACS_DB_HOST="harris-db.county.gov"
export HARRIS_PACS_DB_NAME="harris_pacs"
export HARRIS_PACS_DB_USER="harris_user"
export HARRIS_PACS_DB_PASSWORD="your-db-password"
```

### Configuration Files

```json
// harris-pacs-config.json
{
  "api": {
    "baseUrl": "https://harris-pacs.county.gov/api",
    "timeout": 30000,
    "retryAttempts": 3,
    "retryDelay": 1000
  },
  "sync": {
    "batchSize": 100,
    "intervalMinutes": 15,
    "maxRetries": 5
  },
  "cache": {
    "ttlMinutes": 60,
    "maxSize": "1GB"
  }
}
```

## Preventive Maintenance

### Daily Tasks

- [ ] Check sync status for all jurisdictions
- [ ] Review error logs for anomalies
- [ ] Verify API response times
- [ ] Monitor queue depths

### Weekly Tasks

- [ ] Run full system health check
- [ ] Update Harris PACS certificates if needed
- [ ] Review performance metrics
- [ ] Test backup and recovery procedures

### Monthly Tasks

- [ ] Coordinate with Harris PACS team on updates
- [ ] Review and update integration documentation
- [ ] Conduct disaster recovery testing
- [ ] Analyze performance trends

## Escalation Procedures

### Level 1: Automated Recovery

- Automatic retry mechanisms
- Circuit breaker patterns
- Failover to cached data

### Level 2: Operations Team

- Manual service restarts
- Configuration adjustments
- Log analysis and diagnosis

### Level 3: Development Team

- Code-level debugging
- Integration architecture review
- Performance optimization

### Level 4: Vendor Support

- Harris PACS technical support
- Joint troubleshooting sessions
- System architecture consultation

## Related Documentation

- [Property Assessment Workflow](../workflows/property-assessment-workflow.md)
- [Tax Collection Workflow](../workflows/tax-collection-workflow.md)
- [System Architecture Guide](../best-practices/system-architecture.md)

## Revision History

| Version | Date       | Author           | Changes                       |
| ------- | ---------- | ---------------- | ----------------------------- |
| 1.0     | 2024-08-18 | Terrafusion Team | Initial troubleshooting guide |

---

_For immediate assistance with Harris PACS integration issues, contact the
Terrafusion support team at support@terrafusion.gov_
