import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import fs from 'node:fs';
import path from 'node:path';

describe('WindowManager.tsx – raw-color leak guard', () => {
  it('contains zero disallowed raw color literals', () => {
    const file = path.resolve(
      __dirname,
      '../../../shell/WindowManager.tsx',
    );
    const content = fs.readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'WindowManager.tsx' });
  });
});
