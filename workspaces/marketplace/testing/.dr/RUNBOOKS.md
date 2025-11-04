# Disaster Recovery Runbooks for testing

Quick reference guides for common DR scenarios.

---

## Runbook 1: Automatic Failover Execution

**Trigger**: Primary service unavailable for >30 seconds
**Estimated Duration**: See RTO target
**Complexity**: Automated

### Automated Steps

The system automatically executes these steps:

1. Detect primary failure (health check failure)
2. Verify secondary is healthy and caught up
3. Promote secondary to primary role
4. Update internal DNS/routing
5. Notify operations team
6. Log failover event
7. Begin monitoring new primary

### Post-Failover Actions (Manual)

```bash
# 1. Verify failover status
npm run dr:status

# 2. Monitor error rates
npm run dr:monitor-errors

# 3. Plan failed primary recovery
npm run dr:plan-recovery

# 4. Document incident
npm run dr:document-incident
```

---

## Runbook 2: Backup Restoration

**Trigger**: Data corruption or accidental deletion
**Estimated Duration**: RTO target + 30 minutes
**Complexity**: Moderate

### Pre-Restoration

```bash
# 1. List available backups
npm run dr:list-backups

# 2. Validate backup integrity
npm run dr:validate-backup --backup-id id

# 3. Calculate data loss
npm run dr:calculate-data-loss --restore-point timestamp
```

### Restoration Process

```bash
# 1. Stop application
npm run dr:stop-application

# 2. Create pre-restore snapshot
npm run dr:create-safety-snapshot

# 3. Restore from backup
npm run dr:restore-from-backup --backup-id backup_id --verify

# 4. Run data validation
npm run dr:validate-restored-data

# 5. Restart application
npm run dr:start-application
```

### Post-Restoration

```bash
# Verify operations are normal
npm run dr:health-check

# Update replication
npm run dr:resync-replication

# Document restoration
npm run dr:document-restoration
```

---

## Runbook 3: Regional Failover

**Trigger**: Entire region becomes unavailable
**Estimated Duration**: RTO target * 1.5
**Complexity**: High - requires manual coordination

### Pre-Regional Failover

```bash
# 1. Verify regional failure
npm run dr:verify-regional-failure

# 2. Assess all service status
npm run dr:check-all-services

# 3. Notify stakeholders
npm run dr:notify-stakeholders --severity CRITICAL
```

### Regional Failover Execution

```bash
# 1. Activate disaster recovery plan
npm run dr:activate-regional-failover

# 2. Promote secondary region to primary
npm run dr:promote-region --target us-west-2

# 3. Update DNS globally
npm run dr:update-global-dns

# 4. Verify service availability
npm run dr:verify-services
```

### Post-Regional Failover

```bash
# 1. Monitor all metrics
npm run dr:continuous-monitoring

# 2. Document incident timeline
npm run dr:document-regional-failure

# 3. Plan recovery of affected region
npm run dr:plan-region-recovery
```

---

## Runbook 4: DR Drill Execution

**Trigger**: Scheduled monthly drill
**Estimated Duration**: 2-4 hours
**Complexity**: Medium

### Pre-Drill Preparation

```bash
# 1. Notify team
npm run dr:notify-drill

# 2. Verify test environment
npm run dr:verify-test-environment

# 3. Create pre-drill backup
npm run dr:backup-test-environment
```

### Drill Execution

```bash
# 1. Start backup test
npm run dr:test-backup-restore

# 2. Test failover procedure
npm run dr:test-failover --dry-run

# 3. Validate recovery points
npm run dr:validate-recovery-points

# 4. Measure recovery times
npm run dr:measure-rto-rpo
```

### Post-Drill

```bash
# 1. Restore test environment
npm run dr:restore-test-environment

# 2. Document drill results
npm run dr:document-drill-results

# 3. Analyze findings
npm run dr:analyze-drill

# 4. Update procedures if needed
```

---

## Runbook 5: Critical Data Loss Response

**Trigger**: Data corruption detected across replicas
**Estimated Duration**: Depends on scope
**Complexity**: Critical

### Immediate Actions (First 5 minutes)

```bash
# 1. STOP all write operations
npm run dr:stop-writes

# 2. Snapshot current state
npm run dr:emergency-snapshot

# 3. Notify disaster recovery team
npm run dr:emergency-notify
```

### Investigation Phase

```bash
# 1. Determine scope of corruption
npm run dr:analyze-corruption

# 2. Identify clean recovery point
npm run dr:find-clean-recovery-point

# 3. Estimate data loss
npm run dr:calculate-data-loss
```

### Recovery Phase

```bash
# 1. Brief stakeholders - provide status

# 2. Execute recovery
npm run dr:emergency-recovery

# 3. Verify integrity
npm run dr:verify-data-integrity

# 4. Resume operations
npm run dr:resume-operations
```

---

## Health Check Dashboard

```bash
# Real-time DR status
npm run dr:dashboard

# Health indicators
npm run dr:health-indicators

# Detailed metrics
npm run dr:detailed-metrics
```

---

## Emergency Contacts

**Primary DBA**: Contact info
**On-Call Manager**: Contact info
**Escalation**: Contact info

---

**Last Updated**: 2025-10-16
**Status**: Operational
