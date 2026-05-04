#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  commandText,
  postDbRefreshChecklist,
  postDbRefreshFullReadinessCommand,
  postDbRefreshPlan,
  postDbRefreshQuickCommand,
} from './post-db-refresh-plan.mjs';

function readPackageScripts() {
  const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  return packageJson.scripts ?? {};
}

function scriptNameFromPnpmRun(command) {
  const match = command.match(/^pnpm run ([^\s]+)$/);
  return match?.[1] ?? null;
}

test('post DB refresh plan is the single source for packet checklist and executable gate', () => {
  assert.equal(postDbRefreshQuickCommand, 'pnpm run truth:post-db-refresh-rerun');
  assert.equal(postDbRefreshFullReadinessCommand, 'pnpm run readiness:june10');
  assert.deepEqual(postDbRefreshPlan.map(commandText), [
    'pnpm run truth:runtime-db-identity',
    'pnpm run truth:runtime-db-content',
    'pnpm run truth:terrafusion-db-product-load-ledger',
    'pnpm run truth:benton-parcel-count-sanity',
    'pnpm run truth:runtime-source-lineage',
    'pnpm run truth:runtime-sale-qualification',
    'pnpm run truth:benton-runtime-pilot-closure',
    'pnpm run truth:june10-readiness-packet',
  ]);
  assert.deepEqual(
    postDbRefreshChecklist().map(item => item.command),
    postDbRefreshPlan.map(commandText)
  );
});

test('post DB refresh package script references exist', () => {
  const scripts = readPackageScripts();
  const commands = [
    postDbRefreshQuickCommand,
    postDbRefreshFullReadinessCommand,
    ...postDbRefreshPlan.map(commandText),
  ];

  for (const command of commands) {
    const scriptName = scriptNameFromPnpmRun(command);
    assert.ok(scriptName, `Expected pnpm run command, got ${command}`);
    assert.ok(scripts[scriptName], `Missing package.json script for ${command}`);
  }
});

test('every executable post DB refresh proof declares artifacts and proof meaning', () => {
  for (const entry of postDbRefreshPlan) {
    assert.ok(entry.name);
    assert.ok(entry.proves);
    assert.ok(Array.isArray(entry.expectedArtifacts));
    assert.ok(entry.expectedArtifacts.length >= 2);
    assert.ok(entry.expectedArtifacts.some(item => item.endsWith('.json')));
    assert.ok(entry.expectedArtifacts.some(item => item.endsWith('.md')));
  }
});
