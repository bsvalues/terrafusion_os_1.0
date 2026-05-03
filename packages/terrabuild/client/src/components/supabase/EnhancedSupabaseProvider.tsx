/**
 * EnhancedSupabaseProvider — DEAD STUB
 *
 * Supabase was removed from TerraFusion CostForge. The real backend is
 * TerraFusion.API (.NET) at port 5000. This file exists only to satisfy
 * import references in CostEstimationWizardFixed and BCBSCostCalculatorSimple
 * without crashing the build.
 *
 * All returned values are no-ops / safe defaults.
 * No @supabase/supabase-js import — the package was removed.
 */

import React, { createContext, useContext } from 'react';

// Re-exported so legacy imports of these types don't break.
export type ConnectionStatus = 'connected' | 'partial' | 'error' | 'offline' | 'connecting' | 'unconfigured';

export interface ServiceStatus {
  health?: boolean;
  auth?: boolean;
  database?: boolean;
  storage?: boolean;
  functions?: boolean;
  realtime?: boolean;
  tables?: string[];
  lastChecked?: Date;
}

interface EnhancedSupabaseContextType {
  supabase: null;
  session: null;
  user: null;
  isConfigured: boolean;
  isInitialized: boolean;
  connectionStatus: ConnectionStatus;
  serviceStatus: ServiceStatus | null;
  isOfflineMode: boolean;
  isIndexedDBSupported: boolean;
  pendingSyncChanges: number;
  isSyncing: boolean;
  reconnectionStatus: null;
  diagnostics: string[];
  checkConnection: () => Promise<ConnectionStatus>;
  verifyServices: () => Promise<ServiceStatus>;
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  forceSync: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

const defaultContext: EnhancedSupabaseContextType = {
  supabase: null,
  session: null,
  user: null,
  isConfigured: false,
  isInitialized: true,
  connectionStatus: 'unconfigured',
  serviceStatus: null,
  isOfflineMode: false,
  isIndexedDBSupported: false,
  pendingSyncChanges: 0,
  isSyncing: false,
  reconnectionStatus: null,
  diagnostics: ['Supabase not used — TerraFusion OS module uses .NET API'],
  checkConnection: async () => 'unconfigured',
  verifyServices: async () => ({}),
  enableOfflineMode: () => {},
  disableOfflineMode: () => {},
  forceSync: async () => false,
  refreshSession: async () => {},
};

const EnhancedSupabaseContext = createContext<EnhancedSupabaseContextType>(defaultContext);

interface EnhancedSupabaseProviderProps {
  children: React.ReactNode;
  supabaseUrl?: string;
  supabaseKey?: string;
  offlineMode?: boolean;
  autoConnect?: boolean;
}

/** No-op provider — renders children directly. */
export const EnhancedSupabaseProvider: React.FC<EnhancedSupabaseProviderProps> = ({ children }) => (
  <EnhancedSupabaseContext.Provider value={defaultContext}>
    {children}
  </EnhancedSupabaseContext.Provider>
);

/** Returns safe no-op context. Never throws. */
export const useEnhancedSupabase = (): EnhancedSupabaseContextType => {
  return useContext(EnhancedSupabaseContext);
};

export default EnhancedSupabaseProvider;
