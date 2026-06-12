import { describe, it, expect } from 'vitest';
import { WORKBENCH_TABS } from '../../pages/workbench/PropertyWorkbenchSurface';

/**
 * Property Workbench product shape: the later 9-tab Workbench is the active surface.
 * The rendered rail must not silently downgrade to 5 or 6 visible tabs.
 */
describe('Property Workbench 9-tab rail contract', () => {
  it('defines the full 9-tab Workbench in canonical order', () => {
    const definedIds = WORKBENCH_TABS.map((t) => t.id);
    expect(definedIds).toEqual([
      'summary',
      'forge',
      'atlas',
      'dais',
      'clerk',
      'treasury',
      'audit',
      'dossier',
      'pilot',
    ]);
  });
});
