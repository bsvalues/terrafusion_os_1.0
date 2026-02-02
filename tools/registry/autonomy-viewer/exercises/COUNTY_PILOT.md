# County Pilot Exercise

## Overview

This exercise validates end-to-end deployment of TerraFusion OS in a county assessor environment using the `county.policy.json` profile. The exercise produces real artifacts that serve as accreditation evidence.

## Prerequisites

- [ ] TerraFusion OS installed and configured
- [ ] `profiles/county.policy.json` deployed
- [ ] GitHub Actions runner with signing credentials
- [ ] External verification endpoint accessible
- [ ] Telemetry sink configured and writable
- [ ] Operator has completed AIRGAP_VERIFY.md training

## Procedure

### Step 1: Environment Validation

```bash
# Verify profile is loaded
node -e "console.log(JSON.parse(require('fs').readFileSync('profiles/county.policy.json')).profileId)"
# Expected: county-default

# Verify telemetry sink
ls -la telemetry/
# Expected: telemetry.jsonl exists and is writable
```

```powershell
# Windows equivalent
node -e "console.log(JSON.parse(require('fs').readFileSync('profiles/county.policy.json')).profileId)"
# Expected: county-default

Get-Item telemetry\telemetry.jsonl
# Expected: File exists
```

### Step 2: Generate Test Casefile

```bash
# Create a test casefile with sample data
node scripts/generate-casefile.js \
  --profile county \
  --parcel-count 10 \
  --output ./exercise-artifacts/county-pilot-casefile.zip

# Verify casefile structure
unzip -l ./exercise-artifacts/county-pilot-casefile.zip
```

### Step 3: Publish to Ledger

```bash
# Publish casefile and create ledger entry
node scripts/publish-casefile.js \
  --casefile ./exercise-artifacts/county-pilot-casefile.zip \
  --profile county \
  --sign \
  --output ./exercise-artifacts/

# Verify ledger head
cat ./exercise-artifacts/ledger-head.json | jq '.sequenceNumber'
```

### Step 4: External Verification

```bash
# Run external verification drill
node scripts/verify-external.js \
  --casefile ./exercise-artifacts/county-pilot-casefile.zip \
  --ledger-head ./exercise-artifacts/ledger-head.json \
  --offline \
  --output ./exercise-artifacts/verification-report.json

# Check verification status
cat ./exercise-artifacts/verification-report.json | jq '.ok'
# Expected: true
```

### Step 5: Generate Audit Packet

```bash
# Create signed audit packet
node scripts/generate-audit-packet.js \
  --profile county \
  --exercise-id "COUNTY-PILOT-$(date +%Y%m%d)" \
  --operator-id "$OPERATOR_ID" \
  --output ./exercise-artifacts/audit-packet.json

# Verify packet completeness
node scripts/validate-audit-packet.js \
  --packet ./exercise-artifacts/audit-packet.json
```

### Step 6: DR Reconstitution Test

```bash
# Simulate DR scenario - reconstitute from release artifacts only
node scripts/dr-reconstitute.js \
  --artifacts-dir ./exercise-artifacts/ \
  --output ./exercise-artifacts/dr-report.json

# Verify reconstitution success
cat ./exercise-artifacts/dr-report.json | jq '.success'
# Expected: true
```

### Step 7: Telemetry Validation

```bash
# Verify telemetry captured all events
grep -c "casefile_published" telemetry/telemetry.jsonl
# Expected: >= 1

grep -c "verification_completed" telemetry/telemetry.jsonl
# Expected: >= 1

grep -c "audit_packet_generated" telemetry/telemetry.jsonl
# Expected: >= 1
```

## Troubleshooting

### Error: PROFILE_NOT_FOUND

**Cause:** Profile file not in expected location.

**Resolution:**
```bash
cp profiles/county.policy.json ./active-profile.json
export TERRAFUSION_PROFILE_PATH=./active-profile.json
```

### Error: SIGNING_FAILED

**Cause:** Signing credentials not available or expired.

**Resolution:**
1. Verify `COSIGN_PRIVATE_KEY` environment variable is set
2. Check key hasn't been revoked
3. Regenerate signing key if needed

### Error: TELEMETRY_SINK_UNAVAILABLE

**Cause:** Telemetry directory not writable.

**Resolution:**
```bash
mkdir -p telemetry
chmod 755 telemetry
```

### Error: VERIFICATION_FAILED

**Cause:** Chain integrity issue or missing artifacts.

**Resolution:**
1. Check all signature triplets present (.sig, .crt, .bundle)
2. Verify hash chain continuity
3. Re-run from Step 3 if needed

## Success Criteria

| Checkpoint | Expected | Actual | Pass/Fail |
|------------|----------|--------|-----------|
| Profile loaded | county-default | ______ | ☐ |
| Casefile generated | Valid ZIP | ______ | ☐ |
| Ledger entry created | sequenceNumber > 0 | ______ | ☐ |
| External verification | ok: true | ______ | ☐ |
| Audit packet valid | All artifacts present | ______ | ☐ |
| DR reconstitution | success: true | ______ | ☐ |
| Telemetry complete | All events logged | ______ | ☐ |

## Chain of Custody

| Step | Action | Operator | Timestamp | Signature |
|------|--------|----------|-----------|-----------|
| 1 | Exercise started | _________ | _________ | _________ |
| 2 | Casefile generated | _________ | _________ | _________ |
| 3 | Ledger published | _________ | _________ | _________ |
| 4 | Verification completed | _________ | _________ | _________ |
| 5 | Audit packet signed | _________ | _________ | _________ |
| 6 | DR test completed | _________ | _________ | _________ |
| 7 | Exercise completed | _________ | _________ | _________ |

## Artifacts Produced

After successful completion, the following artifacts exist in `./exercise-artifacts/`:

- `county-pilot-casefile.zip` - Sealed casefile
- `ledger-head.json` - Chain head pointer
- `ledger-head.json.sig` - Head signature
- `ledger-head.json.crt` - Head certificate
- `ledger-head.json.bundle` - Rekor bundle
- `verification-report.json` - External verification result
- `audit-packet.json` - Signed audit packet
- `dr-report.json` - DR reconstitution proof

## Security Considerations

1. **Credential Isolation:** Do not expose signing keys in logs or outputs
2. **Artifact Protection:** Store exercise artifacts in access-controlled location
3. **Audit Trail:** Preserve telemetry logs for compliance retention period
4. **Key Hygiene:** Rotate signing keys per profile rotation schedule

## Contact

- Exercise Lead: ___________________
- Security Team: security@terrafusion.io
- Escalation: ops@terrafusion.io

---

*Document Version: 1.0.0*
*Last Updated: 2025-06-15*
*Profile: county.policy.json*
*TerraFusion OS — Government. Transcended.*
