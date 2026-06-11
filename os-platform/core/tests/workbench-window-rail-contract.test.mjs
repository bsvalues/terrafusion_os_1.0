import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const WINDOW_PATH = resolve(
  ROOT,
  'frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx',
);
const WINDOW_SRC = readFileSync(WINDOW_PATH, 'utf8');

describe('Property Workbench window chrome contract', () => {
  it('window host renders the shared Workbench surface with the left rail', () => {
    assert.match(
      WINDOW_SRC,
      /PropertyWorkbenchSurface/,
      'canonical window host must reuse PropertyWorkbenchSurface instead of a divergent layout',
    );
    assert.match(
      WINDOW_SRC,
      /<\s*WorkbenchRail\b/,
      'canonical window host must preserve the left-side WorkbenchRail navigation',
    );
  });

  it('window host does not render a duplicate horizontal tab bar', () => {
    assert.doesNotMatch(
      WINDOW_SRC,
      /const\s+TabBar\b/,
      'canonical window host must not own a competing horizontal TabBar implementation',
    );
    assert.doesNotMatch(
      WINDOW_SRC,
      /<\s*TabBar\b/,
      'canonical window host must not render the duplicate horizontal TabBar',
    );
  });
});
