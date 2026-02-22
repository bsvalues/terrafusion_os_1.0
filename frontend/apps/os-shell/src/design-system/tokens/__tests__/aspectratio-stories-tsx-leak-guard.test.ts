import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';
import { resolve } from 'path';

describe('AspectRatio.stories.tsx token leak guard', () => {
  it('contains no raw color values', () => {
    assertNoRawColorLeaks(
      resolve(__dirname, '../../../../src/components/ui/AspectRatio.stories.tsx')
    );
  });
});
