# Public Disclosure Runbook

## Overview

This document provides step-by-step instructions for **public disclosure and FOIA response** using TerraFusion OS distribution packs. Public disclosure enables transparent release of evidence while protecting sensitive information through audience-appropriate redaction.

## Prerequisites

### Disclosure Types

| Type | Description | Audience |
|------|-------------|----------|
| FOIA Response | Freedom of Information Act request | Public |
| Public Record | Proactive disclosure | Public |
| Inter-Agency | Agency-to-agency sharing | State |
| Media Release | Press/media disclosure | Public |

### Required Approvals

| Disclosure Type | Required Approval |
|-----------------|-------------------|
| FOIA Response | FOIA Officer + Legal |
| Public Record | Records Administrator |
| Inter-Agency | Agency Director |
| Media Release | Communications + Legal |

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v20+ | Runtime |
| `disclosure-manager.js` | Latest | Disclosure operations |
| `pack-generator.js` | Latest | Public pack generation |
| `redaction-tool.js` | Latest | PII redaction |

---

## Procedure

### Step 1: Create Disclosure Request

```bash
node disclosure-manager.js create-request \
  --request-type "FOIA" \
  --request-id "FOIA-2025-001234" \
  --requested-by "citizen@example.com" \
  --subject "Property assessments 2024" \
  --json > ./disclosure/request.json
```

**Windows (PowerShell):**
```powershell
node disclosure-manager.js create-request `
  --request-type "FOIA" `
  --request-id "FOIA-2025-001234" `
  --requested-by "citizen@example.com" `
  --subject "Property assessments 2024" `
  --json > .\disclosure\request.json
```

### Step 2: Identify Responsive Records

```bash
node disclosure-manager.js search \
  --request-id "FOIA-2025-001234" \
  --query "property assessment 2024" \
  --date-range "2024-01-01,2024-12-31" \
  --json > ./disclosure/responsive-records.json
```

**Expected Output:**
```json
{
  "responsive": [
    {
      "casefileId": "CASE-2024-001234",
      "title": "Property Assessment Q1 2024",
      "createdAt": "2024-03-15T00:00:00Z",
      "containsPII": true
    }
  ],
  "count": 1
}
```

### Step 3: Review for Exemptions

```bash
node disclosure-manager.js review-exemptions \
  --input ./disclosure/responsive-records.json \
  --exemption-codes "PRIVACY,LAW_ENFORCEMENT,DELIBERATIVE" \
  --json > ./disclosure/exemption-review.json
```

### Step 4: Apply Public Redaction

```bash
node redaction-tool.js apply \
  --casefile-id "CASE-2024-001234" \
  --audience "public" \
  --redact-fields "SSN,DOB,ADDRESS,PHONE" \
  --output ./disclosure/redacted/ \
  --json > ./disclosure/redaction-result.json
```

**Expected Output:**
```json
{
  "ok": true,
  "redactedFields": ["SSN", "DOB", "ADDRESS", "PHONE"],
  "redactedCount": 42,
  "outputPath": "./disclosure/redacted/CASE-2024-001234-public.json"
}
```

### Step 5: Generate Public Pack

```bash
node pack-generator.js public \
  --input ./disclosure/redacted/ \
  --request-id "FOIA-2025-001234" \
  --include-verification \
  --output ./disclosure/public-pack.zip \
  --json > ./disclosure/pack-result.json
```

### Step 6: Verify Public Pack

```bash
node verify-casefile.js \
  --zip ./disclosure/public-pack.zip \
  --offline \
  --strict \
  --json > ./disclosure/verification.json
```

### Step 7: Approve Disclosure

```bash
node disclosure-manager.js approve \
  --request-id "FOIA-2025-001234" \
  --approved-by "foia-officer@county.gov" \
  --reviewed-by "legal@county.gov" \
  --json > ./disclosure/approval.json
```

### Step 8: Publish/Deliver

**For FOIA Response:**
```bash
node disclosure-manager.js deliver \
  --request-id "FOIA-2025-001234" \
  --method "secure-link" \
  --recipient "citizen@example.com" \
  --json > ./disclosure/delivery.json
```

**For Public Portal:**
```bash
node disclosure-manager.js publish \
  --request-id "FOIA-2025-001234" \
  --portal "public-records" \
  --json > ./disclosure/publication.json
```

### Step 9: Generate Response Letter

```bash
node disclosure-manager.js generate-letter \
  --request-id "FOIA-2025-001234" \
  --template "foia-response" \
  --output ./disclosure/response-letter.pdf
```

---

## Exemption Codes

| Code | Description | Legal Basis |
|------|-------------|-------------|
| `PRIVACY` | Personal privacy exemption | FOIA Exemption 6 |
| `LAW_ENFORCEMENT` | Law enforcement records | FOIA Exemption 7 |
| `DELIBERATIVE` | Deliberative process | FOIA Exemption 5 |
| `TRADE_SECRET` | Commercial/trade secrets | FOIA Exemption 4 |
| `SECURITY` | National security | FOIA Exemption 1 |

---

## Interpreting Results

### Success States

| Result | Meaning |
|--------|---------|
| `ok: true` | Operation completed |
| `redactedCount` | Number of PII fields redacted |
| `verificationPassed` | Pack integrity verified |

### Failure States (What Failure Looks Like)

| Error Code | What It Means |
|------------|---------------|
| `DISCLOSURE_APPROVAL_REQUIRED` | Approval not obtained |
| `DISCLOSURE_EXEMPTION_REQUIRED` | Exempt records need review |
| `DISCLOSURE_REDACTION_INCOMPLETE` | PII not fully redacted |
| `DISCLOSURE_VERIFICATION_FAILED` | Pack integrity check failed |

---

## Troubleshooting

### "DISCLOSURE_REDACTION_INCOMPLETE"

1. Review redaction mask covers all PII types
2. Run redaction again with `--strict` flag
3. Manually review any flagged content

### Pack verification fails

1. Check pack wasn't modified after generation
2. Regenerate pack from source
3. Verify signing certificates are valid

### Recipient cannot access secure link

1. Check link hasn't expired (default 30 days)
2. Regenerate link with extended expiration
3. Provide alternative delivery method

---

## Security Considerations

1. **PII Protection:** All public disclosures must have PII redacted
2. **Verification:** Public packs include verification artifacts
3. **Audit Trail:** All disclosure operations are logged
4. **Link Expiration:** Secure links expire after 30 days

---

## Response Timelines

| Request Type | Initial Response | Final Response |
|--------------|------------------|-----------------|
| FOIA | 5 business days | 20 business days |
| Public Record | 3 business days | 10 business days |
| Media | 24 hours | 5 business days |

---

## Contact

For disclosure questions:

- FOIA Officer: foia@terrafusion.io
- Records Management: records@terrafusion.io
- Communications: comms@terrafusion.io

---

*Document Version: 1.0.0*
*Last Updated: 2025-01-15*
*TerraFusion OS — Government. Transcended.*
