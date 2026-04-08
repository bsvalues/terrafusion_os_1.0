/**
 * TerraFusion OS — Companion Store
 *
 * Manages TerraPilot/TerraMuse companion panel state and the OS context bus.
 *
 * The companion is a system-level service, not a window. It lives as a
 * persistent panel in the shell chrome and subscribes to OS context events
 * to know what the operator is looking at without being told.
 *
 * Context bus fields are written by:
 *   - parcelContext.openWorkbenchWindow() → setActiveParcel()
 *   - Suite activation (Desktop.tsx effect) → setActiveSuite()
 *   - Workbench tab changes → setActiveTab()
 *   - useDevContext hook (Desktop.tsx mount) → setActiveBranch(), setActiveFile(), setBuildStatus()
 *
 * @module stores/companionStore
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export type BuildStatus = 'clean' | 'error' | 'unknown';

export interface CompanionContext {
  /** Parcel currently open in the Workbench, or null if no workbench is open. */
  activeParcelId: string | null;
  /** Suite currently in focus (forge, atlas, dais, dossier, gpt), or null. */
  activeSuite: string | null;
  /** Workbench tab currently active (summary, forge, dais, etc.), or null. */
  activeTab: string | null;
  /** Current git branch, or null if no oracle is available. */
  activeBranch: string | null;
  /** Active file path being edited, or null if no editor context is available. */
  activeFile: string | null;
  /** Current build state — driven by Vite HMR events in dev, 'unknown' in prod. */
  buildStatus: BuildStatus;
}

interface CompanionState extends CompanionContext {
  /** Whether the companion panel is slid open. */
  isOpen: boolean;

  // Panel controls
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Context bus writers
  setActiveParcel: (parcelId: string | null) => void;
  setActiveSuite: (suiteId: string | null) => void;
  setActiveTab: (tabId: string | null) => void;
  setActiveBranch: (branch: string | null) => void;
  setActiveFile: (file: string | null) => void;
  setBuildStatus: (status: BuildStatus) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useCompanionStore = create<CompanionState>((set) => ({
  // Panel state — starts closed
  isOpen: false,

  // Context bus — starts empty / unknown
  activeParcelId: null,
  activeSuite: null,
  activeTab: null,
  activeBranch: null,
  activeFile: null,
  buildStatus: 'unknown',

  // Panel controls
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  // Context bus writers
  setActiveParcel: (parcelId) => set({ activeParcelId: parcelId }),
  setActiveSuite: (suiteId) => set({ activeSuite: suiteId }),
  setActiveTab: (tabId) => set({ activeTab: tabId }),
  setActiveBranch: (branch) => set({ activeBranch: branch }),
  setActiveFile: (file) => set({ activeFile: file }),
  setBuildStatus: (status) => set({ buildStatus: status }),
}));

export default useCompanionStore;
