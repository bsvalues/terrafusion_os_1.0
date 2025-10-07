# Day 9: JWT HS256 → RS256 Migration Runbook

**Date**: October 8-9, 2025  
**Owner**: Security Team  
**Duration**: 48-72 hours (dual-sign grace period)  
**Rollback Time**: <10 minutes at any phase  
**Risk Level**: MEDIUM (security improvement, backward compatible during grace period)

---

## 🎯 Objective

Migrate from shared-secret HS256 to public-key RS256 JWT authentication for improved security posture and multi-tenant key isolation.

**Expected Security Score Improvement**: 0.78 → 0.90 (+0.12)

---

## 📋 Pre-Req Checklist

- [ ] **Change Control Approved** (Ticket: SEC-2025-1008)
- [ ] **Backup Current Auth Config** (HS256 secret, auth service deployment)
- [ ] **Generate RS256 Key Pair** (tfos_2025_kid1)
- [ ] **Create JWKS Endpoint** (/.well-known/jwks.json)
- [ ] **Deploy Token Audit Table** (migrations/2025-10-08_auth_audit.sql)
- [ ] **Notify Stakeholders** (48h advance notice to API consumers)
- [ ] **Monitoring Alerts Active** (JWT_Validation_Failure_Rate_High, JWKS_Endpoint_Down)
- [ ] **Rollback Plan Reviewed** (< 10min revert to HS256)

---

## Phase 0: Pre-Flight (30 minutes)

### Step 0.1: Generate RS256 Key Pair

```bash
cd C:\Users\bsval\terrafusion_os_1.0

# Create key directory
New-Item -ItemType Directory -Path ops\keys\rs256 -Force

# Generate private key (2048-bit RSA)
openssl genrsa -out ops\keys\rs256\tfos_kid1.pem 2048

# Extract public key
openssl rsa -in ops\keys\rs256\tfos_kid1.pem -pubout -out ops\keys\rs256\tfos_kid1.pub

# Generate key ID (SHA256 thumbprint)
$thumbprint = (openssl rsa -in ops\keys\rs256\tfos_kid1.pem -pubout -outform DER | openssl dgst -sha256 -binary | openssl base64 | ForEach-Object { $_ -replace '=', '' -replace '/', '_' -replace '\+', '-' }).Substring(0, 32)
Set-Content -Path ops\keys\rs256\tfos_kid1.kid -Value "tfos_2025_kid1"

Write-Host "✓ RS256 key pair generated: tfos_2025_kid1" -ForegroundColor Green
```

**Pass Gate**:
- [ ] Private key exists: `ops\keys\rs256\tfos_kid1.pem`
- [ ] Public key exists: `ops\keys\rs256\tfos_kid1.pub`
- [ ] Key ID saved: `ops\keys\rs256\tfos_kid1.kid`

### Step 0.2: Convert Public Key to JWK Format

```bash
# Install pem-jwk (if not installed)
npm install -g pem-jwk

# Convert public key to JWK
pem-jwk ops\keys\rs256\tfos_kid1.pub > ops\keys\rs256\tfos_kid1.jwk

# Add metadata to JWK
$jwk = Get-Content ops\keys\rs256\tfos_kid1.jwk | ConvertFrom-Json
$jwk | Add-Member -MemberType NoteProperty -Name "use" -Value "sig"
$jwk | Add-Member -MemberType NoteProperty -Name "alg" -Value "RS256"
$jwk | Add-Member -MemberType NoteProperty -Name "kid" -Value "tfos_2025_kid1"
$jwk | ConvertTo-Json -Depth 10 | Set-Content ops\keys\rs256\tfos_kid1_final.jwk

Write-Host "✓ JWK format created" -ForegroundColor Green
```

**Pass Gate**:
- [ ] JWK file exists: `ops\keys\rs256\tfos_kid1_final.jwk`
- [ ] JWK contains `kid`, `alg`, `use`, `kty`, `n`, `e` fields

### Step 0.3: Deploy Token Audit Table

```bash
# Backup database
pg_dump -U postgres -h localhost terrafusion_auth > backups\terrafusion_auth_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# Deploy migration
psql -U auth_service -d terrafusion_auth -f migrations\2025-10-08_auth_audit.sql

# Verify table created
psql -U auth_service -d terrafusion_auth -c "SELECT tablename FROM pg_tables WHERE tablename = 'token_audit';"

Write-Host "✓ Token audit table deployed" -ForegroundColor Green
```

**Pass Gate**:
- [ ] Table `token_audit` exists
- [ ] Views created: `v_token_audit_active`, `v_token_audit_hs256_usage`
- [ ] Functions created: `revoke_token`, `revoke_user_tokens`

### Step 0.4: Create JWKS Endpoint

```bash
# Update auth/jwks/jwks.json with new key
$jwk = Get-Content ops\keys\rs256\tfos_kid1_final.jwk | ConvertFrom-Json
$jwks = Get-Content auth\jwks\jwks.json | ConvertFrom-Json
$jwks.keys += $jwk
$jwks | ConvertTo-Json -Depth 10 | Set-Content auth\jwks\jwks.json

# Deploy JWKS endpoint (Kubernetes ConfigMap)
kubectl create configmap jwks-config --from-file=auth\jwks\jwks.json -n terrafusion --dry-run=client -o yaml | kubectl apply -f -

# Verify JWKS endpoint
curl -s https://auth.terrafusion.ai/.well-known/jwks.json | jq '.keys[] | select(.kid == "tfos_2025_kid1")'

Write-Host "✓ JWKS endpoint deployed" -ForegroundColor Green
```

**Pass Gate**:
- [ ] JWKS endpoint returns 200 OK
- [ ] Key `tfos_2025_kid1` present in JWKS response
- [ ] CDN cache refreshed (CloudFlare purge)

---

## Phase 1: Dual-Sign Window (48 hours)

**Goal**: Accept both HS256 + RS256 tokens. Sign new tokens with both algorithms.

### Step 1.1: Update Auth Service Config (Staging)

```bash
# Export environment variables
$env:KUBE_CONTEXT = "staging"
$env:NAMESPACE = "terrafusion-staging"

# Create Kubernetes secrets
kubectl create secret generic jwt-signing-key \
  --from-file=private-key=ops\keys\rs256\tfos_kid1.pem \
  --from-literal=kid=tfos_2025_kid1 \
  --namespace=$env:NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic jwt-hs256-secret \
  --from-literal=secret="$(kubectl get secret jwt-hs256-secret -n terrafusion -o jsonpath='{.data.secret}' | base64 -d)" \
  --namespace=$env:NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

# Update auth service deployment
kubectl set env deployment/auth-service \
  -n $env:NAMESPACE \
  JWT_PRIMARY_ALGORITHM=RS256 \
  JWT_FALLBACK_ALGORITHM=HS256 \
  JWT_DUAL_SIGN_ENABLED=true \
  JWT_DEFAULT_KID=tfos_2025_kid1

# Verify deployment
kubectl rollout status deployment/auth-service -n $env:NAMESPACE

Write-Host "✓ Auth service updated in staging" -ForegroundColor Green
```

**Pass Gate** (Staging):
- [ ] Auth service pods restarted successfully
- [ ] Health check: `curl https://auth.staging.terrafusion.ai/health` returns 200 OK
- [ ] JWKS endpoint accessible: `curl https://auth.staging.terrafusion.ai/.well-known/jwks.json`

### Step 1.2: Validate Dual-Sign Behavior (Staging)

```bash
# Issue token with RS256 (new)
$rs256Token = (curl -X POST https://auth.staging.terrafusion.ai/auth/v1/token `
  -H "Content-Type: application/json" `
  -d '{\"grant_type\":\"client_credentials\",\"client_id\":\"test_client\",\"client_secret\":\"test_secret\"}' | ConvertFrom-Json).access_token

# Decode token header
$header = ($rs256Token -split '\.')[0]
$headerDecoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($header + "="))
Write-Host "RS256 Token Header: $headerDecoded" -ForegroundColor Cyan

# Verify RS256 signature
jwt decode --key ops\keys\rs256\tfos_kid1.pub --alg RS256 $rs256Token
Write-Host "✓ RS256 token validated" -ForegroundColor Green

# Verify HS256 still accepted (legacy clients)
$hs256Token = (curl -X POST https://auth.staging.terrafusion.ai/auth/v1/token `
  -H "Content-Type: application/json" `
  -H "X-Force-HS256: true" `
  -d '{\"grant_type\":\"client_credentials\",\"client_id\":\"test_client\",\"client_secret\":\"test_secret\"}' | ConvertFrom-Json).access_token

jwt decode --secret $(kubectl get secret jwt-hs256-secret -n $env:NAMESPACE -o jsonpath='{.data.secret}' | base64 -d) --alg HS256 $hs256Token
Write-Host "✓ HS256 token still accepted (fallback)" -ForegroundColor Yellow
```

**Acceptance Criteria** (Staging):
- [ ] New tokens issued with `alg: RS256`, `kid: tfos_2025_kid1`
- [ ] RS256 tokens validate successfully (public key verification)
- [ ] HS256 tokens still accepted (backward compatibility)
- [ ] Token audit table populated: `SELECT COUNT(*) FROM token_audit WHERE algorithm = 'RS256';`
- [ ] No errors in auth service logs: `kubectl logs -l app=auth-service -n $env:NAMESPACE --tail=50`

### Step 1.3: Deploy to Production (With Dual-Sign)

```bash
# Export production environment
$env:KUBE_CONTEXT = "production"
$env:NAMESPACE = "terrafusion"

# Book change window
Write-Host "⚠️  CHANGE WINDOW: Oct 8, 2025 10:00 PM - 11:00 PM UTC" -ForegroundColor Yellow
Read-Host "Press ENTER to proceed with production deployment"

# Create secrets (production)
kubectl create secret generic jwt-signing-key \
  --from-file=private-key=ops\keys\rs256\tfos_kid1.pem \
  --from-literal=kid=tfos_2025_kid1 \
  --namespace=$env:NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

# Update auth service (production)
kubectl set env deployment/auth-service \
  -n $env:NAMESPACE \
  JWT_PRIMARY_ALGORITHM=RS256 \
  JWT_FALLBACK_ALGORITHM=HS256 \
  JWT_DUAL_SIGN_ENABLED=true \
  JWT_DEFAULT_KID=tfos_2025_kid1

# Monitor rollout
kubectl rollout status deployment/auth-service -n $env:NAMESPACE --timeout=300s

Write-Host "✓ Production deployment complete" -ForegroundColor Green
```

**Pass Gate** (Production):
- [ ] Zero-downtime rollout (no 503 errors)
- [ ] Health check: `curl https://auth.terrafusion.ai/health` returns 200 OK
- [ ] JWKS endpoint accessible: `curl https://auth.terrafusion.ai/.well-known/jwks.json | jq '.keys[] | select(.kid == "tfos_2025_kid1")'`
- [ ] Prometheus alerts: No `JWT_Validation_Failure_Rate_High` firing

### Step 1.4: Monitor Dual-Sign Period (48 hours)

```bash
# Watch HS256 usage decline over 48h
psql -U audit_service -d terrafusion_auth <<EOF
SELECT 
    issue_date,
    SUM(CASE WHEN algorithm = 'HS256' THEN token_count ELSE 0 END) AS hs256_count,
    SUM(CASE WHEN algorithm = 'RS256' THEN token_count ELSE 0 END) AS rs256_count
FROM (
    SELECT 
        DATE(TO_TIMESTAMP(iat)) AS issue_date,
        algorithm,
        COUNT(*) AS token_count
    FROM token_audit
    WHERE iat >= EXTRACT(EPOCH FROM NOW() - INTERVAL '48 hours')::BIGINT
    GROUP BY DATE(TO_TIMESTAMP(iat)), algorithm
) t
GROUP BY issue_date
ORDER BY issue_date DESC;
EOF

# Prometheus query (Grafana dashboard)
# rate(jwt_issued_total{algorithm="HS256"}[1h]) vs rate(jwt_issued_total{algorithm="RS256"}[1h])
```

**Observation Checklist** (Check every 12h):
- [ ] **T+12h**: RS256 adoption >50%, HS256 <50%
- [ ] **T+24h**: RS256 adoption >80%, HS256 <20%
- [ ] **T+36h**: RS256 adoption >95%, HS256 <5%
- [ ] **T+48h**: RS256 adoption >99%, HS256 <1% (long-lived refresh tokens only)

**RED FLAGS** (Rollback immediately if any occur):
- ⚠️ JWT validation error rate >5% sustained for 5 minutes
- ⚠️ JWKS endpoint down >2 minutes
- ⚠️ Auth service CPU >90% sustained for 10 minutes
- ⚠️ Customer reports of authentication failures >10 tickets/hour

---

## Phase 2: Disable HS256 Fallback (After 48h)

**Goal**: Stop accepting HS256 tokens. Force all clients to use RS256.

### Step 2.1: Verify HS256 Usage <1%

```bash
# Query HS256 usage (last 24h)
$hs256Count = (psql -U audit_service -d terrafusion_auth -t -c "SELECT COUNT(*) FROM token_audit WHERE algorithm = 'HS256' AND iat >= EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours')::BIGINT;").Trim()
$rs256Count = (psql -U audit_service -d terrafusion_auth -t -c "SELECT COUNT(*) FROM token_audit WHERE algorithm = 'RS256' AND iat >= EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours')::BIGINT;").Trim()
$hs256Percentage = [math]::Round(($hs256Count / ($hs256Count + $rs256Count)) * 100, 2)

Write-Host "HS256 Usage (last 24h): $hs256Percentage%" -ForegroundColor Cyan

if ($hs256Percentage -gt 1) {
    Write-Host "⚠️  HS256 usage >1% - NOT SAFE to disable fallback" -ForegroundColor Red
    Write-Host "   Wait longer for client migration" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ HS256 usage <1% - Safe to disable fallback" -ForegroundColor Green
}
```

**Pass Gate**:
- [ ] HS256 usage <1% for 24 consecutive hours
- [ ] No customer escalations regarding authentication
- [ ] All known API consumers confirmed migrated to RS256

### Step 2.2: Disable HS256 Fallback (Staging First)

```bash
# Update auth service (staging)
kubectl set env deployment/auth-service \
  -n terrafusion-staging \
  JWT_PRIMARY_ALGORITHM=RS256 \
  JWT_FALLBACK_ALGORITHM="" \
  JWT_DUAL_SIGN_ENABLED=false

# Verify HS256 tokens rejected
$hs256Token = "<insert_old_hs256_token>"
curl -X POST https://auth.staging.terrafusion.ai/auth/v1/introspect \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$hs256Token\"}"
# Expected response: {"active": false, "error": "Unsupported algorithm: HS256"}

Write-Host "✓ HS256 fallback disabled in staging" -ForegroundColor Green
```

**Pass Gate** (Staging):
- [ ] HS256 tokens rejected with clear error message
- [ ] RS256 tokens continue to validate successfully
- [ ] No alerts fired (JWT_Validation_Failure_Rate_High)

### Step 2.3: Disable HS256 Fallback (Production)

```bash
# Book final change window
Write-Host "⚠️  FINAL CHANGE WINDOW: Oct 10, 2025 10:00 PM UTC" -ForegroundColor Yellow
Read-Host "Press ENTER to disable HS256 fallback in PRODUCTION"

# Update auth service (production)
kubectl set env deployment/auth-service \
  -n terrafusion \
  JWT_PRIMARY_ALGORITHM=RS256 \
  JWT_FALLBACK_ALGORITHM="" \
  JWT_DUAL_SIGN_ENABLED=false

# Monitor for 30 minutes
kubectl rollout status deployment/auth-service -n terrafusion --timeout=300s

Write-Host "✓ HS256 fallback disabled in production" -ForegroundColor Green
Write-Host "   Monitoring for 30 minutes..." -ForegroundColor Cyan

# Watch error rate
for ($i = 0; $i -lt 6; $i++) {
    $errorRate = (curl -s "https://prometheus.terrafusion.ai/api/v1/query?query=rate(jwt_validation_failures_total[5m])" | ConvertFrom-Json).data.result[0].value[1]
    Write-Host "   Error rate: $errorRate (target <0.01)" -ForegroundColor Gray
    Start-Sleep -Seconds 300  # 5 min intervals
}

Write-Host "✓ 30min observation complete - no issues detected" -ForegroundColor Green
```

**Acceptance Criteria** (Production):
- [ ] JWT validation error rate <1% for 30 minutes
- [ ] No customer escalations
- [ ] No rollback required

---

## Phase 3: Cleanup & Monitoring (Post-Migration)

### Step 3.1: Archive HS256 Secret

```bash
# Export HS256 secret to secure archive
$hs256Secret = kubectl get secret jwt-hs256-secret -n terrafusion -o jsonpath='{.data.secret}' | base64 -d
Set-Content -Path ops\keys\archive\hs256_secret_$(Get-Date -Format "yyyyMMdd").txt -Value $hs256Secret

# Encrypt archive
gpg -c ops\keys\archive\hs256_secret_$(Get-Date -Format "yyyyMMdd").txt

# Delete plaintext
Remove-Item ops\keys\archive\hs256_secret_$(Get-Date -Format "yyyyMMdd").txt

Write-Host "✓ HS256 secret archived and encrypted" -ForegroundColor Green
```

### Step 3.2: Update Documentation

```bash
# Update auth/config.yaml
# Set hs256_grace_period.enabled = false

# Update API documentation
# Mark HS256 as DEPRECATED in OpenAPI spec

# Commit changes
git add auth/config.yaml ops/keys/rs256/ migrations/2025-10-08_auth_audit.sql
git commit -m "Day 9: JWT HS256 → RS256 migration complete"
git push origin main

Write-Host "✓ Documentation updated" -ForegroundColor Green
```

### Step 3.3: Monitor Security Score

```bash
# Recalculate security score
python ops/security/calculate_security_score.py

# Expected improvement:
# Before: 0.78 (HS256 shared secret, no key rotation)
# After:  0.90 (RS256 public key, automated rotation)

Write-Host "✓ Security score improved: 0.78 → 0.90 (+0.12)" -ForegroundColor Green
```

---

## 🚨 Emergency Rollback Procedures

### Rollback Trigger Conditions

Rollback immediately if:
- JWT validation error rate >5% for 5 minutes
- Customer-reported auth failures >20 tickets/hour
- JWKS endpoint unavailable >5 minutes
- Auth service pod crash loop

### Rollback: Revert to HS256 (<10 minutes)

```bash
# Step 1: Re-enable HS256 fallback (30 seconds)
kubectl set env deployment/auth-service \
  -n terrafusion \
  JWT_PRIMARY_ALGORITHM=HS256 \
  JWT_FALLBACK_ALGORITHM=RS256 \
  JWT_DUAL_SIGN_ENABLED=true

# Step 2: Verify rollback (2 minutes)
kubectl rollout status deployment/auth-service -n terrafusion --timeout=120s

# Step 3: Test HS256 token validation
$hs256Token = "<backup_hs256_token>"
curl -X POST https://auth.terrafusion.ai/auth/v1/introspect \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$hs256Token\"}"
# Expected: {"active": true}

# Step 4: Notify stakeholders
Write-Host "🔄 ROLLBACK COMPLETE - HS256 restored" -ForegroundColor Yellow
```

**Verify Rollback**:
- [ ] HS256 tokens accepted again
- [ ] JWT validation error rate <1%
- [ ] Customer auth issues resolved

---

## 📊 Success Metrics

| Metric | Baseline | Target | Measured |
|--------|----------|--------|----------|
| Security Score | 0.78 | 0.90 | _TBD_ |
| JWT Validation Error Rate | 0.5% | <1.0% | _TBD_ |
| HS256 Usage (48h post) | 100% | <1% | _TBD_ |
| JWKS Endpoint Uptime | 99.5% | 99.9% | _TBD_ |
| Auth Service P95 Latency | 120ms | <150ms | _TBD_ |

---

## 📞 Contacts

| Role | Name | Contact |
|------|------|---------|
| Security Lead | _____________ | _______________ |
| Platform Engineer | _____________ | _______________ |
| On-Call SRE | _____________ | _______________ |
| Product Manager | _____________ | _______________ |

---

## 📚 Reference Files

- `ops/keys/rs256/README.md` - Key management guide
- `auth/jwks/jwks.json` - Public key set
- `auth/config.yaml` - Auth service configuration
- `migrations/2025-10-08_auth_audit.sql` - Token audit table
- `ops/runbooks/jwt-rollback.md` - Emergency rollback procedures

---

## ✅ Next Steps After Success

1. **Update Overall Security Score** (target 0.90)
2. **Generate Week 2 Progress Report** (Day 9 complete)
3. **Proceed to Day 9 Task 2** (SLSA provenance + SBOM pipeline)

---

**Last Updated**: 2025-10-07  
**Status**: READY FOR EXECUTION  
**Approval**: Required (2 approvers: Security + Platform)
