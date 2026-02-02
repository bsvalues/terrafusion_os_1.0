# Retention Policy Runbook

## Overview

This document provides step-by-step instructions for managing **data retention and expiration** in TerraFusion OS. Retention policies ensure compliance with legal requirements while enabling timely deletion of expired records.

## Prerequisites

### Retention Policy Configuration

| Tier | Default Retention | Description |
|------|-------------------|-------------|
| `standard` | 7 years (2555 days) | Standard county records |
| `permanent` | Indefinite | Permanent records (never expire) |
| `court` | 10 years (3650 days) | Court-related evidence |
| `temporary` | 90 days | Temporary/working records |

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v20+ | Runtime |
| `retention-manager.js` | Latest | Retention operations |
| `audit-log.js` | Latest | Audit trail |

---

## Procedure

### Step 1: Review Current Retention Status

```bash
node retention-manager.js status \
  --profile county.policy.json \
  --json > ./retention/status.json
```

**Windows (PowerShell):**
```powershell
node retention-manager.js status `
  --profile county.policy.json `
  --json > .\retention\status.json
```

**Expected Output:**
```json
{
  "summary": {
    "totalRecords": 15420,
    "expiringThisMonth": 42,
    "expiredAwaitingDeletion": 0,
    "permanentRecords": 156
  },
  "tierBreakdown": {
    "standard": 14800,
    "permanent": 156,
    "court": 312,
    "temporary": 152
  }
}
```

### Step 2: Identify Expired Records

```bash
node retention-manager.js find-expired \
  --as-of "2025-01-15" \
  --json > ./retention/expired.json
```

**Expected Output:**
```json
{
  "expired": [
    {
      "casefileId": "CASE-2018-001234",
      "tier": "standard",
      "createdAt": "2018-01-10T00:00:00Z",
      "expiresAt": "2025-01-10T00:00:00Z",
      "daysExpired": 5
    }
  ],
  "count": 1
}
```

### Step 3: Review Expiring Records

Before deletion, review the list:

```bash
node retention-manager.js preview-deletion \
  --input ./retention/expired.json \
  --generate-report \
  --json > ./retention/deletion-preview.json
```

### Step 4: Approve Deletion (requires authorization)

```bash
node retention-manager.js approve-deletion \
  --input ./retention/expired.json \
  --approved-by "admin@county.gov" \
  --json > ./retention/approval.json
```

### Step 5: Execute Retention Deletion

```bash
node retention-manager.js execute-deletion \
  --approval ./retention/approval.json \
  --preserve-tombstones \
  --json > ./retention/deletion-result.json
```

**Expected Output:**
```json
{
  "ok": true,
  "deleted": 1,
  "tombstonesCreated": 1,
  "telemetryEmitted": true
}
```

### Step 6: Generate Retention Report

```bash
node retention-manager.js generate-report \
  --period "2025-01" \
  --output ./retention/monthly-report.json
```

---

## Retention Tier Configuration

### Modifying Retention Periods

Edit the policy profile:

```json
{
  "retention": [
    {
      "tier": "standard",
      "retentionDays": 2555,
      "deletionRequiresApproval": true,
      "breakGlassEligible": false
    },
    {
      "tier": "permanent",
      "retentionDays": -1,
      "deletionRequiresApproval": true,
      "breakGlassEligible": true
    }
  ]
}
```

### Tier Assignment Rules

| Condition | Assigned Tier |
|-----------|---------------|
| Court case evidence | `court` |
| Historical/archival | `permanent` |
| Working drafts | `temporary` |
| All other records | `standard` |

---

## Interpreting Results

### Success States

| Result | Meaning |
|--------|---------|
| `ok: true` | Operation completed |
| `tombstonesCreated` | Deletion records preserved |
| `telemetryEmitted` | Audit events logged |

### Failure States (What Failure Looks Like)

| Error Code | What It Means |
|------------|---------------|
| `RETENTION_APPROVAL_REQUIRED` | Deletion not approved |
| `RETENTION_PERMANENT_RECORD` | Cannot delete permanent record |
| `RETENTION_HOLD_ACTIVE` | Legal hold prevents deletion |
| `RETENTION_INVALID_TIER` | Unknown retention tier |

---

## Troubleshooting

### "RETENTION_APPROVAL_REQUIRED"

1. Generate approval using `approve-deletion` command
2. Ensure approver has proper authorization
3. Check approval hasn't expired (24-hour limit)

### "RETENTION_HOLD_ACTIVE"

1. Check for active legal holds on the record
2. Contact legal counsel to release hold
3. Document hold release before deletion

### Records not appearing in expired list

1. Verify retention tier is correct
2. Check `as-of` date is correct
3. Confirm record isn't on legal hold

---

## Legal Holds

### Placing a Legal Hold

```bash
node retention-manager.js place-hold \
  --casefile-id "CASE-001234" \
  --hold-type "litigation" \
  --ordered-by "legal@county.gov" \
  --json
```

### Releasing a Legal Hold

```bash
node retention-manager.js release-hold \
  --casefile-id "CASE-001234" \
  --released-by "legal@county.gov" \
  --json
```

### Listing Active Holds

```bash
node retention-manager.js list-holds \
  --json > ./retention/active-holds.json
```

---

## Security Considerations

1. **Approval Chain:** All deletions require documented approval
2. **Tombstones:** Deleted records leave cryptographic tombstones
3. **Legal Holds:** Holds override retention expiration
4. **Audit Trail:** All retention operations are logged

---

## Contact

For retention policy questions:

- Records Management: records@terrafusion.io
- Legal Counsel: legal@terrafusion.io

---

*Document Version: 1.0.0*
*Last Updated: 2025-01-15*
*TerraFusion OS — Government. Transcended.*
