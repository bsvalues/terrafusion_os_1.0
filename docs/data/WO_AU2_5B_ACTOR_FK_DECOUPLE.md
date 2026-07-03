# WO-AU2-5B — AuditEvents Actor FK Decoupling + E2E PASS

**Date:** 2026-07-03
**Authorization:** SW-02 (targeted schema migration) granted by operator, with a hard stop clause:
"stop if migration contains anything beyond the FK/navigation decoupling".
**Result:** **E2E PASS — the audit trail populates live.** The AU-2 program's runtime proof is complete.

## The fix
`AuditEvents.UserId` is a plain actor identifier (JWT `GovernmentUser` GUID or `"system"`), never a
`CollaborationUsers` key. The legacy `[ForeignKey] CollaborationUser User` navigation made **every** trail INSERT
violate `FK_AuditEvents_CollaborationUsers_UserId` (CollaborationUsers has 0 rows) — the AU2-5 blocker.

Changes (branch `wo/au2-5b-actor-fk-decouple`, based on the AU-2 stack):
- **Entity:** removed the `[ForeignKey(nameof(UserId))] CollaborationUser User` navigation from `AuditEvent`.
  Added `[StringLength(450)]` on `UserId` (pins the pre-FK column type) and `[Index(nameof(UserId))]` (preserves the
  by-user index) so the migration touches **only** the FK. The `Project.AuditEvents` ↔ nullable `ProjectId` FK is
  untouched (out of scope; nullable FKs pass on NULL).
- **`CollaborationService`:** removed the two `.Include(ae => ae.User)`; `MapToAuditEventDto` now surfaces the actor
  id directly on the DTO (no profile lookup — CollaborationUsers is empty anyway).

## Migration discipline — scope clause enforced in practice
- **First-cut migration REJECTED by inspection:** EF scaffolded `DropIndex IX_AuditEvents_UserId` +
  `AlterColumn UserId varchar(450)→text` alongside the FK drop (consequences of losing the relationship). Per the
  stop clause, it was **removed** and the entity was pinned (`[StringLength(450)]`, `[Index]`), then regenerated.
- **Final migration `20260703125335_AU2_5B_AuditEventsActorFkDecouple` is a PURE decouple:**
  `Up = DropForeignKey FK_AuditEvents_CollaborationUsers_UserId` only; `Down` = exact restore. Generated with API as
  `--startup-project` (`--context TerraFusionDbContext`); snapshot diff 1+/8− (relationship block only).
- Build `/warnaserror` 0-warn; `Category=Audit|Stage2` **81/81**.

## Deploy + verification (live demo)
- Merged into `au2-5-deploy-integration`, rebuilt Release, Kudu-VFS PUT the three DLLs (API/Data/Core, 204×3),
  restart. Note: the first post-restart `/health/ready` 200 was the **old instance** still serving (the AU2-5B
  migration wasn't in history yet); the second poll cycle caught the new instance. LESSON: after a DLL swap +
  restart, confirm the *new* instance via `__EFMigrationsHistory` (or gitSha), not just a 200.
- **Migration applied by AutoMigrate:** `FK_AuditEvents_CollaborationUsers_UserId` remaining = **0**;
  `__EFMigrationsHistory` top = `20260703125335_AU2_5B_AuditEventsActorFkDecouple`.

## E2E — PASS (the AU-2 program's closing proof)
Re-ran the preserved AU2-5 script (`au25-e2e.js`, minted operator token in-memory, parcel `AU25B-E2E-TEST`):
```
STEP1  GET /api/dais/exemptions/eligibility?...   → 200 eligible
STEP2  GET /api/audit/trail?parcelId=...          → 200 [ event a0a96e4f-… ]
STEP3  GET /api/audit/search?...&category=exemption → 200 [ same event ]
DB     AuditEvents row: Entity=Exemption · EntityId=AU25B-E2E-TEST ·
       UserId=<operator GUID> · CountyId=19190019-…(Benton) · Timestamp live
VERDICT: E2E PASS — category=exemption, actor + county populated
```
A governed Dais action now writes a domain audit event and appears on the per-parcel trail with the correct
category, actor, and county. The Dais AuditTab/AuditTrailPage light up with no further change.

## Scope honored
FK/navigation decoupling only ✅ · migration inspected, first cut rejected, final = pure FK drop ✅ · only that
migration applied to the demo (via AutoMigrate) ✅ · only affected DLLs redeployed ✅ · preserved e2e re-run ✅ ·
no unrelated schema changes ✅ · no data cleanup ✅ · no broad capture expansion ✅ · no secrets logged ✅.

## AU-2 PROGRAM COMPLETE
AU2-1 stamping ✅ · AU2-2 schema ✅ · AU2-3 emission ✅ · AU2-4 ETL exclusion ✅ · AU2-5/5B deploy + live e2e ✅.
The AU-2 (event capture) + AU-3 (record content) control work is runtime-proven on the Benton demo.
Test rows on parcels `AU25-E2E-TEST` (none — blocked run wrote nothing) and `AU25B-E2E-TEST` (1 event) are real
audit records of real probe actions and are left in place (they are the proof).
