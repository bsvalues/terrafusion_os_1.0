# R1 Week 4 Performance Baseline (CX-14)

Date: 2026-03-03 (America/Los_Angeles)  
Branch: `codex/r1-week4-perf-baseline`

## Scope

Baseline for `POST /api/costforge/calculate` using a deterministic local harness:

- Warmup requests: `10`
- Measured requests: `100`
- Target: `p95 < 150ms`

## Harness

- Project: `backend/tools/CostForgePerfHarness/CostForgePerfHarness.csproj`
- Execution command:

```bash
dotnet run --project backend/tools/CostForgePerfHarness/CostForgePerfHarness.csproj
```

- Deterministic request payload:

```json
{
  "propertyId": "22222222-2222-2222-2222-222222222222",
  "countyCode": "BENTON",
  "region": "BENTON",
  "buildingType": "SFR"
}
```

## Result Summary

- Artifact file (gitignored runtime artifact):
  - `backend/artifacts/perf/costforge-calculate-20260304T055149Z-539bdccfd.json`
- Status distribution:
  - `200: 100`
- Latency summary:
  - `min: 0.7753ms`
  - `max: 14.1238ms`
  - `avg: 1.1273ms`
  - `p50: 0.9348ms`
  - `p95: 1.3703ms`
  - `p99: 2.4372ms`
- Target check:
  - `p95 < 150ms`: `PASS`

## Notes

- During harness bring-up, `POST /api/costforge/calculate` had an endpoint ambiguity with `CostForgeTestController`.
- Fix applied in this lane:
  - `CostForgeTestController` route moved to `api/costforge-test` so the production endpoint remains uniquely addressable.
