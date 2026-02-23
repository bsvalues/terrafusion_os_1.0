import { describe, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('SwarmVisualization3D.tsx leak guard', () => {
  it('contains no raw color values', () => {
    assertNoRawColorLeaks(
      'frontend/apps/os-shell/src/components/terra-flow/SwarmVisualization3D.tsx'
    );
  });
});
