# WO-WAL-007A — Required launch dependency security repair

| Field | Value |
| --- | --- |
| Status | `DELIVERING_PROTECTED_DEPENDENCY_REPAIR` |
| Parent | `WO-WAL-007` / Washington Assessor Launch V1 / issue #1485 ACTIVE |
| Authority | `OWNER-WAL-V1-MISSION-AUTHORITY-20260827`; `OWNER-TF-STANDING-OPERATOR-AUTHORITY` |
| Base | `7c723b33123d9695a1009ce59a90674d05377610` |
| Risk | R5 bounded launch dependency security remediation; no deployment |
| Contract | `wal.launch.production-dependency-critical-audit.v1` |
| Environment | `wal007a-local-dependency-resolution-and-ci`; no county data or running product |
| Terminal | `WAL_REQUIRED_NEXT_CRITICAL_DEPENDENCIES_REMEDIATED` |

## Causal scope and authority

Required PR #1580 Vitest security audit failed on two critical Next.js advisories
(GHSA-p293-qw3h-jr36 and GHSA-2xp9-vwfh-vxw4). Root and terra-gama importer
resolutions are 16.0.7. Three reports inside the test's configured retry2 contain
the same critical findings. This is not an optional reviewer/provider outage.
The pinned base dependency graph predates WAL-002L and is unchanged by its seven
paths. WAL-002L explicitly excludes dependency edits, so this is a separate exact
repair required to deliver and assure the launch, not unrelated CI cleanup.

Vercel's primary advisories identify 16.3.3 as the patched 16.x floor. Verify
registry availability and compatibility before resolving. Do not infer exposure
or exploitation of a deployed service from a dependency audit alone.

## Exact reservations

Builder, one writer in `C:/Users/bsval/tf-wal007a-critical-next-dependency`:

- `package.json`: change only the existing Next production dependency version.
- `pnpm-lock.yaml`: normal pinned pnpm9 resolution of both existing Next importer
  instances and their necessary dependency closure; preserve unrelated importers.

Coordinator-only, never concurrent with builder writes in this worktree:

- `docs/brain/workorders/active/WO-WAL-007A-critical-next-dependency.md`
- `docs/brain/evidence/WO-WAL-007A-proof.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`: add only this exact child, preserving all prior rows.
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`: bounded registration/reservation regression only.

The existing terra-gama ^16.0.1 declaration permits the patched version and is
read-only. No other manifest, registry row, CI, audit-test or policy write is released.
Normal worktree materialization, isolated install outputs, generated evidence and
external evidence reports are permitted, not additional source changes. Main
owns dependency/heavy-job scheduling and GitHub lifecycle. No production runtime,
HERMES/ATLAS/AEGIS service, Docker or network-control reservation is granted.

All existing local worktrees had zero dirty root package/lock paths at dispatch;
the independent five-suite coordinator separately confirmed no shared manifest
reservation. The open PR inventory contains L and two suite PRs, no competing
dependency repair. Keep shared dependency writes serialized to this child.

### Canonical reservation correction after review

PR1581 head d6c03cc9db51fe8d9d39c3396f214633273afabb passed required checks
but review3967287496 identified the missing007A registry entry. Main verified the
substantive gap against canonical docs/brain/workorders/CANON_INDEX.md and WAL
program149–152; the review's program/CANON_INDEX.md spelling does not exist.
Existing active owner mission authority permits this child and routine correction;
no fresh owner decision is required and the old absence is not rewritten as fact.

Main serializes the two added governance paths here while L1580 is frozen. Preserve
L's independent registry/fixture delta on later protected integration. Register
007A as review, not complete or newly dispatchable, with exactly these six paths,
the contract/environment above and protected-ref guard. Keep every existing row,
especially blocked007/008 and their production prerequisites, unchanged. Add a
focused test first: actual missing-row failure before registration, schema/exact
reservation and parent-boundary success afterward. No schema/planner/policy or
owner-decision edits. Package and lock remain byte-exact reviewed d423bf/77b11.

Main transfers the sole worktree writer to Pauli for only registry and existing
wave-test source preparation and controlled Node validation. Main's WO/proof
writes are paused during that builder interval. No compiler, install, commit,
push, merge or other source action is included in the builder release. Independent
review and normal Brain/new-head protected delivery follow the frozen handoff.
Original four-path validation and d6c CI remain historical exact-head evidence,
not automatically new-head tests. No parent completion or runtime claim.

The builder's missing-row RED and focused GREEN passed as intended; full query/
wave executed53PASS/2FAIL of55. A controlled unchanged HEAD execution independently
reproduced both failures (52PASS/2FAIL of54): historical E-wave and durable-admission
assertions deny later001F/003E records already present on that baseline. Main takes
the sole writer back after frozen handoff and releases only the two assertions in
the existing reserved test: check absence in actualRecords/selectedRecords passed
to the respective historical planners, not the whole current registry. Preserve
all current rows/statuses, historical selection/dependencies, dispatch and denial
assertions. No L source is copied or cherry-picked; reconcile shared historical
lines during later normal protected integration. Re-run the full unfiltered query/
wave tests; preserve both failed logs and do not claim this is a production defect.

## Implementation and validation

1. Preserve the raw failing CI evidence and exact base pins. Source report:
   `wal002l-ci-dependency-audit-review-20260909.md`; raw log SHA-256
   `b999d01939e601470ffbb4198350c20c1d29675a3d4216a20e2f6da5808539f7`.
2. Use the repository's pinned pnpm9.0.0 and ordinary package-resolution commands,
   not a blanket workspace upgrade or hand-fabricated integrity values. Ensure
   the complete workspace importer manifest set is present before lock generation;
   sparse checkout must not silently remove importers. Stop resolution churn for
   review rather than committing unrelated dependency updates.
3. Prove both old Next resolutions are gone, both importers use the patched
   release, and any changed closure is causally required. Run a normal no-fix
   production critical audit and retain exit status/output; do not waive newly
   discovered critical findings or confuse registry errors with security success.
4. Run frozen installation, focused existing dependency security test, appropriate
   compatibility checks, canonical Brain review-diff/proof/commit-plan, exact-path
   and diff checks, independent review, and all protected CI gates. No suppressing
   hooks, audit IDs, tests, peers, integrity checks or branch protection.
5. Main integrates only a reviewed protected merge into dependent L/K candidates;
   repin and validate their resulting exact heads. This repair is not L/K runtime
   acceptance, WO-WAL-007 acceptance, WACO retest or statewide launch completion.

## Observed validation and delivery boundary — 2026-09-09

The frozen minimal lock and both Next16.3.3 importer resolutions passed independent
source/provenance review, normal frozen installation with hooks, a no-ignore-flag
production critical audit, the actual unchanged non-skipped dependency security
test (1 PASS), and Windows native-load/Sharp PNG checks in both importer contexts.
Core type-check and phase83 tests (56 PASS) also passed. Lower-severity audit
findings remain: 17 low, 111 moderate and 57 high; zero critical is not zero risk.

Normal terra-gama build FAILED with31 diagnostics and explicit noEmit FAILED.
The17 implicated build-source files match immutable base7c723b33. Independent
review confirms concrete inherited malformed syntax, absent local utilities and
five invalid exports from the unchanged MUI version. All103 tracked gamma inputs
are materialized; this is not a sparse-input omission. No baseline build execution
or full application compatibility is claimed, and no source repair or policy
waiver is included. Detailed failures, hashes and commands remain in the proof.

These inherited app defects do not expand this child into legacy application
repair or permit a failing protected check to be bypassed. Proceed with the bounded
security repair's normal Brain, exact-head review and protected PR workflow; keep
the build/type failures visible. No deployment, runtime acceptance, integrated
WAL-007 acceptance or parent completion follows from this child alone.

## Failure, rollback and continuation

### Reviewed minimal-lock construction release — 2026-09-09

Two normal targeted pnpm9 resolutions are archived; both update the target but
also rewrite unrelated shared graphs. No third resolver is released. Independent
review supports the following finite, deterministic preservation step inside the
existing two builder paths. This explicitly narrows the earlier coordinator
prohibition on lock graph splicing; it does not permit invented metadata or peer
identities, arbitrary dependency edits, or a security-policy exception.

Use exact base lock `c2a7aa594eb6f41a688bce4fda7c9968089bb4c56a68e9c8e3e7e8519ed94130`
and archived normal-generated candidate plus restored SheetJS integrity
`50483d91f1eeb8ff01c6f9e24aa85b6f25b200e7e1f672b4b1720a49d12e1413`.
Preserve all base settings, overrides, patches, SheetJS identity, 29 importer keys
(27 populated and two empty), and every non-Next importer field. Change only
root Next specifier/resolution and terra-gama Next resolution using the exact
generated mappings. All new dependency records, native/optional platform records,
integrities and peer-qualified references must be copied as complete byte-exact
blocks from the generated candidate, never synthesized or re-resolved.

Retain every existing base node. At the three reviewed shared-snapshot collisions
(`@babel/core@7.28.5`, `@babel/traverse@7.28.6`, `browserslist@4.28.1`), retain
and traverse the exact base subgraphs. The unchanged styled-jsx/Babel peer bindings
do not require their generated debug/browser-data rewrites. Any additional
collision or package-metadata conflict must fail for review. New Next's separately
keyed browser mapping may coexist with the older mapping retained by Browserslist.

Use the actual pinned pnpm9 YAML/dependency-path parser for graph semantics,
including aliases, nested peer suffixes, local links and all optional platform
edges. Preserve raw source-block bytes; do not globally reserialize the lock.
Prune only nodes in the old Next closure proved unreachable from all resulting
importer dependency/devDependency/optionalDependency roots; delete a package record
only when no retained snapshot needs it. Preserve unrelated existing orphans.

The read-only model predicts 45 added/39 removed snapshots, 43 added/38 removed
package records, totals 3022/2809 respectively. Recompute reachability and each
invariant; matching counts alone is not proof. Require no dangling references,
no old Next16.0.7, exact base/generated provenance for every block, exactly three
importer scalar changes, and identical bytes on two independent constructions.

Coordinator releases external projection tooling/tests/evidence only in the
existing task artifact directory, names prefixed `wal007a-projection-`; these are
not extra repository source reservations. Builder may perform the bounded
mechanical whole-block transformation after invariant checks, retaining all held
candidates and a full delta. No install or audit follows automatically: independent
exact-output review and Main's resource release precede normal pinned pnpm9 frozen
installation under unchanged integrity/engine/peer/script policy. If it rewrites
the lock, requires re-resolution or fails, preserve that failure. No fallback or
waiver. Existing audit, compatibility, Brain and protected-delivery gates remain.

Two bounded implementation/review remediation iterations; operational failure
gets diagnosis, not blind security-test retries. Preserve base and candidate
identities. Pre-merge rollback is leaving this isolated branch unmerged; after
merge use a reviewed corrective/revert PR, never force history. No deployment is
performed here. Parent #1485 remains ACTIVE and continues to its own 39-county,
production and external-assessor terminal predicates.

<!-- brain-machine-policy: existing Brain CLI exact scope -->
### Required-check diagnostic amendment and sole-writer release

Current exact head2fb318e5b396c34162f15969b775da00c11a4922 passed full
Vitest, but canonical .NET job102452928342 repeated the earlier WAL003E fixture
timeout in PersistenceRecheckPreservesAllowedChangesAndForeignCounty(descriptive,
false). Actual4724PASS/1FAIL/26SKIP; tested merge52221267ab42e8f94c35a75ce380dcdcc8d65920.
The unchanged fixture discards deadline-versus-wait exception identity and its
finally can mask an earlier failure. The timing cause remains unknown. Raw log
SHA2567e6ae66039a28089d186047a94b74d793f28ba1a61e369319627ba9281fdd136
is retained externally. No further blind rerun or check waiver is released.

Under the existing mission and standing operator authority, Main adds exactly
`backend/tests/TerraFusion.Unit.Tests/Sync/CountyReadOnlySalesSyncServiceTests.cs`
as the seventh path for diagnostic-only remediation of this observed required
check. This supersedes only the earlier six-path/backend exclusion for this exact
test file; all backend production files and every unlisted path remain excluded.
A separate base-only child would still inherit the independently proven critical
Next gate; keeping this causal check repair on the already patched candidate avoids
an unprotected dependency integration. This is not a claim that Next caused it.

Nash receives sole source write access to that existing test file after Main's
metadata handoff; Main pauses all other writes in this worktree until frozen return.
Limit production-fixture changes to RunPausedRecheckAsync and an invocation-local
diagnostic helper plus deterministic diagnostic regression cases in this file.
Use fixed phase codes and monotonic elapsed times; retain original and drain failure
types separately, latch/Sync task status and cancellation state before/after request.
Do not emit row values, connection strings, raw provider messages or secrets.
Keep both15-second bounds, signal ordering, cancellation and every existing
behavioral assertion. No sleeps, timeout increases, retries, global serialization,
CI edits, production changes, fake persistence, or acceptance from diagnostics.
Prepare focused RED-before-GREEN diagnostics; no compiler/heavy test is released
to the builder until Main grants the resource slot. Independent source review,
normal Brain, exact new-head tests and protected checks remain required. Historical
six-path/2fb evidence is not evidence for this seven-path candidate. Parent1485 ACTIVE.

### Actual diagnostic output RED and guarded capture implementation

Main's first helper refused absent Unit.Tests/CiHints restored assets without
launching tests; that precondition failure is retained. Ordinary existing-project
restore with backend/NuGet.config then completed native0, no source/dependency
change or waiver. Fresh normal WITH-build run3191 executed exactly four diagnostic
cases:0PASS/4FAIL/0SKIP, native1/runner1. Actual assertions at1356/1384/1413
respectively lacked caughtType, firstType and elapsedMs in the legacy formatter.
Evidence leaf wal007a-fixture-diagnostic-restored-red-fdc8fbb49bcf4749b65fd0478f6b2e8b.
These are genuine output-contract REDs, not reproduction of the intermittent CI delay.

Main releases Nash only the same Sync test file for sanitized evidence formatting
and the already-bounded invocation-local monotonic phase/status capture in the real
paused fixture. Preserve original and drain failure types/phases independently,
including non-timeout first exceptions; no private payload or raw inner exception
leakage. Keep all existing timeout/cancellation/assertion semantics and prevent
diagnostic instrumentation from introducing races, blocking work or global state.
The four observed regression tests stay unchanged except additive assertions if
needed. Include a bounded deterministic integrated diagnostic test using the real
synthetic fixture and fixture-owned fault/control seam if necessary; no elapsed
sleep, new package, synthetic successful persistence, deadline increase or production
change. Distinguish formatter GREEN from actual capture-path proof and full-class
regression results. Main pauses all other worktree writes during builder ownership;
normal validation and independent review follow frozen handoff. No compiler/Git/
CI retry or runtime action is released to the builder. Parent1485 remains ACTIVE.

### Actual full-class diagnostic GREEN and delivery handback

Nash returned the sole source writer after frozen capture implementation SHA256
23b0c159943a58c4764f6d6c95e0008f272a2b51f11ef1fca4489fad0e6028f6.
Independent source review is CLEAR. Normal WITH-build session83519 on2026-09-09
12:46:29.7001281Z–12:46:56.7350454Z executed40PASS/0FAIL/0SKIP, native0/runner0:
all34 original cases, four formatter regressions and two deterministic integrated
fixture cases. Independent disk/TRX/hash assurance is CLEAR. Full receipt resides
in wal007a-fixture-diagnostic-class-9de7dd998c22435ea4703fabc14e2860;
TRX SHA25634e36b1e3e4d0a7f08e5f4fd34c963ce0341218c6876e0c2c76722bce477c35b.

Actual invocation-local phase/task/token/first-error diagnostics preserve both
15-second bounds and all original assertions. Integrated fault injection tests
information preservation after a real edit and real Sync completion, not a natural
15-second delay or the unknown CI timing cause. No production behavior changed.
All8 source/19 dependency/13 asset hashes and index state matched before/after.
Main resumes coordinator-only metadata and normal seven-path protected delivery.
No blind rerun, bypass, parent completion or protected-check success follows from
the local40-case result; current new-head required CI must independently pass.

```json
{
  "id": "WO-WAL-007A",
  "task": "Repair required launch critical Next dependencies without weakening security gates",
  "risk": "R5",
  "suite": "OS",
  "allowed_files": [
    "package.json",
    "pnpm-lock.yaml",
    "docs/brain/workorders/active/WO-WAL-007A-critical-next-dependency.md",
    "docs/brain/evidence/WO-WAL-007A-proof.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json",
    "docs/brain/workorders/tools/wo-wave-plan.test.mjs",
    "backend/tests/TerraFusion.Unit.Tests/Sync/CountyReadOnlySalesSyncServiceTests.cs"
  ],
  "forbidden_patterns": ["backend/src/**", "frontend/**", "packages/**", ".github/**", ".governance/**", "pnpm-workspace.yaml"],
  "required_proof": [
    "node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-wave-plan.test.mjs",
    "pnpm audit --prod --audit-level critical",
    "node scripts/brain/brain.mjs review-diff --workorder WO-WAL-007A",
    "node scripts/brain/brain.mjs proof --workorder WO-WAL-007A",
    "node scripts/brain/brain.mjs commit-plan --workorder WO-WAL-007A"
  ]
}
```
