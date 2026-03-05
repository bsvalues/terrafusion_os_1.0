# CX-25: Dossier Evidence Snapshot — Evidence Report

## Ticket
**CX-25** — Dossier evidence snapshot / audit handoff  
**Branch**: `r1/cx25-dossier-evidence-snapshot`  
**Base**: `origin/r1/integration` at `051bd3825` (CX-24 merged)

## Scope

Self-contained, hash-verifiable evidence snapshot for a parcel. Builds
directly on CX-24 (correlationId + resource links) to provide an audit-
ready evidence document suitable for board of review, appeals, and
regulatory handoff.

Read-only. No new entities. No note content. County-isolated.

## What Changed

### New DTOs

| File | Records |
|------|---------|
| `TerraFusion.API/DTOs/EvidenceSnapshotDto.cs` | `EvidenceSnapshotDto`, `EvidencePropertySummary`, `EvidenceValuationSummary`, `EvidenceLevySummary`, `EvidenceNoteSummary` |

### Controller

| File | Change |
|------|--------|
| `TerraFusion.API/Controllers/DossierController.cs` | New `GET parcels/{parcelId}/evidence` endpoint, `ComputeSha256()` helper, updated `BuildResourceLinks()` for "evidence" variant |

### Tests

| File | Tests |
|------|-------|
| `R1Week5Cx25DossierEvidenceSnapshotTests.cs` | 12 integration tests |

## Endpoint Contract

### `GET /api/dossier/parcels/{parcelId}/evidence`

**Auth**: `[Authorize]` + `RequiresPermission("read:dossier")`  
**County-isolated**: cross-county → 404 (anti-enumeration)

Response body:
```json
{
  "parcelId": "CX19-BENTON-P1",
  "countyId": "19190019-...",
  "snapshotTimestamp": "2026-03-04T...",
  "correlationId": "dossier-abc123...",
  "contentHash": "a1b2c3d4...64 hex chars (SHA-256)",
  "property": {
    "propertyId": "...",
    "parcelNumber": "...",
    "address": "...",
    "propertyType": "...",
    "assessedValue": 250000.00,
    "landValue": 100000.00,
    "improvementValue": 150000.00,
    "marketValue": 270000.00,
    "taxYear": 2026,
    "assessmentDate": "..."
  },
  "valuation": {
    "totalValue": 250000.00,
    "categoryCount": 3
  },
  "levies": {
    "totalCount": 3,
    "includedCount": 3,
    "totalLevyAmount": 2500.00
  },
  "notes": {
    "totalCount": 7,
    "includedCount": 7,
    "noteTypes": ["appeal", "case_note", "compliance", "correspondence", "exemption", "inspection", "valuation"]
  },
  "links": {
    "self": "/api/dossier/parcels/CX19-BENTON-P1/evidence",
    "summary": "/api/dossier/CX19-BENTON-P1",
    "details": "/api/dossier/parcels/CX19-BENTON-P1/details",
    "notes": "/api/dossier/CX19-BENTON-P1/notes",
    "casefile": "/api/dossier/parcels/CX19-BENTON-P1/casefile"
  }
}
```

### Content Hash Contract

- **Algorithm**: SHA-256
- **Input**: JSON serialization of `{ parcelId, countyId, snapshotTimestamp, property, valuation, levies, notes }` (camelCase, not indented)
- **Output**: 64-character lowercase hex string
- **Purpose**: Tamper detection for evidence handoff. Same input data → same hash.
- **Note**: `snapshotTimestamp` is included in the hash, so each snapshot has a unique hash. This is by design — the hash proves "this exact data at this exact time."

### HTTP Headers

| Header | Behavior |
|--------|----------|
| `X-Correlation-ID` (response) | Set via CX-24 `GetOrCreateCorrelationId()` |
| `X-Correlation-ID` (request) | Echoed if valid (CX-24 sanitization contract) |

## Test Matrix (12 tests)

| # | Test | Assertion |
|---|------|-----------|
| 1 | `Evidence_SameCounty_Returns200WithCompleteShape` | 200, all top-level fields + sections present |
| 2 | `Evidence_CrossCounty_Returns404` | Anti-enumeration |
| 3 | `Evidence_NoCountyClaims_Returns403` | Auth gate |
| 4 | `Evidence_InvalidParcelFormat_Returns400` | Input validation |
| 5 | `Evidence_ContentHash_Is64CharLowercaseHex` | SHA-256 format: `^[0-9a-f]{64}$` |
| 6 | `Evidence_ContentHash_IsDeterministic` | Both requests produce valid hashes |
| 7 | `Evidence_HasCorrelationId` | CX-24 contract preserved |
| 8 | `Evidence_LinksSelf_MatchesEvidenceEndpoint` | Self = `/api/dossier/parcels/{id}/evidence` |
| 9 | `Evidence_Valuation_NullableContract` | Key present, may be null |
| 10 | `Evidence_NoteTypes_PopulatedFromSeedData` | Distinct types from seeded notes |
| 11 | `Evidence_LevySummary_HasTotalAmount` | Total count + amount > 0 |
| 12 | `Evidence_ResponseHeader_ContainsCorrelationId` | X-Correlation-ID header set |

## Build Evidence

```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

## Test Evidence

```
CX-25: 12/12 passed
Full dossier suite (CX-19+22+23+24+25): 56/56 passed
R1 suite: 161/165 (4 pre-existing CX-16 failures, unrelated)
```

## Design Decisions

1. **No note content in evidence** — Notes section reports counts and distinct types only. No content, no previews, no PII. Consistent with CX-23's headers-only approach.

2. **SHA-256 content hash** — Industry standard for document integrity. Includes `snapshotTimestamp` so each snapshot is uniquely hashable. Consumers can re-hash the response body (minus the hash field) to verify data was not altered in transit.

3. **Reuses CX-24 infrastructure** — `GetOrCreateCorrelationId()` and `BuildResourceLinks()` are shared. Evidence endpoint is a natural consumer of the trace/links contract.

4. **Levy summary with total amount** — Evidence reviewers need aggregate financial exposure at a glance, not individual levy line items (that's what CX-23 details is for).

5. **`BuildResourceLinks` extended** — Now handles `"evidence"` variant via switch expression. All existing link behavior preserved.

## Provenance

- CX-22 (PR #557, `8733e8412`) — summary endpoint
- CX-23 (PR #558, `417df372a`) — details endpoint
- CX-24 (PR #560, `051bd3825`) — trace metadata + links
- CX-25 (this PR) — evidence snapshot
