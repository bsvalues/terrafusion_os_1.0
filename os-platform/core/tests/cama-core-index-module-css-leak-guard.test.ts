import { describe, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('index.module.css (cama-core) leak guard', () => {
  it('contains no raw color values', () => {
    assertNoRawColorLeaks('frontend/apps/os-shell/src/plugins/cama-core/index.module.css');
  });
});
