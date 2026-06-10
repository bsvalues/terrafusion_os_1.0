import { describe, it, expect } from 'vitest';
import {
  WORKBENCH_TABS,
  RESERVED_OFFICE_TAB_IDS,
  applyForwardStagedGate,
} from '../../pages/workbench/PropertyWorkbenchSurface';

/**
 * FU-2A / ADR-0012 / drift D-007: reserved municipal offices (Clerk/Treasury/Audit) are
 * forward-staged, not active in OS 1.0. The rendered nav must hide them by default; an explicit
 * flag (VITE_TF_ENABLE_FORWARD_STAGED_OFFICES=true) previews them. The defining constants and
 * VALID_WORKBENCH_TAB_IDS contract are intentionally left intact (code is forward-staged, not deleted).
 */
describe('reserved municipal office gating (FU-2A)', () => {
  it('hides Clerk/Treasury/Audit tabs by default (flag off)', () => {
    const gated = applyForwardStagedGate(WORKBENCH_TABS, false);
    const ids = gated.map((t) => t.id);
    for (const reserved of RESERVED_OFFICE_TAB_IDS) {
      expect(ids).not.toContain(reserved);
    }
    // canonical 6 (TF-052 §4.1) remain
    expect(ids).toEqual(['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot']);
  });

  it('shows reserved office tabs only when the forward-stage flag is on', () => {
    const ungated = applyForwardStagedGate(WORKBENCH_TABS, true);
    const ids = ungated.map((t) => t.id);
    for (const reserved of RESERVED_OFFICE_TAB_IDS) {
      expect(ids).toContain(reserved);
    }
  });

  it('forward-staged code is preserved: tabs are still DEFINED (not deleted)', () => {
    const definedIds = WORKBENCH_TABS.map((t) => t.id);
    for (const reserved of RESERVED_OFFICE_TAB_IDS) {
      expect(definedIds).toContain(reserved);
    }
  });
});
