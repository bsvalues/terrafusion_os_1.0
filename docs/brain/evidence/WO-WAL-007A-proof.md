# Proof Bundle — WO-WAL-007A

- Generated: 2026-09-09T10:04:00.636Z
- Work order: WO-WAL-007A

## Commands run
- `brain check` → PASS (✅ all checks passed)
- `wiki --check` → PASS (✅ wiki current (15 pages match canon))

## Negative tests

The finite lock-preservation tool's13 tests passed, covering duplicate YAML,
missing optional references, unapproved collisions, peer/reference errors and
preservation/reachability invariants. This is not a reusable crash-safe rewrite
tool: its completed one-use file write was non-atomic; complete preserved input
and output copies plus verified final bytes support this candidate only.

## Working tree
- changed (tracked) files: 2
- staged files at proof time: 0 (commit-race hazard if > 0 — WO-0011)

## Known risks (open drift)
- P0=0 P1=0 P2=2 P3=0

## Brain result
✅ PASS for the two Brain commands above only. This is not product or parent acceptance.

## Exact dependency candidate

- Base: `7c723b33123d9695a1009ce59a90674d05377610`.
- Root package SHA-256: `d423bf49959c2eb791421d6391181b015a9d149978ba702ce0c654b972b9d988`.
- Lock SHA-256: `77b11ae74cf213ee3254ddb54fbd17fad7fef967de30ec68ccaba49647bad5f1`.
- Root Next specifier/resolution and terra-gama resolution move16.0.7 to16.3.3.
  Terra-gama's existing declaration stays unchanged. All29 importers retained;
  exactly3 importer scalar changes, no unrelated snapshot rewrites. All5831 raw
  package/snapshot blocks independently matched base or normal-generated provenance.
- The13-test projection preserves existing SheetJS SRI, all platform/optional
  references, overrides and patches. No invented integrity or peer identity.
- Full independent source/evidence review: CLEAR with the limitations below.

## Actual validation

| Command/check | Observed result |
| --- | --- |
| Normal pinned pnpm9 frozen install, scripts enabled | EXIT0; all29 workspaces; resolution skipped;2776 packages; root Husky installed |
| Frontend `pnpm audit --prod --audit-level critical`, no ignore flag | EXIT0;0 critical,17 low/111 moderate/57 high |
| Unchanged DependencyVulnerabilities.test.ts, RUN_SECURITY_AUDIT=1 | EXIT0;1 PASS,0 skipped |
| Both actual Next importer contexts, native SWC load and Sharp PNG encode/decode | EXIT0; Next/SWC16.3.3,Sharp0.35.4;1x1 PNG in memory |
| `pnpm run type-check` (core tsconfig) | EXIT0 |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | EXIT0;56 PASS,0 FAIL,0 skipped |
| Terra-gama `pnpm run build` | **EXIT1 / FAIL**;31 diagnostics across17 base-identical source files |
| Terra-gama `pnpm exec tsc --noEmit --incremental false --pretty false` | **EXIT2 / FAIL**;782 diagnostic lines across15 files, not782 independent defects |

The security test contains its inherited `--ignore-registry-errors` flag; it was
not changed. The separate no-ignore-flag audit establishes the non-waived registry
and critical threshold result. An earlier JSON audit returned EXIT1 because pnpm9
JSON mode returns failure for any severity before applying the non-JSON threshold;
its parsed metadata showed0 critical. That historical exit remains1, not rewritten.

Both native contexts loaded SWC and exposed transformSync; no separate successful
SWC transform is claimed. Sharp actually encoded/decoded a91-byte1x1 PNG. This does
not certify every platform or HTTP image optimization. Normal installation's
frontend prepare printed `.git can't be found` then Done; this is retained rather
than calling installation diagnostic-free. Six source pins matched before/after
validation; the coordinator's later WO/proof documentation changes are not code.

## Inherited application failure — not waived

Twenty build diagnostics concern literal pre-existing syntax including misnested
JSX, `5await` and await inside non-async functions. Six refer to `@/lib/utils`,
which does not exist in the base tree. Five request Activity/Brain/GitBranch/Globe/
Zap from unchanged installed MUI7.3.9, which does not export those names. All103
tracked gamma inputs are present. Independent review compared all17 error-source
files and config against the immutable base; no introduced defect was established.

No old-version build was executed, identical historical diagnostics are not
claimed, and early parsing failures can mask further incompatibility. Existing
ignoreBuildErrors and legacy eslint config were not modified. Full gamma build,
type and runtime compatibility remain unproven. This child neither repairs that
legacy app nor bypasses any protected gate; its narrow security delivery remains
subject to normal required CI and exact-head review.

## Durable local evidence

Preserved under the Main artifact directory
`C:/Users/bsval/.codex/visualizations/2026/09/06/01a07732-71da-73f0-8651-896ec72d5be4/`:

| Artifact | SHA-256 |
| --- | --- |
| wal007a-frozen-install-8ba80ea3f2224764965b0584e10eb336.log | d3f9d2acb3501eea2588a1387c66bb7cd482690b2ca450468a4e5be4006e0a27 |
| wal007a-critical-audit-frontend-98a331fc9b8b492189dce2b3674455d9.log | 844ab6eb579ddf9d5a05768bf1cca9851b24cd3c896546f48d671f277a8755d9 |
| wal007a-compatibility-security-98ff88ab3a6c4f4ebeb518667526539e.log | 6d0192ae45a8c4f6ce045474172d6c744e5a017752f884096bd8d722a68348d9 |
| wal007a-compatibility-build-5b6d4476a63c42648357f20a74c82c43.log | 525d2b3a9934886933de29509e5f8b208905ef666b88628a81b047b74e4819e5 |
| wal007a-compatibility-types-0062ce22d1ca4dd284b73bcee411aeec.log | f4eccbe7573c79116ea1ade83e02a630ce29a43c0108515fd2614983f7e1974e |

The compatibility logs have same-stem JSON receipts binding exact commands,
times, native exits and source pins. Frozen-install execution is recorded in
wal-resumed-execution-20260909.md; the no-ignore-flag audit is bound separately in
wal007a-critical-audit-receipt-20260909.md. These are not same-stem install/audit JSON.
Complete classification: wal007a-compatibility-handoff-20260909.md and
wal007a-compatibility-build-causality-20260909.json. Independent review:
wal007a-independent-review-20260909.md. Core gate logs are
wal007a-core-typecheck-20260909.log and wal007a-phase83-20260909.log.

Initial Brain proof failed because the15 generated wiki pages were absent in this
new sparse worktree. Its original proof/log were archived. The unchanged canonical
publisher generated them and the actual second Brain proof passed. The exact
generated pages were then moved intact to external wal007a-generated-wiki-20260909;
none is part of this four-file source delivery. No canon was altered to obtain PASS.

Protected CI/merge and dependent L/K integration remain pending at this evidence
cut. No WO-WAL-007, WACO, deployment, county or statewide completion is asserted.

## Post-review canonical registration correction — 2026-09-09

The preceding evidence describes the original four-path d6c candidate. This
amendment has six total paths; package and lock hashes above remain unchanged.
Review3967287496 correctly identified missing canonical child membership; its
program/CANON_INDEX.md spelling is corrected to docs/brain/workorders/CANON_INDEX.md.
One new review-state007A row records exact scope/contract/environment under existing
ratified mission authority. All169 prior records and blocked007/008 remain unchanged.

Observed missing-row RED:0PASS/1FAIL, then focused1PASS/0FAIL. Full query/wave
first executed53PASS/2FAIL of55. A controlled exactHEAD baseline reproduced both
historical-fixture failures at52PASS/2FAIL of54. Main changed only the two absence
assertions to their historical planner input collections, retaining all current
records, selected dependencies and dispatch/denial checks. No L source transfer.
Full corrected query/wave ran11:24:26.1978693Z–11:24:28.8381677Z, native0,
55PASS/0FAIL/0SKIP. Log wal007a-registry-historical-correction-green-20260909.log
SHA a3035f149faaf3a75a02e27789a247139d2dd396b585622ea09c4a253f444d8e.
Failed/baseline logs and original review/source handoff remain in the same evidence root.

All required d6c CI checks passed. Original canonical .NET failure is retained;
one unchanged diagnostic rerun passed4725Unit.Tests/0FAIL/26SKIP. Log
wal007a-ci-dotnet-102434480476-attempt2-20260909.log
SHA180b93a6ab0b9407cbd9e1425fe043eff403e1f6a03107034ccb901da62d5058.
This does not establish the timeout's root cause or substitute for new-head CI.
Independent final amendment review, normal commit/push and protected checks remain
required. No parent/runtime completion follows from these metadata tests.

### Fresh canonical proof output for this amendment

The unchanged publisher generated15 pages; normal Brain proof39624 completed
native0. Exact generated output follows; it covers these two Brain checks only,
not all Work Order validation or product acceptance. Generated pages will remain
external evidence, not part of the six-path PR.

#### Generated proof bundle — WO-WAL-007A

- Generated: 2026-09-09T11:25:29.196Z
- Work order: WO-WAL-007A

## Commands run
- `brain check` → PASS (✅ all checks passed)
- `wiki --check` → PASS (✅ wiki current (15 pages match canon))

## Negative tests
(record per slice — e.g. drift→fail→restore. See the slice ADR for evidence; `proof` runs positive checks.)

## Working tree
- changed (tracked) files: 3
- staged files at proof time: 0 (commit-race hazard if > 0 — WO-0011)

## Known risks (open drift)
- P0=0 P1=0 P2=2 P3=0

## Result
✅ PASS
