# High API Error Rate Runbook

> **Classification:** Government Operations — FISMA-HIGH  
> **Alert:** `VeryHighAPIErrorRate`  
> **Severity:** Critical  
> **Last Reviewed:** 2026-02-14

---

## Alert Details

**Trigger:** `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 5%` for 2 minutes

**Meaning:** 5xx error rate exceeds 5%, indicating service instability or dependency failures.

**SLO Impact:** SLO-004 (Error Rate ≤ 1%)

---

## Immediate Actions

1. **Check error rate by endpoint**
   ```bash
   # Top error endpoints
   topk(5, rate(http_requests_total{status=~"5.."}[5m])) by (endpoint, status)
   ```

2. **Check recent logs**
   ```bash
   # Last 100 errors
   kubectl logs -n terrafusion -l app=terrafusion-api --tail=100 | grep "ERROR\|FATAL"
   ```

3. **Check downstream services**
   ```bash
   # Database connectivity
   kubectl exec -n terrafusion deployment/terrafusion-api -- curl localhost:5000/health
   ```

---

## Common Causes

| Cause | Symptoms | Resolution |
|-------|----------|------------|
| **Database connection exhaustion** | SqlException: timeout | Scale DB connections or pods |
| **Downstream service failure** | Gateway/Consciousness down | Check dependent service health |
| **Uncaught exception** | 500 errors with stack traces | Deploy hotfix |
| **Configuration error** | Missing env vars | Validate ConfigMap/Secret |

---

## Mitigation Steps

### 1. Identify Error Pattern
```bash
# Group by status code
sum(rate(http_requests_total{status=~"5.."}[5m])) by (status)

# Most common error
kubectl logs -n terrafusion -l app=terrafusion-api | grep "ERROR" | sort | uniq -c | sort -rn | head -10
```

### 2. Check Dependencies
```bash
# Database health
kubectl exec -n terrafusion deployment/postgres -- pg_isready

# Redis health
kubectl exec -n terrafusion deployment/redis -- redis-cli ping

# Downstream services
curl http://terrafusion-gateway.terrafusion.svc:3002/health
curl http://terrafusion-consciousness.terrafusion.svc:3004/health
```

### 3. Rollback (if recent deployment)
```bash
# Check deployment time vs. error spike
kubectl rollout history deployment/terrafusion-api -n terrafusion

# Rollback if errors started after deploy
kubectl rollout undo deployment/terrafusion-api -n terrafusion
```

---

## Investigation

**Error Classification:**
- **500 Internal Server Error:** Uncaught exception → check logs for stack trace
- **502 Bad Gateway:** Downstream service unreachable → check service mesh
- **503 Service Unavailable:** Circuit breaker triggered or overload → scale up
- **504 Gateway Timeout:** Slow downstream → check latency alerts

**Root Cause Analysis:**
- Correlate error spike with deployments, traffic spikes, or infrastructure changes
- Check Grafana Loki for structured error logs
- Review recent code changes in error-prone endpoints

---

## Escalation

**Severity:** Critical → Escalate if not resolved in 5 minutes

**Escalation Path:**
1. On-call platform engineer (PagerDuty)
2. Backend lead (if application error)
3. Platform lead (if infrastructure issue)

---

## Post-Incident

- [ ] File incident report with error distribution
- [ ] Review error handling in affected endpoints
- [ ] Check if circuit breakers should be added
- [ ] Update error budget tracking

---

*Government. Transcended. Resilient.*
