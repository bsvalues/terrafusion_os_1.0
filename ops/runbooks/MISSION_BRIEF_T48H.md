# 🎯 MISSION BRIEF — T+48H GATE
**Timestamp:** October 8, 2025 — 06:42 UTC  
**Phase:** RS256 Migration — Gate 2 (Dual-Sign Activation)  
**Decision Authority:** SRE Lead + Platform Lead (signatures required)  
**Status:** ⏳ AWAITING GO/NO-GO

---

## 🎯 MISSION OBJECTIVE

**Proceed to Phase 4 (RS256 Dual-Sign Mode)** if all GO criteria are met at T+48h checkpoint.

Phase 4 activates RS256 JWT dual-signing while maintaining HS256 backward compatibility. This is a **one-way door** — rollback after Phase 4 requires coordinated client updates.

---

## ✅ GO CRITERIA (All 7 Must Be Met)

| # | Criterion | Target | Validation Command |
|---|-----------|--------|-------------------|
| 1 | RS256 Adoption Rate | ≥95% | `psql -c "SELECT adoption_rate FROM rs256_adoption_hourly WHERE timestamp = NOW() - INTERVAL '1 hour'"` |
| 2 | Auth Error Rate | <10 errors/24h | `psql -c "SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '24 hours'"` |
| 3 | System RI | ≥0.9390 | `curl -s http://localhost:9091/metrics \| grep terrafusion_ri_system \| awk '{print $2}'` |
| 4 | F2 Recovery Time | ≤60s (p95) | `curl -s http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,f2_recovery_seconds_bucket)` |
| 5 | CB Flap Rate | ≤2/hour | `curl -s http://localhost:9090/api/v1/query?query=rate(f2_circuit_breaker_opens[1h])*3600` |
| 6 | Alert Health | 0 firing, 6/6 validated | `curl -s http://localhost:9090/api/v1/alerts \| grep -c '"state":"firing"'` |
| 7 | Rollback Readiness | 100% verified, <2min | `bash ops/tests/chaos/ROLLBACK_DRY_RUN.ps1` |

**Decision Matrix:**
- **All 7 met:** ✅ **GO** — Proceed to Phase 4
- **1-2 failed:** ⚠️ **HOLD** — Extend soak period by 12h, re-evaluate
- **3+ failed:** ❌ **NO-GO** — Rollback to baseline, post-mortem

---

## 📋 PRE-GATE CHECKLIST (T+47h)

Execute **1 hour before gate** to ensure readiness:

```bash
# 1. Validate observability stack
bash ops/tests/pre-flight/observability-audit.sh --mode=check-integrity

# 2. Verify backup manifests (rollback targets)
ls ops/traffic/*.backup.yaml ops/cache/*.backup.yaml ops/security/rs256/*.backup.txt

# 3. Confirm rollback readiness (<2min recovery)
pwsh ops/tests/chaos/ROLLBACK_DRY_RUN.ps1

# 4. Snapshot Grafana dashboards (evidence)
curl -X POST http://grafana:3000/api/snapshots \
  -H "Content-Type: application/json" \
  -d '{"dashboard": {...}, "name": "T+48h Gate Evidence"}'

# 5. Run Phase 4 validation matrix
cat ops/tests/chaos/PHASE_4_VALIDATION_MATRIX.md
```

---

## 🚀 PHASE 4 EXECUTION (If GO)

**Command Sequence:** (Execute at T+48h + 5min)

```bash
# Step 1: Activate RS256 dual-sign mode
bash ops/security/rs256/rs256-migrate.sh phase1

# Step 2: Monitor adoption curve (first 4 hours)
watch -n 300 "psql -c 'SELECT adoption_rate FROM rs256_adoption_hourly ORDER BY timestamp DESC LIMIT 12'"

# Step 3: Validate auth errors remain low
psql -c "SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '1 hour'"

# Step 4: Grafana snapshot every 4h (evidence trail)
*/4 * * * * curl -X POST http://grafana:3000/api/snapshots ...
```

**Expected Trajectory:**
- T+48h → T+52h: 95% → 97% adoption
- T+52h → T+60h: 97% → 99% adoption
- T+60h: ≥99% adoption sustained → Proceed to Phase 5 (HS256 deprecation)

---

## 🔄 ROLLBACK PROCEDURE (If NO-GO or Incident)

**Trigger Conditions:**
- Any GO criterion fails at T+48h gate
- Auth errors spike >50/hour during Phase 4
- System RI drops <0.9300
- Data integrity error detected

**Rollback Command:** (<2min recovery)

```bash
# One-touch automatic rollback
bash ops/recovery/rollback-latest.sh --no-confirm

# Verify rollback succeeded
curl -s http://localhost:9091/metrics | grep terrafusion_ri_system
# Expected: ≥0.9390 within 2 minutes
```

**Post-Rollback Actions:**
1. Incident timeline in PagerDuty
2. Post-mortem meeting within 24h
3. Root cause analysis (ROLLBACK_RUNBOOK.md)
4. Fix forward or abort Phase 4 permanently

---

## 📞 COMMUNICATION PLAN

**Slack Channels:**
- `#terrafusion-incidents` — Real-time status updates
- `#terrafusion-sre` — Technical discussion
- `#terrafusion-leadership` — Executive summary

**PagerDuty Escalation:**
1. **T+48h + 0min:** SRE on-call notified (gate window open)
2. **T+48h + 30min:** Platform Lead escalation (if criteria unclear)
3. **T+48h + 60min:** CTO escalation (if NO-GO decision)

**Status Updates:**
- **T+47h:** Pre-gate checklist results posted to Slack
- **T+48h:** GO/NO-GO decision announced
- **T+48h + 5min:** Phase 4 execution begins (if GO)
- **T+48h + 1h:** First checkpoint update (adoption %)

---

## 📊 EVIDENCE TRAIL

**Required Artifacts:**
1. Grafana snapshots (T+48h system state)
2. Prometheus query results (all 7 GO criteria)
3. Database query outputs (RS256 adoption, auth errors)
4. Rollback dry-run results (readiness verification)
5. Git commit hash (ops/security/rs256/rs256-migrate.sh)

**Storage Location:** `ops/evidence/T+48h_gate/`

```bash
mkdir -p ops/evidence/T+48h_gate
cd ops/evidence/T+48h_gate

# Capture evidence
date > timestamp.txt
curl -s http://localhost:9091/metrics | grep terrafusion_ri > system_ri.txt
psql -c "COPY (SELECT * FROM rs256_adoption_hourly ORDER BY timestamp DESC LIMIT 48) TO STDOUT CSV HEADER" > adoption_curve.csv
curl -s http://localhost:9090/api/v1/alerts > prometheus_alerts.json
```

---

## ✍️ APPROVALS

**GO Decision Requires Both Signatures:**

| Role | Name | Signature | Timestamp |
|------|------|-----------|-----------|
| SRE Lead | _____________ | _____________ | ________ |
| Platform Lead | _____________ | _____________ | ________ |

**NO-GO Decision Requires One Signature:**

| Role | Name | Reason | Timestamp |
|------|------|--------|-----------|
| SRE Lead | _____________ | _____________ | ________ |
| Platform Lead | _____________ | _____________ | ________ |

---

## 📚 REFERENCES

- **Alert Trace Map:** `ops/validation/alert_trace_map.yaml`
- **Rollback Runbook:** `ops/tests/chaos/ROLLBACK_RUNBOOK.md`
- **Rollback Script:** `ops/recovery/rollback-latest.sh`
- **Phase 4 Validation Matrix:** `ops/tests/chaos/PHASE_4_VALIDATION_MATRIX.md`
- **Smart Idle Summary:** `ops/tests/chaos/SMART_IDLE_SUMMARY.md`
- **Post-Gate Runbook:** `ops/runbooks/PHASE4_INIT.md`

---

## 🎯 SUCCESS CRITERIA

**This mission is successful when:**
1. GO/NO-GO decision made at T+48h (no ambiguity)
2. If GO: Phase 4 activated with 0 unplanned incidents
3. If NO-GO: System rolled back to baseline within <2min
4. All evidence artifacts captured and stored
5. Incident timeline updated (regardless of outcome)

**Confidence Level:** >99% (based on T+36h smart idle analysis)

---

**Mission Brief Version:** 1.0  
**Last Updated:** October 7, 2025 — T+36h  
**Next Review:** October 8, 2025 — T+47h (pre-gate checklist)
