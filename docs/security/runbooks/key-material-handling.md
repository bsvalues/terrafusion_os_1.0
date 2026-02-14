# Key Material Handling

> **TerraFusion OS — Security Operations**
> **Last Updated:** 2026-02-13
> **Classification:** Internal — Security Operations
> **Owner:** Security Operations Team

---

## Generation

### Format expected by `Material`

The `Material` field in `Security:Encryption:Keys[]` accepts a **base64-encoded byte array**. The `KeyRingProvider` derives the actual AES-256 key from this material using HKDF-SHA256 with the info string `TerraFusion.Security.EncryptionKey/v1/{keyId}`.

### Minimum requirements

| Property | Requirement |
|----------|-------------|
| Minimum length | 16 bytes (128 bits) after base64 decode |
| Recommended length | **32 bytes (256 bits)** |
| Entropy source | Cryptographically secure random number generator (CSPRNG) |
| Encoding | Standard base64 (RFC 4648) |

### Generation commands

**Python (recommended):**
```bash
python3 -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

**OpenSSL:**
```bash
openssl rand -base64 32
```

**PowerShell (.NET):**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**C# (programmatic):**
```csharp
using System.Security.Cryptography;
var material = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
```

### What NOT to use

- Password-derived strings (use CSPRNG, not passphrases)
- Predictable patterns (`AAAA...`, `0123...`, repeated bytes)
- Keys from other systems (JWT secrets, database passwords, API keys)
- Online key generators (key material must never traverse untrusted networks)

---

## Storage

### Rules

| Rule | Rationale |
|------|-----------|
| **Never commit key material to source control** | Repo history is permanent; leaked keys cannot be un-leaked |
| **Never log key material** | Application logs may be stored in less-protected systems |
| **Never pass key material in CI job output** | CI logs are often broadly accessible |
| **Never include key material in error messages** | Exception messages may propagate to monitoring systems |
| **Store in a dedicated secret store** | Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, or equivalent |

### Secret store requirements

- Access control: Only authorized principals can read key material
- Audit logging: All read/write operations are logged
- Encryption at rest: Secret store encrypts stored values
- Versioning: Secret store supports version history for rollback

### Development environment exception

For **local development only**, key material may be placed in `appsettings.Development.json` which is `.gitignore`d. The `KeyRingProvider` provides a dev-fallback key when no config is present, but this fallback must never be used in staging or production.

### Environment variable injection

In deployment environments, inject keys via environment variables:

```
Security__Encryption__Keys__0__KeyId=k1-2026Q1
Security__Encryption__Keys__0__Material=<base64-value>
Security__Encryption__Keys__0__Active=false
Security__Encryption__Keys__1__KeyId=k2-2026Q2
Security__Encryption__Keys__1__Material=<base64-value>
Security__Encryption__Keys__1__Active=true
```

The double-underscore (`__`) convention maps to the nested JSON path per .NET configuration conventions.

---

## Rotation Rules

### KeyId uniqueness

- Every `KeyId` must be unique across the entire key ring (enforced at startup by `KeyRingProvider`)
- **Never reuse a `KeyId` with different material** — this would silently corrupt all ciphertext tagged with that `KeyId`
- If a key needs to be replaced, assign a new `KeyId`

### KeyId naming convention

```
k{sequence}-{year}Q{quarter}
```

Examples: `k1-2026Q1`, `k2-2026Q2`, `k3-2026Q3`

For emergency rotations: `k{sequence}-emergency-{YYYYMMDD}`

### Active key rule

- Exactly one key must have `Active: true` (enforced at startup by `KeyRingProvider`)
- The Active key is used for all new encrypt operations
- All keys in the ring (active and inactive) are available for decrypt

### Key lifecycle

```
Generated → Added (Inactive) → Activated → Deactivated → Retired (Removed)
```

| State | Config | Encrypt | Decrypt |
|-------|--------|---------|---------|
| Added (Inactive) | In ring, `Active: false` | No | Yes |
| Activated | In ring, `Active: true` | Yes | Yes |
| Deactivated | In ring, `Active: false` | No | Yes |
| Retired | Removed from ring | No | No — ciphertext is unrecoverable |

### Rotation cadence

| Environment | Recommended Cadence |
|-------------|---------------------|
| Development | As needed (no schedule) |
| Staging | Monthly or on-demand |
| Production | Quarterly (minimum), per agency security policy |

---

## Environment Separation

### Principle

Each environment (dev, staging, production) must use **completely independent key material**. Keys must never be shared across environments.

### Why

- A compromised dev key must not decrypt production data
- Test ciphertext must not be valid in production
- Audit trails must be environment-specific

### Implementation

| Environment | Key Ring Source | Key Material |
|-------------|----------------|--------------|
| Development | `appsettings.Development.json` or dev-fallback | Dev-only random keys |
| Staging | Secret store (staging instance) | Staging-only random keys |
| Production | Secret store (production instance) | Production-only random keys |

### Cross-environment checklist

- [ ] Dev keys are NOT present in staging or production configs
- [ ] Staging keys are NOT present in production configs
- [ ] Production key material is NOT accessible from dev or staging environments
- [ ] Each environment has its own `KeyId` namespace (recommended: prefix with env, e.g., `prod-k1-2026Q1`)
- [ ] Secret store access is scoped per environment (separate IAM roles / access policies)

### Migration between environments

If data must be migrated between environments (e.g., staging → production for testing):

1. **Decrypt** in the source environment using source keys
2. **Transfer** plaintext via a secure channel (encrypted transport, not stored in transit)
3. **Re-encrypt** in the target environment using target keys
4. **Never** copy key material between environments to "make it easier"

---

**Government. Transcended. Secured.** 🏛️
