import { createContext, ReactNode, useContext, useState } from 'react';

export type OSMode = 'L3' | 'L6' | 'L9';

interface OSModeState {
  mode: OSMode;
  setMode: (mode: OSMode) => void;
}

const OSModeContext = createContext<OSModeState | undefined>(undefined);

export const OSModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<OSMode>('L3'); // default: Foundation

  return <OSModeContext.Provider value={{ mode, setMode }}>{children}</OSModeContext.Provider>;
};

export const useOSMode = (): OSModeState => {
  const ctx = useContext(OSModeContext);
  if (!ctx) {
    throw new Error('useOSMode must be used within OSModeProvider');
  }
  return ctx;
};
