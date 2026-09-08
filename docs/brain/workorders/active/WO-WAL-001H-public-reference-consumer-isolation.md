# WO-WAL-001H — Public-reference consumer isolation

Parent: WO-WAL-001 / Washington Assessor Launch V1 / issue #1485.
Authority: OWNER-WAL-V1-MISSION-AUTHORITY-20260827, OWNER-TF-STANDING-OPERATOR-AUTHORITY and the current direct owner continuation instruction. This records bounded execution, not new authority.
Status: DELIVERING — actual behavioral RED, SQLite consumer proof and full48 regression independently cleared; normal protected delivery remains pending.
Base: protected0733406fe9067f5d5e61c4a361951c1c3700a9c8.
Worktree: C:/Users/bsval/tf-wal001h-public-reference-consumer-isolation.
Branch: codex/wal001h-public-reference-consumer-isolation.
Risk: R5; county/source-derived identity and persistence selection. No risk downgrade.

## Bounded outcome

Prevent the separately governed public-reference profile from inflating PACS reconciliation or becoming a PACS geometry-match target. Preserve existing non-profile behavior, county filters, geometry, source authority and already-closed crosswalks. This is a necessary mixed-consumer dependency of WAL001G, not a new public-data acquisition or production activation path.

Read-only source evidence at the base identifies three affected queries: PacsBaselineReconciler.CountTfCanonicalAsync counts all parcels; ArcGisCrosswalkService.CloseCrosswalkAsync matches county/APN without source qualification; ArcGisCanonicalProjector independently builds a first-match APN index. These are source findings, not observed test failures or production incidents.

## Exact builder reservation

1. backend/src/TerraFusion.Data/Services/Workbench/Corpus/PacsBaselineReconciler.cs
2. backend/tests/TerraFusion.Unit.Tests/Sync/Corpus/PacsBaselineReconcilerTests.cs
3. backend/src/TerraFusion.Data/Services/GisTf/ArcGisCrosswalkService.cs
4. backend/tests/TerraFusion.Unit.Tests/GisTf/ArcGisRest/ArcGisCrosswalkServiceTests.cs
5. backend/src/TerraFusion.Data/Services/GisTf/ArcGisCanonicalProjector.cs
6. backend/tests/TerraFusion.Unit.Tests/GisTf/ArcGisCanonicalProjectorTests.cs

This Work Order is a coordinator-owned seventh metadata path. Main additionally reserves `docs/brain/evidence/WO-WAL-001H-proof.md` for canonical recording of the now-executed proof. The shared registry remains held behind the existing F delivery reservation; no parallel registry writer is released. No contract, model, Program, migration, configuration, dependency, UI or other suite file is released. No helper outside the six builder paths may be added silently.

Five-suite coordinator01a07cd1-5e6f-7a72-9294-9ba4cb975fe9 checked all six paths against the five companions' committed deltas fromed442 and staged/unstaged/untracked changes: no intersection or companion claim. F/G/K/003E reservations are separately disjoint. This is collision clearance, not a data or production grant.

## Initial release and dependency

Only prepare behavioral regression source in existing test files2,4,6. Production files1,3,5 remain unchanged until corresponding actual behavioral RED and coordinator continuation. Missing symbols, fixture failures, compilation errors and skipped tests are not RED. No restore/compiler/browser/API/DB process is released by this source-preparation Work Order; Main schedules actual normal-project validation after source review.

The initial source-only hold is now superseded for the three bounded production fixes: Main actual normal Restore19791 passed2026-09-08T10:37:53.9247141Z. Normal thirteen-project test81446 ran10:38:48.3473210Z–10:46:54.9782884Z, EXIT1,16 executed/12 failed/4 passed/0 skipped, with unchanged source and dependency hashes. Failures establish count inflation atline125, crosswalk false closure/ambiguity atlines138/170 and canonical projection wrong-target selection atlines175/218. These are assertion failures in actual services after a successful build, not fixture/compiler failures. Existing-link and legitimate-first controls already pass and must remain passing. Captured log wal001h-consumer-red-20260908T1038.txt and consumer-red.trx in wal001h-consumer-red-28b228a4560843cf969495e1beea0dc0 retain the original evidence.

Main releases only the corresponding ownership-qualified query repairs in production files1,3,5, preserving the reviewed tests unless an independently justified new regression is needed within files2,4,6. No global UNDER_REVIEW exclusion, guessed PACS whitelist, old-link repair, source identity reinterpretation or new shared helper is authorized. Implement against the selected G versioned profile, then independent review and an actual normal-project GREEN/regression run are required. This metadata does not itself grant a compiler or runtime slot. Persistence activation remains behind the coordinated G/H protected integration and relational proof.

Actual normal full-three-class GREEN3772 exited0 at2026-09-08T11:10:07.2268860Z:45 passed/0 failed/0 skipped, including all16 H cases and29 existing controls. All seven source/WO and nineteen dependency pins remained unchanged. Evidence: `wal001h-consumer-green-1226a28922704e538f5afc48b7ccc4fa/consumer-green.trx` and captured `validation.txt`. Independent source review approved the three query fixes; this InMemory result does not establish relational behavior.

Main reviewed the appended relational plan in external `wal001h-consumer-isolation-plan.md`, SHA256 `8fc19754660852783eee29a4dcd1a14920fe80c03e13d7f2164ca55541e1b7ae`, and releases only test-source additions in files2,4,6: one SQLite consumer-execution Fact per file plus same-file fixture helpers. Use the existing actual application context, provider and generated schema, including its exact selected indexes/constraints and normal auditing. Keep existing cases/assertions; optional helper context parameters must preserve their defaults. Production files1,3,5 stay frozen. No handwritten table definitions, model rewriting, dependency change, new shared helper, real data, source connection or runtime activation. Generated schema/translation/fixture failures require diagnosis, never weakened constraints or fabricated behavioral RED. Compiler execution remains separately coordinated; passing SQLite does not certify PostgreSQL production or atomicity. G persistence remains held for protected integration and its own actual admission proof.

The selected G design is source family/system SOCRATA_PUBLIC_EXPORT with versioned profile wal.public-parcel-reference.socrata.v1, explicitly UNDER_REVIEW and six-key non-PACS lineage. Its additive v1.14 contract remains under coordinated delivery. H tests may model that explicitly synthetic boundary; H implementation/release must agree with the finalized G contract. Do not claim a drafted profile is protected history.

Use existing SourceXref.TfEntityId to parcel and LoadBatchId to LoadBatch source ownership. Excluding every UNDER_REVIEW parcel is forbidden: that status is not provenance. A new guessed PACS-family whitelist is also forbidden. Preserve existing lineage-free behavior and non-G/PACS-backed UNDER_REVIEW controls unless separately authorized contract evidence proves otherwise. Do not repair/relink historical geometry or overwrite non-null crosswalks.

## Actual relational and combined regression evidence

Main normal thirteen-project run63868 exited0 at2026-09-08T11:41:27.7972264Z: all three actual application-context SQLite consumer Facts passed, zero failures/skips. They preserve selected generated schema constraints/indexes, enforce foreign keys, execute the real queries, and verify normal gate/audit behavior and unchanged prior/foreign state. This is a selected SQLite schema slice, not PostgreSQL or full-model migration proof.

Main run29091 separately executed all three complete consumer classes with `--no-build --no-restore` against those same binaries, exiting0 at2026-09-08T11:48:58.3365990Z:48 passed/0 failed/0 skipped. All26 source/WO/dependency pins, both selected DLL pins and seven-path scope were unchanged. Independent assurance verified the actual TRX and linkage and returned CLEAR for normal protected delivery. Canonical receipt hashes, limitations and rollback are recorded in `docs/brain/evidence/WO-WAL-001H-proof.md`. These subsequent metadata edits do not retag the earlier WO hash or claim a new compiled release identity.

No G persistence is released: protected integration and G's own actual admission/transaction/replay proof remain required. H does not establish atomicity, production, source rights, actual parcel landing or parent completion.

## Required behavioral proof

- A legitimate baseline parcel remains count1 after one synthetic G reference is added; both parcels and lineages remain persisted and unchanged.
- Geometry matching only a G reference stays unlinked and reports the actual no-match result/gate, not false closure.
- A legitimate target plus same-APN G reference resolves only to the legitimate target, without artificial ambiguity or order-dependent selection, through both crosswalk maintenance and canonical projection.
- Non-G UNDER_REVIEW, lineage-free baseline behavior, real duplicate legitimate targets, county separation, existing links and current gate/audit behavior remain protected by regression controls.
- Existing EF InMemory fixtures prove behavior only; they do not prove SQL translation, relational constraints or transactions. Required relational validation must use the normal existing application/Unit.Tests framework and a separately assigned disposable fixture, never a surrogate project or production database.
- No external source query/write, production mutation, real parcel values in committed fixtures/logs, source credentials, authority bootstrap, network or geometry source change.

Read root AGENTS/CANON_INDEX, applicable Atlas/Forge packs and existing governing contracts before implementation. Main owns independent assurance, Brain review-diff/commit-plan, normal protected delivery and continuation. Child tests, merge or queue depletion cannot complete #1485. Parent remains ACTIVE through actual all-county, production and external-assessor terminal acceptance.

## Machine-enforced current delivery scope

This policy records the exact current eight-path reservation above; it does not release the held shared registry or create resource/production authority.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-WAL-001H",
  "task": "Public-reference consumer isolation in three existing ownership queries",
  "risk": "R5",
  "suite": "atlas",
  "allowed_files": [
    "backend/src/TerraFusion.Data/Services/Workbench/Corpus/PacsBaselineReconciler.cs",
    "backend/tests/TerraFusion.Unit.Tests/Sync/Corpus/PacsBaselineReconcilerTests.cs",
    "backend/src/TerraFusion.Data/Services/GisTf/ArcGisCrosswalkService.cs",
    "backend/tests/TerraFusion.Unit.Tests/GisTf/ArcGisRest/ArcGisCrosswalkServiceTests.cs",
    "backend/src/TerraFusion.Data/Services/GisTf/ArcGisCanonicalProjector.cs",
    "backend/tests/TerraFusion.Unit.Tests/GisTf/ArcGisCanonicalProjectorTests.cs",
    "docs/brain/workorders/active/WO-WAL-001H-public-reference-consumer-isolation.md",
    "docs/brain/evidence/WO-WAL-001H-proof.md"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "frontend/**",
    ".github/**",
    ".governance/**",
    "backend/**/Migrations/**",
    "backend/src/TerraFusion.API/**",
    "docs/brain/workorders/registry/**",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "Actual behavioral RED and full48 consumer regression",
    "Actual SQLite consumer execution with generated schema and normal audits",
    "Independent exact-scope and evidence review",
    "brain review-diff --workorder WO-WAL-001H",
    "brain commit-plan --workorder WO-WAL-001H",
    "Normal protected delivery without parent completion inference"
  ]
}
```
