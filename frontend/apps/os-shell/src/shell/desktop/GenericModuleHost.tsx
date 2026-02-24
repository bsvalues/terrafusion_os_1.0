import { useCallback, useState } from 'react';
import type { ModuleDefinition } from '../../config/modules';
import { useSentinelStore } from '../../sentinel/sentinelStore';
import { useWindowInteraction } from './Window';

interface GenericModuleHostProps {
  module: ModuleDefinition;
}

type IframeState = 'loading' | 'loaded' | 'error';

/**
 * Loading overlay for iframe initialization
 */
function LoadingOverlay({ moduleName }: { moduleName: string }) {
  return (
    <div
      className='absolute inset-0 flex flex-col items-center justify-center z-10'
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--tf-bg) / 0.98) 0%, hsl(var(--tf-bg) / 0.95) 100%)',
      }}
    >
      {/* Quantum spinner */}
      <div
        className='w-12 h-12 rounded-full animate-spin mb-4'
        style={{
          border: '3px solid hsl(var(--tf-accent) / 0.15)',
          borderTopColor: 'hsl(var(--tf-accent) / 1)',
          boxShadow: '0 0 30px hsl(var(--tf-accent) / 0.3)',
        }}
      />
      <p className='text-sm' style={{ color: 'hsl(var(--tf-accent) / 0.8)' }}>
        Loading {moduleName}...
      </p>
    </div>
  );
}

/**
 * Error overlay when app is not reachable
 */
function ErrorOverlay({
  moduleName,
  url,
  onRetry,
}: {
  moduleName: string;
  url: string;
  onRetry: () => void;
}) {
  return (
    <div
      className='absolute inset-0 flex flex-col items-center justify-center z-10 p-6'
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--tf-bg) / 0.98) 0%, hsl(var(--tf-bg) / 0.95) 100%)',
      }}
    >
      {/* Warning icon */}
      <div
        className='w-16 h-16 rounded-full flex items-center justify-center mb-4'
        style={{
          background: 'hsl(var(--tf-error) / 0.15)',
          border: '1px solid hsl(var(--tf-error) / 0.3)',
          boxShadow: '0 0 30px hsl(var(--tf-error) / 0.2)',
        }}
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

      {/* Title */}
      <h3 className='text-lg font-light mb-2 text-red-400'>App Not Reachable</h3>

      {/* Description */}
      <p className='text-white/60 text-sm text-center mb-4 max-w-md'>
        <span className='font-medium text-white/80'>{moduleName}</span> dev server is not
        responding. Make sure the app is running.
      </p>

      {/* URL hint */}
      <div
        className='px-3 py-1.5 rounded-lg mb-5 font-mono text-xs'
        style={{
          background: 'hsl(var(--tf-accent) / 0.1)',
          border: '1px solid hsl(var(--tf-accent) / 0.2)',
          color: 'hsl(var(--tf-accent) / 1)',
        }}
      >
        {url}
      </div>

      {/* Actions */}
      <div className='flex items-center gap-3'>
        <button
          onClick={onRetry}
          className='px-4 py-2 rounded-lg text-sm font-medium transition-all'
          style={{
            background: 'hsl(var(--tf-accent) / 0.15)',
            border: '1px solid hsl(var(--tf-accent) / 0.3)',
            color: 'hsl(var(--tf-accent) / 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'hsl(var(--tf-accent) / 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'hsl(var(--tf-accent) / 0.15)';
          }}
        >
          Retry
        </button>
        <a
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          className='px-4 py-2 rounded-lg text-sm font-medium transition-all text-white/60 hover:text-white/80'
          style={{
            background: 'hsl(var(--tf-text) / 0.05)',
            border: '1px solid hsl(var(--tf-text) / 0.1)',
          }}
        >
          Open in Browser
        </a>
      </div>
    </div>
  );
}

/**
 * Warning banner when Sentinel is unhealthy
 */
function SentinelWarningBanner() {
  const openPanel = useSentinelStore((s) => s.togglePanel);
  return (
    <div
      className='absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-4 py-2 text-xs'
      style={{
        background: 'hsl(var(--tf-error) / 0.15)',
        borderBottom: '1px solid hsl(var(--tf-error) / 0.3)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className='flex items-center gap-2'>
        <div className='w-2 h-2 rounded-full bg-red-500 animate-pulse' />
        <span className='text-red-300 font-medium'>System health degraded</span>
        <span className='text-red-400/60'>— app may not function correctly</span>
      </div>
      <button
        onClick={openPanel}
        className='px-2 py-0.5 rounded text-red-300 hover:text-white transition'
        style={{
          background: 'hsl(var(--tf-error) / 0.2)',
          border: '1px solid hsl(var(--tf-error) / 0.3)',
        }}
      >
        View Status
      </button>
    </div>
  );
}

/**
 * IframeHost component with loading/error states
 */
function IframeHost({ module, url }: { module: ModuleDefinition; url: string }) {
  const [state, setState] = useState<IframeState>('loading');
  const [key, setKey] = useState(0);
  const sentinelStatus = useSentinelStore((s) => s.status);
  const isUnhealthy = sentinelStatus === 'down' || sentinelStatus === 'degraded';

  // Iframe mouse trap fix: disable pointer events during drag/resize
  const { isInteracting } = useWindowInteraction();

  const handleLoad = useCallback(() => {
    setState('loaded');
  }, []);

  const handleError = useCallback(() => {
    setState('error');
  }, []);

  const handleRetry = useCallback(() => {
    setState('loading');
    setKey((k) => k + 1);
  }, []);

  return (
    <div className='relative h-full w-full'>
      {isUnhealthy && state === 'loaded' && <SentinelWarningBanner />}
      {state === 'loading' && <LoadingOverlay moduleName={module.displayName} />}
      {state === 'error' && (
        <ErrorOverlay moduleName={module.displayName} url={url} onRetry={handleRetry} />
      )}
      {/* Transparent overlay during drag/resize to prevent iframe from stealing events */}
      {isInteracting && <div className='absolute inset-0 z-50' />}
      <iframe
        key={key}
        title={module.displayName}
        src={url}
        className='h-full w-full border-0'
        sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-downloads'
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: state === 'loaded' ? 1 : 0,
          paddingTop: isUnhealthy && state === 'loaded' ? '36px' : 0,
          pointerEvents: isInteracting ? 'none' : 'auto', // Disable during drag/resize
        }}
      />
    </div>
  );
}

export function GenericModuleHost({ module }: GenericModuleHostProps) {
  const entry = module.entry;

  if (!entry) {
    return <div className='p-4'>Missing entry for module: {module.id}</div>;
  }

  if (entry.type === 'url') {
    return <IframeHost module={module} url={entry.url} />;
  }

  if (entry.type === 'route') {
    return (
      <div className='p-4'>
        Route entry not yet wired: <code>{entry.route}</code>
      </div>
    );
  }

  if (entry.type === 'mf') {
    return (
      <div className='p-4'>
        MF entry not yet wired: <code>{entry.remote}</code> / <code>{entry.module}</code>
      </div>
    );
  }

  return <div className='p-4'>Unsupported entry type for: {module.id}</div>;
}

export default GenericModuleHost;
