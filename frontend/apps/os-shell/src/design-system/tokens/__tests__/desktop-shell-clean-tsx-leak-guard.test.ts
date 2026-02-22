import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import path from 'path';

describe('DesktopShell.clean.tsx – raw-color leak guard', () => {
  const file = path.resolve(__dirname, '../../../shell/DesktopShell.clean.tsx');

  it('contains zero raw colour tokens', () => {
    assertNoRawColorLeaks(file);
  });
});
