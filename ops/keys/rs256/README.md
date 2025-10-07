# RS256 Key Management for TerraFusion OS

## Overview

This directory contains RSA key pairs for JWT RS256 signing. Migration from HS256 to RS256 provides:
- **Public key distribution** via JWKS endpoint (no shared secrets)
- **Key rotation** without service disruption
- **Multi-tenant security** (per-client key isolation)
- **Compliance** (NIST, SOC2, FedRAMP requirements)

---

## Key Generation

### Generate New RS256 Key Pair

```bash
# Generate private key (2048-bit RSA, PKCS#8 format)
openssl genrsa -out tfos_kid1.pem 2048

# Extract public key
openssl rsa -in tfos_kid1.pem -pubout -out tfos_kid1.pub

# Generate key ID (kid) - SHA256 thumbprint
openssl rsa -in tfos_kid1.pem -pubout -outform DER | \
  openssl dgst -sha256 -binary | \
  openssl base64 | \
  tr -d '=' | tr '/+' '_-' | cut -c1-32 > tfos_kid1.kid

# Expected kid format: "tfos_2025_kid1_a1b2c3d4"
```

### Convert to JWK Format (for JWKS endpoint)

```bash
# Install helper tool
npm install -g pem-jwk

# Convert public key to JWK
pem-jwk tfos_kid1.pub > tfos_kid1.jwk

# Add metadata
jq '. + {
  "use": "sig",
  "alg": "RS256",
  "kid": "tfos_2025_kid1",
  "kty": "RSA"
}' tfos_kid1.jwk > tfos_kid1_final.jwk
```

---

## Key Rotation Strategy

### Current Active Keys

| kid | Created | Expires | Status | Revoked |
|-----|---------|---------|--------|---------|
| `tfos_2025_kid1` | 2025-10-07 | 2026-10-07 | ACTIVE | - |
| `tfos_2024_kid0` | 2024-10-01 | 2025-10-01 | DEPRECATED | - |

### Rotation Schedule

- **Active key lifetime**: 12 months
- **Grace period**: 30 days (dual-sign both old + new)
- **Emergency rotation**: <4 hours (security incident)
- **Automated rotation**: GitHub Actions workflow (30 days before expiry)

### Rotation Procedure

```bash
# 1. Generate new key pair (kid2)
bash ops/keys/rs256/generate-keypair.sh tfos_2025_kid2

# 2. Update JWKS endpoint (add kid2, keep kid1)
cp auth/jwks/jwks.json auth/jwks/jwks.backup.json
jq '.keys += [input]' auth/jwks/jwks.json ops/keys/rs256/tfos_kid2.jwk > auth/jwks/jwks_new.json
mv auth/jwks/jwks_new.json auth/jwks/jwks.json

# 3. Update auth service config (dual-sign)
kubectl set env deployment/auth-service \
  JWT_SIGNING_KEYS="kid1:$(cat tfos_kid1.pem | base64 -w0),kid2:$(cat tfos_kid2.pem | base64 -w0)" \
  JWT_DEFAULT_KID="kid2"

# 4. Wait 30 days (allow client cache refresh)

# 5. Remove old key from JWKS
jq '.keys = [.keys[] | select(.kid != "tfos_2025_kid1")]' auth/jwks/jwks.json > auth/jwks/jwks_rotated.json
mv auth/jwks/jwks_rotated.json auth/jwks/jwks.json

# 6. Archive old private key (compliance)
tar -czf ops/keys/rs256/archive/tfos_kid1_$(date +%Y%m%d).tar.gz tfos_kid1.pem tfos_kid1.pub
shred -u tfos_kid1.pem  # Secure delete
```

---

## Security Best Practices

### Private Key Protection

- **Never commit private keys to Git** (use `.gitignore`)
- **Store in secrets manager**: GitHub Actions (encrypted secrets), KMS (AWS/Azure)
- **Encrypt at rest**: `gpg -c tfos_kid1.pem` (AES256)
- **Restrict access**: `chmod 600 tfos_kid1.pem`, owner-only read
- **Audit access**: CloudTrail (AWS), Azure Monitor, GitHub audit log

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
env:
  TFOS_RS256_PRIVATE: ${{ secrets.TFOS_RS256_PRIVATE }}  # Base64-encoded PEM

steps:
  - name: Decrypt signing key
    run: |
      echo "$TFOS_RS256_PRIVATE" | base64 -d > /tmp/signing_key.pem
      chmod 600 /tmp/signing_key.pem
  
  - name: Sign JWT for deployment
    run: |
      jwt encode --key /tmp/signing_key.pem \
        --alg RS256 \
        --kid tfos_2025_kid1 \
        --iss "https://auth.terrafusion.ai" \
        --aud "https://api.terrafusion.ai" \
        --exp $(($(date +%s) + 3600))
  
  - name: Cleanup
    if: always()
    run: shred -u /tmp/signing_key.pem
```

### Key Compromise Response

If private key is compromised:

1. **Immediate revocation** (< 1 hour)
   ```bash
   # Update JWKS with revoked key
   jq '.keys[] | select(.kid == "tfos_2025_kid1") |= . + {"revoked": true, "revoked_at": "'$(date -Iseconds)'"}' \
     auth/jwks/jwks.json > auth/jwks/jwks_revoked.json
   ```

2. **Generate emergency key** (kid_emergency)
   ```bash
   bash ops/keys/rs256/generate-keypair.sh tfos_2025_kid_emergency
   ```

3. **Force client revalidation** (invalidate caches)
   ```bash
   # Publish new JWKS with only emergency key
   jq '.keys = [input]' auth/jwks/jwks.json ops/keys/rs256/tfos_kid_emergency.jwk > auth/jwks/jwks_emergency.json
   ```

4. **Incident report** (within 24h)
   - Root cause analysis
   - Affected tokens count
   - Remediation timeline
   - Preventive measures

---

## Monitoring & Alerts

### Prometheus Metrics

```promql
# Key rotation health
sum(jwt_key_age_days{kid="tfos_2025_kid1"}) > 365  # Alert if key >1 year old

# Signing errors
rate(jwt_signing_errors_total{kid="tfos_2025_kid1"}[5m]) > 0.01  # >1% error rate

# JWKS endpoint availability
probe_success{job="jwks-endpoint"} < 1  # Endpoint down
```

### AlertManager Rules

```yaml
groups:
  - name: jwt_rs256_alerts
    interval: 30s
    rules:
      - alert: JWT_Key_Expiring_Soon
        expr: jwt_key_age_days > 335  # 30 days before expiry
        for: 1h
        annotations:
          summary: "JWT signing key {{$labels.kid}} expires in <30 days"
          runbook_url: "https://wiki.terrafusion.ai/runbooks/jwt-rotation"
      
      - alert: JWKS_Endpoint_Down
        expr: probe_success{job="jwks-endpoint"} < 1
        for: 5m
        annotations:
          summary: "JWKS endpoint unreachable - clients cannot validate tokens"
          severity: CRITICAL
```

---

## JWKS Endpoint Configuration

### Nginx Config

```nginx
# /etc/nginx/sites-available/auth.terrafusion.ai
server {
    listen 443 ssl http2;
    server_name auth.terrafusion.ai;

    location /.well-known/jwks.json {
        alias /var/www/auth/jwks.json;
        add_header Cache-Control "public, max-age=3600";  # 1h cache
        add_header Access-Control-Allow-Origin "*";
        
        # Rate limiting
        limit_req zone=jwks_zone burst=100 nodelay;
    }
}

# Rate limit zone
limit_req_zone $binary_remote_addr zone=jwks_zone:10m rate=10r/s;
```

### CDN Configuration (CloudFlare)

```json
{
  "cache": {
    "ttl": 3600,
    "edge_cache_ttl": 7200,
    "browser_cache_ttl": 1800
  },
  "security": {
    "hotlink_protection": false,
    "always_use_https": true
  },
  "performance": {
    "brotli": true,
    "http2": true
  }
}
```

---

## Compliance Requirements

### NIST 800-63B (Digital Identity Guidelines)

- ✅ Asymmetric key length ≥2048 bits (RSA)
- ✅ Key rotation every 12 months
- ✅ Cryptoperiod enforcement (automated expiry)
- ✅ Secure key storage (secrets manager)

### SOC2 Type II

- ✅ Key access audit trail (CloudTrail, GitHub audit log)
- ✅ Separation of duties (key generation ≠ deployment)
- ✅ Incident response plan (key compromise SOP)
- ✅ Change management (rotation approval workflow)

### FedRAMP Moderate

- ✅ FIPS 140-2 Level 1 (KMS encryption)
- ✅ Key destruction procedures (shred + verification)
- ✅ Continuous monitoring (Prometheus alerts)
- ✅ Configuration management (IaC, version control)

---

## Troubleshooting

### Invalid Signature Errors

```bash
# Verify public key matches private key
openssl rsa -in tfos_kid1.pem -pubout | diff - tfos_kid1.pub
# Expected: no output (files match)

# Test JWT signing
jwt encode --key tfos_kid1.pem --alg RS256 --kid tfos_2025_kid1 \
  --iss "https://auth.terrafusion.ai" \
  --sub "test_user" \
  --exp $(($(date +%s) + 60))

# Verify JWT signature
jwt decode --key tfos_kid1.pub --alg RS256 <token>
```

### JWKS Endpoint Not Updating

```bash
# Check JWKS file modification time
ls -lh auth/jwks/jwks.json

# Verify JWKS JSON structure
jq . auth/jwks/jwks.json  # Should parse without errors

# Test CDN cache purge
curl -X PURGE https://auth.terrafusion.ai/.well-known/jwks.json

# Check client cache
curl -I https://auth.terrafusion.ai/.well-known/jwks.json | grep -i cache
```

### Key Not Found (kid mismatch)

```bash
# List all kids in JWKS
jq -r '.keys[].kid' auth/jwks/jwks.json

# Check auth service config
kubectl get deployment auth-service -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="JWT_DEFAULT_KID")].value}'

# Verify JWT header
jwt decode --no-verify <token> | jq -r '.header.kid'
```

---

## References

- [RFC 7517: JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517)
- [RFC 7518: JSON Web Algorithms (JWA)](https://tools.ietf.org/html/rfc7518)
- [NIST 800-63B: Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: 2025-10-07  
**Owner**: Security Team  
**Reviewers**: @security-team, @platform-team  
**Approval**: Required for key rotation (2 approvers)
