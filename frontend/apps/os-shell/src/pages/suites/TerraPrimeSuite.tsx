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

// Get port from env or use default
const TERRAPRIME_PORT = import.meta.env.VITE_TF_TERRAPRIME_PORT || '5184';
const TERRAPRIME_URL = `http://localhost:${TERRAPRIME_PORT}`;

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
      // Only accept messages from TerraPrime origin
      if (!event.origin.includes(`localhost:${TERRAPRIME_PORT}`)) {
        return;
      }

      const { type, payload } = event.data || {};

      switch (type) {
        case 'TF_ERROR':
          console.error('TerraPrime error:', payload);
          // Could surface via ErrorContext here
          break;

        case 'TF_NAVIGATE':
          // Suite requests navigation to another shell route
          if (payload?.route) {
            navigate(payload.route);
          }
          break;

        case 'TF_NOTIFY':
          // Suite sends notification
          console.log('TerraPrime notification:', payload);
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

  if (hasError) {
    return <ConnectionError onRetry={handleRetry} />;
  }

  return (
    <div className='h-full w-full flex flex-col'>
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
