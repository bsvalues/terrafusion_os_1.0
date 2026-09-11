# Proof Bundle — WO-WAL-002L

- Generated: 2026-09-09T06:40:08.175Z
- Work order: WO-WAL-002L

## Commands run
- `brain check` → PASS (✅ all checks passed)
- `wiki --check` → PASS (✅ wiki current (15 pages match canon))

## Negative tests
(record per slice — e.g. drift→fail→restore. See the slice ADR for evidence; `proof` runs positive checks.)

## Working tree
- changed (tracked) files: 4
- staged files at proof time: 0 (commit-race hazard if > 0 — WO-0011)

## Known risks (open drift)
- P0=0 P1=0 P2=2 P3=0

## Result
✅ PASS

## Bounded product evidence

Protected comparison base: `7c723b33123d9695a1009ce59a90674d05377610`.
These runs tested pinned uncommitted source at that base, not a later commit.
Only the new rejection is added to DataImportController; original UploadFile and
Program remain unchanged. Parent #1485 and WO-WAL-002 remain ACTIVE.

| Normal execution | Result | Evidence leaf |
| --- | --- | --- |
| Initial endpoint routing, run31094 | 31 executed: 9 PASS, 22 FAIL; seven actual unsupported-media fallback404 failures, fifteen separately corrected regenerated-endpoint identity assertions | wal002l-routing-red-018986bf95ad40f88d1d3a31295ca02a |
| First correction, run29248 | 38 PASS, zero FAIL/SKIP; independent review subsequently identified the unexercised MVC binding gap | wal002l-routing-green-fb7c04bea2bc4d2ab4729c55d1e2a5f4 |
| MVC invocation RED, run63992 | 40 executed: 38 PASS, two body-read failures through FormValueProviderFactory and ControllerBinderDelegateProvider | wal002l-mvc-binding-red-ee1a4d534cec4d9cbeafddfe906ab8eb |
| Parameterless rejection GREEN, run69291 | 40 PASS, zero FAIL/SKIP, 2026-09-09T06:36:03.0272238Z–06:36:32.0698796Z | wal002l-mvc-binding-green-d8f0b49ea4f4481e87de57a19d7a3f30 |
| Admission/context regression, run97084 | 86 PASS, zero FAIL/SKIP, 2026-09-09T06:41:51.2144013Z–06:42:19.7436910Z | wal002l-admission-context-regression-04f1692cac104c3bb2ef771b9edda8e4 |

Focused command: normal Unit.Tests project, `--no-restore -c Release -m:1
-p:UseSharedCompilation=false -nodeReuse:false`, filter
`FullyQualifiedName~CountyCsvUploadMediaTypeRoutingTests`. Broader run uses
`FullyQualifiedName~CountyCsvUpload|FullyQualifiedName~AuthenticatedCanonicalCountyContext`.
Normal builds were not skipped. Controller, routing test, Program, Unit.Tests
project and central packages had identical begin/end SHA256 values for these runs.

Final tested source pins:

- Controller: `7c769f275b5caa17b390ea4fe3eaa12113416caafe86123cbc875c776261516f`
- Routing test: `71ddb8b960bd26eb018e2f9bbbfbd79b4565f188c1b9494a8926caf07d80a7f2`
- Unchanged Program: `af02a0a58b7b218b499007f6a8bad45b8c5cb03a76ec9f0f5243590749034466`
- MVC RED TRX: `d6218cdabc13da4f4dcad81fe4a4f7a3f8febaa83e4da879571923a973057eb8`
- MVC GREEN TRX: `cd589c85f99d100c9aac1f801938f10ba198afc4865328b9d07477866f07a7bb`
- Broader regression TRX: `c974712d29dadcc28ab151685c563d6d1e44ecb44f65f3421f15533c576b839e`

Real routing uses production MVC endpoint discovery. MVC invocation retains actual
binding and activation, then captures Forbid/415 before result execution. Synthetic
request-context/resolver ports feed the real county binding chain; no synthetic
JWT handler or fabricated Established record is supplied. This is component proof,
not middleware authentication, serialized HTTP responses, live upload, promotion
or post-upload restart acceptance. K retains those separate actual-runtime gates.

## Governance and normal environment evidence

Full `node --test docs/brain/workorders/tools/wo-wave-plan.test.mjs`: first 39PASS/
1FAIL in an unchanged historical E-wave assertion. Protected base already contained
003E; the fixture now distinguishes current presence from historical selected-set
absence. Revised full suite: 40PASS/0FAIL/0SKIP. Historical H dispatch remains tested
through a clone; current completed H is excluded. No other registry row is reconciled.

Independent Beauvoir exact-source review resolved L-P1 and cleared the product,
seven-path policy and narrow E-fixture correction. External report:
`wal002l-product-independent-review-20260909.md`. This does not substitute for
required protected checks, merge or K acceptance.

Normal frozen root install initially failed before Husky lookup with an oversized
inherited PATH. The identical pinned pnpm9 install with a short process-local PATH
passed, including actual `husky - Git hooks installed`; package, lock, workspace and
.npmrc hashes stayed unchanged. No hook bypass, global PATH or dependency edit.

The first canonical Brain proof failed only because this fresh worktree had no
generated wiki pages (none are tracked at the base). Normal unchanged wiki publisher
generated 15 pages; the full Brain proof above then passed. Exactly those 15 owned,
hash-verified generated pages were removed afterward, reproducible from the unchanged
publisher/canon. They are validation outputs, not release-source changes. A fresh
worktree must generate the wiki before repeating this check. Failed proof and wiki
logs remain archived; this receipt does not claim the wiki files remain installed.

External raw logs, review and TRX leaves are preserved in the coordinator's
`01a07732-71da-73f0-8651-896ec72d5be4` evidence directory. No production mutation,
county payload movement, external service dependency, WACO retest or statewide
completion is part of this slice. Rollback is a normal reviewed code revert; no
data deletion or compensating import is required.

## Protected integration evidence — 2026-09-09

PR #1581 passed all ten required checks and merged at
`d6b4b0aab2d264cde97e67109e0b347369d191da`. Normal two-parent integration
`4dcd40fce9ff53d1daa3a1f90d172d0155954b5f` has reviewed tree
`a487862845f2b2a27a78314b80549931e3a7ed48`. Against protected d6b, L changes
only its seven reserved paths. Incoming protected dependencies are not new L scope.

- Normal routing run83987, 14:04:38.1083349Z–14:04:55.6299470Z: 40 PASS,
  zero failures/skips, native exit0. Leaf `wal002l-protected-routing-20260909-1407`;
  TRX SHA256 `da29c8dd96eba4f67e0c3509cb725e3f4261a8ea33c156d047f8099c865f5c79`.
- Normal broader run62198, 14:05:36.8451168Z–14:06:06.3243106Z: 86 PASS,
  zero failures/skips, native exit0. Leaf `wal002l-protected-regression-20260909-1406`;
  TRX SHA256 `3323197c88ab7702bc7177b72da51cbb3863d2f0aaca35f2abc1100de1c39f43`.
  Its 86 include the 40 routing cases. Both normal builds ran; neither is live JWT proof.
- Both runs recorded nine unchanged source pins, including controller, routing
  test, Program, Unit.Tests project, central dependencies, registry, wave and
  inherited package/lock. Independent TRX/continuity review is CLEAR in
  `wal002l-protected-integration-independent-review-20260909.md`.
- Fresh Node20 query/wave run: 55 PASS, zero failures/skips after the normal
  frozen install (native0, package/lock unchanged). Existing Ajv date-time-format
  warnings remain; no date-format enforcement claim is made.
- Initial normal merge commit stopped on a missing tracked token-audit module in
  the sparse checkout. Materialized existing audit prerequisites and the complete
  configured scan scopes; no source/hook change. Second normal commit45122 exited0:
  UI ratchet 1538 <= 1580 and normal lint-staged/Prettier/.NET formatting passed.
  Sparse config-discovery ENOENT diagnostics were emitted but did not prevent the
  configured tasks; this is not warning-free output. Reviewed tree unchanged.

All earlier failed/passed receipts remain historical. This section proves bounded
integration and regression, not protected L delivery, actual K upload/promotion/
restart, G runtime acceptance or completion of parent #1485.

## Fresh canonical Brain proof after protected integration

# Proof Bundle — WO-WAL-002L

- Generated: 2026-09-09T14:11:46.837Z
- Work order: WO-WAL-002L

## Commands run
- `brain check` → PASS (✅ all checks passed)
- `wiki --check` → PASS (✅ wiki current (15 pages match canon))

## Negative tests
(record per slice — e.g. drift→fail→restore. See the slice ADR for evidence; `proof` runs positive checks.)

## Working tree
- changed (tracked) files: 2
- staged files at proof time: 0 (commit-race hazard if > 0 — WO-0011)

## Known risks (open drift)
- P0=0 P1=0 P2=2 P3=0

## Result
✅ PASS
