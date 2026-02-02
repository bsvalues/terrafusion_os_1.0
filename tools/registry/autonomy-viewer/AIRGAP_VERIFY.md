# Air-Gap Verification Drill

## Overview

This document provides step-by-step instructions for verifying TerraFusion OS autonomy evidence on an **air-gapped machine** (no network connection). This procedure is designed for government auditors and security reviewers who need to verify the integrity and authenticity of evidence artifacts independently.

## Prerequisites

### Required Files (copy to USB)

| File | Description | Location in Release |
|------|-------------|---------------------|
| `autonomy-casefile-sealed.zip` | Sealed casefile package | Release assets |
| `ledger-head.json` | Chain head pointer | Release assets |
| `ledger-head.json.sig` | Head signature | Release assets |
| `ledger-head.json.crt` | Head certificate | Release assets |
| `ledger-head.json.bundle` | Rekor bundle | Release assets |
| `evidence-index.json` | Evidence ledger snapshot | Release assets |

### Required Tools (copy to USB)

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v20+ | Runtime |
| `verify-casefile.js` | Latest | Verification script |
| `verification-report-generator.js` | Latest | Report generator |

### Obtaining the Verification Kit

**Option 1: Download from Release**
```
https://github.com/terrafusion-io/terrafusion_os/releases/latest
```

**Option 2: Clone and Build (before air-gap)**
```bash
git clone https://github.com/terrafusion-io/terrafusion_os.git
cd terrafusion_os/tools/registry/autonomy-viewer
pnpm install
pnpm build
# Copy dist/ folder to USB
```

---

## Procedure

### Step 1: Copy Files to Air-Gapped Machine

```bash
# Mount USB drive (example: /mnt/usb on Linux, E:\ on Windows)
mkdir -p ~/verification-drill
cp /mnt/usb/*.zip ~/verification-drill/
cp /mnt/usb/ledger-head.json* ~/verification-drill/
cp /mnt/usb/evidence-index.json ~/verification-drill/
cp -r /mnt/usb/verification-kit ~/verification-drill/
```

### Step 2: Compute File Hashes

**Linux/macOS:**
```bash
cd ~/verification-drill
sha256sum autonomy-casefile-sealed.zip
sha256sum ledger-head.json
sha256sum evidence-index.json
```

**Windows (PowerShell):**
```powershell
cd $HOME\verification-drill
Get-FileHash autonomy-casefile-sealed.zip -Algorithm SHA256
Get-FileHash ledger-head.json -Algorithm SHA256
Get-FileHash evidence-index.json -Algorithm SHA256
```

**Expected Output Format:**
```
<hash>  autonomy-casefile-sealed.zip
<hash>  ledger-head.json
<hash>  evidence-index.json
```

> ⚠️ Record these hashes for your audit trail.

### Step 3: Verify Sealed Casefile (Offline Mode)

```bash
cd ~/verification-drill/verification-kit
node verify-casefile.js \
  --zip ../autonomy-casefile-sealed.zip \
  --offline \
  --strict \
  --json > ../verification-report.json
```

**Expected Output (successful verification):**
```json
{
  "ok": true,
  "hashes": { "ok": true, ... },
  "triplets": { "ok": true, "count": 2, "expected": 2 },
  "errors": []
}
```

### Step 4: Verify Chain Continuity (Ledger Head)

```bash
node verify-ledger-head.js \
  --head ../ledger-head.json \
  --index ../evidence-index.json \
  --json > ../chain-verification.json
```

**Expected Output:**
```json
{
  "ok": true,
  "chainStatus": {
    "headSha256": "<hash>",
    "sequenceNumber": 42,
    "chainDepthVerified": 42
  },
  "repoIdentity": {
    "repoId": 12345,
    "ownerRepo": "terrafusion-io/terrafusion_os",
    "consistent": true
  }
}
```

### Step 5: Generate Verification Report

```bash
node generate-verification-report.js \
  --casefile ../autonomy-casefile-sealed.zip \
  --head ../ledger-head.json \
  --index ../evidence-index.json \
  --output ../verification-report-final.json
```

### Step 6: Sign the Verification Report (Optional)

If you have a signing key available on the air-gapped machine:

```bash
# Using OpenSSL
openssl dgst -sha256 -sign private-key.pem \
  -out verification-report-final.json.sig \
  verification-report-final.json

# Verify signature
openssl dgst -sha256 -verify public-key.pem \
  -signature verification-report-final.json.sig \
  verification-report-final.json
```

---

## Interpreting Results

### Success States

| Result | Meaning |
|--------|---------|
| `ok: true` | All verification checks passed |
| `hashes.ok: true` | File hashes match manifest |
| `triplets.ok: true` | All signature/cert/bundle triplets present |
| `chainStatus.ok: true` | Ledger chain is intact |
| `repoIdentity.consistent: true` | Repo identity matches across artifacts |

### Failure States (What Failure Looks Like)

| Error Code | Attack Class | What It Means |
|------------|--------------|---------------|
| `CASEFILE_HASH_MISMATCH` | Casefile Tampering | casefile.zip content was modified |
| `MANIFEST_HASH_MISMATCH` | Manifest Tampering | manifest content was modified |
| `TRIPLET_MISSING` | Incomplete Signing | Missing .sig, .crt, or .bundle file |
| `LEDGER_CHAIN_BROKEN` | Chain Continuity Attack | Hash chain link is broken |
| `LEDGER_SEQUENCE_GAP` | Chain Truncation Attack | Sequence numbers have gaps |
| `REPO_ID_MISMATCH` | Fork Spoofing Attack | Artifact from different repo |
| `REPO_SLUG_MISMATCH` | Repository Spoofing | Different owner/repo name |
| `SIGNATURE_INVALID` | Signature Forgery | Signature verification failed |

### Sample Failure Output

```json
{
  "ok": false,
  "errors": [
    {
      "code": "CASEFILE_HASH_MISMATCH",
      "message": "casefile.zip hash mismatch: expected abc123, got xyz789"
    }
  ]
}
```

---

## Checksums for Verification Kit

The verification kit files should match these SHA256 hashes:

```
# verification-kit/checksums.sha256
<hash>  verify-casefile.js
<hash>  verify-ledger-head.js
<hash>  generate-verification-report.js
<hash>  package.json
```

Verify the kit integrity before use:

```bash
cd verification-kit
sha256sum -c checksums.sha256
```

---

## Audit Trail Documentation

After completing verification, document in your audit report:

1. **Date/Time of Verification:** ____________________
2. **Verifier Name:** ____________________
3. **Machine Identifier:** ____________________
4. **Release Tag Verified:** ____________________
5. **Casefile SHA256:** ____________________
6. **Ledger Head SHA256:** ____________________
7. **Verification Result:** ☐ PASS ☐ FAIL
8. **Error Codes (if any):** ____________________
9. **Verification Report Location:** ____________________

---

## Chain of Custody

For each USB transfer:

| Step | Action | Signature/Initials |
|------|--------|-------------------|
| 1 | Files downloaded from GitHub release | _________ |
| 2 | USB prepared and sealed | _________ |
| 3 | USB transported to air-gapped machine | _________ |
| 4 | Verification completed | _________ |
| 5 | Report generated and signed | _________ |
| 6 | USB securely stored/destroyed | _________ |

---

## Troubleshooting

### "Node.js not found"

Ensure Node.js v20+ is installed on the air-gapped machine. If not available, include a portable Node.js distribution in the verification kit.

### "Permission denied" on scripts

```bash
chmod +x verification-kit/*.js
```

### "Cannot find module"

The verification kit must be self-contained. Ensure `node_modules/` was copied if dependencies are required, or use bundled single-file scripts.

### Hash mismatch on verification kit files

Re-download the verification kit from a trusted source. The kit may have been corrupted during transfer.

---

## Security Considerations

1. **USB Source Verification:** Verify the USB drive came from a trusted source before use
2. **Boot Integrity:** Use a known-good boot image on the air-gapped machine
3. **Physical Security:** Conduct verification in a secure facility
4. **Report Protection:** Sign and encrypt verification reports before transport
5. **Evidence Preservation:** Keep copies of all artifacts and reports for legal proceedings

---

## Contact

For questions about the verification procedure or to report potential tampering:

- Security Team: security@terrafusion.io
- GitHub Issues: https://github.com/terrafusion-io/terrafusion_os/issues
- PGP Key: [Available in repository]

---

*Document Version: 1.0.0*
*Last Updated: 2025-01-15*
*TerraFusion OS — Government. Transcended.*
