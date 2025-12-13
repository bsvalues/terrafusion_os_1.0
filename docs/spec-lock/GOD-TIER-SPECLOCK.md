# 🜂 GOD-TIER SpecLock: Nation-State-Grade Software Integrity

> **"No single entity can corrupt the artifact chain."**

## Overview

GOD-TIER SpecLock implements **multi-authority cryptographic governance** with:
- **Dual-authority signing** (County + Vendor keys)
- **Quorum verification** (N-of-M signatures required)
- **Hardware-backed KMS** (AWS/Azure/GCP HSM signing)
- **Time-locked manifests** (nbf/exp validity windows)
- **Federated quorum constraints** (required authorities must sign)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOD-TIER SIGNING CEREMONY                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   COUNTY    │    │   VENDOR    │    │  AUDITOR    │        │
│   │  AUTHORITY  │    │  AUTHORITY  │    │ AUTHORITY   │        │
│   │  (HSM-1)    │    │  (HSM-2)    │    │  (HSM-3)    │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                │
│          ▼                  ▼                  ▼                │
│   ┌──────────────────────────────────────────────────┐         │
│   │              MANIFEST.JSON                       │         │
│   │  • sha256 hashes of all artifacts                │         │
│   │  • nbf: 2025-01-15T00:00:00Z (not-before)       │         │
│   │  • exp: 2025-07-15T00:00:00Z (expiration)       │         │
│   └──────────────────────────────────────────────────┘         │
│          │                  │                  │                │
│          ▼                  ▼                  ▼                │
│   ┌──────────────────────────────────────────────────┐         │
│   │           SIGNATURE BUNDLES                      │         │
│   │  bundles/benton_county.bundle.json               │         │
│   │  bundles/terrafusion_vendor.bundle.json          │         │
│   │  bundles/state_auditor.bundle.json               │         │
│   └──────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    QUORUM VERIFICATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Load AUTHORITIES.json (quorum=2, federated config)         │
│  2. Check time window: nbf ≤ now ≤ exp                         │
│  3. Verify each authority's signature bundle                    │
│  4. Count valid signatures ≥ quorum                            │
│  5. Check federated constraint: required_authorities signed     │
│                                                                 │
│  EXIT CODES:                                                    │
│    0 = ✅ All checks passed                                     │
│    2 = ❌ Quorum not met (N < required)                         │
│    3 = ❌ Time window violation (expired or not-yet-valid)      │
│    4 = ❌ Required authority missing (federated constraint)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Files

### AUTHORITIES.json

Location: `docs/spec-lock/AUTHORITIES.json`

```json
{
  "schema_version": "1.0",
  "quorum": 2,
  "federated_quorum": {
    "enabled": true,
    "required_authorities": ["benton_county"]
  },
  "authorities": [
    {
      "id": "benton_county",
      "name": "Benton County IT Security",
      "type": "county",
      "kms": {
        "provider": "local",
        "key_path": "keys/benton_county.pub"
      },
      "rotation_policy": {
        "max_age_days": 365,
        "overlap_window_days": 30
      }
    },
    {
      "id": "terrafusion_vendor",
      "name": "TerraFusion Vendor",
      "type": "vendor",
      "kms": {
        "provider": "aws",
        "key_ref": "awskms:///arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012"
      }
    }
  ]
}
```

## Scripts

### Sign with Multiple Authorities

```bash
# Dual-sign manifest (iterates all authorities)
./scripts/speclock-sign-manifest-multi.sh \
    artifacts/speclock/manifest.json \
    docs/spec-lock/AUTHORITIES.json \
    artifacts/speclock/bundles
```

### Verify Quorum

```bash
# Verify N-of-M signatures + time window + federated constraints
./scripts/speclock-verify-manifest-quorum.sh \
    artifacts/speclock/manifest.json \
    docs/spec-lock/AUTHORITIES.json \
    artifacts/speclock/bundles
```

### Sign with Hardware KMS

```bash
# AWS KMS signing (no keys on disk)
./scripts/speclock-sign-manifest-kms.sh \
    artifacts/speclock/manifest.json \
    aws \
    "awskms:///arn:aws:kms:us-west-2:123456789012:key/..." \
    artifacts/speclock/bundles/aws_authority.bundle.json

# Azure Key Vault signing
./scripts/speclock-sign-manifest-kms.sh \
    artifacts/speclock/manifest.json \
    azure \
    "azurekms://keyvault-name.vault.azure.net/keys/key-name" \
    artifacts/speclock/bundles/azure_authority.bundle.json

# GCP Cloud KMS signing
./scripts/speclock-sign-manifest-kms.sh \
    artifacts/speclock/manifest.json \
    gcp \
    "gcpkms://projects/proj/locations/loc/keyRings/ring/cryptoKeys/key/versions/1" \
    artifacts/speclock/bundles/gcp_authority.bundle.json
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TF_SPECLOCK_QUORUM_MODE` | `false` | Enable multi-authority quorum verification |
| `TF_SPECLOCK_TIME_ENFORCEMENT` | `false` | Enforce nbf/exp time windows |
| `TF_SPECLOCK_AUTHORITIES_PATH` | `docs/spec-lock/AUTHORITIES.json` | Path to authorities registry |
| `TF_SPECLOCK_BUNDLES_PATH` | `artifacts/speclock/bundles` | Path to signature bundles |
| `TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH` | - | Single-key mode (MYTHIC tier) |

## Manifest v2.0 Format

```json
{
  "version": "2.0",
  "generated_at": "2025-01-15T12:00:00Z",
  "nbf": "2025-01-15T00:00:00Z",
  "exp": "2025-07-15T00:00:00Z",
  "files": {
    "backend/TerraFusion.API/bin/Release/net8.0/TerraFusion.API.dll": {
      "sha256": "abc123..."
    }
  }
}
```

## CI Integration

The CI pipeline runs GOD-TIER verification in Step 9:

```bash
# Enable GOD-TIER in CI
export TF_SPECLOCK_QUORUM_MODE=true
export TF_SPECLOCK_TIME_ENFORCEMENT=true

# Run CI (includes quorum verification)
./scripts/speclock-ci.sh
```

## Runtime Enforcement

On startup, `SpecLockGuardHostedService` performs:

1. **Load manifest** from `artifacts/speclock/manifest.json`
2. **Verify time window** (if `TF_SPECLOCK_TIME_ENFORCEMENT=true`)
3. **Verify signatures**:
   - **Single-key mode**: Standard cosign verify
   - **Quorum mode**: Load authorities, verify each bundle, check quorum + federation
4. **Fail-secure**: Any violation = immediate startup halt

## /ops/speclock/proof Endpoint

Returns cryptographic evidence for audit:

```json
{
  "manifest_hash": "sha256:abc123...",
  "manifest_nbf": "2025-01-15T00:00:00Z",
  "manifest_exp": "2025-07-15T00:00:00Z",
  "quorum_mode": true,
  "time_enforcement": true,
  "authority_bundles": [
    {
      "authority": "benton_county",
      "bundle": "bundles/benton_county.bundle.json",
      "exists": true
    },
    {
      "authority": "terrafusion_vendor",
      "bundle": "bundles/terrafusion_vendor.bundle.json",
      "exists": true
    }
  ],
  "authorities_registry": {
    "quorum": 2,
    "federated_quorum": {
      "enabled": true,
      "required_authorities": ["benton_county"]
    }
  },
  "verified_at": "2025-01-15T12:00:00Z"
}
```

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Single compromised key | Quorum requires N-of-M signatures |
| Key theft | HSM-backed keys never leave hardware |
| Replay attacks | Time-locked manifests (nbf/exp) |
| Vendor-only control | Federated quorum requires county signature |
| Key rotation gaps | 30-day overlap window policy |
| Offline attacks | Runtime verification on every startup |

## Key Rotation Ceremony

1. **Generate new key** for authority (HSM or local)
2. **Update AUTHORITIES.json** with new key reference
3. **Sign manifest with BOTH old and new keys** during overlap window
4. **After 30 days**, remove old key from authorities
5. **Never delete old bundles** (audit trail preservation)

## Prometheus Metrics

```prometheus
# Quorum verification results
speclock_quorum_signatures_total{result="valid"} 2
speclock_quorum_signatures_total{result="invalid"} 0

# Time window status
speclock_time_window_valid 1

# Authority verification
speclock_authority_verified{authority="benton_county"} 1
speclock_authority_verified{authority="terrafusion_vendor"} 1
```

## Alerting

```yaml
# Alert on quorum failure
- alert: SpecLockQuorumFailure
  expr: speclock_quorum_status != 1
  for: 0m
  labels:
    severity: critical
  annotations:
    summary: "SpecLock quorum verification failed"
    description: "Required signature quorum not met - potential supply chain attack"

# Alert on approaching expiration
- alert: SpecLockManifestExpiringSoon
  expr: (speclock_manifest_exp_timestamp - time()) < 7 * 24 * 3600
  for: 0m
  labels:
    severity: warning
  annotations:
    summary: "SpecLock manifest expires in <7 days"
    description: "Manifest expiration approaching - initiate re-signing ceremony"
```

---

**🜂 GOD-TIER: No single entity can corrupt the artifact chain. 🜂**
