# WO-AU2-3 — Curated Audit-Event Emission

**Date:** 2026-07-02
**Authorization:** SW-09 (code). AU2-3: `IAuditEventWriter` + curated emission at user-facing domain actions,
populating `CountyId`, mapped to the category taxonomy.
**Depends on:** AU2-2 (`AuditEvents.CountyId`) — this branch is based on the AU2-2 branch.
**Risk executed:** SW-09 — new service + one existing service extended. Verified by build + tests. No deployment;
runtime end-to-end (a live logged-in action landing in the trail) needs a deploy (SW-01), not run here.

## Key discovery — the emission point already existed
Every governed Dais action already calls `GovernedToolAuditService.LogInvocationAsync(toolName, parcelId, userId,
status)` (file_appeal, create_exemption, sign_off_certification_step, generate_notice, queue ops, …). But that
service writes to **`AuditLogs`** (telemetry), **not** `AuditEvents` (the trail feed read by `/api/audit/trail`).
So the fix hooks into that existing call site — **instrumenting every curated Dais action with zero controller edits.**

## Change
- **New `IAuditEventWriter` / `AuditEventWriter`** (`TerraFusion.API.Services`): writes one `AuditEvents` row.
  Actor (`UserId`) and `CountyId` are resolved from `IRequestUserContextAccessor` (`UserId` else `"system"`;
  `CountyId` parsed from the county claim, else NULL). Self-contained (own `SaveChanges`) and **never throws** —
  audit emission must not break the domain action.
- **`GovernedToolAuditService`** now also emits an `AuditEvents` row after its existing `AuditLogs` write, via
  `IAuditEventWriter`. A `MapTool(toolName) → (Entity, AuditEventType)` helper classifies the tool:
  appeal/boe/hearing→`Appeal`, exempt→`Exemption`, certification→`Certification`, notice→`Notice`, queue→`Queue`,
  classify→`Assessment`, else→`Dais`; `EntityId = parcelId` (so events land on that parcel's trail). The reader's
  `MapCategory` then derives the frontend category from `Entity` (e.g. `Appeal`→`appeal`, `Exemption`→`exemption`).
- **DI:** `IAuditEventWriter` registered `AddScoped` next to `IGovernedToolAuditService`.

## Verification
- API `/warnaserror`: **0 warnings / 0 errors** (incl. disambiguating `TerraFusion.Core.Entities.Task` vs
  `System.Threading.Tasks.Task` with a using alias).
- New `AuditEventEmissionTests`: writer stamps actor+county (authenticated) and `"system"`/NULL (anonymous); the
  service writes an `AuditLog` AND emits the mapped `AuditEvent`; a 10-case theory locks the tool→entity/type map.
- **Regression caught & fixed:** the ctor gained a parameter, which broke the pre-existing
  `Stage2/GovernedToolAuditServiceTests` (3 sites) — updated to pass a mock writer (their `AuditLogs` assertions are
  unaffected). Also fixed the mapping so `schedule_boe_hearing` correctly classifies as `Appeal` (a test surfaced it).
- Full `Category=Audit|Stage2`: **78/78 pass**.

## Scope honored / not done
- ✅ `IAuditEventWriter` · ✅ curated emission at user-facing Dais actions (via the existing governed call site) ·
  ✅ populates `CountyId` · ✅ maps to the category taxonomy · ✅ resilient (never breaks the action) · ✅ no deploy.
- **Not instrumented:** non-Dais write paths and ETL (out of scope — AU2-4 formalizes ETL exclusion; ETL already
  doesn't call this service). **Next:** AU2-4 (ETL exclusion controls), AU2-5 (deploy + e2e verify the trail
  populates). Applying AU2-2's migration + seeing live events both require a deploy (SW-01).
