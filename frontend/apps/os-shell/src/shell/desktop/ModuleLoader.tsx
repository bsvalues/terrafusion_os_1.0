/**
 * TerraFusion OS ModuleLoader Component
 *
 * Renders module content inside Window components.
 * Handles loading, loaded, and error states with appropriate UI.
 *
 * @module shell/desktop/ModuleLoader
 * @see SUCCESS CRITERIA Phase 3.2
 */

import React from 'react';

import type { ModuleDefinition, ModuleLoadState } from '../../stores/moduleRegistryStore';
import { useModuleRegistryStore } from '../../stores/moduleRegistryStore';

// ============================================================================
// Types
// ============================================================================

interface ModuleLoaderProps {
  moduleId: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading state UI with spinner and module name
 */
const LoadingState: React.FC<{ moduleName: string }> = ({ moduleName }) => (
  <div
    data-testid='module-loading'
    aria-live='polite'
    aria-busy='true'
    className='w-full h-full flex flex-col items-center justify-center bg-slate-900'
  >
    {/* Spinner */}
    <div
      data-testid='loading-spinner'
      className='w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin'
    />

    {/* Loading text */}
    <p className='mt-4 text-slate-300 text-sm'>
      Loading <span className='text-cyan-400 font-medium'>{moduleName}</span>...
    </p>

    {/* Subtle progress indicator */}
    <div className='mt-2 w-48 h-1 bg-slate-700 rounded-full overflow-hidden'>
      <div
        className='h-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse'
        style={{ width: '60%' }}
      />
    </div>
  </div>
);

/**
 * Error state UI with message and retry button
 */
const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
  moduleName: string;
}> = ({ error, onRetry, moduleName }) => (
  <div
    data-testid='module-error'
    role='alert'
    className='w-full h-full flex flex-col items-center justify-center bg-slate-900 p-6'
  >
    {/* Error icon */}
    <div
      data-testid='error-icon'
      className='w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4 text-red-400'
    >
      <svg
        className='w-8 h-8 text-red-400'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
        />
      </svg>
    </div>

    {/* Error title */}
    <h3 className='text-lg font-semibold text-slate-100 mb-2'>Failed to Load Module</h3>

    {/* Module name */}
    <p className='text-slate-400 text-sm mb-2'>{moduleName}</p>

    {/* Error message */}
    <p className='text-red-400 text-sm mb-6 text-center max-w-md'>{error}</p>

    {/* Retry button */}
    <button
      onClick={onRetry}
      aria-label={`Retry loading ${moduleName}`}
      className='px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900'
    >
      Retry
    </button>
  </div>
);

/**
 * Not found state when module doesn't exist
 */
const NotFoundState: React.FC<{ moduleId: string }> = ({ moduleId }) => (
  <div
    data-testid='module-not-found'
    role='alert'
    className='w-full h-full flex flex-col items-center justify-center bg-slate-900 p-6'
  >
    {/* Warning icon */}
    <div className='w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center mb-4'>
      <svg
        className='w-8 h-8 text-amber-400'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    </div>

    {/* Title */}
    <h3 className='text-lg font-semibold text-slate-100 mb-2'>Module Not Found</h3>

    {/* Module ID */}
    <p className='text-slate-400 text-sm text-center'>
      The module{' '}
      <code className='text-amber-400 bg-slate-800 px-2 py-0.5 rounded'>
        {moduleId || '(empty)'}
      </code>{' '}
      could not be found in the registry.
    </p>
  </div>
);

/**
 * Loaded state with iframe
 */
const LoadedState: React.FC<{ module: ModuleDefinition }> = ({ module }) => (
  <iframe
    data-testid='module-iframe'
    src={module.launchPath}
    title={module.displayName}
    className='w-full h-full border-0'
    sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
  />
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * ModuleLoader - Renders module content inside Window
 *
 * Features:
 * - Loading spinner while fetching
 * - Error state with retry button
 * - Not found state for unknown modules
 * - Secure iframe sandbox for loaded modules
 * - Accessible states with aria attributes
 */
export const ModuleLoader: React.FC<ModuleLoaderProps> = ({ moduleId }) => {
  // Get module and load state from registry store
  const module = useModuleRegistryStore((state) => state.getModuleById(moduleId));
  const loadStates = useModuleRegistryStore((state) => state.loadStates);
  const launchModule = useModuleRegistryStore((state) => state.launchModule);

  const loadState: ModuleLoadState | undefined = loadStates.get(moduleId);

  // Handle retry action
  const handleRetry = async () => {
    try {
      await launchModule(moduleId);
    } catch (error) {
      // Error state will be set by the store
      console.error('Retry failed:', error);
    }
  };

  // Determine which state to render
  const renderContent = () => {
    // Module not found in registry
    if (!module) {
      return <NotFoundState moduleId={moduleId} />;
    }

    // Check load state
    const status = loadState?.status || 'idle';

    switch (status) {
      case 'loaded':
        return <LoadedState module={module} />;

      case 'error':
        return (
          <ErrorState
            error={loadState?.error || 'Unknown error'}
            onRetry={handleRetry}
            moduleName={module.displayName}
          />
        );

      case 'loading':
      case 'idle':
      default:
        return <LoadingState moduleName={module.displayName} />;
    }
  };

  return (
    <div data-testid='module-loader' className='w-full h-full bg-slate-900'>
      {renderContent()}
    </div>
  );
};

export default ModuleLoader;
