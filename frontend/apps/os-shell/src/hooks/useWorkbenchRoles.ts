/**
 * useWorkbenchRoles.ts
 *
 * Phase 2: Hook that resolves role-based tab visibility for the Property Workbench.
 *
 * Reads roles from WorkbenchContext (currently [] — placeholder for auth integration).
 * Returns visible tab slugs, hidden count, and the showAll override toggle.
 *
 * CONSTITUTIONAL RULES (Doc 0D §Conflict 3):
 *   - Presentation defaults only — never hard-lock
 *   - User override always available (showAll toggle persisted to localStorage)
 *   - Tab order never mutates
 */

import { useCallback, useMemo, useState } from 'react';
import type { WorkbenchTabSlug } from '../contracts/workbench';
import { getVisibleTabs, getHiddenTabs } from '../config/workbenchRoles';

/** localStorage key for the user's "show all tabs" preference */
const SHOW_ALL_KEY = 'tf_workbench_show_all_tabs';

function readShowAll(): boolean {
  try {
    return localStorage.getItem(SHOW_ALL_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeShowAll(value: boolean): void {
  try {
    localStorage.setItem(SHOW_ALL_KEY, String(value));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

export interface UseWorkbenchRolesResult {
  /** Visible tab slugs in locked constitutional order */
  visibleTabs: WorkbenchTabSlug[];
  /** Tabs hidden by role defaults */
  hiddenTabs: WorkbenchTabSlug[];
  /** Number of hidden tabs (for "N more available" badge) */
  hiddenCount: number;
  /** Whether user has toggled "show all tabs" override */
  showAll: boolean;
  /** Toggle the showAll override (persisted to localStorage) */
  toggleShowAll: () => void;
  /** Set showAll explicitly */
  setShowAll: (value: boolean) => void;
}

/**
 * Hook that resolves which workbench tabs are visible based on the user's roles.
 *
 * @param roles - Array of role identifiers from WorkbenchContext.roles[]
 *                Currently [] (no auth integration yet) — shows all tabs by default.
 */
export function useWorkbenchRoles(roles: readonly string[]): UseWorkbenchRolesResult {
  const [showAll, setShowAllState] = useState<boolean>(readShowAll);

  const visibleTabs = useMemo(
    () => getVisibleTabs(roles, { showAll }),
    [roles, showAll]
  );

  const hiddenTabs = useMemo(
    () => getHiddenTabs(roles, { showAll }),
    [roles, showAll]
  );

  const setShowAll = useCallback((value: boolean) => {
    setShowAllState(value);
    writeShowAll(value);
  }, []);

  const toggleShowAll = useCallback(() => {
    setShowAllState((prev) => {
      const next = !prev;
      writeShowAll(next);
      return next;
    });
  }, []);

  return {
    visibleTabs,
    hiddenTabs,
    hiddenCount: hiddenTabs.length,
    showAll,
    toggleShowAll,
    setShowAll,
  };
}
