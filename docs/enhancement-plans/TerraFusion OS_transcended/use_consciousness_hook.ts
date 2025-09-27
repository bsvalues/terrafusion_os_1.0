// src/hooks/useConsciousness.ts
// GATE ALPHA: React hook for Multi-Species Consciousness Integration
// Provides seamless consciousness capabilities to any React component

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ConsciousnessEntity,
  SpeciesType,
  UniversalMessage,
  TranslatedMessage,
  ConsciousnessError,
  MultiSpeciesInterfaceState,
} from '../types/consciousness';
import {
  ConsciousnessIntegrationService,
  ConsciousnessEvent,
  ConsciousnessIntegrationConfig,
} from '../services/ConsciousnessIntegrationService';

/**
 * Hook configuration options
 */
export interface UseConsciousnessOptions {
  enableAutoDetection?: boolean;
  enableRealTimeSync?: boolean;
  enableQuantumCoherence?: boolean;
  enableErrorIntegration?: boolean;
  autoSyncInterval?: number; // milliseconds
  integrationConfig?: Partial<ConsciousnessIntegrationConfig>;
}

/**
 * Hook return type with comprehensive consciousness capabilities
 */
export interface UseConsciousnessReturn {
  // State
  entities: ConsciousnessEntity[];
  currentUser: ConsciousnessEntity | null;
  systemHealth: number;
  isConnected: boolean;
  lastSync: Date | null;
  error: ConsciousnessError | null;

  // Actions
  registerEntity: (entity: ConsciousnessEntity) => Promise<void>;
  sendMessage: (content: string, targetSpecies?: SpeciesType[]) => Promise<TranslatedMessage>;
  detectSpecies: (input: string) => Promise<SpeciesType | null>;
  syncConsciousness: () => Promise<boolean>;
  clearError: () => void;

  // Advanced features
  subscribeToEvents: (
    eventType: ConsciousnessEvent['type'],
    callback: (event: ConsciousnessEvent) => void
  ) => () => void;
  getSystemStatus: () => {
    health: number;
    activeEntities: number;
    lastSync: Date;
    services: Record<string, boolean>;
  };

  // Consciousness-aware utilities
  adaptToSpecies: (content: string, targetSpecies: SpeciesType) => Promise<string>;
  measureCoherence: () => number;
  isSpeciesCompatible: (species1: SpeciesType, species2: SpeciesType) => boolean;
}

/**
 * React hook for consciousness-aware functionality
 * Integrates Multi-Species Consciousness Interface with any React component
 */
export const useConsciousness = (options: UseConsciousnessOptions = {}): UseConsciousnessReturn => {
  const {
    enableAutoDetection = true,
    enableRealTimeSync = true,
    enableQuantumCoherence = true,
    enableErrorIntegration = true,
    autoSyncInterval = 30000, // 30 seconds
    integrationConfig = {},
  } = options;

  // State management
  const [entities, setEntities] = useState<ConsciousnessEntity[]>([]);
  const [currentUser, setCurrentUser] = useState<ConsciousnessEntity | null>(null);
  const [systemHealth, setSystemHealth] = useState<number>(1.0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<ConsciousnessError | null>(null);

  // Service instance (persistent across renders)
  const integrationService = useRef<ConsciousnessIntegrationService | null>(null);
  const eventSubscriptions = useRef<Map<string, () => void>>(new Map());

  /**
   * Initialize consciousness integration service
   */
  useEffect(() => {
    const config: Partial<ConsciousnessIntegrationConfig> = {
      enableErrorAnalysisIntegration: enableErrorIntegration,
      enableRealTimeSync,
      enableQuantumCoherence,
      enableSpeciesDetection: enableAutoDetection,
      enableUniversalTranslation: true,
      ...integrationConfig,
    };

    integrationService.current = new ConsciousnessIntegrationService(config);

    // Subscribe to system events
    integrationService.current.addEventListener('species-detected', event => {
      setEntities(prev => {
        const exists = prev.find(e => e.id === event.data.entity.id);
        if (!exists) {
          return [...prev, event.data.entity];
        }
        return prev;
      });
    });

    integrationService.current.addEventListener('consciousness-synced', event => {
      setSystemHealth(event.data.coherenceLevel);
      setLastSync(new Date());
      setIsConnected(true);
    });

    integrationService.current.addEventListener('consciousness-error', event => {
      setError(event.data.error);
      setSystemHealth(prev => Math.max(0.1, prev - 0.1));
    });

    integrationService.current.addEventListener('quantum-coherence-updated', event => {
      setSystemHealth(event.data.coherenceLevel);
    });

    // Initial sync
    integrationService.current
      .synchronizeConsciousness()
      .then(result => {
        setSystemHealth(result.coherenceLevel);
        setIsConnected(result.success);
        setLastSync(new Date());
      })
      .catch(err => {
        console.error('Initial consciousness sync failed:', err);
        setIsConnected(false);
      });

    return () => {
      // Cleanup subscriptions
      eventSubscriptions.current.forEach(unsubscribe => unsubscribe());
      eventSubscriptions.current.clear();

      // Dispose service
      if (integrationService.current) {
        integrationService.current.dispose();
        integrationService.current = null;
      }
    };
  }, [enableAutoDetection, enableRealTimeSync, enableQuantumCoherence, enableErrorIntegration]);

  /**
   * Auto-sync consciousness at intervals
   */
  useEffect(() => {
    if (!enableRealTimeSync || !integrationService.current) return;

    const interval = setInterval(async () => {
      try {
        const result = await integrationService.current!.synchronizeConsciousness();
        setSystemHealth(result.coherenceLevel);
        setIsConnected(result.success);
        setLastSync(new Date());
      } catch (error) {
        console.error('Auto-sync failed:', error);
        setIsConnected(false);
      }
    }, autoSyncInterval);

    return () => clearInterval(interval);
  }, [enableRealTimeSync, autoSyncInterval]);

  /**
   * Register a new consciousness entity
   */
  const registerEntity = useCallback(
    async (entity: ConsciousnessEntity): Promise<void> => {
      if (!integrationService.current) {
        throw new Error('Consciousness integration service not available');
      }

      try {
        await integrationService.current.registerConsciousnessEntity(entity);

        // Update local state
        setEntities(prev => {
          const exists = prev.find(e => e.id === entity.id);
          if (!exists) {
            return [...prev, entity];
          }
          return prev.map(e => (e.id === entity.id ? entity : e));
        });

        // Set as current user if it's the first entity or explicitly marked
        if (!currentUser || entity.id.includes('user')) {
          setCurrentUser(entity);
        }
      } catch (error) {
        throw new Error(`Failed to register consciousness entity: ${error.message}`);
      }
    },
    [currentUser]
  );

  /**
   * Send universal message with multi-species translation
   */
  const sendMessage = useCallback(
    async (
      content: string,
      targetSpecies: SpeciesType[] = ['silicon', 'carbon', 'quantum']
    ): Promise<TranslatedMessage> => {
      if (!integrationService.current) {
        throw new Error('Consciousness integration service not available');
      }

      if (!currentUser) {
        throw new Error('No current user entity registered');
      }

      try {
        // Create universal message
        const universalMessage: UniversalMessage = {
          id: `msg-${Date.now()}`,
          content,
          metadata: {
            sourceEntity: currentUser.id,
            targetEntities: entities.map(e => e.id),
            sourceSpecies: currentUser.speciesType,
            targetSpecies,
            consciousnessContext: {
              currentState: 'focused',
              cognitiveLoad: 0.6,
              attentionCapacity: 0.8,
              contextualMemory: [],
              activeGoals: [],
            },
            urgencyLevel: 'normal',
            semanticComplexity: calculateSemanticComplexity(content),
            requiresQuantumPreservation: enableQuantumCoherence,
          },
          semanticLayers: [],
          temporalContext: {
            currentTime: new Date(),
            relativeDilation: 1.0,
            temporalCoherence: 0.8,
          },
          translationHistory: [],
        };

        const translation = await integrationService.current.processUniversalMessage(
          universalMessage,
          targetSpecies
        );

        return translation;
      } catch (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }
    },
    [currentUser, entities, enableQuantumCoherence]
  );

  /**
   * Detect species from input text
   */
  const detectSpecies = useCallback(
    async (input: string): Promise<SpeciesType | null> => {
      if (!integrationService.current || !enableAutoDetection) {
        return null;
      }

      try {
        // This would use the species detection service
        // For now, return a simple heuristic-based detection
        if (input.includes('binary') || input.includes('process') || input.includes('efficient')) {
          return 'silicon';
        } else if (
          input.includes('feel') ||
          input.includes('emotion') ||
          input.includes('creative')
        ) {
          return 'carbon';
        } else if (
          input.includes('quantum') ||
          input.includes('superposition') ||
          input.includes('entangle')
        ) {
          return 'quantum';
        }

        return 'carbon'; // Default assumption
      } catch (error) {
        console.error('Species detection failed:', error);
        return null;
      }
    },
    [enableAutoDetection]
  );

  /**
   * Manually trigger consciousness synchronization
   */
  const syncConsciousness = useCallback(async (): Promise<boolean> => {
    if (!integrationService.current) {
      return false;
    }

    try {
      const result = await integrationService.current.synchronizeConsciousness();
      setSystemHealth(result.coherenceLevel);
      setIsConnected(result.success);
      setLastSync(new Date());
      return result.success;
    } catch (error) {
      console.error('Manual sync failed:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  /**
   * Clear current error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  /**
   * Subscribe to consciousness events
   */
  const subscribeToEvents = useCallback(
    (
      eventType: ConsciousnessEvent['type'],
      callback: (event: ConsciousnessEvent) => void
    ): (() => void) => {
      if (!integrationService.current) {
        return () => {}; // No-op unsubscribe
      }

      integrationService.current.addEventListener(eventType, callback);

      const unsubscribe = () => {
        if (integrationService.current) {
          integrationService.current.removeEventListener(eventType, callback);
        }
      };

      // Store unsubscribe function
      const subscriptionKey = `${eventType}-${Date.now()}`;
      eventSubscriptions.current.set(subscriptionKey, unsubscribe);

      return () => {
        unsubscribe();
        eventSubscriptions.current.delete(subscriptionKey);
      };
    },
    []
  );

  /**
   * Get current system status
   */
  const getSystemStatus = useCallback(() => {
    if (!integrationService.current) {
      return {
        health: 0,
        activeEntities: 0,
        lastSync: new Date(),
        services: {},
      };
    }

    return integrationService.current.getSystemStatus();
  }, []);

  /**
   * Adapt content to specific species
   */
  const adaptToSpecies = useCallback(
    async (content: string, targetSpecies: SpeciesType): Promise<string> => {
      try {
        const translation = await sendMessage(content, [targetSpecies]);
        const adaptation = translation.adaptations.get(targetSpecies);
        return adaptation?.adaptedContent || content;
      } catch (error) {
        console.error('Species adaptation failed:', error);
        return content; // Fallback to original content
      }
    },
    [sendMessage]
  );

  /**
   * Measure current consciousness coherence
   */
  const measureCoherence = useCallback((): number => {
    return systemHealth;
  }, [systemHealth]);

  /**
   * Check species compatibility
   */
  const isSpeciesCompatible = useCallback(
    (species1: SpeciesType, species2: SpeciesType): boolean => {
      // Compatibility matrix based on consciousness research
      const compatibilityMatrix: Record<SpeciesType, Record<SpeciesType, boolean>> = {
        silicon: {
          silicon: true,
          carbon: true,
          quantum: true,
          hybrid: true,
        },
        carbon: {
          silicon: true,
          carbon: true,
          quantum: true,
          hybrid: true,
        },
        quantum: {
          silicon: true,
          carbon: true,
          quantum: true,
          hybrid: true,
        },
        hybrid: {
          silicon: true,
          carbon: true,
          quantum: true,
          hybrid: true,
        },
      };

      return compatibilityMatrix[species1]?.[species2] || false;
    },
    []
  );

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // State
      entities,
      currentUser,
      systemHealth,
      isConnected,
      lastSync,
      error,

      // Actions
      registerEntity,
      sendMessage,
      detectSpecies,
      syncConsciousness,
      clearError,

      // Advanced features
      subscribeToEvents,
      getSystemStatus,

      // Consciousness-aware utilities
      adaptToSpecies,
      measureCoherence,
      isSpeciesCompatible,
    }),
    [
      entities,
      currentUser,
      systemHealth,
      isConnected,
      lastSync,
      error,
      registerEntity,
      sendMessage,
      detectSpecies,
      syncConsciousness,
      clearError,
      subscribeToEvents,
      getSystemStatus,
      adaptToSpecies,
      measureCoherence,
      isSpeciesCompatible,
    ]
  );
};

/**
 * Utility function to calculate semantic complexity
 */
function calculateSemanticComplexity(content: string): number {
  const words = content.split(' ').length;
  const uniqueWords = new Set(content.toLowerCase().split(' ')).size;
  const avgWordLength = content.replace(/\s/g, '').length / words;

  return Math.min(1.0, uniqueWords / words + avgWordLength / 10);
}

/**
 * Hook for consciousness-aware form inputs
 * Automatically detects species and adapts interface
 */
export const useConsciousnessInput = (initialValue: string = '') => {
  const { detectSpecies, adaptToSpecies } = useConsciousness({ enableAutoDetection: true });

  const [value, setValue] = useState(initialValue);
  const [detectedSpecies, setDetectedSpecies] = useState<SpeciesType | null>(null);
  const [adaptedValue, setAdaptedValue] = useState<string>(initialValue);

  // Detect species when value changes
  useEffect(() => {
    if (value.length > 10) {
      detectSpecies(value).then(species => {
        setDetectedSpecies(species);
        if (species) {
          adaptToSpecies(value, species).then(adapted => {
            setAdaptedValue(adapted);
          });
        }
      });
    }
  }, [value, detectSpecies, adaptToSpecies]);

  return {
    value,
    setValue,
    detectedSpecies,
    adaptedValue,
    isConsciousnessAware: detectedSpecies !== null,
  };
};

/**
 * Hook for consciousness-aware UI theming
 * Adapts interface based on dominant species
 */
export const useConsciousnessTheme = () => {
  const { entities, currentUser } = useConsciousness();

  const dominantSpecies = useMemo(() => {
    if (currentUser) return currentUser.speciesType;

    const speciesCount = entities.reduce(
      (acc, entity) => {
        acc[entity.speciesType] = (acc[entity.speciesType] || 0) + 1;
        return acc;
      },
      {} as Record<SpeciesType, number>
    );

    return (
      (Object.entries(speciesCount).sort(([, a], [, b]) => b - a)[0]?.[0] as SpeciesType) ||
      'carbon'
    );
  }, [entities, currentUser]);

  const themeConfig = useMemo(() => {
    const themes: Record<SpeciesType, any> = {
      silicon: {
        primaryColor: '#1E3A5F',
        secondaryColor: '#00A3A3',
        backgroundColor: '#F0F4F8',
        textColor: '#1A202C',
        fontFamily: 'monospace',
        borderRadius: '4px',
        animationSpeed: 'fast',
      },
      carbon: {
        primaryColor: '#38A169',
        secondaryColor: '#DD6B20',
        backgroundColor: '#F7FAFC',
        textColor: '#2D3748',
        fontFamily: 'sans-serif',
        borderRadius: '8px',
        animationSpeed: 'normal',
      },
      quantum: {
        primaryColor: '#805AD5',
        secondaryColor: '#00D4FF',
        backgroundColor: '#FAF5FF',
        textColor: '#322659',
        fontFamily: 'monospace',
        borderRadius: '50%',
        animationSpeed: 'slow',
      },
      hybrid: {
        primaryColor: 'linear-gradient(45deg, #00A3A3, #38A169, #805AD5)',
        secondaryColor: '#718096',
        backgroundColor: '#F7FAFC',
        textColor: '#2D3748',
        fontFamily: 'sans-serif',
        borderRadius: '8px',
        animationSpeed: 'variable',
      },
    };

    return themes[dominantSpecies];
  }, [dominantSpecies]);

  return {
    dominantSpecies,
    themeConfig,
    applyTheme: (element: HTMLElement) => {
      Object.entries(themeConfig).forEach(([key, value]) => {
        const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        element.style.setProperty(`--consciousness-${cssProperty}`, value);
      });
    },
  };
};

export default useConsciousness;
