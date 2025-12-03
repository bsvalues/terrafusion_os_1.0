/**
 * TerraFusion Native Shell - Dual-Mode Context
 * Manages County Staff ↔ Power User mode switching across the entire application
 */

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type UserMode = 'county-staff' | 'power-user';

interface DualModeContextValue {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
  isCountyStaff: boolean;
  isPowerUser: boolean;
}

const DualModeContext = createContext<DualModeContextValue | undefined>(undefined);

interface DualModeProviderProps {
  children: ReactNode;
  defaultMode?: UserMode;
  persistMode?: boolean;
}

export const DualModeProvider: React.FC<DualModeProviderProps> = ({
  children,
  defaultMode = 'county-staff',
  persistMode = true,
}) => {
  // Load persisted mode from localStorage or use default
  const [mode, setModeState] = useState<UserMode>(() => {
    if (persistMode && typeof window !== 'undefined') {
      const stored = localStorage.getItem('terrafusion-user-mode');
      if (stored === 'county-staff' || stored === 'power-user') {
        return stored;
      }
    }
    return defaultMode;
  });

  // Persist mode changes to localStorage
  const setMode = (newMode: UserMode) => {
    setModeState(newMode);
    if (persistMode && typeof window !== 'undefined') {
      localStorage.setItem('terrafusion-user-mode', newMode);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'county-staff' ? 'power-user' : 'county-staff');
  };

  // Keyboard shortcut: Ctrl+M to toggle mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  const value: DualModeContextValue = {
    mode,
    setMode,
    toggleMode,
    isCountyStaff: mode === 'county-staff',
    isPowerUser: mode === 'power-user',
  };

  return <DualModeContext.Provider value={value}>{children}</DualModeContext.Provider>;
};

export const useDualMode = (): DualModeContextValue => {
  const context = useContext(DualModeContext);
  if (!context) {
    throw new Error('useDualMode must be used within a DualModeProvider');
  }
  return context;
};
