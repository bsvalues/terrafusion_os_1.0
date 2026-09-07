# TerraFusion Native Terminal Closeout Implementation Plan

> For agentic workers: use superpowers:subagent-driven-development for implementation and independent review.

**Goal:** Persist an independently usable TerraFusion product terminal receipt through TerraCanon.

**Architecture:** Extend the existing native maintenance CLI; pure contract/evidence validation in Canon,
bounded filesystem I/O in the CLI adapter. The reviewed WACO profile pins accepted evidence, and the
native record is deterministic and append-only. A separate WilliamOS plan consumes protected receipt bytes.

**Tech Stack:** Node built-ins, ESM, node:test, JSON Schema; no new dependencies.

**Spec:** `docs/brain/workorders/active/WO-TF-NATIVE-TERMINAL-CLOSEOUT-001.md`.

## Global Constraints

- Do not retest, rebuild, restart, redeploy, repin, or change the accepted product for bookkeeping.
- Accepted application SHA: `35e32462d9758473e3a193388cd50786dc63cc17` on OMEN.
- WO-103 stays COMPLETE; Wi-Fi is untouched; statewide and production completion remain false.
- Preserve all accepted evidence; new product state is additive and has no orchestrator identifiers.
- Independent local operation, exact reviewed policy, no network or arbitrary command execution.
- One builder owns this worktree after dispatch. Coordinator and reviewer do not edit it concurrently.

### Task 1: Native receipt contract, verified evidence adapter and CLI

Read the spec first. Its exact reservation is this task's write set except the final receipt/catalog,
which the coordinator issues through the tested CLI after review. Do not dispatch subagents.

**Interfaces:**

```js
// os-platform/core/canon/release-closeout.mjs: pure functions, no I/O
export function buildProductTerminalReceipt({ policy, policySha256, evidence }) {}
export function validateProductTerminalReceipt(receipt) {} // throws typed error on invalid input
// tools/canon/release-closeout.mjs: dependency-free local maintenance adapter
export async function runReleaseCloseout(argv) {} // returns { code, result }; entrypoints print result
```

`policy` is the checked-in profile object; `evidence` contains the already hash-verified verdict,
stage, supervisor, seal, package manifest and related records. Builders define a single documented
object structure for that argument. `validateProductTerminalReceipt` checks schema AND digest;
it never claims issuer authenticity. CLI profile selection is fixed to the shipped profile table.

- [ ] Add a behavior test to the real CLI before implementation:

```js
test('unavailable evidence refuses terminal record without creating store', () => {
  const result = spawnSync(process.execPath, ['tools/canon/canon.mjs', 'release', 'record',
    '--profile', 'waco-2026', '--evidence-root', missing, '--source-root', source,
    '--store', store, '--json'], { cwd: root, encoding: 'utf8', shell: false });
  assert.notEqual(result.status, 0);
  assert.equal(existsSync(store), false);
  assert.match(result.stdout + result.stderr, /EVIDENCE|RELEASE/);
});
```

- [ ] Run it before adding the command; capture the expected missing-command failure, then implement
  schema validation and the narrow CLI branch. No unrelated refactoring of existing commands.
- [ ] Add independent synthetic fixtures for valid complete acceptance. Exercise pure core and real
  filesystem adapter; no production fixture override or `trusted: true` flag. Test helpers stay in tests.
- [ ] Implement profile-pinned evidence reads and stream hashing. Profile paths are relative to two
  explicit roots; reject traversal/UNC/ADS/reparse points, duplicates, oversized JSON and special files.
  Only fixed profile evidence files are read; never follow arbitrary references from an input document.
- [ ] Derive all native receipt fields from matching evidence/profile and use existing canonicalize.
  Compare exact identities and retain every limitation. Native receipt is deterministic across retries.
- [ ] Persist complete flushed bytes via atomic no-replace publication; preserve conflicting existing
  bytes, accept identical validated retry, ensure concurrent calls cannot expose partial success.
- [ ] Wire both existing Canon CLI entrypoints. For the new command call the adapter in-process;
  do not pass user paths into the existing Windows shell-based delegate. Existing commands stay unchanged.
- [ ] Document verify/record/show, historical observation semantics, OS maintenance access authority,
  integrity-versus-authenticity, and protected-source consumer trust. No new UI/server endpoints.
- [ ] Run focused tests and existing Canon baseline tests using the bundled Node executable:

```powershell
& C:/Users/bsval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe --test os-platform/core/tests/canon-release-closeout.test.mjs tools/bin/tests/canon-release-closeout.test.mjs os-platform/core/tests/canon-evidence.test.mjs os-platform/core/tests/tf-canon.test.mjs
git diff --check
```

- [ ] Run Brain review-diff and commit-plan for this exact Work Order, record any existing unrelated
  Brain warnings without relaxing gates. Commit only named reservation files; no package installation.
- [ ] Return commit, RED/GREEN evidence, changed paths, scope concerns and report file. Parent performs
  independent task/whole-branch review before issuance and protected delivery.

### Task 2: Record accepted native state and protect exact consumer artifact

Coordinator executes this task only after Task 1 independent review is clean; no second builder.

- [ ] Run `release verify` against existing OMEN evidence and accepted detached source, with all external
  orchestrator/provider environment absent. Verification reads existing bytes only.
- [ ] Run `release record` into a new dedicated native receipt store, never the accepted evidence tree.
  Run `release show` and an identical record retry; require exact receiptId/digest/bytes preservation.
- [ ] Admit the generated native receipt at `os-platform/core/canon/release-closeout/receipts/waco-2026.product-terminal.json`
  and catalog at `os-platform/core/canon/release-closeout/catalog.json` with fixed schemaVersion, product,
  release ID, native receipt relative path/raw SHA-256 and policy path/raw SHA-256. No absolute paths or
  caller trust booleans. Write the proof record with exact test/issuance identity and limits.
- [ ] Independent assurance reviews the generated artifact and catalog against source evidence and
  implementation. Follow normal protected PR/check/merge lifecycle; verify exact merged artifacts.
- [ ] Deliver stable schema, protected commit/path/hash identities to the separate WilliamOS consumer.
  Its own isolated plan/PR handles atomic authenticated external-product settlement, not this producer.

## Preflight coverage

Task 1 implements all native command, receipt, safety and isolation requirements. Task 2 performs
actual receipt issuance and protected provenance without changing accepted runtime. Consumer authority
is a separate repository task gated on the stable producer, not an unimplemented producer dependency.

## Task2 bounded CI correction

Task1's no-issued-outputs boundary is historical: Task2 issuance was committed at
`ee072025c68d25f7fa596b094e72bf5ad5833c73`. CI run `34165522326`, job `101875831926`, rejected the
new root `operations` via `repo-shape-guard`. The revised reservation moves only that committed mirror
to the Canon receipts path above, with exact raw SHA-256
`20c517e6dbd9b3d9c6dffffa007c6f8951d697168f6e063141c0c545ce70c8ca`, and updates catalog/documentation.
Removal of the old mirror is authorized only as part of this byte-exact move. Native store, accepted
runtime/evidence, producer code, schema, policy, guard and allowlists remain unchanged. No product
retest is required. Validate catalog bindings and diffs, commit only the revised reservation, then
run the existing guard on corrected committed HEAD because it reads `git ls-tree HEAD`. The parent
retains push, PR and protected delivery ownership.

## Bounded source-review correction

At `5bacb7632d14d4a44fa802755708b50c8e57f153`, review confirmed two P2 defects: JSON import attributes
prevented module loading on the declared minimum Node18.0.0, and the REPL's empty raw argv discarded
release arguments. The narrow correction loads the same fixed schema with `createRequire` and preserves
raw tokens only for `canon release` in the existing REPL. Duplicate boolean flags must remain visible
to the strict release parser; `.json` mode must not introduce a duplicate of an explicit flag.

Write meaningful failing minimum-runtime and real interactive-REPL tests before changing source. Prove
verify/record/show/dry-run, empty-argv fallback, and duplicate/unknown/missing rejection. Run the original
72 tests plus focused regressions under bundled Node24. Use the parent's isolated checksum-verified
Node18.0.0 for actual parse/load and CLI/REPL child execution; do not confuse modern test-runner flags
with product compatibility. Policy/schema/receipt/catalog bytes and package engines remain unchanged.
The revised WO grants `tools/bin/commands/repl.mjs` only for this new release path. Commit exact paths
and return to independent review; parent owns all push, PR and protected delivery operations.
