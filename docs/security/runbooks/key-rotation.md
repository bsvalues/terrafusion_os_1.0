# Key Rotation Runbook

> **TerraFusion OS — Security Operations**
> **Last Updated:** 2026-02-13
> **Classification:** Internal — Security Operations
> **Owner:** Security Operations Team
> **Review Cadence:** Quarterly (minimum), or after any rotation event

---

## Scope

### What this rotates

- **Security encryption keys** managed by the `IKeyRingProvider` key ring (`Security:Encryption:Keys[]`)
- These keys protect data-at-rest fields encrypted via `IEncryptionService` / `IQuantumResistantEncryptionService`

### What this does NOT rotate

| Secret | Owner | Separate Runbook Required |
|--------|-------|---------------------------|
| JWT signing secrets (`JwtSettings:SecretKey`) | Auth team | Yes |
| Database credentials | DBA team | Yes |
| API keys (third-party) | Integration team | Yes |
| TLS certificates | Infrastructure team | Yes |

**Rationale:** Encryption keys are decoupled from JWT signing (Phase 5.1 key separation). Rotating encryption keys has zero impact on authentication tokens.

---

## Prerequisites

### Access required

- **Config write access** to the environment's secret store (Azure Key Vault / AWS Secrets Manager / appsettings override)
- **Deployment permissions** for the target environment (dev / staging / production)
- **Log read access** to verify decrypt operations post-rotation

### Where config lives

| Environment | Config Location |
|-------------|-----------------|
| Development | `appsettings.Development.json` → `Security:Encryption:Keys[]` |
| Staging | Secret store → injected as environment variables |
| Production | Secret store → injected as environment variables |

**Environment variable override pattern:**
```
Security__Encryption__Keys__0__KeyId=k1-2026Q1
Security__Encryption__Keys__0__Material=<base64-encoded-32-bytes>
Security__Encryption__Keys__0__Active=false
Security__Encryption__Keys__1__KeyId=k2-2026Q2
Security__Encryption__Keys__1__Material=<base64-encoded-32-bytes>
Security__Encryption__Keys__1__Active=true
```

### Required tooling

- `dotnet` SDK 8.0+ (to run verification tests)
- Deployment tool for the target environment (GitHub Actions / deploy script)
- Log access tool (Grafana / Kibana / `kubectl logs`)
- Key generation tool (see [Key Material Handling](key-material-handling.md))

---

## Key Ring Schema

The key ring is configured in `Security:Encryption:Keys[]` as an array of key entries:

```json
{
  "Security": {
    "Encryption": {
      "Keys": [
        { "KeyId": "k1-2026Q1", "Material": "<base64-32-bytes>", "Active": false },
        { "KeyId": "k2-2026Q2", "Material": "<base64-32-bytes>", "Active": true }
      ]
    }
  }
}
```

### Invariants enforced by `KeyRingProvider`

| Rule | Enforcement | Failure Mode |
|------|-------------|--------------|
| Exactly one key has `Active: true` | Startup validation | Application refuses to start |
| All `KeyId` values are unique | Startup validation | Application refuses to start |
| `Material` is at least 16 bytes (base64-decoded) | Startup validation | Application refuses to start |
| `KeyId` is never reused with different material | Operational policy (not code-enforced) | Data corruption risk |

### Ciphertext format

All ciphertext produced by the active key follows this format:

```
keyId:nonce(base64):tag(base64):cipher(base64)
```

- **Encrypt** always uses the `Active` key
- **Decrypt** resolves the key by `keyId` prefix (any known key in the ring)
- Legacy 3-part format (`nonce:tag:cipher`) is decrypt-only using the active key

---

## Rotation Procedure

### Step 1 — Generate new key material

```bash
# Generate 32 bytes of cryptographically secure random material
# See: docs/security/runbooks/key-material-handling.md
python3 -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

Record the output. This is the `Material` value for the new key.

Choose a `KeyId` following the naming convention: `k{sequence}-{year}Q{quarter}` (e.g., `k3-2026Q2`).

### Step 2 — Add new key as INACTIVE

Update the config source (secret store or appsettings) to add the new key with `Active: false`:

```json
{
  "Security": {
    "Encryption": {
      "Keys": [
        { "KeyId": "k1-2026Q1", "Material": "<old-material>", "Active": false },
        { "KeyId": "k2-2026Q2", "Material": "<current-material>", "Active": true },
        { "KeyId": "k3-2026Q3", "Material": "<new-material>", "Active": false }
      ]
    }
  }
}
```

### Step 3 — Deploy (new key inactive)

Deploy the updated configuration. This is a **no-op** for encryption behavior:

- Encrypt still uses `k2-2026Q2` (the current Active key)
- Decrypt now recognizes `k3-2026Q3` if any ciphertext references it (none will yet)
- **Verify:** Application starts without errors. Check logs for `KeyRingProvider` initialization.

### Step 4 — Flip Active to new key

Update the config to set the new key as `Active: true` and the old active key to `Active: false`:

```json
{
  "Security": {
    "Encryption": {
      "Keys": [
        { "KeyId": "k1-2026Q1", "Material": "<old-material>", "Active": false },
        { "KeyId": "k2-2026Q2", "Material": "<current-material>", "Active": false },
        { "KeyId": "k3-2026Q3", "Material": "<new-material>", "Active": true }
      ]
    }
  }
}
```

### Step 5 — Deploy (new key active)

Deploy the updated configuration. This **changes encryption behavior**:

- Encrypt now uses `k3-2026Q3`
- Decrypt still handles `k1-2026Q1` and `k2-2026Q2` ciphertext

### Step 6 — Observe

Monitor for **24-48 hours** (or one full business cycle):

- Search logs for `CryptographicException` or "unknown key" errors
- Verify new ciphertext begins with `k3-2026Q3:` prefix
- Confirm decrypt of old ciphertext (created with `k2-2026Q2` or `k1-2026Q1`) succeeds

---

## Verification

After each deploy step, verify the following:

### Automated verification (run from repo root)

```bash
dotnet test backend/tests/TerraFusion.Security.Tests/TerraFusion.Security.Tests.csproj -c Release -v minimal
```

All key ring acceptance tests must pass (53+ tests).

### Manual verification checklist

- [ ] Application starts without `InvalidOperationException` from `KeyRingProvider`
- [ ] New encrypt operations produce ciphertext with the new `keyId` prefix
- [ ] Decrypt of ciphertext created with previous active key(s) succeeds
- [ ] Decrypt of tampered ciphertext still throws `CryptographicException` (GCM integrity)
- [ ] No "unknown key" errors in application logs
- [ ] Health check endpoints return healthy status

---

## Rollback

If issues are detected after flipping the Active key:

### Step 1 — Revert Active to previous key

```json
{
  "Security": {
    "Encryption": {
      "Keys": [
        { "KeyId": "k1-2026Q1", "Material": "<old-material>", "Active": false },
        { "KeyId": "k2-2026Q2", "Material": "<current-material>", "Active": true },
        { "KeyId": "k3-2026Q3", "Material": "<new-material>", "Active": false }
      ]
    }
  }
}
```

### Step 2 — Deploy rollback

Deploy the reverted configuration. Encryption immediately reverts to the previous key.

### Step 3 — Handle ciphertext produced during the window

Any ciphertext encrypted with `k3-2026Q3` during the active window is **still decryptable** because `k3-2026Q3` remains in the ring (just inactive). No data is lost.

### Step 4 — Investigate

Determine the root cause before attempting rotation again. Common causes:

- Misconfigured `Material` (wrong base64 encoding)
- `KeyId` collision with an existing key
- Application cache holding stale key ring (restart required)

---

## Post-Rotation Cleanup

### When to retire old keys

A key may be retired (removed from the ring) when **all** of the following are true:

1. No ciphertext encrypted with that key exists in any active data store
2. All backups containing ciphertext from that key have expired per retention policy
3. The key has been inactive for at least **one full retention period** (default: 90 days)

### Retirement procedure

1. Confirm all data re-encrypted or migrated (query data stores for `keyId:` prefix)
2. Remove the key entry from config
3. Deploy
4. Verify no `CryptographicException` errors for 24 hours
5. Document retirement in the [Key Rotation Checklist](templates/key-rotation-checklist.md)

### Retention period guidance

| Environment | Minimum Retention (Inactive Keys) |
|-------------|-----------------------------------|
| Development | 7 days |
| Staging | 30 days |
| Production | 90 days (or per agency data retention policy) |

---

## Evidence Capture

After completing a rotation, capture the following for the audit trail:

### Required artifacts

1. **Completed rotation checklist** — [Template](templates/key-rotation-checklist.md)
2. **Test results** — Output of `dotnet test` showing all security tests pass
3. **Evidence pack** — Run the evidence pack generator:
   ```bash
   node scripts/phase4-evidence-pack.mjs
   ```
   This produces `evidence-pack-latest.json` with cryptographic hashes of all security artifacts.
4. **Log excerpt** — Relevant log entries showing successful encrypt/decrypt with new key

### Storage

- Evidence packs are committed to the repo (or attached to the PR) at `evidence-pack-latest.json`
- Completed checklists are stored in the project's audit trail (PR description or linked document)
- For FISMA audits, evidence packs are retained for the compliance retention period (typically 3 years)

---

**Government. Transcended. Rotated.** 🏛️
