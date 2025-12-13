# ReceiptLock Spec Lock v1.0.0

> **Purpose:** Citizen/auditor-verifiable receipts for any outward-facing artifact (assessment notice, levy table, GIS export, report).

---

## Contract Status

| Field         | Value                |
| ------------- | -------------------- |
| Lock ID       | `receipt.v1`         |
| Surface       | `receipt`            |
| Version       | `1.0.0`              |
| Status        | `active`             |
| Owner         | `systemgpt`          |
| Created       | `2025-12-12`         |
| Updated       | `2025-12-12`         |

---

## Canonical Receipt JSON Schema

### Required Fields

| Field                      | Type     | Description                                       |
| -------------------------- | -------- | ------------------------------------------------- |
| `receipt_id`               | string   | Stable unique identifier (UUID or deterministic)  |
| `issued_at`                | string   | RFC3339 UTC timestamp (MUST end with `Z`)         |
| `nbf`                      | string   | Not Before - RFC3339 UTC (validity window start)  |
| `exp`                      | string   | Expiration - RFC3339 UTC (validity window end)    |
| `artifact`                 | object   | The artifact being receipted                      |
| `artifact.type`            | enum     | One of: `assessment_notice`, `levy_table`, `gis_export`, `report`, `other` |
| `artifact.sha256`          | string   | Lower-case hex SHA-256 of artifact content        |
| `speclock_manifest_sha256` | string   | Lower-case hex SHA-256 of manifest at issuance    |
| `signing`                  | object   | Signature metadata                                |
| `signing.mode`             | enum     | One of: `mythic_cosign`, `cosmic_tss`             |
| `signing.signature_sha256` | string   | Lower-case hex SHA-256 of the signature           |
| `proof_url`                | string   | URL path to verification endpoint                 |

### Optional Fields

| Field                      | Type     | Description                                       |
| -------------------------- | -------- | ------------------------------------------------- |
| `policy_bundle_sha256`     | string   | Lower-case hex SHA-256 of OPA policy bundle       |
| `signing.group_pub_sha256` | string   | Group public key hash (cosmic_tss only)           |
| `signing.participants_used`| int[]    | Participant indices used (cosmic_tss only)        |

---

## Determinism Rules (MUST)

1. **JSON key ordering**: Keys MUST be sorted lexicographically when serializing for hashing
2. **SHA-256 format**: Always lower-case hexadecimal, no prefix
3. **Timestamps**: MUST be UTC with `Z` suffix, no timezone offsets
4. **Whitespace**: No trailing whitespace, LF line endings
5. **Canonical JSON**: No unnecessary spaces, deterministic serialization

---

## Validation Rules (MUST)

1. `nbf` MUST be less than or equal to `exp`
2. `nbf` MUST be less than or equal to `issued_at`
3. `issued_at` MUST be a valid RFC3339 timestamp
4. `artifact.type` MUST be one of the allowed enum values
5. All `sha256` fields MUST be exactly 64 hex characters
6. `signing.mode` MUST match the signature type present

---

## Generated Artifacts

| Artifact                               | Purpose                                |
| -------------------------------------- | -------------------------------------- |
| `generated/receipt.schema.json`        | JSON Schema for validation             |
| `generated/receipt.openapi.snapshot.json` | OpenAPI fragment for API contracts  |

---

## Tests (MUST PASS)

### Schema Validation Tests

1. ✅ Schema validates canonical example receipts
2. ✅ Schema rejects missing required fields
3. ✅ Schema rejects invalid enum values
4. ✅ Schema rejects malformed SHA-256 (wrong length, uppercase)
5. ✅ Schema rejects invalid RFC3339 timestamps

### Determinism Tests

1. ✅ Serialization produces stable SHA-256 across runs
2. ✅ Key ordering is lexicographic
3. ✅ Time serialization is consistent (UTC Z)

### Business Logic Tests

1. ✅ Invalid time window fails (nbf > exp)
2. ✅ Future `issued_at` fails
3. ✅ Expired receipts are detected
4. ✅ Not-yet-valid receipts are detected

---

## Example Receipt (Canonical)

```json
{
  "artifact": {
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "type": "assessment_notice"
  },
  "exp": "2026-01-01T00:00:00Z",
  "issued_at": "2025-12-12T12:00:00Z",
  "nbf": "2025-12-12T00:00:00Z",
  "policy_bundle_sha256": "abc123def456789012345678901234567890123456789012345678901234abcd",
  "proof_url": "/ops/speclock/verify/receipt/r-2025-12-12-001",
  "receipt_id": "r-2025-12-12-001",
  "signing": {
    "group_pub_sha256": "def456789012345678901234567890123456789012345678901234567890abcd",
    "mode": "cosmic_tss",
    "participants_used": [1, 3, 5],
    "signature_sha256": "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
  },
  "speclock_manifest_sha256": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

---

## Offline Verification Contract

Citizens/auditors can verify receipts offline by:

1. Download the receipt JSON
2. Fetch the `speclock_manifest_sha256` manifest
3. Verify the artifact hash matches the claimed `artifact.sha256`
4. Verify the signature using the group public key
5. Check `nbf` ≤ now ≤ `exp`

### Verification Endpoint

```
GET /ops/speclock/verify/receipt/{receipt_id}

Response:
{
  "valid": true|false,
  "receipt": { ... },
  "verification": {
    "artifact_hash_match": true|false,
    "signature_valid": true|false,
    "time_window_valid": true|false,
    "manifest_hash_match": true|false
  },
  "errors": []
}
```

---

## CI/CD Enforcement

- **Pre-commit**: Schema validation via `speclock-governance-gate.sh`
- **PR gate**: Regeneration check via `speclock-enforce-generated.sh`
- **Merge gate**: Manifest hash verification
- **Post-merge**: Signature verification (COSMIC TSS)

---

## Related Locks

- `pluginlock.v1` — Plugin permission envelopes
- `amendment.v1` — Constitutional upgrade workflow
- `tf.dashboards.*` — Dashboard SpecLocks

---

## Agent Notes (do not delete)

<!--
Builder Session: 2025-12-12
- Created initial ReceiptLock v1.0.0 spec
- Defined canonical JSON structure
- Established determinism rules
- Defined test requirements
- Next: Generate schema and OpenAPI snapshot

Breaker Session: pending
- Attacks to attempt:
  - [ ] Replay old receipt
  - [ ] Bypass schema with extra fields
  - [ ] Invalid time window
  - [ ] Uppercase SHA-256
  - [ ] Non-UTC timestamps
-->
