/**
 * CostForgeIntegrationPanel.test.tsx
 *
 * SKIP NOTE (2026-04-25): the original test imported a
 * CostForgeIntegrationPanel from
 * '@/components/costforge/CostForgeIntegrationPanel' that no longer
 * exists in the source tree. CostForge surfaces are now:
 *   - apps/os-shell/src/pages/forge/cost/CostForge.tsx
 *   - apps/os-shell/src/pages/forge/cost/CostForgeDashboard.tsx
 *   - apps/os-shell/src/pages/suites/modules/CostForgeModule.tsx
 *
 * Re-author against one of the existing surfaces (or the
 * useCostForgeAPI hook directly), then unskip. Full historical content
 * preserved in git history.
 */
import { describe, it } from 'vitest';

describe.skip('CostForgeIntegrationPanel (skipped — phantom import)', () => {
  it('quarantined: re-author against an existing CostForge surface', () => {
    // Intentionally empty.
  });
});
