/**
 * Phase 48A: ToolRunner Preflight (Additive)
 */

import type { PolicyDecision, PreflightPolicy, PreflightRequest } from '../types/commandGovernance.js';
import { normalizeDecision } from '../types/commandGovernance.js';

export function createPreflight(policy?: PreflightPolicy) {
  const p: PreflightPolicy = policy ?? (() => ({ allow: true }));

  return Object.freeze({
    decide(req: PreflightRequest): PolicyDecision {
      try {
        return normalizeDecision(p(req));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Policy exception';
        return { allow: false, reason: msg || 'Policy exception', visibility: 'restricted' };
      }
    },
  });
}
