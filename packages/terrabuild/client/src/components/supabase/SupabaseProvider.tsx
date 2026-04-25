/**
 * SupabaseProvider — DEAD STUB
 *
 * Supabase was removed from TerraFusion CostForge. This file stubs the
 * provider and hook so the build doesn't break on remaining import sites.
 * No @supabase/supabase-js import — the package was removed.
 */

import React, { createContext, useContext } from 'react';

interface SupabaseContextType {
  supabase: null;
  user: null;
  session: null;
  isLoading: boolean;
  error: null;
  isConfigured: boolean;
  connectionStatus: 'connected' | 'error' | 'unconfigured' | 'connecting' | 'partial';
  checkConnection: () => Promise<boolean>;
  diagnostics: string[];
  verifyServices: () => Promise<object>;
}

const defaultContext: SupabaseContextType = {
  supabase: null,
  user: null,
  session: null,
  isLoading: false,
  error: null,
  isConfigured: false,
  connectionStatus: 'unconfigured' as const,
  checkConnection: async () => false,
  diagnostics: [],
  verifyServices: async () => ({}),
};

const SupabaseContext = createContext<SupabaseContextType>(defaultContext);

export const useSupabase = () => useContext(SupabaseContext);

interface SupabaseProviderProps {
  children: React.ReactNode;
}

const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => (
  <SupabaseContext.Provider value={defaultContext}>
    {children}
  </SupabaseContext.Provider>
);

export default SupabaseProvider;
