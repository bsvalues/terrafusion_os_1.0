# WO-SR-005C-E2 - Dais Standalone Synthetic Contract Parity

| Field | Value |
| --- | --- |
| Status | PREPARED — pending suite-side execution in `bsvalues/terrafusion-dais` |
| Program | Five-Suite Federated Repository Buildout |
| Repository (execution target) | `bsvalues/terrafusion-dais` |
| Risk | R2 bounded synthetic contract-compat implementation |
| Dependency | `WO-SR-005C-E3` = `PASS_NO_DIRECT_EXTRACTION` (merged #1355, `6bfff78d`) |
| Authority | Owner directive 2026-07-23: **E2 AUTHORITY ACTIVE**; **F1 AUTHORITY NOT GRANTED** |
| Next | `WO-SR-005C-F1` — **SEPARATE R3 ACTIVATION REQUIRED** (not granted) |

## Scope boundary (E2 only)

E2 proves the standalone Dais suite consumes the frozen `dais.appeal-workflow@1.0.0` contract and that a
**self-contained, dependency-free verifier** accepts the 3 positive fixtures and fails the 6 negative
fixtures closed. E2 **does not** ship a reusable product-source module. Extracting the projection logic
into `src/appeal-workflow/project-dais-appeal-workflow.mjs` (so the verifier imports it) is the separate,
not-yet-authorized **F1** R3 activation — mirroring how Atlas E2 held its projection logic inside the
verifier until `WO-SR-005B-F1`.

## Objective

Materialize the hash-pinned `dais.appeal-workflow@1.0.0` schema and nine frozen synthetic fixtures in
`bsvalues/terrafusion-dais`, then prove contract acceptance and county-scoped read-only appeal-lifecycle
parity without extracting product source or adopting any provider/persistence/runtime.

## Exact Allowed Files (suite side — `bsvalues/terrafusion-dais`)

- `.github/workflows/suite-ci.yml` (`contract-compat` job only)
- `canon/CONTRACT_DEPENDENCY.md`
- `contract-compat/dais.appeal-workflow.v1/fixtures.manifest.json`
- `contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json`
- `contract-compat/dais.appeal-workflow.v1/fixtures/dais.appeal-workflow.v1.*.synthetic.json` (the nine frozen fixtures only)
- `scripts/verify-dais-appeal-workflow.mjs`
- `scripts/verify-dais-appeal-workflow.test.mjs`
- `operations/work-orders/WO-SR-005C-E2-dais-standalone-synthetic-contract-parity.md`
- `operations/evidence/WO-SR-005C-E2-DAIS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md`

## Required Behavior

- Record the exact sovereign source SHA and SHA-256 for every mirrored contract artifact.
- Accept three positive fixtures (`filed-by-parcel`, `decided-by-id`, `empty-by-tax-year`).
- Fail closed on six negatives (`county-mismatch`, `missing-county`, `invalid-status`,
  `cross-lane-fields`, `ambiguous-selector`, `selector-mismatch`).
- Keep verification self-contained, dependency-free, deterministic, synthetic-only, and offline.

## Blocked

- The F1 product module `src/appeal-workflow/**`, its product test, and any F1-activating routing.
- Product-source extraction, adapter/runtime adoption, ownership cutover, or duplicate retirement.
- Provider, PACS, county, SQL, persistence, credential, secret, network, live-service, or production input.
- Package/lockfile changes or workflow changes outside the existing `contract-compat` job.
- Changes to the frozen sovereign contract.

## Validation

- Suite verifier + tests (self-contained; no product module on disk);
- frozen source/destination hash parity (9 fixtures + schema);
- existing standalone required checks (`suite-ci`, `contract-compat`, `governance-gate`);
- exact-file scope inspection and `git diff --check`;
- proof that no product source, package, lockfile, provider, or runtime file changed.

## Sovereign-side status (this PR, #1356)

This PR is the **sovereign-side E2 record** (WO card + evidence). The self-contained verifier + parity
harness are locally validated here (3 positive / 6 negative, PARITY OK; verifier tests 3/3; 9/9 hashes
match the freeze pins) and embedded in the evidence for suite-side execution. The suite-side execution +
merge occur where `terrafusion-dais` is reachable; the merge SHA is then reconciled into the evidence.
This session's GitHub/git tooling is scoped to `terrafusion_os_1.0` and cannot itself write the suite repo.

## Stop Type

`DAIS_STANDALONE_SYNTHETIC_CONTRACT_PARITY_PROVEN` (on suite-side merge). **F1 remains a separate,
ungranted R3 activation.**

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-SR-005C-E2",
  "task": "Prove Dais standalone synthetic contract parity (3 positive / 6 negative) via a self-contained dependency-free verifier in bsvalues/terrafusion-dais; ship no F1 product module",
  "risk": "R2",
  "suite": "Dais",
  "allowed_files": [
    "docs/brain/workorders/active/WO-SR-005C-E2-dais-standalone-synthetic-contract-parity.md",
    "docs/brain/workorders/evidence/WO-SR-005C-E2-DAIS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json"
  ],
  "forbidden_patterns": [
    ".governance/**",
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "tools/**",
    "packages/**",
    ".github/workflows/**",
    "deployment/**",
    "package.json",
    "**/pnpm-lock.yaml"
  ],
  "required_proof": [
    "git diff --check",
    "node --test docs/brain/workorders/tools/wo-query.test.mjs"
  ]
}
```
