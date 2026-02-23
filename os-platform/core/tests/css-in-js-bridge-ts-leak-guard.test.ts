import { describe, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('css-in-js-bridge.ts leak guard', () => {
  it('contains no raw color values', () => {
    assertNoRawColorLeaks('frontend/apps/os-shell/src/styles/css-in-js-bridge.ts');
  });
});
