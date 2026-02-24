import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('AdvancedCodexDashboard.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.resolve(
      __dirname,
      '../../..',
      'frontend/apps/os-shell/src/components/codex/AdvancedCodexDashboard.tsx',
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'AdvancedCodexDashboard.tsx' });
  });
});
