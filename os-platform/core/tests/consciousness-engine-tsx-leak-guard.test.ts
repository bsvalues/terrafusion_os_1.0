import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('ConsciousnessEngine.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.resolve(__dirname, '../../..', 'frontend/apps/os-shell/src/components/ai/ConsciousnessEngine.tsx');

    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'ConsciousnessEngine.tsx' });
  });
});
