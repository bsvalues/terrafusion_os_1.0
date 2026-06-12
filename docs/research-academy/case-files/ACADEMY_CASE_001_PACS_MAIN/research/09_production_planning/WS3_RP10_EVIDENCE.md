# RP-10 Evidence — AU-2 Audit Stamping (WS-3)

**Case:** ACADEMY_CASE_001_PACS_MAIN · **Workstream:** WS-3 · **Recorded:** 2026-06-12
**Gate:** G0 (audit live) · **Control:** AU-2

Evidence produced (not asserted) for the WS-3 audit-stamping interceptor. Proof = reproducible
run + recorded result.

---

## What was built (real repo types)

| Artifact | Path |
|---|---|
| Marker interface | `backend/src/TerraFusion.Core/Entities/IAuditableEntity.cs` |
| UTC clock abstraction | `backend/src/TerraFusion.Core/Time/IClock.cs` (`IClock` + `SystemClock`) |
| Interceptor (single audit path) | `backend/src/TerraFusion.Data/Interceptors/AuditableEntityInterceptor.cs` |
| DI wiring | `backend/src/TerraFusion.Data/Interceptors/AuditInterceptorServiceCollectionExtensions.cs` |
| Context wiring | `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` (DI ctor + `OnConfiguring` `AddInterceptors`; legacy broad-audit emission retired) |
| Marked entity (this increment) | `PropertyAssessment` → `: IAuditableEntity` |
| Startup registration | `backend/src/TerraFusion.API/Program.cs` (`AddAuditableEntityStamping()`) |
| Acceptance tests T1–T8 | `backend/tests/TerraFusion.Integration.Tests/Audit/AuditableEntityInterceptorTests.cs` |

User attribution uses the existing `IRequestUserContextAccessor` (real request user, "system"
fallback). Audit rows are written to the existing `AuditLogs` DbSet (`TerraFusion.Core.Entities.AuditLog`):
`Type = {Entity}_{State}`, `Data = {entity,key,action,county,user}` JSON, `Timestamp`, `UserId`,
`Source = "AuditableEntityInterceptor"`.

## Reproduce

```
cd backend/tests/TerraFusion.Integration.Tests
dotnet test --filter "FullyQualifiedName~AuditableEntityInterceptorTests"
```

**Environment:** .NET 8, EF Core InMemory provider, xUnit + FluentAssertions, Windows.
**Result (2026-06-12):** `Passed! - Failed: 0, Passed: 8, Skipped: 0, Total: 8`.

## RP-10 checklist mapping

| RP-10 item | Pass criterion | Evidence | Status |
|---|---|---|---|
| RP-10.1 | Every auditable write stamped; no default/empty CreatedBy/UpdatedBy | T1 (`insert_stamps_created_and_updated`), T8 (`bulk_save_all_stamped_and_logged`) | ✅ green |
| RP-10.2 | AuditLogs count == auditable writes (1:1) | T5 (1/2/3 per insert/update/delete), T8 (N rows for N inserts) | ✅ green |
| RP-10.3 | Update CreatedBy/At via caller → unchanged (tamper-proof) | T3 (`caller_cannot_override_created`) | ✅ green |
| RP-10.4 | Background/migration write (no HttpContext) → "system", no failure | T4 (`no_httpcontext_falls_back_to_system`) | ✅ green |
| RP-10.5 | CountyId isolation intact under interceptor | T6 (interceptor writes only the 4 audit fields), T7 (`non_auditable_entity_untouched_and_unlogged`); county read from request context, never written to entity | ✅ green |
| RP-10.6 | `chg_log` continuity: map a PACS `chg_log` action to the equivalent AuditLogs row | Mechanism in place — AuditLogs row carries entity/key/action/user/UTC/county sufficient to map a `chg_log` action. Full mapping requires live PACS `chg_log` and is a **cutover-time proof**, not runnable in the unit/integration env. | ⏳ deferred to cutover |

## Regression

- `CountyIsolationTests` and neighbors: **11 passed** after retiring the legacy broad-audit path
  (no test depended on it; verified by grep — only this WS-3 suite asserts on `AuditLogs`).
- `dotnet build TerraFusion.API` → **Build succeeded** with the startup wiring.

## Design decisions (made to honor the pack's intent against real types)

1. **Single audit path.** The DbContext's prior `SaveChangesAsync` override already emitted a
   broad audit row per changed entity with a hardcoded `UserId = "System"`. A second interceptor
   that also emitted would double-write (breaking RP-10.2). The legacy broad emission was retired;
   the interceptor is now the sole, marker-scoped audit path with **real** user attribution.
2. **Marker scope (minimal).** Only `PropertyAssessment` implements `IAuditableEntity` this
   increment (it already carried all four fields). Extending audit coverage = mark more entities
   (the interceptor picks them up automatically; T8 pattern). Until then, non-marked entities are
   not audited by the new path — tracked as follow-up.
3. **`SuppressAuditLogging` preserved.** Honored by the interceptor (bulk sync drains skip per-row
   audit; field stamping still applies). Existing callers unchanged.

## G0 status

Code-side AU-2 controls **cleared**: RP-10.1–10.5 green and reproducible; interceptor wired on the
context so no write path bypasses it; behind constructor/DI wiring (rollback = don't register).
**RP-10.6 (`chg_log` continuity) remains a cutover-time proof.** Recommend G0 sign-off for the
P1-shadow build with RP-10.6 carried as an explicit cutover gate item.

## Honesty note (pack sync — post-build cleanup)

The WS-3 pack's "verified" context was partly stale vs. the live repo: audit emission already
existed; `IClock`/`ICurrentUser`/`IAuditableEntity` did **not** exist (created here / mapped to
`IRequestUserContextAccessor`); there are two `AuditLog` types (the DbSet uses the Core one); and
`TerraFusion.Core.Configuration.DatabaseConfiguration` defines a **placeholder** `TerraFusionDbContext`
(name collision — the real one is `TerraFusion.Data.TerraFusionDbContext`). Folding these into
`WS3_AUDIT_INTERCEPTOR_PACK.md` is the agreed post-build honesty-sync.
