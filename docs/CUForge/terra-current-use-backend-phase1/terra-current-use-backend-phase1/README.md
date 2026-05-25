# TerraFusion Current Use Backend Phase 1

This package adds a backend API target for the TerraForge `terra-current-use` frontend module.

## Includes

- ASP.NET controller
- service contract
- rollback calculator
- rollback rules
- DTOs
- entity shapes
- audit sink placeholder
- dependency injection extension

## API Routes

```txt
GET  /api/forge/current-use/parcels/{parcelId}/overview
GET  /api/forge/current-use/parcels/{parcelId}/evidence
GET  /api/forge/current-use/parcels/{parcelId}/timeline
POST /api/forge/current-use/rollback/calculate
```

## Wire-up

In your backend startup/service registration:

```csharp
services.AddTerraCurrentUse();
```

Ensure controller discovery includes `TerraFusion.Modules.CurrentUse.Controllers`.

## Phase 1 warning

The rollback interest calculation is simplified. Do not use for final notices until statutory date-based interest is implemented.
