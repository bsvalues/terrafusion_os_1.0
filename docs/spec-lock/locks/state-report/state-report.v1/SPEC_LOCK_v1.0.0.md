# SPEC_LOCK v1.0.0 — State Report Lock

**Lock ID:** `state-report.v1`  
**Surface:** `state-report`  
**Owner:** `systemgpt`  
**Status:** `active`  
**Created:** 2025-12-13  
**Updated:** 2025-12-13

---

## Overview

The State Report Lock governs aggregated state-level reports that span multiple counties. These reports require **county quorum signing** to ensure no single county or vendor can publish state-wide data unilaterally.

## Federated Trust Model

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE MESH AUTHORITY                      │
│                    (Washington State)                        │
├─────────────────────────────────────────────────────────────┤
│  Threshold: 3-of-5 counties required for state signatures    │
│  Algorithm: FROST Ed25519                                    │
│  Group Key: artifacts/speclock/tss/state.group.pub           │
└─────────────────────────────────────────────────────────────┘
         │          │          │          │          │
    ┌────┴────┐┌────┴────┐┌────┴────┐┌────┴────┐┌────┴────┐
    │ Benton  ││ Yakima  ││Franklin ││  Grant  ││  Adams  │
    │County(1)││County(2)││County(3)││County(4)││County(5)│
    └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘
```

## Critical Rules

### Rule 1: No Single County Sign
```
A state report CANNOT be signed by a single county.
Minimum threshold: 3 counties
```

### Rule 2: Vendor Requires County Quorum
```
TerraFusion (vendor) CANNOT ship state-wide updates without county quorum approval.
Vendor role: propose_state_updates, submit_for_county_review
```

### Rule 3: Cross-County Data Isolation
```
County-specific data remains isolated during state aggregation.
State reports contain only aggregated/anonymized data.
```

## Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `report_id` | string | Unique report identifier |
| `report_type` | enum | Type of state report |
| `generated_at` | string | RFC3339 UTC timestamp |
| `period_start` | string | Reporting period start |
| `period_end` | string | Reporting period end |
| `counties_included` | array | List of county IDs in report |
| `aggregation_method` | string | How data was aggregated |
| `signing` | object | Quorum signature details |

### Report Types

- `annual_assessment_summary` - Annual property assessment statistics
- `levy_rate_comparison` - Cross-county levy rate comparison
- `compliance_audit` - State compliance audit report
- `interop_certification` - Interoperability certification

### Signing Object

```json
{
  "mode": "state_quorum",
  "threshold": 3,
  "participants": [1, 2, 3],
  "group_pub_sha256": "...",
  "signature_sha256": "...",
  "proof_path": "artifacts/speclock/tss/state-reports/{report_id}.proof.json"
}
```

## Verification

### At Runtime

```bash
# Verify state report signature
speclock-tss verify \
  --digest state-report.json \
  --signature signature.sig \
  --group-pub artifacts/speclock/tss/state.group.pub

# Verify quorum was met
python scripts/verify-state-quorum.py state-report.json
```

### API Endpoints

- `GET /ops/speclock/state/verify/{report_id}` - Verify state report
- `GET /ops/speclock/state/quorum` - Current quorum status
- `POST /ops/speclock/state/submit` - Submit for county review

## Example State Report

```json
{
  "report_id": "wa-annual-2025",
  "report_type": "annual_assessment_summary",
  "generated_at": "2025-12-13T00:00:00Z",
  "period_start": "2025-01-01T00:00:00Z",
  "period_end": "2025-12-31T23:59:59Z",
  "counties_included": ["benton", "yakima", "franklin", "grant", "adams"],
  "aggregation_method": "sum_with_anonymization",
  "data": {
    "total_parcels": 500000,
    "total_assessed_value": 50000000000,
    "average_assessment_ratio": 0.98
  },
  "signing": {
    "mode": "state_quorum",
    "threshold": 3,
    "participants": [1, 2, 3],
    "group_pub_sha256": "abc123...",
    "signature_sha256": "def456..."
  }
}
```

## Amendment Process

Changes to state report specifications require:

1. Amendment proposal from vendor
2. 3-of-5 county approval
3. 30-day review period
4. State mesh authority signature

---

**Government. Transcended.**
