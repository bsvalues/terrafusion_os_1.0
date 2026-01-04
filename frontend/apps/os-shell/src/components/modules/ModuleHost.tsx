/**
 * TerraFusion OS Module Host Component
 *
 * Single render surface for module content that integrates:
 * - Module loader state machine (promise dedupe, retries)
 * - Error boundary with recovery UI
 * - Loading states with Suspense
 * - ATLAS telemetry
 *
 * This component is the bridge between the loader infrastructure
 * and the product-level module components.
 *
 * @module components/modules/ModuleHost
 * @see Phase 2: Infrastructure Layer
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { getModuleEntry, ModuleRenderer, normalizeModuleId } from '../../config/moduleComponents';
import { useModuleLoaderActions, useModuleLoadState } from '../../stores/moduleLoaderStore';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';

// ============================================================================
// Types
// ============================================================================

export interface ModuleHostProps {
  /** The module ID to render (can include aliases) */
  moduleId: string;
  /** Optional callback when module is closed via error boundary */
  onClose?: () => void;
  /** Optional className for the container */
  className?: string;
}

// ============================================================================
// Loading State Component
// ============================================================================

const ModuleLoadingState: React.FC<{ moduleId: string }> = ({ moduleId }) => (
  <div
    data-testid='module-loading'
    className='w-full h-full flex flex-col items-center justify-center bg-slate-900'
  >
    {/* Animated loader */}
    <div className='relative'>
      <div className='w-16 h-16 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin' />
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='w-8 h-8 border-4 border-slate-600 border-b-cyan-300 rounded-full animate-spin animate-reverse' />
      </div>
    </div>

    <p className='mt-6 text-slate-300 text-sm font-medium'>Loading module...</p>
    <p className='mt-1 text-slate-500 text-xs'>
      <code className='text-cyan-400/70'>{moduleId}</code>
    </p>
  </div>
);

// ============================================================================
// Empty State Component (no module selected)
// ============================================================================

const EmptyState: React.FC = () => (
  <div
    data-testid='module-empty-state'
    className='w-full h-full flex flex-col items-center justify-center bg-slate-900'
  >
    <div className='text-6xl mb-4 opacity-30'>🚀</div>
    <h3 className='text-lg font-medium text-slate-400 mb-2'>Welcome to TerraFusion</h3>
    <p className='text-sm text-slate-500 max-w-md text-center'>
      Select a module from the Start Menu or Taskbar to get started.
    </p>
  </div>
);

// ============================================================================
// Module Content Wrapper
// ============================================================================

interface ModuleContentProps {
  moduleId: string;
  normalizedId: string;
  onRetry: () => void;
  onClose?: () => void;
}

const ModuleContent: React.FC<ModuleContentProps> = ({
  moduleId,
  normalizedId,
  onRetry,
  onClose,
}) => {
  const moduleEntry = getModuleEntry(normalizedId);

  // If we have a registry entry with a lazy component, use it directly
  if (moduleEntry?.Component) {
    const LazyComponent = moduleEntry.Component;
    return (
      <ModuleErrorBoundary
        moduleId={normalizedId}
        moduleName={normalizedId}
        onRetry={onRetry}
        onClose={onClose}
      >
        <Suspense fallback={<ModuleLoadingState moduleId={normalizedId} />}>
          <LazyComponent />
        </Suspense>
      </ModuleErrorBoundary>
    );
  }

  // Fallback to ModuleRenderer (handles placeholders and unknown modules)
  return (
    <ModuleErrorBoundary
      moduleId={normalizedId}
      moduleName={normalizedId}
      onRetry={onRetry}
      onClose={onClose}
    >
      <ModuleRenderer moduleId={normalizedId} />
    </ModuleErrorBoundary>
  );
};

// ============================================================================
// Main ModuleHost Component
// ============================================================================

/**
 * ModuleHost - Single render surface for module content.
 *
 * Responsibilities:
 * 1. Normalize module ID (resolve aliases)
 * 2. Trigger module load via state machine
 * 3. Render appropriate UI based on load state
 * 4. Provide error recovery via retry
 *
 * Usage:
 * ```tsx
 * <ModuleHost moduleId="costforge" onClose={() => closeWindow()} />
 * ```
 */
export const ModuleHost: React.FC<ModuleHostProps> = ({ moduleId, onClose, className = '' }) => {
  // Normalize the module ID
  const normalizedId = useMemo(() => normalizeModuleId(moduleId), [moduleId]);

  // Get load state from store
  const loadState = useModuleLoadState(normalizedId);
  const { loadModule, retryModule } = useModuleLoaderActions();

  // Track mounted state for async safety
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Trigger module load on mount/moduleId change
  useEffect(() => {
    if (!normalizedId) return;

    // Only load if not already loaded
    if (loadState.status === 'idle' || loadState.status === 'error') {
      loadModule(normalizedId).catch((error) => {
        // Error is already handled by the store
        console.debug(`[ModuleHost] Load failed for ${normalizedId}:`, error.message);
      });
    }
  }, [normalizedId, loadState.status, loadModule]);

  // Handle retry
  const handleRetry = useCallback(() => {
    retryModule(normalizedId).catch((error) => {
      console.debug(`[ModuleHost] Retry failed for ${normalizedId}:`, error.message);
    });
  }, [normalizedId, retryModule]);

  // Handle close
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Empty state - no module selected
  if (!moduleId || !normalizedId) {
    return <EmptyState />;
  }

  // Render based on load state
  return (
    <div
      data-testid='module-host'
      data-module-id={normalizedId}
      data-load-state={loadState.status}
      className={`w-full h-full overflow-auto bg-slate-900 ${className}`.trim()}
    >
      {loadState.status === 'loading' && <ModuleLoadingState moduleId={normalizedId} />}

      {loadState.status === 'error' && (
        <ModuleErrorBoundary
          moduleId={normalizedId}
          moduleName={normalizedId}
          onRetry={handleRetry}
          onClose={handleClose}
        >
          {/* Force error display by throwing */}
          <ErrorThrower error={loadState.error?.message || 'Module failed to load'} />
        </ModuleErrorBoundary>
      )}

      {(loadState.status === 'loaded' || loadState.status === 'idle') && (
        <ModuleContent
          moduleId={moduleId}
          normalizedId={normalizedId}
          onRetry={handleRetry}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

// Helper to trigger error boundary for load errors
const ErrorThrower: React.FC<{ error: string }> = ({ error }) => {
  throw new Error(error);
};

// ============================================================================
// Convenience Hook
// ============================================================================

/**
 * Hook to get module host state and actions for a given module ID.
 */
export const useModuleHostState = (moduleId: string) => {
  const normalizedId = normalizeModuleId(moduleId);
  const loadState = useModuleLoadState(normalizedId);
  const { loadModule, retryModule, resetModule } = useModuleLoaderActions();

  return {
    normalizedId,
    status: loadState.status,
    error: loadState.error,
    isLoading: loadState.status === 'loading',
    isLoaded: loadState.status === 'loaded',
    hasError: loadState.status === 'error',
    load: () => loadModule(normalizedId),
    retry: () => retryModule(normalizedId),
    reset: () => resetModule(normalizedId),
  };
};

export default ModuleHost;
