# WO-TF-NATIVE-TERMINAL-CLOSEOUT-001

Status: EXECUTING. Risk: R3 bounded local maintenance/evidence persistence.

## Authority and objective

Direct owner directive, 2026-09-07: establish TerraFusion-native terminal closeout first;
WilliamOS separately consumes the product receipt and closes its own work. Standing delivery
mechanics follow OWNER-TF-STANDING-OPERATOR-AUTHORITY. This is not statewide mission closeout.

TerraFusion knows whether TerraFusion is complete. WilliamOS knows whether its work around
TerraFusion is complete. Neither fact grants the other system authority over its state.

Resolve TERRAFUSION_NATIVE_TERMINAL_CLOSEOUT_GAP through the existing TerraCanon local
maintenance CLI. Persist a durable, machine-readable product receipt independently of any
WilliamOS/HERMES campaign, network service, provider, or active agent session.

## Frozen acceptance boundary

- Accepted application SHA: `35e32462d9758473e3a193388cd50786dc63cc17` on OMEN.
- Terminal product state: `WACO_2026_TERRAFUSION_RELEASE_READY`.
- Do not retest, rebuild, restart, redeploy, repin, or change the accepted product for bookkeeping.
- Verify existing evidence bytes and their relationships, not a new browser or physical-offline run.
- Record historical acceptance, with its original observation time; do not claim new live health.
- WO-103 stays COMPLETE; Wi-Fi is untouched; statewide and production completion remain false.
- Preserve the coordinator verdict and every upstream receipt byte-for-byte. New native state is additive.
- Do not put Outcome 76, WO-101, campaign IDs, or orchestrator bindings in the native receipt.

## Native contract

Expose `tf canon release verify|record|show --profile waco-2026` and the corresponding direct
`node tools/canon/canon.mjs release ...` maintenance entrypoint. Use Node built-ins only.
Verification/record accept `--evidence-root` (existing evidence tree) and `--source-root`
(accepted detached checkout); record/show accept `--store` (separate native receipt directory).
`--dry` must never persist. Unknown/duplicate/missing options fail closed. No shell passthrough.

The CLI selects a checked-in, reviewed profile by exact ID, never a caller-selected policy file.
The profile binds exact product/repository, terminal key, scope, candidate, machine, county identity,
county package classification/counts/hashes, independent assurance references, deployment/image
identity, actual restart evidence, rollback/archive identity and limitations. It pins the accepted
coordinator verdict and independent source artifacts by SHA-256; input hashes do not grant authority.

Persist `terrafusion.product-terminal-receipt.v1` containing:

- `schemaVersion`, `productId: terrafusion`, `repository: bsvalues/terrafusion_os_1.0`;
- `terminalState`, `releaseId: waco-2026`, `releaseSha`, `deploymentId: omen-waco-2026`, `machine`;
- `authority` with `surface: terracanon`, `mode: local-maintenance`, profile ID and profile SHA-256;
- `acceptedAt` from the accepted evidence, not the clock at replay;
- `countyPackage`, `deployment`, `assurance`, `recovery`, `acceptanceEvidence`, `limitations`;
- `statewideLaunchComplete: false`, `productionDeployed: false`;
- `receiptId` and `contentSha256`, deterministically bound to every semantic field.

Use existing Canon canonical JSON hashing, but hash ALL new receipt content except its own digest
and derived receiptId. Do not reuse a sealing exclusion that leaves timestamps or other semantic
fields unauthenticated. Reject unknown fields in the receipt contract.

The receipt is a native product record, not a trace-store replacement or a new Brain queue.
Persistence is atomic, create-once/idempotent: same accepted content returns the same record;
conflicting content or corrupted existing state fails, never overwrites. Publish a fully flushed
temporary file with an atomic no-replace operation; cleanup only invocation-owned temporary files.
Reject path traversal, absolute/UNC evidence entries, NTFS alternate streams, symlinks/junctions,
duplicate references, special files, and output inside accepted evidence/source boundaries.
Bound JSON input sizes; stream the large archive hash. No arbitrary commands or network requests.

Authority is the locally installed, reviewed TerraFusion maintenance policy and OS-controlled
filesystem access. A receipt hash is integrity, NOT a signature. External consumers must establish
provenance independently, for example by reading the exact receipt/catalog bytes from verified
TerraFusion protected history. Never trust a caller-supplied issuer flag or receipt hash alone.
No new signing key, secret, remote grant or owner approval is needed or invented.

## Evidence semantics

Read the pinned accepted verdict at `C:/Users/bsval/waco-omen-runtime/evidence/WACO_RELEASE_READY_35E32462.json`
and the stage/supervisor/seal/F/build/archive references it records. The verdict is an input, not
sufficient proof by itself. Match candidate/machine across JSON records, require supervisor PASS,
exactly two successful journeys, a real intervening restart for all four application containers,
restoration true, null failure and no cleanup errors. The immutable pending-F seal remains pending
inside its original file; the separately pinned subsequent independent seal review completes it.
Bind package bytes from the accepted source checkout, their original county identity and truthful
`COUNTY_DERIVED_CONFERENCE_SAFE_BOUNDED_READ_ONLY_NOT_DOR_CERTIFIED` classification, 50 sales,
zero computable ratios. Bind the six image identities, four restart identities and retained rollback
identities; image export is not a tested restore or a database backup.

The policy may record acceptance decisions after independent review of the exact immutable
evidence. It must not elevate `UNKNOWN_DENY`, API-only Sales Intelligence, Canon Ping-only scope,
moderate dependency warnings, or any retained limitation into a broader claim.

## Exact reservation

Only these paths may change in this Work Order:

```json
{
  "id": "WO-TF-NATIVE-TERMINAL-CLOSEOUT-001",
  "task": "Implement native TerraCanon historical product terminal closeout",
  "suite": "OS Core",
  "risk": "R3",
  "allowed_files": [
    "os-platform/core/canon/release-closeout.mjs",
    "os-platform/core/canon/product-terminal-receipt.schema.json",
    "os-platform/core/canon/release-closeout/waco-2026.policy.json",
    "os-platform/core/canon/release-closeout/catalog.json",
    "os-platform/core/tests/canon-release-closeout.test.mjs",
    "tools/canon/release-closeout.mjs",
    "tools/canon/canon.mjs",
    "tools/bin/commands/canon.mjs",
    "tools/bin/commands/repl.mjs",
    "tools/bin/tests/canon-release-closeout.test.mjs",
    "docs/TerraCanon/NATIVE_TERMINAL_CLOSEOUT.md",
    "docs/brain/workorders/active/WO-TF-NATIVE-TERMINAL-CLOSEOUT-001.md",
    "docs/brain/evidence/WO-TF-NATIVE-TERMINAL-CLOSEOUT-001-proof.md",
    "docs/superpowers/plans/2026-09-07-tf-native-terminal-closeout.md",
    "operations/evidence/receipts/waco-2026.product-terminal.json",
    "os-platform/core/canon/release-closeout/receipts/waco-2026.product-terminal.json"
  ],
  "forbidden_patterns": ["backend/**", "frontend/**", ".github/**", "os-platform/core/pilot/**", "package.json", "pnpm-lock.yaml"],
  "required_proof": ["node --test os-platform/core/tests/canon-release-closeout.test.mjs tools/bin/tests/canon-release-closeout.test.mjs", "node --test os-platform/core/tests/canon-evidence.test.mjs os-platform/core/tests/tf-canon.test.mjs", "git diff --check"]
}
```

Contract reservation: `terrafusion.product-terminal-receipt.v1` producer and `tf.canon.release`.
Environment: isolated `C:/Users/bsval/tf-native-terminal-closeout`; accepted OMEN sources/evidence
read-only; a NEW local native receipt store may be created. No live application mutation.
The independently coordinated WilliamOS consumer has no write reservation in this repository.

Task2 CI correction at base `ee072025c68d25f7fa596b094e72bf5ad5833c73`: the old
`operations/evidence/receipts/waco-2026.product-terminal.json` reservation is removal-only for a
byte-exact relocation to `os-platform/core/canon/release-closeout/receipts/waco-2026.product-terminal.json`.
The corrected catalog references the new path. This bounded correction may update only those two
mirror paths, the catalog, and the native documentation/plan/proof/this WO listed above. It must not
change native source, policy, schema, the native store, accepted runtime/evidence, guard or allowlists.
Validation is the existing repo-shape guard on corrected committed HEAD plus narrow catalog binding
and diff checks; no product retest. No push or PR mutation is delegated. Earlier Task1 absent-output
statements are historical and do not describe the subsequently issued Task2 artifacts.

Source-review correction at base `5bacb7632d14d4a44fa802755708b50c8e57f153`: fix the two confirmed P2s
in the native schema loader and Canon REPL argument forwarding. `tools/bin/commands/repl.mjs` is added
only for raw-token forwarding on `canon release`; other command behavior stays unchanged. This phase
may change the existing core/Canon command, focused test, native docs/plan/proof/WO paths. It may not
change policy, schema, receipt, catalog, backend/frontend/CI, dependencies or package engines. Preserve
the native store and accepted runtime/evidence. Require meaningful RED before each fix, the full
72-test baseline plus focused regressions on bundled Node24, and actual Node18.0.0 parse/load/CLI proof
using the parent's isolated verified executable. No project dependency install, global runtime change,
push or PR mutation; return the exact commit and digests for independent review.

## Acceptance and delivery

TDD tests prove missing/altered evidence, cross-county/SHA mismatch, failed or incomplete acceptance,
restart mismatch, unsupported profile, path escape, corrupt existing record, dry-run, atomic
concurrency/idempotency and absent orchestrator/provider environment behavior. Independent assurance
reviews source and exact emitted receipt. Required protected-main checks remain enforced.
Native receipt/catalog can be committed as exact reviewed artifacts; consumer activation waits for
verified protected merge. Rollback is a normal source revert; no automatic deletion of terminal records.

WilliamOS consumer work is separate: authenticate its own caller, resolve its own exact admitted
project/outcome/WO and authority, verify TerraFusion receipt provenance, then atomically settle its
own state with idempotence. No direct database patch or reused campaign requirement is acceptable.
