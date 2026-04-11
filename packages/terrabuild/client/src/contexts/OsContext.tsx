/**
 * OsContext — receives parcel context from TerraFusion OS AppFrame via postMessage.
 *
 * Wire contract: packages/tf-sdk/src/index.ts (LaunchMessage)
 *
 * When CostForge is loaded inside an AppFrame iframe, the OS shell sends:
 *   iframeRef.contentWindow.postMessage({ type: 'TF_LAUNCH', parcel: { parcelId, countyId, assessmentYear } }, '*')
 *
 * This context captures that message and makes parcel context available to any
 * component in the terrabuild app (e.g., BCBSCostCalculatorAPI).
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

interface OsContextValue {
  parcelId: string | null;
  countyId: string | null;
  assessmentYear: number | null;
}

const OsContext = createContext<OsContextValue>({ parcelId: null, countyId: null, assessmentYear: null });

export function OsContextProvider({ children }: { children: React.ReactNode }) {
  const [parcelId, setParcelId] = useState<string | null>(null);
  const [countyId, setCountyId] = useState<string | null>(null);
  const [assessmentYear, setAssessmentYear] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Only accept TF_LAUNCH messages (canonical type from tf-sdk LaunchMessage)
      if (e.data?.type !== 'TF_LAUNCH') return;

      const parcel = e.data.parcel;
      if (parcel?.parcelId) {
        setParcelId(String(parcel.parcelId));
        setCountyId(parcel.countyId ? String(parcel.countyId) : null);
        setAssessmentYear(typeof parcel.assessmentYear === 'number' ? parcel.assessmentYear : null);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return <OsContext.Provider value={{ parcelId, countyId, assessmentYear }}>{children}</OsContext.Provider>;
}

export function useOsContext(): OsContextValue {
  return useContext(OsContext);
}
