# RS256 Migration Kit - Complete Package

**Version:** 1.0.0  
**Created:** 2025-10-07  
**Purpose:** Complete RS256 JWT migration infrastructure for TerraFusion OS 1.0

---

## 📦 **What's Included (8 Files)**

### **1. Key Generation (`generate-keys.sh`)**
- Generates RSA-2048 key pairs for RS256 signing
- Creates JWKS format for public key distribution
- Sets secure file permissions (600 for private, 644 for public)
- Includes key metadata (creation date, rotation schedule)
- **Usage:** `bash generate-keys.sh tfos_2025_kid1`

### **2. JWKS Mock Server (`jwks-mock-server.py`)**
- Local testing server for JWKS endpoint
- Serves `/.well-known/jwks.json` with 1-hour cache
- Health check endpoint at `/health`
- **Usage:** `python3 jwks-mock-server.py --port 8080`

### **3. Migration Execution Script (`rs256-migrate.sh`)**
- 4-phase migration automation (pre-flight, dual-sign, monitor, RS256-only)
- Kubectl integration for K8s deployment
- Backup creation before each phase
- Dry-run mode for testing
- **Usage:** `bash rs256-migrate.sh --phase 1 --env staging`

### **4. Adoption Tracking Queries (`adoption-tracking-queries.sql`)**
- 10 SQL queries for monitoring RS256 adoption
- Hourly trend analysis
- Client/service breakdown
- Rollback decision matrix
- GO/NO-GO checkpoint queries
- **Usage:** Run in psql or DBeaver against auth database

### **5. Rollback Procedures (`RS256_ROLLBACK_PROCEDURES.md`)**
- <5 minute rollback at any phase
- Phase-specific procedures (Phase 1, 2, 3)
- Emergency rollback (critical incidents)
- RED FLAG triggers
- Post-rollback checklist
- **Duration:** <5 minutes at any phase

### **6. 48-Hour Timeline (`RS256_48H_TIMELINE.md`)**
- Hour-by-hour checkpoint schedule
- Expected metrics at each checkpoint
- Pass gates and RED FLAGS
- GO/NO-GO decision points (T+24h, T+48h)
- Communication plan
- **Key Milestones:** T+24h (80% target), T+48h (95% target, Phase 3 execution)

### **7. Integration Tests (`test-rs256-integration.py`)**
- 5 automated tests (signing, verification, rejection, dual-sign)
- Local testing (no K8s required)
- PyJWT + cryptography validation
- **Usage:** `python3 test-rs256-integration.py`
- **Expected:** 5/5 tests pass

### **8. Auth Service Config (`auth/config.yaml`)**
- Dual-sign configuration (RS256 + HS256 acceptance)
- JWKS endpoint configuration
- Key rotation settings
- HS256 grace period (30 days)
- **Already exists, updated with RS256 settings**

---

## 🚀 **Quick Start (Local Testing)**

### **Step 1: Generate Test Keys (2 min)**
```bash
cd ops/security/rs256
bash generate-keys.sh tfos_2025_kid1_test
```

### **Step 2: Start JWKS Mock Server (1 min)**
```bash
python3 jwks-mock-server.py --port 8080 --jwks-file ops/keys/rs256/tfos_2025_kid1_test_jwks.json
```

### **Step 3: Run Integration Tests (1 min)**
```bash
python3 test-rs256-integration.py
```

**Expected Output:**
```
✅ RS256 Signing: PASS
✅ RS256 Verification: PASS
✅ Wrong Key Rejection: PASS
✅ HS256 Rejection (RS256-only): PASS
✅ Dual-Sign Mode: PASS

Results: 5/5 tests passed
🎉 All tests passed! RS256 integration working correctly.
```

---

## 📋 **Real Staging Execution Checklist**

Before running in real staging cluster:

### **Prerequisites:**
- [ ] K8s cluster with Istio installed
- [ ] `kubectl` access with cluster-admin role
- [ ] PostgreSQL database with `auth_audit` table
- [ ] Private key secret created: `jwt-signing-keys`
- [ ] Monitoring stack (Prometheus, Grafana)
- [ ] Slack/PagerDuty alerts configured

### **Execution (Phase 0-3):**
```bash
# Phase 0: Pre-flight validation (15 min)
./rs256-migrate.sh --phase 0 --env staging

# Phase 1: Enable dual-sign (30 min)
./rs256-migrate.sh --phase 1 --env staging

# Phase 2: Monitor adoption (48h)
# Check every 4h: T+4h, T+8h, T+12h, ..., T+48h
./rs256-migrate.sh --phase 2 --env staging

# Phase 3: Disable HS256 (after 48h, if RS256 >95%)
./rs256-migrate.sh --phase 3 --env staging
```

### **Monitoring (Every 4h):**
```sql
-- Run in psql:
SELECT 
    algorithm,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percent
FROM auth_audit
WHERE iat > NOW() - INTERVAL '1 hour'
GROUP BY algorithm
ORDER BY percent DESC;

-- Expected at T+24h:
-- RS256:  81.5% ✅
-- HS256:  18.5%

-- Expected at T+48h:
-- RS256:  96.8% ✅
-- HS256:   3.2%
```

---

## 🎯 **Success Criteria**

Migration is **successful** when:

1. ✅ Phase 3 complete (HS256 disabled, RS256-only mode active)
2. ✅ RS256 adoption >95% (verified at T+48h)
3. ✅ Auth error rate <10 errors/24h (sustained)
4. ✅ Zero customer escalations (related to migration)
5. ✅ JWKS endpoint stable (>99.9% uptime)
6. ✅ All stakeholders signed off (Platform Lead + SRE Lead)
7. ✅ Integration tests: 5/5 PASS
8. ✅ Rollback procedures tested (<5min verified)

---

## ⚠️ **Rollback Triggers (RED FLAGS)**

Rollback **immediately** if:

- ❌ Auth error rate >10 errors/hour (signature/alg mismatch)
- ❌ RS256 adoption <80% at T+24h
- ❌ RS256 adoption <95% at T+48h
- ❌ Customer escalations >10 tickets/hour
- ❌ JWKS endpoint downtime >5 minutes
- ❌ On-call SRE judgment call (any security concern)

**Rollback Time:** <5 minutes at any phase (see `RS256_ROLLBACK_PROCEDURES.md`)

---

## 📊 **Expected Impact**

### **Security:**
- ✅ Asymmetric cryptography (RS256 vs HS256 symmetric)
- ✅ Public key distribution (JWKS endpoint)
- ✅ Key rotation without downtime
- ✅ No shared secrets across services

### **Performance:**
- ⚠️ Token verification slightly faster (public key caching)
- ⚠️ Token signing slightly slower (RSA vs HMAC, negligible ~1-2ms)
- ⚠️ JWKS endpoint adds 1 HTTP call (cached 1 hour)

### **Operational:**
- ✅ Annual key rotation (vs manual HS256 secret rotation)
- ✅ Audit trail (kid in JWT header)
- ✅ Rollback <5 minutes (zero data loss)
- ✅ Zero downtime migration (dual-sign window)

---

## 📁 **File Structure**

```
ops/security/rs256/
├── generate-keys.sh                    # RSA key generation
├── jwks-mock-server.py                 # Local JWKS endpoint
├── rs256-migrate.sh                    # 4-phase migration script
├── adoption-tracking-queries.sql       # 10 monitoring queries
├── RS256_ROLLBACK_PROCEDURES.md        # <5min rollback guide
├── RS256_48H_TIMELINE.md               # Hour-by-hour checkpoints
├── test-rs256-integration.py           # 5 automated tests
└── RS256_MIGRATION_KIT_README.md       # This file

ops/keys/rs256/                         # Generated keys (gitignored)
├── tfos_2025_kid1_private.pem          # Private key (600 perms)
├── tfos_2025_kid1_public.pem           # Public key (644 perms)
├── tfos_2025_kid1_jwks.json            # JWKS format
└── tfos_2025_kid1_metadata.json        # Key metadata

auth/
├── jwks/
│   └── jwks.json                       # Public JWKS (already exists)
└── config.yaml                         # Auth service config (updated)
```

---

## 🔒 **Security Notes**

1. **Private Keys:**
   - NEVER commit to version control
   - Add `ops/keys/rs256/*_private.pem` to `.gitignore`
   - Store in secrets manager (Vault, AWS Secrets Manager) in production
   - File permissions: 600 (owner-only access)

2. **Public Keys:**
   - Safe to commit (public distribution)
   - Served via JWKS endpoint (cached 1 hour)
   - File permissions: 644 (world-readable)

3. **Key Rotation:**
   - Annual rotation recommended
   - Dual-sign window (48h) during rotation
   - Old keys deprecated, removed after 7 days
   - Audit trail via kid header

4. **Secrets Management:**
   - Use K8s secrets for staging/production
   - Mount keys as volumes: `/var/secrets/jwt/signing_keys/`
   - Rotate secrets on compromise (emergency rotation)

---

## 📞 **Support & Escalation**

**Technical Issues:**
- **Slack:** #rs256-migration
- **Email:** platform-team@terrafusion.com

**Critical Incidents (24/7):**
- **On-Call SRE:** Pager: +1-XXX-XXX-XXXX
- **Platform Lead:** Phone: +1-XXX-XXX-XXXX
- **Security Team:** security@terrafusion.com

**Escalation Path:**
1. On-Call SRE (rollback executor)
2. Platform Lead (approval for emergency rollback)
3. CTO (production-wide rollback only)

---

## 🎉 **Post-Migration**

After successful migration:

1. **Update Documentation:**
   - Mark HS256 as deprecated
   - Update API docs with RS256 requirement
   - Add JWKS endpoint to discovery docs

2. **Client Communication:**
   - Email API consumers: RS256 now required
   - Update SDKs with RS256 support
   - Deprecation notice: HS256 removed after 7 days

3. **Archive HS256 Keys:**
   - Remove HS256 secret from K8s after 7 days
   - Archive in secure vault (audit trail)
   - Document removal in change log

4. **Schedule Next Rotation:**
   - Annual rotation: Oct 2026
   - Calendar reminder: 30 days before
   - Pre-rotation testing: 7 days before

---

## ✅ **Validation Checklist**

Before production deployment:

- [ ] All 8 files reviewed and understood
- [ ] Local testing: 5/5 integration tests PASS
- [ ] JWKS mock server working (http://localhost:8080/.well-known/jwks.json)
- [ ] Key generation tested (generate-keys.sh)
- [ ] Rollback procedures tested (<5min verified)
- [ ] Stakeholders briefed (Platform Lead, SRE Lead)
- [ ] Change card created with 2 approvals
- [ ] Rollback plan approved
- [ ] On-call SRE availability confirmed (48h window)
- [ ] Monitoring dashboards configured (Grafana)
- [ ] Alerts configured (Slack, PagerDuty)

---

## 📚 **Additional Resources**

- **JWT RFC:** https://datatracker.ietf.org/doc/html/rfc7519
- **JWK RFC:** https://datatracker.ietf.org/doc/html/rfc7517
- **JWKS Endpoint:** https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets
- **RS256 vs HS256:** https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/

---

**Ready to Execute?** Start with local testing, then proceed to staging when confident. Boring is best. 🎯

---

**Generated:** 2025-10-07  
**By:** AI Agent (TerraFusion-AI)  
**For:** TerraFusion OS 1.0 - Day 9 Security Enhancement
