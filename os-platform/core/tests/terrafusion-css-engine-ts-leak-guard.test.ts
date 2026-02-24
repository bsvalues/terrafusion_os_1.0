import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('TerraFusionCSSEngine.ts leak guard', () => {
  it('contains no raw color values', () => {
    const filePath = path.resolve(
      __dirname,
      '../../..',
      'frontend/apps/os-shell/src/services/TerraFusionCSSEngine.ts',
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    assertNoRawColorLeaks(content, { label: 'TerraFusionCSSEngine.ts' });
  });
});
