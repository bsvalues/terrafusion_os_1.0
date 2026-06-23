import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('os-canon is declared as in-shell OS feature', async () => {
  const raw = await readFile(new URL('../config/launch-surface-contract.json', import.meta.url), 'utf8');
  const contract = JSON.parse(raw);
  const canon = contract.surfaces.find((surface) => surface.targetId === 'os-canon');

  assert.ok(canon, 'os-canon surface must exist');
  assert.equal(canon.surfaceType, 'OS Feature');
  assert.equal(canon.sizing, 'near-full-stage');
  assert.equal(canon.owner, 'OS Core');
  assert.equal(canon.launchMethod, 'activateModule');
});
