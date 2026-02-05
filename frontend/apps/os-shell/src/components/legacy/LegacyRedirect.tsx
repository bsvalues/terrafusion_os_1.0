/**
 * LegacyRedirect.tsx
 *
 * Phase 6.4: Legacy redirect component with telemetry.
 *
 * Emits `legacy.ui_hit` telemetry before redirecting to the target route.
 * Use this instead of `<Navigate />` for legacy paths that need tracking.
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { emitLegacyUiHit } from '../../telemetry/legacyUiTelemetry';

export interface LegacyRedirectProps {
  /** Target route to redirect to */
  to: string;
  /** Unique identifier for the legacy route (e.g., 'modules.property-workbench') */
  legacyAppId: string;
  /** Whether to replace the current history entry */
  replace?: boolean;
}

/**
 * LegacyRedirect - Redirect with telemetry emission
 *
 * Emits a `legacy.ui_hit` event before redirecting to track
 * legacy route usage patterns for deprecation planning.
 */
export function LegacyRedirect({ to, legacyAppId, replace = true }: LegacyRedirectProps) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Emit telemetry for this legacy route hit
    emitLegacyUiHit({
      legacyAppId,
      route: location.pathname,
      referrerRoute: document.referrer ? new URL(document.referrer).pathname : undefined,
    });

    // Perform the redirect
    navigate(to, { replace });
  }, [legacyAppId, location.pathname, navigate, replace, to]);

  // Render nothing while redirecting
  return null;
}
