# SC-13: Cryptographic Protection — FIPS 140-2 Validation Evidence

**Control Family**: System and Communications Protection (SC)
**Control**: SC-13 Cryptographic Protection
**Baseline**: FISMA-HIGH
**Status**: Implemented (Phase 4 Sprint 2)
**Last Verified**: March 8, 2026

---

## 1. Requirement

NIST SP 800-53 SC-13 requires that the information system implements FIPS-validated cryptography
in accordance with applicable federal laws, executive orders, directives, policies, regulations,
and standards.

**Key requirement**: Cryptographic operations MUST use a FIPS 140-2 validated cryptographic module
listed on the [NIST CMVP](https://csrc.nist.gov/projects/cryptographic-module-validation-program).

---

## 2. Cryptographic Modules in Use

### Windows Deployment

| Property | Value |
|----------|-------|
| Module | Windows Cryptographic Next Generation (CNG) |
| Binary | `bcrypt.dll` |
| CMVP Certificate | [#3197](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/3197) |
| Validation Level | FIPS 140-2 Level 1 |
| OS Requirement | Windows Server 2019+ with FIPS Group Policy enabled |

### Linux Deployment

| Property | Value |
|----------|-------|
| Module | OpenSSL 3.0 FIPS Provider |
| Binary | `fips.so` (OpenSSL FIPS module) |
| CMVP Certificate | [#4282](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4282) |
| Validation Level | FIPS 140-2 Level 1 |
| OS Requirement | `fips_enabled=1` in `/proc/sys/crypto/fips_enabled` |

### Azure Key Vault (Key Management)

| Property | Value |
|----------|-------|
| Module | Azure Key Vault Managed HSM |
| CMVP Certificate | [#4218](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4218) |
| Validation Level | FIPS 140-2 Level 2 |
| Usage | JWT signing key storage (production) |

---

## 3. Algorithms in Use

| Algorithm | Purpose | FIPS Approved | Standard |
|-----------|---------|---------------|----------|
| HMAC-SHA256 | JWT token signing | Yes | FIPS 198-1 |
| HMAC-SHA512 | Legacy JWT signing (being migrated) | Yes | FIPS 198-1 |
| PBKDF2-SHA256 | Password key derivation | Yes | SP 800-132 |
| AES-256-GCM | Data encryption at rest | Yes | FIPS 197 + SP 800-38D |
| SHA-256 | Content hashing, audit signatures | Yes | FIPS 180-4 |
| CSPRNG | Token/nonce generation | Yes | SP 800-90A (CTR_DRBG) |

---

## 4. Startup Validation

TerraFusion implements `FipsValidationService` (IHostedService) that runs at application startup:

1. Reads `FeatureFlags:EnforceFipsCompliance` from configuration
2. Detects host OS FIPS mode:
   - **Windows**: Checks `DOTNET_SYSTEM_SECURITY_CRYPTOGRAPHY_USEFIPSALGORITHMS` environment variable
   - **Linux**: Reads `/proc/sys/crypto/fips_enabled` kernel parameter
3. **Production**: Throws `InvalidOperationException` if FIPS not detected (prevents startup)
4. **Development**: Logs warning but allows startup

**Configuration**:
```json
{
  "FeatureFlags": {
    "EnforceFipsCompliance": true
  }
}
```

---

## 5. Key Rotation Procedures

| Key | Rotation Frequency | Procedure |
|-----|-------------------|-----------|
| JWT Signing Key | 90 days | Update `JWT_SECRET` env var, rolling restart |
| Encryption Key | 180 days | Update `ENCRYPTION_KEY` env var, re-encrypt at rest |
| Redis Auth Keys | Session TTL | Auto-expire via Redis TTL |

---

## 6. Audit Evidence

- Startup log entry: `FIPS 140-2 validated: Module=..., Evidence=...`
- Configuration: `FeatureFlags:EnforceFipsCompliance=true` in production
- Module version verified via OS package manager
- Quarterly review scheduled in compliance calendar

---

## 7. Deployment Checklist

- [ ] Verify host OS FIPS mode enabled
  - Windows: `gpedit.msc` → Computer Configuration → Windows Settings → Security Settings → Local Policies → Security Options → "System cryptography: Use FIPS compliant algorithms"
  - Linux: `cat /proc/sys/crypto/fips_enabled` returns `1`
- [ ] Set environment variable: `DOTNET_SYSTEM_SECURITY_CRYPTOGRAPHY_USEFIPSALGORITHMS=1`
- [ ] Set `FeatureFlags:EnforceFipsCompliance=true` in production config
- [ ] Verify startup log shows FIPS validation success
- [ ] Record CMVP certificate number in deployment manifest

---

*Document Owner: Security Compliance Team*
*Review Cycle: Quarterly*
*Classification: Internal — Government Use*
