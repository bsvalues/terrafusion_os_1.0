# RS256 Migration Rollback Procedures

**Version:** 1.0.0  
**Last Updated:** 2025-10-07  
**Rollback Time:** <5 minutes at any phase

---

## Overview

This document provides **fast rollback procedures** for the RS256 migration at each phase. Rollback is **reversible** and **non-destructive** — existing tokens continue to work, no data loss.

**Rollback Triggers (RED FLAGS):**
- Auth error rate >10 errors/hour (signature/alg mismatch)
- RS256 adoption <80% at T+24h
- RS256 adoption <95% at T+48h
- Customer escalations >10 tickets/hour related to auth
- On-call SRE judgment call (any security concern)

---

## Phase 1 Rollback: Revert to HS256-Only

**When:** During or immediately after Phase 1 (dual-sign enabled)  
**Duration:** <3 minutes  
**Impact:** Zero downtime (HS256 tokens still accepted)

### Procedure

```bash
# 1. Revert auth service to HS256-only mode (2 minutes)
kubectl set env deployment/auth-service \
  -n terrafusion-staging \
  JWT_ALGORITHM=HS256 \
  JWT_ACCEPT_ALGORITHMS=HS256 \
  JWT_KID- \
  JWT_PRIVATE_KEY_PATH- \
  JWKS_ENDPOINT-

# Wait for rollout
kubectl rollout status deployment/auth-service -n terrafusion-staging --timeout=2m

# 2. Verify HS256-only mode (30 seconds)
kubectl exec -n terrafusion-staging deployment/auth-service -- \
  curl -s http://localhost:8080/health | jq '.jwt.algorithm'
# Expected: "HS256"

# 3. Test token issuance (30 seconds)
curl -X POST https://auth-staging.terrafusion.com/token \
  -d "grant_type=client_credentials" \
  -H "Authorization: Basic $(echo -n 'client:secret' | base64)"
# Verify: Header has "alg": "HS256"
```

### Verification

✅ **Auth service using HS256 for signing**  
✅ **Auth service accepting only HS256 tokens**  
✅ **No RS256 tokens issued (kid header absent)**  
✅ **Existing RS256 tokens rejected (expected)**  
✅ **Zero auth errors**

### Post-Rollback

1. Investigate rollback cause (check logs, metrics, escalations)
2. Fix identified issues (code, config, documentation)
3. Re-test in local/dev environment
4. Re-attempt Phase 1 when ready (no data loss, can retry)

---

## Phase 2 Rollback: Disable RS256 Signing

**When:** During 48h soak period (Phase 2)  
**Duration:** <3 minutes  
**Impact:** Zero downtime (both algorithms still accepted)

### Procedure

```bash
# 1. Disable RS256 signing, keep HS256 acceptance (2 minutes)
kubectl set env deployment/auth-service \
  -n terrafusion-staging \
  JWT_ALGORITHM=HS256 \
  JWT_ACCEPT_ALGORITHMS=HS256,RS256 \
  JWT_KID- \
  JWT_PRIVATE_KEY_PATH- \
  JWKS_ENDPOINT-

# Wait for rollout
kubectl rollout status deployment/auth-service -n terrafusion-staging --timeout=2m

# 2. Verify HS256 signing + dual acceptance (30 seconds)
kubectl exec -n terrafusion-staging deployment/auth-service -- \
  curl -s http://localhost:8080/health | jq '.jwt'
# Expected: algorithm="HS256", accept_algorithms=["HS256", "RS256"]

# 3. Test HS256 token issuance (30 seconds)
curl -X POST https://auth-staging.terrafusion.com/token \
  -d "grant_type=client_credentials" \
  -H "Authorization: Basic $(echo -n 'client:secret' | base64)"
# Verify: Header has "alg": "HS256" (not RS256)

# 4. Verify existing RS256 tokens still accepted (30 seconds)
curl -H "Authorization: Bearer <existing_rs256_token>" \
  https://api-staging.terrafusion.com/health
# Expected: 200 OK (RS256 still accepted during grace period)
```

### Verification

✅ **Auth service using HS256 for signing (reverted)**  
✅ **Auth service accepting HS256 + RS256 tokens**  
✅ **No new RS256 tokens issued**  
✅ **Existing RS256 tokens still work (grace period)**  
✅ **Zero auth errors**

### Natural Expiry

Existing RS256 tokens will **naturally expire** within 1 hour (access_token TTL). After 1 hour:
- 0% RS256 tokens in circulation
- 100% HS256 tokens in circulation
- Migration fully reverted

### Post-Rollback

1. Investigate rollback cause (adoption blockers, client issues)
2. Notify clients about rollback (RS256 postponed)
3. Extend adoption timeline (more client prep time)
4. Re-attempt Phase 1 when clients ready

---

## Phase 3 Rollback: Re-Enable HS256 Acceptance

**When:** After Phase 3 (HS256 disabled, RS256-only mode)  
**Duration:** <2 minutes  
**Impact:** Brief auth errors (0-30 seconds) for HS256 tokens during rollout

### Procedure

```bash
# 1. Re-enable HS256 acceptance (90 seconds)
kubectl set env deployment/auth-service \
  -n terrafusion-staging \
  JWT_ACCEPT_ALGORITHMS=RS256,HS256

# Wait for rollout (critical to avoid auth errors)
kubectl rollout status deployment/auth-service -n terrafusion-staging --timeout=2m

# 2. Verify dual acceptance (30 seconds)
kubectl exec -n terrafusion-staging deployment/auth-service -- \
  curl -s http://localhost:8080/health | jq '.jwt.accept_algorithms'
# Expected: ["RS256", "HS256"]

# 3. Test HS256 token acceptance (30 seconds)
# (Issue HS256 token from test client)
curl -H "Authorization: Bearer <hs256_test_token>" \
  https://api-staging.terrafusion.com/health
# Expected: 200 OK (HS256 re-accepted)
```

### Verification

✅ **Auth service accepting RS256 + HS256 tokens**  
✅ **RS256 tokens still work (primary)**  
✅ **HS256 tokens work (re-enabled)**  
✅ **Zero sustained auth errors (transient OK during rollout)**

### Post-Rollback

1. Investigate Phase 3 failure (why HS256 still needed)
2. Identify laggard clients (still using HS256)
3. Extend dual-sign window (allow more migration time)
4. Re-attempt Phase 3 when adoption >99% (stricter threshold)

---

## Emergency Rollback (Any Phase)

**When:** Critical incident (widespread auth failures, security breach)  
**Duration:** <5 minutes  
**Impact:** Brief downtime (<30 seconds) acceptable in emergency

### Procedure

```bash
# 1. Restore backup config (fastest method) (3 minutes)
BACKUP_FILE="ops/security/rs256/backups/auth-config-<TIMESTAMP>.yaml"
kubectl apply -f "$BACKUP_FILE"

# Wait for rollout
kubectl rollout status deployment/auth-service -n terrafusion-staging --timeout=2m

# 2. Verify restoration (1 minute)
kubectl get configmap auth-config -n terrafusion-staging -o yaml | \
  grep -E "JWT_ALGORITHM|JWT_ACCEPT_ALGORITHMS"

# 3. Test auth flow (1 minute)
curl -X POST https://auth-staging.terrafusion.com/token \
  -d "grant_type=client_credentials" \
  -H "Authorization: Basic $(echo -n 'client:secret' | base64)"

curl -H "Authorization: Bearer <test_token>" \
  https://api-staging.terrafusion.com/health
```

### Verification

✅ **Auth service config matches backup**  
✅ **Token issuance working**  
✅ **Token verification working**  
✅ **Auth error rate <1 error/minute**

---

## Rollback Decision Matrix

| Condition | Phase 1 | Phase 2 | Phase 3 | Action |
|-----------|---------|---------|---------|--------|
| **Auth errors >10/hour** | ✅ | ✅ | ✅ | Rollback immediately |
| **RS256 <80% at T+24h** | ❌ | ✅ | ❌ | Rollback, extend timeline |
| **RS256 <95% at T+48h** | ❌ | ❌ | ✅ | Rollback, identify laggards |
| **Customer escalations >10/hour** | ✅ | ✅ | ✅ | Rollback, investigate |
| **Security incident** | ✅ | ✅ | ✅ | Emergency rollback |
| **On-call SRE call** | ✅ | ✅ | ✅ | Rollback, discuss |

---

## Post-Rollback Checklist

After any rollback:

1. **Incident Report:**
   - Document rollback trigger
   - Timeline (start, rollback time, resolution)
   - Root cause analysis

2. **Metrics Capture:**
   - Auth error rate (before, during, after)
   - RS256 adoption % at rollback time
   - Customer escalations count
   - Rollback duration (measured)

3. **Communication:**
   - Notify stakeholders (Platform Lead, SRE Lead, Product Manager)
   - Update #incidents Slack channel
   - Send postmortem email (within 24h)

4. **Retry Planning:**
   - Fix identified issues
   - Extended timeline (if needed)
   - Additional client communication
   - Re-test in dev/staging
   - Schedule retry attempt

5. **Change Card Update:**
   - Mark rollback in production change card
   - Document lessons learned
   - Update risk assessment
   - Adjust deployment plan for retry

---

## Rollback Testing (Pre-Migration)

**Before Phase 1, test rollback procedures in staging:**

```bash
# Dry-run Phase 1 rollback
./rs256-migrate.sh --phase 1 --env staging --dry-run
# (Apply, then immediately rollback)
./rs256-rollback.sh --phase 1 --env staging --dry-run

# Verify:
# - Rollback commands work
# - Backup files created
# - Restoration successful
# - Zero data loss
# - <5 minute duration
```

---

## Contact Information (24/7)

**Critical Incident (Rollback):**
- **On-Call SRE:** Pager: +1-XXX-XXX-XXXX, Slack: @oncall-sre
- **Platform Lead:** Phone: +1-XXX-XXX-XXXX, Slack: @platform-lead
- **Security Team:** Email: security@terrafusion.com, Slack: #security-incidents

**Escalation Path:**
1. On-Call SRE (primary, rollback executor)
2. Platform Lead (secondary, approval for emergency rollback)
3. CTO (final approval, only for production-wide rollback)

---

## Rollback Success Criteria

Rollback is considered **successful** when:

1. ✅ Auth service config reverted (verified in kubectl)
2. ✅ Token issuance working (manual test passed)
3. ✅ Token verification working (manual test passed)
4. ✅ Auth error rate <1 error/minute (Prometheus query)
5. ✅ Zero customer escalations (after 15 min stabilization)
6. ✅ Rollback duration <5 minutes (measured)
7. ✅ Incident report filed (within 1 hour)

---

**Remember:** Rollback is **not failure** — it's risk management. Better to rollback and retry than push through with issues. Boring is best. 🎯
