/**
 * TerraFusion OS — Workbench Tab Context
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides parcel data to workbench tab components in both modes:
 *  - Route-based workbench: data flows via React Router <Outlet context={...}>
 *  - Window-adapter mode:   data flows via WorkbenchTabProvider (no Router needed)
 *
 * Tab components call useWorkbenchTab() which checks both sources.
 *
 * @see PropertyWorkbenchWindow.tsx — Window adapter (provides WorkbenchTabProvider)
 * @see Router.tsx — Route-based workbench (provides Outlet context)
 */

import { createContext, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { WorkMode } from '../contracts/workbench';

// ============================================================================
// Types
// ============================================================================

export interface WorkbenchTabData {
  parcelId: string;
  propertyData: {
    parcelId: string;
    address: string;
    owner: string;
    assessedValue: number;
    marketValue: number;
    landValue: number;
    improvementValue: number;
    propertyType: string;
    legalDescription: string;
    source: string;
  };
  /** Current work mode — tabs can adapt their UI per mode */
  workMode: WorkMode;
}

// ============================================================================
// Context (used by PropertyWorkbenchWindow — window-adapter mode)
// ============================================================================

export const WorkbenchTabCtx = createContext<WorkbenchTabData | null>(null);

// ============================================================================
// Hook — works in both Router and non-Router contexts
// ============================================================================

/**
 * Returns `{ parcelId, propertyData }` for the current workbench tab.
 *
 * Resolution order:
 * 1. WorkbenchTabCtx — set by PropertyWorkbenchWindow (window adapter)
 * 2. React Router Outlet context — set by route-based workbench layout
 *
 * Both hooks are called unconditionally (rules of hooks).
 * If neither context is available, throws (developer error).
 */
export function useWorkbenchTab(): WorkbenchTabData {
  // Window-adapter mode (PropertyWorkbenchWindow wraps in WorkbenchTabCtx.Provider)
  const windowCtx = useContext(WorkbenchTabCtx);

  // Route-based mode (Outlet context from React Router layout)
  // useOutletContext internally is just React.useContext() — safe to call
  // even without a Router in the tree (returns null).
  const outletCtx = useOutletContext<WorkbenchTabData | null>();

  if (windowCtx) return windowCtx;
  if (outletCtx) return outletCtx;

  throw new Error(
    'useWorkbenchTab: must be used inside WorkbenchTabProvider or React Router Outlet'
  );
}
