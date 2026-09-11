# Proof Bundle — WO-WAL-007B

- Generated: 2026-09-09T15:34:21.649Z
- Work order: WO-WAL-007B

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

## Later generated snapshot — retained separately from the original

# Proof Bundle — WO-WAL-007B

- Generated: 2026-09-09T18:58:47.004Z
- Work order: WO-WAL-007B

## Commands run
- `brain check` → PASS (✅ all checks passed)
- `wiki --check` → PASS (✅ wiki current (15 pages match canon))

## Negative tests
(record per slice — e.g. drift→fail→restore. See the slice ADR for evidence; `proof` runs positive checks.)

## Working tree
- changed (tracked) files: 1
- staged files at proof time: 0 (commit-race hazard if > 0 — WO-0011)

## Known risks (open drift)
- P0=0 P1=0 P2=2 P3=0

## Result
✅ PASS

## Protected-main integration and actual validation — 2026-09-09

This records bounded component and normal repository-gate evidence, not an API,
HTTP, county-runtime, production or parent-mission acceptance.

- Configured-port behavioral RED: compiled 19 tests, 8 passed, 11 failed, 0
  skipped; native exit 1 at 15:28:10.5414061Z. The earlier zero-test CS1674 setup
  failure is separate, not this behavioral RED.
- Configured-port GREEN: the same 19 tests passed, 0 failed/skipped; native exit
  0 at 15:31:41.0266700Z. All nine recorded input pins remained unchanged.
- Reviewed integration with protected main
  `b2c50730dc0605ba0abaef07694ab4a2048fd77e`: normal Node query/wave suite
  57 PASS and normal WITH-build Unit selection 61 PASS (B19 + C42), no skips.
  Native exits were both 0; final runner receipt was sealed at
  18:31:34.5037302Z with 14 input pins and the merge index continuous.
- Normal merge commit
  `c8f3a5b5bb483e12179b690cc1d5bca36a2299e8` completed with native exit 0
  at 18:57:43.4681943Z. Its tree
  `82ce9eee4ffe49919696cbfc63a44bb30505ad30` equals the tested merge index.
  Normal hooks ran; sparse-checkout package-discovery diagnostics remain in
  the log. This is not a warning-free toolchain claim.
- Normal proof initially failed on 15 stale generated wiki pages at 18:58Z.
  That failed proof is archived. The unchanged normal wiki generator then
  exited 0 and normal proof exited 0 at 18:58:51.6015615Z. The generated PASS
  snapshot above predates this evidence append; it does not verify future edits.

### Durable external evidence identities

Evidence root:
`C:/Users/bsval/.codex/visualizations/2026/09/06/01a07732-71da-73f0-8651-896ec72d5be4`.

| Artifact under that root | SHA-256 |
| --- | --- |
| `wal007b-port-red-compiled-ed09aa1ad5aa437e83de8474e4a2ea07/tests.trx` | `a59342784414416846f5e96c9b4058c63eef47d70bdf904cae1bcde7522463b0` |
| `wal007b-port-green-e380d1d198e04f38a72fce8843411be9/tests.trx` | `9c04b6d94c6ed8bf49e6e38f706ddff8920b6ede182167044875f7f7a1b4bfd7` |
| `wal007b-protected-c-combined-556df2d8de954cb9807b36a45d8b64be/tests.trx` | `2171f4a96b2c98a51cd84e7dc7f8932270ce6aa86ad9c1006f72d4e3d71206dc` |
| `wal007b-protected-c-normal-merge-20260909.log` | `7b8ba9ff91eda2735cef050d103175173f078b87715c11c575c4a6d5a444c495` |
| `wal007b-integration-generated-proof-pass-20260909.md` | `72a293afbac4c0ce92781b258b3ca73e1e48026f7c9c8a46f50a3d281087273b` |

The integration's independent source/receipt review is recorded in
`wal007b-protected-c-integration-independent-review-20260909.md`.
The original eight-case evidence recorded in the Work Order remains historical evidence of its exact
source, not a replacement for the later 19-case suite. B's six-path scope remains
unchanged. Protected delivery and consumers' fresh effective-configuration,
build and actual runtime qualification remain pending at this append.
