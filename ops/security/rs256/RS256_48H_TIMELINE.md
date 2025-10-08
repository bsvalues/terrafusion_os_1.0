# RS256 Migration: 48-Hour Timeline with Checkpoints

**Migration Window:** Oct 7-9, 2025 (48 hours)  
**Phase 1 Start:** Oct 7, 10:00 AM UTC  
**Phase 3 Target:** Oct 9, 10:00 AM UTC  
**Risk:** LOW (dual-sign window, <5min rollback at any point)

---

## Timeline Overview

```
T+0h  [Oct 7, 10:00 AM] Phase 1: Enable Dual-Sign (RS256 + HS256)
      ├─ Deploy RS256 signing, accept both algorithms
      ├─ Verify JWKS endpoint live
      └─ First RS256 tokens issued (2-5% adoption)

T+4h  [Oct 7, 2:00 PM]  Checkpoint 1
      ├─ RS256 adoption ~10-20%
      ├─ Check auth errors (expect ~0)
      └─ Verify JWKS caching working

T+8h  [Oct 7, 6:00 PM]  Checkpoint 2
      ├─ RS256 adoption ~20-30%
      ├─ Check alert fidelity
      └─ Identify slow adopters

T+12h [Oct 7, 10:00 PM] Checkpoint 3
      ├─ RS256 adoption ~30-40%
      ├─ Export metrics for trending
      └─ Update stakeholders

T+16h [Oct 8, 2:00 AM]  Checkpoint 4 (overnight)
      ├─ RS256 adoption ~40-50%
      ├─ Light monitoring (automated alerts)
      └─ On-call availability

T+20h [Oct 8, 6:00 AM]  Checkpoint 5
      ├─ RS256 adoption ~50-60%
      ├─ Morning team review
      └─ Client adoption analysis

T+24h [Oct 8, 10:00 AM] ⭐ MILESTONE: 80% Target
      ├─ RS256 adoption >80% ✅ (GO/NO-GO decision)
      ├─ Comprehensive health check
      └─ Stakeholder review (Platform Lead + SRE Lead)

T+28h [Oct 8, 2:00 PM]  Checkpoint 6
      ├─ RS256 adoption ~85%
      ├─ Verify no regressions
      └─ Continue monitoring

T+32h [Oct 8, 6:00 PM]  Checkpoint 7
      ├─ RS256 adoption ~90%
      ├─ Evening health check
      └─ Prepare Phase 3 plan

T+36h [Oct 8, 10:00 PM] Checkpoint 8
      ├─ RS256 adoption ~93%
      ├─ Late-night stability
      └─ On-call briefing

T+40h [Oct 9, 2:00 AM]  Checkpoint 9 (overnight)
      ├─ RS256 adoption ~95%
      ├─ Automated monitoring
      └─ Phase 3 readiness check

T+44h [Oct 9, 6:00 AM]  Checkpoint 10
      ├─ RS256 adoption ~97%
      ├─ Final pre-Phase 3 review
      └─ Team sync

T+48h [Oct 9, 10:00 AM] ⭐ MILESTONE: Phase 3 Execution
      ├─ RS256 adoption >95% ✅ (final GO/NO-GO)
      ├─ Disable HS256 acceptance
      └─ RS256-only mode active 🎉
```

---

## Checkpoint Details

### T+0h: Phase 1 Start (Oct 7, 10:00 AM)

**Actions:**
1. Execute `./rs256-migrate.sh --phase 1 --env staging`
2. Verify JWKS endpoint: `curl https://auth-staging.terrafusion.com/.well-known/jwks.json`
3. Test RS256 token issuance: Issue new token, verify `kid` header
4. Monitor initial adoption: Run Query 1 from adoption-tracking-queries.sql

**Expected Metrics:**
- RS256 adoption: 2-5%
- HS256 adoption: 95-98%
- Auth error rate: <1 error/hour
- JWKS endpoint: 200 OK, 1-hour cache TTL

**Pass Gates:**
- ✅ RS256 tokens issued with correct `kid`
- ✅ HS256 tokens still accepted
- ✅ JWKS endpoint accessible
- ✅ Zero critical auth errors

**RED FLAGS (trigger rollback):**
- ❌ Auth error rate >10 errors/hour
- ❌ JWKS endpoint 5xx errors
- ❌ RS256 tokens rejected (signature verification failures)

---

### T+4h: Checkpoint 1 (Oct 7, 2:00 PM)

**Actions:**
1. Run adoption query: `SELECT algorithm, COUNT(*), ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' GROUP BY algorithm;`
2. Check auth errors: `SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '4 hours';`
3. Verify JWKS caching: Check `Cache-Control` header, verify 1-hour TTL
4. Export Grafana snapshot: Save JWT adoption chart

**Expected Metrics:**
- RS256 adoption: 10-20%
- HS256 adoption: 80-90%
- Auth error rate: <2 errors/hour
- JWKS cache hit rate: >90%

**Pass Gates:**
- ✅ RS256 adoption increasing
- ✅ Auth errors remain low
- ✅ JWKS caching working (reduces load)

**RED FLAGS:**
- ❌ RS256 adoption <5% (stagnant adoption)
- ❌ Auth error spike

---

### T+8h: Checkpoint 2 (Oct 7, 6:00 PM)

**Actions:**
1. Run adoption query (hourly trend)
2. Check alert fidelity: Verify F2 alerts + RS256 adoption alerts
3. Identify slow adopters: Run Query 3 (adoption by client)
4. Update stakeholders: Slack #rs256-migration with progress

**Expected Metrics:**
- RS256 adoption: 20-30%
- HS256 adoption: 70-80%
- Auth error rate: <2 errors/hour
- Slow adopters identified: List clients still using HS256

**Pass Gates:**
- ✅ RS256 adoption trending upward
- ✅ Alerts working correctly
- ✅ Slow adopters identified (can reach out proactively)

---

### T+12h: Checkpoint 3 (Oct 7, 10:00 PM)

**Actions:**
1. Run adoption query + export metrics
2. Generate adoption trend chart (hourly buckets)
3. Update stakeholders: Evening progress report
4. Brief on-call SRE: Overnight monitoring plan

**Expected Metrics:**
- RS256 adoption: 30-40%
- HS256 adoption: 60-70%
- Auth error rate: <2 errors/hour

**Pass Gates:**
- ✅ Steady adoption growth
- ✅ On-call briefed and ready

---

### T+16h-T+20h: Overnight Monitoring (Oct 8, 2:00 AM - 6:00 AM)

**Actions:**
1. Automated monitoring (alerts only)
2. On-call availability for critical issues
3. Light checkpoints (no manual queries unless alerts fire)

**Expected Metrics:**
- RS256 adoption: 40-60% (gradual overnight increase)
- Auth error rate: <2 errors/hour

**Pass Gates:**
- ✅ No critical alerts fired
- ✅ Adoption continues overnight

---

### T+24h: **MILESTONE** - 80% Target (Oct 8, 10:00 AM)

**Actions:**
1. **GO/NO-GO Decision Point** for continuing to Phase 3
2. Run comprehensive adoption query (Query 5: Overall Migration Progress)
3. Check auth error rate (last 24h)
4. Review slow adopters (identify blockers)
5. Stakeholder meeting: Platform Lead + SRE Lead + On-Call SRE
6. Export all metrics for review

**Expected Metrics:**
- **RS256 adoption: >80%** ✅ (CRITICAL THRESHOLD)
- HS256 adoption: <20%
- Auth error rate: <5 errors/24h
- Zero customer escalations

**Pass Gates (ALL must pass for GO):**
- ✅ RS256 adoption >80%
- ✅ Auth error rate <10 errors/24h
- ✅ Zero critical escalations
- ✅ JWKS endpoint stable (>99.9% uptime)
- ✅ Platform Lead + SRE Lead approval

**RED FLAGS (trigger NO-GO + rollback):**
- ❌ RS256 adoption <80%
- ❌ Auth error rate >10 errors/hour
- ❌ Customer escalations >5 tickets
- ❌ Any stakeholder veto

**Decision:**
- **GO:** Continue to T+48h, prepare Phase 3
- **NO-GO:** Rollback to HS256-only, investigate blockers, extend timeline

---

### T+28h-T+44h: Final Soak Period (Oct 8, 2:00 PM - Oct 9, 6:00 AM)

**Actions:**
1. Continue monitoring (4-hourly checkpoints)
2. Watch for adoption plateau
3. Prepare Phase 3 execution plan
4. Final stakeholder review

**Expected Metrics:**
- RS256 adoption: 85-97% (gradual increase)
- HS256 adoption: 3-15% (gradual decrease)
- Auth error rate: <5 errors/24h

**Pass Gates:**
- ✅ RS256 adoption approaching 95%
- ✅ No late-stage regressions

---

### T+48h: **MILESTONE** - Phase 3 Execution (Oct 9, 10:00 AM)

**Actions:**
1. **FINAL GO/NO-GO Decision** for disabling HS256
2. Run adoption query: Verify >95%
3. Execute Phase 3: `./rs256-migrate.sh --phase 3 --env staging`
4. Monitor for 60 minutes post-Phase 3
5. Verify HS256 rejection (test with HS256 token, expect 401 Unauthorized)
6. Close migration (update change card, notify stakeholders)

**Expected Metrics:**
- **RS256 adoption: >95%** ✅ (CRITICAL THRESHOLD)
- HS256 adoption: <5%
- Auth error rate: <2 errors/hour (transient spike during Phase 3 acceptable)

**Pass Gates (ALL must pass for GO):**
- ✅ RS256 adoption >95%
- ✅ Auth error rate <10 errors/24h
- ✅ Zero customer escalations
- ✅ Platform Lead + SRE Lead approval

**RED FLAGS (trigger NO-GO):**
- ❌ RS256 adoption <95%
- ❌ Late-stage auth errors
- ❌ Customer escalations

**Decision:**
- **GO:** Execute Phase 3 (disable HS256)
- **NO-GO:** Extend dual-sign window (wait for >95% adoption)

---

## Monitoring Dashboard (Grafana)

**Metrics to display:**
1. JWT Adoption by Algorithm (RS256 vs HS256) - time-series chart
2. Auth Error Rate - gauge + time-series
3. JWKS Endpoint Uptime - SLO gauge (target >99.9%)
4. Token Issuance Rate - time-series (tokens/min)
5. Slow Adopters Table - list of clients still using HS256

**Alerts:**
- Critical: Auth error rate >10 errors/hour (PagerDuty)
- Warning: RS256 adoption <expected for time (Slack)
- Info: JWKS cache miss rate >10% (Slack)

---

## Communication Plan

**Stakeholder Updates:**
- **T+0h:** Phase 1 start notification (Slack #rs256-migration)
- **T+8h:** Evening progress report (email to Platform Lead, SRE Lead)
- **T+24h:** 80% milestone review (meeting + email)
- **T+44h:** Phase 3 readiness review (meeting)
- **T+48h:** Migration complete notification (Slack + email)

**Client Communication:**
- **T-48h (Oct 5):** Pre-migration warning (email to API consumers)
- **T+0h:** Migration started (status page update)
- **T+24h:** 80% adoption achieved (status page + email)
- **T+48h:** Migration complete, HS256 deprecated (email + docs update)

---

## Rollback Points

**<5 minute rollback available at ANY point:**
- **T+0h to T+24h:** Rollback to HS256-only (Phase 1 rollback)
- **T+24h to T+48h:** Disable RS256 signing, keep dual acceptance (Phase 2 rollback)
- **T+48h+:** Re-enable HS256 acceptance (Phase 3 rollback)

**See:** `RS256_ROLLBACK_PROCEDURES.md` for detailed procedures

---

## Success Criteria (Final Assessment)

Migration is **successful** when:

1. ✅ Phase 3 complete (HS256 disabled, RS256-only mode)
2. ✅ RS256 adoption >95% (verified at T+48h)
3. ✅ Auth error rate <10 errors/24h (sustained)
4. ✅ Zero customer escalations (related to migration)
5. ✅ JWKS endpoint stable (>99.9% uptime)
6. ✅ All stakeholders signed off (Platform Lead + SRE Lead)
7. ✅ Post-migration monitoring (24h after Phase 3)
8. ✅ Documentation updated (HS256 marked deprecated)

---

**Next:** When ready to start, execute:
```bash
./rs256-migrate.sh --phase 0 --env staging  # Pre-flight validation
./rs256-migrate.sh --phase 1 --env staging  # Enable dual-sign
```

**Remember:** Boring is best. Measure twice, cut once. Rollback is not failure, it's risk management. 🎯
