# WO-AU2-4 — ETL / Bulk Exclusion from Audit-Event Emission

**Date:** 2026-07-02
**Authorization:** SW-09 (code — guard tests only). AU2-4 scope: verify + formalize that ETL/bulk paths do not
emit `AuditEvents`; add guard tests/docs; no deploy, no mutation, no migration, no broad emission.
**Risk executed:** R0/R1 — read-only proof + 3 architecture guard tests + this doc. No runtime behavior changed.

## Invariant
Bulk / ETL / sync / drain / projector / landing paths must **never** emit per-parcel `AuditEvents` trail rows.
(The 1.87M-row imprv drain, sale drains, canonical projectors, PACS landing, and `CanonicalDebugController` run-chain
must not flood the trail.)

## Proof (source-verified)

### 1. Only two things write `AuditEvents` — both user-facing, neither ETL
`grep '.AuditEvents.Add'` across `backend/src` returns exactly two writers:
- `TerraFusion.API/Services/AuditEventWriter.cs` — the curated Dais emitter (AU2-3), driven by
  `GovernedToolAuditService` off governed Dais actions.
- `TerraFusion.Core/Services/CollaborationService.cs` — `CreateAuditEventAsync(...)`, a **user-facing collaboration**
  audit path (teams/projects/tasks/documents), resilient try/catch. `grep` confirms **no** sync/ETL/projector/drain
  service calls `CollaborationService`.

Neither is an ETL/bulk path. (Note: `CollaborationService` writes `AuditEvents` directly rather than via
`IAuditEventWriter` — a pre-existing second emitter, candidate for future consolidation under the writer, but **out of
AU2-4 scope** and not an ETL concern.)

### 2. The exclusion is STRUCTURAL (assembly layering), not a runtime filter
- The curated emission services — `IAuditEventWriter` and `IGovernedToolAuditService` — live in **`TerraFusion.API`**.
- ETL/projector/drain/landing services live in **`TerraFusion.Data`** (e.g. `Services/LegacyPacsRaw`,
  `Services/CanonicalTf`, `Services/Doctrine`) and **`TerraFusion.Sync`** (workbench transforms).
- Those assemblies **do not reference `TerraFusion.API`** (verified: `.csproj` + guard tests below). ETL code
  therefore cannot even name the curated emitter, let alone invoke it.

### 3. The API-side ETL entry point doesn't emit
`CanonicalDebugController` (the HTTP entry for run-chain / drains / projector triggers, which lives in
`TerraFusion.API`) contains **no** reference to `IAuditEventWriter`, `GovernedToolAuditService`,
`LogInvocationAsync`, or `AuditEvents` — so triggering ETL over HTTP emits no trail rows.

### 4. `IAuditEventWriter` is consumed only by the curated path
`grep IAuditEventWriter` shows usages only in: its own definition, `GovernedToolAuditService` (the consumer), and the
DI registration in `Program.cs`. No ETL/sync/projector/drain consumer.

## Guard tests (formalization — `AuditEtlExclusionGuardTests`)
Three architecture guards that fail if the structural exclusion erodes:
- `DataLayer_DoesNotReference_ApiEmissionLayer` — `TerraFusion.Data` assembly must not reference `TerraFusion.API`.
- `SyncLayer_DoesNotReference_ApiEmissionLayer` — `TerraFusion.Sync` assembly must not reference `TerraFusion.API`.
- `EmissionServices_LiveInApiLayer` — `IAuditEventWriter` + `IGovernedToolAuditService` must reside in
  `TerraFusion.API` (so the layering argument stays valid; moving them down would silently break the guarantee).

`Category=Audit`: **22/22 pass** (3 new guards + prior AU2-1/AU2-3 tests).

## Disposition
ETL/bulk exclusion is **proven and now guarded**. No runtime behavior was added — the exclusion was already true by
construction (layering); AU2-4 turns "already true" into "tested and enforced". Per scope, stopped at the guardrails:
no deploy, no data mutation, no schema migration, no broadened emission.

**Remaining:** AU2-5 (deploy AU2-1..3 + apply AU2-2 migration + live-verify a Dais action lands in `/api/audit/trail`)
— an SW-01 deploy wall. Optional future cleanup (not AU2-x): route `CollaborationService` audit writes through
`IAuditEventWriter` for a single emission path.
