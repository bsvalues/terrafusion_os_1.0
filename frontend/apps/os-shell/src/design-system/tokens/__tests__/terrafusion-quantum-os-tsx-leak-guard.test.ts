import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TSX_PATH = resolve(__dirname, '../../../TerraFusionQuantumOS.tsx');

describe('TerraFusionQuantumOS.tsx leak guard', () => {
  test('contains no raw color values', () => {
    const content = readFileSync(TSX_PATH, 'utf8');
    assertNoRawColorLeaks(content, { label: 'TerraFusionQuantumOS.tsx' });
  });
});
