# TerraFusion Receipt Verifier CLI

Offline-capable verification tool for citizen-verifiable government receipts.

## Overview

This tool allows citizens, auditors, and FOIA requesters to independently verify the authenticity of TerraFusion-issued receipts without requiring network access to TerraFusion infrastructure.

## Installation

```bash
# No external dependencies required (Python 3.10+)
cd tools/receipt-verify
python verify.py --help
```

## Usage

### Basic Verification

```bash
# Verify a receipt
python verify.py receipt.json

# Verify with artifact hash check
python verify.py receipt.json --artifact original_document.pdf

# Full offline verification
python verify.py receipt.json --artifact doc.pdf --manifest manifest.json --offline

# Generate QR payload
python verify.py receipt.json --qr
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | VALID - Receipt verified successfully |
| 1 | INVALID - Verification failed |
| 2 | ERROR - System/file error |

## Verification Steps

1. **Schema Validation** - Receipt conforms to `receipt.schema.json`
2. **Time Window Check** - `nbf <= now <= exp`
3. **Artifact Hash** - SHA-256 matches original content
4. **Manifest Anchor** - `speclock_manifest_sha256` matches known manifest
5. **Signature Verification** - Cryptographic signature valid

## QR Payload Format

Compact payload for embedding in QR codes:

```json
{
  "v": 1,                           // Version
  "id": "r-2025-12-13-001",         // Receipt ID
  "h": "1234567890abcdef",          // Truncated hash (16 chars)
  "u": "/public/proof/r-2025-12-13-001",  // Verification URL
  "t": 1734048000                   // Unix timestamp
}
```

Encoded as: `base64url(gzip(json))`

## FOIA Bundle

When requesting verification materials via FOIA, request the full bundle:

- `receipt.json` - The signed receipt
- `artifact.bin` - Original artifact
- `manifest.json` - SpecLock manifest at issuance
- `proof.json` - Cryptographic proof chain
- `VERIFY.md` - Verification instructions

## Offline Verification

For air-gapped environments:

1. Obtain the receipt, artifact, and manifest files
2. Run: `python verify.py receipt.json --artifact doc.pdf --manifest manifest.json --offline`
3. For signature verification, use:
   - COSMIC TSS: `speclock-tss verify --digest digest.json --signature sig --group-pub group.pub`
   - MYTHIC Cosign: `cosign verify-blob --bundle bundle.json --key pub.pem receipt.json`

## Government. Transcended.

This tool ensures citizen trust in government artifacts through cryptographic verification.
