# TerraFusion Consciousness Down Runbook

> **Classification:** Government Operations — AI Systems  
> **Alert:** `TerraFusionConsciousnessDown`  
> **Severity:** Critical  
> **Last Reviewed:** 2026-02-14

---

## Alert Details

**Trigger:** `up{job="terrafusion-consciousness"} == 0` for 1 minute

**Meaning:** The AI Swarm orchestration service (1,008 agents) is unavailable.

**SLO Impact:** SLO-007 (Consciousness Availability ≥ 99.5%)

---

## Immediate Actions

1. **Verify agent count**
   ```bash
   # Check active agents
   curl http://terrafusion-consciousness.terrafusion.svc:3004/api/agents/status
   
   # Check pod status
   kubectl get pods -n terrafusion -l app=terrafusion-consciousness
   ```

2. **Check SignalR hub health**
   ```bash
   # Hub connectivity
   curl http://terrafusion-consciousness.terrafusion.svc:3004/hubs/system/negotiate
   ```

3. **Check agent metrics**
   ```bash
   # Prometheus query
   terrafusion_ai_agent_count{namespace="terrafusion"}
   ```

---

## Common Causes

| Cause | Symptoms | Resolution |
|-------|----------|------------|
| **Agent initialization timeout** | Startup takes >10 min | Increase readiness probe timeout |
| **SignalR hub crash** | Hub connection errors | Restart + check message queue |
| **Redis unavailable** | Cache connection errors | Check Redis pod health |
| **High memory usage** | OOMKilled | Scale up or reduce agent count |

---

## Mitigation Steps

### 1. Restart Service
```bash
kubectl rollout restart deployment/terrafusion-consciousness -n terrafusion
kubectl rollout status deployment/terrafusion-consciousness -n terrafusion --timeout=600s
```

**Note:** Consciousness takes ~8 min to pre-warm 50K agents.

### 2. Check Dependencies
```bash
# Redis health
kubectl exec -n terrafusion deployment/redis -- redis-cli ping

# Database connectivity
kubectl exec -n terrafusion deployment/terrafusion-consciousness -- curl localhost:3004/health
```

### 3. Rollback (if recent deployment)
```bash
kubectl rollout undo deployment/terrafusion-consciousness -n terrafusion
```

---

## Investigation

**Check metrics:**
- Agent count: `terrafusion_ai_agent_count` (target: 50,000)
- Quantum factor: `terrafusion_ai_quantum_factor` (target: 949)
- Memory usage: Grafana → Consciousness dashboard

**Known Issues:**
- Agent initialization can take 8-10 min on cold start
- High traffic can cause temporary agent unavailability during scale-up

---

## Escalation

**Severity:** Critical → Escalate if not resolved in 10 minutes (longer than API due to agent warm-up time)

**Escalation Path:**
1. On-call AI/Platform engineer (PagerDuty)
2. AI team lead (if agent-specific issues)
3. Platform lead (if infrastructure issues)

---

## Post-Incident

- [ ] File incident report
- [ ] Review agent initialization time (optimize if >10 min)
- [ ] Check if agent count was sufficient for load
- [ ] Update quantum factor tuning (if degraded)

---

*Government. Transcended. Orchestrated.*
