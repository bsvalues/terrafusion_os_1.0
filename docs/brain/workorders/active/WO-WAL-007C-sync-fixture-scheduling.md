# WO-WAL-007C — Observe and correct the actual Sync fixture scheduling boundary

| Field | Value |
| --- | --- |
| Status | LOCAL_CORRECTION_VERIFIED — canonical admission and protected delivery pending |
| Parent | WO-WAL-007 / issue #1485, Washington Assessor Launch V1 ACTIVE |
| Authority | OWNER-WAL-V1-MISSION-AUTHORITY-20260827, bounded child decomposition and standing lifecycle |
| Risk | R3 test-lifecycle scheduling; no production or county-source mutation |
| Protected base | d6b4b0aab2d264cde97e67109e0b347369d191da |
| Contract | wal.sync-fixture.scheduling-evidence.v1 |
| Environment | isolated normal Unit.Tests; synthetic in-memory county fixture only |
| Terminal | ACTUAL_SYNC_FIXTURE_SCHEDULING_CORRECTION_VERIFIED_AND_DELIVERED |

## Concrete defect and limits

Required .NET job102507533949 on PR1580 head942cc281 failed the protected
CountyReadOnlySalesSyncServiceTests case
PersistenceRecheckPreservesAllowedChangesAndForeignCounty(descriptive,false).
The release signal was set at103ms but its continuation was observed at25222ms;
the existing15second deadline had expired. Compilation succeeded. This is not
an optional-provider problem or a proven harmless flake. Preserve the actual
failure and original first-failure behavior; do not retry merely to get green.

The separate four-scenario BCL experiment supports a possible captured-context
mechanism but does not prove the actual xUnit context or CI cause. First observe
the actual fixture before changing scheduling. Existing source SHA256:
23b0c159943a58c4764f6d6c95e0008f272a2b51f11ef1fca4489fad0e6028f6.

## Exact initial reservation

- `backend/tests/TerraFusion.Unit.Tests/Sync/CountyReadOnlySalesSyncServiceTests.cs`
- `docs/brain/workorders/active/WO-WAL-007C-sync-fixture-scheduling.md`
- `docs/brain/evidence/WO-WAL-007C-proof.md`

Builder owns only the test file, Main owns documentation, normal execution and
Git lifecycle. Registry/wave are NOT reserved while 007B owns their mutable
integration. No existing row, queue, planner or parent status may change here.
Separate isolated worktree/branch: codex/wal007c-sync-scheduling. Main verified
the current protected main and open PR paths; none reserve this Sync test file.
No backend directory-local AGENTS exists; the pack map has no separate Sync pack.
The existing root/Brain/Work Order governance controls this OS-core fixture.

## Current serialized canonical admission reservation

FiveEO released its four routing-file writer after a frozen append-only handoff.
Main now reserves C's two canonical metadata additions in this isolated worktree:
docs/brain/workorders/registry/work-order-registry.seed.json and
docs/brain/workorders/tools/wo-wave-plan.test.mjs, together with the three initial
C paths above. Exactly five delivery paths; no program-routing files or I writes.
Environment identifier wal007c-local-unit-sync-fixture denotes only this existing
synthetic fixture and worktree; it does not grant a shared compiler/runtime slot.

Actual42 GREEN56396 at16:37:02.7901418Z–16:37:28.0463164Z passed all42/0skip,
with seven pins continuous, both policy probes posts0/queued0/terminalTrue and
no first/cleanup failure. Source77f602df; TRX7c20aa8722ff5d81461688a887966a8e8620636519e0854d7b3eb592cbad9af9.
Native/source/RED/GREEN assurance remains separate from admission/protected proof.

Append one C review-state row under the existing WAL goal/loop/000 satisfied
mission dependency, exact five files and existing stop boundaries. No runtime
dispatch, parent unlock, historical row/status change or assumed future merge.
Preserve all protected records/order/envelope and all existing tests. Do not
copy FiveEO's older166-row registry or any unmerged B/L/I/EO row over this base.
On later protected integration retain the full union before adding only C.
Pauli owns only these two metadata paths after its fixture source handoff;
Main owns WO/proof/execution/Git and I remains queued. Add the missing-row
regression first, then Main observes actual RED before the one-row addition.

## Initial source grant: observations only

Use the existing xUnit ITestOutputHelper mechanism. Pass it through the six
existing RunPausedRecheckAsync call sites. Record only closed context categories
and whether TaskScheduler.Current is TaskScheduler.Default at mock entry,
release continuation, drain start and drain finish. No arbitrary type names,
county identifiers, payloads, credentials or environment values in observations.
Keep output invocation-local, flush on both success and failure, and ensure an
output failure cannot mask the existing original exception. Avoid new shared
mutable static state. Preserve all40 declared cases, assertions, await semantics,
timeouts, cancellation, bounded cleanup and ordinary EF fixture behavior.

This is observation preparation, not a scheduling implementation release.
No Task.Run, ConfigureAwait, timing-limit increase, xUnit/CI configuration change,
retry, assertion removal, skip or fake-green output. Main must inspect the exact
source delta, then run the normal full40-case WITH-build fixture and read the
actual TRX observations. Source safety review and synthetic experiment results
are not a claim of current CI cause or a completed repair.

## Subsequent continuation

After actual observations, Main may release the smallest evidence-supported
test-lifecycle correction within this exact file under a recorded progression,
with meaningful regression/negative controls and unchanged county/persistence
assertions. Normal Brain proof/review/commit-plan, independent assurance, hooks,
required checks and protected delivery remain mandatory; shared registration
must be explicitly serialized before adoption. No unprotected code is copied
into L, G or K. Parent007/008 and issue1485 remain unsatisfied.

## Forbidden writes and execution

No production source, API host, live county/PACS/SQL, packages/projects/locks,
xUnit configuration, CI, policy, Docker, Wi-Fi, lab services, external-drive data,
other worktrees or protected branch bypass. Source-preparation builder may not
launch compiler/tests/network/DB. Main alone owns the coordinated normal local
test resource slot; normal synthetic test-owned EF state is allowed only during
that separately released execution, never a live county connection.

## Main actual observations and capture-policy RED preparation

Normal WITH-build92863 at2026-09-09T15:38:02.7586159Z–15:42:04.7652490Z
exited0 with40uniquePASS/0FAIL/0SKIP and all seven source/dependency input
pins continuous. Actual TRX a72cdc2458e4171147a4dde1d2228043885827fe31895f6fcb441bf8173e6017;
result4a4dbd0e4bf59a982121eecb3086d251567d62bfb2587f848d96be2fd0f837b4.
Main parsed all23 complete blocks across22 participating cases. All release and
drain-finished observations ran in XUNIT_MAX_CONCURRENCY, defaultScheduler=True;
22 mock/drain starts were XUNIT_ASYNC and one sequential second invocation was
MAX. The descriptive,false counterpart and both intentional first-failure
controls passed with the same observed capture. This measures local dependence
on the runner context, not CI queue starvation or a unique CI root cause.

Main has fully read the correction preflight. Pauli may now prepare only the
two existing RunPausedRecheckAsync release/drain waits as non-async private
configured-awaitable factories in this same file. RED factories explicitly use
ConfigureAwait(true), retaining the old capture policy and exact token/15second
bounds. Real helper awaits those returned awaitables directly; no async wrapper
that silently recaptures, no change to other awaits or production code.

Add one two-case release/drain theory that calls those actual factories under a
finite owned gated SynchronizationContext. Establish incomplete registered
awaits before completing the antecedent; positively observe either probe
completion or queued Post acknowledgement under a15second guard. Current
capture=true must fail the required no-context-dependence assertion promptly
after acknowledged Post, not by sleeping or manufacturing a timeout. Preserve
primary failure while canceling/releasing/pumping a bounded number of owned
callbacks and observing every probe terminal in finally. No Task.Run, load or
threadpool tuning, private context introspection or abandoned work. Typed drain
sentinel proves forwarding only, never synthetic product acceptance.

Keep all40 original cases/assertions/diagnostics and actual EF/cancellation/
first-failure behavior, yielding42 expected cases. Preserve the real TRX
observations without asserting that ConfigureAwait(false) forces a context
switch on an already completed task. Main must inspect the preparation and
actual compiled42case RED before releasing only the two capture=false values.
No compiler/test/runtime execution is granted to the builder. Shared registry
remains unreserved until the coordinator explicitly serializes it. CI cause and
production readiness remain unproved; no retry or protection bypass.

<!-- brain-machine-policy: bounded current scope, not dispatch authority -->
## Compiled capture-dependence RED and two-value implementation release

Actual run11055 at16:33:05.3274846Z–16:33:30.6305124Z terminated native1,
42 unique executed cases:40 originalPASS, two expected capture-dependenceFAIL,
zero skips. Both exact WAL007C_RELEASE_CAPTURE_DEPENDENCE and
WAL007C_DRAIN_CAPTURE_DEPENDENCE were observed with registered=True/posts=1/
queued=0/terminal=True/firstFailure=True/cleanupFailure=False. All7 pins
continuous; TRX34dcbdce32f607300ad827ca17af7e7637c6202e67f3b78f5f9844a8863722e8.
Main read both actual failing outputs and native/result evidence. This is
compiled behavioral RED, unlike prior analyzer setup failure.

Pauli may now change ONLY the two existing private actual RecheckReleaseWait
and RecheckDrainWait factory capture arguments true to false, plus truthful
associated factory comment wording. Preserve all42 tests/assertions, four
coordinatortrue awaits, exact tokens/15second limits, observations and cleanup.
No production or xUnit/CI configuration changes. Main will read exact delta
and run full42 normal WITH-build GREEN before independent assurance/delivery.
This establishes the bounded policy regression, not unique historical CI cause.

## Actual analyzer setup failure and bounded coordinator correction

Run63787 at16:16:04.4811788Z–16:16:17.9428132Z terminated native1 during
compilation, with all seven pins continuous and zero test discovery/TRX.
The four direct new theory coordinator awaits at1633/1644/1662/1664 raised
xUnit1030 for ConfigureAwait(false). This is SETUP_COMPILE_FAILURE, not the
intended behavioral RED; retain its leaf8f381d29194a4687963bb92e791d1fd7.

Main has inspected the actual complete theory body: the prior runner context
is restored before every coordinator await. Pauli may change ONLY those four
direct theory coordinator ConfigureAwait(false) calls to ConfigureAwait(true),
plus a concise truthful context-restoration comment if needed. Do not suppress
the analyzer or move the theory into a helper to evade it. Preserve BOTH actual
policy factories at ConfigureAwait(true), every assertion/token/15second bound,
positive gated Post acknowledgement, bounded cleanup and first failure.
ObserveRecheckPolicyProbeAsync and the actual factory call sites stay unchanged.
Main reviews the exact delta and separately reruns compiled42 RED after Dossier
releases its current slot. No builder execution or production policy fix yet.

```json
{
  "id": "WO-WAL-007C",
  "task": "Observe and correct the actual Sync fixture scheduling boundary",
  "risk": "R3",
  "suite": "OS Core",
  "allowed_files": [
    "backend/tests/TerraFusion.Unit.Tests/Sync/CountyReadOnlySalesSyncServiceTests.cs",
    "docs/brain/workorders/active/WO-WAL-007C-sync-fixture-scheduling.md",
    "docs/brain/evidence/WO-WAL-007C-proof.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json",
    "docs/brain/workorders/tools/wo-wave-plan.test.mjs"
  ],
  "forbidden_patterns": [
    "backend/src/**", "frontend/**", ".github/**", "package.json", "pnpm-lock.yaml",
    "backend/**/*.csproj", "backend/**/appsettings*.json"
  ],
  "required_proof": [
    "dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj -c Release --filter FullyQualifiedName~CountyReadOnlySalesSyncServiceTests",
    "git diff --check",
    "node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-wave-plan.test.mjs",
    "node scripts/brain/brain.mjs proof --workorder WO-WAL-007C",
    "node scripts/brain/brain.mjs review-diff --workorder WO-WAL-007C",
    "node scripts/brain/brain.mjs commit-plan --workorder WO-WAL-007C"
  ]
}
```
