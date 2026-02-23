import { describe, it } from 'vitest';
import { assertNoRawColorLeaks } from '../../../tools/ui-tokens/leak-guard';

describe('DashboardWidgets.css leak guard', () => {
  it('contains no raw color values', () => {
    assertNoRawColorLeaks(
      'frontend/apps/os-shell/src/components/dashboard/DashboardWidgets.css'
    );
  });
});
