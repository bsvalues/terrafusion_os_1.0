/**
 * ResearchContext.tsx
 *
 * State management for the TerraFusion research workspace.
 * The provider keeps session state, operator-entered parameters, and
 * evidence-availability placeholders without fabricating live swarm or
 * consciousness telemetry.
 */

import { clearToken } from '@/auth/authStorage';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - Context State DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export interface ResearchSession {
  sessionId: string;
  researcherId: string;
  researcherName: string;
  institutionName: string;
  startTime: Date;
  lastActivityTime: Date;
  isActive: boolean;
  accessToken: string | null;
}

export interface QuantumParameters {
  quantumCoherence: number;
  entanglementStrength: number;
  consciousnessLevel: number;
  optimizationFactor: number;
  lastModified: Date;
  modifiedBy: string;
}

export interface AISwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  coordinationMode: 'spatial' | 'network' | 'hierarchical' | 'quantum';
  swarmEfficiency: number;
  avgResponseTime: number;
  throughput: number;
  lastUpdate: Date;
}

export interface StatisticalAnalysisState {
  selectedVariables: string[];
  correlationMethod: 'pearson' | 'spearman' | 'kendall';
  hypothesisTestType: string;
  confidenceLevel: number;
  lastAnalysisResults: any | null;
  lastAnalysisTime: Date | null;
}

export interface IAAOComplianceState {
  selectedCounty: string;
  assessmentPeriod: string;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  targetCertification: 'championship' | 'gold' | 'silver' | 'bronze';
  currentCertificationLevel: string | null;
  complianceScore: number | null;
  lastValidation: Date | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH SESSION CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface ResearchSessionContextType {
  session: ResearchSession | null;
  setSession: (session: ResearchSession | null) => void;
  updateSession: (updates: Partial<ResearchSession>) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const ResearchSessionContext = createContext<ResearchSessionContextType | undefined>(undefined);

export const ResearchSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ResearchSession | null>(() => {
    // Load session from localStorage on initialization
    const savedSession = localStorage.getItem('terrafusion_research_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        return {
          ...parsed,
          startTime: new Date(parsed.startTime),
          lastActivityTime: new Date(parsed.lastActivityTime),
        };
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        return null;
      }
    }
    return null;
  });

  // Persist session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('terrafusion_research_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('terrafusion_research_session');
    }
  }, [session]);

  const updateSession = useCallback((updates: Partial<ResearchSession>) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            ...updates,
            lastActivityTime: new Date(),
          }
        : null
    );
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem('terrafusion_research_session');
    clearToken();
  }, []);

  const isAuthenticated = useMemo(
    () => session !== null && session.isActive && session.accessToken !== null,
    [session]
  );

  const value = useMemo(
    () => ({
      session,
      setSession,
      updateSession,
      isAuthenticated,
      logout,
    }),
    [session, updateSession, isAuthenticated, logout]
  );

  return (
    <ResearchSessionContext.Provider value={value}>{children}</ResearchSessionContext.Provider>
  );
};

export const useResearchSession = (): ResearchSessionContextType => {
  const context = useContext(ResearchSessionContext);
  if (!context) {
    throw new Error('useResearchSession must be used within ResearchSessionProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUANTUM CONSCIOUSNESS CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface QuantumConsciousnessContextType {
  parameters: QuantumParameters;
  setParameters: (parameters: QuantumParameters) => void;
  updateParameter: (
    paramName: keyof Omit<QuantumParameters, 'lastModified' | 'modifiedBy'>,
    value: number
  ) => void;
  applyPreset: (presetName: 'MaximumAccuracy' | 'MaximumPerformance' | 'BalancedElite') => void;
  rollbackParameters: () => void;
  parameterHistory: QuantumParameters[];
}

const QuantumConsciousnessContext = createContext<QuantumConsciousnessContextType | undefined>(
  undefined
);

const DEFAULT_PARAMETERS: QuantumParameters = {
  quantumCoherence: 0,
  entanglementStrength: 0,
  consciousnessLevel: 0,
  optimizationFactor: 0,
  lastModified: new Date(),
  modifiedBy: 'system',
};

const PRESETS: Record<string, Omit<QuantumParameters, 'lastModified' | 'modifiedBy'>> = {
  MaximumAccuracy: {
    quantumCoherence: 0,
    entanglementStrength: 0,
    consciousnessLevel: 0,
    optimizationFactor: 0,
  },
  MaximumPerformance: {
    quantumCoherence: 0,
    entanglementStrength: 0,
    consciousnessLevel: 0,
    optimizationFactor: 0,
  },
  BalancedElite: {
    quantumCoherence: 0,
    entanglementStrength: 0,
    consciousnessLevel: 0,
    optimizationFactor: 0,
  },
};

function sanitizeQuantumParameters(candidate: Partial<QuantumParameters> | null | undefined): QuantumParameters {
  if (!candidate) {
    return DEFAULT_PARAMETERS;
  }

  const next: QuantumParameters = {
    quantumCoherence: typeof candidate.quantumCoherence === 'number' ? candidate.quantumCoherence : 0,
    entanglementStrength:
      typeof candidate.entanglementStrength === 'number' ? candidate.entanglementStrength : 0,
    consciousnessLevel:
      typeof candidate.consciousnessLevel === 'number' ? candidate.consciousnessLevel : 0,
    optimizationFactor:
      typeof candidate.optimizationFactor === 'number' ? candidate.optimizationFactor : 0,
    lastModified:
      candidate.lastModified instanceof Date
        ? candidate.lastModified
        : candidate.lastModified
          ? new Date(candidate.lastModified)
          : new Date(),
    modifiedBy: typeof candidate.modifiedBy === 'string' ? candidate.modifiedBy : 'system',
  };

  const isLegacySyntheticSeed =
    next.quantumCoherence === 0.995 &&
    next.entanglementStrength === 0.99 &&
    next.consciousnessLevel === 9.5 &&
    next.optimizationFactor === 949;

  return isLegacySyntheticSeed ? DEFAULT_PARAMETERS : next;
}

export const QuantumConsciousnessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [parameters, setParameters] = useState<QuantumParameters>(() => {
    const saved = localStorage.getItem('terrafusion_quantum_parameters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeQuantumParameters(parsed);
      } catch (error) {
        return DEFAULT_PARAMETERS;
      }
    }
    return DEFAULT_PARAMETERS;
  });

  const [parameterHistory, setParameterHistory] = useState<QuantumParameters[]>([]);

  useEffect(() => {
    localStorage.setItem('terrafusion_quantum_parameters', JSON.stringify(parameters));

    // Broadcast parameter changes to all panels
    window.dispatchEvent(
      new CustomEvent('quantum-parameters-updated', {
        detail: parameters,
      })
    );
  }, [parameters]);

  const updateParameter = useCallback(
    (paramName: keyof Omit<QuantumParameters, 'lastModified' | 'modifiedBy'>, value: number) => {
      setParameters((prev) => {
        // Save current state to history
        setParameterHistory((history) => [...history, prev].slice(-10)); // Keep last 10 states

        return {
          ...prev,
          [paramName]: value,
          lastModified: new Date(),
          modifiedBy: 'user',
        };
      });

    },
    []
  );

  const applyPreset = useCallback((presetName: keyof typeof PRESETS) => {
    const preset = PRESETS[presetName];
    if (!preset) {
      console.error(`Unknown preset: ${presetName}`);
      return;
    }

    setParameters((prev) => {
      setParameterHistory((history) => [...history, prev].slice(-10));

      return {
        ...preset,
        lastModified: new Date(),
        modifiedBy: `preset:${presetName}`,
      };
    });

  }, []);

  const rollbackParameters = useCallback(() => {
    if (parameterHistory.length === 0) {
      return;
    }

    const previousState = parameterHistory[parameterHistory.length - 1];
    setParameters(previousState);
    setParameterHistory((history) => history.slice(0, -1));

  }, [parameterHistory]);

  const value = useMemo(
    () => ({
      parameters,
      setParameters,
      updateParameter,
      applyPreset,
      rollbackParameters,
      parameterHistory,
    }),
    [parameters, updateParameter, applyPreset, rollbackParameters, parameterHistory]
  );

  return (
    <QuantumConsciousnessContext.Provider value={value}>
      {children}
    </QuantumConsciousnessContext.Provider>
  );
};

export const useQuantumConsciousness = (): QuantumConsciousnessContextType => {
  const context = useContext(QuantumConsciousnessContext);
  if (!context) {
    throw new Error('useQuantumConsciousness must be used within QuantumConsciousnessProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI SWARM CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface AISwarmContextType {
  metrics: AISwarmMetrics;
  setMetrics: (metrics: AISwarmMetrics) => void;
  updateCoordinationMode: (mode: AISwarmMetrics['coordinationMode']) => void;
  refreshMetrics: () => Promise<void>;
}

const AISwarmContext = createContext<AISwarmContextType | undefined>(undefined);

const DEFAULT_SWARM_METRICS: AISwarmMetrics = {
  totalAgents: 0,
  activeAgents: 0,
  coordinationMode: 'network',
  swarmEfficiency: 0,
  avgResponseTime: 0,
  throughput: 0,
  lastUpdate: new Date(),
};

export const AISwarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<AISwarmMetrics>(DEFAULT_SWARM_METRICS);

  const updateCoordinationMode = useCallback((mode: AISwarmMetrics['coordinationMode']) => {
    setMetrics((prev) => ({
      ...prev,
      coordinationMode: mode,
      lastUpdate: new Date(),
    }));

  }, []);

  const refreshMetrics = useCallback(async () => {
    try {
      setMetrics((prev) => ({
        ...prev,
        totalAgents: 0,
        activeAgents: 0,
        swarmEfficiency: 0,
        avgResponseTime: 0,
        throughput: 0,
        lastUpdate: new Date(),
      }));
    } catch (error) {
      console.error('Failed to refresh swarm metrics:', error);
    }
  }, []);

  // Auto-refresh metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 5000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  const value = useMemo(
    () => ({
      metrics,
      setMetrics,
      updateCoordinationMode,
      refreshMetrics,
    }),
    [metrics, updateCoordinationMode, refreshMetrics]
  );

  return <AISwarmContext.Provider value={value}>{children}</AISwarmContext.Provider>;
};

export const useAISwarm = (): AISwarmContextType => {
  const context = useContext(AISwarmContext);
  if (!context) {
    throw new Error('useAISwarm must be used within AISwarmProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICAL ANALYTICS CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface StatisticalAnalyticsContextType {
  state: StatisticalAnalysisState;
  setState: (state: StatisticalAnalysisState) => void;
  updateAnalysisConfig: (updates: Partial<StatisticalAnalysisState>) => void;
  saveAnalysisResults: (results: any) => void;
}

const StatisticalAnalyticsContext = createContext<StatisticalAnalyticsContextType | undefined>(
  undefined
);

const DEFAULT_ANALYTICS_STATE: StatisticalAnalysisState = {
  selectedVariables: ['AssessedValue', 'SalePrice'],
  correlationMethod: 'pearson',
  hypothesisTestType: 'independent-t-test',
  confidenceLevel: 0.95,
  lastAnalysisResults: null,
  lastAnalysisTime: null,
};

export const StatisticalAnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StatisticalAnalysisState>(DEFAULT_ANALYTICS_STATE);

  const updateAnalysisConfig = useCallback((updates: Partial<StatisticalAnalysisState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const saveAnalysisResults = useCallback((results: any) => {
    setState((prev) => ({
      ...prev,
      lastAnalysisResults: results,
      lastAnalysisTime: new Date(),
    }));

  }, []);

  const value = useMemo(
    () => ({
      state,
      setState,
      updateAnalysisConfig,
      saveAnalysisResults,
    }),
    [state, updateAnalysisConfig, saveAnalysisResults]
  );

  return (
    <StatisticalAnalyticsContext.Provider value={value}>
      {children}
    </StatisticalAnalyticsContext.Provider>
  );
};

export const useStatisticalAnalytics = (): StatisticalAnalyticsContextType => {
  const context = useContext(StatisticalAnalyticsContext);
  if (!context) {
    throw new Error('useStatisticalAnalytics must be used within StatisticalAnalyticsProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════════
// IAAO COMPLIANCE CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface IAAOComplianceContextType {
  state: IAAOComplianceState;
  setState: (state: IAAOComplianceState) => void;
  updateComplianceConfig: (updates: Partial<IAAOComplianceState>) => void;
  updateCertificationLevel: (level: string, score: number) => void;
}

const IAAOComplianceContext = createContext<IAAOComplianceContextType | undefined>(undefined);

const DEFAULT_IAAO_STATE: IAAOComplianceState = {
  selectedCounty: 'king',
  assessmentPeriod: '2024',
  propertyType: 'residential',
  targetCertification: 'championship',
  currentCertificationLevel: null,
  complianceScore: null,
  lastValidation: null,
};

export const IAAOComplianceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<IAAOComplianceState>(DEFAULT_IAAO_STATE);

  const updateComplianceConfig = useCallback((updates: Partial<IAAOComplianceState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const updateCertificationLevel = useCallback((level: string, score: number) => {
    setState((prev) => ({
      ...prev,
      currentCertificationLevel: level,
      complianceScore: score,
      lastValidation: new Date(),
    }));

  }, []);

  const value = useMemo(
    () => ({
      state,
      setState,
      updateComplianceConfig,
      updateCertificationLevel,
    }),
    [state, updateComplianceConfig, updateCertificationLevel]
  );

  return <IAAOComplianceContext.Provider value={value}>{children}</IAAOComplianceContext.Provider>;
};

export const useIAAOCompliance = (): IAAOComplianceContextType => {
  const context = useContext(IAAOComplianceContext);
  if (!context) {
    throw new Error('useIAAOCompliance must be used within IAAOComplianceProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED RESEARCH PROVIDER - Wraps all contexts
// ═══════════════════════════════════════════════════════════════════════════════

export const ResearchProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ResearchSessionProvider>
      <QuantumConsciousnessProvider>
        <AISwarmProvider>
          <StatisticalAnalyticsProvider>
            <IAAOComplianceProvider>{children}</IAAOComplianceProvider>
          </StatisticalAnalyticsProvider>
        </AISwarmProvider>
      </QuantumConsciousnessProvider>
    </ResearchSessionProvider>
  );
};

export default ResearchProviders;
