import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

/**
 * Phase 133 leak guard — QuantumConsciousnessManager.tsx
 */
describe('QuantumConsciousnessManager.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const repoRoot = process.cwd();
    const rel =
      'frontend/apps/os-shell/src/components/consciousness/QuantumConsciousnessManager.tsx';

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'QuantumConsciousnessManager.tsx' });
  });
});
