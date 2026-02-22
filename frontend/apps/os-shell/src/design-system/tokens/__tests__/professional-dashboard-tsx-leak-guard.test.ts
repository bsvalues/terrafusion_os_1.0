import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

describe('ProfessionalDashboard.tsx token leak guard', () => {
  it('contains no raw color values', () => {
    assertNoRawColorLeaks(
      resolve(__dirname, '../../../../src/components/layout/ProfessionalDashboard.tsx'),
    );
  });
});
