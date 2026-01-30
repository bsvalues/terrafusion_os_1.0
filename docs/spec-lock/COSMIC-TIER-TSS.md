# 🜄🜁🜂🜃 COSMIC TIER: True Threshold Signatures (FROST-Ed25519)

> **"One signature. k-of-n cooperation required. Nation-state-grade integrity."**

## What is COSMIC TIER?

COSMIC TIER implements **true threshold cryptography** using FROST-Ed25519:

- **k-of-n participants** must cooperate to sign
- Produces **ONE signature** (not multiple)
- Verified with **ONE group public key**
- No single party can forge or rotate unilaterally
- Mathematically impossible to sign without quorum

This is fundamentally different from GOD-TIER (multiple independent signatures):

| Feature | GOD-TIER (Quorum) | COSMIC (TSS) |
|---------|-------------------|--------------|
| Signatures | Multiple (one per authority) | ONE combined |
| Verification | Check N signatures | Check 1 signature |
| Public Keys | One per authority | One group key |
| Forgery | Compromise k keys to forge k sigs | Compromise k keys AND coordinate |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    COSMIC TSS SIGNING FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   DKG CEREMONY (ONE TIME)                                      │
│   ════════════════════════                                      │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│   │ Benton  │  │ Yakima  │  │ Vendor  │                        │
│   │ County  │  │ County  │  │         │                        │
│   │ (P1)    │  │ (P2)    │  │ (P3)    │                        │
│   └────┬────┘  └────┬────┘  └────┬────┘                        │
│        │            │            │                              │
│        └────────────┼────────────┘                              │
│                     ▼                                           │
│            ┌───────────────┐                                    │
│            │  GROUP.PUB    │  ← ONE public key                 │
│            │  (shared)     │                                    │
│            └───────────────┘                                    │
│                                                                 │
│   SIGNING CEREMONY (PER RELEASE)                               │
│   ══════════════════════════════                                │
│        ┌─────────────────────────────────┐                      │
│        │      MANIFEST.JSON              │                      │
│        │  (sha256 hashes + time window)  │                      │
│        └─────────────┬───────────────────┘                      │
│                      │                                          │
│        ┌─────────────┼─────────────┐                            │
│        ▼             ▼             ▼                            │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│   │ Share 1 │  │ Share 2 │  │  (N/A)  │  ← k=2 needed         │
│   └────┬────┘  └────┬────┘  └─────────┘                        │
│        │            │                                           │
│        └─────┬──────┘                                           │
│              ▼                                                  │
│        ┌───────────────┐                                        │
│        │  AGGREGATE    │                                        │
│        └───────┬───────┘                                        │
│                ▼                                                │
│        ┌───────────────┐                                        │
│        │ manifest.sig  │  ← ONE signature (64 bytes)           │
│        └───────────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Run DKG Ceremony (One Time)

```bash
# Generate 2-of-3 threshold key
./scripts/speclock-tss-dkg.sh 2 3

# Outputs:
#   artifacts/speclock/tss/group.pub          (PUBLIC - share this)
#   artifacts/speclock/tss/keys/participant_1.key_package.json (PRIVATE)
#   artifacts/speclock/tss/keys/participant_2.key_package.json (PRIVATE)
#   artifacts/speclock/tss/keys/participant_3.key_package.json (PRIVATE)
```

In production, each participant runs DKG on their own machine and only keeps their key package.

### 2. Sign a Release (Per Release)

```bash
# Build manifest
python scripts/speclock-manifest.py

# Sign with participants 1 and 2 (k=2)
./scripts/speclock-tss-sign.sh 1 2

# Outputs:
#   artifacts/speclock/tss/manifest.sig        (signature)
#   artifacts/speclock/tss/manifest.proof.json (audit trail)
```

### 3. Verify (CI + Runtime)

```bash
# Verify threshold signature
./scripts/speclock-tss-verify.sh
```

## Configuration

### AUTHORITIES.json (v3.0)

```json
{
  "version": "3.0",
  "mode": "cosmic_tss",
  "tss": {
    "scheme": "frost_ed25519",
    "threshold_k": 2,
    "participants_n": 3,
    "group_public_key_path": "artifacts/speclock/tss/group.pub",
    "signature_path": "artifacts/speclock/tss/manifest.sig",
    "proof_path": "artifacts/speclock/tss/manifest.proof.json"
  },
  "authorities": [
    {
      "id": "benton_county",
      "participant_id": 1,
      "active": true
    },
    {
      "id": "yakima_county", 
      "participant_id": 2,
      "active": true
    },
    {
      "id": "terrafusion_vendor",
      "participant_id": 3,
      "active": true
    }
  ]
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED` | Enable signature verification |
| `TF_SPECLOCK_SIGNATURE_MODE` | Override mode (cosmic_tss, mythic_cosign) |
| `TF_SPECLOCK_COSMIC_REQUIRED` | Fail if signature missing |

## Rust TSS Tool

The `speclock-tss` tool implements FROST-Ed25519:

```bash
# Commands
speclock-tss digest     # Compute manifest digest
speclock-tss dkg-r1     # DKG Round 1: commitment
speclock-tss dkg-r2     # DKG Round 2: peer packages  
speclock-tss dkg-final  # DKG Finalize: key package + group pub
speclock-tss sign-r1    # Sign Round 1: nonces + commitment
speclock-tss sign-r2    # Sign Round 2: signature share
speclock-tss aggregate  # Combine k shares → signature
speclock-tss verify     # Verify signature
```

### Library

- **Crate**: `frost-ed25519` v2.0
- **Maintainer**: Zcash Foundation (zkcrypto)
- **Audit Status**: Audited
- **Curve**: Ed25519

## CI Integration

Step 10 in `speclock-ci.sh` handles COSMIC:

```bash
# Automatically runs if mode=cosmic_tss
./scripts/speclock-ci.sh

# CI verifies:
# 1. Compute manifest digest
# 2. Verify threshold signature exists
# 3. Cryptographically verify signature
```

## Runtime Verification

On startup, `SpecLockTssVerifier`:

1. Loads AUTHORITIES.json, checks `mode=cosmic_tss`
2. Loads manifest, signature, group public key
3. Calls `speclock-tss verify`
4. Fails startup if verification fails (fail-closed)

## /ops/speclock/proof Endpoint

```json
{
  "manifest": { ... },
  "cosmic": {
    "scheme": "frost_ed25519",
    "thresholdK": 2,
    "participantsN": 3,
    "signature": {
      "path": "artifacts/speclock/tss/manifest.sig",
      "sha256": "abc123...",
      "exists": true
    },
    "groupPublicKey": {
      "path": "artifacts/speclock/tss/group.pub",
      "sha256": "def456...",
      "exists": true
    },
    "proof": {
      "path": "artifacts/speclock/tss/manifest.proof.json",
      "content": {
        "scheme": "frost_ed25519",
        "threshold_k": 2,
        "participants_signed": [1, 2],
        "signature_hex": "..."
      }
    }
  }
}
```

## Key Rotation

1. Run new DKG ceremony → new `group.pub`
2. Add old key to `rotation.previous_group_public_keys`
3. Sign new manifests with new group
4. Runtime accepts both during overlap period
5. After 30 days, remove old key

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Single key compromise | k keys needed to sign |
| Insider threat | Multiple orgs hold keys |
| Key theft | No single key can sign |
| Replay attack | Time-locked manifests |
| Coordinator compromise | Coordinator only aggregates, can't forge |

## Comparison: GOD-TIER vs COSMIC

```
GOD-TIER:
  County signs → sig1
  Vendor signs → sig2
  Verify: check sig1 AND sig2
  
  Compromise county key → forge sig1 ✗
  Compromise both keys → forge both ✓ (bad)

COSMIC:
  County + Vendor cooperate → ONE sig
  Verify: check ONE sig
  
  Compromise county key → can't sign alone ✗
  Compromise both keys → need to coordinate in real-time ✗
  
  Even with all keys, signing requires live cooperation
```

## Production Checklist

- [ ] DKG ceremony run with real participants
- [ ] Each participant stores key package securely (HSM recommended)
- [ ] Group public key committed to repo
- [ ] CI verifies signatures
- [ ] Runtime verification enabled
- [ ] Key rotation plan documented
- [ ] Signing ceremony documented

---

**🜄🜁🜂🜃 COSMIC: True threshold cryptography. Government. Transcended. 🜄🜁🜂🜃**
