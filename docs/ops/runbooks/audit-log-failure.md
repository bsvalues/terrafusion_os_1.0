# Audit Log Ingestion Failure Runbook

> **Classification:** Government Operations — FISMA-HIGH CRITICAL  
> **Alert:** `AuditLogIngestionFailure`  
> **Severity:** Critical  
> **Last Reviewed:** 2026-02-14

---

## Alert Details

**Trigger:** `rate(audit_log_errors_total[2m]) > 0`

**Meaning:** Audit log pipeline is failing to ingest events. **Zero loss tolerance** for audit logs under FISMA-HIGH.

**SLO Impact:** SLO-009 (Audit Pipeline Ingestion Success = 100%)

**Compliance:** NIST 800-53 AU-4, AU-5, AU-9 (Audit storage, response to failures, protection)

---

## Immediate Actions

**⚠️ CRITICAL:** Any audit log failure is a **compliance incident** under FISMA-HIGH.

1. **Verify audit service health**
   ```bash
   # Check audit service pods
   kubectl get pods -n terrafusion -l app=terrafusion-audit
   
   # Check recent logs
   kubectl logs -n terrafusion -l app=terrafusion-audit --tail=50
   ```

2. **Check audit database**
   ```bash
   # Verify audit tables accessible
   kubectl exec -n terrafusion deployment/postgres -- psql -U terrafusion_audit -c "SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '5 minutes';"
   ```

3. **Check storage capacity**
   ```bash
   # Audit log volume usage
   kubectl exec -n terrafusion deployment/postgres -- df -h /var/lib/postgresql/data
   ```

---

## Common Causes

| Cause | Symptoms | Resolution |
|-------|----------|------------|
| **Storage full** | Write errors, disk full | Expand PVC or archive old logs |
| **Database connection failure** | Connection timeout | Check DB health + connection pool |
| **Permission denied** | Write permission errors | Verify `terrafusion_audit` user grants |
| **Schema mismatch** | Column doesn't exist | Check migration status |

---

## Mitigation Steps

### 1. Verify Audit Service (Highest Priority)
```bash
# Restart audit service
kubectl rollout restart deployment/terrafusion-audit -n terrafusion

# Verify writes working
kubectl logs -n terrafusion -l app=terrafusion-audit --follow | grep "AuditEvent"
```

### 2. Check Database Grants
```bash
# Verify audit user permissions
kubectl exec -n terrafusion deployment/postgres -- psql -U postgres -c "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='audit_logs';"

# Should have INSERT, SELECT on audit_logs
```

### 3. Check Storage
```bash
# Audit log volume size
kubectl get pvc -n terrafusion audit-logs-pvc

# If full, expand:
kubectl patch pvc audit-logs-pvc -n terrafusion -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
```

---

## Investigation

**Audit Event Flow:**
1. Application emits audit event via `ISecurityAuditService`
2. Event queued in Redis (buffer)
3. Audit service consumes from queue
4. Event written to PostgreSQL `audit_logs` table
5. Event replicated to cold storage (S3)

**Check each step:**
```bash
# Redis queue depth
kubectl exec -n terrafusion deployment/redis -- redis-cli LLEN audit_events_queue

# Recent audit writes
kubectl exec -n terrafusion deployment/postgres -- psql -U terrafusion_audit -c "SELECT event_type, COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY event_type;"
```

---

## Escalation

**Severity:** Critical → **Immediate escalation** (FISMA compliance violation)

**Escalation Path:**
1. On-call security engineer (PagerDuty) — **immediately**
2. Compliance team — within 15 minutes
3. Platform lead + County coordinator — within 30 minutes

**Regulatory Requirement:**  
AU-5 (Response to Audit Processing Failures): System must alert security officer and continue operations.

---

## Post-Incident

**MANDATORY:**
- [ ] File compliance incident report (FISMA-HIGH requirement)
- [ ] Calculate data loss window (if any)
- [ ] Review audit retention policy
- [ ] Schedule audit of audit system integrity
- [ ] Update audit capacity planning

**Evidence Collection:**
- Exact time of failure start/end
- Number of events lost (if any)
- Root cause analysis
- Corrective actions taken

---

*Government. Transcended. Audited.*
