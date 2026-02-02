# DR Reconstitution Runbook

## Overview

This document provides step-by-step instructions for **Disaster Recovery (DR) Reconstitution** of the TerraFusion OS evidence ledger. Use this procedure when the primary ledger head is lost, corrupted, or needs to be rebuilt from distributed artifacts.

## Prerequisites

### Required Artifacts (at least one source)

| Source | Description | Location |
|--------|-------------|----------|
| GitHub Release | Release assets with ledger snapshots | `releases/v*.*.*/` |
| Air-Gap Pack | USB-distributed verification pack | Secure storage |
| Telemetry Logs | JSONL telemetry with head updates | File sink output |

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v20+ | Runtime |
| `dr-reconstitute.js` | Latest | Reconstitution script |
| `verify-chain.js` | Latest | Chain validation |

### Environment

```bash
# Set environment variables
export TERRAFUSION_REPO="github.com/terrafusion/os"
export TERRAFUSION_DR_OUTPUT="./dr-output"
export TERRAFUSION_DR_SOURCES="github-release,airgap-pack,telemetry-log"
```

---

## Procedure

### Step 1: Gather Artifacts

**From GitHub Releases:**
```bash
# Download latest release artifacts
gh release download --repo terrafusion-io/terrafusion_os \
  --pattern 'ledger-*.json' \
  --pattern 'rollup-*.json' \
  --pattern 'evidence-index.json' \
  --dir ./dr-artifacts
```

**From Air-Gap Pack (if available):**
```bash
# Mount USB and copy
cp /mnt/usb/terrafusion-pack/*.json ./dr-artifacts/
```

**From Telemetry Logs (fallback):**
```bash
# Extract head updates from telemetry
grep '"eventType":"ledger_head_updated"' telemetry-*.jsonl > ./dr-artifacts/telemetry-heads.json
```

### Step 2: Inventory Artifacts

```bash
node dr-reconstitute.js inventory \
  --input ./dr-artifacts \
  --json > ./dr-output/inventory.json
```

**Windows (PowerShell):**
```powershell
node dr-reconstitute.js inventory `
  --input .\dr-artifacts `
  --json > .\dr-output\inventory.json
```

**Expected Output:**
```json
{
  "ledgerSnapshots": 12,
  "rollups": 6,
  "telemetryLogs": 3,
  "sources": ["github-release", "airgap-pack"]
}
```

### Step 3: Validate Chain Continuity

```bash
node dr-reconstitute.js validate-chain \
  --input ./dr-artifacts \
  --strict \
  --json > ./dr-output/chain-validation.json
```

**Expected Output (success):**
```json
{
  "valid": true,
  "chainLength": 42,
  "gaps": [],
  "brokenLinks": []
}
```

### Step 4: Reconstitute Ledger Head

```bash
node dr-reconstitute.js rebuild-head \
  --input ./dr-artifacts \
  --head-type ledger \
  --output ./dr-output/ledger-head.json \
  --json > ./dr-output/reconstitution-report.json
```

**Expected Output:**
```json
{
  "ok": true,
  "rebuiltHead": {
    "sha256": "sha256:abc123...",
    "sequenceNumber": 42
  },
  "headSource": "reconstructed",
  "warnings": []
}
```

### Step 5: Reconstitute Rollup Head

```bash
node dr-reconstitute.js rebuild-head \
  --input ./dr-artifacts \
  --head-type rollup \
  --output ./dr-output/rollup-head.json \
  --json >> ./dr-output/reconstitution-report.json
```

### Step 6: Verify Reconstituted Heads

```bash
node verify-chain.js \
  --ledger-head ./dr-output/ledger-head.json \
  --rollup-head ./dr-output/rollup-head.json \
  --index ./dr-artifacts/evidence-index.json \
  --json > ./dr-output/verification-result.json
```

### Step 7: Generate DR Report

```bash
node dr-reconstitute.js generate-report \
  --input ./dr-output \
  --signer-epoch-id 3 \
  --output ./dr-output/dr-report.json
```

### Step 8: Sign DR Report (if signing key available)

```bash
openssl dgst -sha256 -sign private-key.pem \
  -out ./dr-output/dr-report.json.sig \
  ./dr-output/dr-report.json
```

---

## Interpreting Results

### Success States

| Result | Meaning |
|--------|---------|
| `ok: true` | Head successfully reconstituted |
| `headSource: reconstructed` | Head rebuilt from snapshots |
| `headSource: existing` | Existing valid head found |
| `chainValidation.valid: true` | Chain integrity verified |

### Failure States (What Failure Looks Like)

| Error Code | Attack Class | What It Means |
|------------|--------------|---------------|
| `DR_HEAD_AMBIGUOUS` | Fork Detection | Multiple competing heads at same sequence |
| `DR_HEAD_NOT_FOUND` | Total Loss | No valid head candidates found |
| `DR_CHAIN_BROKEN` | Chain Integrity Attack | Hash chain link is broken |
| `DR_INSUFFICIENT_ASSETS` | Data Loss | Not enough artifacts to reconstitute |

### Sample Failure Output

```json
{
  "ok": false,
  "errorCode": "DR_HEAD_AMBIGUOUS",
  "errorMessage": "Multiple candidate heads found at sequence 42"
}
```

**Recovery Action:** Manual intervention required. Review competing heads and select authoritative source.

---

## Troubleshooting

### "DR_INSUFFICIENT_ASSETS"

1. Check all artifact sources are accessible
2. Verify air-gap pack is mounted correctly
3. Confirm telemetry logs contain head updates

### "DR_CHAIN_BROKEN"

1. Identify missing link from error message
2. Search for missing artifact in other sources
3. If artifact is permanently lost, escalate to security team

### "DR_HEAD_AMBIGUOUS"

1. Review competing heads with `--verbose` flag
2. Check for unauthorized forks
3. Contact incident response team if fork detected

### Chain validation takes too long

For large chains (>1000 entries):
```bash
node dr-reconstitute.js validate-chain \
  --input ./dr-artifacts \
  --skip-deep-validation \
  --json
```

---

## Security Considerations

1. **Artifact Source Verification:** Only use artifacts from trusted sources (GitHub, authorized USB)
2. **Signing Key Protection:** DR report should be signed with current epoch's key
3. **Fork Investigation:** Any `DR_HEAD_AMBIGUOUS` must trigger security investigation
4. **Audit Trail:** All DR operations are logged to telemetry

---

## Chain of Custody

| Step | Action | Signature/Initials |
|------|--------|-------------------|
| 1 | DR condition declared | _________ |
| 2 | Artifacts gathered from sources | _________ |
| 3 | Chain validation completed | _________ |
| 4 | Head reconstituted | _________ |
| 5 | DR report generated and signed | _________ |
| 6 | Normal operations resumed | _________ |

---

## Contact

For questions about DR procedures or to report potential data loss:

- Security Team: security@terrafusion.io
- Incident Response: incident@terrafusion.io

---

*Document Version: 1.0.0*
*Last Updated: 2025-01-15*
*TerraFusion OS — Government. Transcended.*
