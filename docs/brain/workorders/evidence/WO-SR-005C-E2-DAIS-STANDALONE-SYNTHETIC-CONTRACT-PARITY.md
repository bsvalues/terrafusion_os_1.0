# WO-SR-005C-E2 - Dais Standalone Synthetic Contract Parity Evidence

## Result

**`E2_PREPARED_PARITY_PROVEN_LOCALLY — SUITE-SIDE EXECUTION PENDING`.** The Dais standalone synthetic
contract-parity slice is authored E2-only, strictly within the `WO-SR-005C-E3` allowlist, and validated
locally: a **self-contained, dependency-free** verifier accepts the 3 positive fixtures and fails the 6
negatives closed, with **no product-source module present on disk**. Suite-side execution + merge in
`bsvalues/terrafusion-dais` and the merge-SHA reconciliation are the remaining steps (this session's
tooling is scoped to `terrafusion_os_1.0`; see the access record below).

> **F1 is NOT in scope here.** Extracting the projection logic into
> `src/appeal-workflow/project-dais-appeal-workflow.mjs` and having the verifier import it is the
> separate, not-yet-granted `WO-SR-005C-F1` R3 activation. This evidence ships no such module, makes no
> claim that F1 executed, and contains no routing that activates F1.

| Local gate (authoring sandbox) | Result |
| --- | --- |
| `node scripts/verify-dais-appeal-workflow.mjs` (no `src/` product module on disk) | PASS — 10 artifacts, 3 positive / 6 negative, PARITY OK |
| `node --test scripts/verify-dais-appeal-workflow.test.mjs` | PASS — 3/3 |
| 9 fixture SHA-256 + schema vs `contracts.freeze.json` pins | MATCH — 10/10 |

## terrafusion-dais Session-Access Record (honest)

The owner directed executing E2 **in** `bsvalues/terrafusion-dais`. This session's tooling denies that
repo — re-verified at rework time, four independent ways:

| Path | Result |
| --- | --- |
| GitHub MCP `get_file_contents bsvalues/terrafusion-dais /` (read) | `Access denied: repository "bsvalues/terrafusion-dais" is not configured for this session. Allowed repositories: bsvalues/terrafusion_os_1.0` |
| GitHub MCP `list_branches bsvalues/terrafusion-dais` | same access-denied |
| git HTTPS `ls-remote https://github.com/bsvalues/terrafusion-dais` | `could not read Password … terminal prompts disabled` |
| git proxy `ls-remote http://local_proxy@127.0.0.1:PORT/git/bsvalues/terrafusion-dais` | `could not read Password` |

The session's git credential and MCP allow-list contain only `terrafusion_os_1.0`. The installed GitHub
connector's own permissions are not the limiter — this Claude Code session's tool scope is. Suite-side
execution therefore runs where `terrafusion-dais` is reachable; every artifact needed is embedded below
and pre-validated, so that execution is mechanical.

## Anchors

| Field | Value |
| --- | --- |
| Sovereign base (contract freeze anchor) | `e57b1eca9c3291d10203efaa1fd586bcbce13f94` (#1352, WO-SR-005E-I) |
| Sovereign branch head at rework | `6bfff78d` (#1355 merged; WO-SR-005C-E3 closed) |
| Frozen contract | `dais.appeal-workflow@1.0.0` (PR #1350; `verify-contract-freeze` PASS, 16/16) |
| Suite repo (target) | `github.com/bsvalues/terrafusion-dais`, `main` `1404db1947587d4f8c868092798c4d71c23bb62d` |
| Schema pin (sovereign-owned, consumed) | `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c` |
| **Suite E2 PR** | _pending — fill on suite-side open_ |
| **Suite E2 merge SHA** | _pending — reconcile here on suite-side merge_ |

## Exact target tree in `bsvalues/terrafusion-dais` (E2 allowlist — nothing else)

```
contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json   # hash-pinned copy (no DTO source)
contract-compat/dais.appeal-workflow.v1/fixtures.manifest.json                # pins + expected verdicts
contract-compat/dais.appeal-workflow.v1/fixtures/dais.appeal-workflow.v1.*.synthetic.json   # 9 hash-pinned copies
scripts/verify-dais-appeal-workflow.mjs                                       # SELF-CONTAINED verifier (no src/ import)
scripts/verify-dais-appeal-workflow.test.mjs                                  # verifier tests
.github/workflows/suite-ci.yml                                                # contract-compat job only (narrow)
canon/CONTRACT_DEPENDENCY.md                                                  # records sovereign-owned contract dependency
operations/work-orders/WO-SR-005C-E2-dais-standalone-synthetic-contract-parity.md
operations/evidence/WO-SR-005C-E2-DAIS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md
```

**Not authorized at E2 (F1 gate):** `src/appeal-workflow/**`, `test/project-dais-appeal-workflow.test.mjs`.

**No-touch (E2):** no `package.json` / lockfile, no DTO source copy, no contract-artifact mutation, no
provider, no network, no persistence, no auth, no runtime consumer, no OS code, no county / PACS / SQL,
no credential, no secret, no deployment, no cutover, no Git-history import, no workflow change outside the
`contract-compat` job.

## Fixture + schema materialization (hash-pinned copy — do NOT retype)

```bash
# from a bsvalues/terrafusion_os_1.0 checkout at e57b1eca9 (frozen blobs are unchanged since freeze)
SRC=backend/src/TerraFusion.Abstractions/contracts
DST=contract-compat/dais.appeal-workflow.v1
mkdir -p "$DST/fixtures"
git show e57b1eca9:$SRC/dais.appeal-workflow.v1.schema.json > "$DST/dais.appeal-workflow.v1.schema.json"
for n in filed-by-parcel decided-by-id empty-by-tax-year county-mismatch missing-county \
         invalid-status cross-lane-fields ambiguous-selector selector-mismatch; do
  git show e57b1eca9:$SRC/fixtures/dais.appeal-workflow.v1.$n.synthetic.json \
    > "$DST/fixtures/dais.appeal-workflow.v1.$n.synthetic.json"
done
node scripts/verify-dais-appeal-workflow.mjs   # gate: every SHA-256 equals its pin; 3 positive / 6 negative
```

| Artifact | Expect | SHA-256 |
| --- | --- | --- |
| `dais.appeal-workflow.v1.schema.json` | pin | `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c` |
| `filed-by-parcel` | accept | `3b5196ccd2e6080a357279297f53a23c996a29db87071a0237f829d9b2cf6a3e` |
| `decided-by-id` | accept | `8bce4af4bca4b75a5d8d274fdbea55732b62c091d426a9776e357494fd124d10` |
| `empty-by-tax-year` | accept | `711fabf84f640befaaf2bf8ce3bef1f6ba5a7f3bded2e080123d283bd975ea7d` |
| `county-mismatch` | reject | `58e9b3e9b5198b83cf0f35cf8e5f0c8d10d1039bb71a73da6349975250e940ce` |
| `missing-county` | reject | `a05e064f6fa43d5778870b88413b94a111b07f3c5d019e9338820914ecb6c849` |
| `invalid-status` | reject | `5db538ba1e89ac17b45f40df6922cd27d3b5a0ee5368ed466ff8aa89ec55ad05` |
| `cross-lane-fields` | reject | `f290364ae814e241d75d92d4ee230740526a15a64ea077247fe42910315a8aff` |
| `ambiguous-selector` | reject | `3ff0de0c5ea92916afb63de5a3a9166c8c620e68b41dc8bfb6a39aa992cdea17` |
| `selector-mismatch` | reject | `99828201845dfceccb2ed2392d6ae4f1927918ac78ca652d2cc9a83d9789e8cc` |

---

## FILE 1 (E2) — `scripts/verify-dais-appeal-workflow.mjs` (self-contained; no `src/` import)

```js
// scripts/verify-dais-appeal-workflow.mjs
//
// E2 — Dais standalone synthetic contract parity. SELF-CONTAINED, dependency-free,
// offline, synthetic-only verifier. Consumes the local hash-pinned copy of the
// sovereign-frozen `dais.appeal-workflow@1.0.0` schema + 9-fixture corpus and
// proves 3 positive fixtures pass and 6 negative fixtures fail closed.
//
// The accept/reject logic lives INLINE in this verifier by design: E2 proves
// contract parity without shipping a reusable product-source module. Factoring
// this logic into src/appeal-workflow/project-dais-appeal-workflow.mjs is the
// separate, not-yet-authorized F1 activation — do NOT add that module here.
//
// No providers, persistence, runtime, county, PACS, SQL, credentials, or network.
// Exit 0 iff every fixture hash equals its sovereign pin AND every verdict matches.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const compatDir = join(here, '..', 'contract-compat', 'dais.appeal-workflow.v1');
const fixturesDir = join(compatDir, 'fixtures');

const SCHEMA_VERSION = '1.0.0';
const GROUNDS = new Set(['MARKET_VALUE', 'UNIFORMITY', 'CLASSIFICATION', 'EXEMPTION_DENIAL', 'CLERICAL_ERROR']);
const STATUSES = new Set(['filed', 'scheduled', 'heard', 'decided', 'withdrawn']);
const APPEAL_KEYS = new Set(['appealId', 'parcelId', 'taxYear', 'ground', 'status', 'filedAt', 'hearingAt', 'decisionAt']);
const REQUIRED_APPEAL_KEYS = ['appealId', 'parcelId', 'taxYear', 'ground', 'status', 'filedAt'];
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;
const isTaxYear = (v) => Number.isInteger(v) && v >= 1900 && v <= 2200;

function selectorKind(selector) {
  if (selector == null || typeof selector !== 'object' || Array.isArray(selector)) return null;
  const known = ['appealId', 'parcelId', 'taxYear'];
  const present = Object.keys(selector).filter((k) => selector[k] !== undefined);
  if (present.some((k) => !known.includes(k))) return null;
  const set = known.filter((k) => present.includes(k));
  if (set.length !== 1) return null;
  const kind = set[0];
  if (kind === 'taxYear') return isTaxYear(selector.taxYear) ? kind : null;
  return isNonEmptyString(selector[kind]) ? kind : null;
}

function appealMatchesSelector(appeal, kind, selector) {
  if (kind === 'appealId') return appeal.appealId === selector.appealId;
  if (kind === 'parcelId') return appeal.parcelId === selector.parcelId;
  if (kind === 'taxYear') return appeal.taxYear === selector.taxYear;
  return false;
}

function appealReason(appeal, kind, selector) {
  if (appeal == null || typeof appeal !== 'object' || Array.isArray(appeal)) return 'appeal-not-object';
  for (const key of Object.keys(appeal)) if (!APPEAL_KEYS.has(key)) return `forbidden-field:${key}`;
  for (const key of REQUIRED_APPEAL_KEYS) if (!(key in appeal)) return `missing-field:${key}`;
  if (!isNonEmptyString(appeal.appealId)) return 'invalid-appealId';
  if (!isNonEmptyString(appeal.parcelId)) return 'invalid-parcelId';
  if (!isTaxYear(appeal.taxYear)) return 'invalid-taxYear';
  if (!GROUNDS.has(appeal.ground)) return `invalid-ground:${appeal.ground}`;
  if (!STATUSES.has(appeal.status)) return `invalid-status:${appeal.status}`;
  if (!TIMESTAMP.test(appeal.filedAt)) return 'invalid-filedAt';
  if ('hearingAt' in appeal && !TIMESTAMP.test(appeal.hearingAt)) return 'invalid-hearingAt';
  if ('decisionAt' in appeal && !TIMESTAMP.test(appeal.decisionAt)) return 'invalid-decisionAt';
  if (!appealMatchesSelector(appeal, kind, selector)) return 'selector-mismatch';
  return null;
}

// Inline contract judgment: returns { ok, reason }. Not exported as a product API.
function evaluateExchange(request, result) {
  if (request == null || typeof request !== 'object' || Array.isArray(request)) return { ok: false, reason: 'request-not-object' };
  if (request.schemaVersion !== SCHEMA_VERSION) return { ok: false, reason: 'invalid-request-schemaVersion' };
  if (!isNonEmptyString(request.countyId)) return { ok: false, reason: 'missing-county' };
  const kind = selectorKind(request.selector);
  if (kind === null) return { ok: false, reason: 'invalid-selector' };

  if (result == null || typeof result !== 'object' || Array.isArray(result)) return { ok: false, reason: 'result-not-object' };
  if (result.schemaVersion !== SCHEMA_VERSION) return { ok: false, reason: 'invalid-result-schemaVersion' };
  if (!isNonEmptyString(result.countyId)) return { ok: false, reason: 'missing-result-county' };
  if (result.countyId !== request.countyId) return { ok: false, reason: 'county-mismatch' };
  if (!Array.isArray(result.appeals)) return { ok: false, reason: 'appeals-not-array' };

  for (const appeal of result.appeals) {
    const reason = appealReason(appeal, kind, request.selector);
    if (reason) return { ok: false, reason };
  }
  return { ok: true, reason: null }; // empty appeals is a valid truth
}

export function runVerification() {
  const manifest = JSON.parse(readFileSync(join(compatDir, 'fixtures.manifest.json'), 'utf8'));
  const results = [];

  const schemaBytes = readFileSync(join(compatDir, manifest.schema.path));
  const schemaHash = createHash('sha256').update(schemaBytes).digest('hex');
  results.push({ name: 'schema-pin', hashOk: schemaHash === manifest.schema.sha256, verdictOk: true, expect: 'pin', got: schemaHash === manifest.schema.sha256 ? 'pin' : 'MISMATCH' });

  for (const entry of manifest.fixtures) {
    const bytes = readFileSync(join(fixturesDir, `dais.appeal-workflow.v1.${entry.name}.synthetic.json`));
    const hash = createHash('sha256').update(bytes).digest('hex');
    const doc = JSON.parse(bytes.toString('utf8'));
    const evalr = evaluateExchange(doc.request, doc.result);
    const got = evalr.ok ? 'accept' : 'reject';
    results.push({ name: entry.name, hashOk: hash === entry.sha256, verdictOk: got === entry.expect, expect: entry.expect, got, reason: evalr.reason });
  }

  const positives = manifest.fixtures.filter((f) => f.expect === 'accept').length;
  const negatives = manifest.fixtures.filter((f) => f.expect === 'reject').length;
  const failed = results.filter((r) => !r.hashOk || !r.verdictOk);
  return { results, positives, negatives, ok: failed.length === 0, failed };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { results, positives, negatives, ok, failed } = runVerification();
  for (const r of results) {
    const flag = r.hashOk && r.verdictOk ? 'PASS' : 'FAIL';
    console.log(`${flag}  ${r.name.padEnd(20)} hash=${r.hashOk ? 'ok' : 'MISMATCH'} verdict=${r.got}(${r.expect})${r.reason ? ' reason=' + r.reason : ''}`);
  }
  console.log(`\n${results.length} artifacts checked — ${positives} positive / ${negatives} negative — ${ok ? 'PARITY OK' : `${failed.length} FAILED`}`);
  process.exit(ok ? 0 : 1);
}
```

## FILE 2 (E2) — `scripts/verify-dais-appeal-workflow.test.mjs`

```js
// scripts/verify-dais-appeal-workflow.test.mjs
// Proves the self-contained E2 verifier: every fixture hash matches its pin and every
// accept/reject verdict matches its manifest expectation (3 positive / 6 negative).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runVerification } from './verify-dais-appeal-workflow.mjs';

test('all fixture hashes match their sovereign pins', () => {
  const { results } = runVerification();
  for (const r of results) assert.equal(r.hashOk, true, `hash pin failed: ${r.name}`);
});

test('verdicts match every fixture expectation (fail-closed on negatives)', () => {
  const { results } = runVerification();
  for (const r of results) assert.equal(r.verdictOk, true, `verdict mismatch: ${r.name} got ${r.got} want ${r.expect}`);
});

test('corpus is 3 positive / 6 negative and overall parity holds', () => {
  const { positives, negatives, ok } = runVerification();
  assert.equal(positives, 3);
  assert.equal(negatives, 6);
  assert.equal(ok, true);
});
```

## FILE 3 (E2) — `contract-compat/dais.appeal-workflow.v1/fixtures.manifest.json`

```json
{
  "contract": "dais.appeal-workflow@1.0.0",
  "note": "Hash-pinned copies of the sovereign-frozen synthetic corpus. SHA-256 values equal the contracts.freeze.json pins at sovereign anchor e57b1eca9c3291d10203efaa1fd586bcbce13f94. Do NOT edit fixture bytes; regenerate only from the sovereign frozen blobs.",
  "schema": {
    "path": "dais.appeal-workflow.v1.schema.json",
    "sha256": "b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c"
  },
  "fixtures": [
    { "name": "filed-by-parcel",    "expect": "accept", "sha256": "3b5196ccd2e6080a357279297f53a23c996a29db87071a0237f829d9b2cf6a3e" },
    { "name": "decided-by-id",      "expect": "accept", "sha256": "8bce4af4bca4b75a5d8d274fdbea55732b62c091d426a9776e357494fd124d10" },
    { "name": "empty-by-tax-year",  "expect": "accept", "sha256": "711fabf84f640befaaf2bf8ce3bef1f6ba5a7f3bded2e080123d283bd975ea7d" },
    { "name": "county-mismatch",    "expect": "reject", "sha256": "58e9b3e9b5198b83cf0f35cf8e5f0c8d10d1039bb71a73da6349975250e940ce" },
    { "name": "missing-county",     "expect": "reject", "sha256": "a05e064f6fa43d5778870b88413b94a111b07f3c5d019e9338820914ecb6c849" },
    { "name": "invalid-status",     "expect": "reject", "sha256": "5db538ba1e89ac17b45f40df6922cd27d3b5a0ee5368ed466ff8aa89ec55ad05" },
    { "name": "cross-lane-fields",  "expect": "reject", "sha256": "f290364ae814e241d75d92d4ee230740526a15a64ea077247fe42910315a8aff" },
    { "name": "ambiguous-selector", "expect": "reject", "sha256": "3ff0de0c5ea92916afb63de5a3a9166c8c620e68b41dc8bfb6a39aa992cdea17" },
    { "name": "selector-mismatch",  "expect": "reject", "sha256": "99828201845dfceccb2ed2392d6ae4f1927918ac78ca652d2cc9a83d9789e8cc" }
  ]
}
```

## FILE 4 — `canon/CONTRACT_DEPENDENCY.md`

```markdown
# Contract Dependency — dais.appeal-workflow@1.0.0

TerraFusion Dais consumes the **sovereign-owned** `dais.appeal-workflow@1.0.0` contract. The DTO and
JSON Schema are owned by `bsvalues/terrafusion_os_1.0`; this suite consumes them **hash-pinned** and
copies no DTO source and no Git history.

| Field | Value |
| --- | --- |
| Contract | `dais.appeal-workflow@1.0.0` |
| Owner | `bsvalues/terrafusion_os_1.0` (`backend/src/TerraFusion.Abstractions`) |
| Sovereign anchor SHA | `e57b1eca9c3291d10203efaa1fd586bcbce13f94` |
| Schema SHA-256 | `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c` |
| Frozen at | sovereign PR #1350 (`verify-contract-freeze` PASS, 16/16) |
| E3 verdict | `PASS_NO_DIRECT_EXTRACTION` (sovereign #1355) — build fresh, no direct extraction |

At E2 the suite owns only a hash-pinned fixture/schema copy and a self-contained parity verifier. The
suite does NOT yet own a reusable projection module — that is the separate F1 activation. The OS retains
all auth, workbench, launching, persistence, PACS/providers, county/runtime, write-lane (TFR-028), audit
trace (TFR-027), and mutations. Contract changes originate sovereign-side and re-pin here.
```

## FILE 5 (E2) — `.github/workflows/suite-ci.yml` (narrow `contract-compat` job only)

```yaml
# Add/extend ONLY the contract-compat job. Do not add other jobs, providers, or steps.
name: suite-ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  contract-compat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Dais appeal-workflow contract parity (hash-pinned, offline)
        run: |
          node scripts/verify-dais-appeal-workflow.mjs
          node --test scripts/verify-dais-appeal-workflow.test.mjs
```

## FILE 6 — `operations/work-orders/WO-SR-005C-E2-dais-standalone-synthetic-contract-parity.md` (suite side)

```markdown
# WO-SR-005C-E2 - Dais Standalone Synthetic Contract Parity

Status: READY. Dependency: WO-SR-005C-E3 = PASS_NO_DIRECT_EXTRACTION (sovereign #1355).
Scope: hash-pinned schema + 9 fixtures + fixtures.manifest.json + a SELF-CONTAINED, dependency-free
verifier proving 3 accept / 6 reject; narrow contract-compat CI job; this WO + evidence.

Allowed files: see the E2 allowlist. Blocked: src/appeal-workflow/** (F1 module — NOT at E2),
test/project-dais-appeal-workflow.test.mjs, package.json/lockfile, providers, persistence, runtime,
county/PACS/SQL, credentials, cutover, contract mutation.

Gate: node scripts/verify-dais-appeal-workflow.mjs (3 positive / 6 negative, PARITY OK; hashes match);
node --test scripts/verify-dais-appeal-workflow.test.mjs (3/3); suite-ci + contract-compat + governance
pass; git diff --check; exact-file scope.

Stop: DAIS_STANDALONE_SYNTHETIC_CONTRACT_PARITY_PROVEN. F1 = SEPARATE R3 ACTIVATION REQUIRED (not granted).
```

## FILE 7 — `operations/evidence/WO-SR-005C-E2-DAIS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md` (suite side; fill on merge)

```markdown
# WO-SR-005C-E2 - Dais Standalone Synthetic Contract Parity Evidence

## Result
PASS - DAIS_STANDALONE_SYNTHETIC_CONTRACT_PARITY_PROVEN — <suite PR #> merged at <sha>.

## Cross-Repository Delivery
| Item | Evidence |
| --- | --- |
| Sovereign contract source | bsvalues/terrafusion_os_1.0@e57b1eca9 |
| Standalone destination | bsvalues/terrafusion-dais |
| Pull request | bsvalues/terrafusion-dais#<n> |
| Merge commit | <sha> |
| Contract | dais.appeal-workflow@1.0.0 |

## Validation
| Gate | Result |
| --- | --- |
| node scripts/verify-dais-appeal-workflow.mjs | PASS — 3 positive / 6 negative, PARITY OK |
| node --test scripts/verify-dais-appeal-workflow.test.mjs | PASS — 3/3 |
| Frozen source/destination SHA-256 parity | PASS — 10/10 (schema + 9 fixtures) |
| suite-ci / contract-compat / governance-gate | PASS |
| Exact destination scope / git diff --check | PASS |

## Non-Claims
No product source (no src/appeal-workflow module), package, lockfile, provider, county, PACS, SQL,
credential, secret, network, runtime, or production surface changed. F1 was not executed. Passing E2
does not authorize F1, runtime adoption, ownership cutover, or duplicate retirement.
```

## Parity And Negative Proof (the contract of E2)

Sovereign-frozen and standalone verifiers agree on every verdict over the same hash-pinned corpus:
**3 positive** (`filed-by-parcel`, `decided-by-id`, `empty-by-tax-year`) and **6 negative**
(`county-mismatch`, `missing-county`, `invalid-status`, `cross-lane-fields`, `ambiguous-selector`,
`selector-mismatch`). Confirmed locally with **no product module on disk**.

## Suite-side execution steps

1. Checkout `bsvalues/terrafusion-dais` `main`.
2. Materialize the E2 tree (schema + 9 fixtures via the hash-pinned copy block; manifest; the two
   `scripts/…` files; the narrow `contract-compat` CI job; `canon/CONTRACT_DEPENDENCY.md`; the E2
   work-order + evidence). Do **not** add any `src/appeal-workflow/**` file.
3. Run the E2 gates; open a draft PR; fill the suite evidence; merge on green under standing authority.
4. Return here and record the suite PR number + merge SHA in **Anchors** above (the reconciliation slot).
5. **Stop.** Do not begin F1 — `WO-SR-005C-F1` is a separate R3 activation and is not granted.

## Non-Claims

- No write to `bsvalues/terrafusion-dais` (or any external repo) was performed by this session.
- No F1 product module was shipped, and no claim is made that F1 executed.
- No frozen contract artifact was modified; the DTO and schema stay sovereign-owned.
- No provider, county, PACS, SQL, persistence, credential, runtime, package, lockfile, deployment, or
  cutover resource was touched.
- E2 parity does not authorize F1, runtime adoption, or WO-SR-006 source-ownership cutover.

## Rollback

Sovereign-side, revert-only and repo-local (`git revert` of this docs commit). Suite-side, a repo-local
revert of the E2 merge (an offline contract-compat harness with no runtime consumer), touching no
sovereign base or protected resource.

## Next

Execute the E2 slice in `bsvalues/terrafusion-dais` where it is reachable; reconcile the merge SHA here.
Then **return `WO-SR-005C-F1 — SEPARATE R3 ACTIVATION REQUIRED`** — do not begin F1 without that grant.
