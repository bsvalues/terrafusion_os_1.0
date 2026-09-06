# WACO Sales Intelligence V1a — Sample-Size Adequacy Advisory

**Work order:** WACO lane C, child WO-104 (parent `WO-TERRAFUSION-WACO-PARALLEL-EXECUTION-001`)
**Shape:** Additive advisory metadata on the existing `GET /api/terraforge/ratio-study` response.
**Owner:** `TerraForgeController.GetRatioStudy` — the existing ratio-study ownership boundary (no new controller).

## Contract

Every `ratio-study` response now includes a `sampleSizeAdequacy` object:

```json
{
  "sampleSizeAdequacy": {
    "state": "adequate | marginal | insufficient | noRatioData | unavailable",
    "ratioDataAvailable": true,
    "qualifiedSales": 42,
    "countWithRatio": 38,
    "policy": "terraFusionPolicy",
    "advisoryOnly": true,
    "thresholds": { "adequateFloor": 30, "marginalFloor": 10 },
    "provenance": "TerraFusion internal operating policy; NOT encoded as IAAO §5.2 compliance ..."
  }
}
```

Classification is derived from the **untrimmed** `countWithRatio` (qualified sales with a computable
`AssessedValue / SalePrice` ratio), because sample adequacy is a property of the raw sample before
IQR outlier review.

| `countWithRatio` | state          |
|------------------|----------------|
| 0 and no qualified sales | `unavailable` |
| 0 but qualified sales exist | `noRatioData` |
| 1–9              | `insufficient` |
| 10–29            | `marginal`     |
| ≥30              | `adequate`     |

Empty or ratio-less samples return this metadata truthfully — never an exception.

## Language rule / provenance

The 30 / 10 thresholds are a **TerraFusion internal operating policy** (a conservative floor for
small-county Washington ratio strata). They are **not** labeled "IAAO §5.2 compliance" anywhere in
code, tests, or docs: no exact current authoritative IAAO provision is cited for these counts, so
the advisory state is exposed under the neutral policy name `terraFusionPolicy` with the thresholds
explicit in the payload. If an authoritative IAAO/WA provision is later cited, classification can be
re-derived under its own name.

## Guarantees (test-enforced in `RatioStudyTests`)

- Advisory metadata is **additive only** — existing statistic values (median/mean/wmean, COD/PRD/PRB/COV,
  tier medians/slope, counts) are byte/value-equivalent to pre-V1a behavior.
- Empty / no-ratio samples flag `unavailable` / `noRatioData` rather than erroring.
- County isolation is inherited unchanged from the existing TerraForge authenticated-county path;
  foreign-county rows never enter the advisory counts.
- Read-only; no production mutation of `ComparableSales`, `Properties`, doctrine tables, or
  qualification decisions.
