# Native terminal closeout — Task1 implementation proof

Task1 implementation, independent source assurance and Task2 native issuance completed on 2026-09-07.
Final artifact assurance and protected delivery remain outstanding at this commit. This proof records
maintenance closeout, not a new product test or live deployment acceptance.

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
Task2's complete verified read. This is historical Task1 evidence; the coordinator subsequently ran
the complete `release verify` after independent review, as recorded below.

The original county-derived classification, Benton identity, 50 records/zero ratios, six images,
four restart identities, three retained rollback containers and pending-F/subsequent-addendum
semantics are preserved. The record has no issuance clock or orchestrator identifiers. No runtime
test, container operation, Wi-Fi change, build, deployment, acceptance-record edit or package install
was performed during Task1. At that historical Task1 handoff the two Task2 output files were absent;
Task2 subsequently issued and committed the receipt mirror and catalog, as recorded below.

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

## Coordinator verification and native issuance

Task1 reviewed implementation: `570aa299e19a4814b4c8bd485fb6b55a7cdffdb7`.
Coordinator reran the four reported suites on that exact clean head: **72/72 PASS**, zero failures,
zero skips. Independent Kepler review returned spec and quality PASS, no findings. Its external
report SHA-256 is `b8bf698413c7fdeffeb40cf631f659d3071ee09bc2e7bbbb38767cdca7102371`.
The reviewer separately rehashed 68 non-archive inputs, checked all 69 lengths, 47 sealed-copy
mappings and eight selected-source mappings against the immutable historical evidence.

The coordinator then used the real native command with a child environment containing only
`SystemRoot`, `TEMP`, and `TMP`. No provider keys, orchestration environment, agent session, HERMES
campaign/process identity, or service connection was supplied. The installed Node binary was invoked
directly; there was no package-manager wrapper. Exact commands and observed outcomes:

```text
tf canon release verify --profile waco-2026 --evidence-root C:/Users/bsval/waco-omen-runtime --source-root C:/Users/bsval/.codex-worktrees/waco-release-final --json
  exit=0 ok=true historical=true persistence=NOT_WRITTEN inputs=69
tf canon release record --profile waco-2026 --evidence-root C:/Users/bsval/waco-omen-runtime --source-root C:/Users/bsval/.codex-worktrees/waco-release-final --store C:/Users/bsval/tf-native-receipts --json
  exit=0 ok=true historical=true persistence=CREATED
node tools/canon/canon.mjs release show --profile waco-2026 --store C:/Users/bsval/tf-native-receipts --json
  exit=0 ok=true historical=true read-only
tf canon release record [identical arguments]
  exit=0 ok=true historical=true persistence=IDENTICAL
```

Full native verification included the streamed 2,982,295,552-byte image archive, with expected
SHA-256 `4e8c71df030c673d5cad147c4c94ed0c618fa808fe8614f0401b071f23a44ee1`.
No input was skipped. The record/show/retry sequence compared the complete stored bytes and mtime;
both remained identical after initial creation. This proves metadata issuance and retry semantics,
not a fresh application/network-loss rehearsal.

| Native artifact | Exact identity |
| --- | --- |
| Terminal state | `WACO_2026_TERRAFUSION_RELEASE_READY` |
| Accepted application | `35e32462d9758473e3a193388cd50786dc63cc17` |
| Native receipt ID | `tf-product-terminal:86f349a305c3aa1000f0f1756cfca6f36cd44b1ca712813ebe8070339fed3c56` |
| Receipt raw file SHA-256 | `20c517e6dbd9b3d9c6dffffa007c6f8951d697168f6e063141c0c545ce70c8ca` |
| Receipt length | 23,373 bytes |
| Profile raw SHA-256 | `de0ab7b5432534996c533abc00c8d1b6db5998bf591b0fe4aa94ceb1cf88aa35` |
| Original issuance catalog raw SHA-256 (historical, before mirror relocation) | `5a6b8f8b4b2337670146a36beefe246b5346d6ef9698ad25fb6f0eca2d6edda2` |

Local native state: `C:/Users/bsval/tf-native-receipts/waco-2026.product-terminal.json`.
The checked-in receipt mirror has the exact same bytes/hash as that native state. The catalog binds
receipt and policy as data for independent consumers; it contains no WilliamOS identifiers.

All original evidence and the accepted runtime remain unchanged. No build, restart, deploy, Wi-Fi
operation, county-data mutation, or application acceptance test was performed by this issuance.
WO-103 remains complete. Statewide/production completion, restored archive, tested rollback and
database backup remain false. All eight original limitations remain in the receipt.

Protected delivery and final artifact review are required before an external consumer can claim
protected-source provenance. WilliamOS must separately authenticate its own completion operation and
atomically settle its own admitted work. Issuing this native record does not close any external work.

## Task2 CI mirror relocation

Parent delegated the clean worktree at `ee072025c68d25f7fa596b094e72bf5ad5833c73` for the exact
repo-shape failure in CI run `34165522326`, job `101875831926`. Before edits, the unchanged guard
reproduced exit 1: 89 visible / 140 total root entries, 88 allowed, one violation `operations`.
This is a root-layout failure introduced by the committed mirror, not Gate8/9 or the baseline
tool-manifest findings. No guard, allowlist, protected-check or branch-protection change is authorized.

The committed mirror moved byte-exactly from
`operations/evidence/receipts/waco-2026.product-terminal.json` to
`os-platform/core/canon/release-closeout/receipts/waco-2026.product-terminal.json`.
Its 23,373 bytes and raw SHA-256
`20c517e6dbd9b3d9c6dffffa007c6f8951d697168f6e063141c0c545ce70c8ca` are preserved. The catalog changes
only its receipt path; its receipt/profile hashes and all native identities remain unchanged.
Corrected catalog raw SHA-256:
`64398327023ba7d2fce0c886d51c88daf37459d4337d4e3476f340ba064d1e87`.
Task1 absent-output prose above is explicitly historical. Producer source, policy and schema are
unchanged from the delegated base. The native store and accepted runtime/evidence are untouched.

The narrow checks PASS: the new raw mirror equals the old committed blob, its existing schema/content
digest validates, and catalog product/repository/release/deployment/terminal identity and receipt/profile
hashes bind exactly. Nine producer/schema/policy/guard/allowlist files were also compared byte-for-byte
with the delegated base and are unchanged. Diff checks pass; the revised exact reservation is checked
before commit.
The existing guard must then be run against the corrected committed HEAD; an unstaged filesystem
move cannot prove this guard passes. The full committed HEAD, guard outcome and corrected catalog
raw SHA-256 are reported at handoff. No product tests, issuance retry, runtime operations, push or PR
mutation are part of this correction.

Local execution note: initial guard attempts could not resolve Git in their child shell. A short
command-local PATH containing installed Git, bundled Node and Windows directories resolved that
launcher issue before the actual `operations` violation was reproduced. No persistent environment
or script change was made.
