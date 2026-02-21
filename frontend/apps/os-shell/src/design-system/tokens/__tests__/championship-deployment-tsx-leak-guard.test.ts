import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('ChampionshipDeployment.tsx – token-leak guard', () => {
  it('contains zero raw color literals', () => {
    assertNoRawColorLeaks(
      resolve(__dirname, '../../../../src/components/ChampionshipDeployment.tsx')
    );
  });
});
