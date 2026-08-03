# WO-SR-008A - Single-Parcel Assessor Journey Runtime Readiness Audit

## Status

`IN PROGRESS - R2 AUDIT COMPLETE; MERGE AND SUCCESSOR DISPATCH PENDING`

## Program

Five-Suite Federated Repository Buildout

## Goal and loop

- Goal: `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES`
- Loop: `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES`

## Risk and mode

- Risk: `R2`
- Mode: multi-agent, read-only product/runtime inspection plus governance and evidence
- Base: `origin/main` after the merge of `WO-TF-POST-ATLAS-001`
- Authority: Issue #1396 plus `OWNER-TF-STANDING-OPERATOR-AUTHORITY`

## Purpose and human outcome

Determine whether an assessor can complete one coherent, existing single-parcel journey from parcel
search through the canonical Property Workbench tabs using current sovereign source and locally
available synthetic or fixture evidence. Return one evidence-backed answer, the exact failing links,
and the smallest bounded successor.

This does not choose a new product direction. Parcel search, `/property/:parcelId`, and the canonical
`Summary -> Forge -> Atlas -> Dais -> Dossier -> Pilot` composition already exist in constitutional
shell and Workbench source. This Work Order audits that existing direction rather than reopening the
closed Property Workbench evidence program or selecting batch behavior.

## Current evidence anchor

- Sovereign post-Atlas base: `5db63ab32486e4d71f27a934795ecce8105045d2`.
- Forge valuation is registered and runtime-consumed.
- Atlas has a hash-verifying process host but no DI registration or runtime consumer.
- Dais and Dossier expose routed, county-isolated, durable sovereign services.
- GPT's provider invocation remains simulated.
- Property Search routes into the parcel Workbench, whose tab routes already exist.
- The prior Workbench flow packet did not prove a live browser/backend journey, county isolation, or
  real tool execution, and the assessor valuation journey contract remains skipped.

## Repositories and source surfaces

Read-only inspection is authorized in:

1. `bsvalues/terrafusion_os_1.0` at current `origin/main`.
2. `frontend/apps/os-shell/src/pages/PropertySearch.tsx`.
3. `frontend/apps/os-shell/src/pages/workbench/**`.
4. `frontend/apps/os-shell/src/stores/propertyStore.ts`.
5. `frontend/apps/os-shell/src/services/dataProvider.ts` and existing suite services.
6. `frontend/apps/os-shell/src/__tests__/journey/**` and existing Workbench contract tests.
7. Existing parcel, Forge, Atlas, Dais, Dossier, GPT, Pilot, and Sync controller/registration paths.
8. Existing Workbench, suite-repository, release, and operational evidence.

Writable files are limited to this Work Order's evidence and the same canonical Work Order routing
surfaces used to close it. Product and test source are inspection-only.

## Explicit denials

- no frontend, backend, runtime, test, workflow, package, lockfile, or deployment edits;
- no new route, tab, feature, workflow, provider, consumer, DI registration, or persistence;
- no Atlas runtime adoption, GPT provider adoption, TerraPilot promotion, or Sync continuation;
- no county, PACS, SQL, credentials, secrets, live services, migration, or production access;
- no batch-first product decision, cutover, source retirement, publication, or cross-repository mutation;
- no claim that fixture or synthetic evidence proves production readiness.

## Dependencies and preflight

1. Fetch and verify sovereign `origin/main` contains the `WO-TF-POST-ATLAS-001` merge.
2. Verify no open PR or active branch owns the exact Work Order scope.
3. Use one clean dedicated worktree and read the shell plus suite domain packs.
4. Confirm the existing parcel route and canonical Workbench tab order are unchanged.
5. Confirm no protected resource is needed for the bounded audit; classify such a dependency instead
   of accessing it.

## Agent assignments

| Lane | Responsibility | Mutation |
| --- | --- | --- |
| A | Search, route, parcel-context, and Workbench composition truth | none |
| B | Forge, Atlas, Dais, Dossier, and GPT runtime-consumer truth | none |
| C | Pilot, Sync, county/resource, and local-proof boundary truth | none |
| D | Journey dependency matrix and smallest-gap synthesis | evidence only after A-C |
| E | Independent exact-source assurance | none |

A blocked lane does not stop unrelated read-only lanes. All findings must use exact current-source
citations and distinguish user reachability from foundation existence.

## Execution sequence

1. Build a leg-by-leg journey matrix: search, parcel load, Summary, Forge, Atlas, Dais, Dossier,
   Pilot, trace/evidence, and return navigation.
2. For each leg classify `PROVEN`, `PARTIAL`, `SIMULATED`, `UNWIRED`, `RESOURCE_BLOCKED`, or
   `STALE`, with the exact consumer, route, registration, provider, and evidence.
3. Run existing non-mutating contract tests that do not require protected resources.
4. Record skipped or unavailable proof honestly; do not enable live services or install new systems.
5. Identify the first failing dependency in the canonical journey and distinguish it from later gaps.
6. Rank no more than three bounded successors. Select one only if it remains R0-R2 and inside standing
   authority; otherwise return one exact protected-boundary packet.
7. Reconcile evidence and routing, validate, obtain independent assurance, merge when eligible, and
   continue under the terminal rule.

## Deliverables

- authoritative single-parcel journey matrix;
- exact source and test citation ledger;
- first-failing-link analysis;
- synthetic/local proof versus live/production non-claim matrix;
- one exact bounded successor Operational Packet or one exact protected-boundary decision packet;
- validation, review, assurance, and post-merge evidence.

## Validation

- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json`;
- `node --test docs/brain/workorders/tools/wo-query.test.mjs`;
- `node --test docs/brain/workorders/tools/wo-wave-plan.test.mjs`;
- existing targeted journey/Workbench tests selected from current package scripts without modifying
  manifests, lockfiles, source, or test files;
- exact changed-file allowlist;
- secret-pattern scan;
- remote required checks and zero unresolved substantive threads;
- independent exact-head assurance.

## Review and assurance

Review must reject unsupported claims that a route, fixture, contract, foundation, or passing unit test
is equivalent to a user-completable journey. Independent assurance must verify the first failing link,
candidate ranking, authority classification, and non-claims against the exact PR head.

## Rollback

Revert only this Work Order's evidence and routing updates. No product, runtime, external resource, or
data state changes, so no operational rollback is required.

## Terminal condition

One of:

- `SINGLE_PARCEL_JOURNEY_PROVEN_AND_NEXT_R2_WO_ADMITTED`; or
- `SINGLE_PARCEL_JOURNEY_EXACT_PROTECTED_BOUNDARY_IDENTIFIED`.

## Post-merge and automatic continuation

After merge, fetch and verify `origin/main`, confirm evidence and routing agree, and continue directly
to the selected R0-R2 successor. Stop only if the evidence proves the smallest useful successor needs
new product direction, runtime/DI/provider/persistence authority, protected resources, deployment,
schema change, or another true owner boundary.

## Audit outcome

- Verdict: `SINGLE_PARCEL_JOURNEY_EXACT_PROTECTED_BOUNDARY_IDENTIFIED`.
- First failing link: authenticated, county-governed parcel evidence acquisition before any suite tab.
- Synthetic evidence: five targeted test files / 46 tests passed; this is not live-readiness proof.
- Selected same-risk successor: `WO-SR-008D - Synthetic Single-Parcel Journey Proof Restoration`.
- Successor interlock: WO-SR-008D remains blocked until this audit PR merges.
- Product/runtime/protected-resource mutation: none.

The complete source ledger, journey matrix, non-claims, validation, and successor ranking are in
`evidence/WO-SR-008A-SINGLE-PARCEL-ASSESSOR-JOURNEY-RUNTIME-READINESS-AUDIT.md`.
