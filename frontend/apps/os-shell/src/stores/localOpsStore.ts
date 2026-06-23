/**
 * TerraFusion OS — LocalOps Store (WO-LOCALOPS-006.1)
 *
 * Holds the open/closed state of the in-shell TerraPilot LocalOps side panel
 * and the typed `LocalOpsViewModel` it renders. Like the companion store, the
 * LocalOps surface is shell chrome — a persistent panel, not a window — so its
 * visibility lives here rather than in the window/desktop store.
 *
 * Scope note (006.1): this slice mounts and registers the panel. The default
 * view model is the honest `disabled`-profile shape — the live engine→view-model
 * adapter (mapping WO-001..005 outputs onto `LocalOpsViewModel`) is intentionally
 * NOT wired here. A future, separately-approved slice supplies real data through
 * `setData`. The panel performs no API calls, mutation, or shell execution.
 *
 * @module stores/localOpsStore
 */

import { create } from 'zustand';
import type { LocalOpsViewModel } from '../components/localops/LocalOpsPanel';

// ============================================================================
// Default view model — honest "disabled" posture (no live adapter yet)
// ============================================================================

/**
 * The default LocalOps view model. Profile is `disabled` and every boundary
 * flag is off, matching LocalOps doctrine defaults: no external calls, no web,
 * no shell, no mutation; trace + sources required. This is what the panel shows
 * until a live adapter calls `setData`.
 */
export const DEFAULT_LOCALOPS_VIEW_MODEL: LocalOpsViewModel = {
  profile: 'disabled',
  provider: '(none)',
  flags: {
    externalCalls: false,
    allowWeb: false,
    allowShell: false,
    allowMutation: false,
    requireTrace: true,
    requireSources: true,
  },
  providerStatus: { ok: false, status: 'disabled' },
  diagnostics: [],
  grounded: false,
  sources: [],
  traceEvents: [],
};

// ============================================================================
// Store
// ============================================================================

interface LocalOpsState {
  /** Whether the LocalOps side panel is slid open. Starts closed. */
  isOpen: boolean;
  /** The view model rendered by the panel. `null` => engine unavailable. */
  data: LocalOpsViewModel | null;

  // Panel controls
  open: () => void;
  close: () => void;
  toggle: () => void;

  // View-model writer (future live adapter calls this)
  setData: (data: LocalOpsViewModel | null) => void;
}

export const useLocalOpsStore = create<LocalOpsState>((set) => ({
  isOpen: false,
  data: DEFAULT_LOCALOPS_VIEW_MODEL,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  setData: (data) => set({ data }),
}));

export default useLocalOpsStore;
