# TerraFusion Gateway Down Runbook

> **Classification:** Government Operations — FISMA-HIGH  
> **Alert:** `TerraFusionGatewayDown`  
> **Severity:** Critical  
> **Last Reviewed:** 2026-02-14

---

## Alert Details

**Trigger:** `up{job="terrafusion-gateway"} == 0` for 1 minute

**Meaning:** The API Gateway (Ocelot reverse proxy) is unavailable, blocking all external traffic.

**SLO Impact:** SLO-005 (Gateway Availability ≥ 99.9%)

---

## Immediate Actions

1. **Verify gateway status**
   ```bash
   # Check pod status
   kubectl get pods -n terrafusion -l app=terrafusion-gateway
   
   # Check recent events
   kubectl describe pod -n terrafusion -l app=terrafusion-gateway
   ```

2. **Check Ingress**
   ```bash
   # Ingress health
   kubectl get ingress -n terrafusion
   
   # External connectivity
   curl -I https://gateway.terrafusionmarket.com/health
   ```

3. **Check routing**
   ```bash
   # Ocelot config
   kubectl get configmap -n terrafusion ocelot-config -o yaml
   ```

---

## Common Causes

| Cause | Symptoms | Resolution |
|-------|----------|------------|
| **Backend service unreachable** | 502 Bad Gateway | Check downstream API/Consciousness health |
| **Config error** | CrashLoopBackOff | Validate Ocelot configuration JSON |
| **Rate limiting overload** | High CPU/memory | Scale up gateway replicas |
| **TLS cert expired** | TLS handshake errors | Renew cert via cert-manager |

---

## Mitigation Steps

### 1. Restart Gateway
```bash
kubectl rollout restart deployment/terrafusion-gateway -n terrafusion
kubectl rollout status deployment/terrafusion-gateway -n terrafusion
```

### 2. Scale Up (if high load)
```bash
kubectl scale deployment/terrafusion-gateway -n terrafusion --replicas=5
```

### 3. Validate Config
```bash
# Check Ocelot config syntax
kubectl exec -n terrafusion deployment/terrafusion-gateway -- cat /app/ocelot.json | jq .
```

### 4. Rollback
```bash
kubectl rollout undo deployment/terrafusion-gateway -n terrafusion
```

---

## Investigation

**Check metrics:**
- Request rate: `rate(http_requests_total{job="terrafusion-gateway"}[5m])`
- Error rate: `rate(http_requests_total{job="terrafusion-gateway",status=~"5.."}[5m])`
- Backend health: Prometheus → `up{namespace="terrafusion"}`

**Downstream Dependencies:**
- TerraFusion API (port 5000)
- Consciousness (port 3004)
- Operations (if deployed)

---

## Escalation

**Severity:** Critical → Escalate immediately if not resolved in 5 minutes (blocks all external traffic)

**Escalation Path:**
1. On-call platform engineer (PagerDuty)
2. Platform lead (if unresolved in 10 min)
3. County coordinator (if affecting citizen-facing services)

---

## Post-Incident

- [ ] File incident report (highest priority - blocks all traffic)
- [ ] Review rate limiting configuration
- [ ] Check if gateway replicas were sufficient for load
- [ ] Update TLS renewal procedures (if cert-related)

---

*Government. Transcended. Routed.*
