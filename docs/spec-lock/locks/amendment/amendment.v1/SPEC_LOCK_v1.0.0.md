# AmendmentLock Spec Lock v1.0.0

> **Purpose:** Governance upgrades are constitutional: spec → tests → generated artifacts → migration → quorum signature → effective date. No backdoors.

---

## Contract Status

| Field         | Value                |
| ------------- | -------------------- |
| Lock ID       | `amendment.v1`       |
| Surface       | `amendment`          |
| Version       | `1.0.0`              |
| Status        | `active`             |
| Owner         | `systemgpt`          |
| Created       | `2025-12-12`         |
| Updated       | `2025-12-12`         |

---

## Canonical Amendment JSON Schema

### Required Fields

| Field                           | Type     | Description                                        |
| ------------------------------- | -------- | -------------------------------------------------- |
| `amendment_id`                  | string   | Unique amendment identifier (e.g., `TFAM-2025-001`)|
| `target_lock_id`                | string   | ID of the SpecLock being amended                   |
| `effective_nbf`                 | string   | Not Before - when amendment takes effect (RFC3339) |
| `changeset`                     | object   | The changes being proposed                         |
| `changeset.spec_sha256`         | string   | SHA-256 of the new spec                            |
| `changeset.tests_sha256`        | string   | SHA-256 of the new tests                           |
| `changeset.generated_artifacts_sha256` | string[] | SHA-256 of each generated artifact         |
| `changeset.migration_plan_sha256` | string | SHA-256 of migration plan document                 |
| `approvals`                     | object   | Approval metadata                                  |
| `approvals.required_quorum`     | integer  | Minimum approvals needed (≥2)                      |
| `approvals.signers`             | object[] | List of signers with their signatures              |
| `rollout`                       | object   | Rollout configuration                              |
| `rollout.backout_plan_sha256`   | string   | SHA-256 of backout/rollback plan                   |
| `rollout.validation_steps`      | string[] | List of validation steps before activation         |

### Optional Fields

| Field                           | Type     | Description                                        |
| ------------------------------- | -------- | -------------------------------------------------- |
| `effective_exp`                 | string   | Expiration - when amendment auto-expires (RFC3339) |
| `supersedes`                    | string   | ID of amendment this replaces                      |
| `rationale`                     | string   | Human-readable rationale for the change            |

---

## Amendment Lifecycle

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PROPOSED   │───▶│   REVIEWED   │───▶│   APPROVED   │───▶│   EFFECTIVE  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
   spec_sha256        tests_sha256        quorum_met          nbf reached
   tests_sha256       review_gates        signatures          validated
                      passed              collected           active
```

### States

| State       | Description                                              |
| ----------- | -------------------------------------------------------- |
| `proposed`  | Amendment submitted, awaiting review                     |
| `reviewed`  | Review gates passed (builder + breaker + security)       |
| `approved`  | Quorum signatures collected                              |
| `effective` | Amendment is now active (nbf reached)                    |
| `expired`   | Amendment expired (exp reached)                          |
| `superseded`| Replaced by newer amendment                              |
| `rejected`  | Failed review or quorum not reached                      |

---

## Review Gates (MUST PASS)

### Gate 1: Builder Review

- [ ] Spec changes are complete and coherent
- [ ] Tests cover all new/changed behavior
- [ ] Generated artifacts regenerate cleanly
- [ ] Migration plan is executable

### Gate 2: Breaker Review

- [ ] Attack vectors tested
- [ ] Edge cases covered
- [ ] Backwards compatibility assessed
- [ ] Security implications documented

### Gate 3: Security Review

- [ ] No new attack surface introduced
- [ ] FISMA compliance maintained
- [ ] Audit logging preserved
- [ ] County isolation verified

---

## Quorum Requirements

| Amendment Type        | Required Quorum | Signers Required        |
| --------------------- | --------------- | ----------------------- |
| Minor (patch)         | 2               | Any 2 maintainers       |
| Moderate (minor ver)  | 3               | 2 maintainers + 1 lead  |
| Major (breaking)      | 5               | 3 maintainers + 2 leads |
| Critical (security)   | 7               | Full security council   |

---

## Generated Artifacts

| Artifact                                    | Purpose                                |
| ------------------------------------------- | -------------------------------------- |
| `generated/amendment.schema.json`           | JSON Schema for validation             |
| `generated/amendment.workflow.json`         | Workflow state machine definition      |

---

## Tests (MUST PASS)

### Schema Validation Tests

1. ✅ Schema validates canonical examples
2. ✅ Schema rejects missing required fields
3. ✅ Schema rejects invalid RFC3339 timestamps
4. ✅ Schema rejects quorum < 2

### Business Logic Tests

1. ✅ `target_lock_id` must exist in INDEX.json
2. ✅ All SHA-256 fields are lower-case hex (64 chars)
3. ✅ `effective_nbf` must be in the future (at proposal time)
4. ✅ If `effective_exp` present, must be > `effective_nbf`
5. ✅ `required_quorum` must be ≥ 2
6. ✅ Signers array must have exactly `required_quorum` valid signatures

### Workflow Tests

1. ✅ Cannot skip states (proposed → reviewed → approved → effective)
2. ✅ Cannot activate before nbf
3. ✅ Cannot activate without quorum
4. ✅ Expired amendments cannot be activated

---

## Example Amendment (Canonical)

```json
{
  "amendment_id": "TFAM-2025-001",
  "approvals": {
    "required_quorum": 3,
    "signers": [
      {
        "participant_idx": 1,
        "signed_at": "2025-12-10T14:00:00Z",
        "signature_sha256": "aaa111222333444555666777888999000aaa111222333444555666777888999000"
      },
      {
        "participant_idx": 3,
        "signed_at": "2025-12-11T09:00:00Z",
        "signature_sha256": "bbb111222333444555666777888999000bbb111222333444555666777888999000"
      },
      {
        "participant_idx": 5,
        "signed_at": "2025-12-11T16:00:00Z",
        "signature_sha256": "ccc111222333444555666777888999000ccc111222333444555666777888999000"
      }
    ]
  },
  "changeset": {
    "generated_artifacts_sha256": [
      "ddd111222333444555666777888999000ddd111222333444555666777888999000",
      "eee111222333444555666777888999000eee111222333444555666777888999000"
    ],
    "migration_plan_sha256": "fff111222333444555666777888999000fff111222333444555666777888999000",
    "spec_sha256": "111222333444555666777888999000aaa111222333444555666777888999000aaa",
    "tests_sha256": "222333444555666777888999000bbb222333444555666777888999000bbb222333"
  },
  "effective_exp": "2026-12-31T23:59:59Z",
  "effective_nbf": "2025-12-15T00:00:00Z",
  "rationale": "Extend receipt artifact types to include 'permit' category",
  "rollout": {
    "backout_plan_sha256": "999888777666555444333222111000aaa999888777666555444333222111000aaa",
    "validation_steps": [
      "verify_schema_compatibility",
      "run_integration_tests",
      "validate_county_isolation",
      "check_audit_logging",
      "confirm_rollback_works"
    ]
  },
  "supersedes": null,
  "target_lock_id": "receipt.v1"
}
```

---

## Quorum Gate Contract

### Signature Verification Endpoint

```
POST /ops/speclock/amendments/{amendment_id}/verify-quorum

Response:
{
  "amendment_id": "TFAM-2025-001",
  "quorum_required": 3,
  "quorum_achieved": true,
  "valid_signatures": 3,
  "invalid_signatures": 0,
  "signers": [
    { "participant_idx": 1, "valid": true },
    { "participant_idx": 3, "valid": true },
    { "participant_idx": 5, "valid": true }
  ],
  "ready_to_activate": true
}
```

### Activation Endpoint

```
POST /ops/speclock/amendments/{amendment_id}/activate

Preconditions:
- quorum_achieved == true
- current_time >= effective_nbf
- all validation_steps passed

Response:
{
  "amendment_id": "TFAM-2025-001",
  "status": "effective",
  "activated_at": "2025-12-15T00:00:00Z",
  "target_lock_id": "receipt.v1",
  "new_spec_version": "1.1.0"
}
```

---

## CI/CD Enforcement

- **PR gate**: Amendment must be in `proposed` state
- **Review gate**: All three review gates must pass
- **Merge gate**: Amendment cannot be merged without quorum
- **Activation gate**: Automated activation at `effective_nbf` if quorum met

---

## Related Locks

- `receipt.v1` — Example target for amendments
- `pluginlock.v1` — Example target for amendments

---

## Agent Notes (do not delete)

<!--
Builder Session: 2025-12-12
- Created initial AmendmentLock v1.0.0 spec
- Defined constitutional upgrade workflow
- Established quorum requirements
- Defined review gates (builder/breaker/security)
- Defined lifecycle states
- Next: Generate schema and workflow definition

Breaker Session: pending
- Attacks to attempt:
  - [ ] Skip workflow states
  - [ ] Activate before nbf
  - [ ] Insufficient quorum bypass
  - [ ] Target non-existent lock
  - [ ] Expired amendment activation
  - [ ] Replay old signatures
-->
