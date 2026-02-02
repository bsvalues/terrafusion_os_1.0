# Break-Glass Runbook

## Overview

This document provides step-by-step instructions for **Break-Glass** operations in TerraFusion OS. Break-glass procedures are emergency operations that bypass normal controls to address urgent legal, security, or regulatory requirements.

**⚠️ WARNING:** Break-glass operations are audited, logged, and require post-incident review. Misuse may result in legal and administrative consequences.

## Prerequisites

### Authorization Required

| Role | Authority |
|------|-----------|
| County Administrator | County-level break-glass |
| State Security Officer | State-level break-glass |
| Legal Counsel | Court-ordered deletions |
| CISO | Security incident response |

### Required Documentation (before proceeding)

| Document | Description |
|----------|-------------|
| Court Order (if applicable) | Legal authority for action |
| Incident Ticket | Tracking number |
| Approval Chain | Authorized signatures |
| Justification Memo | Written rationale |

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v20+ | Runtime |
| `break-glass.js` | Latest | Break-glass operations |
| `audit-log.js` | Latest | Audit trail generation |

---

## Procedure

### Step 0: Document Authorization

Before any break-glass operation:

```bash
# Generate authorization record
node break-glass.js create-authorization \
  --incident-id "INC-2025-001234" \
  --authorized-by "admin@county.gov" \
  --reason "COURT_ORDER" \
  --court-order-ref "CASE-2025-5678" \
  --output ./break-glass/authorization.json
```

**Windows (PowerShell):**
```powershell
node break-glass.js create-authorization `
  --incident-id "INC-2025-001234" `
  --authorized-by "admin@county.gov" `
  --reason "COURT_ORDER" `
  --court-order-ref "CASE-2025-5678" `
  --output .\break-glass\authorization.json
```

### Step 1: Invoke Break-Glass Mode

```bash
node break-glass.js invoke \
  --authorization ./break-glass/authorization.json \
  --scope "casefile" \
  --target-id "CASE-001234" \
  --json > ./break-glass/invocation.json
```

**Expected Output:**
```json
{
  "ok": true,
  "breakGlassId": "BG-2025-001234",
  "invokedAt": "2025-01-15T00:00:00Z",
  "scope": "casefile",
  "targetId": "CASE-001234",
  "telemetryEmitted": true
}
```

### Step 2: Perform Emergency Operation

**For Court-Ordered Deletion:**
```bash
node break-glass.js delete \
  --break-glass-id "BG-2025-001234" \
  --casefile-id "CASE-001234" \
  --preserve-intent \
  --json > ./break-glass/deletion-result.json
```

**For Emergency Redaction:**
```bash
node break-glass.js redact \
  --break-glass-id "BG-2025-001234" \
  --casefile-id "CASE-001234" \
  --redaction-mask "SSN,DOB,ADDRESS" \
  --json > ./break-glass/redaction-result.json
```

**For Emergency Key Revocation:**
```bash
node break-glass.js revoke-key \
  --break-glass-id "BG-2025-001234" \
  --epoch-id 3 \
  --reason "Key compromise detected" \
  --json > ./break-glass/revocation-result.json
```

### Step 3: Generate Deletion Intent Record

For any deletion, a deletion intent record is created:

```bash
node break-glass.js generate-intent \
  --break-glass-id "BG-2025-001234" \
  --output ./break-glass/deletion-intent.json
```

**Deletion Intent Record Structure:**
```json
{
  "intentId": "DI-2025-001234",
  "caseId": "CASE-001234",
  "reason": "COURT_ORDER",
  "courtOrderRef": "CASE-2025-5678",
  "deletedAt": "2025-01-15T00:00:00Z",
  "authorizedBy": "admin@county.gov",
  "preservedHash": "sha256:abc123..."
}
```

### Step 4: Close Break-Glass Session

```bash
node break-glass.js close \
  --break-glass-id "BG-2025-001234" \
  --summary "Court-ordered deletion completed" \
  --json > ./break-glass/close-result.json
```

### Step 5: Generate Audit Trail

```bash
node break-glass.js audit-trail \
  --break-glass-id "BG-2025-001234" \
  --output ./break-glass/audit-trail.json
```

### Step 6: Sign Audit Record

```bash
openssl dgst -sha256 -sign private-key.pem \
  -out ./break-glass/audit-trail.json.sig \
  ./break-glass/audit-trail.json
```

---

## Break-Glass Reason Codes

| Code | Description | Authority Required |
|------|-------------|-------------------|
| `COURT_ORDER` | Court-ordered action | Legal Counsel + Admin |
| `SECURITY_INCIDENT` | Active security threat | CISO |
| `LEGAL_COMPLIANCE` | Regulatory requirement | Legal Counsel |
| `DATA_BREACH` | PII exposure response | CISO + Legal |
| `EMERGENCY_REDACTION` | Urgent PII removal | Admin |

---

## Interpreting Results

### Success States

| Result | Meaning |
|--------|---------|
| `ok: true` | Operation completed |
| `preserveIntent: true` | Deletion intent record created |
| `telemetryEmitted: true` | Audit events logged |

### Failure States (What Failure Looks Like)

| Error Code | What It Means |
|------------|---------------|
| `BG_UNAUTHORIZED` | Authorization invalid or expired |
| `BG_INVALID_SCOPE` | Target not eligible for break-glass |
| `BG_ALREADY_DELETED` | Target already deleted |
| `BG_SESSION_EXPIRED` | Break-glass session timed out |

### Sample Failure Output

```json
{
  "ok": false,
  "errorCode": "BG_UNAUTHORIZED",
  "errorMessage": "Authorization expired or invalid"
}
```

---

## Troubleshooting

### "BG_UNAUTHORIZED"

1. Verify authorization record is complete
2. Check authorized-by matches current session
3. Ensure authorization hasn't expired (24-hour limit)

### "BG_SESSION_EXPIRED"

1. Generate new authorization
2. Re-invoke break-glass with new authorization
3. Document reason for delay

### Deletion intent not created

1. Check `--preserve-intent` flag was used
2. Verify write permissions to output directory
3. Check disk space

---

## Security Considerations

1. **Two-Person Integrity:** Break-glass operations should have two authorized witnesses
2. **Time Limit:** Break-glass sessions expire after 24 hours
3. **Audit Immutability:** Audit records are cryptographically signed and immutable
4. **Post-Incident Review:** All break-glass operations require formal review within 72 hours

---

## Chain of Custody

| Step | Action | Signature/Initials | Time |
|------|--------|-------------------|------|
| 1 | Emergency declared | _________ | _____ |
| 2 | Authorization obtained | _________ | _____ |
| 3 | Break-glass invoked | _________ | _____ |
| 4 | Operation performed | _________ | _____ |
| 5 | Deletion intent preserved | _________ | _____ |
| 6 | Session closed | _________ | _____ |
| 7 | Audit trail signed | _________ | _____ |
| 8 | Post-incident review scheduled | _________ | _____ |

---

## Post-Incident Requirements

Within 72 hours of any break-glass operation:

1. **Incident Report:** Complete incident report with timeline
2. **Authorization Review:** Verify authorization was appropriate
3. **Impact Assessment:** Document affected records
4. **Notification:** Notify affected parties if required by law
5. **Policy Review:** Determine if policy updates needed

---

## Contact

For break-glass authorization or incident escalation:

- Security Team: security@terrafusion.io
- Legal Counsel: legal@terrafusion.io
- Incident Hotline: +1-555-INCIDENT

---

*Document Version: 1.0.0*
*Last Updated: 2025-01-15*
*TerraFusion OS — Government. Transcended.*
