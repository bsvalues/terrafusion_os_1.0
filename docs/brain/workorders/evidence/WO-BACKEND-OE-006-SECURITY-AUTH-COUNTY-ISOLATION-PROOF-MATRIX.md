# WO-BACKEND-OE-006 - Security/Auth/County-Isolation Proof Matrix

Date: 2026-07-06
Work order: WO-BACKEND-OE-006
Program: Backend Operational Excellence
Goal: GOAL-BACKEND-OPERATIONAL-EXCELLENCE
Loop: LOOP-BACKEND-OPERATIONAL-EXCELLENCE
Mode: evidence matrix first

## Result

RESULT: PASS_WITH_GAP

Backend security, authentication, authorization, county-isolation, and audit proof is present and now
consolidated into a release-grade evidence matrix. The matrix proves important protected-path,
permission-policy, county-claim, cross-county denial, and audit-event behavior from current source and
safe unit-test evidence. It does not overclaim production readiness because full endpoint coverage,
public/anonymous endpoint review, and release-gate policy decisions remain incomplete.

No backend runtime behavior was changed in this work order.

## Source Evidence

| Surface | Current evidence | Release interpretation |
|---------|------------------|------------------------|
| Authentication registration | `backend/src/TerraFusion.API/Program.cs` calls `AddTerraFusionAuthentication(builder.Configuration, builder.Environment)` and the pipeline calls `app.UseAuthentication()` before `app.UseAuthorization()`. | Authentication middleware is registered and ordered in the request pipeline. |
| JWT bearer validation | `backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs` configures JWT bearer validation for issuer, audience, lifetime, signing key, and zero clock skew. | Token validation is explicit; production signing key absence is fail-fast in non-Development. |
| Default authorization posture | `AuthenticationConfiguration.cs` sets `AuthorizationOptions.FallbackPolicy` to `RequireAuthenticatedUser()`. | Unannotated controllers should default to authenticated access unless explicitly `[AllowAnonymous]`. |
| Named role policies | `AuthenticationConfiguration.cs` defines `RequireAdmin`, `RequireAssessor`, `RequireUser`, `OSCoreAccess`, and `TIER5AIAccess`. | Core policy names used by controllers have configured role requirements. |
| Dynamic permission policy provider | `DynamicModulePolicyProvider` resolves `RequiresPermission_*` and `module:*` policies. | Plugin/module permission policies are resolved dynamically instead of relying only on static role strings. |
| Permission handler | `PluginPermissionHandler` accepts direct JWT `perm` claims or plugin permissions from `X-Plugin-Id` metadata. | Direct API callers and plugin callers have an enforceable permission path. |
| Request user context | `HttpContextRequestUserContextAccessor` extracts authenticated user id, `countyId`/`county_id`/`countyCode`, and roles from claims. | County-aware services and audit writers have a common request-context source. |
| Audit middleware | `AuditLoggingMiddleware` logs API calls and downstream/controller-produced 4xx/5xx response details through `IAuditLogger`, while skipping health/static/event paths. `Program.cs` orders `UseAuthorization()` before `UseAuditLogging()`, so middleware-level authorization denials can short-circuit before this audit middleware runs. | Request/error audit surfaces exist, with explicit skip paths. Authorization-middleware 401/403 denials are not proven audited by this evidence and remain a release-gate gap. |
| Domain audit event writer | `AuditEventWriter` writes domain `AuditEvent` rows with actor and resolved county GUID, and does not break the triggering domain action on audit write failure. | Domain audit emission is county-attributed when request claims can be resolved. |
| Entity audit stamping | `AuditableEntityInterceptor` stamps `IAuditableEntity` create/update actor and timestamp fields from request context or `system`. | Tracked audited entities receive actor/time metadata on saves. |

## Controller And Endpoint Evidence

| Area | Current evidence | Interpretation |
|------|------------------|----------------|
| Protected core controllers | Source inventory shows many core controllers with `[Authorize]` or role/policy attributes, including `DaisController`, `CostForgeController`, `AuditController`, `ClerkController`, `TreasuryController`, `PilotController`, `SyncController` protected methods, and canonical parcel/sales controllers. | Important assessor/backend surfaces are protected by explicit attributes or the fallback policy. |
| Explicit anonymous endpoints | Source inventory also shows explicit `[AllowAnonymous]` endpoints for health, readiness, public portals, service registry, diagnostics, workbench F/G/H, and some feature/demo endpoints. | Anonymous access is mostly explicit, but release readiness still needs a public-surface review to decide which anonymous endpoints are acceptable in production. |
| Health and service registry carve-outs | `SimpleHealthController`, `SystemHealthController`, `PilotController` health methods, and `ServiceRegistryController` are intentionally anonymous. | Operational endpoints are exposed by design, but OE-004/OE-005 keep their release semantics partial. |
| Auth comments without attributes | Some controllers rely on fallback policy or gateway comments rather than class-level attributes. | Fallback policy reduces risk, but release gates should require an explicit public/protected endpoint inventory before production readiness. |

## Test Evidence

| Command | Result | What it proves |
|---------|--------|----------------|
| `dotnet test backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week5Cx18PermissionPolicyIntegrationTests" --logger "console;verbosity=minimal"` | PASS, 70 passed, 0 failed, 0 skipped | Permission policy integration: unauthenticated 401, authenticated-without-permission 403, authenticated-with-permission non-403, and class-gate behavior. |
| `dotnet test backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week5Cx19\|FullyQualifiedName~R1Week5Cx21\|FullyQualifiedName~R1Week5Cx22\|FullyQualifiedName~R1Week5Cx24PR656\|FullyQualifiedName~R1Week5Cx27\|FullyQualifiedName~AuditTrailEndpointsTests\|FullyQualifiedName~AuditEventEmissionTests" --logger "console;verbosity=minimal" --no-restore` | PASS, 131 passed, 0 failed, 0 skipped | Cross-county non-leak tests, Dais county claim behavior, marketplace RBAC, multi-county federation, PR656 controller integrity, permission-claim authorization, audit trail county filtering, and audit event emission. |

## Proof Matrix

| Proof area | Evidence | Status | Gap |
|------------|----------|--------|-----|
| Authentication middleware | `AddTerraFusionAuthentication`, `UseAuthentication`, `UseAuthorization`; JWT bearer validation. | Proven for source wiring. | No production token issuer/audience smoke proof in this WO. |
| Fail-fast JWT secret posture | Non-Development throws when `JwtSettings:SecretKey` is missing. | Proven by source inspection. | Release gate still needs environment configuration checklist. |
| Default-deny authorization | Fallback policy requires authenticated user. | Proven by source inspection. | Public/anonymous endpoint allowlist still not release-reviewed. |
| Role policies | RequireAdmin, RequireAssessor, OSCoreAccess, TIER5AIAccess configured. | Proven by source inspection. | No exhaustive map from every controller action to required role/policy yet. |
| Dynamic permission policies | `RequiresPermission_*`, `module:*`, `PluginPermissionHandler`, `ModuleAccessHandler`; CX18 and CX27 tests. | Proven for covered paths. | Full plugin/module permission catalog still needs release-gate inventory. |
| Protected endpoint behavior | CX18 permission tests. | Proven for covered permission endpoints. | Not exhaustive across all controllers. |
| Dais county claim behavior | CX21 tests verify unauthenticated and missing county claim failures plus allowed county-claim reads. | Proven for covered Dais paths. | Dais unhappy-path E2E expansion is still planned for OE-008. |
| Cross-county denial | CX19 and CX22 tests verify no-leak/forbidden behavior across Atlas, CostForge, Dossier, Levy, Properties, and multi-county federation slices. | Proven for covered slices. | Full solution integration lane remains segmented by Docker/Testcontainers from OE-003. |
| Controller integrity | CX24 PR656 tests verify class-level authorize and county-scoped query patterns for Clerk, Treasury, and Audit controllers. | Proven for covered controllers. | Other controller families still need endpoint-by-endpoint inventory before release. |
| Audit trail county filtering | `AuditTrailEndpointsTests` verify no-county claim forbids and other-county events are excluded. | Proven for audit trail/search endpoints. | Audit coverage is not yet tied into a release checklist. |
| Audit event emission | `AuditEventEmissionTests` verify actor/county writes and county-code claim resolution. | Proven for covered writer/service behavior. | Runtime observability/audit signal map is deferred to OE-011. |
| Authorization denial audit coverage | `Program.cs` orders authorization before audit logging middleware. | Gap identified. | Release gates must not count middleware-level 401/403 authorization denials as audited until a dedicated proof or implementation change exists. |
| Entity audit stamping | `AuditableEntityInterceptor` stamps create/update actor and time from request context. | Source-proven. | Covered entity inventory is not release-gate complete. |
| Owner/PII leak checks | Cross-county and audit tests assert non-leak behavior for covered parcel/dossier/audit surfaces. | Partial. | There is no consolidated owner/PII leak test matrix across every public/protected endpoint. |

## Risk Register

| Risk | Severity | Evidence | Follow-up |
|------|----------|----------|-----------|
| Anonymous endpoint sprawl | Major | Source inventory shows many explicit `[AllowAnonymous]` endpoints. Some are expected health/public surfaces, but not all are classified for production exposure. | Include public/protected endpoint allowlist in OE-009 release gate or create a follow-up endpoint exposure review. |
| Controller policy map incomplete | Major | Important controllers are covered by tests and attributes, but there is no complete controller/action-to-policy matrix. | Carry into OE-009 release gate criteria. |
| Authorization denial audit overclaim risk | Major | `UseAuthorization()` runs before `UseAuditLogging()`, so middleware-level 401/403 denials may not reach audit logging. | OE-009 release gates must separate audited downstream/controller 403s from unproven middleware-level authorization denials. |
| Integration security proof segmented | Major | Unit-level proof passed; full solution integration lane remains Docker/Testcontainers-gated from OE-003. | Treat integration lane as segmented prerequisite until environment is available. |
| Runtime audit/trace completeness unproven | Major | Audit writer and endpoint tests exist, but operational signal mapping is deferred. | Complete OE-011 diagnostics and observability map. |
| Dais proof not fully E2E | Minor | Dais claim and access tests exist; broader unhappy-path proof is planned. | Complete OE-008 Dais workflow E2E proof expansion plan. |

## Validation

- `dotnet test backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week5Cx18PermissionPolicyIntegrationTests" --logger "console;verbosity=minimal"`: PASS, 70 passed.
- `dotnet test backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week5Cx19|FullyQualifiedName~R1Week5Cx21|FullyQualifiedName~R1Week5Cx22|FullyQualifiedName~R1Week5Cx24PR656|FullyQualifiedName~R1Week5Cx27|FullyQualifiedName~AuditTrailEndpointsTests|FullyQualifiedName~AuditEventEmissionTests" --logger "console;verbosity=minimal" --no-restore`: PASS, 131 passed.
- Initial broad test command with `--artifacts-path` timed out, and one focused `--artifacts-path` rerun crashed because the relocated artifact layout could not find the startup manifest. Rerunning without artifact relocation passed.
- No Docker/Testcontainers, migrations, production resources, secrets, county data, PACS, live DB, runtime mutation, or service startup were used.

## Verdict

Security/auth/county-isolation proof is consolidated enough to support Backend OE sequencing. It is not
enough to mark backend release-ready.

## Recommended Next WO

`WO-BACKEND-OE-007 - Migration and Rollback Proof Register`

Recommended scope:

- Inventory backend migrations.
- Classify Dais, PACS/sync, audit-event, and county-related migrations.
- Identify rollback/down-path evidence.
- Do not apply migrations.
- Do not create migrations.
- Do not touch production, county/PACS data, or live databases.

STOP_TYPE: BACKEND_SECURITY_PROOF_MATRIX_READY
