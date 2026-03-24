/**
 * useSession — reads the TerraFusion session from localStorage.
 *
 * The AuthProvider seeds `tf.session.dev` in dev-preview mode.
 * In production the session is written after login by the backend token exchange.
 */

import { useMemo } from 'react';

const SESSION_KEY = 'tf.session.dev';

export interface TFSession {
  userId: string;
  countyId: string;
  role: string;
  mode: string;
}

const FALLBACK: TFSession = {
  userId: 'anonymous',
  countyId: 'benton',
  role: 'viewer',
  mode: 'pilot',
};

export function useSession(): TFSession {
  return useMemo(() => {
    if (typeof localStorage === 'undefined') return FALLBACK;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return FALLBACK;
      const parsed = JSON.parse(raw);
      // Use trim-or-fallback for all string fields so empty-string values from
      // corrupt or partially-written session objects never reach the header builder
      // as empty strings (which assertCountyContext would reject, leaving x-county-id absent).
      return {
        userId: parsed.userId?.trim() || FALLBACK.userId,
        countyId: parsed.countyId?.trim() || FALLBACK.countyId,
        role: parsed.role?.trim() || FALLBACK.role,
        mode: parsed.mode?.trim() || FALLBACK.mode,
      };
    } catch {
      return FALLBACK;
    }
  }, []);
}
