import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { computeStagedException, isStagedException } from './reserved-staging-exception.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const realRegister = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'docs/brain/canon/reserved-staging.json'), 'utf8')
);

test('real register → exception active, exactly the 19 recorded tool IDs', () => {
  const ex = computeStagedException(realRegister);
  assert.equal(ex.active, true, 'forward-staged + both gates recorded → active');
  assert.equal(ex.toolIds.size, 19, 'exactly 19 staged tool IDs');
});

test('exempts ONLY exact listed tool IDs (a fake reserved tool is NOT exempt)', () => {
  const ex = computeStagedException(realRegister);
  assert.equal(isStagedException({ toolId: 'record_document', suite: 'clerk' }, ex), true);
  assert.equal(isStagedException({ toolId: 'initiate_tax_sale', suite: 'treasury' }, ex), true);
  // a NEW reserved-suite tool not in the register must still be validated (fail), not exempted
  assert.equal(isStagedException({ toolId: 'seize_property', suite: 'treasury' }, ex), false);
});

test('removing forward-staged status deactivates the exception', () => {
  const ex = computeStagedException({ ...realRegister, status: 'active' });
  assert.equal(ex.active, false);
  assert.equal(isStagedException({ toolId: 'record_document' }, ex), false);
});

test('removing either exposure gate deactivates the exception', () => {
  const noRuntime = computeStagedException({ ...realRegister, gate: { frontend: {} } });
  assert.equal(noRuntime.active, false, 'missing runtime gate → inactive');
  const noFrontend = computeStagedException({ ...realRegister, gate: { runtime: {} } });
  assert.equal(noFrontend.active, false, 'missing frontend gate → inactive');
});

test('missing/empty register → no exemption (fails safe)', () => {
  const ex = computeStagedException(undefined);
  assert.equal(ex.active, false);
  assert.equal(ex.toolIds.size, 0);
});
