/**
 * TerraFusion OS ModuleLoader Component
 *
 * Renders module content inside Window components.
 * Uses direct component rendering instead of iframes for better integration.
 *
 * @module shell/desktop/ModuleLoader
 * @see SUCCESS CRITERIA Phase 3.2
 */

import React from 'react';
import { ModuleRenderer } from '../../config/moduleComponents';
import { useModuleRegistryStore } from '../../stores/moduleRegistryStore';

// ============================================================================
// Types
// ============================================================================

interface ModuleLoaderProps {
  moduleId: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Not found state when module doesn't exist in registry
 */
const NotFoundState: React.FC<{ moduleId: string }> = ({ moduleId }) => (
  <div
    data-testid='module-not-found'
    role='alert'
    className='w-full h-full flex flex-col items-center justify-center p-6'
    style={{
      background: 'linear-gradient(135deg, hsl(var(--tf-neutral-hs) 5% / 0.95) 0%, hsl(var(--tf-neutral-hs) 8% / 0.9) 100%)',
    }}
  >
    {/* Warning icon */}
    <div
      className='w-16 h-16 rounded-full flex items-center justify-center mb-4'
      style={{
        background: 'hsl(var(--tf-amber-hs) 50% / 0.15)',
        border: '1px solid hsl(var(--tf-amber-hs) 50% / 0.3)',
        boxShadow: '0 0 30px hsl(var(--tf-amber-hs) 50% / 0.2)',
      }}
    >
      <svg
        className='w-8 h-8'
        style={{ color: 'hsl(var(--tf-amber-hs) 50%)' }}
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
    <h3 className='text-lg font-light mb-2' style={{ color: 'hsl(var(--tf-amber-hs) 50%)' }}>
      Module Not Found
    </h3>

    {/* Module ID */}
    <p className='text-white/60 text-sm text-center'>
      The module{' '}
      <code
        className='px-2 py-0.5 rounded'
        style={{
          color: 'hsl(var(--tf-cyan-hs) 50%)',
          background: 'hsl(var(--tf-cyan-hs) 50% / 0.1)',
          border: '1px solid hsl(var(--tf-cyan-hs) 50% / 0.2)',
        }}
      >
        {moduleId || '(empty)'}
      </code>{' '}
      could not be found in the registry.
    </p>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * ModuleLoader - Renders module content inside Window
 *
 * Features:
 * - Direct component rendering (no iframes)
 * - Lazy loading with Suspense
 * - Not found state for unknown modules
 * - Accessible with aria attributes
 * - Full integration with OS state
 */
export const ModuleLoader: React.FC<ModuleLoaderProps> = ({ moduleId, metadata }) => {
  // Get module from registry store
  const module = useModuleRegistryStore((state) => state.getModuleById(moduleId));

  // Module not found in registry
  if (!module) {
    return <NotFoundState moduleId={moduleId} />;
  }

  // Render the module component directly
  return (
    <div
      data-testid='module-loader'
      data-module-id={moduleId}
      className='w-full h-full overflow-auto'
      style={{
        background: 'transparent',
      }}
    >
      <ModuleRenderer module={module} metadata={metadata} />
    </div>
  );
};

export default ModuleLoader;
