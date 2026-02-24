import fs from 'node:fs';
import path from 'node:path';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('ProfessionalHeader.tsx leak guard', () => {
  it('contains no raw color values (hex, rgba, or raw hsl without var())', () => {
    const file = path.join(
      process.cwd(),
      'frontend/apps/os-shell/src/components/layout/ProfessionalHeader.tsx'
    );
    const content = fs.readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'ProfessionalHeader.tsx' });
  });
});
