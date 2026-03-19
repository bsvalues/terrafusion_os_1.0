/**
 * TerraFusion OS Module Route Bridge
 *
 * Bridges URL routing to the module activation orchestrator.
 * Enables deep linking to modules via URLs like:
 * - /m/costforge
 * - /m/terrabuild (alias → costforge)
 * - /m/atlas-ai?focus=0
 * - /m/marketplace?src=deep_link
 *
 * All activations flow through activateModule() - never direct store calls.
 *
 * @module routing/ModuleRouteBridge
 * @see Phase 4: Routing Integration
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';

import { activateModule, type ModuleActivationSource } from '../orchestration/moduleActivation';
import { isModuleRegistered, normalizeModuleId } from '../config/moduleComponents';
import { useAuthContext, toOsActor } from '../auth/useAuthContext';

// ============================================================================
// Types
// ============================================================================

type BridgeState = 'idle' | 'activating' | 'activated' | 'not-found';

// Valid sources that can be specified via URL
const VALID_SOURCES: ModuleActivationSource[] = [
  'start_menu',
  'desktop',
  'route',
  'shortcut',
  'deep_link',
  'system',
];

// ============================================================================
// Query Parameter Helpers
// ============================================================================

/**
 * Parse boolean query parameter.
 * @param value - Query param value ('0', '1', 'true', 'false', etc.)
 * @param defaultValue - Default if not specified
 */
function parseBoolParam(value: string | null, defaultValue: boolean): boolean {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value === '1' || value.toLowerCase() === 'true';
}

/**
 * Parse source query parameter with validation.
 * Only allows known sources, defaults to 'route'.
 */
function parseSourceParam(value: string | null): ModuleActivationSource {
  if (value && VALID_SOURCES.includes(value as ModuleActivationSource)) {
    return value as ModuleActivationSource;
  }
  return 'route';
}

/**
 * Generate a unique key for the current route + params.
 * Used for idempotency checks.
 */
function generateActivationKey(moduleId: string, search: string): string {
  return `${moduleId}|${search}`;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading state while activating module
 */
const LoadingState: React.FC<{ moduleId: string }> = ({ moduleId }) => (
  <div
    data-testid="module-route-loading"
    className="flex flex-col items-center justify-center w-full h-full min-h-[200px] bg-slate-900"
  >
    <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
    <p className="mt-4 text-slate-300 text-sm">
      Loading {moduleId}...
    </p>
  </div>
);

/**
 * Module not found state
 */
const NotFoundState: React.FC<{ moduleId: string }> = ({ moduleId }) => (
  <div
    data-testid="module-not-found"
    className="flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-gradient-to-br from-slate-900 to-slate-800 p-8"
  >
    {/* Warning Icon */}
    <div className="w-20 h-20 rounded-full bg-amber-900/30 flex items-center justify-center mb-6">
      <svg
        className="w-10 h-10 text-amber-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>

    {/* Title */}
    <h1 className="text-2xl font-bold text-white mb-2">Module Not Found</h1>

    {/* Description */}
    <p className="text-slate-400 text-center mb-2">
      The module you're looking for doesn't exist or isn't available.
    </p>

    {/* Module ID */}
    <p className="text-slate-500 text-sm text-center mb-8">
      Requested: <code className="text-amber-400 bg-slate-800 px-2 py-0.5 rounded">{moduleId}</code>
    </p>

    {/* Actions */}
    <div className="flex gap-4">
      <Link
        to="/"
        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium"
      >
        Back to Home
      </Link>
    </div>
  </div>
);

/**
 * Success state - module activated, Desktop Shell will render the window
 */
const ActivatedState: React.FC<{ moduleId: string }> = ({ moduleId }) => (
  <div
    data-testid="module-route-activated"
    className="flex flex-col items-center justify-center w-full h-full min-h-[200px] bg-slate-900"
  >
    <div className="text-4xl mb-4">✅</div>
    <p className="text-slate-300 text-sm">
      {moduleId} activated
    </p>
    <p className="text-slate-500 text-xs mt-2">
      The module window should now be open on the desktop.
    </p>
    <Link
      to="/"
      className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
    >
      Return to Desktop
    </Link>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export interface ModuleRouteBridgeProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * ModuleRouteBridge - Routes URL to module activation
 *
 * Features:
 * - Reads moduleId from route params
 * - Supports query params: focus, warm, src
 * - Idempotent activation (tracks last activation key)
 * - Graceful handling of unknown modules
 * - Loading state during activation
 *
 * @example
 * // In Router.tsx
 * <Route path="/m/:moduleId" element={<ModuleRouteBridge />} />
 *
 * @example
 * // URL patterns
 * /m/costforge           - Basic activation
 * /m/terrabuild          - Alias routing
 * /m/costforge?focus=0   - Don't focus if already open
 * /m/costforge?warm=0    - Skip warm load
 * /m/costforge?src=deep_link - Override source
 */
export const ModuleRouteBridge: React.FC<ModuleRouteBridgeProps> = ({ className = '' }) => {
  // Route params
  const { moduleId: rawModuleId } = useParams<{ moduleId: string }>();
  const location = useLocation();

  // Actor
  const auth = useAuthContext();
  const actor = toOsActor(auth);

  // State
  const [bridgeState, setBridgeState] = useState<BridgeState>('idle');

  // Idempotency: track last activated key
  const lastActivationKeyRef = useRef<string | null>(null);

  // Normalize and validate moduleId
  const moduleId = rawModuleId?.trim() || '';

  // Generate activation key for idempotency
  const activationKey = generateActivationKey(moduleId, location.search);

  useEffect(() => {
    // Skip if no moduleId
    if (!moduleId) {
      setBridgeState('not-found');
      return;
    }

    // Idempotency check: skip if same key
    if (lastActivationKeyRef.current === activationKey) {
      return;
    }

    // Check if module is registered
    // Note: We check BEFORE normalization to see if the raw ID or its alias is valid
    const isValid = isModuleRegistered(moduleId);

    if (!isValid) {
      setBridgeState('not-found');
      lastActivationKeyRef.current = activationKey;
      return;
    }

    // Parse query params
    const searchParams = new URLSearchParams(location.search);
    const focusIfOpen = parseBoolParam(searchParams.get('focus'), true);
    const warmLoad = parseBoolParam(searchParams.get('warm'), true);
    const source = parseSourceParam(searchParams.get('src'));

    // Build metadata
    const metadata = {
      url: location.pathname + location.search,
      routedAt: Date.now(),
    };

    // Mark as activating
    setBridgeState('activating');

    // Activate module through orchestrator
    activateModule(moduleId, {
      source,
      focusIfOpen,
      warmLoad,
      metadata,
      actor,
    })
      .then(() => {
        setBridgeState('activated');
      })
      .catch((error) => {
        // Log error but don't crash - orchestrator handles gracefully
        setBridgeState('not-found');
      });

    // Update last activation key
    lastActivationKeyRef.current = activationKey;
  }, [moduleId, activationKey, location.search, location.pathname]);

  // Render based on state
  switch (bridgeState) {
    case 'idle':
    case 'activating':
      return <LoadingState moduleId={moduleId || 'module'} />;

    case 'not-found':
      return <NotFoundState moduleId={moduleId || '(empty)'} />;

    case 'activated':
      return <ActivatedState moduleId={normalizeModuleId(moduleId)} />;

    default:
      return <LoadingState moduleId={moduleId || 'module'} />;
  }
};

export default ModuleRouteBridge;
