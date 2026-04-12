/**
 * OsContext — receives context from TerraFusion OS AppFrame via postMessage.
 *
 * Wire contract: packages/tf-sdk/src/index.ts (LaunchMessage)
 *
 * When CostForge is loaded inside an AppFrame iframe, the OS shell sends:
 *   iframeRef.contentWindow.postMessage({
 *     type: 'TF_LAUNCH',
 *     parcel: { parcelId, countyId, assessmentYear },
 *     user: { username, role, countyId }   ← extended for OS-native auth
 *   }, '*')
 *
 * Auth is handled entirely by TerraFusion OS. CostForge trusts the OS identity.
 * In dev mode (no OS shell), a default dev user is provided so the app works standalone.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

interface OsUser {
  username: string;
  role: string;
  countyId: string;
}

interface OsContextValue {
  // Parcel context (from OS launch)
  parcelId: string | null;
  countyId: string | null;
  assessmentYear: number | null;
  // User identity (from OS launch — replaces TerraBuild's own auth)
  osUser: OsUser | null;
  isOsAuthenticated: boolean;
}

const DEV_USER: OsUser = {
  username: 'dev-assessor',
  role: 'admin',
  countyId: 'benton',
};

const isDev = import.meta.env.DEV;

const OsContext = createContext<OsContextValue>({
  parcelId: null,
  countyId: null,
  assessmentYear: null,
  osUser: isDev ? DEV_USER : null,
  isOsAuthenticated: isDev,
});

export function OsContextProvider({ children }: { children: React.ReactNode }) {
  // Seed parcelId from URL query params so /calculator?parcelId=X works without postMessage
  const urlParams = new URLSearchParams(window.location.search);
  const [parcelId, setParcelId] = useState<string | null>(urlParams.get('parcelId'));
  const [countyId, setCountyId] = useState<string | null>(null);
  const [assessmentYear, setAssessmentYear] = useState<number | null>(null);
  // In dev, auto-authenticate with a dev user. In production, wait for TF_LAUNCH.
  const [osUser, setOsUser] = useState<OsUser | null>(isDev ? DEV_USER : null);
  const [isOsAuthenticated, setIsOsAuthenticated] = useState<boolean>(isDev);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Only accept TF_LAUNCH messages (canonical type from tf-sdk LaunchMessage)
      if (e.data?.type !== 'TF_LAUNCH') return;

      // Parcel context
      const parcel = e.data.parcel;
      if (parcel?.parcelId) {
        setParcelId(String(parcel.parcelId));
        setCountyId(parcel.countyId ? String(parcel.countyId) : null);
        setAssessmentYear(typeof parcel.assessmentYear === 'number' ? parcel.assessmentYear : null);
      }

      // User identity — trust the OS. If user field present, we're authenticated.
      const user = e.data.user;
      if (user?.username) {
        setOsUser({
          username: String(user.username),
          role: String(user.role ?? 'assessor'),
          countyId: String(user.countyId ?? parcel?.countyId ?? 'benton'),
        });
        setIsOsAuthenticated(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <OsContext.Provider value={{ parcelId, countyId, assessmentYear, osUser, isOsAuthenticated }}>
      {children}
    </OsContext.Provider>
  );
}

export function useOsContext(): OsContextValue {
  return useContext(OsContext);
}
