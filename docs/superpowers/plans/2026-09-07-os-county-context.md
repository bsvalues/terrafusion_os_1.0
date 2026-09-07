# OS county-context operational closure — Implementation Plan

> For agentic workers: use superpowers:subagent-driven-development for isolated builders and independent task reviews. The existing work-order handoff is the durable progress ledger; no additional work orders or queue are created.

**Goal:** Make the four existing briefing/packet/export journeys operate on authorized persisted records and retrievable artifacts.

**Architecture:** Reuse CountyStudySession and Dossier persistence through the existing application DbContext. Add immutable source snapshots and atomic export records where existing entities do not represent them. Pilot forwards the caller's bearer authorization to strict backend endpoints; React uses authenticated county and persisted year/draft selections.

**Tech Stack:** Existing .NET/EF Core application, isolated SQLite tests, TypeScript Pilot handlers, React OS Shell, Node test runner and existing Playwright harness.

**Spec:** Owner expansion attachment `C:/Users/bsval/.codex/attachments/f212adc8-1232-4db3-8d1e-fdeae32d7d27/pasted-text.txt`, recorded in `docs/brain/workorders/active/OS-COUNTY-CONTEXT-001.md`.

## Global Constraints

- Preserve WACO workspaces/runtime and the ten dirty Dossier closeout files.
- No demonstration-handler substitution, new suite foundation, separate persistence platform, or production county-data operations.
- County authorization comes from authenticated backend claims; no missing-claim Benton fallback.
- Preserve confirmation, reason codes and existing suite-owned decisions. No new certification policy.
- Missing, foreign, wrong-year or wrong-revision inputs must not produce successful exports.
- Completed artifact bytes and provenance must survive restart; retries cannot manufacture duplicates.
- Independent assurance and required protected checks precede eligible merge; deployment remains excluded.

## Task 1: Persisted snapshots and operational backend

Reservation: backend-only worker in its dedicated worktree. Existing `TerraFusionDbContext.cs`, existing Dossier/appeal integration only as necessary, new Dossier workflow controller/service/entities/configurations and additive migration; matching backend test files. No WACO valuation mathematics or CountyStudyController behavior changes.

Interfaces: `/api/dossier/workflows/context`, `drafts`, `drafts/{id}`, `exports/equalization`, `exports/audit`, `exports/{id}`, `exports/{id}/content`, `morning-brief`, `appeals/{appealId}/packet`.

Save request: `{studyId,requestId}`. Export request: `{county,draftId,revision,taxYear,requestId,confirmed,reasonCode}`. Audit scope: `{county,taxYear,bundleScope,subjectId,requestId,confirmed,reasonCode}`.
Draft summary: `{draftId,studyId,countyId,taxYear,revision,artifactCount,createdAt}`.
Export summary: `{packageRef,payloadRef,countyId,taxYear,draftId,revision,artifactCount,artifacts,contentHash,downloadUrl,createdAt,status,certification:false}`.

- [ ] RED: execute actual SQLite/controller tests for nonexistent draft, foreign scope, wrong year/revision, missing inputs, save and reopen, count changes and idempotent retries before production implementation.
- [ ] GREEN: snapshot actual records in one transaction, immutable revision, content-addressed integrity and county/request identity constraints; no partially completed export state.
- [ ] Read actual Dais operational records for role briefing; retrieve explicit appeal/packet relationships and existing evidence/custody. Reuse adopted Dossier decisions for any composition rather than duplicating rules.
- [ ] Test refusal at authenticated HTTP boundary as well as service behavior. Restart a file-backed isolated SQLite connection and retrieve identical export bytes.

Illustrative acceptance assertion (independent expected outcome):
```csharp
response.StatusCode.Should().Be(HttpStatusCode.NotFound);
(await db.Set<DossierWorkflowExport>().CountAsync()).Should().Be(0);
```
The backend worker must confirm exact entity/test names in its file map before editing.

## Task 2: Real Pilot execution and non-leaking authorization

Coordinator reservation: `os-platform/core/pilot/countyWorkflowHandlers.ts` and generated JS, `handlers.real.ts/js`, `dev-pilot-runtime.mjs`, `tools/registry/build-core-js.mjs`, `check-generated-js.mjs` if explicit target list requires it, existing diagnostic and new Node behavioral tests.

Interfaces: register the four tool IDs through `registerR1Handlers`; per-request authorization is held outside serializable execution/trace context. No service-account fallback. Equalization maps actual `draftVersion` GUID to backend `draftId` and requires the selected SHA revision and retry identity.

- [ ] Preserve observed missing-registration regression and add real local HTTP tests for caller-token forwarding, refusal without token, false confirmation, wrong county, backend rejection and successful retrievable reference passthrough.
- [ ] Implement real handlers using existing `backendGet/backendPost`; bind request authorization ephemerally at Pilot ingress. Register only real handlers, not assessor demonstration functions.
- [ ] Run `node --test` focused tests, `pnpm run build:core-js`, `pnpm run check:generated`, core type-check and Phase83 tests.

```javascript
assert.equal(registrations.has('export_equalization_package'), true);
await assert.rejects(() => handler(nonexistentDraft, authorizedContext, tool));
assert.equal(receivedAuthorization, 'Bearer controlled-test-token');
```

## Task 3: Exact active/staged manifest prerequisite

Manifest worker reservation: active manifest, new `terrapilot.tools.forward-staged.json`, existing reserved-staging register and decision history, `active-staged-manifest.test.mjs`.

- [ ] Preserve all 18 unrelated reserved-office declarations exactly in a non-loaded staged file, not activate or relabel their domain operations.
- [ ] Retain `export_audit_bundle` as Dossier-owned actual records export, with confirmation/reason and no direct Trace-store access. Tighten workflow input schema to actual draft/revision/request identity.
- [ ] Prove registry default non-exposure and unchanged validator negative cases; run `node scripts/spec-gates/write-lanes.mjs` with zero violations.
- [ ] Coordinate necessary reserved-office UI exposure gating with the frontend owner; do not present removed tools as operational.

## Task 4: Existing UI and persisted selection

Frontend worker reservation: four existing screens, new small workflow API/context/selection/output component and tests, narrowly necessary Pilot client header alignment. Shared routing prerequisite must be separately coordinated before edits.

- [ ] RED behavioral component tests: authenticated county request, no persisted draft, year/draft switch clears confirmation, deferred previous-context result ignored, persisted save selection and actual output retrieval.
- [ ] Shared selector loads authorized years/studies/drafts, lets operator save a study snapshot and reopen it. No computed draft names or calendar-year assumptions.
- [ ] Wire all four screens through registered Pilot tools; explicit user confirmation per selected operation; retrieve authenticated output for inspection/download.
- [ ] Use generation identity for in-flight invalidation; cancel/ignore old requests on county/year/parcel/draft/session changes.
- [ ] Run focused UI tests and frontend TypeScript. Coordinate exact HTTP names with backend contract before integration.

## Task 5: Integrated acceptance, assurance and protected delivery

Coordinator/test reservation: existing browser harness extended in new county-context proof files, unique non-production runtime directory/ports/database, no WACO mutable state.

- [ ] Boot isolated real backend, Pilot and OS Shell with explicitly synthetic test records and no live county connections.
- [ ] Through existing screens save/select a draft, export, retrieve content, reload/restart and reopen; prove two explicitly synthetic county identities in the isolated application database, without representing that as live Benton acceptance.
- [ ] Prove missing/foreign/year/revision rejection, different artifact counts, retry and interrupted generation, context switch during execution, all four tool paths.
- [ ] Independent task reviews for spec and code quality, then whole-branch exact-head assurance; resolve findings with covering tests.
- [ ] Run Brain scope/proof and all applicable protected checks; commit only exact in-scope files, push branch, open PR, resolve reviews/checks and merge only when eligible.
- [ ] Verify delivered revision in authorized development runtime, update the existing handoff with actual evidence, then mark COMPLETE. Any remaining failure means NOT COMPLETE.

## Cross-task consistency review / progress ledger

| Tasks | Shared interface or invariant | Resolution |
|---|---|---|
| 1 / 2 / 4 | Draft GUID, revision, county, year, request ID and export metadata | Same HTTP contract above; backend changes must be communicated before divergence. |
| 2 / 3 | Four tool IDs and manifest params | Existing IDs retained; actual persisted draft plus revision required. |
| 3 / 4 | Reserved office tools and UI consumers | Physical staging plus narrowly coordinated UI unavailable gating; no activation. |
| 1 / 5 | Persistent test data | Real application DB, explicitly synthetic records, isolated runtime only. |
| All | Independent mutable files | Separate worktrees; coordinator integrates exact paths; no shared builders. |

Tasks 1–4 are implemented, integrated and bounded-review findings are closed.
The checklist above remains the original acceptance plan; current execution evidence
is recorded here and in the existing work-order ledger, not inferred from checkboxes.
Task 5 remains active through protected delivery and delivered-revision verification.
The immutable source ledger records evidence available before its commit. Final
protected-merge status, actual delivered revision, post-merge runtime evidence and
the terminal assignment status are recorded in the existing delivery PR #1569 and
this task's handoff, without inventing a later runtime result inside an earlier commit.

Latest integrated evidence: 77 backend workflow/proxy/certification HTTP tests pass,
including fresh synthetic bootstrap, transaction interruption/retry and restart.
Full frontend passes 8,094 assertions, 211 existing skips, zero failures across
718 files; unchanged skip checker passes. Latest strict source-graph differential
has zero introduced diagnostics (1,049 baseline / 1,039 candidate), not a globally
clean typecheck. Manifest/handlers/Phase83/85/86 pass 125/125; diagnostic regression
continuation passes 3/3. Runtime registration profile tests previously passed
112 with two existing host-gated skips; original pins remain unchanged.

Complete actual browser journey passed (1 test / 41.8 seconds): actual draft save,
all four handlers, persisted output inspection/download, retry, API restart/reopen,
distinct year artifact sets, shared Roll Readiness selection, A-to-B and A-to-B-to-A
late-response invalidation, and foreign-county denial. Synthetic records only.
The inherited Program.cs legacy CORS-origin gate prerequisite was then reproduced
with an actual failing preflight test; only the unconditional legacy default is
removed. Rebuilt API and whole-browser rerun pass (1 test / 33.8 seconds), including
actual preflight allow/deny assertions. Brain proof passes with unchanged gates.
No production county acceptance, live county writes, statutory certification,
protected merge or final delivered-revision proof is claimed yet.
