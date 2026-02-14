# TerraFusion API Down Runbook

> **Classification:** Government Operations — FISMA-HIGH  
> **Alert:** `TerraFusionAPIDown`  
> **Severity:** Critical  
> **Last Reviewed:** 2026-02-14

---

## Alert Details

**Trigger:** `up{job="terrafusion-api"} == 0` for 1 minute

**Meaning:** The TerraFusion API (Kernel) service is completely unavailable.

**SLO Impact:** SLO-001 (API Availability ≥ 99.9%)

---

## Immediate Actions

1. **Verify scope**
   ```bash
   # Check pod status
   kubectl get pods -n terrafusion -l app=terrafusion-api
   
   # Check recent pod events
   kubectl describe pod -n terrafusion -l app=terrafusion-api
   ```

2. **Check logs**
   ```bash
   # View recent logs
   kubectl logs -n terrafusion -l app=terrafusion-api --tail=100
   
   # Check for crashloop
   kubectl get pods -n terrafusion -l app=terrafusion-api -w
   ```

3. **Quick health check**
   ```bash
   # Internal health endpoint
   kubectl exec -n terrafusion deployment/terrafusion-api -- curl localhost:5000/health
   ```

---

## Common Causes

| Cause | Symptoms | Resolution |
|-------|----------|------------|
| **Pod OOMKilled** | `STATUS: OOMKilled` in describe | Increase memory limits + restart |
| **Database unreachable** | Logs show connection errors | Check PostgreSQL pod health |
| **Config error** | CrashLoopBackOff | Check ConfigMap/Secret updates |
| **Image pull failure** | ImagePullBackOff | Verify image exists in registry |

---

## Mitigation Steps

### 1. Restart Pods (if crashloop)
```bash
kubectl rollout restart deployment/terrafusion-api -n terrafusion
kubectl rollout status deployment/terrafusion-api -n terrafusion
```

### 2. Scale Up (if resource exhaustion)
```bash
# Temporary scale up
kubectl scale deployment/terrafusion-api -n terrafusion --replicas=5
```

### 3. Rollback (if recent deployment)
```bash
# Check rollout history
kubectl rollout history deployment/terrafusion-api -n terrafusion

# Rollback to previous
kubectl rollout undo deployment/terrafusion-api -n terrafusion
```

---

## Investigation

**Check metrics:**
- CPU/memory usage: Grafana → TerraFusion API dashboard
- Request rate: Prometheus → `rate(http_requests_total[5m])`
- Error logs: Grafana Loki → namespace=terrafusion

**Correlation:**
- Did deployment just occur? → Check ArgoCD sync history
- Database issues? → Check PostgreSQL alerts
- Network issues? → Check Ingress/Gateway

---

## Escalation

**Severity:** Critical → Escalate immediately if not resolved in 5 minutes

**Escalation Path:**
1. On-call platform engineer (PagerDuty)
2. Platform lead (if unresolved in 15 min)
3. County coordinator (if affecting citizen services)

---

## Post-Incident

- [ ] File incident report
- [ ] Update error budget tracking
- [ ] Schedule post-mortem (if > 5 min outage)
- [ ] Review deployment process (if caused by deploy)

---

*Government. Transcended. Responsive.*
