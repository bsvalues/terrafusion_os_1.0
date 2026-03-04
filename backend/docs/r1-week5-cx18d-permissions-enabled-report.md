# CX-18D: Permission Pipeline Production DI Fix — Evidence Report

**Lane:** CX-18D (defect-fix)
**Branch:** `copilot/r1-week5-cx18d-permissions-enabled`
**Prerequisite:** CX-18 (PR #545, merged)

## Defect Summary

CX-18 integration tests discovered that `DynamicModulePolicyProvider`,
`PluginPermissionHandler`, and `ModuleAccessHandler` exist in the codebase but
are **not registered** in the production DI container. All 23 `[RequiresPermission]`
attributes across 5 controllers were decorative — requests passed authorization
without any permission check.

## Root Cause

`AuthenticationConfiguration.AddTerraFusionAuthentication()` registered JWT bearer
authentication and static role-based policies (RequireAdmin, RequireAssessor, etc.)
but did not register:

1. `IAuthorizationPolicyProvider` → `DynamicModulePolicyProvider`
2. `IAuthorizationHandler` → `PluginPermissionHandler`
3. `IAuthorizationHandler` → `ModuleAccessHandler`
4. `IPluginRepository` → `PluginRepository`

## Fix Applied

**File:** `backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs`

Added after the `AddAuthorization` block:

```csharp
services.AddSingleton<IAuthorizationPolicyProvider, DynamicModulePolicyProvider>();
services.AddScoped<IAuthorizationHandler, PluginPermissionHandler>();
services.AddScoped<IAuthorizationHandler, ModuleAccessHandler>();
services.AddScoped<IPluginRepository, PluginRepository>();
```

## Verification Strategy

CX-18D tests use the **production DI pipeline** — the test factory does NOT
register `IAuthorizationPolicyProvider` or `IAuthorizationHandler`. Only overrides:

- Authentication scheme (test handler for header-based identity)
- Database (InMemory)
- `IPluginRepository` (mock with seeded plugin data)
- Controller dependency stubs (ICostForgeService, etc.)

If the production DI fix is absent, all 403 and non-403 assertions fail.

## Test Results

| Suite | Tests | Passed | Failed |
|-------|-------|--------|--------|
| CX-18 (original) | 70 | 70 | 0 |
| CX-18D (production DI) | 15 | 15 | 0 |
| **Total** | **85** | **85** | **0** |

### CX-18D Assertions (15 total)

5 representative endpoints (one per controller):
- `GET /api/Properties/{id}` — PropertiesController
- `GET /api/atlas/parcels/{id}` — AtlasController
- `GET /api/CostForge/status` — CostForgeController
- `GET /api/dossier/{id}/notes` — DossierController
- `GET /api/ecosystem/enhancement-modules` — EnhancementModuleController

Each endpoint × 3 assertions:
1. **Unauthenticated → 401** (authentication still works)
2. **Authenticated without X-Plugin-Id → 403** (permission enforcement is live)
3. **Authenticated with valid plugin → non-401 & non-403** (happy path passes)

## Files Changed

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs` | 4 DI registrations + 2 using directives |
| `backend/tests/.../R1Week5/R1Week5Cx18DPermissionsEnabledTests.cs` | 15 integration tests (new) |
| `backend/docs/r1-week5-cx18d-permissions-enabled-report.md` | This evidence doc |

## Risk Assessment

**Breaking change potential:** Callers that previously bypassed permission checks
(because enforcement was absent) will now receive 403 responses unless they provide
a valid `X-Plugin-Id` header pointing to a plugin with the required permission in
`PermissionsJson`. This is the **intended behavior** — the attributes were always
meant to enforce.

## Build Evidence

```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```
