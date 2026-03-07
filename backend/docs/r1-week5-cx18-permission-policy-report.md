# R1 Week 5 — CX-18: Permission Policy Enforcement Report

## Purpose

Validates that every `[RequiresPermission]` attribute on the 5 governed
controllers resolves through the **real** authorization pipeline
(`DynamicModulePolicyProvider` → `PluginPermissionRequirement` →
`PluginPermissionHandler`), NOT through the CX-16 workaround that
stubbed all policies to "any authenticated user."

## Test File

`backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx18PermissionPolicyIntegrationTests.cs`

**Filter:** `dotnet test --filter "FullyQualifiedName~R1Week5Cx18"`

## Architecture

The test factory (`Cx18PermissionPolicyFactory`) wires:

1. **Test auth handler** — identity from `X-Test-*` headers (same pattern as CX-16)
2. **`DynamicModulePolicyProvider`** — real `IAuthorizationPolicyProvider` that
   resolves `RequiresPermission_*` policies into `PluginPermissionRequirement`
3. **`PluginPermissionHandler`** — real `IAuthorizationHandler` that checks
   `X-Plugin-Id` header → plugin DB lookup → permission JSON array match
4. **Mock `IPluginRepository`** — returns:
   - Plugin A (all 19 permissions) for happy-path
   - Plugin B (method perms only, no `access:costforge`) for class-gate test

## Policy Matrix (23 entries × 3 scenarios = 70 tests)

| Controller | Permission | Endpoints | 401 | 403 | non-403 |
|------------|-----------|-----------|-----|-----|---------|
| PropertiesController | `read:properties` | 1 | ✅ | ✅ | ✅ |
| AtlasController | `read:parcel` | 2 | ✅ | ✅ | ✅ |
| CostForgeController | `access:costforge` (class) | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `calculate:property-cost` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `calculate:batch-valuation` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `read:cost-breakdown` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `read:cost-comparison` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `read:cost-forecast` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `read:cost-factors` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `read:cost-matrix` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `read:system-status` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `read:ai-agents` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `manage:ai-agents` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `read:performance-metrics` | 1 | ✅ | ✅ | ✅ |
| CostForgeController | `sync:external-systems` | 1 | ✅ | ✅ | ✅ |
| DossierController | `read:dossier` | 2 | ✅ | ✅ | ✅ |
| DossierController | `write:dossier` | 1 | ✅ | ✅ | ✅ |
| EnhancementModuleController | `ecosystem:view` | 3 | ✅ | ✅ | ✅ |
| EnhancementModuleController | `ecosystem:manage` | 1 | ✅ | ✅ | ✅ |

**Total:** 23 endpoints × 3 scenarios + 1 class-gate extra = **70 assertions**

## Key Finding: Production DI Gap

`DynamicModulePolicyProvider` and `PluginPermissionHandler` are defined in
`backend/src/TerraFusion.API/Security/` but are **NOT registered** in the
production DI container (`Program.cs` / `AuthenticationConfiguration.cs`).

This means all `[RequiresPermission]` attributes in production rely on the
`DefaultAuthorizationPolicyProvider`, which has no knowledge of
`RequiresPermission_*` policy names. The likely production behavior is a
500 error (policy-not-found) when any governed endpoint is reached.

**Recommendation:** Register both services in `AuthenticationConfiguration.cs`:
```csharp
services.AddSingleton<IAuthorizationPolicyProvider, DynamicModulePolicyProvider>();
services.AddScoped<IAuthorizationHandler, PluginPermissionHandler>();
services.AddScoped<IPluginRepository, PluginRepository>();
```

Per scope-lock rules, this product code change should be done in a separate
lane if a test proves the defect.

## Evidence

```
Passed!  - Failed:     0, Passed:    70, Skipped:     0, Total:    70,
Duration: 24 s - TerraFusion.Unit.Tests.dll (net8.0)
```

## How to Run

```bash
cd backend
dotnet test tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter "FullyQualifiedName~R1Week5Cx18" -nologo -v minimal
```
