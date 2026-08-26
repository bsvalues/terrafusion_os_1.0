# TerraFusion Active Goal/Loop Execution Playbook

**Work Order:** `WO-GOAL-LOOP-MASTER-PLAYBOOK-001`
**Status:** Active execution graph
**Authority:** TerraFusion Brain / Work Order Operator
**Last Updated:** 2026-08-07
**Base:** `origin/main` at `b5a02db1758deda45d84c0ec99adb8f31d328c7b` or later

---

## Purpose

This playbook is the active execution graph for TerraFusion work.

Codex must not ask for one-off Work Orders when the next Work Order is already defined in an
active `/goal` plus `/loop` chain.

- A Work Order is the execution packet.
- A Goal is the program objective.
- A Loop is the governed continuation mechanism.
- The Program Playbook is the source of next-work truth.

---

## Operator Authority Model

Codex is the operator. The human owner is the authority wall, not the dispatcher for every next Work
Order.

Inside an active `/goal` plus `/loop`, Codex may do the following without returning to the owner when
no stop gate is hit:

1. Create a clean dedicated worktree.
2. Execute the next defined Work Order in the active program chain.
3. Create or update docs/evidence/governance files authorized by that Work Order.
4. Run approved validation commands.
5. Commit scoped changes.
6. Push the branch.
7. Open a PR.
8. Resolve review comments inside the authorized scope.
9. Update from `origin/main` if behind.
10. Prepare the PR for merge when checks are green/acceptable, review threads are resolved, changed
    files remain in authorized scope, and no global stop gate is hit.
11. Apply the active standing Mode B grant. Merge and continue when the canonical conditions pass;
    request owner authority only when no standing/bounded grant applies or a true wall is present.
12. Verify `origin/main` after merge.
13. Continue to the next Work Order in the same `/goal` plus `/loop` if allowed.

Codex must return to the owner only for true authority walls.

The standing grant covers delivery mechanics only. It does not authorize a program, Work Order,
file, system, risk class, product behavior, protected resource, deployment, or destructive action.

---

## Global Execution Law

Codex may continue automatically from one Work Order to the next only when all are true:

1. The current Work Order is merged to `origin/main`.
2. Remote checks are green or explicitly acceptable.
3. Review threads are resolved.
4. The next Work Order is already defined in this playbook.
5. The next Work Order is in the same `/goal` and `/loop`.
6. The next Work Order's risk, files, systems, and actions are inside recorded authority.
7. The next Work Order stays inside the authorized file scope.
8. No backend/runtime implementation is required unless that program explicitly authorizes implementation.
9. No secrets, county data, PACS, county SQL, production resources, migrations, deployment, or live
   services are implicated.
10. No local hook bypass is required unless a bounded standing exception covers the exact action.

Codex must stop for owner decision when any are true:

1. A local hook bypass is required and no bounded standing exception covers it.
2. A review thread requires files outside the current authorized scope.
3. Backend/runtime code change is required outside the active authority record.
4. `tools/sync` runtime implementation is required outside the selected Sync chain.
5. Gate modification is required outside the active authority record.
6. CI/release wiring is required outside the active authority record.
7. Docker/Testcontainers repair is required.
8. Migration/schema change is required.
9. Secrets, county data, PACS, county SQL, live services, or production resources are implicated.
10. TerraPilot promotion or live integration is proposed.
11. Sovereign runtime import is proposed.
12. Property Workbench product behavior change is proposed outside an authorized Work Order.
13. Worktree is dirty, unsafe, timed out, locked, or incomplete and no exact approved repair procedure covers it.

Local hook failures are authority walls only when no bounded standing exception applies. After a hook
bypass is authorized and the current WO merges, Codex returns to the active `/goal` plus `/loop` chain
automatically.

---

## Active Program - Five-Suite Federated Repository Buildout

| Field | Value |
| --- | --- |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Loop | `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Program slug | `five-suite-federated-repository-buildout` |
| Status | Active under mission authority `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Current | `WO-SR-007D` Atlas persistent local runtime adoption |
| Next | Atlas standalone ownership truth, then Dais, Dossier, and GPT canonical cutover children |

The sovereign base remains `terrafusion_os_1.0`. The five ratified suite repositories are
`terrafusion-forge`, `terrafusion-atlas`, `terrafusion-dais`, `terrafusion-dossier`, and
`terrafusion-gpt`. Shared contracts, Brain, Workbench composition, security, county context, Sync
infrastructure, CI/release governance, and integration evidence remain in the sovereign base.

WO-SR-002 froze current genuine suite-consumable contracts. WO-SR-003 and WO-SR-004 created,
bootstrapped, checked, and protected all five private suite repositories. WO-SR-005A copied the
standalone Forge valuation kernel to Forge PR #1 with exact provenance and 2/2 parity tests; the
sovereign source remains authoritative. WO-SR-005B-P rejected wholesale GIS-package extraction and
defined the parity gate. WO-SR-005B-C decomposed an exact provider-neutral, county-context-aware read
contract, and WO-SR-005B-I implemented and froze it with synthetic proof. WO-SR-005B-A selected the
authenticated canonical geometry DTO, rejected the unsafe legacy GIS surface, and admitted E1/E2 as
the bounded adapter and standalone parity sequence without authorizing runtime adoption.
WO-SR-005B-E1 then implemented that pure unwired adapter with 30 passing tests and a zero-warning
solution build. WO-SR-005B-E2 merged the hash-pinned standalone synthetic contract-compat proof in
Atlas PR #1. WO-SR-005B-E3 then rejected direct copying because no sovereign candidate had a clean
suite-only boundary. WO-SR-005B-F1 merged the proven projection behavior into built-fresh product
source in Atlas PR #2 without a runtime consumer. WO-SR-005C-P verified the Dais county-isolation
boundary and selected appeals as the first contract cohort. WO-SR-005C-C defined the exact
read-only boundary, and WO-SR-005C-I froze it. WO-SR-005C-A then defined the exact pure unwired
adapter and standalone synthetic parity sequence while keeping extraction and runtime adoption
blocked. WO-SR-005C-E1 then merged the pure unwired sovereign adapter, and WO-SR-005C-E2 merged the
hash-pinned standalone parity proof in Dais PR #1. Their bounded envelope is consumed.
WO-SR-005C-E3 independently confirmed that no direct-copy extraction is safe and defined a
later built-fresh F1 allowlist. WO-SR-005D-C2 defined the exact Dossier
evidence-registry read boundary and WO-SR-005D-I froze it. WO-SR-005D-A then defined an exact pure,
unwired sovereign adapter and standalone synthetic parity sequence while preserving custody,
persistence, extraction, and runtime blocks. The bounded E1/E2 R3 envelope completed the pure
unwired adapter and standalone hash-pinned parity proof and is now consumed.
WO-SR-005D-E3 then audited the exact sovereign source boundary and found zero direct-copy
candidates: the controller, entity, adapter dependencies, frontend services, and Workbench surfaces
remain coupled to persistence, custody, auth, contract, write-lane, trace, or shell composition.
It proposed a separately gated build-fresh F1 candidate without implementing or extracting source.
WO-SR-005E-C defined the exact GPT grounded-context boundary and WO-SR-005E-I froze it.
WO-SR-005E-A then found that the committed RAG result drops the county, dataset, trace,
authorization, and source-to-chunk identity required for safe adaptation. WO-SR-005E-A2 found no
safe existing source boundary and defined an exact build-fresh pure unwired source-identity
projection. `WO-SR-005E-E0` implemented that boundary with deterministic fail-closed proof and no
runtime consumer. Its bounded R3 authority is consumed. `WO-SR-005E-A3` then proved an exact pure
unwired E1 adapter and hash-pinned standalone E2 parity sequence, but found the standalone GPT
repository absent from the canonical path register. `WO-SR-005E-A4` established and registered the
  clean read-only `D:\terrafusion-gpt` checkout at exact `origin/main`. The sequential R3 envelope
  completed the pure unwired adapter in sovereign PR #1367 and the hash-pinned standalone parity
  corpus in GPT PR #1. GPT PR #2 remediated Unicode schema-length parity. The envelope is consumed.
WO-SR-005E-E3 then confirmed that E0 is pure but cannot be copied as an executable capability into
the Node-only standalone repository without adding a new `.NET` project and workflow surface.
Exact-head assurance found GPT PR #3 had concurrently merged a build-fresh F1-like module without a
matching canonical F1 authority record. `WO-SR-005D-A4` then registered the clean read-only
`D:\terrafusion-dossier` checkout at exact live `origin/main`. Its live reconciliation found Dossier
PR #2 had likewise merged an F1-like module without matching sovereign authority.
`OWNER-SR-005D-F1-RETAIN-REMEDIATE-20260726` authorized conditional retention and exact remediation.
Dossier PR #3 corrected instant ordering, preserved arbitrary fractional precision, rejected invalid
instants, passed the frozen corpus, and resolved both original review findings. The corrected pure
unwired Dossier F1 baseline is retained; the original PR #2 remains unratified history and the
authority is consumed on sovereign closeout. `OWNER-SR-005E-F1-RETAIN-RATIFY-20260727` then
authorized exact validation and remediation of GPT PR #3. Corrective GPT PR #4 restored the
verifier compatibility export, passed 30 focused and parity checks, and resolved both original
review findings. The GPT five-file foundation is retained as pure and unwired; PR #3 remains
unratified history and the bounded authority is consumed. No bounded R2 successor remains admitted.
`OWNER-SR-005C-F1-RETAIN-REMEDIATE-20260727` then authorized exact remediation of historical Dais
PR #3. Corrective Dais PR #4 enforced calendar-valid UTC timestamps, known leap-second boundaries,
fractional ordering, and the full filed/hearing/decision lifecycle; it passed all remote gates and
exact-head assurance and merged as `29a34b0f`. Dais F1 is retained as pure and unwired, PR #3
remains unratified history, and the authority is consumed. The four standalone suite foundations
are complete at the pure-unwired F1 layer. `WO-SR-006-P` then completed the dependency-cleared R2
cutover audit. It selected Forge as the first protected successor because Forge alone has
byte-identical kernel source plus standalone test parity. `WO-SR-006A` completed an exact-commit
local sovereign shadow proof. GitHub records the producer PR and historical CI artifact, but local
build, disposable hash-pinned transfer, local execution, and local parity evidence are the sovereign
trust path. Extraction, providers, persistence, runtime adoption, publication, deployment, source
retirement, and cutover remain gated.
`WO-SR-006A-P` registered `D:\terrafusion-forge` as the clean read-only canonical checkout at
historical private `origin/main` `2430b483f20e07a6ff9a66e493caab0e39db64ef`; the exact local proof
used current Forge `origin/main` `24059c3642339f36877cb454ca63683180915b71`. Future workers require
isolated Forge worktrees. `OWNER-SR-006A-LOCAL-SOVEREIGN-SHADOW-CORRECTION-20260728` is consumed on
the verified closeout. The configured runtime did not change, and no credential or GitHub artifact
transfer was used.
`OWNER-SR-006B-R3-FORGE-LOCAL-RUNTIME-ROLLBACK-20260728` then authorized one process-local
selection and rollback rehearsal. The exact Forge commit passed accepted and typed fail-closed
invocations through `ValuationKernelClient` and `RustKernelProcessHost`; reconstructing those
components with the unchanged sovereign binary passed rollback. The selected binary SHA was proven
in both states. Persistent runtime configuration, source ownership, deployment, and cutover did not
change.
`WO-SR-006C` then proved that a disposable external `ForgeRehearsal` override selected Forge across
two isolated host starts and rolled back to the unchanged sovereign binary in a third. PR #1383
merged exact reviewed head `eaa9890cc` as `bbacef062`; the bounded authority is completed and
consumed. That envelope did not authorize canonical cutover. The separate
`OWNER-SR-006-FORGE-CANONICAL-CUTOVER-20260728` completed the Forge-only R4 transfer. Sovereign PR
#1386 merged local manifest-bound consumption, fail-closed proof, duplicate valuation-source
retirement, cost-kernel preservation, and rollback as
`827bb60515403a96417bdea6ec7f6ecc3ca08926`. Forge PR #4 finalized canonical valuation-source
ownership as `b36c2e130fb3fe9b34d7e67c8880f5b6d25b3084`. This closeout consumes the authority.
Production, protected resources, workflows, deployment, publication, cost-kernel transfer,
shared-contract transfer, public API changes, and every other suite cutover remain denied.
`OWNER-SR-007A-R3-ATLAS-LOCAL-SHADOW-PROJECTION-20260729` completed one exact Atlas local
sovereign shadow projection sequence. Phase 0 merged in PR #1388 as `30961af25`; the Phase 1 proof
passed 13 focused cases and merged in PR #1389 as `3ff78dee1`. The sequence bound Atlas commit
`6c530f1b6b77d59225353dede929c0688f1587da` and module SHA-256
`3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46`, begins with a
governance-only activation and permitted only a disposable local proof followed by terminal
closeout. The authority is consumed by this closeout. No runtime adoption, Atlas repository
mutation, extraction, provider, persistence, deployment, protected-resource access, ownership
transfer, or cutover follows.

Program definition: [five-suite-federated-repository-buildout.md](five-suite-federated-repository-buildout.md).

Current Five-Suite routing is `WO-SR-007D`. `WO-SR-007C` merged as `5a328e728`; the active child persists Development-only `LocalExact`, verifies the fixed Atlas manifest and bytes at startup and every invocation, and proves real restarts plus Disabled rollback. The bounded owner mission decision `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` authorizes dependency-cleared child Work Orders through Atlas, Dais, Dossier, and GPT canonical runtime adoption without a new objective or per-child owner return. All mission hard walls remain controlling.

---

## Program MAO - Governed Multi-Agent Operator Activation

| Field | Value |
|-------|-------|
| Goal | `GOAL-MAO-001` |
| Loop | `LOOP-MAO-001` |
| Program slug | `governed-multi-agent-operator-activation` |
| Status | CLOSED - PASS_WITH_GAPS |
| Current WO | `WO-MAO-007` complete |
| Next WO | Portfolio reconciliation |

### Purpose

Make governed parallel execution the default without creating competing Brains. The one Brain owns
queue, sequencing, reservations, risk, proof, review-diff, and commit-plan; isolated workers execute
dependency-cleared Work Orders whose path, contract, and environment reservations do not conflict.

Audit source: [`WO-MAO-000 Doctrine Conflict Audit Proof`](../../evidence/WO-MAO-000-proof.md).

### Work Order Chain

| Work Order | Mode | Required outcome |
|------------|------|------------------|
| `WO-MAO-000` | read-only audit | Persisted source-cited contradiction matrix and historical denominator |
| `WO-MAO-001` | governance reconciliation | Exact bounded R5 owner authorization, replacement hierarchy, complete protection canon, and inactive operator-merge model |
| `WO-MAO-001A` | governance correction | One-time owner envelope separated from Codex-maintained PR/SHA/scope/reservation execution state |
| `WO-MAO-002` | two-lane pilot | Two disjoint WOs, operator-maintained exact execution state, required governed-spine interlock, and independent read-only post-merge checks |
| `WO-MAO-003` | contract + mechanical gate | Reservation schema plus intentional-overlap rejection and release/retry proof |
| `WO-MAO-004` | planner implementation | COMPLETE - dependency-cleared executable set and conflict-free parallel waves |
| `WO-MAO-005` | evidence-informed playbooks | COMPLETE - PR #1287 merged bounded worker, assurance, monitoring, retry, and operator rules |
| `WO-MAO-006` | portfolio rollout | COMPLETE - PR #1288 |
| `WO-MAO-007` | evidence rollup | COMPLETE - PASS_WITH_GAPS; authority consumed |

### Pilot Boundary

`WO-MAO-002` tested and passed automatic continuation, zero-founder routing, isolated-worktree
discipline, bounded scope, operator-merge behavior, and automatic next-action selection. It did
**not** prove
reservation enforcement. Each pilot PR received a separate read-only assurance-agent scope check;
the reviewers were neither implementation operators nor William. The result is recorded in
[`WO-MAO-002-POST-MERGE-ASSURANCE.md`](../../evidence/WO-MAO-002-POST-MERGE-ASSURANCE.md).

**THE MAO-002 OPERATOR-MERGE AUTHORITY WAS BOUNDED AND IS CONSUMED.** Issue #1276 granted the
one-time owner bootstrap envelope. Codex set `MAO_002_PILOT_BOOTSTRAP_JSON` and maintained the two
exact PRs, current head SHAs, scopes, reservations, remediation revisions, and assurance state in
`MAO_002_PILOT_EXECUTION_JSON`. The required `governed-spine` context validated both records and
their digest binding. After both pilot merges, Codex removed the paired operational variables and
closed the grant as completed. A future Mode B activation requires a new recorded owner grant; issue
#1276 creates no continuing merge authority.

Cross-repository dispatch is blocked until a committed `PATH_CANON_REGISTER.md` identifies the exact
canonical repository path. MAO-002 therefore used two disjoint path families in this repository.

MAO-003 is complete in PR #1284, MAO-004 in PR #1286, MAO-005 in PR #1287, and MAO-006 in PR #1288.
WO-MAO-007 closes the program as `PASS_WITH_GAPS`. The ratified
`OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE` removed per-PR owner gating for eligible MAO-005
through MAO-007 work and is completed and consumed at closeout. No MAO execution authority survives;
the next route is Portfolio Operator reconciliation.

---

## Program 0 - Master Playbook Governance

| Field | Value |
|-------|-------|
| Goal | `GOAL-GOAL-LOOP-MASTER-PLAYBOOK` |
| Loop | `LOOP-GOAL-LOOP-MASTER-PLAYBOOK` |
| Program slug | `goal-loop-master-playbook` |
| Status | GOVERNING BASELINE |
| Current WO | Merged |

### Purpose

Create and keep current the active TerraFusion `/goal` plus `/loop` execution graph.

### Current State

- `WO-GOAL-LOOP-MASTER-PLAYBOOK-001` created the active Goal/Loop execution playbook.
- The playbook governs continuation.

### Authorized Files

- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `docs/brain/workorders/evidence/WO-GOAL-LOOP-MASTER-PLAYBOOK-001-ACTIVE-GOAL-LOOP-EXECUTION-PLAYBOOK.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`

### Validation

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Inspect goal/loop register.
- Inspect command map.
- Confirm no runtime/backend/tools-sync implementation changed.

### Stop Type

`GOAL_LOOP_MASTER_PLAYBOOK_CREATED_READY_FOR_CHAIN_EXECUTION`

Routing note:

- `wo-query` currently reports an older LocalOps/Work Order Engine recommendation. Until the registry
  backing `wo-query` is refreshed, this mismatch is a routing reconciliation gate, not authority to
  run both lanes.
- Backend Operational Excellence has since run through `WO-BACKEND-OE-013` and is closed. Do not
  route back to `WO-BACKEND-OE-003`; the next lane now requires owner/WOE selection from the
  remaining parked or follow-up programs.

---

## Program 0A - Codex Operator Work Order Playbook

| Field | Value |
|-------|-------|
| Goal | `GOAL-TF-CODEX-OPERATOR-WO-PLAYBOOK-001` |
| Loop | `LOOP-TF-CODEX-OPERATOR-WO-PLAYBOOK-001` |
| Program slug | `codex-operator-playbook` |
| Status | GOVERNING OPERATOR DOCTRINE |
| Current WO | Merged through `WO-CODEX-OP-009` |

### Purpose

Make Codex the primary TerraFusion Work Order operator so the owner is no longer the courier between
agents, PRs, reviews, checks, and merge readiness.

### Deliverables

- `docs/brain/workorders/operator/CODEX_OPERATOR_PLAYBOOK.md`
- `docs/brain/workorders/goal-loop/GOAL_LOOP_OPERATOR_CONTRACT.md`
- `docs/brain/workorders/operator/WORK_ORDER_LIFECYCLE.md`
- `docs/brain/workorders/operator/AUTONOMOUS_CONTINUATION_RULES.md`
- `docs/brain/workorders/operator/PR_REVIEW_CI_OPERATOR_RULES.md`
- `docs/brain/workorders/operator/OWNER_DECISION_PACKET_TEMPLATE.md`
- `docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md`
- `docs/brain/workorders/evidence/WO-CODEX-OPERATOR-PLAYBOOK-ROLLUP.md`
- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/operator/README.md`

### Stop Type

`CODEX_OPERATOR_PLAYBOOK_ROLLUP_READY_FOR_PR`

---

## Program 0B - Codex Operator Autonomy

| Field | Value |
|-------|-------|
| Goal | `GOAL-TF-CODEX-OPERATOR-AUTONOMY-001` |
| Loop | `LOOP-TF-CODEX-OPERATOR-AUTONOMY-001` |
| Program slug | `codex-operator-autonomy` |
| Status | GOVERNING AUTONOMY BASELINE |
| Current WO | `WO-OP-AUTO-000` through `WO-OP-AUTO-012` |

### Purpose

Eliminate human courier mode. Codex operates approved Work Order chains through validation, PR,
review remediation, check monitoring, merge-readiness reporting, post-merge verification, and
next-WO selection.

### Deliverables

- `docs/brain/workorders/evidence/WO-OP-AUTO-000-COURIER-FRICTION-AUDIT.md`
- `docs/brain/workorders/programs/CODEX_OPERATOR_AUTHORITY_MATRIX.md`
- `docs/brain/workorders/goal-loop/GOAL_CONTRACT.md`
- `docs/brain/workorders/goal-loop/LOOP_CONTRACT.md`
- `docs/brain/workorders/goal-loop/STOP_TYPE_CLASSIFIER.md`
- `docs/brain/workorders/playbooks/CODEX_PR_LIFECYCLE_PLAYBOOK.md`
- `docs/brain/workorders/playbooks/REVIEW_REMEDIATION_AUTONOMY.md`
- `docs/brain/workorders/playbooks/LOCAL_TOOLING_HOOK_EXCEPTION_POLICY.md`
- `docs/brain/workorders/playbooks/MERGE_AUTHORITY_MODEL.md`
- `docs/brain/workorders/goal-loop/NEXT_WO_SELECTION_RULE.md`
- `docs/brain/workorders/evidence/CODEX_EVIDENCE_OUTPUT_STANDARD.md`
- `docs/brain/workorders/evidence/WO-OP-AUTO-012-OPERATOR-AUTONOMY-ROLLUP.md`
- `docs/brain/workorders/programs/codex-operator-autonomy.md`

### Release Engineering Application

Release Engineering used this operator-autonomy model and closed at WO-REL-006. The capability
remains governing doctrine; it does not keep Release Engineering active after closeout.

### Stop Type

`OPERATOR_AUTONOMY_ROLLUP_READY_FOR_PR`

---

## Program 0C - Release Engineering

| Field | Value |
|-------|-------|
| Goal | `GOAL-TF-RELEASE-ENGINEERING-001` |
| Loop | `LOOP-TF-RELEASE-ENGINEERING-001` |
| Program slug | `release-engineering` |
| Status | CLOSED |
| Current WO | `WO-REL-006` complete |
| Next WO | Portfolio reconciliation |

### Purpose

Convert completed operational baselines into releasable, recoverable, repeatable release evidence
without crossing into deployment, production, county runtime, secrets, schema, or CI workflow
mutation.

### Current State

- Backend Operational Excellence is closed at `WO-BACKEND-OE-013`.
- The Backend OE closeout evidence baseline is `a244743014b4b7731a2694db10bc2e9656876e55`.
- The Codex Operator Work Order Playbook is merged at
  `55b53ad97fdf31bd2ac34bdaf13462b5d5206122` and governs this lane.
- `WO-REL-006 - Release Engineering Evidence Rollup` is complete.
- DevEx Hook Bootstrap subsequently closed at `WO-DEVEX-HOOKS-006`.

### Work Order Chain

| WO | Mode | Purpose | Stop Type |
|----|------|---------|-----------|
| `WO-REL-001` | Read-only discovery | Inventory release/version/tag/rollback evidence and recommend smallest next release-engineering WO. | `RELEASE_ENGINEERING_DISCOVERY_COMPLETE` |
| `WO-REL-002` | Docs/governance evidence contract | Define release gate checklist and evidence contract from Backend OE evidence. | `RELEASE_GATE_EVIDENCE_CONTRACT_READY_FOR_PR` |
| `WO-REL-003` | Docs/template only | Create release candidate evidence packet template. | `RELEASE_CANDIDATE_EVIDENCE_TEMPLATE_READY_FOR_PR` |
| `WO-REL-004` | Docs/governance only | Define release tag/version evidence model without creating tags or changing automation. | `RELEASE_TAG_VERSION_MODEL_READY_FOR_PR` |
| `WO-REL-005` | Docs/governance only | Define rollback drill authorization packet and required proof for future safe-environment rollback execution. | `ROLLBACK_DRILL_AUTH_PACKET_READY_FOR_OWNER_DECISION` |
| `WO-REL-006` | Evidence rollup | Close the Release Engineering docs/governance baseline and recommend next lane. | `RELEASE_ENGINEERING_BASELINE_CLOSED` |

### Stop Gates

Stop on CI/workflow changes, branch-protection changes, deployment, runtime code,
schema/migrations, secrets, county runtime, PACS/CAMA, live services, or rollback execution claims
without proof.

---

## Program 1 - Backend Operational Excellence

| Field | Value |
|-------|-------|
| Goal | `GOAL-BACKEND-OPERATIONAL-EXCELLENCE` |
| Loop | `LOOP-BACKEND-OPERATIONAL-EXCELLENCE` |
| Program slug | `backend-operational-excellence` |
| Status | CLOSED |
| Next executable WO | None - program closed; owner/WOE selects next lane |

### Current State

Backend foundation is implemented and slice-verified. The canonical backend build is green with zero
warnings. Backend OE is closed as an evidence-backed operational baseline, not as production-ready
runtime certification. Remaining work is deferred into follow-up lanes such as release-gate
automation, DevEx hook bootstrap, county runtime proof, or future product-lane execution.

### Completed Work Orders

- `WO-BACKEND-000` - Program opened and playbook registered.
- `WO-BACKEND-OE-001` - Backend Operational Excellence Baseline.
- `WO-BACKEND-OE-001-S` - Baseline Worktree Residue Classification.
- `WO-BACKEND-OE-002` - Backend Build Warning Register.
- `WO-BACKEND-OE-PLAYBOOK-REFRESH` - Full Backend OE chain.
- `WO-MASTER-PLAYBOOK-001` / `WO-GOAL-LOOP-MASTER-PLAYBOOK-001` - Master active program playbook.
- `WO-BACKEND-OE-003` through `WO-BACKEND-OE-013` - Backend OE evidence, gates, runbook,
  diagnostics, operational packet, and closeout.

### Current Facts

- `dotnet build backend/TerraFusion.sln` passed with 0 warnings and 0 errors.
- Unit tests passed.
- Full solution test pass is blocked by Docker/Testcontainers SQL Server environment dependencies.
- Dais persistence exists.
- ServiceRegistry exists.
- Health/readiness endpoints exist but semantics are not release-proven.
- Security/auth/county/audit proof exists but is not consolidated into a release-grade matrix.
- DevEx hook tooling failures are separate from Backend OE.

### Backend OE Work Order Chain

| WO | Mode | Purpose | Stop Type |
|----|------|---------|-----------|
| `WO-BACKEND-OE-003` | Docs/evidence/register only | Classify the Docker/Testcontainers SQL Server dependency blocking the full solution test pass. | `BACKEND_INTEGRATION_DEPENDENCY_REGISTER_READY_FOR_PR` |
| `WO-BACKEND-OE-004` | Evidence + endpoint contract proof | Define what `/healthz`, `/healthz/ready`, `/health/codex369`, `/api/transcendence/health`, and Levy `/health` actually prove. | `BACKEND_HEALTH_READINESS_SEMANTICS_PROVEN` |
| `WO-BACKEND-OE-005` | Evidence + targeted validation | Move ServiceRegistry from source-wired to runtime-understood. | `BACKEND_SERVICE_REGISTRY_RUNTIME_VALIDATED` |
| `WO-BACKEND-OE-006` | Evidence matrix first | Consolidate auth, authorization, county isolation, audit, and security proof into one release-grade matrix. | `BACKEND_SECURITY_PROOF_MATRIX_READY` |
| `WO-BACKEND-OE-007` | Evidence/register first | Inventory backend migrations and classify rollback/readiness evidence. | `BACKEND_MIGRATION_ROLLBACK_REGISTER_READY` |
| `WO-BACKEND-OE-008` | Test-plan/evidence first | Define the next Dais proof gaps without rebuilding persistence. | `BACKEND_DAIS_E2E_PROOF_PLAN_READY` |
| `WO-BACKEND-OE-009` | Governance/release checklist | Define objective backend release-readiness criteria. | `BACKEND_RELEASE_GATE_DEFINED` |
| `WO-BACKEND-OE-010` | Runbook creation | Create backend validation, triage, rollback, and evidence runbook. | `BACKEND_OPERATIONAL_RUNBOOK_READY` |
| `WO-BACKEND-OE-011` | Evidence/docs | Map backend diagnostics and operational signals. | `BACKEND_DIAGNOSTICS_OBSERVABILITY_MAPPED` |
| `WO-BACKEND-OE-012` | Operational packet assembly | Assemble the Backend Operational Excellence packet. | `BACKEND_OPERATIONAL_PACKET_READY` |
| `WO-BACKEND-OE-013` | Evidence rollup | Close Backend OE with proof, deferred items, and next-lane recommendation. | `BACKEND_OPERATIONAL_EXCELLENCE_PROGRAM_CLOSED` |

### Continuation Rule

Backend OE does not continue automatically after `WO-BACKEND-OE-013`. Any new backend work must be a
new owner/WOE-selected lane, especially if it requires release-gate automation, implementation,
Docker/Testcontainers repair, CI wiring, migrations, deployment, secrets, county/PACS/live resources,
or local hook tooling repair.

---

## Program 2 - Sovereign Sync Workbook Tooling

| Field | Value |
|-------|-------|
| Goal | `GOAL-SYNC-WORKBOOK-TOOLING` |
| Loop | `LOOP-SYNC-WORKBOOK-TOOLING` |
| Program slug | `sovereign-sync-workbook-tooling` |
| Status | CLOSED in canonical `bsvalues/terrafusion-os` |
| Repo | `bsvalues/terrafusion-os` |
| Current | `WO-SYNC-155` complete |
| Next | Portfolio reconciliation |

### Completed Work Orders

- `WO-SYNC-057` - `tools/sync` boundary selected.
- `WO-SYNC-058` - Gate 14 enforcement created before implementation.
- `WO-SYNC-130` - C1 Workbook Admission Validator.
- `WO-SYNC-131` - C2 Column-Terminalization Checker.

### Current Tool Stack

1. `workbook-contract-check` - validates shape/schema.
2. `workbook-admission-check` - validates artifact class/admissibility.
3. `workbook-terminalization-check` - validates terminal completeness and Hard Guard #3 consistency.

### Sync Workbook Tooling Chain

| WO | Type | Purpose | Stop Type |
|----|------|---------|-----------|
| `WO-SYNC-132` | Built-fresh runtime tool | Determine whether an admitted and terminalized workbook is lock-eligible. | `SYNC_C3_LOCK_READINESS_CHECKER_MERGED` |
| `WO-SYNC-133` | Built-fresh runtime tool | Run contract, admission, terminalization, and lock-readiness checks and report lifecycle state. | `SYNC_WORKBOOK_LIFECYCLE_CHECKER_MERGED` |
| `WO-SYNC-134` | Design/policy gate only | Decide safe edit CLI behavior before mutation tooling exists. | `SYNC_WORKBOOK_EDIT_CLI_DESIGN_DECISION_READY` |
| `WO-SYNC-135` | Built-fresh runtime tool | Create a synthetic-only edit CLI if `WO-SYNC-134` explicitly authorizes implementation. | `SYNC_SYNTHETIC_WORKBOOK_EDIT_CLI_MERGED` |
| `WO-SYNC-136` | Design/safety architecture | Design a Gate-14-safe external artifact content scanner. | `SYNC_EXTERNAL_ARTIFACT_SCAN_DESIGN_DECISION_READY` |
| `WO-SYNC-137` | Built-fresh implementation only if authorized | Implement external artifact content scanning using the safe design. | `SYNC_EXTERNAL_ARTIFACT_CONTENT_SCAN_MERGED` |
| `WO-SYNC-138` | Built-fresh runtime tool | Generate a synthetic evidence bundle summarizing workbook validation state. | `SYNC_WORKBOOK_EVIDENCE_BUNDLE_MERGED` |
| `WO-SYNC-139` | Runbook/operator documentation | Create operator runbook for the built-fresh workbook toolchain. | `SYNC_WORKBOOK_OPERATOR_RUNBOOK_MERGED` |
| `WO-SYNC-140` | Governance/release checklist | Define what must pass before workbook tooling is release-ready for broader operator use. | `SYNC_WORKBOOK_TOOLING_RELEASE_GATE_DEFINED` |
| `WO-SYNC-141` | Evidence rollup/program closeout | Summarize workbook tooling lane evidence, limitations, and next Sync lane. | `SYNC_WORKBOOK_TOOLING_ROLLUP_COMPLETE` |

### Stop Gates

Live cross-repository verification found WO-SYNC-132 through WO-SYNC-155 already merged in the
canonical sovereign repository. Do not duplicate this chain in `terrafusion_os_1.0`.

### Sync Hard Rules

- Every `tools/sync` file must satisfy Gate 14.
- Built-fresh header required.
- No archive import.
- No PACS/county SQL/county data/live connection.
- No backend/frontend/os-platform references.
- No package/build/CI/runtime entrypoint.
- No scheduler/daemon/service wiring.
- No weakening Gate 14.

### Sync Continuation Rule

Continue within the Sync chain while each next WO is defined, separately authorized where required,
and no global stop gate is hit. Selection of C3 does not pre-authorize mutation or content scanning.

---

## Program 3 - TerraPilot Tool Maturity

| Field | Value |
|-------|-------|
| Goal | `GOAL-TERRAPILOT-TOOL-MATURITY` |
| Loop | `LOOP-TERRAPILOT-TOOL-MATURITY` |
| Program slug | `terrapilot-tool-maturity` |
| Status | PARKED |
| Next | None unless owner authorizes P16 design-only |

### Current State

TerraPilot is parked at P15. P16 is not started and remains blocked unless explicitly authorized as
design-only.

### Locked Truth

- `summarize_levy_rate_components` is contract-covered only.
- `liveIntegration`: false.
- `backendIntegrated`: false.
- live: no.
- promoted: no.
- metadata mutation after P13: no.
- runtime/backend/handler changes: no.

Stop type: `TERRAPILOT_P15_PARKED`

---

## Program 4 - DevEx Hook Tooling

| Field | Value |
|-------|-------|
| Goal | `GOAL-DEVEX-HOOK-BOOTSTRAP` |
| Loop | `LOOP-DEVEX-HOOK-BOOTSTRAP` |
| Program slug | `devex-hook-tooling` |
| Status | CLOSED - bootstrap verification complete |
| Current WO | `WO-DEVEX-HOOKS-006` |
| Next WO | Portfolio reconciliation |
| Program playbook | [devex-hook-tooling.md](devex-hook-tooling.md) |

### Problem

Local hooks repeatedly fail because Prettier and Vitest are unavailable in the local tooling context.

Rule: Do not mix this into Backend OE, Sync, TerraPilot, or runtime work.

### Current Facts

- `WO-DEVEX-HOOKS-001` completed the hook/tooling reality audit.
- Active hooks route through `.husky`.
- Clean worktrees are missing repo-local `prettier` and `vitest` binaries.
- `WO-DEVEX-HOOKS-003` resolved hook-time install and package-manager version drift policy; hook
  edits remain blocked on the owner-gated implementation packet.

### Deterministic Design

`WO-DEVEX-HOOKS-003 - Hook Determinism Design` retains the pinned pnpm 9 contract, requires explicit
frozen-lockfile bootstrap outside hooks, resolves tools through Corepack and repo-local dependencies,
and prohibits implicit hook installs or silent missing-tool skips.

### Next Work

`WO-DEVEX-HOOKS-004 - Hook Script Repair` applies the deterministic policy without package,
lockfile, CI, or product-runtime changes.

`WO-DEVEX-HOOKS-005 - Worktree Hygiene Register` classifies registered worktrees, active PRs,
cleanup candidates, dirty/locked quarantines, and the stale local-main ownership conflict. It performs
no cleanup.

`WO-DEVEX-HOOKS-006 - Bootstrap Verification Packet` proves the explicit clean-worktree frozen
bootstrap, unchanged package/lockfile hashes, repository-local tool resolution, and deterministic
hook behavior. After merge, the DevEx hook bootstrap baseline is closed and the next lane is selected
from program evidence.

---

## Portfolio Selection - Current Reconciliation

| Field | Value |
|-------|-------|
| Portfolio goal | `GOAL-PORTFOLIO-OPERATOR-001` |
| Portfolio loop | `LOOP-PORTFOLIO-OPERATOR-001` |
| Selected program | Five-Suite Federated Repository Buildout |
| Last completed interlock | `WO-SR-009D` Dossier Workbench canonical evidence read adoption |
| Current WO | `WO-SR-007D` Atlas persistent local runtime adoption |
| Next interlock | On verified merge, finalize Atlas standalone ownership truth, then continue the authorized suite sequence |

Issue #1417 and `OWNER-SR-009B-R3-DAIS-WORKBENCH-APPEAL-READ-20260805` authorized the exact bounded
read-only Dais adoption sequence. PR #1419 merged exact assured head
`11bc49507a6e57925414d142a21f203bb8c3c811` as
`8b5fe0965c0f51008d47e6ff1e0133e94a417667`; the authority is completed and consumed. Existing raw
CRUD response shapes remain unchanged, and routing, tab identity, navigation, broader structure,
writes, persistence/schema, standalone Dais runtime, live data, deployment, and cutover remain denied.
`WO-SR-009C` completed in PR #1424. Exact assured head
`e70548cb4938da92b2c0b254d71c5361aa10a6ed` merged as
`b5a02db1758deda45d84c0ec99adb8f31d328c7b`, proving canonical Polygon, truthful unavailable, and
cross-county non-disclosure through the real API and Workbench. Point, frozen-adapter changes, live
providers, and cutover remain outside authority. The bounded authority is consumed and portfolio
reconciliation is current.

Issue #1426 and decision `OWNER-SR-009D-R3-DOSSIER-WORKBENCH-CANONICAL-EVIDENCE-READ-20260807` authorized the bounded R3 slice. PR #1427 exact assured head `85818a749d4268f84cf8638d991d9cef657a0d19` merged as `c7f2d78619a9eb19186c2c724876fb4d11c81b00`; all recorded checks passed and all substantive threads resolved. The authority is completed and consumed. The Development fallback, writes, custody mutation, contract/adapter changes, live data, protected resources, deployment, routing/tab changes, and cutover remain denied.

WO-LOCAL-093 through WO-LOCAL-097 were incorrectly admitted from WilliamOS/TerraGroq into the
TerraFusion portfolio. Their documents remain historical audit material, but they delivered no
TerraFusion capability. Proposed WO-LOCAL-098 is withdrawn and cannot execute under TerraFusion
authority. That correction does not park the ratified five-suite repository program.

---

## Program 5 - Cross-Project Historical Audit (WilliamOS/TerraGroq)

| Field | Value |
|-------|-------|
| Goal | None in TerraFusion |
| Loop | None in TerraFusion |
| Program slug | `cross-project-historical-audit` |
| Status | `OUT_OF_SCOPE_CROSS_PROJECT` |
| Current | `WO-LOCAL-093` through `WO-LOCAL-097` superseded |
| Next | None in TerraFusion; `WO-LOCAL-098` withdrawn |

### Current Facts

- OMEN, `williamos-postgres-proof`, `williamos-omen-app-proof`, and `williamos-app-proof:omen` are
  WilliamOS/TerraGroq surfaces, not TerraFusion components.
- WO-LOCAL-093 through WO-LOCAL-097 are preserved only as audit evidence of the scope error.
- Classification: `OUT_OF_SCOPE_CROSS_PROJECT` and `NO_TERRAFUSION_CAPABILITY_DELIVERED`.
- No credential rotation, container creation, startup, or runtime mutation is authorized here.
- Transfer or continuation requires the other project's repository, canon, Work Order, authority,
  evidence, and credential handling.
- TerraFusion runtime, Postgres, county, PACS, production, schema, and application records remain
  untouched by this correction.

Rule: Do not route or execute WilliamOS/TerraGroq work from TerraFusion. Historical evidence may be
read for audit only and does not transfer authority between projects.

---

## Program 6 - Runtime Import Disposition

| Field | Value |
|-------|-------|
| Goal | `GOAL-RUNTIME-IMPORT-DISPOSITION` |
| Loop | `LOOP-RUNTIME-IMPORT-DISPOSITION` |
| Program slug | `runtime-import-disposition` |
| Status | OWNER-GATED |
| Next | `WO-CORE-1` |

Rule: No `backend/`, `frontend/`, or `os-platform/` import into the sovereign repo without explicit
Work Order, provenance, and validation gates.

Possible outcomes:

- no import,
- promote specific contract only,
- promote specific built-fresh scaffold,
- mine archive for pattern only,
- authorize narrowly scoped runtime import later.

---

## Program 7 - Property Workbench

| Field | Value |
|-------|-------|
| Goal | `GOAL-PROPERTY-WORKBENCH` |
| Loop | `LOOP-PROPERTY-WORKBENCH` |
| Program slug | `property-workbench` |
| Status | CLOSED / EVIDENCE BASELINE COMPLETE |
| Next if selected | No restart; owner must authorize a new Workbench phase |

Rule: Do not restart the closed Workbench evidence chain. Any future Workbench work must be a new
phase selected by owner/WOE, not a rerun of `WO-WORKBENCH-001`.

Closed evidence chain:

- `WO-WORKBENCH-001` - Workbench Reality Audit.
- `WO-WORKBENCH-002` - Routing and Deep-Link Gate Audit.
- `WO-WORKBENCH-003` - Tab Capability Classification.
- `WO-WORKBENCH-004` - Forge Surface Completion Plan.
- `WO-WORKBENCH-005` - Atlas Surface Completion Plan.
- `WO-WORKBENCH-006` - Dais Surface Completion Plan.
- `WO-WORKBENCH-007` - Dossier Surface Completion Plan.
- `WO-WORKBENCH-008` - Pilot Integration Boundary.
- `WO-WORKBENCH-009` - End-to-End Parcel Flow Proof.
- `WO-WORKBENCH-010` - Workbench Operational Packet.
- `WO-WORKBENCH-011` - Evidence Rollup.

---

## Command Concepts

The command map must expose these operator commands:

- `/program-status`
- `/program-next`
- `/program-stop`
- `/release-engineering`
- `/backend-start`
- `/backend-status`
- `/backend-next`
- `/backend-stop`
- `/sync-status`
- `/sync-next`
- `/sync-stop`
- `/terrapilot-status`
- `/terrapilot-stop`
- `/devex-hooks-status`
- `/local-omen-status`
- `/core-import-status`
- `/workbench-status`

---

## Output Format

After each Work Order, return:

```text
RESULT:
WORK_ORDER:
PROGRAM:
GOAL:
LOOP:
FILES_CHANGED:
RUNTIME_CODE_CHANGED:
BACKEND_CODE_CHANGED:
TOOLS_SYNC_CODE_CHANGED:
VALIDATION:
PR_NUMBER:
PR_URL:
MERGE_COMMIT:
ORIGIN_MAIN_HEAD:
REVIEW_THREADS:
NEXT_EXECUTABLE_GOAL:
NEXT_EXECUTABLE_LOOP:
NEXT_EXECUTABLE_WO:
STOP_TYPE:
```

If blocked by an authority wall, return:

```text
RESULT: BLOCKED_OWNER_DECISION
WORK_ORDER:
PROGRAM:
GOAL:
LOOP:
STOP_TYPE:
BLOCKER:
CURRENT_STATE:
AUTHORIZED_OPTIONS:
RECOMMENDED_OPTION:
```
