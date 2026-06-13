/**
 * Pulse Function Summary — multi-provider aggregation
 * ═══════════════════════════════════════════════════════════════
 *
 * Projects a set of single-function Pulse providers into a per-function
 * availability view — the aggregator the Home will eventually render:
 *
 *   Certification: Watching
 *   Appeals:       Stable
 *   Exemptions:    Unavailable
 *   Notices:       Loading
 *
 * This is where partial availability becomes visible: each function is
 * independently live / unavailable / loading, and the truth of one is never
 * borrowed to cover the gap of another.
 *
 * Honesty: a function only shows a `level` when its read is genuinely `live`.
 * Unavailable carries the source's reason; loading is distinct. A provider that
 * throws is projected to `unavailable` — never a fabricated state.
 *
 * @see contracts/pulseHome.ts
 * @see services/pulse/pulseHomeService.ts
 */

import {
  isPulseLive,
  isPulseUnavailable,
  type PulseConditionLevel,
  type PulseCountyRef,
  type PulseFunction,
  type PulseHomeBrief,
  type PulseRead,
  type PulseReadState,
} from '../../contracts/pulseHome';
import type { PulseReaderContext } from './pulseHomeService';

/** A single-function provider: a labelled `readBrief`-compatible reader. */
export interface PulseFunctionSource {
  function: PulseFunction;
  read: (ctx: PulseReaderContext) => Promise<PulseRead<PulseHomeBrief>>;
}

/** Per-function projected state for the aggregator view. */
export interface PulseFunctionAvailability {
  function: PulseFunction;
  state: PulseReadState;
  /** Present only when the read is genuinely live. */
  level?: PulseConditionLevel;
  /** Condition reason (live) or unavailable reason. Absent while loading. */
  reason?: string;
}

/**
 * Project one read into a per-function availability entry. Pure — handles all
 * three read states honestly.
 */
export function projectAvailability(
  fn: PulseFunction,
  read: PulseRead<PulseHomeBrief>
): PulseFunctionAvailability {
  if (isPulseLive(read)) {
    const condition =
      read.data.conditions.find((c) => c.function === fn) ?? read.data.conditions[0];
    return {
      function: fn,
      state: 'live',
      level: condition?.level,
      reason: condition?.reason,
    };
  }
  if (isPulseUnavailable(read)) {
    return { function: fn, state: 'unavailable', reason: read.reason };
  }
  return { function: fn, state: 'loading' };
}

/**
 * Read every function source and project a per-function availability summary.
 * A source that throws is reported as `unavailable` (never fabricated), so one
 * failing provider cannot take down the summary.
 */
export async function summarizePulseFunctions(
  county: PulseCountyRef,
  sources: PulseFunctionSource[]
): Promise<PulseFunctionAvailability[]> {
  const ctx: PulseReaderContext = { county };
  return Promise.all(
    sources.map(async (s) => {
      try {
        return projectAvailability(s.function, await s.read(ctx));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        return {
          function: s.function,
          state: 'unavailable' as const,
          reason: `${s.function} read failed: ${message}`,
        };
      }
    })
  );
}
