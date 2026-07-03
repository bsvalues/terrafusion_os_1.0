# WO-AU2-1 — Audit-Field Stamping Interceptor

**Date:** 2026-07-02
**Authorization:** SW-09 (code), AU2-1 scope: *stamping only* — no schema migration, no domain audit-event
emission, no ETL/bulk audit rows, no deployment, verify with focused tests + existing gates.
**Risk executed:** SW-09 — new interceptor on the primary request-pipeline DbContext. Verified by build + tests.

## What existed vs what was missing
Pre-existing WS-3 scaffolding on `main`:
- `TerraFusion.Core.Entities.IAuditableEntity` interface (`CreatedAt`, `UpdatedAt`, `string CreatedBy`, `string? UpdatedBy`).
- **5 entities already implement it** — `CapRateSet`, `CostFactorSet`, `DepreciationSchedule`, `LandScheduleSet`,
  `ParcelValuation` — with comments stating they are "stamped automatically by AuditableEntityInterceptor".
- **The interceptor was never built** (only comments referenced it) → those audit fields were not auto-stamped.

AU2-1 builds the missing interceptor against the existing interface. **No new entity was marked** (the nullable-
`CreatedBy` domain entities like `Appeal` use a different convention and were deliberately left out of scope — that
would be new marking, not stamping infrastructure), and **no schema changed**.

## Change
- **New:** `backend/src/TerraFusion.Data/Auditing/AuditableEntityInterceptor.cs` — a `SaveChangesInterceptor` that,
  on `SavingChanges`/`SavingChangesAsync`, stamps tracked `IAuditableEntity` entries:
  - **Added** → `CreatedAt/By` + `UpdatedAt/By` = now / actor.
  - **Modified** → `UpdatedAt/By` = now / actor (Created* preserved).
  - Actor from `IRequestUserContextAccessor.Current` (`UserId` when authenticated, else `"system"`); the resolve is
    wrapped in try/catch so audit stamping can never break a save.
  - **Stamping only** — it does not write `AuditEvents` rows (that is AU2-3).
- **Wiring:** `Program.cs` primary registration (`builder.Services.AddDbContext<TerraFusionDbContext>`, ~L2271)
  changed to the `(sp, options)` overload and now calls
  `options.AddInterceptors(sp.GetRequiredService<AuditableEntityInterceptor>())`; the interceptor is registered
  `AddScoped` (request-scoped, so the actor accessor is request-scoped). **Only** this registration is touched — the
  27 CLI/ETL/seeding `AddDbContext` scopes elsewhere in Program.cs are left alone, so **bulk/ETL saves are not
  stamped by this interceptor** (honoring the "no ETL/bulk audit rows" constraint by construction).

## Verification
- API `/warnaserror` build: **0 warnings / 0 errors** (nullability matches — interface `string CreatedBy` aligns
  with the 5 entities' existing non-null `CreatedBy`).
- New `AuditableEntityInterceptorTests` (isolated tiny DbContext + test `IAuditableEntity`): **3/3** —
  authenticated add stamps all four from the user; anonymous add stamps `"system"`; modify refreshes `Updated*`
  and preserves `Created*`. Full `Category=Audit`: **9/9** (3 new + 6 pre-existing, no regression).
- Runtime end-to-end proof (a real logged-in save stamping a Forge entity) needs a deploy (SW-01) and was not run;
  the isolated interceptor test proves the stamping behavior through the real EF SaveChanges pipeline.

## Scope honored / not done
- ✅ stamping only · ✅ `IRequestUserContextAccessor` actor · ✅ no schema migration · ✅ no `AuditEvents` emission ·
  ✅ ETL/bulk excluded (wired to primary context only) · ✅ no deployment · ✅ tests + existing gates.
- **Next (not authorized):** AU2-2 (`AuditEvents` +CountyId/index migration, SW-02), AU2-3 (curated event emission),
  AU2-4 (ETL exclusion controls — largely already true here), AU2-5 (e2e verify). Extending `IAuditableEntity` to
  more user-facing domain entities is also follow-on marking work, not part of AU2-1.
