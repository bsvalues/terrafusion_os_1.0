# High API Latency Runbook

> **Classification:** Government Operations — Performance  
> **Alert:** `VeryHighAPIResponseTime`  
> **Severity:** Critical  
> **Last Reviewed:** 2026-02-14

---

## Alert Details

**Trigger:** `histogram_quantile(0.95, http_request_duration_seconds) > 500ms` for 2 minutes

**Meaning:** API P95 latency exceeds 500ms, indicating severe performance degradation.

**SLO Impact:** SLO-003 (API Latency P99 ≤ 500ms)

---

## Immediate Actions

1. **Check current latency**
   ```bash
   # Prometheus query
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

2. **Identify slow endpoints**
   ```bash
   # Top 5 slowest endpoints
   topk(5, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m]))) by (endpoint)
   ```

3. **Check database**
   ```bash
   # Slow query log
   kubectl exec -n terrafusion deployment/postgres -- psql -U terrafusion -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
   ```

---

## Common Causes

| Cause | Symptoms | Resolution |
|-------|----------|------------|
| **Slow database queries** | DB query time >1s | Add indexes, optimize queries |
| **N+1 query problem** | High query count per request | Add eager loading (.Include()) |
| **External API timeout** | Harris PACS slow | Check external service health |
| **High CPU usage** | CPU >80% | Scale up pods |

---

## Mitigation Steps

### 1. Scale Up (immediate relief)
```bash
kubectl scale deployment/terrafusion-api -n terrafusion --replicas=5
```

### 2. Check Database Performance
```bash
# Active queries
kubectl exec -n terrafusion deployment/postgres -- psql -U terrafusion -c "SELECT pid, state, query_start, query FROM pg_stat_activity WHERE state != 'idle';"

# Connection pool usage
kubectl logs -n terrafusion -l app=terrafusion-api | grep "connection pool"
```

### 3. Review Recent Deployments
```bash
# Check if latency started after deployment
kubectl rollout history deployment/terrafusion-api -n terrafusion
```

---

## Investigation

**Performance Profiling:**
- Grafana → API Service Metrics dashboard → Response Time Distribution
- Check for endpoint-specific spikes
- Review query budget violations: `query-budget-gate.mjs`

**Resource Constraints:**
- CPU throttling: `container_cpu_cfs_throttled_seconds_total`
- Memory pressure: `container_memory_working_set_bytes`

---

## Escalation

**Severity:** Critical → Escalate if not improving in 10 minutes

**Escalation Path:**
1. On-call platform engineer
2. Database administrator (if DB-related)
3. Backend lead (if query optimization needed)

---

## Post-Incident

- [ ] File incident report
- [ ] Review slow query log
- [ ] Check if query budgets need adjustment
- [ ] Update SLO thresholds (if baseline changed)

---

*Government. Transcended. Performant.*
