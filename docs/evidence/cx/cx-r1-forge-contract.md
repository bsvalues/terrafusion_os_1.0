# CX R1 Forge Contract

Date: March 7, 2026
Lane: `cx`
Purpose: frozen backend contract notes for the active R1 Forge valuation path and its
explicit Post-R1 carve-outs.

## Active R1 Endpoint

### `POST /api/costforge/calculate`

Auth:

- `[Authorize]`
- `RequiresPermission("calculate:property-cost")`

County rules:

- Request must resolve to the caller's county context.
- Caller county is derived from auth claims.
- Request county comes from `countyCode` when present, otherwise `region`.
- Cross-county requests return `403`.
- Unknown parcel/property in the authorized county scope returns `404`.

Accepted request shape:

```json
{
  "propertyId": "00000000-0000-0000-0000-000000000000",
  "parcelNumber": "1-0531-100-0001-000",
  "countyCode": "BENTON",
  "region": "BENTON",
  "buildingType": "SFR"
}
```

Observed contract notes:

- At least one of `propertyId` or `parcelNumber` is required.
- The governed handler currently uses `parcelNumber` for the active R1 path and sends
  a zero GUID for `propertyId`.
- `buildingType` is passed through to CostForge; governed handler derives it from
  `modelType`:
  - `cost` -> `SFR`
  - `sales` -> `SFR`
  - `income` -> `MFR`

Success response shape from backend:

```json
{
  "propertyId": "guid",
  "totalCost": 123456.78,
  "landValue": 23456.78,
  "improvementValue": 100000.00,
  "marketAdjustment": 0.00,
  "confidenceScore": 0.98,
  "analysisDate": "2026-03-07T12:34:56Z",
  "analysisMethod": "string",
  "components": [
    {
      "name": "Foundation",
      "amount": 10000.00,
      "unit": "sqft",
      "quantity": 1000,
      "unitCost": 10.00
    }
  ]
}
```

Governed handler normalization:

- `estimatedValue <- totalCost` when present, otherwise `estimatedValue`
- `confidence <- confidenceScore` when present, otherwise `confidence`
- `components` array is normalized into a name-to-amount map
- returned `parcelId` is the parcel number used for the request

Normalized governed result shape:

```json
{
  "parcelId": "1-0531-100-0001-000",
  "taxYear": 2026,
  "modelType": "cost",
  "estimatedValue": 123456.78,
  "confidence": 0.98,
  "components": {
    "Foundation": 10000.00
  }
}
```

Error semantics:

| Status | Meaning |
|---|---|
| `400` | Missing `propertyId` and `parcelNumber`, or missing county field (`countyCode` / `region`) |
| `403` | County context missing or caller county does not match request county |
| `404` | Property or parcel does not exist in authorized county scope |
| `500` | Downstream cost-analysis failure |

Correlation:

- Global correlation middleware applies on the API surface.
- Governed proof should capture the correlation ID returned through the invoke path.

Existing backend proof:

- `backend/tests/TerraFusion.Unit.Tests/R1Week2/R1Week2Cx8CostForgeRealOutputTests.cs`
  already proves:
  - non-zero CostForge output for seeded Benton properties
  - parcel-variable output (`Property A != Property B`)
  - response `propertyId` matches the requested property
  - parcel-number lookup succeeds on the live endpoint

## Explicit Post-R1 Forge Routes

These routes are now intentionally disabled rather than pretending to succeed:

| Route | Status | Meaning |
|---|---|---|
| `POST /api/costforge/batch-calculate` | `501` | Batch valuation is Post-R1 |
| `POST /api/costforge/sync/harris-pacs` | `501` | Harris PACS sync is Post-R1 |

Disabled-route semantics:

- `X-R1-Scope: Post-R1`
- `ProblemDetails` with:
  - `scope = Post-R1`
  - `operation = controller action name`
  - `feature = disabled feature name`

## Consumer Notes

- Governed tool: `run_valuation_model`
- Direct frontend hook: `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts`
- Legacy frontend service still contains client-side valuation behavior and remains a CC
  cutover task, not a CX contract problem.
