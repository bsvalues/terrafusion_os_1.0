/**
 * LevyModuleContext - provides quantum config and module-level context
 */

import React, { createContext, useContext } from 'react';

export interface QuantumConfig {
  factor: number;
  targetAccuracy: number; // 0..1
  enableQuantumOptimization: boolean;
}

interface LevyModuleContextValue {
  config: QuantumConfig;
}

const LevyModuleContext = createContext<LevyModuleContextValue | undefined>(undefined);

export const LevyModuleProvider: React.FC<{ config: QuantumConfig; children: React.ReactNode }> = ({ config, children }) => {
  return <LevyModuleContext.Provider value={{ config }}>{children}</LevyModuleContext.Provider>;
};

export const useLevyModule = (): LevyModuleContextValue => {
  const ctx = useContext(LevyModuleContext);
  if (!ctx) throw new Error('useLevyModule must be used within a LevyModuleProvider');
  return ctx;
};
