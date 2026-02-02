# State Pilot Exercise

## Overview

This exercise validates end-to-end deployment of TerraFusion OS at state Department of Revenue level using the `state.policy.json` profile. State deployments have stricter audit requirements, larger data volumes, and cross-county aggregation.

## Prerequisites

- [ ] TerraFusion OS installed and configured
- [ ] `profiles/state.policy.json` deployed
- [ ] GitHub Actions runner with state-level signing credentials
- [ ] SIEM endpoint configured (per profile telemetrySinks)
- [ ] External verification endpoint accessible
- [ ] County attestation data available (if cross-county validation enabled)
- [ ] Operator has completed state security training

## Procedure

### Step 1: Environment Validation

```bash
# Verify state profile loaded
node -e "console.log(JSON.parse(require('fs').readFileSync('profiles/state.policy.json')).profileId)"
# Expected: state-dor

# Verify SIEM sink configured
echo $SIEM_ENDPOINT
# Expected: Non-empty URL

# Verify larger size limits
node -e "console.log(JSON.parse(require('fs').readFileSync('profiles/state.policy.json')).sizeLimits.maxCasefileSizeBytes)"
# Expected: 104857600 (100MB)
```

```powershell
# Windows equivalent
node -e "console.log(JSON.parse(require('fs').readFileSync('profiles/state.policy.json')).profileId)"
# Expected: state-dor

$env:SIEM_ENDPOINT
# Expected: Non-empty URL
```

### Step 2: County Attestation Import

```bash
# Import county attestations for cross-validation
node scripts/import-county-attestations.js \
  --counties benton,yakima,king \
  --output ./exercise-artifacts/county-attestations.json

# Verify attestations loaded
cat ./exercise-artifacts/county-attestations.json | jq '.attestations | length'
# Expected: 3
```

### Step 3: Generate State Aggregate Casefile

```bash
# Create state-level casefile with aggregated county data
node scripts/generate-casefile.js \
  --profile state \
  --aggregate-counties benton,yakima,king \
  --parcel-count 1000 \
  --output ./exercise-artifacts/state-pilot-casefile.zip

# Verify casefile structure and size
ls -lh ./exercise-artifacts/state-pilot-casefile.zip
unzip -l ./exercise-artifacts/state-pilot-casefile.zip | head -20
```

### Step 4: Publish to State Ledger

```bash
# Publish casefile with state-level signing
node scripts/publish-casefile.js \
  --casefile ./exercise-artifacts/state-pilot-casefile.zip \
  --profile state \
  --sign \
  --county-attestations ./exercise-artifacts/county-attestations.json \
  --output ./exercise-artifacts/

# Verify ledger entry with county references
cat ./exercise-artifacts/ledger-head.json | jq '.countyAttestationRefs'
```

### Step 5: External Verification with Full Chain

```bash
# Run external verification including cross-county validation
node scripts/verify-external.js \
  --casefile ./exercise-artifacts/state-pilot-casefile.zip \
  --ledger-head ./exercise-artifacts/ledger-head.json \
  --verify-county-attestations \
  --offline \
  --output ./exercise-artifacts/verification-report.json

# Check all validations passed
cat ./exercise-artifacts/verification-report.json | jq '.crossCountyValidation.ok'
# Expected: true
```

### Step 6: Generate State Audit Packet

```bash
# Create comprehensive state audit packet
node scripts/generate-audit-packet.js \
  --profile state \
  --exercise-id "STATE-PILOT-$(date +%Y%m%d)" \
  --operator-id "$OPERATOR_ID" \
  --include-full-chain \
  --output ./exercise-artifacts/audit-packet.json

# Verify packet includes county attestations
cat ./exercise-artifacts/audit-packet.json | jq '.countyAttestations | length'
# Expected: >= 1
```

### Step 7: SIEM Integration Test

```bash
# Verify SIEM received events
curl -s "$SIEM_ENDPOINT/query?source=terrafusion&last=1h" | jq '.events | length'
# Expected: >= 5

# Or check local SIEM log if using file-based SIEM
grep -c "state-dor" /var/log/siem/terrafusion.log
```

### Step 8: DR Reconstitution Test

```bash
# State DR includes county artifact recovery
node scripts/dr-reconstitute.js \
  --artifacts-dir ./exercise-artifacts/ \
  --include-county-recovery \
  --output ./exercise-artifacts/dr-report.json

# Verify full state recovery
cat ./exercise-artifacts/dr-report.json | jq '.countyRecovery.completeness'
# Expected: 1.0 (100%)
```

### Step 9: Taxroll Retention Validation

```bash
# Verify taxroll retention tier is enforced
node scripts/check-retention.js \
  --profile state \
  --tier taxroll \
  --output ./exercise-artifacts/retention-check.json

# Expected retention
cat ./exercise-artifacts/retention-check.json | jq '.taxroll.retentionDays'
# Expected: 5475 (15 years)
```

## Troubleshooting

### Error: COUNTY_ATTESTATION_MISSING

**Cause:** County didn't provide attestation data.

**Resolution:**
1. Contact county assessor office
2. Request attestation export per COUNTY_PILOT.md
3. Retry import after attestation received

### Error: SIEM_CONNECTION_FAILED

**Cause:** SIEM endpoint unreachable or credentials invalid.

**Resolution:**
```bash
# Test SIEM connectivity
curl -v "$SIEM_ENDPOINT/health"

# Check credentials
echo $SIEM_API_KEY | head -c 10
```

### Error: SIZE_LIMIT_EXCEEDED

**Cause:** Aggregate casefile exceeds 100MB limit.

**Resolution:**
1. Reduce parcel count or split into multiple casefiles
2. Enable chunking per profile thresholds
3. Contact ops for size limit waiver

### Error: CROSS_COUNTY_VALIDATION_FAILED

**Cause:** County attestation hash doesn't match aggregated data.

**Resolution:**
1. Verify county data hasn't changed since attestation
2. Re-request fresh attestation
3. Document discrepancy in audit trail

## Success Criteria

| Checkpoint | Expected | Actual | Pass/Fail |
|------------|----------|--------|-----------|
| Profile loaded | state-dor | ______ | ☐ |
| County attestations imported | 3+ counties | ______ | ☐ |
| Casefile generated | Valid ZIP < 100MB | ______ | ☐ |
| Ledger entry created | sequenceNumber > 0 | ______ | ☐ |
| Cross-county validation | ok: true | ______ | ☐ |
| Audit packet valid | All artifacts + attestations | ______ | ☐ |
| SIEM events received | 5+ events | ______ | ☐ |
| DR reconstitution | 100% completeness | ______ | ☐ |
| Taxroll retention | 5475 days | ______ | ☐ |

## Chain of Custody

| Step | Action | Operator | Timestamp | Signature |
|------|--------|----------|-----------|-----------|
| 1 | Exercise started | _________ | _________ | _________ |
| 2 | County attestations imported | _________ | _________ | _________ |
| 3 | Aggregate casefile generated | _________ | _________ | _________ |
| 4 | State ledger published | _________ | _________ | _________ |
| 5 | Cross-county validation completed | _________ | _________ | _________ |
| 6 | Audit packet signed | _________ | _________ | _________ |
| 7 | SIEM integration verified | _________ | _________ | _________ |
| 8 | DR test completed | _________ | _________ | _________ |
| 9 | Exercise completed | _________ | _________ | _________ |

## Artifacts Produced

- `state-pilot-casefile.zip` - Sealed aggregate casefile
- `county-attestations.json` - Imported county attestations
- `ledger-head.json` + signature triplet - Chain head
- `verification-report.json` - External verification with cross-county
- `audit-packet.json` - Signed state audit packet
- `dr-report.json` - DR reconstitution proof
- `retention-check.json` - Retention tier validation

## Security Considerations

1. **State Secrets:** State-level keys have broader blast radius—use HSM if available
2. **County Isolation:** Verify county data segregation is maintained
3. **SIEM Compliance:** Ensure SIEM meets state logging requirements
4. **Taxroll Sensitivity:** Handle taxroll data per state privacy regulations

## Contact

- Exercise Lead: ___________________
- State Security Officer: ___________________
- County Liaison: ___________________
- Escalation: state-ops@terrafusion.io

---

*Document Version: 1.0.0*
*Last Updated: 2025-06-15*
*Profile: state.policy.json*
*TerraFusion OS — Government. Transcended.*
