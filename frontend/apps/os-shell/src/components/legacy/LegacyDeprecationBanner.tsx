/**
 * LegacyDeprecationBanner.tsx
 *
 * Phase 6.3: Deprecation banner for legacy UI routes.
 *
 * Displays a warning banner on legacy routes with:
 * - Deprecation message
 * - Upgrade link to the OS
 * - Dismissible (session-scoped)
 * - ARIA-compliant accessibility
 */

import { useEffect, useState } from 'react';

export interface LegacyDeprecationBannerProps {
  /** Unique identifier for the legacy app/module (e.g., 'suites.appraisal') */
  legacyAppId: string;
  /** Current route path */
  route: string;
  /** Optional callback for telemetry events */
  onTelemetry?: (event: {
    legacyAppId: string;
    route: string;
    action: 'view' | 'dismiss' | 'upgrade';
  }) => void;
  /** Optional additional CSS class */
  className?: string;
}

const STORAGE_KEY_PREFIX = 'legacy_banner_dismissed_';

export function LegacyDeprecationBanner({
  legacyAppId,
  route,
  onTelemetry,
  className,
}: LegacyDeprecationBannerProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${legacyAppId}`;

  // Check if previously dismissed
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  // Emit view telemetry on mount (only if not dismissed)
  useEffect(() => {
    if (!isDismissed && onTelemetry) {
      onTelemetry({ legacyAppId, route, action: 'view' });
    }
  }, [isDismissed, onTelemetry, legacyAppId, route]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore storage errors
    }
    if (onTelemetry) {
      onTelemetry({ legacyAppId, route, action: 'dismiss' });
    }
    setIsDismissed(true);
  };

  const handleUpgradeClick = () => {
    if (onTelemetry) {
      onTelemetry({ legacyAppId, route, action: 'upgrade' });
    }
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <div
      role='alert'
      className={`legacy-deprecation-banner warning-theme ${className ?? ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        backgroundColor: 'hsl(var(--tf-warning-hs) 90%)', // warning-tint background
        borderBottom: '1px solid hsl(var(--tf-warning-hs) 55%)', // warning boundary
        color: 'hsl(var(--tf-warning-hs) 31%)', // warning text contrast
        fontFamily: 'system-ui, sans-serif',
        fontSize: '0.875rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span aria-hidden='true'>⚠️</span>
        <span>
          <strong>Legacy UI deprecated</strong> — use OS.{' '}
          <code
            style={{
              fontSize: '0.75rem',
              backgroundColor: 'hsl(var(--tf-tokens-black-hs) 0% / 0.1)',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
            }}
          >
            {legacyAppId}
          </code>{' '}
          is transitioning to the new TerraFusion OS experience.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <a
          href='/os'
          onClick={handleUpgradeClick}
          style={{
            color: 'hsl(var(--tf-warning-hs) 31%)',
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          Go to OS
        </a>
        <button
          type='button'
          onClick={handleDismiss}
          aria-label='Dismiss deprecation banner'
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            color: 'hsl(var(--tf-warning-hs) 31%)',
            fontSize: '1rem',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
