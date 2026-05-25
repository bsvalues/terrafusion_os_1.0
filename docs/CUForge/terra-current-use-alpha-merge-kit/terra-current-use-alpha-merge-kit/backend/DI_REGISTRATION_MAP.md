# Backend DI Registration Map

## First Alpha Registration

In application startup:

```csharp
services.AddTerraCurrentUse();
services.AddTerraCurrentUsePolicy();
services.AddTerraCurrentUseTrace();
services.AddTerraCurrentUseSecurity();
services.AddTerraCurrentUseObservability();
```

## Optional Later

```csharp
services.AddTerraCurrentUseNotices();
services.AddTerraCurrentUseInterest();
services.AddTerraCurrentUseDossier();
services.AddTerraCurrentUseWorkflow();
services.AddTerraCurrentUseAtlas();
services.AddTerraCurrentUseTreasurerHandoff();
services.AddTerraCurrentUseAppeals();
services.AddTerraCurrentUseCompliance();
services.AddTerraCurrentUseAnalytics();
services.AddTerraCurrentUseImport();
services.AddTerraCurrentUseTenancy();
services.AddTerraCurrentUseStateRules();
```

## Rule

Only register what you expose through feature flags and tests.
