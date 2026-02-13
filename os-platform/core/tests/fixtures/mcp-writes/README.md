# Phase 12C MCP Write Operation Test Fixtures

## Purpose
Supervised write operations with mandatory approval artifacts for MCP PostGIS.

## Governance Contract

**Prime Directive:** Writes are irreversible state mutations. Every write must be:
1. **Artifact-authorized:** Supervisor approval artifact required
2. **Template-allowlisted:** No raw SQL, only named operations
3. **Lane-owned:** Owner lane must be specified
4. **Evidence-linked:** Bidirectional manifest ↔ approval ↔ evidence pack
5. **Non-bypassable:** No DSN overrides, no approval expiry extensions

## Fixture Schema

```typescript
interface WriteFixture {
  county: string;
  countyId: string;
  environment: 'development' | 'staging' | 'production';
  
  writeOperation: {
    operationId: string;              // Must be in contract allowlist
    template: string;                 // Parameterized SQL template
    params: any[];                    // Parameter values
    paramsHash: string;               // SHA256 of params (16 chars)
    ownerLane: string;                // Owning lane (e.g., "benton-assessor")
    reason: string;                   // Human-readable justification
    rawSQL?: string;                  // FORBIDDEN (test invalid case only)
  };
  
  approvalArtifact: {
    approvalId: string;               // Unique approval identifier
    approvedBy: string;               // Principal who approved
    approvedAt: string;               // ISO 8601 timestamp
    expiresAt: string;                // ISO 8601 expiry (max 24h)
    reason: string;                   // Approval justification
    scope: {
      county: string;
      environment: string;
      operationId: string;
    };
    bindings: {
      paramsHash: string;             // Must match writeOperation.paramsHash
      dsnHash: string;                // Must match resolved DSN
      toolContractHash: string;       // Must match current contract
      manifestHash: string;           // Calculated from write manifest
    };
    signature?: string;               // Optional (future cryptographic sig)
  } | null;
  
  expectedResult?: {
    success: boolean;
    rowsAffected: number;
    receiptHash: string;
  };
  
  expectedError?: string;             // For invalid fixtures
}
```

## Valid Fixtures (Positive Tests - Writes WITH Approval)

### valid-update-assessment-with-approval.json
- **Operation:** update_property_assessment
- **Action:** UPDATE properties SET assessed_value, tax_year
- **Approval:** appr-2026-02-13-001 (expires in 8h)
- **Expected:** Success, 1 row affected

### valid-insert-parcel-with-approval.json
- **Operation:** insert_new_parcel
- **Action:** INSERT INTO properties (new subdivision lot)
- **Approval:** appr-2026-02-13-002 (expires in 8h)
- **Expected:** Success, 1 row affected

### valid-delete-obsolete-record-with-approval.json
- **Operation:** delete_obsolete_tax_record
- **Action:** DELETE FROM tax_records WHERE tax_year < 2020
- **Approval:** appr-2026-02-13-003 (expires in 8h)
- **Expected:** Success, 3 rows affected

## Invalid Fixtures (Negative Tests - Write Gates)

### invalid-write-no-approval.json
- **Scenario:** Write operation without approval artifact
- **Expected:** "Write operation requires supervisor approval artifact"
- **Purpose:** Prove writes cannot execute without approval

### invalid-write-expired-approval.json
- **Scenario:** Write with approval that expired yesterday
- **Expected:** "Approval artifact expired at 2026-02-12T18:00:00Z"
- **Purpose:** Prevent stale approval reuse

### invalid-write-params-hash-mismatch.json
- **Scenario:** Approval paramsHash doesn't match manifest paramsHash
- **Expected:** "Params hash mismatch: approval binds to X but manifest has Y"
- **Purpose:** Detect parameter tampering after approval

### invalid-write-county-mismatch.json
- **Scenario:** Benton write attempt with Yakima approval
- **Expected:** "County mismatch: approval scope county (yakima) does not match write manifest county (benton)"
- **Purpose:** Prevent cross-county approval misuse

### invalid-write-operation-not-allowlisted.json
- **Scenario:** Operation ID not in contract's allowlisted operations
- **Expected:** "Operation 'unauthorized_bulk_delete' not found in contract allowlist"
- **Purpose:** Enforce template allowlist

### invalid-write-raw-sql-attempt.json
- **Scenario:** Attempt to bypass template system with raw SQL
- **Expected:** "Raw SQL writes are forbidden: all writes must use allowlisted operation templates"
- **Purpose:** Prevent raw SQL injection bypass

## Approval Artifact Rules

1. **Expiry:** Max 24 hours from approvedAt. After expiry, artifact is invalid.
2. **Binding:** All hashes (params, DSN, contract, manifest) must match exactly.
3. **Scope:** County, environment, and operationId must match write manifest.
4. **Signature:** Optional field (reserved for future cryptographic verification).

## Evidence Trail

Every write execution generates:
- **Write Manifest:** `write-{county}-{env}-{operationId}-{timestamp}.json`
- **Approval Artifact:** `approval-{approvalId}.json`
- **Write Receipt:** `receipt-{receiptHash}.json` (includes rowsAffected, timestamp, actor)
- **Evidence Pack Link:** Bidirectional references between all artifacts

Stored: `.terrafusion/write-manifests/` and `.terrafusion/approvals/`

## Deterministic Validation Flow

1. **Parse write manifest** → calculate paramsHash, manifestHash
2. **Load approval artifact** → validate not expired
3. **Verify bindings:**
   - approval.bindings.paramsHash === manifest.paramsHash
   - approval.bindings.dsnHash === routing.dsnHash
   - approval.bindings.toolContractHash === contract.hash
   - approval.bindings.manifestHash === calculated manifestHash
4. **Verify scope:**
   - approval.scope.county === manifest.county
   - approval.scope.environment === manifest.environment
   - approval.scope.operationId === manifest.operationId
5. **Verify operation allowlisted:**
   - manifest.operationId in contract.writeOperations[]
6. **Execute template** (if all validations pass)
7. **Generate receipt** → link to approval + evidence pack

## Test Coverage Goals

- ✅ Write without approval (blocked)
- ✅ Write with expired approval (blocked)
- ✅ Write with hash mismatch (blocked - tampering detection)
- ✅ Write with county mismatch (blocked - cross-county prevention)
- ✅ Write with non-allowlisted operation (blocked - template enforcement)
- ✅ Write with raw SQL (blocked - no template bypass)
- ✅ Valid writes with approval (succeed, generate receipt + evidence)
- ✅ Bidirectional evidence linking (manifest ↔ approval ↔ evidence pack)

**Total:** ~15 write tests (6 invalid + 3 valid + 6 evidence/contract)

---

**Classification:** Test Fixtures - Phase 12C Supervised Writes  
**Last Updated:** February 13, 2026  
**Compliance:** Irreversible mutation governance + approval artifacts + template allowlist
