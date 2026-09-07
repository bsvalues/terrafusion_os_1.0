# Native terminal closeout — Task1 implementation proof

Task1 implementation and synthetic verification complete on 2026-09-07. Parent independent assurance,
Task2 actual receipt/catalog issuance and protected delivery remain outstanding. This file is not
product acceptance or an issued terminal receipt.

Base application: `35e32462d9758473e3a193388cd50786dc63cc17`.
Parent docs commit: `3d331814915e12ee2ec6ace40b6e06d0947bd1bb`.
Exclusive worktree: `C:/Users/bsval/tf-native-terminal-closeout`, branch
`codex/tf-native-terminal-closeout`. Prewrite status was clean. No subagents dispatched.

## Verification

Bundled executable: `C:/Users/bsval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`
(Node v24.19.0).

```powershell
& C:/Users/bsval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe --test os-platform/core/tests/canon-release-closeout.test.mjs tools/bin/tests/canon-release-closeout.test.mjs os-platform/core/tests/canon-evidence.test.mjs os-platform/core/tests/tf-canon.test.mjs
git diff --check
```

Final result: **72 tests, 72 PASS, 0 failures/skips**; 49 new tests plus the existing 23 Canon tests.
`git diff --check` passes.

Required initial behavior RED: before adding the command, the real CLI test failed at the
`/EVIDENCE|RELEASE/` assertion with `Unknown command: release`; exit 1, no receipt store created.
The same test passes after implementation. Core and filesystem fixture tests were also added before
their modules; their initial missing-module/adapter results are setup-stage RED, not runtime proof.

Later meaningful RED/GREEN regressions caught malformed evidence escaping as untyped `TypeError`,
Windows inode precision loss with number-valued stats, and a concurrent reader rejecting ctime
changes caused by unlinking a temporary hard link. Corrections normalize contract errors to
`RELEASE_INVALID`, retain file IDs with bigint stats, and check content size/mtime/opened identity/hash
without treating link-count ctime changes as content mutation.

Coverage includes independent synthetic acceptance, candidate/machine/county mismatches, lost limits,
missing/altered evidence, pending/failed review, malformed/failed acceptance, two journeys, four exact
intervening restarts, restoration, digest/schema tampering, fixed profile selection, exact legacy
mapping, bounded reads, binary streaming, traversal/UNC/ADS, junctions, special files, duplicate
references including hard links, root overlap, no-shell literal metacharacters, dry-run, absent
provider/orchestrator environment, identical/concurrent/conflicting/corrupt records, and actual child
process termination at both sides of the atomic publication syscall. Fault injection lives only in
tests; product code exposes no override or trust flag. Crash retries preserve foreign orphan temp
files and complete byte identity. All test stores were invocation-owned temporary fixtures.

## Profile evidence

The installed profile has 69 fixed inputs: verdict, its nine references, restart/two journey outputs,
archive report, eight accepted source inputs, and 47 sealed copies. The immutable verdict's absolute
paths are exact string comparisons to the policy's legacy mappings. Reads use only the fixed relative
inventory under `C:/Users/bsval/waco-omen-runtime` and
`C:/Users/bsval/.codex-worktrees/waco-release-final`.

A read-only profile compatibility check rehashed JSON/text inputs and successfully built the
in-memory contract against the actual historical record shapes: day `2026-09-07`, 69 pins, all eight
original limitations. Binary pins were taken from existing immutable seal/verdict records and their
existing lengths; this check did not rehash the 2,982,295,552-byte archive, issue a record, or replace
Task2's complete verified read. Task2 must run the actual `release verify` after independent review.

The original county-derived classification, Benton identity, 50 records/zero ratios, six images,
four restart identities, three retained rollback containers and pending-F/subsequent-addendum
semantics are preserved. The record has no issuance clock or orchestrator identifiers. No runtime
test, container operation, Wi-Fi change, build, deployment, acceptance-record edit or package install
was performed. The two Task2 output files remain absent/unmodified.

## Brain and delivery concerns

`brain review-diff --workorder WO-TF-NATIVE-TERMINAL-CLOSEOUT-001`: protected paths PASS, hardcoded
ports PASS, all changed files within the exact WO scope. Overall **BLOCK** remains from the existing
**21 write-lane violations** in `tools/registry/terrapilot.tools.json`. Both that manifest and
`scripts/spec-gates/write-lanes.mjs` have zero diff against the accepted base. The failures include
existing audit/clerk/treasury suite declarations; no gate or protected configuration was relaxed.

The first `brain commit-plan` hit a missing `suite` field in this WO's embedded metadata. Added
`task` and `suite: OS Core` only, preserving every reservation, prohibition, risk and proof entry.
The corrected command includes the exact Task1 files and excludes zero files. This is metadata
compatibility, not new product authority.

The pre-existing packageManager hook drift #1562 is recorded by the parent's SDD ledger. The explicitly
authorized command-scoped `git -c core.hooksPath=NUL` is used solely for the local path-limited commit.
No global/repository hook change, push, PR operation or branch-protection bypass is performed.

The receipt digest is integrity, not a signature. The installed policy and OS-controlled roots are
the local authority boundary; external consumers require independently verified protected-history
provenance. Atomic no-replace publication requires filesystem hard-link support and fails closed
without it. Concurrent hostile directory mutation by an actor with OS write authority is outside
that trust boundary. A crash may retain its own temporary file; subsequent invocations do not clean
other invocations' files. No power-loss/full-machine recovery guarantee is claimed.
