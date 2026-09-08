# WO-WAL-001F — Parcel Baseline Runtime Projection

Parent: WO-WAL-001, Washington Assessor Launch V1, GitHub issue #1485.
Authority: OWNER-WAL-V1-MISSION-AUTHORITY-20260827 and OWNER-TF-STANDING-OPERATOR-AUTHORITY; current direct owner continuation instruction.
Status: DELIVERING — actual bounded API/browser acceptance passed; protected delivery pending, not parent completion.
Initial assignment base: ed442c84b916cb7a667cc162236dc9dae0b1b39b.
Integrated source base: 0733406fe9067f5d5e61c4a361951c1c3700a9c8 (main-coordinated fast-forward; observed HEAD for the metadata/proof continuation).
Worktree: C:/Users/bsval/tf-wal001f-public-baseline-sparse; branch codex/wal001f-public-baseline.

## Product outcome

An authenticated assessor selecting a Washington county sees its actual parcel-baseline state in Counties HUB, distinct from sales availability. The state is derived from county-bound runtime records and their provenance, or an explicit unavailable/unverified/source-use gap. Registry presence, source aggregate counts and sales shards must never masquerade as landed public parcels.

## Global Constraints

- Preserve all accepted WACO artifacts/runtime and all existing suite reservations.
- No external county-system writes, new credentials, non-public acquisition, production deployment, new schema/migration, Program.cs edits, or suite business-logic changes.
- No claim that every county needs sales coverage. Parcel context and sales capabilities are distinct.
- No parcel-source redistribution in this child. WaTech public-source terms have unresolved county-specific use restrictions; aggregate reachability is not redistribution permission.
- New API projection must require authenticated canonical county authorization and reject a different or unknown county; a route token alone grants no authority.
- Existing statistics and endpoints remain behavior-equivalent. No synthetic/seeder marker or source-system name alone establishes public lineage. Unknown provenance and unknown legal use stay unavailable/unverified, never ready.
- No backend bearer credentials, personal record payloads, or source secrets in evidence.
- No broad framework, alternative database, public-status service, scheduler, or second Brain.
- Commit/PR/check/review/eligible merge are agent-owned; this child cannot close the parent mission.

## Exact reservation

- This Work Order file.
- backend/src/TerraFusion.API/Controllers/CountyRowsController.cs: one additive authenticated parcel-baseline metadata endpoint, existing endpoints unchanged.
- backend/tests/TerraFusion.Unit.Tests/Counties/CountyParcelBaselineTests.cs: new focused tests in existing project.
- frontend/apps/os-shell/src/services/washingtonCountyLaunch.ts: additive typed parcel-baseline request and strict response validation, existing sales behavior unchanged.
- frontend/apps/os-shell/src/components/CountiesHub.tsx: selected-county parcel-baseline presentation only.
- frontend/apps/os-shell/src/__tests__/shell/countiesHubParcelBaseline.test.tsx: new focused UI tests.
- frontend/apps/os-shell/src/__tests__/shell/washingtonParcelBaseline.contract.test.ts: new client contract tests.
- docs/brain/workorders/registry/work-order-registry.seed.json: this child registration only, preserving historical rows and open parent states.
- docs/brain/evidence/WO-WAL-001F-proof.md: ninth exact path, canonical Brain proof output authorized by the coordinator's limited metadata/artifact continuation.

No other production/test file is granted without coordinator review of the concrete need. New supporting helper path, if essential for testable small design, must be proposed before writing. No changes in another worktree.

### Temporary generated outputs (not PR source)

The coordinator separately authorizes the existing publisher to generate these exact scratch outputs,
only after verifying that the worktree's `wiki` directory is absent:

- wiki/README.md
- wiki/start-here.md
- wiki/constitution.md
- wiki/five-layer-model.md
- wiki/suite-boundaries.md
- wiki/property-workbench.md
- wiki/cortex.md
- wiki/agent-operating-model.md
- wiki/release-1.0.md
- wiki/glossary.md
- wiki/suites/forge.md
- wiki/suites/atlas.md
- wiki/suites/dais.md
- wiki/suites/dossier.md
- wiki/suites/gpt.md

Run the existing publisher, its `--check`, and canonical Brain proof with bundled Node in process
PATH. Do not regenerate canon. After proof, verify exactly these 15 files and no extras, no reparse
points, and an absent destination. Move only that fresh owned directory from
`C:/Users/bsval/tf-wal001f-public-baseline-sparse/wiki` to
`C:/Users/bsval/.codex/visualizations/2026/09/06/01a07732-71da-73f0-8651-896ec72d5be4/wal001f-generated-wiki`.
This is authorized recoverable artifact relocation, not source reservation expansion or cleanup
authority. Preserve the files externally; do not overwrite, recursively delete, or stage them.

All controller/client/UI/test files remain frozen during main's compiler and review work. Only this
WO, its existing registry row, the ninth proof output, and the external report may change in this
continuation. Final runtime acceptance must include the integrated source base, not only the initial
assignment base; no compiler/server/install/commit is authorized for this continuation.

## Execution binding

Risk: R5, authenticated county metadata boundary. Reservation clearance was supplied directly after
the coordinator compared all five suite tracked/untracked diffs with the exact base. The separately
authorized task-1 report is an evidence handoff, not another product reservation. After the local
ignored SDD directory became absent, main reserved this durable external report destination:
`C:/Users/bsval/.codex/visualizations/2026/09/06/01a07732-71da-73f0-8651-896ec72d5be4/wal001f-task-1-report.md`.

Contract: `wal.county-parcel-baseline.v1`, `GET /api/counties/{countyToken}/parcel-baseline`.
Environment: isolated WAL001F worktree, light tests now; compiler/runtime/browser only in the
coordinator-assigned slot. Main owns independent review, protected-base integration and delivery.

The previous program note describing an unregistered acquisition child is historical context;
this directly assigned child projects existing runtime metadata and acquires no source bytes.

<!-- brain-machine-policy: exact nine PR paths; temporary generated wiki outputs are not PR source -->
```json
{
  "id": "WO-WAL-001F",
  "task": "Parcel baseline runtime projection",
  "risk": "R5",
  "suite": "OS Core",
  "allowed_files": [
    "docs/brain/workorders/active/WO-WAL-001F-parcel-baseline-runtime-projection.md",
    "backend/src/TerraFusion.API/Controllers/CountyRowsController.cs",
    "backend/tests/TerraFusion.Unit.Tests/Counties/CountyParcelBaselineTests.cs",
    "frontend/apps/os-shell/src/services/washingtonCountyLaunch.ts",
    "frontend/apps/os-shell/src/components/CountiesHub.tsx",
    "frontend/apps/os-shell/src/__tests__/shell/countiesHubParcelBaseline.test.tsx",
    "frontend/apps/os-shell/src/__tests__/shell/washingtonParcelBaseline.contract.test.ts",
    "docs/brain/workorders/registry/work-order-registry.seed.json",
    "docs/brain/evidence/WO-WAL-001F-proof.md"
  ],
  "forbidden_patterns": ["**/Program.cs", "**/Migrations/**", "package.json", "frontend/package.json"],
  "required_proof": [
    "focused client, HUB and backend tests",
    "canonical Brain review-diff, proof and commit-plan",
    "independent review and actual API/browser acceptance on integrated protected base"
  ]
}
```

## Task 1: Implement and verify the additive parcel-baseline product seam

Read existing CountyRowsController, canonical county authorization used by current DataImportController, existing TfParcel/source-lineage model and existing Counties HUB request lifecycle. First identify whether actual provenance evidence can distinguish public-source parcels. If it cannot, expose honest unverified provenance and do not invent a new trusted source allowlist or count all canonical parcels as public.

Implement the smallest additive endpoint/client/UI path within the exact reservation. Bound queries and output. Return canonical county identity, observed runtime parcel count where authorized, provenance/freshness evidence actually available, public classification only if verifiable from existing durable evidence, and stable gap reasons. Absence is not an exception. Unsupported, mismatched, stale-request and cross-county responses must not leak a prior county's data or enable a capability. The UI must distinguish no parcels, unverified origin, source-use restriction, and API failure where evidence supports those differences; do not invent a licensing state the backend has not established.

Use test-first RED/GREEN for additive behavior: authorized county; all39 canonical identities; unknown/cross-county denial; no rows; canonical rows without public provenance; source counts not landed evidence; malformed response; county switch/late response; request failure. Existing sales contract remains unchanged. Include actual runtime/browser acceptance after source/test review and a separately scheduled resource slot; mocked UI success is not final product acceptance.

Use the existing Unit.Tests project and frontend harness. No new dependencies/projects. Node-only/light tests may run now. Full .NET build/restore/frontend install/browser servers must be coordinated with the five-suite resource owner, not launched simultaneously on already-constrained OMEN.

Register this exact child in the existing seed schema; its authority derives from the standing mission, not from the new row. Run canonical Brain review-diff/proof/commit-plan and normal required checks. Report exact command outcomes, not assumed passing status.

## Continuation

This product projection does not establish39-county public landing, complete WAL001 or finish launch. Continue with authorized source-use resolution and actual parcel import/lineage where needed, alongside existing upload/Sync acceptance. Parent remains ACTIVE until issue1485 terminal evidence passes.

### Coordinator delivery continuation — 2026-09-08

The earlier temporary preparation-only restrictions described completed builder phases. Main now records actual runtime acceptance at `e195bc9c1d5baab1e5487a6b6b43308f278a1357` and continues the standing-authorized normal delivery lifecycle within these same nine paths. Helper95740 exited0; receipt SHA256 `134bf385fac7b3250a91279dc4fd40bde689b32098430c1a03024cdb1909e254`. Independent assurance is CLEAR for this bounded evidence. See the proof bundle for backend build carryforward, test counts, cleanup, archived failures and explicit limitations.

Main may update only this WO, its existing registry row and proof for final evidence, then perform canonical Brain review-diff/commit-plan, normal commit/push/PR/check/review/eligible merge and post-merge verification under OWNER-TF-STANDING-OPERATOR-AUTHORITY. No new source behavior, data rights, production deployment or parent completion is authorized. Product/test files remain frozen; a concrete review defect requires a bounded assigned correction. Any new compiler/runtime group still requires the shared resource slot. Documentation changes do not relabel the executed e195 candidate as a different runtime SHA.
