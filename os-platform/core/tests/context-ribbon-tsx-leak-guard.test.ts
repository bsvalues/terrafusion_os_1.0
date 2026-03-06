import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('ContextRibbon.tsx leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.resolve(
      __dirname,
      '../../..',
      'frontend/apps/os-shell/src/components/workbench/ContextRibbon.tsx',
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'ContextRibbon.tsx' });
  });
});
