import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CANON_DIR = join(__dirname, '..', '..', '..', 'frontend', 'apps', 'os-shell', 'src', 'canon');
function readSource(r) { return readFileSync(join(CANON_DIR, r), 'utf-8'); }
describe('TerraCanon UI Import Tripwire — core contract convergence', () => {
  it('CanonModuleHost imports WorkspaceModule types from os-platform/core', () => {
    assert.match(readSource('CanonModuleHost.tsx'), /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/os-platform\/core\/types\/workspaceModule/);
  });
  it('layoutPersistence imports from os-platform/core/canon/layoutEnvelope', () => {
    assert.match(readSource('layoutPersistence.ts'), /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/os-platform\/core\/canon\/layoutEnvelope/);
  });
  it('BuiltinNoopModule imports WorkspaceModule from os-platform/core', () => {
    assert.match(readSource(join('modules', 'BuiltinNoopModule.ts')), /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/os-platform\/core\/types\/workspaceModule/);
  });
  it('layoutPersistence does NOT contain a local envelope implementation', () => {
    assert.doesNotMatch(readSource('layoutPersistence.ts'), /interface LayoutEnvelopeV1/);
  });
  it('CanonModuleHost does NOT define its own WorkspaceModule type', () => {
    assert.doesNotMatch(readSource('CanonModuleHost.tsx'), /export interface WorkspaceModule/);
    assert.doesNotMatch(readSource('CanonModuleHost.tsx'), /export type WorkspaceModule/);
  });
});
