import { describe, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('DevelopmentModeIndicator.css leak guard', () => {
  it('contains no raw color values', () => {
    assertNoRawColorLeaks(
      'frontend/apps/os-shell/src/components/transparency/DevelopmentModeIndicator.css'
    );
  });
});
