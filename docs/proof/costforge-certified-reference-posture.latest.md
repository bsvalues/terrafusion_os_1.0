# CostForge Certified Reference Posture Proof

**Checked at:** 2026-04-29T19:48:00Z  
**Status:** PASS

## Truth Statement

Benton-certified reference data remains valid for Benton proof only. It is not statewide cost, income, sales-comparison, or AI prediction truth.

For non-Benton county scope, protected reference lanes now fail honestly with `409 Conflict` and the posture header:

```text
X-CostForge-Reference-Posture: certified-lane-unavailable
```

The AI deterministic cost prediction lane uses the same rule:

```text
X-AI-Cost-Reference-Posture: certified-lane-unavailable
```

## Guarded Lanes

- CostForge request-driven cost approach.
- CostForge `cost-estimate`.
- CostForge `cost-matrix/benton`.
- CostForge depreciation schedule and depreciation calculation.
- CostForge income approach reference endpoints.
- CostForge sales comparison reference endpoints.
- AI Modules `predict-cost` deterministic Benton reference lane.

## Proof Command

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --no-restore --filter "FullyQualifiedName~R1Week5Cx19D2CostForgeGetCountyIsolationIntegrationTests"
```

Result:

```text
Passed: 14
Failed: 0
```

## Launch Posture

Benton reference data can support Benton-certified proof. It must not be marketed or routed as statewide CostForge readiness until county-specific schedules or governed unavailable states exist for each county.
