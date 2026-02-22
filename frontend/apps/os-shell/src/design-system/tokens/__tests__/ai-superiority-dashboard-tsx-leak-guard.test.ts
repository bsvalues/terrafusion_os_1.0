import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import fs from 'node:fs';
import path from 'node:path';

describe('AISuperiorityDashboard.tsx – raw-color leak guard', () => {
  it('contains zero disallowed raw color literals', () => {
    const file = path.resolve(__dirname, '../../../components/AISuperiorityDashboard.tsx');
    const content = fs.readFileSync(file, 'utf8');
    assertNoRawColorLeaks(content, { label: 'AISuperiorityDashboard.tsx' });
  });
});
