/**
 * TerraFusion OS ModuleLoader Component
 * 
 * Observes moduleRegistryStore state and renders the appropriate UI
 * for module loading lifecycle: empty → loading → success/error.
 * 
 * Phase 3.2: ModuleLoader + StartMenu Integration
 * 
 * @module components/desktop/ModuleLoader
 * @see SPECLOCK.md for contract details
 */

import React, { useEffect, useCallback } from 'react';
import { useModuleRegistryStore, type LoadedModule } from '../../stores/moduleRegistryStore';

// ============================================================================
// Types
// ============================================================================

export interface ModuleLoaderProps {
  /** ID of module to load, or null for no selection */
  moduleId: string | null;
  /** Additional CSS class names */
  className?: string;
  /** Callback when module loads successfully */
  onLoadSuccess?: (module: LoadedModule) => void;
  /** Callback when module fails to load */
  onLoadError?: (error: Error) => void;
}

// ============================================================================
// Telemetry (log-first breadcrumbs, no PII)
// ============================================================================

const telemetry = {
  moduleLoadStarted: (moduleId: string, source: 'startmenu' | 'direct') => {
    console.info('[ModuleLoader] module_load_started', { moduleId, source });
  },
  moduleLoadSuccess: (moduleId: string, durationMs: number) => {
    console.info('[ModuleLoader] module_load_success', { moduleId, durationMs });
  },
  moduleLoadError: (moduleId: string, errorType: string, errorMessage: string) => {
    console.error('[ModuleLoader] module_load_error', { moduleId, errorType, errorMessage });
  },
  moduleLoadRetry: (moduleId: string, attemptNumber: number) => {
    console.info('[ModuleLoader] module_load_retry', { moduleId, attemptNumber });
  },
  moduleCacheHit: (moduleId: string) => {
    console.debug('[ModuleLoader] module_cache_hit', { moduleId });
  },
};

// ============================================================================
// Component
// ============================================================================

export const ModuleLoader: React.FC<ModuleLoaderProps> = ({
  moduleId,
  className = '',
  onLoadSuccess,
  onLoadError,
}) => {
  // Subscribe to store state
  const definition = useModuleRegistryStore((state) => 
    moduleId ? state.definitions.get(moduleId) : undefined
  );
  const loadedModule = useModuleRegistryStore((state) => 
    moduleId ? state.loadedModules.get(moduleId) : undefined
  );
  const loadingState = useModuleRegistryStore((state) => 
    moduleId ? state.loadingStates.get(moduleId) : undefined
  );
  const error = useModuleRegistryStore((state) => 
    moduleId ? state.errors.get(moduleId) : undefined
  );

  // Actions
  const loadModule = useModuleRegistryStore((state) => state.loadModule);
  const retryLoad = useModuleRegistryStore((state) => state.retryLoad);

  // Track load start time for telemetry
  const loadStartRef = React.useRef<number | null>(null);

  // Handle retry click
  const handleRetry = useCallback(async () => {
    if (!moduleId) return;
    
    telemetry.moduleLoadRetry(moduleId, 1);
    loadStartRef.current = Date.now();
    
    try {
      const result = await retryLoad(moduleId);
      const durationMs = Date.now() - (loadStartRef.current || Date.now());
      telemetry.moduleLoadSuccess(moduleId, durationMs);
      onLoadSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      telemetry.moduleLoadError(moduleId, error.name, error.message);
      onLoadError?.(error);
    }
  }, [moduleId, retryLoad, onLoadSuccess, onLoadError]);

  // Load module when moduleId changes
  useEffect(() => {
    if (!moduleId) return;

    // Check if already loaded (cache hit)
    if (loadedModule && loadingState === 'loaded') {
      telemetry.moduleCacheHit(moduleId);
      onLoadSuccess?.(loadedModule);
      return;
    }

    // Check if module is registered
    if (!definition && loadingState !== 'loading' && loadingState !== 'error') {
      // Module not registered - will show error state
      return;
    }

    // Don't re-load if already loading
    if (loadingState === 'loading') return;

    // Start loading
    const startLoad = async () => {
      telemetry.moduleLoadStarted(moduleId, 'direct');
      loadStartRef.current = Date.now();

      try {
        const result = await loadModule(moduleId);
        const durationMs = Date.now() - (loadStartRef.current || Date.now());
        telemetry.moduleLoadSuccess(moduleId, durationMs);
        onLoadSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        telemetry.moduleLoadError(moduleId, error.name, error.message);
        onLoadError?.(error);
      }
    };

    startLoad();
  }, [moduleId, definition, loadedModule, loadingState, loadModule, onLoadSuccess, onLoadError]);

  // --------------------------------------------------------------------------
  // Render States
  // --------------------------------------------------------------------------

  // EMPTY state: null moduleId
  if (!moduleId) {
    return null;
  }

  // Module not registered error
  if (!definition && loadingState !== 'loading' && loadingState !== 'error') {
    return (
      <div className={`module-loader module-loader--error ${className}`}>
        <div className="module-loader__error-content">
          <span className="module-loader__error-icon">⚠️</span>
          <p className="module-loader__error-message">
            Module not found. It may have been removed.
          </p>
        </div>
      </div>
    );
  }

  // LOADING state
  if (loadingState === 'loading') {
    return (
      <div className={`module-loader module-loader--loading ${className}`}>
        <div 
          className="module-loader__spinner" 
          role="progressbar"
          aria-label={`Loading ${definition?.name || 'module'}`}
        />
        <p className="module-loader__loading-text">
          Loading {definition?.name || 'module'}...
        </p>
      </div>
    );
  }

  // ERROR state
  if (loadingState === 'error') {
    return (
      <div className={`module-loader module-loader--error ${className}`}>
        <div className="module-loader__error-content">
          <span className="module-loader__error-icon">❌</span>
          <p className="module-loader__error-message">
            Failed to load {definition?.name || 'module'}. Please try again.
          </p>
          {error && (
            <p className="module-loader__error-detail">
              {error.message}
            </p>
          )}
          <button 
            className="module-loader__retry-button"
            onClick={handleRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // SUCCESS state
  if (loadedModule && loadingState === 'loaded') {
    const ModuleComponent = loadedModule.component;
    return (
      <div className={`module-loader module-loader--loaded ${className}`}>
        <ModuleComponent />
      </div>
    );
  }

  // IDLE state (registered but not yet loading)
  return null;
};

export default ModuleLoader;
