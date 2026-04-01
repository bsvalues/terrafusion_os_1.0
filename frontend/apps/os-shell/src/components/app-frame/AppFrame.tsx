/**
 * AppFrame — Shell host for native TerraFusion apps
 * =======================================================
 * The ONLY way the shell renders a native app.
 * Reads the service registry to get the app URL, then iframes it.
 *
 * Native apps (terrabuild, terra-levy, etc.) run as independent services
 * on their own ports. The shell NEVER imports their code — it only loads
 * their URL here.
 *
 * Wire contract: packages/tf-sdk/src/index.ts
 */

import { useEffect, useRef, useState } from 'react';

// Types mirror packages/tf-sdk/src/index.ts — that is the canonical source of truth.
// Do NOT import from tf-sdk directly here to avoid Vite root boundary issues.

/** Active parcel context passed from shell to app. Mirrors tf-sdk ParcelContext. */
interface ParcelContext {
  parcelId: string;
  countyId: string;
  assessmentYear: number;
  label?: string;
}

/** postMessage payload the shell sends to the app on load. Mirrors tf-sdk LaunchMessage. */
interface LaunchMessage {
  type: 'TF_LAUNCH';
  parcel?: ParcelContext;
  authToken?: string;
  sentAt: string;
}

interface AppFrameProps {
  /** Canonical module ID — used to look up the service registry URL */
  moduleId: string;
  /** Optional parcel context passed to the app on load via postMessage */
  parcelContext?: ParcelContext;
  /** Override URL (skips registry lookup) — for testing only */
  overrideUrl?: string;
}

/** Reads the backend service registry JSON for app base URLs. */
async function resolveAppUrl(moduleId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/service-registry');
    if (!res.ok) return null;
    const registry = await res.json();
    const entry = registry?.Services?.[moduleId];
    return entry?.Url ?? null;
  } catch {
    return null;
  }
}

export function AppFrame({ moduleId, parcelContext, overrideUrl }: AppFrameProps) {
  const [url, setUrl] = useState<string | null>(overrideUrl ?? null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Resolve URL from service registry
  useEffect(() => {
    if (overrideUrl) {
      setUrl(overrideUrl);
      return;
    }
    resolveAppUrl(moduleId).then((resolved) => {
      if (resolved) {
        setUrl(resolved);
      } else {
        setStatus('error');
        setErrorMsg(
          `${moduleId} is not registered in the service registry. Start the app server first.`
        );
      }
    });
  }, [moduleId, overrideUrl]);

  // Post parcel context to the app once it loads
  const handleLoad = () => {
    setStatus('ready');
    if (parcelContext && iframeRef.current?.contentWindow) {
      const msg: LaunchMessage = {
        type: 'TF_LAUNCH',
        parcel: parcelContext,
        sentAt: new Date().toISOString(),
      };
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  };

  const handleError = () => {
    setStatus('error');
    setErrorMsg(`Failed to load ${moduleId}. Is the app server running on ${url}?`);
  };

  if (status === 'error') {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'hsl(var(--tf-bg))',
          color: 'hsl(var(--tf-muted))',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '2rem' }}>⚠</span>
        <p style={{ fontSize: '0.875rem', maxWidth: '360px' }}>{errorMsg}</p>
        <code
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            background: 'hsl(var(--tf-surface-2))',
            color: 'hsl(var(--tf-fg))',
          }}
        >
          cd packages/{moduleId === 'costforge' ? 'terrabuild' : moduleId} && PORT=5002 npm run dev
        </code>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'hsl(var(--tf-bg))',
            color: 'hsl(var(--tf-muted))',
            fontSize: '0.875rem',
          }}
        >
          Starting {moduleId}…
        </div>
      )}
      {url && (
        <iframe
          ref={iframeRef}
          src={url}
          title={moduleId}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            background: 'hsl(var(--tf-bg))',
          }}
          // Allow same-origin scripts and forms inside the app
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      )}
    </div>
  );
}
