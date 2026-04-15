import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// compact = icon-only taskbar (DEFAULT — acts like OS taskbar)
// expanded = taskbar + label panel
// hidden   = completely gone, edge strip shows
export type SidebarMode = 'compact' | 'expanded' | 'hidden';

interface SidebarContextType {
  mode: SidebarMode;
  setMode: (mode: SidebarMode) => void;
  cycleMode: () => void;
  // Legacy compat — derived
  isExpanded: boolean;
  isPinned: boolean;
  toggleExpanded: () => void;
  togglePinned: () => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
  toggleSidebar: () => void;
}

const STORAGE_KEY = 'costforge:sidebar-mode';

function loadMode(): SidebarMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'compact' || saved === 'expanded' || saved === 'hidden') return saved;
  } catch {}
  return 'compact';
}

const SidebarContext = createContext<SidebarContextType>({
  mode: 'compact', setMode: () => {}, cycleMode: () => {},
  isExpanded: false, isPinned: false,
  toggleExpanded: () => {}, togglePinned: () => {},
  expandSidebar: () => {}, collapseSidebar: () => {}, toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const CYCLE: SidebarMode[] = ['compact', 'expanded', 'hidden'];

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<SidebarMode>(loadMode);

  const setMode = useCallback((next: SidebarMode) => {
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  const cycleMode = useCallback(() => {
    setModeState(prev => {
      const next = CYCLE[(CYCLE.indexOf(prev) + 1) % CYCLE.length];
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  const isExpanded = mode === 'expanded';
  const isPinned   = mode !== 'hidden';

  const toggleExpanded  = useCallback(() => setMode(mode === 'expanded' ? 'compact' : 'expanded'), [mode, setMode]);
  const togglePinned    = useCallback(() => setMode(mode === 'hidden' ? 'compact' : 'hidden'), [mode, setMode]);
  const expandSidebar   = useCallback(() => setMode('expanded'), [setMode]);
  const collapseSidebar = useCallback(() => setMode('compact'), [setMode]);
  const toggleSidebar   = toggleExpanded;

  return (
    <SidebarContext.Provider value={{
      mode, setMode, cycleMode,
      isExpanded, isPinned,
      toggleExpanded, togglePinned,
      expandSidebar, collapseSidebar, toggleSidebar,
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
