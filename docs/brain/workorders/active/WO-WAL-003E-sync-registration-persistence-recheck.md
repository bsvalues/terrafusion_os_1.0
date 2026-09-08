# WO-WAL-003E — Sync registration recheck before persistence

Parent: WO-WAL-003, Washington Assessor Launch V1, issue #1485.
Authority: OWNER-WAL-V1-MISSION-AUTHORITY-20260827 and OWNER-TF-STANDING-OPERATOR-AUTHORITY; current direct owner continuation.
Status: DELIVERING, bounded child; parent remains ACTIVE.
Risk: R5 inherited county-data persistence boundary; this child has no external-source or production access.
Source base: 0733406fe9067f5d5e61c4a361951c1c3700a9c8.
Worktree: C:/Users/bsval/tf-wal003e-sync-registration-recheck.
Branch: codex/wal003e-sync-registration-recheck.

## Outcome and precise limit

The shipped read-only Sales Sync service must refuse a batch when a disqualifying local connection-registration change committed during external extraction, before the persistence transaction begins, remains effective at that transaction's snapshot. Return a typed denial before SaveChanges, success receipt or success-state update. Preserve earlier imports and legitimate activity records.

The existing Serializable transaction may retain an earlier snapshot after its first database read. This is not a globally fresh final query, revoke-wins fence, ABA detector, external-role revocation mechanism, completed-import compensation or full WAL003 acceptance. Do not claim PostgreSQL concurrency proof from SQLite fixtures.

## Exact reservation

Builder, two whole files only:

- backend/src/TerraFusion.Data/Services/Sync/CountyReadOnlySalesSyncService.cs
- backend/tests/TerraFusion.Unit.Tests/Sync/CountyReadOnlySalesSyncServiceTests.cs

Coordinator governance paths, not builder-owned:

- This Work Order file.
- docs/brain/workorders/registry/work-order-registry.seed.json — own child only, deferred until prior registry integration; no parallel registry writer.
- docs/brain/evidence/WO-WAL-003E-proof.md — canonical proof only when executed.

Contract: existing wal.county-connected.readonly-sales-sync.v1 final persistence admission; no new wire shape, route or denial enum.
Five-suite coordinator compared committed, staged, unstaged and untracked paths and contract reservations: zero intersections. Main confirmed F/K/G non-overlap. This reservation does not acquire external county authority.

## Hard boundaries

- No Program, schema, migration, DbContext, source adapter, frontend, dependencies, deployment, credentials, protected county data or external DML/DDL.
- Only synthetic local fixtures in the existing Unit.Tests project. No Integration test discovery or real source calls.
- Keep existing external permission/identity/contract checks intact. Do not interpret application externalWrites=0 as observed source-side evidence.
- Unknown source authorization remains denied. The held historical Benton/Training references are not credentials or a current source grant.
- No mutation/deletion of prior activity evidence, existing imports or another county's state.
- Compilation, restore and tests require the separate resource coordinator's actual slot. Source preparation does not grant a runtime slot.
- Normal protected delivery, exact-head independent review and applicable required checks remain mandatory. No bypass or parent completion from this child.

## Execution

Read the current main-reviewed external plan wal003-pre-persistence-connection-recheck-plan.md, controlling root instructions, WO-WAL-003 and applicable domain knowledge. The plan's corrected race guarantee and audit-store distinction are mandatory.

Prepare the first deterministic test only. Pause extraction using a bounded barrier in a mocked read adapter; commit a local synthetic deactivation before releasing it. Observe a real behavioral RED against unchanged shipped production before implementing the guard. A compiler failure is not RED. All barriers release in finally; no sleep-based race.

The initial test-only hold is superseded for the narrow corresponding guard by Main's actual run34130. Normal thirteen-project Restore52276 passed at2026-09-08T11:50:18.9841179Z. Actual normal-project `RegistrationRed` compiled successfully and exited1 at2026-09-08T11:58:01.3016503Z: one test executed, failed `Assert.Equal` at test line652 with Expected `Denied`, Actual `Completed`, no fixture timeout or skipped test. The original production/test/WO pins stayed unchanged. Evidence is `wal003e-validation-RegistrationRed-86cffeea7503412ab77ae72947ed6009/registration.trx`, `raw.log`, `invocation.json` and `result.json` under Main's external evidence directory. This is causal behavior, not a restore/compiler failure or live-source observation.

Main now releases only the final tracked registration lookup guard in the reserved production service, following the reviewed snapshot-bound plan. Preserve the original failing regression unchanged for the first GREEN. After independent source review and actual focused GREEN, add the already-described preservation/adversarial matrix only inside the reserved test file. No new helper path, external call, schema, auth, runtime or production release. Compiler execution remains separately coordinated; this source release does not grant a heavy slot.

Use the existing persistence context/transaction. Recheck no active connection, ambiguous active connections, original ID, read-only PACS declaration and relevant source/configuration metadata. Denial returns without saving tracked candidates, publishing success or clearing the disconnect error. Preserve cancellation and existing transaction-failure behavior.

Test replacement, deletion, ambiguity, moved county, lost read-only declaration and relevant metadata changes, along with unchanged/descriptive-only behavior and foreign-county preservation. Compare real persisted state with a fresh context. AuditEvents absence refers to the success receipt; snapshot legitimate AuditLogs after the intentional profile edit and assert no additional Sync changes, not globally empty audit storage. Preserve an earlier successful import during a denied second run.

Run focused RED/GREEN, complete existing service test class and independent review. Canonical Brain review-diff/proof/commit-plan and normal branch/PR/check/merge lifecycle are coordinator-owned. Do not reopen completed WAL003A–D or claim this child supplies live source evidence or completed-import rollback.

## Continuation

WO-WAL-003 and issue #1485 remain ACTIVE until their own terminal predicates pass. Missing live-source evidence does not stop authorized source-independent product work. Production remains gated by WAL007 and external assessor acceptance remains unproven.

## Executed evidence and current delivery scope

Actual focused GREEN40534 completed EXIT0 at2026-09-08T12:08:58.3218313Z: the original unchanged regression passed after only the service guard repair. Main then released the planned matrix inside the reserved test file. Actual full-class98736 completed EXIT0 at2026-09-08T12:26:52.0007611Z:34 passed,0 failed,0 skipped, comprising21 persistence-recheck cases and13 existing cases. Independent assurance inspected the actual results and source and returned CLEAR. Exact receipt hashes, source identities, fixture limitations and rollback are in `docs/brain/evidence/WO-WAL-003E-proof.md`. These tests ran against base073 plus explicitly pinned uncommitted source, not a future delivery SHA.

Normal own frozen install56121 and19-project solution restore passed; normal checkpoint93526 completed EXIT0 at2026-09-08T13:02:02.000989Z, clean3e34deae85895872fad2559c87df151e734083b0. Its entire tree equals reviewed pre-hook8cae5f6e760734eaf050d1f9e8ed6c5ff43b12ee. Independent assurance verified all four source/metadata hashes unchanged. H PR1577 merged at2026-09-08T13:08:44Z, releasing the H registry reservation. Main normally integrated exact protected63bea324baa9d8d9c5300892cae1f781b70465ef into the clean checkpoint, producing57e92dcef3a6d25d65a1046020b4eae5be7f880e. Relative to that base, only the four003E paths differ.

Main now reserves only the new003E record in the registry as the fifth delivery path, preserving every prior record and root metadata. G/K acquire no parallel registry writer. Normal exact integrated-candidate validation, independent final review and protected delivery remain outstanding. No old34-case receipt is retagged to this new head, and no live-source or production activation is released by local test success.

<!-- brain-machine-policy: exact five-file delivery scope; Main edits only the003E registry record -->
```json
{
  "id": "WO-WAL-003E",
  "task": "Reject disqualifying registration changes visible at the existing persistence snapshot",
  "risk": "R5",
  "suite": "TerraForge",
  "allowed_files": [
    "backend/src/TerraFusion.Data/Services/Sync/CountyReadOnlySalesSyncService.cs",
    "backend/tests/TerraFusion.Unit.Tests/Sync/CountyReadOnlySalesSyncServiceTests.cs",
    "docs/brain/workorders/active/WO-WAL-003E-sync-registration-persistence-recheck.md",
    "docs/brain/evidence/WO-WAL-003E-proof.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json"
  ],
  "forbidden_patterns": [
    "frontend/**", ".github/**", "backend/**/Migrations/**",
    "backend/src/TerraFusion.API/**",
    "package.json", "pnpm-lock.yaml"
  ],
  "required_proof": [
    "Actual unchanged-test behavioral RED and focused GREEN",
    "Actual full34 service regression and independent assurance",
    "brain review-diff --workorder WO-WAL-003E",
    "brain commit-plan --workorder WO-WAL-003E",
    "Exact committed candidate validation and normal protected delivery"
  ]
}
```
