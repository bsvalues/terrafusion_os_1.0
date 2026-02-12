# Failover & Recovery Procedures for public-health

**Recovery Level**: CRITICAL
**RTO Target**: 5 minutes
**RPO Target**: 0.25 hours
**Replication Strategy**: active-active
**Last Updated**: 2025-10-16 10:54:11

---

## Failover Decision Tree

### Step 1: Detect Failure

```
Health Check Fails
    |
Automatic Failure Detection
    |
Severity Assessment
    |- CRITICAL: Immediate failover
    |- HIGH: 5-minute confirmation window
    |- MEDIUM: Manual review required
```

### Step 2: Pre-Failover Validation

- Primary service confirmed unavailable
- Secondary replica is healthy
- Data consistency validated
- Network connectivity confirmed
- Authorized personnel notified

### Step 3: Execute Failover

**Timeline for automatic Failover:**

```
Minute 0:    Failover initiated
  Actions:
  - Stop writes to primary
  - Flush in-flight transactions
  - Verify secondary catchup status

Minute 1-2:  Promote secondary to primary
  Actions:
  - Promote secondary instance
  - Validate promotion success
  - Update internal state

Minute 2-3:  Update routing and DNS
  Actions:
  - Update DNS records (TTL: 60s)
  - Update load balancer configuration
  - Update application configuration
  - Notify clients (if applicable)

Minute 3-5:  Verify recovery
  Actions:
  - Verify new primary accepting connections
  - Verify data consistency
  - Run health checks
  - Monitor error rates and latency

Target: < 5 minutes total
```

---

## Backup Strategy

### Backup Frequency

**HOURLY Backups**:
- Scheduled backups: Every hour
- Before deployments: Always
- Retention: 365 days
- Compression: gzip (50-70% size reduction)
- Encryption: AES-256

### Backup Locations

1. **Local Storage**
   - Path: `/var/backups/public-health`
   - Retention: 30 days
   - Purpose: Quick recovery

2. **AWS Cloud**
   - Bucket: `terrafusion-backups-public-health`
   - Region: us-east-1
   - Retention: 365 days
   - Purpose: Geographic redundancy

3. **Azure Cloud**
   - Container: `terrafusion-backups-public-health`
   - Region: eastus
   - Retention: 365 days
   - Purpose: Geographic redundancy

### Backup Verification

- Integrity check: Weekly
- Restore test: Monthly
- Metadata validation: After every backup
- Encryption key rotation: Quarterly

---

## Replication Configuration

### Strategy: ACTIVE-ACTIVE

**Active-Active Replication**:
- Both replicas accepting reads and writes
- Conflict resolution: Latest-write-wins
- Consistency: Strong
- Failover: Transparent to applications
- Network requirement: Low latency (<50ms recommended)

### Data Centers

- **Primary**: Region 1 (us-east-1)
- **Secondary**: Region 2 (us-west-2)
- **Tertiary**: Region 3 (eu-west-1)

### Replication Status Monitoring

```bash
# Check replication lag
npm run dr:check-replication-lag

# View replication status
npm run dr:status

# Detailed replication metrics
npm run dr:replication-metrics
```

---

## Recovery Procedures

### Point-in-Time Recovery (PITR)

Available recovery points:
- Last hour: Every 5 minutes
- Last 24 hours: Every 30 minutes
- Last 365 days: Daily

### Recovery Steps

1. **Identify Recovery Point**
   ```bash
   npm run dr:list-recovery-points
   ```

2. **Stop Current Operations**
   ```bash
   npm run dr:stop-operations
   ```

3. **Restore Database**
   ```bash
   npm run dr:restore-from-backup --point RECOVERY_POINT_ID
   ```

4. **Verify Integrity**
   ```bash
   npm run dr:verify-recovery
   ```

5. **Resume Operations**
   ```bash
   npm run dr:resume-operations
   ```

**Total Recovery Time**: ~5 minutes

---

## Disaster Recovery Drills

### Monthly DR Drill Checklist

- [ ] Backup restoration test
- [ ] Failover procedure test
- [ ] Data integrity validation
- [ ] Recovery time measurement
- [ ] Team communication test
- [ ] Documentation update
- [ ] Results documentation

### Running a DR Drill

```bash
# Full DR drill
npm run dr:drill

# Backup restoration test only
npm run dr:test-restore

# Failover test only
npm run dr:test-failover
```

---

## RTO/RPO Targets

| Metric | Target | Status |
|--------|--------|--------|
| RTO (Recovery Time Objective) | 5 minutes | Monitored |
| RPO (Recovery Point Objective) | 0.25 hours | Monitored |
| Data Retention | 365 days | Active |
| Replication Strategy | active-active | Active |
| Backup Frequency | hourly | Scheduled |

---

## Disaster Recovery Decision Matrix

| Scenario | Action | RTO Target | Responsible Party |
|----------|--------|-----------|-------------------|
| Primary database down | Automatic failover | 5 min | Automated system |
| Data corruption detected | Stop writes, restore from backup | 10 min | DBA + Team lead |
| Network partition | Manual failover assessment | 15 min | Operations manager |
| Multi-region failure | Initiate full disaster recovery | 25 min | Disaster recovery team |

---

## Escalation Contacts

**On-call DBA**: [Contact info]
**Operations Manager**: [Contact info]
**Disaster Recovery Lead**: [Contact info]
**Executive Escalation**: [Contact info]

---

## Pre-Disaster Recovery Checklist

- [ ] Backup strategy configured
- [ ] Replication active and synchronized
- [ ] Failover procedures tested
- [ ] Recovery points available
- [ ] Team trained on procedures
- [ ] Communication channels established
- [ ] Monitoring enabled
- [ ] Documentation current

---

**Disaster Recovery Status**: Operational
**Last Drill**: [Date]
**Next Scheduled Drill**: [Date]
**Availability Target**: 99.99%
