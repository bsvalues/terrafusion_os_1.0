import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const manifest = JSON.parse(
  readFileSync(resolve(repositoryRoot, 'tools/registry/terrapilot.tools.json'), 'utf8'),
);
const maturity = JSON.parse(
  readFileSync(resolve(repositoryRoot, 'tools/registry/tool-maturity.json'), 'utf8'),
);
const officeRegistrySource = readFileSync(
  resolve(repositoryRoot, 'os-platform/core/pilot/office-registry.ts'),
  'utf8',
);
const handlerTypeScript = readFileSync(
  resolve(repositoryRoot, 'os-platform/core/pilot/handlers.real.ts'),
  'utf8',
);
const handlerJavaScript = readFileSync(
  resolve(repositoryRoot, 'os-platform/core/pilot/handlers.real.js'),
  'utf8',
);

describe('Dais hearing scheduling availability retirement', () => {
  it('does not advertise schedule_boe_hearing in canonical runtime registries', () => {
    assert.equal(manifest.tools.some((tool) => tool.toolId === 'schedule_boe_hearing'), false);
    assert.equal(maturity.tools.some((tool) => tool.toolId === 'schedule_boe_hearing'), false);
    assert.equal(officeRegistrySource.includes('schedule_boe_hearing'), false);
  });

  it('does not register a real handler for the retired write path', () => {
    assert.equal(handlerTypeScript.includes('schedule_boe_hearing'), false);
    assert.equal(handlerJavaScript.includes('schedule_boe_hearing'), false);
  });
});
