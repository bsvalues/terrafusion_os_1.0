# WO-SR-005C-E2F1 - Dais Standalone E2+F1 Execution Package Evidence

## Result

**`PACKAGE_READY_FOR_DAIS_CAPABLE_EXECUTION`.** A complete, locally-validated E2 (hash-pinned synthetic
contract parity) + F1 (build-fresh provider-neutral read-only appeal-workflow projection) slice for
`bsvalues/terrafusion-dais`, authored strictly within the `WO-SR-005C-E3` allowlist and proven green in
the authoring sandbox. Every file below is turnkey: a dais-capable context materializes the tree exactly
as specified and the gates pass with no further authoring.

| Local gate (authoring sandbox) | Result |
| --- | --- |
| `node --test test/project-dais-appeal-workflow.test.mjs` | PASS — 10/10 |
| `node scripts/verify-dais-appeal-workflow.mjs` | PASS — 10 artifacts, 3 positive / 6 negative, PARITY OK |
| `node --test scripts/verify-dais-appeal-workflow.test.mjs` | PASS — 3/3 |
| 9 fixture SHA-256 vs `contracts.freeze.json` pins | MATCH — 9/9 |

## Session Access Limitation (honest statement)

The owner directed execution **in** `bsvalues/terrafusion-dais`. This session's tooling is hard-scoped
and cannot reach that repo — re-verified at package time, three independent ways:

| Path | Result |
| --- | --- |
| GitHub MCP `list_branches bsvalues/terrafusion-dais` | `Access denied: repository "bsvalues/terrafusion-dais" is not configured for this session. Allowed repositories: bsvalues/terrafusion_os_1.0` |
| Git proxy fetch/push of the suite remote | `could not read Password` (no credential bound) |
| `add_repo` / `list_repos` session capability | not present (ToolSearch finds no such tool) |

This is a session-scope configuration fact, not a permission decision. To let this same session commit
directly to the suite repo, add `bsvalues/terrafusion-dais` to its allowed-repos scope; otherwise a
dais-capable context runs the package below. Either way, the package is identical and pre-validated.

## Anchors

| Field | Value |
| --- | --- |
| Sovereign base (contract freeze anchor) | `e57b1eca9c3291d10203efaa1fd586bcbce13f94` (#1352, WO-SR-005E-I) |
| Sovereign branch head at packaging | `6bfff78d` (#1355 merged; WO-SR-005C-E3 closed) |
| Frozen contract | `dais.appeal-workflow@1.0.0` (PR #1350; `verify-contract-freeze` PASS, 16/16) |
| Suite repo (target) | `github.com/bsvalues/terrafusion-dais`, `main` `1404db1947587d4f8c868092798c4d71c23bb62d` |
| Schema pin (sovereign-owned, consumed) | `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c` |

## Exact target tree in `bsvalues/terrafusion-dais` (E3 allowlist — nothing else)

```
src/appeal-workflow/project-dais-appeal-workflow.mjs          # F1 build-fresh module
test/project-dais-appeal-workflow.test.mjs                    # F1 product-module tests
scripts/verify-dais-appeal-workflow.mjs                       # E2 hash-pinned verifier
scripts/verify-dais-appeal-workflow.test.mjs                  # E2 verifier tests
contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json   # hash-pinned copy (no DTO source)
contract-compat/dais.appeal-workflow.v1/fixtures.manifest.json                # pins + expected verdicts
contract-compat/dais.appeal-workflow.v1/fixtures/dais.appeal-workflow.v1.*.synthetic.json   # 9 hash-pinned copies
canon/CONTRACT_DEPENDENCY.md                                  # records sovereign-owned contract dependency
operations/work-orders/WO-SR-005C-E2-dais-standalone-synthetic-contract-parity.md
operations/work-orders/WO-SR-005C-F1-dais-standalone-appeal-workflow-foundation.md
operations/evidence/WO-SR-005C-E2-DAIS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md
operations/evidence/WO-SR-005C-F1-DAIS-STANDALONE-APPEAL-WORKFLOW-FOUNDATION.md
AGENTS.md                                                     # only if not already present
```

**No-touch (F1/E2):** no `package.json` / lockfile, no `.github/workflows/**`, no contract-artifact
mutation, no DTO source copy, no provider, no network, no persistence, no auth, no runtime consumer, no
OS code, no county / PACS / SQL, no credential, no secret, no deployment, no cutover, no duplicated
sovereign source, no Git-history import.

## Fixture materialization (hash-pinned copy — do NOT retype)

The 9 fixtures and the schema are the **sovereign-frozen** blobs. Copy them byte-for-byte from a
sovereign checkout so the SHA-256 pins hold, then confirm:

```bash
# from a bsvalues/terrafusion_os_1.0 checkout at e57b1eca9 (or any later commit; the frozen blobs are unchanged)
SRC=backend/src/TerraFusion.Abstractions/contracts
DST=contract-compat/dais.appeal-workflow.v1
mkdir -p "$DST/fixtures"
git show e57b1eca9:$SRC/dais.appeal-workflow.v1.schema.json > "$DST/dais.appeal-workflow.v1.schema.json"
for n in filed-by-parcel decided-by-id empty-by-tax-year county-mismatch missing-county \
         invalid-status cross-lane-fields ambiguous-selector selector-mismatch; do
  git show e57b1eca9:$SRC/fixtures/dais.appeal-workflow.v1.$n.synthetic.json \
    > "$DST/fixtures/dais.appeal-workflow.v1.$n.synthetic.json"
done
# gate: every SHA-256 must equal the manifest pin (the verifier also enforces this)
node scripts/verify-dais-appeal-workflow.mjs
```

Pinned SHA-256 (equal to `contracts.freeze.json`):

| Fixture (`dais.appeal-workflow.v1.<name>.synthetic.json`) | Expect | SHA-256 |
| --- | --- | --- |
| `filed-by-parcel` | accept | `3b5196ccd2e6080a357279297f53a23c996a29db87071a0237f829d9b2cf6a3e` |
| `decided-by-id` | accept | `8bce4af4bca4b75a5d8d274fdbea55732b62c091d426a9776e357494fd124d10` |
| `empty-by-tax-year` | accept | `711fabf84f640befaaf2bf8ce3bef1f6ba5a7f3bded2e080123d283bd975ea7d` |
| `county-mismatch` | reject | `58e9b3e9b5198b83cf0f35cf8e5f0c8d10d1039bb71a73da6349975250e940ce` |
| `missing-county` | reject | `a05e064f6fa43d5778870b88413b94a111b07f3c5d019e9338820914ecb6c849` |
| `invalid-status` | reject | `5db538ba1e89ac17b45f40df6922cd27d3b5a0ee5368ed466ff8aa89ec55ad05` |
| `cross-lane-fields` | reject | `f290364ae814e241d75d92d4ee230740526a15a64ea077247fe42910315a8aff` |
| `ambiguous-selector` | reject | `3ff0de0c5ea92916afb63de5a3a9166c8c620e68b41dc8bfb6a39aa992cdea17` |
| `selector-mismatch` | reject | `99828201845dfceccb2ed2392d6ae4f1927918ac78ca652d2cc9a83d9789e8cc` |

Schema: `dais.appeal-workflow.v1.schema.json` → `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c`.

---

## FILE 1 (F1) — `src/appeal-workflow/project-dais-appeal-workflow.mjs`

```js
// src/appeal-workflow/project-dais-appeal-workflow.mjs
//
// Build-fresh, provider-neutral, read-only projection/validation of the frozen
// `dais.appeal-workflow@1.0.0` contract behavior for the standalone Dais suite.
//
// Sovereign-owned contract (consumed hash-pinned, NOT copied as source):
//   DTO    backend/src/TerraFusion.Abstractions/DTOs/DaisAppealWorkflowDto.cs
//   schema backend/src/TerraFusion.Abstractions/contracts/dais.appeal-workflow.v1.schema.json
//          SHA-256 b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c
//
// This module is PURE: no writeLane (TFR-028), no terraTrace (TFR-027), no
// network, no persistence, no auth, no provider, no county/PACS/SQL, no I/O.
// It only decides whether a (request, result) pair is a valid read-only
// county-scoped appeal-lifecycle projection, and returns the projected records.

const SCHEMA_VERSION = '1.0.0';

const GROUNDS = new Set([
  'MARKET_VALUE',
  'UNIFORMITY',
  'CLASSIFICATION',
  'EXEMPTION_DENIAL',
  'CLERICAL_ERROR',
]);

const STATUSES = new Set(['filed', 'scheduled', 'heard', 'decided', 'withdrawn']);

const APPEAL_KEYS = new Set([
  'appealId',
  'parcelId',
  'taxYear',
  'ground',
  'status',
  'filedAt',
  'hearingAt',
  'decisionAt',
]);

const REQUIRED_APPEAL_KEYS = ['appealId', 'parcelId', 'taxYear', 'ground', 'status', 'filedAt'];

// Matches the frozen schema's `filedAt`/`hearingAt`/`decisionAt` pattern exactly.
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function isTaxYear(value) {
  return Number.isInteger(value) && value >= 1900 && value <= 2200;
}

function reject(reason) {
  return { ok: false, reason, appeals: null };
}

// Exactly one of appealId | parcelId | taxYear, correctly typed. Returns the
// selector kind ('appealId' | 'parcelId' | 'taxYear') or null when invalid.
function selectorKind(selector) {
  if (selector == null || typeof selector !== 'object' || Array.isArray(selector)) return null;
  const known = ['appealId', 'parcelId', 'taxYear'];
  const present = Object.keys(selector).filter((k) => selector[k] !== undefined);
  if (present.some((k) => !known.includes(k))) return null; // unknown selector field
  const set = known.filter((k) => present.includes(k));
  if (set.length !== 1) return null; // zero or ambiguous selectors
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

// Returns null when the appeal is a valid, selector-matching, in-contract
// record; otherwise a short machine reason string.
function validateAppeal(appeal, kind, selector) {
  if (appeal == null || typeof appeal !== 'object' || Array.isArray(appeal)) return 'appeal-not-object';
  for (const key of Object.keys(appeal)) {
    if (!APPEAL_KEYS.has(key)) return `forbidden-field:${key}`; // additionalProperties:false + cross-lane guard
  }
  for (const key of REQUIRED_APPEAL_KEYS) {
    if (!(key in appeal)) return `missing-field:${key}`;
  }
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

/**
 * Project a read-only Dais appeal-workflow exchange.
 *
 * @param {object} request  { schemaVersion, countyId, selector, traceId? }
 * @param {object} result   { schemaVersion, countyId, appeals[], traceId? }
 * @returns {{ ok: boolean, reason: string|null, appeals: object[]|null }}
 *          ok:true with the projected (copied, order-preserved) records, or
 *          ok:false with a machine reason and appeals:null.
 */
export function projectDaisAppealWorkflow(request, result) {
  // --- request half ---
  if (request == null || typeof request !== 'object' || Array.isArray(request)) return reject('request-not-object');
  if (request.schemaVersion !== SCHEMA_VERSION) return reject('invalid-request-schemaVersion');
  if (!isNonEmptyString(request.countyId)) return reject('missing-county');
  const kind = selectorKind(request.selector);
  if (kind === null) return reject('invalid-selector');

  // --- result half ---
  if (result == null || typeof result !== 'object' || Array.isArray(result)) return reject('result-not-object');
  if (result.schemaVersion !== SCHEMA_VERSION) return reject('invalid-result-schemaVersion');
  if (!isNonEmptyString(result.countyId)) return reject('missing-result-county');
  if (result.countyId !== request.countyId) return reject('county-mismatch');
  if (!Array.isArray(result.appeals)) return reject('appeals-not-array');

  // Empty is a valid truth: no records match, not an error.
  const projected = [];
  for (const appeal of result.appeals) {
    const error = validateAppeal(appeal, kind, request.selector);
    if (error) return reject(error);
    projected.push({
      appealId: appeal.appealId,
      parcelId: appeal.parcelId,
      taxYear: appeal.taxYear,
      ground: appeal.ground,
      status: appeal.status,
      filedAt: appeal.filedAt,
      ...('hearingAt' in appeal ? { hearingAt: appeal.hearingAt } : {}),
      ...('decisionAt' in appeal ? { decisionAt: appeal.decisionAt } : {}),
    });
  }
  return { ok: true, reason: null, appeals: projected };
}
```

## FILE 2 (F1) — `test/project-dais-appeal-workflow.test.mjs`

```js
// test/project-dais-appeal-workflow.test.mjs
// Direct product-module proof for the built-fresh Dais appeal-workflow projection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectDaisAppealWorkflow } from '../src/appeal-workflow/project-dais-appeal-workflow.mjs';

const baseAppeal = {
  appealId: 'A-1',
  parcelId: 'P-1',
  taxYear: 2026,
  ground: 'MARKET_VALUE',
  status: 'filed',
  filedAt: '2026-01-01T00:00:00Z',
};
const req = (selector, countyId = 'c1') => ({ schemaVersion: '1.0.0', countyId, selector });
const res = (appeals, countyId = 'c1') => ({ schemaVersion: '1.0.0', countyId, appeals });

test('accepts a filed appeal selected by parcelId', () => {
  const out = projectDaisAppealWorkflow(req({ parcelId: 'P-1' }), res([baseAppeal]));
  assert.equal(out.ok, true);
  assert.equal(out.appeals.length, 1);
  assert.equal(out.appeals[0].appealId, 'A-1');
});

test('accepts a decided appeal by id with hearing/decision timestamps', () => {
  const decided = { ...baseAppeal, appealId: 'A-2', status: 'decided', hearingAt: '2026-02-01T00:00:00Z', decisionAt: '2026-02-05T00:00:00Z' };
  const out = projectDaisAppealWorkflow(req({ appealId: 'A-2' }), res([decided]));
  assert.equal(out.ok, true);
  assert.equal(out.appeals[0].decisionAt, '2026-02-05T00:00:00Z');
});

test('accepts an empty result as valid truth', () => {
  const out = projectDaisAppealWorkflow(req({ taxYear: 2024 }), res([]));
  assert.equal(out.ok, true);
  assert.deepEqual(out.appeals, []);
});

test('rejects a county mismatch between request and result', () => {
  const out = projectDaisAppealWorkflow(req({ appealId: 'A-1' }, 'a'), res([{ ...baseAppeal }], 'b'));
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'county-mismatch');
});

test('rejects a request missing countyId', () => {
  const out = projectDaisAppealWorkflow({ schemaVersion: '1.0.0', selector: { appealId: 'A-1' } }, res([]));
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'missing-county');
});

test('rejects a status outside the closed enum', () => {
  const out = projectDaisAppealWorkflow(req({ appealId: 'A-1' }), res([{ ...baseAppeal, status: 'pending' }]));
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'invalid-status:pending');
});

test('rejects cross-lane / forbidden fields on an appeal', () => {
  const out = projectDaisAppealWorkflow(req({ appealId: 'A-1' }), res([{ ...baseAppeal, petitionerName: 'X', requestedValue: 1 }]));
  assert.equal(out.ok, false);
  assert.match(out.reason, /^forbidden-field:/);
});

test('rejects an ambiguous selector (more than one field)', () => {
  const out = projectDaisAppealWorkflow(req({ appealId: 'A-1', parcelId: 'P-1' }), res([]));
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'invalid-selector');
});

test('rejects a record that does not match the selector', () => {
  const out = projectDaisAppealWorkflow(req({ parcelId: 'P-1' }), res([{ ...baseAppeal, parcelId: 'P-OTHER' }]));
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'selector-mismatch');
});

test('does not mutate or leak input fields into the projection', () => {
  const out = projectDaisAppealWorkflow(req({ appealId: 'A-1' }), res([{ ...baseAppeal }]));
  assert.deepEqual(Object.keys(out.appeals[0]).sort(), ['appealId', 'filedAt', 'ground', 'parcelId', 'status', 'taxYear']);
});
```

## FILE 3 (E2) — `scripts/verify-dais-appeal-workflow.mjs`

```js
// scripts/verify-dais-appeal-workflow.mjs
//
// Hash-pinned parity verifier for the standalone Dais suite. Consumes the local
// hash-pinned copy of the sovereign-frozen `dais.appeal-workflow@1.0.0` synthetic
// corpus and asserts the built-fresh projection module agrees on every
// accept/reject verdict. No network, persistence, provider, or OS runtime.
//
// Exit 0 iff: every fixture's SHA-256 equals its pin AND the projection verdict
// equals its expected accept/reject. Any mismatch exits 1.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { projectDaisAppealWorkflow } from '../src/appeal-workflow/project-dais-appeal-workflow.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const compatDir = join(here, '..', 'contract-compat', 'dais.appeal-workflow.v1');
const fixturesDir = join(compatDir, 'fixtures');

export function runVerification() {
  const manifest = JSON.parse(readFileSync(join(compatDir, 'fixtures.manifest.json'), 'utf8'));
  const results = [];

  // Contract schema blob must match its sovereign pin (consumed, not owned).
  const schemaBytes = readFileSync(join(compatDir, manifest.schema.path));
  const schemaHash = createHash('sha256').update(schemaBytes).digest('hex');
  const schemaOk = schemaHash === manifest.schema.sha256;
  results.push({ name: 'schema-pin', hashOk: schemaOk, verdictOk: true, expect: 'pin', got: schemaOk ? 'pin' : 'MISMATCH' });

  for (const entry of manifest.fixtures) {
    const bytes = readFileSync(join(fixturesDir, `dais.appeal-workflow.v1.${entry.name}.synthetic.json`));
    const hash = createHash('sha256').update(bytes).digest('hex');
    const hashOk = hash === entry.sha256;
    const doc = JSON.parse(bytes.toString('utf8'));
    const res = projectDaisAppealWorkflow(doc.request, doc.result);
    const got = res.ok ? 'accept' : 'reject';
    results.push({ name: entry.name, hashOk, verdictOk: got === entry.expect, expect: entry.expect, got, reason: res.reason });
  }

  const positives = manifest.fixtures.filter((f) => f.expect === 'accept').length;
  const negatives = manifest.fixtures.filter((f) => f.expect === 'reject').length;
  const failed = results.filter((r) => !r.hashOk || !r.verdictOk);
  return { results, positives, negatives, ok: failed.length === 0, failed };
}

// Run directly (not when imported by the test file).
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

## FILE 4 (E2) — `scripts/verify-dais-appeal-workflow.test.mjs`

```js
// scripts/verify-dais-appeal-workflow.test.mjs
// Proves the hash-pinned verifier: every fixture hash matches its pin and every
// accept/reject verdict matches its manifest expectation (3 positive / 6 negative).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runVerification } from './verify-dais-appeal-workflow.mjs';

test('all fixture hashes match their sovereign pins', () => {
  const { results } = runVerification();
  for (const r of results) assert.equal(r.hashOk, true, `hash pin failed: ${r.name}`);
});

test('projection verdicts match every fixture expectation', () => {
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

## FILE 5 (E2) — `contract-compat/dais.appeal-workflow.v1/fixtures.manifest.json`

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

## FILE 6 — `canon/CONTRACT_DEPENDENCY.md`

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

The suite owns only a provider-neutral read-only projection/validation of the already-validated contract
behavior plus its verifier and a hash-pinned fixture copy. The OS retains all auth, workbench, launching,
persistence, PACS/providers, county/runtime, write-lane (TFR-028), audit trace (TFR-027), and mutations.
Contract changes originate sovereign-side and re-pin here; this repo never mutates the contract.
```

## FILE 7 — `operations/work-orders/WO-SR-005C-E2-dais-standalone-synthetic-contract-parity.md`

```markdown
# WO-SR-005C-E2 - Dais Standalone Synthetic Contract Parity

| Field | Value |
| --- | --- |
| Status | READY (execute in bsvalues/terrafusion-dais) |
| Dependency | WO-SR-005C-E3 = PASS_NO_DIRECT_EXTRACTION (sovereign #1355) |
| Scope | Hash-pinned local copy of the 9 sovereign-frozen synthetic fixtures + schema; a verifier that proves 3-accept/6-reject parity. No providers, persistence, runtime, county, or network. |

## Allowed files
- contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json (hash-pinned copy)
- contract-compat/dais.appeal-workflow.v1/fixtures/dais.appeal-workflow.v1.*.synthetic.json (9 hash-pinned copies)
- contract-compat/dais.appeal-workflow.v1/fixtures.manifest.json
- scripts/verify-dais-appeal-workflow.mjs
- scripts/verify-dais-appeal-workflow.test.mjs
- canon/CONTRACT_DEPENDENCY.md

## Gate
- node scripts/verify-dais-appeal-workflow.mjs  → 3 positive / 6 negative, PARITY OK; all SHA-256 equal the pins
- node --test scripts/verify-dais-appeal-workflow.test.mjs → 3/3

## No-touch
No DTO source copy, no contract mutation, no package.json/lockfile, no .github/workflows/**, no provider,
no network, no persistence, no auth, no runtime consumer, no county/PACS/SQL, no credential, no cutover.
```

## FILE 8 — `operations/work-orders/WO-SR-005C-F1-dais-standalone-appeal-workflow-foundation.md`

```markdown
# WO-SR-005C-F1 - Dais Standalone Appeal-Workflow Foundation

| Field | Value |
| --- | --- |
| Status | READY (execute in bsvalues/terrafusion-dais, after E2) |
| Dependency | WO-SR-005C-E2 parity green |
| Scope | Build-fresh, offline, unwired provider-neutral read-only projection module + direct product tests; the verifier consumes the product module (no duplicated logic). |

## Allowed files
- src/appeal-workflow/project-dais-appeal-workflow.mjs
- test/project-dais-appeal-workflow.test.mjs
- (verifier from E2 imports the module instead of retaining duplicate logic)
- operations/work-orders/WO-SR-005C-F1-*.md
- operations/evidence/WO-SR-005C-F1-*.md
- AGENTS.md (only if absent)

## Gate
- node --test test/project-dais-appeal-workflow.test.mjs → 10/10
- node scripts/verify-dais-appeal-workflow.mjs → PARITY OK (verifier now imports the product module)

## No-touch
No writeLane, no terraTrace, no network, no persistence, no auth, no provider, no county/PACS/SQL, no
runtime consumer, no OS code, no package.json/lockfile, no .github/workflows/**, no contract mutation,
no sovereign source copy, no Git-history import, no cutover.
```

## FILE 9 — `operations/evidence/WO-SR-005C-E2-DAIS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md` (fill on execution)

```markdown
# WO-SR-005C-E2 - Dais Standalone Synthetic Contract Parity Evidence

## Result
PASS_STANDALONE_SYNTHETIC_PARITY — <suite PR #> merged at <sha>.

## Validation
| Gate | Result |
| --- | --- |
| node scripts/verify-dais-appeal-workflow.mjs | PASS — 3 positive / 6 negative, PARITY OK |
| node --test scripts/verify-dais-appeal-workflow.test.mjs | PASS — 3/3 |
| 9 fixture SHA-256 vs sovereign pins | MATCH — 9/9 |
| git diff --check / exact-file scope | PASS |

## Non-claims
No providers, persistence, runtime, county, PACS, SQL, credential, package, workflow, deployment, or
cutover changed. The frozen contract stayed sovereign-owned and hash-pinned.
```

## FILE 10 — `operations/evidence/WO-SR-005C-F1-DAIS-STANDALONE-APPEAL-WORKFLOW-FOUNDATION.md` (fill on execution)

```markdown
# WO-SR-005C-F1 - Dais Standalone Appeal-Workflow Foundation Evidence

## Result
PASS_BUILT_FRESH_STANDALONE_FOUNDATION — <suite PR #> merged at <sha>. Module offline, dependency-free, unwired.

## Delivered scope
- src/appeal-workflow/project-dais-appeal-workflow.mjs owns selector validation, county-match,
  selector-match, closed ground/status enforcement, cross-lane rejection, and empty-result truth.
- test/project-dais-appeal-workflow.test.mjs directly proves the product module (10/10).
- The verifier imports the product module instead of retaining duplicate logic.

## Validation
| Gate | Result |
| --- | --- |
| node --test test/project-dais-appeal-workflow.test.mjs | PASS — 10/10 |
| node scripts/verify-dais-appeal-workflow.mjs | PASS — 3 positive / 6 negative, PARITY OK |
| Frozen dais.appeal-workflow@1.0.0 blobs unchanged | PASS |

## Non-claims
F1 does not make Dais live, adopt a provider, transfer contract ownership, or authorize runtime
integration / WO-SR-006 cutover. It proves only the built-fresh standalone projection foundation.
```

## Parity And Negative Proof (the contract of both slices)

Sovereign and standalone verifiers consume the **same** hash-pinned 9-fixture corpus and agree on every
verdict: **3 positive** (`filed-by-parcel`, `decided-by-id`, `empty-by-tax-year`) and **6 negative**
(`county-mismatch`, `missing-county`, `invalid-status`, `cross-lane-fields`, `ambiguous-selector`,
`selector-mismatch`). Confirmed locally in the authoring sandbox against the exact embedded sources.

## Execution steps for a dais-capable context (or this session once terrafusion-dais is in scope)

1. Clone/checkout `bsvalues/terrafusion-dais` `main`.
2. Create the E2 tree: contract-compat schema + 9 fixtures via the hash-pinned copy block above; add
   `fixtures.manifest.json`, `scripts/verify-dais-appeal-workflow.mjs`, `scripts/verify-dais-appeal-workflow.test.mjs`,
   `canon/CONTRACT_DEPENDENCY.md`, and the `WO-SR-005C-E2` work-order + evidence files. Run both E2 gates.
   Open a draft PR, fill the E2 evidence, merge on green. (Note: at E2 the verifier can point at a stub
   or the F1 module; land F1 in the same or the next PR so the verifier imports the product module.)
3. Create the F1 tree: `src/appeal-workflow/project-dais-appeal-workflow.mjs`,
   `test/project-dais-appeal-workflow.test.mjs`, `AGENTS.md` (if absent), and the `WO-SR-005C-F1`
   work-order + evidence files; ensure the verifier imports the product module. Run all gates. Open a
   draft PR, fill the F1 evidence, merge on green.
4. Return to `bsvalues/terrafusion_os_1.0` and record the suite merge SHAs in this WO's evidence
   (mirroring how Atlas `WO-SR-005B-F1` recorded `6c530f1b`), then advance the program.

## Non-Claims

- No write to `bsvalues/terrafusion-dais` (or any external repo) was performed by this session.
- No frozen contract artifact was modified; the DTO and schema stay sovereign-owned.
- No sovereign product source was copied and no Git history was imported.
- No provider, county, PACS, SQL, persistence, credential, runtime, package, lockfile, workflow,
  deployment, or cutover resource was touched.
- This package authorizes only the fresh-build E2/F1 slices in the suite repo; it does not adopt any
  runtime or authorize WO-SR-006 source-ownership cutover / duplicate retirement.

## Rollback

Sovereign-side, revert-only and repo-local (`git revert` of this docs commit); it changes no sovereign
source and no contract. Suite-side, rollback is a repo-local revert of the E2/F1 merges (the module has
no runtime consumer or external dependency), touching no sovereign base or protected resource.

## Next

Execute the package in `bsvalues/terrafusion-dais` (E2 → F1) via a dais-capable context, or add
`terrafusion-dais` to this session's allowed-repos scope and this session will execute it directly.
Then reconcile the suite merge SHAs into this evidence and advance to the next suite (Dossier E3) or the
`WO-SR-005C` parity/adoption gate.
