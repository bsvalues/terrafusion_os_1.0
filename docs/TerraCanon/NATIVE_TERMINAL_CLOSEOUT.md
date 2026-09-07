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
state. Caller-provided issuer flags or hashes alone are insufficient.

## Issued WACO record and protected-history catalog

The native command issued the historical WACO record on OMEN on 2026-09-07, then verified a read and
identical retry without altering the record. Its mirror is
`os-platform/core/canon/release-closeout/receipts/waco-2026.product-terminal.json`. Its raw SHA-256 is
`20c517e6dbd9b3d9c6dffffa007c6f8951d697168f6e063141c0c545ce70c8ca` (23,373 bytes), and its semantic
digest is `86f349a305c3aa1000f0f1756cfca6f36cd44b1ca712813ebe8070339fed3c56`.

`os-platform/core/canon/release-closeout/catalog.json` publishes the data-only
`terrafusion.product-terminal-catalog.v1` contract: product/repository and a `releases` array, each
entry binding releaseId, terminalState, releaseSha, deploymentId, and exact receipt/profile paths and
raw SHA-256 values. It does not grant trust to itself or supply its own commit identity. A consumer
must establish the protected commit independently and read every blob from that same immutable
commit. Do not trim blob bytes, normalize line endings, execute foreign code, or accept caller-picked
paths or trust flags. The native local store remains independently useful without any consumer.

The catalog/receipt mirror gains protected-history provenance only after this exact change passes
review and merges through the protected PR boundary. Maintenance code history and accepted application
history are distinct: this addition does not replace accepted application SHA
`35e32462d9758473e3a193388cd50786dc63cc17` or reopen WO-103.

The Task2 CI correction relocated only the committed mirror from the former
`operations/evidence/receipts/waco-2026.product-terminal.json` path into Canon's existing repository
root. The receipt bytes, native store, schema, policy and acceptance are unchanged. The catalog's
receipt path and therefore its raw hash change; consumers must bind the corrected catalog and mirror
from the same protected commit. The earlier Task1 statement that issuance outputs were absent describes
the Task1 handoff only; Task2 subsequently issued and committed them.
