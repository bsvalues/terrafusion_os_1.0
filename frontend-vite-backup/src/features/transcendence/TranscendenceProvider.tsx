import React, { createContext, useContext, useMemo, useState, Suspense } from 'react';
import { defaultTranscendence, isReducedMotion } from './flags';

const WebGLEffects = React.lazy(() => import('./WebGLEffects'));
const Ctx = createContext<{enabled:boolean; set:(v:boolean)=>void}>({enabled:false, set:()=>{}});
export const useTranscendence = () => useContext(Ctx);

export function TranscendenceProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(!isReducedMotion() && defaultTranscendence);
  const value = useMemo(() => ({ enabled, set: setEnabled }), [enabled]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {enabled && !isReducedMotion() && (
        <Suspense fallback={null}>
          <WebGLEffects />
        </Suspense>
      )}
    </Ctx.Provider>
  );
}