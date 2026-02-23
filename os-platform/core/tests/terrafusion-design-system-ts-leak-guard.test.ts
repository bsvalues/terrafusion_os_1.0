import { describe, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('terrafusion-design-system.ts leak guard', () => {
  it('contains no raw color values', () => {
    assertNoRawColorLeaks('frontend/apps/os-shell/src/components/terrafusion-design-system.ts');
  });
});
