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
 * Fallback: When a service is stopped but has a ShellRoute in the registry,
 * AppFrame iframes the shell's own route for that module (same-origin).
 * This bridges the gap until the standalone service ships, with no change
 * to the window-based UX model.
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

/** Registry entry shape (relevant fields only). */
interface RegistryEntry {
  Url?: string;
  Status?: string;
  ShellRoute?: string;
}

/** Result of resolving a module from the registry. */
type ResolvedTarget =
  | { kind: 'url'; url: string }
  | { kind: 'shellRoute'; url: string }   // same-origin shell route as a full URL
  | { kind: 'notFound' };

/** Reads the backend service registry and resolves the best launch target. */
async function resolveTarget(moduleId: string): Promise<ResolvedTarget> {
  try {
    const res = await fetch('/api/service-registry');
    if (!res.ok) return { kind: 'notFound' };
    const registry = await res.json();
    const entry: RegistryEntry | undefined = registry?.Services?.[moduleId];
    if (!entry) return { kind: 'notFound' };
    // If service is running, use its URL.
    if (entry.Status === 'running' && entry.Url) return { kind: 'url', url: entry.Url };
    // If stopped but has a shell-native route, iframe it at the same origin.
    if (entry.ShellRoute) {
      const shellUrl = `${window.location.origin}${entry.ShellRoute}`;
      return { kind: 'shellRoute', url: shellUrl };
    }
    // Otherwise fall through to error.
    return { kind: 'notFound' };
  } catch {
    return { kind: 'notFound' };
  }
}

export function AppFrame({ moduleId, parcelContext, overrideUrl }: AppFrameProps) {
  const [url, setUrl] = useState<string | null>(overrideUrl ?? null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Resolve launch target from service registry
  useEffect(() => {
    if (overrideUrl) {
      setUrl(overrideUrl);
      return;
    }
    resolveTarget(moduleId).then((target) => {
      if (target.kind === 'url' || target.kind === 'shellRoute') {
        // Both cases iframe a URL — either the standalone service or the
        // shell-native route at the same origin (ShellRoute fallback).
        setUrl(target.url);
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
