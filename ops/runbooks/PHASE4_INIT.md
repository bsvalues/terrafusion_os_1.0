# Phase 4 Initialization Runbook

**Purpose:** Frictionless hand-off from T+48h gate to Phase 4 execution  
**Timestamp:** October 8, 2025 — 06:42 UTC → T+96h  
**Owner:** SRE Team  
**Prerequisite:** T+48h gate passed (all 7 GO criteria met)

---

## 📋 EXECUTIVE SUMMARY

This runbook provides the **exact command sequence** to execute Phase 4 (RS256 Dual-Sign Mode) after passing the T+48h gate. No decision-making required — if you're reading this, the gate passed. Just execute.

**Philosophy:** "When the clock hits T+48h, no scramble for next steps."

---

## 🎯 PHASE 4 OVERVIEW

**What is Phase 4?**
- Activate RS256 JWT **dual-signing** (sign with both RS256 + HS256)
- Clients verify with RS256 keys (HS256 as fallback)
- 48-hour soak period to reach ≥99% RS256 adoption
- Prepares for Phase 5 (HS256 deprecation)

**Why Dual-Sign?**
- Zero-downtime migration from HS256 → RS256
- Backward compatibility for slow-adopting clients
- Gradual rollout reduces risk

**Duration:** 48 hours (T+48h → T+96h)

**Risk Level:** 🟡 MEDIUM (one-way door, but rollback still possible within 4h)

---

## ⚡ QUICK START (TL;DR)

```bash
# 1. Activate Phase 4
cd /path/to/terrafusion_os_1.0
bash ops/security/rs256/rs256-migrate.sh phase1

# 2. Monitor adoption (every 4 hours)
watch -n 300 "psql terrafusion_db -c 'SELECT adoption_rate FROM rs256_adoption_hourly ORDER BY timestamp DESC LIMIT 1'"

# 3. Take Grafana snapshots (evidence trail)
curl -X POST http://grafana:3000/api/snapshots -H "Content-Type: application/json" -d @ops/evidence/T+48h_gate/grafana_snapshot_template.json

# Done. Phase 5 transition at T+96h if adoption ≥99%.
```

---

## 📖 DETAILED EXECUTION STEPS

### Step 1: Pre-Execution Validation (T+48h + 0min)

**Purpose:** Confirm gate passed and system is ready.

```bash
# Verify all 7 GO criteria still met
echo "=== GO CRITERIA VALIDATION ==="

# 1. RS256 adoption ≥95%
adoption=$(psql terrafusion_db -t -c "SELECT adoption_rate FROM rs256_adoption_hourly WHERE timestamp = (SELECT MAX(timestamp) FROM rs256_adoption_hourly)" | xargs)
echo "RS256 Adoption: $adoption% (target: ≥95%)"
[[ $(echo "$adoption >= 95" | bc) -eq 1 ]] && echo "✅ PASS" || echo "❌ FAIL"

# 2. Auth errors <10/24h
auth_errors=$(psql terrafusion_db -t -c "SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '24 hours'" | xargs)
echo "Auth Errors (24h): $auth_errors (target: <10)"
[[ $auth_errors -lt 10 ]] && echo "✅ PASS" || echo "❌ FAIL"

# 3. System RI ≥0.9390
system_ri=$(curl -s http://localhost:9091/metrics | grep -m1 'terrafusion_ri_system' | awk '{print $2}')
echo "System RI: $system_ri (target: ≥0.9390)"
[[ $(echo "$system_ri >= 0.9390" | bc) -eq 1 ]] && echo "✅ PASS" || echo "❌ FAIL"

# 4. F2 recovery time ≤60s
f2_recovery=$(curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,f2_recovery_seconds_bucket)" | jq -r '.data.result[0].value[1]')
echo "F2 Recovery (p95): ${f2_recovery}s (target: ≤60s)"
[[ $(echo "$f2_recovery <= 60" | bc) -eq 1 ]] && echo "✅ PASS" || echo "❌ FAIL"

# 5. CB flap rate ≤2/hour
cb_flap=$(curl -s "http://localhost:9090/api/v1/query?query=rate(f2_circuit_breaker_opens[1h])*3600" | jq -r '.data.result[0].value[1]')
echo "CB Flap Rate: ${cb_flap}/hour (target: ≤2/hour)"
[[ $(echo "$cb_flap <= 2" | bc) -eq 1 ]] && echo "✅ PASS" || echo "❌ FAIL"

# 6. Alert health: 0 firing, 6/6 validated
firing_alerts=$(curl -s http://localhost:9090/api/v1/alerts | grep -c '"state":"firing"' || echo 0)
echo "Firing Alerts: $firing_alerts (target: 0)"
[[ $firing_alerts -eq 0 ]] && echo "✅ PASS" || echo "❌ FAIL"

# 7. Rollback readiness: 100%
pwsh ops/tests/chaos/ROLLBACK_DRY_RUN.ps1 | grep -q "12/12 passed" && echo "✅ Rollback Ready" || echo "❌ Rollback NOT Ready"

echo ""
echo "If all ✅ PASS, proceed to Step 2."
echo "If any ❌ FAIL, ABORT and escalate to SRE Lead."
```

---

### Step 2: Activate RS256 Dual-Sign Mode (T+48h + 5min)

**Purpose:** Enable RS256 signing while maintaining HS256 backward compatibility.

```bash
# Execute migration script (Phase 1 = Dual-Sign)
cd /path/to/terrafusion_os_1.0
bash ops/security/rs256/rs256-migrate.sh phase1

# Expected output:
# ✅ RS256 keys loaded
# ✅ Dual-sign mode activated
# ✅ JWKS endpoint updated
# ✅ Auth service restarted (0 downtime)
# ✅ Adoption tracking enabled

# Verify activation
psql terrafusion_db -c "SELECT * FROM rs256_config WHERE active = true"
# Expected: dual_sign_enabled = true, hs256_enabled = true, rs256_enabled = true

# Check auth service logs
kubectl logs -l app=auth-service --tail=20 | grep -i "rs256"
# Expected: "RS256 dual-sign mode activated"
```

**Duration:** ~2 minutes  
**Rollback Window:** 4 hours (after 4h, client adoption makes rollback disruptive)

---

### Step 3: Monitor Adoption Curve (T+48h → T+96h)

**Purpose:** Track RS256 adoption over 48 hours, ensuring smooth transition.

**Checkpoint Schedule:**

| Time | Action | Target Adoption | Command |
|------|--------|-----------------|---------|
| T+48h | Initial snapshot | 95% | `psql -c "SELECT adoption_rate FROM rs256_adoption_hourly ORDER BY timestamp DESC LIMIT 1"` |
| T+52h | 4h checkpoint | 97% | Same query |
| T+60h | 12h checkpoint | 98% | Same query + Grafana snapshot |
| T+72h | 24h checkpoint | 99% | Same query + Grafana snapshot |
| T+84h | 36h checkpoint | ≥99% | Same query |
| T+96h | Phase 5 gate | ≥99% | Same query + GO/NO-GO decision |

**Monitoring Commands:**

```bash
# Real-time adoption tracking (updates every 5min)
watch -n 300 "psql terrafusion_db -c 'SELECT timestamp, adoption_rate, total_clients, rs256_clients FROM rs256_adoption_hourly ORDER BY timestamp DESC LIMIT 12'"

# Adoption curve visualization (ASCII chart)
psql terrafusion_db -c "SELECT timestamp::time, LPAD('█', (adoption_rate::int / 2), '█') AS adoption_bar, adoption_rate || '%' AS rate FROM rs256_adoption_hourly ORDER BY timestamp DESC LIMIT 48"

# Auth error monitoring (should remain low)
watch -n 300 "psql terrafusion_db -c 'SELECT COUNT(*) AS errors_last_hour FROM auth_errors WHERE created_at > NOW() - INTERVAL '"'"'1 hour'"'"''"
```

**Expected Trajectory:**

```
T+48h: ████████████████████████████████████████████████ 95%
T+52h: ██████████████████████████████████████████████████ 97%
T+60h: ███████████████████████████████████████████████████ 98%
T+72h: ████████████████████████████████████████████████████ 99%
T+84h: ████████████████████████████████████████████████████ 99%
T+96h: ████████████████████████████████████████████████████ 99%+ ✅ Ready for Phase 5
```

**Adoption Slope Validation:**
- **Target:** ≥0.5% increase per 4h window
- **Formula:** `(adoption_T+N - adoption_T) / (N hours / 4) >= 0.5%`
- **Red flag:** Adoption plateaus or decreases → investigate client issues

---

### Step 4: Take Grafana Snapshots (Evidence Trail)

**Purpose:** Capture system state every 12h for audit trail.

```bash
# T+48h snapshot (Phase 4 activation)
curl -X POST http://grafana:3000/api/snapshots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -d '{
    "dashboard": {...},
    "name": "T+48h - Phase 4 Activated",
    "expires": 7776000
  }' | jq -r '.url' > ops/evidence/T+48h_gate/grafana_snapshot_T48h.url

# T+60h snapshot (12h checkpoint)
# [Repeat above command with "T+60h - 12h Checkpoint"]

# T+72h snapshot (24h checkpoint)
# [Repeat above command with "T+72h - 24h Checkpoint"]

# T+84h snapshot (36h checkpoint)
# [Repeat above command with "T+84h - 36h Checkpoint"]

# T+96h snapshot (Phase 5 gate)
# [Repeat above command with "T+96h - Phase 5 Gate"]
```

**Automated Snapshot (Cron Job):**

```bash
# Add to crontab (execute every 12h during Phase 4)
0 */12 * * * cd /path/to/terrafusion_os_1.0 && bash ops/evidence/take_grafana_snapshot.sh
```

---

### Step 5: Rollback Trigger Conditions (Continuous Monitoring)

**Purpose:** Define when to abort Phase 4 and rollback to HS256.

**Automatic Rollback Triggers:**

| Condition | Threshold | Command |
|-----------|-----------|---------|
| Auth errors spike | >50 errors/hour | `bash ops/recovery/rollback-latest.sh --component=rs256 --no-confirm` |
| Adoption drops | <80% | `bash ops/recovery/rollback-latest.sh --component=rs256` |
| System RI drops | <0.9300 | `bash ops/recovery/rollback-latest.sh --no-confirm` |
| Data integrity error | >0 errors | `bash ops/recovery/rollback-latest.sh --no-confirm` |

**Manual Rollback (Operator Judgment):**

```bash
# If any concern arises, rollback immediately
bash ops/recovery/rollback-latest.sh --component=rs256

# Verify rollback succeeded
psql terrafusion_db -c "SELECT * FROM rs256_config WHERE active = true"
# Expected: dual_sign_enabled = false, hs256_enabled = true, rs256_enabled = false
```

**Rollback Window:**
- **T+48h → T+52h:** Easy rollback, <5% client impact
- **T+52h → T+60h:** Moderate rollback, ~10% client errors expected
- **T+60h → T+96h:** Difficult rollback, requires client coordination
- **T+96h+:** Rollback not recommended (proceed to Phase 5 or abort permanently)

---

## 📊 PHASE 5 TRANSITION CRITERIA (T+96h)

**Phase 5 = HS256 Deprecation (final step)**

**GO Criteria (All 3 Must Be Met):**

1. **RS256 Adoption:** ≥99% for 12 consecutive hours
2. **Auth Errors:** <5 errors/24h (tighter than Phase 4)
3. **System RI:** ≥0.9390 maintained throughout Phase 4

**If GO:**
```bash
# Proceed to Phase 5 (HS256 deprecation)
bash ops/security/rs256/rs256-migrate.sh phase2

# Expected: HS256 signing disabled, RS256-only mode
```

**If NO-GO:**
- **Option A:** Extend Phase 4 soak period by 24h
- **Option B:** Rollback to HS256, abandon RS256 migration
- **Decision Authority:** CTO + SRE Lead

---

## 🔍 TROUBLESHOOTING

### Issue 1: Adoption Stalls at <99%

**Symptoms:**
- Adoption curve plateaus at 96-98%
- Slow-adopting clients not upgrading

**Investigation:**
```bash
# Identify slow-adopting clients
psql terrafusion_db -c "SELECT client_id, last_auth_method, last_seen FROM clients WHERE last_auth_method = 'HS256' ORDER BY last_seen DESC LIMIT 100"

# Check client versions
psql terrafusion_db -c "SELECT client_version, COUNT(*) FROM clients WHERE last_auth_method = 'HS256' GROUP BY client_version"
```

**Resolution:**
1. Contact slow-adopting clients (email/Slack)
2. Extend Phase 4 by 24h if necessary
3. If clients are abandoned/deprecated, proceed to Phase 5 anyway

---

### Issue 2: Auth Errors Spike During Phase 4

**Symptoms:**
- Auth errors >50/hour
- Client complaints about failed logins

**Investigation:**
```bash
# Check error types
psql terrafusion_db -c "SELECT error_type, COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY error_type"

# Check if RS256 keys are valid
curl -s http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | select(.use=="sig")'
```

**Resolution:**
1. If `invalid_signature` errors: RS256 keys misconfigured → rollback
2. If `key_not_found` errors: JWKS endpoint not updated → fix and redeploy
3. If other errors: Investigate auth service logs, consider rollback

---

### Issue 3: System RI Drops Below 0.9300

**Symptoms:**
- System RI <0.9300 for >5min
- F2/F4 services degraded

**Investigation:**
```bash
# Check component-level RI
curl -s http://localhost:9091/metrics | grep terrafusion_ri

# Check recent deployments
kubectl rollout history deployment/auth-service
```

**Resolution:**
1. If auth-service caused RI drop: rollback RS256 immediately
2. If F2/F4 caused drop: rollback F2/F4, keep RS256
3. If system-wide issue: rollback everything

---

## 📞 ESCALATION PATHS

| Severity | Contact | Response Time |
|----------|---------|---------------|
| **P0** — Data integrity error | CTO + SRE Lead | Immediate (page) |
| **P1** — Auth errors >100/hour | SRE Lead | <15min |
| **P2** — Adoption stalled | Platform Lead | <1h |
| **P3** — Monitoring gaps | SRE Team | <4h |

**Communication Channels:**
- **Slack:** `#terrafusion-incidents` (real-time updates)
- **PagerDuty:** SRE on-call (P0/P1 only)
- **Email:** Engineering mailing list (post-mortems)

---

## ✅ PHASE 4 SUCCESS CHECKLIST

**Before declaring Phase 4 complete (T+96h):**

- [ ] RS256 adoption ≥99% for 12 consecutive hours
- [ ] Auth errors <5/24h (tighter threshold)
- [ ] System RI ≥0.9390 maintained throughout 48h
- [ ] No firing alerts in Prometheus
- [ ] Grafana snapshots captured (T+48h, T+60h, T+72h, T+84h, T+96h)
- [ ] Evidence trail stored in `ops/evidence/T+96h_gate/`
- [ ] Rollback dry-run executed (still <2min recovery)
- [ ] Phase 5 runbook reviewed (PHASE5_INIT.md)
- [ ] GO/NO-GO decision documented (MISSION_BRIEF_T96H.md)

**If all ✅ checked:** Proceed to Phase 5 (HS256 deprecation)

---

## 📚 REFERENCES

- **Alert Trace Map:** `ops/validation/alert_trace_map.yaml`
- **Rollback Script:** `ops/recovery/rollback-latest.sh`
- **Rollback Runbook:** `ops/tests/chaos/ROLLBACK_RUNBOOK.md`
- **Phase 4 Validation Matrix:** `ops/tests/chaos/PHASE_4_VALIDATION_MATRIX.md`
- **Mission Brief (T+48h):** `ops/runbooks/MISSION_BRIEF_T48H.md`
- **Smart Idle Doctrine:** `docs/governance/SMART_IDLE.md`
- **RS256 Migration Script:** `ops/security/rs256/rs256-migrate.sh`

---

**Runbook Version:** 1.0  
**Last Updated:** October 7, 2025 — T+36h  
**Next Review:** October 8, 2025 — T+48h (before Phase 4 activation)
