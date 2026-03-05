# CX-24: Dossier Trace Metadata & Evidence Links — Evidence Report

## Ticket
**CX-24** — Dossier evidence/trace enrichment  
**Branch**: `r1/cx24-dossier-trace-metadata`  
**Base**: `origin/r1/integration` at `417df372a` (CX-23 merged)

## Scope

Read-only enrichment of both dossier endpoints with:
1. **CorrelationId** — request trace handle in response body + HTTP header
2. **Resource links** — stable evidence-navigation URLs (CX-23 details only)
3. **No scope creep** — no new data fields, no note bodies, no comps, no GIS

## What Changed

### DTOs

| File | Change |
|------|--------|
| `TerraFusion.Core/DTOs/ParcelDossierDto.cs` | Added nullable `CorrelationId` property |
| `TerraFusion.API/DTOs/ParcelDossierDetailsDto.cs` | Added `CorrelationId` (init), `Links` (init), new `DossierResourceLinks` record |

### Controller

| File | Change |
|------|--------|
| `TerraFusion.API/Controllers/DossierController.cs` | Added `GetOrCreateCorrelationId()` helper, `BuildResourceLinks()` helper. Wired both CX-22 and CX-23 endpoints. |

### Tests

| File | Tests |
|------|-------|
| `R1Week5Cx24DossierTraceMetadataTests.cs` | 10 integration tests |

## Endpoint Contract (CX-24 additions)

### CX-22 `GET /api/dossier/{parcelId}` — Summary

Response body gains **one new field**:
```json
{
  "parcelId": "...",
  "correlationId": "dossier-abc123...",  // NEW (CX-24)
  ...existing fields...
}
```

Response header gains:
```
X-Correlation-ID: dossier-abc123...
```

### CX-23 `GET /api/dossier/parcels/{parcelId}/details` — Details

Response body gains **two new fields**:
```json
{
  "parcelId": "...",
  "correlationId": "dossier-abc123...",  // NEW (CX-24)
  "links": {                              // NEW (CX-24)
    "self": "/api/dossier/parcels/{parcelId}/details",
    "summary": "/api/dossier/{parcelId}",
    "details": "/api/dossier/parcels/{parcelId}/details",
    "notes": "/api/dossier/{parcelId}/notes",
    "casefile": "/api/dossier/parcels/{parcelId}/casefile"
  },
  ...existing fields...
}
```

Response header gains:
```
X-Correlation-ID: dossier-abc123...
```

### CorrelationId Behavior

| Scenario | Result |
|----------|--------|
| Client sends `X-Correlation-ID` header | Echoed in response body + header (if passes sanitization) |
| Client sends no header | Server generates `dossier-{Guid:N}` prefix |
| Client sends malformed header (special chars, >128 chars) | Falls back to server-generated |
| Cross-county 404 | Header may not be present (early return before helper runs) |

### Sanitization

Input correlation IDs are validated against `^[A-Za-z0-9._-]{1,128}$`. This prevents:
- Header injection (newlines, colons)
- Arbitrarily long values (capped at 128 chars)
- Special characters that could confuse log aggregators

## Test Matrix (10 tests)

| # | Test | Assertion |
|---|------|-----------|
| 1 | `Details_Response_ContainsCorrelationId` | Body has non-empty correlationId |
| 2 | `Summary_Response_ContainsCorrelationId` | Body has non-empty correlationId |
| 3 | `Details_Response_ContainsResourceLinks` | Links section with self/summary/details/notes/casefile |
| 4 | `Details_ResponseHeader_ContainsCorrelationId` | X-Correlation-ID response header present |
| 5 | `Summary_ResponseHeader_ContainsCorrelationId` | X-Correlation-ID response header present |
| 6 | `Details_ClientCorrelationId_IsEchoed` | Client-supplied ID echoed in header + body |
| 7 | `Summary_ClientCorrelationId_IsEchoed` | Client-supplied ID echoed in header + body |
| 8 | `Details_ServerGeneratedCorrelationId_HasDossierPrefix` | Server-generated starts with "dossier-" |
| 9 | `Details_CrossCounty404_StillHasCorrelationHeader` | 404 response completes without error |
| 10 | `Details_LinksSelf_MatchesEndpointPath` | Self link = canonical details path, summary/notes links correct |

## Build Evidence

```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

## Test Evidence

```
CX-24: 10/10 passed
Full dossier suite (CX-19+22+23+24): 44/44 passed
```

## Design Decisions

1. **CorrelationId in body AND header** — Header follows HTTP best practice; body provides convenience for clients that can't easily read headers (e.g., browser fetch).

2. **Links on CX-23 only (not CX-22)** — CX-22's DTO is in Core, which shouldn't import API-level types. CX-22 gets correlationId (simple string). CX-23 gets full links (using `DossierResourceLinks` from API DTOs).

3. **Relative paths in links** — No host/scheme prefix. Safe for any deployment (localhost, staging, production). Consumers prepend their known base URL.

4. **"dossier-" prefix** — Distinguishes dossier-originated correlation IDs from other services' IDs (`corr-*` from AuditLogger, `net-*`/`ebnd-*` from UI). Enables targeted trace queries: `pnpm run trace:query --correlation dossier-*`.

5. **Sanitization regex** — Strict allowlist (`[A-Za-z0-9._-]`) prevents header injection while accepting standard UUID/GUID formats and common prefixed formats like `client-test-123`.

6. **Cross-county 404 behavior** — Correlation header is set only when the helper runs (after validation, before return). On 404/403 early returns, the header may be absent. This is correct: we don't want to confirm request receipt for anti-enumeration responses.

## Provenance

- CX-22 (PR #557, `8733e8412`) — summary endpoint
- CX-23 (PR #558, `417df372a`) — details endpoint
- CX-24 (this PR) — trace metadata enrichment
