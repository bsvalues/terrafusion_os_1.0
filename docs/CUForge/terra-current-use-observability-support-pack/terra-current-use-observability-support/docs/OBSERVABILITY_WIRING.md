# Current Use Observability Wiring

## Backend

Register:

```csharp
services.AddTerraCurrentUseObservability();
```

## Frontend

Add diagnostics panel for admin/support surfaces:

```tsx
<CurrentUseDiagnosticsPanel />
```

## Endpoints

```txt
GET /api/forge/current-use/observability/health
GET /api/forge/current-use/observability/metrics/recent
GET /api/forge/current-use/observability/errors/recent
```

## Required Metrics

- rollback calculations run
- rollback calculation failures
- notice previews generated
- notice approvals
- notice issuances
- policy resolutions
- trace append failures
- import validation failures
