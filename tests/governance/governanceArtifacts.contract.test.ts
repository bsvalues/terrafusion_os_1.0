import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

describe('Governance Artifacts Contract', () => {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));

  it('must define ci:governance-proof script', () => {
    const script = packageJson.scripts['ci:governance-proof'];
    expect(script).toBeDefined();
    expect(script).toContain('ci:scope-proof');
    expect(script).toContain('ci:renovate-scope:log');
    expect(script).toContain('ci:governance');
  });

  it('must define ci:governance-proof:log script with artifacts', () => {
    const script = packageJson.scripts['ci:governance-proof:log'];
    expect(script).toBeDefined();
    expect(script).toContain('ci_governance_proof.log');
    expect(script).toContain('>'); // output redirection
  });
});
