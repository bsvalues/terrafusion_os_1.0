# Incident Response Drill

## Overview

This exercise validates TerraFusion OS incident response capabilities using the `incident.policy.json` profile. This is a **tabletop + live drill** that exercises break-glass procedures, emergency key rotation, and rapid audit trail generation.

**IMPORTANT:** This drill activates emergency mode. Ensure all participants understand the drill is a simulation before proceeding.

## Prerequisites

- [ ] TerraFusion OS in normal operating state
- [ ] `profiles/incident.policy.json` available (not yet activated)
- [ ] Incident Command designated
- [ ] Dual-approval signers available (for break-glass)
- [ ] Isolated test environment or clear drill designation
- [ ] Communication channel established for drill participants
- [ ] Escalation contact confirmed available

## Scenario

> **SCENARIO:** A signing key may have been compromised. Incident response requires immediate key rotation, affected artifact identification, break-glass deletion of potentially tampered records, and audit trail preservation.

## Procedure

### Phase 1: Incident Declaration (T+0)

```bash
# Activate incident profile
export TERRAFUSION_PROFILE=incident
node scripts/activate-profile.js \
  --profile incident \
  --incident-id "DRILL-$(date +%Y%m%d%H%M)" \
  --reason "Simulated key compromise drill"

# Verify incident mode active
node -e "console.log(process.env.TERRAFUSION_INCIDENT_ID)"
# Expected: DRILL-YYYYMMDDHHMM
```

```powershell
# Windows
$env:TERRAFUSION_PROFILE = "incident"
node scripts/activate-profile.js `
  --profile incident `
  --incident-id "DRILL-$(Get-Date -Format 'yyyyMMddHHmm')" `
  --reason "Simulated key compromise drill"
```

**Checkpoint:** Telemetry shows `incident_activated` event.

### Phase 2: Emergency Key Rotation (T+5 min)

```bash
# Force immediate key rotation
node scripts/rotate-key.js \
  --force \
  --reason "incident-drill-key-rotation" \
  --notify-downstream

# Verify new epoch
cat key-epochs/current.json | jq '.epochNumber'
# Expected: Previous + 1

# Verify old key marked for revocation
cat key-epochs/previous.json | jq '.revokedAt'
# Expected: ISO timestamp
```

**Checkpoint:** Telemetry shows `key_rotated` and `key_revocation_pending` events.

### Phase 3: Affected Artifact Identification (T+10 min)

```bash
# Identify artifacts signed with potentially compromised key
node scripts/scan-artifacts.js \
  --signer-epoch-before "$(cat key-epochs/previous.json | jq -r '.epochNumber')" \
  --output ./incident-artifacts/affected-artifacts.json

# Count affected artifacts
cat ./incident-artifacts/affected-artifacts.json | jq '.artifacts | length'
```

**Checkpoint:** List of affected artifacts documented.

### Phase 4: Break-Glass Execution (T+20 min)

**REQUIRES DUAL APPROVAL**

```bash
# Generate break-glass intent
node scripts/break-glass-intent.js \
  --incident-id "$TERRAFUSION_INCIDENT_ID" \
  --action delete \
  --target-artifacts ./incident-artifacts/affected-artifacts.json \
  --reason "Drill: simulated tampering removal" \
  --output ./incident-artifacts/break-glass-intent.json

# First approver signs
node scripts/sign-intent.js \
  --intent ./incident-artifacts/break-glass-intent.json \
  --approver-id "$APPROVER_1_ID" \
  --output ./incident-artifacts/break-glass-intent-signed1.json

# Second approver signs
node scripts/sign-intent.js \
  --intent ./incident-artifacts/break-glass-intent-signed1.json \
  --approver-id "$APPROVER_2_ID" \
  --output ./incident-artifacts/break-glass-intent-signed2.json

# Execute break-glass (simulation mode for drill)
node scripts/execute-break-glass.js \
  --intent ./incident-artifacts/break-glass-intent-signed2.json \
  --simulate \
  --output ./incident-artifacts/break-glass-result.json
```

**Checkpoint:** Break-glass result shows `simulated: true` with correct artifact count.

### Phase 5: Audit Trail Preservation (T+30 min)

```bash
# Generate immediate audit packet
node scripts/generate-audit-packet.js \
  --profile incident \
  --exercise-id "$TERRAFUSION_INCIDENT_ID" \
  --operator-id "$INCIDENT_COMMANDER_ID" \
  --include-full-chain \
  --include-incident-telemetry \
  --output ./incident-artifacts/incident-audit-packet.json

# Verify incident events captured
cat ./incident-artifacts/incident-audit-packet.json | jq '.incidentEvents | length'
# Expected: >= 5 (activate, rotate, scan, break-glass, this packet)
```

**Checkpoint:** Audit packet contains complete incident timeline.

### Phase 6: DR Proof Under Incident (T+40 min)

```bash
# Verify DR still works with rotated keys
node scripts/dr-reconstitute.js \
  --artifacts-dir ./incident-artifacts/ \
  --use-current-key-epoch \
  --output ./incident-artifacts/dr-report.json

# Verify reconstitution success
cat ./incident-artifacts/dr-report.json | jq '.success'
# Expected: true (even with key rotation)
```

**Checkpoint:** DR works with new key epoch.

### Phase 7: Incident Closure (T+50 min)

```bash
# Deactivate incident mode
node scripts/deactivate-incident.js \
  --incident-id "$TERRAFUSION_INCIDENT_ID" \
  --resolution "Drill completed successfully" \
  --lessons-learned "Documented in post-drill report"

# Verify normal mode restored
echo $TERRAFUSION_INCIDENT_ID
# Expected: Empty or cleared

# Verify incident mode duration was within limit
cat ./incident-artifacts/incident-summary.json | jq '.durationHours'
# Expected: < 72 (per profile maxActiveDurationHours)
```

**Checkpoint:** System returned to normal operating state.

## Troubleshooting

### Error: DUAL_APPROVAL_REQUIRED

**Cause:** Break-glass attempted without second approver.

**Resolution:**
1. Locate second authorized approver
2. Have them sign the intent
3. Retry execution

### Error: INCIDENT_DURATION_EXCEEDED

**Cause:** Incident mode active longer than 72 hours.

**Resolution:**
1. Force deactivation with override
2. Document reason for extended duration
3. Escalate to security team

### Error: KEY_ROTATION_BLOCKED

**Cause:** Key rotation requires cooldown period.

**Resolution:**
```bash
# Force override (incident only)
node scripts/rotate-key.js --force --incident-override
```

### Error: BREAK_GLASS_AUDIT_FAILED

**Cause:** Telemetry sink unavailable during break-glass.

**Resolution:**
1. Break-glass should still proceed (safety over auditability)
2. Document manual audit trail
3. Recover telemetry from backup sink

## Success Criteria

| Checkpoint | Expected | Actual | Pass/Fail |
|------------|----------|--------|-----------|
| Incident mode activated | incident.policy.json | ______ | ☐ |
| Key rotated | New epoch created | ______ | ☐ |
| Old key revoked | revokedAt set | ______ | ☐ |
| Affected artifacts identified | Count > 0 | ______ | ☐ |
| Break-glass intent created | Valid JSON | ______ | ☐ |
| Dual approval obtained | 2 signatures | ______ | ☐ |
| Break-glass executed | simulated: true | ______ | ☐ |
| Audit packet generated | All incident events | ______ | ☐ |
| DR works post-rotation | success: true | ______ | ☐ |
| Incident deactivated | Normal mode | ______ | ☐ |
| Duration within limit | < 72 hours | ______ | ☐ |

## Drill Timeline

| T+ | Phase | Duration | Owner |
|----|-------|----------|-------|
| 0 | Incident Declaration | 5 min | Incident Commander |
| 5 | Emergency Key Rotation | 5 min | Security Lead |
| 10 | Affected Artifact Identification | 10 min | Ops Lead |
| 20 | Break-Glass Execution | 10 min | Dual Approvers |
| 30 | Audit Trail Preservation | 10 min | Compliance Lead |
| 40 | DR Proof Under Incident | 10 min | DR Lead |
| 50 | Incident Closure | 10 min | Incident Commander |
| 60 | Post-Drill Debrief | 30 min | All Participants |

## Chain of Custody

| Step | Action | Operator | Timestamp | Signature |
|------|--------|----------|-----------|-----------|
| 1 | Drill initiated | _________ | _________ | _________ |
| 2 | Incident mode activated | _________ | _________ | _________ |
| 3 | Key rotation executed | _________ | _________ | _________ |
| 4 | Break-glass intent created | _________ | _________ | _________ |
| 5 | First approval given | _________ | _________ | _________ |
| 6 | Second approval given | _________ | _________ | _________ |
| 7 | Break-glass executed | _________ | _________ | _________ |
| 8 | Audit packet signed | _________ | _________ | _________ |
| 9 | Incident closed | _________ | _________ | _________ |
| 10 | Drill completed | _________ | _________ | _________ |

## Artifacts Produced

- `break-glass-intent.json` - Deletion intent document
- `break-glass-intent-signed1.json` - First approver signature
- `break-glass-intent-signed2.json` - Dual-signed intent
- `break-glass-result.json` - Execution result
- `affected-artifacts.json` - Artifact scan results
- `incident-audit-packet.json` - Complete incident audit trail
- `dr-report.json` - DR under incident proof
- `incident-summary.json` - Closure documentation

## Post-Drill Requirements

1. **Debrief Meeting:** Within 24 hours, all participants review drill performance
2. **Lessons Learned:** Document gaps, timing issues, unclear procedures
3. **Procedure Updates:** Update this runbook based on findings
4. **Drill Report:** File formal drill report with security team
5. **Artifact Retention:** Preserve drill artifacts per retention policy

## Security Considerations

1. **Drill Isolation:** Ensure drill doesn't affect production data
2. **Real Secrets:** Do not use production keys in drill if possible
3. **Simulate Flag:** Always use `--simulate` for destructive actions
4. **Clear Communication:** All participants must know it's a drill
5. **No Real Deletions:** Drill should not delete actual evidence

## Contact

- Incident Commander: ___________________
- Security Lead: ___________________
- First Approver: ___________________
- Second Approver: ___________________
- Escalation: incident@terrafusion.io

---

*Document Version: 1.0.0*
*Last Updated: 2025-06-15*
*Profile: incident.policy.json*
*Drill Type: Tabletop + Live Simulation*
*TerraFusion OS — Government. Transcended.*
