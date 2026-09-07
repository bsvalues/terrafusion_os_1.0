# Native product terminal closeout

TerraCanon records historical WACO acceptance independently of an orchestrator, provider, network,
key, or active agent session. This maintenance command does not run the product or establish live
health. It records only `WACO_2026_TERRAFUSION_RELEASE_READY` for the pinned OMEN candidate.

## Stable producer contract

The strict, closed JSON Schema is
`os-platform/core/canon/product-terminal-receipt.schema.json`:
`terrafusion.product-terminal-receipt.v1`. Unknown fields are rejected at every object level.
`productId=terrafusion`, `repository=bsvalues/terrafusion_os_1.0`, `releaseId=waco-2026`,
`deploymentId=omen-waco-2026`, `machine=OMEN`. No orchestrator bindings belong in this record.

`acceptedAt` is the original verdict's day-precision string **`2026-09-07`**. There is no finer
final-acceptance time in that verdict. Supervisor completion and local issuance time must not be
substituted. The native record contains no replay clock.

The digest is lower-case SHA-256 of UTF-8 existing Canon `canonicalize(content)`, where `content`
is every receipt field except `receiptId` and `contentSha256`. Arrays retain their order. The ID is
`tf-product-terminal:<contentSha256>`. The complete file is `canonicalize(receipt)` plus one LF.
All timestamps, authority, evidence, identity and limitations participate in the digest.
`validateProductTerminalReceipt(receipt)` returns the validated receipt, throwing an error with a
`RELEASE_` code on invalid schema or digest. It makes no issuer-authenticity claim.

The record is stored under the fixed name `waco-2026.product-terminal.json`, keyed by the fixed
product/release/deployment terminal identity. A different digest never creates a second record for
that identity. Identical validated bytes are an idempotent retry. Conflicting or corrupt existing
bytes are preserved and rejected.

## Maintenance commands

Both entrypoints invoke the same adapter in-process, without shell delegation:

```powershell
node tools/canon/canon.mjs release verify --profile waco-2026 --evidence-root C:/Users/bsval/waco-omen-runtime --source-root C:/Users/bsval/.codex-worktrees/waco-release-final --json
node tools/bin/tf.mjs canon release record --profile waco-2026 --evidence-root C:/Users/bsval/waco-omen-runtime --source-root C:/Users/bsval/.codex-worktrees/waco-release-final --store C:/Users/bsval/tf-native-receipts --json
node tools/bin/tf.mjs canon release show --profile waco-2026 --store C:/Users/bsval/tf-native-receipts --json
```

Use `--dry` with any command to prohibit persistence. `verify` never writes; `show` validates stored
bytes without claiming the historical evidence is currently available or the product is healthy.
`record --dry` performs evidence verification without creating a store or receipt. Options are exact,
single-use and command-specific. Unknown profiles/options, duplicates and missing values fail closed.
`runReleaseCloseout(argv)` returns `{ code, result }`; entrypoints print the result as JSON.

`--evidence-root` is the runtime root, containing both `evidence/` and `releases/`, because the accepted
archive is in `releases/`. `--source-root` is the frozen accepted checkout, containing the original
`frontend/apps/os-shell/waco-conference-package/launch-data/washington` package. The reviewed profile
at `os-platform/core/canon/release-closeout/waco-2026.policy.json` is the fixed read inventory.
Historical absolute references in the immutable verdict are compared to exact `legacyPath` strings
in that policy. They never select filesystem inputs. Only each pin's confined `root` and relative
`path` selects an input; caller-selected policy files and arbitrary document references are forbidden.

## Evidence and authority

The pure builder accepts `{ policy, policySha256, evidence }`. `policySha256` hashes the exact installed
policy bytes. `evidence` maps every profile file ID to `{ sha256, bytes, value }`: lower-case raw
SHA-256, measured byte count, and JSON object or UTF-8 text; streamed binary values are null. The
adapter hashes and parses the same opened bytes. No `trusted` flag or production fixture override
exists. Synthetic tests install isolated copies of the same modules with synthetic profile bytes.

The profile binds the verdict, independent execution/seal reviews, supervisor, stage, build records,
actual intervening restart, package source, copied seal inventory and archive. JSON/text is bounded;
large binary hashes stream. The historical seal remains pending-F and its later independently pinned
addendum supplies the seal PASS. The receipt retains all limitations: 50 county-derived conference
sales, zero computable ratios, API-only Sales Intelligence, scoped Canon Ping/editor, UNKNOWN_DENY,
no new physical disconnect, legitimate local bookkeeping, moderate warnings and image-only recovery
artifacts. The original package classification is
`COUNTY_DERIVED_CONFERENCE_SAFE_BOUNDED_READ_ONLY_NOT_DOR_CERTIFIED`. Statewide completion and
production deployment remain false. An archive is neither tested recovery nor a database backup.

Authority comes from the locally installed reviewed maintenance policy and OS-controlled filesystem
access. Operators must protect that installation, evidence roots and receipt store against concurrent
hostile filesystem modification. No new key, remote grant, credential or owner approval is introduced.
Symlinks/junctions, unsafe paths, special files and overlapping output roots fail closed. Publication
flushes a unique temporary file and atomically hard-links it to the fixed final name without replacing
anything. Filesystems without atomic hard links fail closed. A crash can leave an invocation-owned
temporary file; subsequent calls ignore it and never delete another invocation's temporary files.

A digest proves integrity, **not authenticity**. External consumers must independently authenticate
the producer's protected-history provenance, exact receipt/catalog paths and raw hashes, then validate
schema and content digest. They must also validate their own authority before settling their own
state. Caller-provided issuer flags or hashes alone are insufficient. Receipt/catalog issuance and
protected delivery are the coordinator's Task2; this implementation does not issue those artifacts.
