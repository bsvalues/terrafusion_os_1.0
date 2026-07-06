# WO-BACKEND-OE-008 - Dais Workflow E2E Proof Expansion Plan

Date: 2026-07-06
Work order: WO-BACKEND-OE-008
Program: Backend Operational Excellence
Goal: GOAL-BACKEND-OPERATIONAL-EXCELLENCE
Loop: LOOP-BACKEND-OPERATIONAL-EXCELLENCE
Mode: test-plan/evidence first

## Result

RESULT: PASS_WITH_GAP

Dais workflow proof is materially present for source wiring, in-memory service persistence,
controller-level contracts, county isolation, audit invocation, and migration source. The current
proof is not yet a release-grade end-to-end suite because it does not exercise the full authenticated
HTTP pipeline, database provider parity, restart persistence, Dossier handoff boundaries, or every
statutory/certification stop gate.

No backend runtime behavior was changed in this work order. No tests were added, no migrations were
created, and no databases or services were started.

## Guardrails

| Boundary | Result |
|----------|--------|
| Backend/runtime code changes | None |
| Test implementation | Not changed |
| Migrations or database update | Not run |
| Docker/Testcontainers | Not run |
| Production/live/shared DB access | Not used |
| County data, PACS, SQL, or secrets | Not touched |
| TerraPilot metadata or promotion state | Not touched |

## Existing Proof

| Proof area | Evidence | Current status | Release interpretation |
|------------|----------|----------------|------------------------|
| Dais controller surface | `backend/src/TerraFusion.API/Controllers/DaisController.cs` exposes permit, exemption, appeal, certification, notice, queue, and assessment-impact endpoints under `[Authorize]`. | Source-present | Broad controller surface exists and is default protected by controller-level authorization. |
| County access resolution | `DaisController.RequireCountyAccessAsync` resolves `countyId`, `countyCode`, county names, and FIPS candidates before parcel/county-scoped actions. | Source-present | County-bound request handling exists, but full HTTP authorization pipeline proof is still partial. |
| Controller contract tests | `backend/tests/TerraFusion.Unit.Tests/Stage2/DaisEndpointContractTests.cs` covers appeal create/read, wrong-county record non-leak, missing body/parcel validation, schema DbSets, exemption creation, notice generation, queue assignment, empty queue read, certification bootstrap, and governed audit invocation. | Present | Strong in-memory controller/service contract proof for important Dais actions. |
| Dais county auth tests | `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx21DaisMarketplaceIsolationTests.cs` covers unauthenticated and no-county-claim failures plus authenticated allowed paths. | Present and previously run in OE-006 security slice | Dais county-claim behavior is covered for selected endpoints. |
| Workflow persistence tests | `backend/tests/TerraFusion.Integration.Tests/Phase40/DaisWorkflowPersistenceTests.cs` covers appeal lifecycle, exemption lifecycle, certification completion, notice status transition, queue assignment, and appeal audit fields using an in-memory store. | Present | Service persistence contracts are covered, but not provider/restart durability. |
| County isolation tests | `backend/tests/TerraFusion.Integration.Tests/Phase40/DaisCountyIsolationTests.cs` covers appeal, exemption, certification step, notice, and queue county isolation using an in-memory store. | Present | Entity/service isolation proof exists for core Dais entities. |
| Security matrix evidence | `WO-BACKEND-OE-006-SECURITY-AUTH-COUNTY-ISOLATION-PROOF-MATRIX.md` records Dais county-claim and cross-county proof as present but not exhaustive. | Consolidated | Security posture is evidence-backed but not release-complete. |
| Migration source | `WO-BACKEND-OE-007-MIGRATION-ROLLBACK-PROOF-REGISTER.md` records `AddDaisEntities` migration source and `Down` method presence. | Source-present | Dais persistence is migration-backed, but apply/rollback execution is not proven. |

## Focused Validation Attempt

| Command | Result | Interpretation |
|---------|--------|----------------|
| `dotnet test backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~DaisEndpointContractTests\|FullyQualifiedName~R1Week5Cx21DaisCountyIsolationTests" --logger "console;verbosity=minimal" --no-restore` | Not executed; failed before test discovery because `backend\tests\TerraFusion.Unit.Tests\obj\project.assets.json` is absent in the freshly recreated worktree. | This is a local restore/prep limitation, not a Dais test failure. No restore/package-install lane was started inside OE-008. |

## Missing Proof

| Gap | Risk | Why it matters | Proposed follow-up slice |
|-----|------|----------------|--------------------------|
| Full authenticated HTTP pipeline for Dais write-like endpoints | Major | Controller tests exercise action methods and selected factory paths, but release readiness needs authenticated request pipeline proof for create/update/sign-off/queue actions. | Add a focused Dais HTTP contract test slice with test auth, no live services, and explicit county claims. |
| Database provider parity and restart persistence | Major | In-memory tests prove service behavior, not relational constraints, transaction behavior, restart durability, or provider-specific query semantics. | Add local relational-provider test slice using safe ephemeral database only after integration environment policy is decided. |
| Dais certification/sign-off statutory stop gates | Major | Certification endpoints can complete/sign off steps; sign-off gating is high-risk per the Dais domain pack. | Add certification gate tests for prerequisite order, blocked states, DOR submission prerequisites, and invalid signer/request behavior. |
| Notice queue and Dossier boundary proof | Major | Dais owns notice workflow state but Dossier owns custody/artifacts. Release proof must separate queue state from document custody. | Add Dais-to-Dossier boundary proof or explicit non-integration statement before release claims. |
| Negative validation matrix across all Dais request DTOs | Major | Existing tests cover some missing/null inputs; the controller has many DTO surfaces for exemptions, hearings, certification, notices, queue, and escalations. | Add table-driven invalid-body/invalid-id/invalid-status tests for each write-like action. |
| Cross-county mutation denial on every write-like endpoint | Major | Existing service and selected controller tests prove key paths, but queue, notice, certification, hearing, renewal, and escalation paths need endpoint-level denial coverage. | Add one cross-county denial test per write-like action family. |
| Concurrency/update conflict behavior | Minor | Current service tests show status transitions, but not concurrent update or stale-state handling. | Add concurrency/race-condition plan after provider parity is available. |
| Runtime audit/trace signal completeness | Minor | `DaisController_PostAppeal_EmitsGovernedAuditTrace` proves one governed audit call; OE-011 will map diagnostics more broadly. | Carry audit/trace coverage into OE-011 diagnostics and any Dais implementation follow-up. |

## Proposed Test Slices

| Slice | Mode | Scope | Blocked until | Release relevance |
|-------|------|-------|---------------|-------------------|
| OE-008A Dais HTTP contract proof | Test implementation, narrow | Test-auth HTTP pipeline for selected Dais read/write endpoints, county claims, and unauthorized/no-county behavior. | Owner authorizes backend test implementation. | High |
| OE-008B Dais write-like negative matrix | Test implementation, narrow | Invalid DTOs, missing IDs, invalid statuses, missing county context, and not-found behavior for appeals, exemptions, notices, queue, and certification. | OE-008A or owner-approved direct test slice. | High |
| OE-008C Cross-county mutation denial | Test implementation, narrow | One denial proof per Dais write-like action family. | Owner authorizes backend test implementation. | High |
| OE-008D Certification gate proof | Test implementation, narrow | Sign-off order, levy notice prerequisite, DOR submit/accept sequencing, conflict/not-found behavior. | Owner authorizes backend test implementation; statutory gate review if behavior changes. | High |
| OE-008E Relational/restart persistence proof | Environment/test lane | Provider-backed persistence, restart durability, transaction/constraint behavior. | Integration environment dependency policy from OE-003/OE-009. | Medium |
| OE-008F Dais-Dossier handoff boundary proof | Evidence/test plan first | Confirm Dais does not write document custody and Dossier remains evidence owner. | Dossier boundary scope or Workbench lane selection. | Medium |

## Risk Ranking

| Risk | Severity | Evidence | Disposition |
|------|----------|----------|-------------|
| In-memory proof overclaim | Major | Phase40 tests use EF InMemory. | Release gates must distinguish in-memory service proof from relational/runtime proof. |
| Write-like Dais endpoint coverage incomplete | Major | `DaisController` exposes many POST/PUT endpoints beyond currently named contract tests. | OE-008A through OE-008D should be authorized before release-ready claims. |
| Certification gate behavior is statutory/high-risk | Major | Dais domain pack escalates certification sign-off gating. | Any behavior change requires owner authority; tests may be added if they preserve behavior. |
| Dossier custody boundary not E2E-proven | Major | Dais pack forbids direct document custody; Workbench evidence says Dossier remains evidence owner. | Keep Dais notice/appeal handoff claims limited until boundary proof exists. |
| Integration environment remains segmented | Major | OE-003 classified Docker/Testcontainers dependency. | Provider-backed proof remains segmented until OE-009 defines release gate handling. |
| Local restore/test prep missing in fresh worktree | Minor | Focused no-restore test failed due to missing `project.assets.json`. | Not Dais failure; do not conflate with release risk. |

## Release Readiness Interpretation

Dais is implemented and covered by meaningful source and test evidence. It is not yet release-grade
E2E proven.

Current evidence proves:

- Dais controller and service surfaces exist.
- Core Dais entities are modeled and migration-backed.
- In-memory service persistence covers appeal, exemption, certification, notice, queue, and audit
  fields.
- In-memory county isolation covers core Dais entity families.
- Selected Dais controller contracts cover 201, 400, wrong-county non-leak, county-scoped persistence,
  and one governed audit invocation.

Current evidence does not prove:

- full authenticated HTTP pipeline coverage for every Dais write-like endpoint,
- relational provider parity,
- restart durability,
- exhaustive cross-county mutation denial,
- certification/sign-off prerequisite enforcement across all statutory paths,
- Dais-to-Dossier artifact custody boundary,
- release-ready diagnostics/audit signal completeness.

## Recommended Next WO

Recommended next WO:

`WO-BACKEND-OE-009 - Backend Release Gate Definition`

Recommended scope:

- Convert OE-003 through OE-008 findings into release-gate criteria.
- Explicitly distinguish zero-warning build, unit lane, segmented integration lane, Dais E2E proof
  gaps, migration/rollback source proof, health/readiness semantics, service-registry partial proof,
  and security/county-isolation proof.
- Do not implement Dais tests inside OE-009.
- Do not claim backend release readiness until the release gate defines pass/fail criteria for the
  Dais proof gaps above.

STOP_TYPE: BACKEND_DAIS_E2E_PROOF_PLAN_READY
