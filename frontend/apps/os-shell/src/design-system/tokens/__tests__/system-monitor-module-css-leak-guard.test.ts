import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('SystemMonitor.module.css – token-leak guard', () => {
  it('contains zero raw color literals', () => {
    assertNoRawColorLeaks(
      resolve(__dirname, '../../../../src/components/admin/SystemMonitor.module.css')
    );
  });
});
