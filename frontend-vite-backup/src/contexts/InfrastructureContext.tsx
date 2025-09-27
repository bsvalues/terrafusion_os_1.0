/**
 * Infrastructure Context - React Integration for Enterprise Services
 * 
 * Provides Service Mesh, Trust Fabric, and Secure API Client
 * to React components through context and hooks
 * 
 * @author TerraFusion Engineering Team
 * @version 1.0.0 - Enterprise Grade
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ServiceMeshClient } from '../infrastructure/ServiceMesh';
import { TrustFabricClient } from '../infrastructure/TrustFabric';
import { CircuitBreaker } from '../infrastructure/CircuitBreaker';
import { SecureAPIClient } from '../infrastructure/SecureAPIClient';

export interface InfrastructureServices {
  serviceMesh: ServiceMeshClient;
  trustFabric: TrustFabricClient;
  circuitBreaker: CircuitBreaker;
  secureAPI: SecureAPIClient;
}

export interface InfrastructureHealth {
  serviceMesh: boolean;
  trustFabric: boolean;
  circuitBreaker: any;
  cache: any;
  overall: 'healthy' | 'degraded' | 'critical';
}

export interface InfrastructureContextValue {
  services: InfrastructureServices | null;
  health: InfrastructureHealth | null;
  ready: boolean;
  error: string | null;
  retryInitialization: () => Promise<void>;
}

const InfrastructureContext = createContext<InfrastructureContextValue | null>(null);

export interface SystemInitializingProps {
  error?: string | null;
  onRetry?: () => void;
}

const SystemInitializing: React.FC<SystemInitializingProps> = ({ error, onRetry }) => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          {/* TerraFusion Logo */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">TF</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">TerraFusion OS</h1>
            <p className="text-white/70 text-sm">Enterprise Government Platform</p>
          </div>
          
          {error ? (
            <div className="mb-6">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-red-300 font-semibold mb-2">Initialization Failed</h3>
                <p className="text-red-200 text-sm mb-3">{error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center justify-center mb-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                  <span className="ml-3 text-cyan-300 font-medium">
                    Initializing Infrastructure{dots}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-blue-200">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
                    Service Mesh Discovery
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                    Trust Fabric Initialization
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></div>
                    Cryptographic Attestation Setup
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Circuit Breaker Configuration
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-white/50">
            MIT PhD-Level Architecture • Enterprise Security
          </div>
        </div>
      </div>
    </div>
  );
};

export interface InfrastructureProviderProps {
  children: React.ReactNode;
  fallbackMode?: boolean;
  onHealthChange?: (health: InfrastructureHealth) => void;
}

export const InfrastructureProvider: React.FC<InfrastructureProviderProps> = ({ 
  children, 
  fallbackMode = false,
  onHealthChange
}) => {
  const [services, setServices] = useState<InfrastructureServices | null>(null);
  const [health, setHealth] = useState<InfrastructureHealth | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  const updateHealth = useCallback(() => {
    if (!services) {
      setHealth(null);
      return;
    }
    
    const apiHealth = services.secureAPI.getHealth();
    
    const newHealth: InfrastructureHealth = {
      serviceMesh: apiHealth.serviceMesh,
      trustFabric: apiHealth.trustFabric,
      circuitBreaker: apiHealth.circuitBreaker,
      cache: apiHealth.cache,
      overall: 'healthy'
    };
    
    // Determine overall health
    if (!newHealth.serviceMesh || !newHealth.trustFabric) {
      newHealth.overall = 'critical';
    } else if (newHealth.circuitBreaker.state !== 'CLOSED') {
      newHealth.overall = 'degraded';
    }
    
    setHealth(newHealth);
    onHealthChange?.(newHealth);
  }, [services, onHealthChange]);
  
  const initialize = useCallback(async () => {
    try {
      setError(null);
      setInitializationAttempts(prev => prev + 1);
      
      console.log('🚀 Initializing TerraFusion Infrastructure...');
      
      // Initialize Service Mesh
      console.log('🌐 Initializing Service Mesh...');
      const serviceMesh = new ServiceMeshClient();
      await serviceMesh.initialize();
      
      // Initialize Trust Fabric
      console.log('🔐 Initializing Trust Fabric...');
      const trustFabric = new TrustFabricClient();
      await trustFabric.initialize();
      
      // Initialize Circuit Breaker
      console.log('🔧 Initializing Circuit Breaker...');
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: fallbackMode ? 2 : 5,
        recoveryTimeout: fallbackMode ? 30000 : 60000,
        monitoringPeriod: 120000,
        halfOpenMaxCalls: 3,
        expectedErrorRate: 0.1
      });
      
      // Initialize Secure API Client
      console.log('🔒 Initializing Secure API Client...');
      const secureAPI = new SecureAPIClient(serviceMesh, trustFabric, circuitBreaker);
      
      const infraServices: InfrastructureServices = {
        serviceMesh,
        trustFabric,
        circuitBreaker,
        secureAPI
      };
      
      setServices(infraServices);
      setReady(true);
      
      console.log('✅ TerraFusion Infrastructure initialized successfully');
      
      // Start health monitoring
      const healthInterval = setInterval(() => {
        updateHealth();
      }, 30000); // Check every 30 seconds
      
      // Initial health check
      setTimeout(() => updateHealth(), 1000);
      
      // Cleanup function
      return () => {
        clearInterval(healthInterval);
        serviceMesh.destroy();
        trustFabric.destroy();
      };
      
    } catch (err) {
      console.error('❌ Infrastructure initialization failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
      setError(errorMessage);
      
      // Auto-retry with exponential backoff for the first few attempts
      if (initializationAttempts < 3) {
        const retryDelay = Math.pow(2, initializationAttempts) * 1000;
        console.log(`🔄 Auto-retrying initialization in ${retryDelay}ms...`);
        
        setTimeout(() => {
          initialize();
        }, retryDelay);
      }
    }
  }, [fallbackMode, initializationAttempts, updateHealth]);
  
  const retryInitialization = useCallback(async () => {
    setReady(false);
    setServices(null);
    setError(null);
    await initialize();
  }, [initialize]);
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Monitor health when services are ready
  useEffect(() => {
    if (services) {
      updateHealth();
    }
  }, [services, updateHealth]);
  
  const contextValue: InfrastructureContextValue = {
    services,
    health,
    ready,
    error,
    retryInitialization
  };
  
  if (!ready) {
    return (
      <SystemInitializing 
        error={error} 
        onRetry={error ? retryInitialization : undefined}
      />
    );
  }
  
  return (
    <InfrastructureContext.Provider value={contextValue}>
      {children}
    </InfrastructureContext.Provider>
  );
};

export const useInfrastructure = (): InfrastructureContextValue => {
  const context = useContext(InfrastructureContext);
  
  if (!context) {
    throw new Error('useInfrastructure must be used within an InfrastructureProvider');
  }
  
  return context;
};

export const useSecureAPI = () => {
  const { services } = useInfrastructure();
  
  if (!services) {
    throw new Error('Infrastructure services not ready');
  }
  
  return services.secureAPI;
};

export const useServiceHealth = () => {
  const { health } = useInfrastructure();
  return health;
};

export const useTrustFabric = () => {
  const { services } = useInfrastructure();
  
  if (!services) {
    throw new Error('Trust Fabric not ready');
  }
  
  return services.trustFabric;
};

export const useServiceMesh = () => {
  const { services } = useInfrastructure();
  
  if (!services) {
    throw new Error('Service Mesh not ready');
  }
  
  return services.serviceMesh;
};
