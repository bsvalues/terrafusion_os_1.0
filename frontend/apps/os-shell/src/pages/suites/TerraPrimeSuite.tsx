/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - TERRAPRIME SUITE WRAPPER
 * Phase 5: Suite UX Wiring - MWUX Slice #1
 *
 * Embeds TerraPrime (property viewer) in os-shell frame with:
 * - ErrorBoundary integration
 * - Session passthrough (via postMessage)
 * - correlationId propagation
 *
 * Entry: http://localhost:${TF_TERRAPRIME_PORT:-5184}
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '../../components/errors/ErrorBoundary';
import { ErrorDisplay } from '../../components/errors/ErrorDisplay';
import { LegacyDeprecationBanner } from '../../components/legacy/LegacyDeprecationBanner';
import { getViteEnv } from '../../shared/viteEnv';
import { emitLegacyUiHit } from '../../telemetry/legacyUiTelemetry';

// Get port from env or use default (Jest-compatible via getViteEnv)
const env = getViteEnv();
const TERRAPRIME_PORT = env.VITE_TF_TERRAPRIME_PORT || '5184';
const TERRAPRIME_URL = `http://localhost:${TERRAPRIME_PORT}`;

/**
 * Allowed origins for postMessage communication
 * Only accept messages from known suite origins
 */
const ALLOWED_ORIGINS = new Set([
  `http://localhost:${TERRAPRIME_PORT}`,
  `https://localhost:${TERRAPRIME_PORT}`,
  // Add production origins when deployed
]);

/**
 * Valid message types from suites
 */
const VALID_MESSAGE_TYPES = new Set(['TF_ERROR', 'TF_NAVIGATE', 'TF_NOTIFY', 'TF_READY']);

interface SuiteError {
  correlationId: string;
  message: string;
  code: string;
  retryable: boolean;
  timestamp: string;
}

/**
 * Loading skeleton for suite iframe
 */
const SuiteLoader: React.FC = () => (
  <div className='flex items-center justify-center h-full min-h-[400px] bg-gray-50'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
      <p className='text-gray-600'>Loading TerraPrime...</p>
    </div>
  </div>
);

/**
 * Connection error display
 */
const ConnectionError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className='flex items-center justify-center h-full min-h-[400px] bg-gray-50'>
    <div className='max-w-md w-full p-6'>
      <ErrorDisplay
        error={{
          message: `Unable to connect to TerraPrime at ${TERRAPRIME_URL}`,
          errorCode: 'SUITE_CONNECTION_ERROR',
          correlationId: `net-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          component: 'TerraPrimeSuite',
        }}
      />
      <div className='mt-4 flex justify-center'>
        <button
          onClick={onRetry}
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          🔄 Retry Connection
        </button>
      </div>
      <p className='mt-4 text-sm text-gray-500 text-center'>
        Ensure TerraPrime is running:{' '}
        <code className='bg-gray-100 px-1 rounded'>
          cd applications/terra-primeview-production && pnpm dev
        </code>
      </p>
    </div>
  </div>
);

/**
 * TerraPrimeSuite - Iframe bridge wrapper for TerraPrime
 *
 * Modes:
 * - embed: Full iframe integration with message bridge
 * - redirect: Opens in new tab (fallback)
 */
export const TerraPrimeSuite: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Build iframe URL with path passthrough
  const getIframeUrl = useCallback(() => {
    // Extract sub-path after /suites/terra-prime
    const subPath = location.pathname.replace(/^\/suites\/terra-prime\/?/, '');
    return subPath ? `${TERRAPRIME_URL}/${subPath}` : TERRAPRIME_URL;
  }, [location.pathname]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // SECURITY: Only accept messages from explicitly allowed origins
      if (!ALLOWED_ORIGINS.has(event.origin)) {
        console.warn(`[TerraPrimeSuite] Rejected message from unknown origin: ${event.origin}`);
        return;
      }

      const { type, payload } = event.data || {};

      // SECURITY: Validate message type
      if (!type || !VALID_MESSAGE_TYPES.has(type)) {
        console.warn(`[TerraPrimeSuite] Rejected invalid message type: ${type}`);
        return;
      }

      switch (type) {
        case 'TF_ERROR':
          console.error('TerraPrime error:', payload);
          // Could surface via ErrorContext here
          break;

        case 'TF_NAVIGATE':
          // Suite requests navigation to another shell route
          // SECURITY: Only allow navigation to shell routes (not external)
          if (
            payload?.route &&
            typeof payload.route === 'string' &&
            payload.route.startsWith('/')
          ) {
            navigate(payload.route);
          }
          break;

        case 'TF_NOTIFY':
          // Suite sends notification
          console.debug('TerraPrime notification:', payload);
          // Could surface via toast here
          break;

        case 'TF_READY':
          // Suite signals ready
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  // Handle iframe load/error
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Retry connection
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount((c) => c + 1);
  }, []);

  // Send session token to iframe
  useEffect(() => {
    if (!isLoading && iframeRef.current?.contentWindow) {
      const token = sessionStorage.getItem('tf_session_token');
      if (token) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'TF_SESSION_HANDOFF',
            payload: {
              token,
              correlationId: `corr-${Date.now().toString(36)}`,
            },
          },
          TERRAPRIME_URL
        );
      }
    }
  }, [isLoading]);

  // Emit legacy.ui_hit telemetry on first visit
  const handleTelemetry = useCallback(
    (event: { legacyAppId: string; route: string; action: 'view' | 'dismiss' | 'upgrade' }) => {
      if (event.action === 'view') {
        emitLegacyUiHit({
          legacyAppId: event.legacyAppId,
          route: event.route,
        });
      }
    },
    []
  );

  if (hasError) {
    return <ConnectionError onRetry={handleRetry} />;
  }

  return (
    <div className='h-full w-full flex flex-col'>
      {/* Legacy Deprecation Banner */}
      <LegacyDeprecationBanner
        legacyAppId='suites.terra-prime'
        route={location.pathname}
        onTelemetry={handleTelemetry}
      />

      {/* Suite Header */}
      <div className='bg-white border-b px-4 py-2 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-lg font-semibold'>📋 TerraPrime</span>
          <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded'>
            Property Viewer
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => window.open(getIframeUrl(), '_blank')}
            className='text-xs text-gray-500 hover:text-gray-700'
            title='Open in new tab'
          >
            ↗️ Pop out
          </button>
        </div>
      </div>

      {/* Suite Content */}
      <div className='flex-1 relative'>
        {isLoading && <SuiteLoader />}
        <iframe
          key={retryCount} // Force remount on retry
          ref={iframeRef}
          src={getIframeUrl()}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className={`w-full h-full border-0 ${isLoading ? 'hidden' : 'block'}`}
          title='TerraPrime - Property Viewer'
          sandbox='allow-scripts allow-same-origin allow-forms allow-popups'
        />
      </div>
    </div>
  );
};

/**
 * TerraPrimeSuiteWithBoundary - Wrapped with ErrorBoundary
 */
const TerraPrimeSuiteWithBoundary: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<SuiteLoader />}>
      <TerraPrimeSuite />
    </Suspense>
  </ErrorBoundary>
);

export default TerraPrimeSuiteWithBoundary;
