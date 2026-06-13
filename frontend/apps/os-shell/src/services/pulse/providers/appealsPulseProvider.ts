/**
 * Appeals — Pulse Source (second real provider)
 * ═══════════════════════════════════════════════════════════════
 *
 * Reads the governed TerraDais appeals source (`getAllAppeals` →
 * `/api/dais/appeals`) and maps it to a {@link PulseCondition} + optional
 * {@link PulsePriorityAction} + {@link PulseSourceAttribution}, returned as a
 * `readBrief`-compatible {@link PulseRead}. Same canonical shape as the
 * certification provider.
 *
 * Honesty:
 * - Every value is DERIVED from real `Appeal` rows. Nothing is fabricated.
 * - An empty list is a legitimate LIVE "zero open appeals" (the endpoint
 *   answered) — distinct from an unavailable source.
 * - A thrown source maps to {@link pulseUnavailable} with a reason.
 * - The live read always carries its source attribution.
 * - Single domain only (appeals). No UI. No StageZeroState.
 *
 * @see contracts/pulseHome.ts
 * @see services/pulse/providers/certificationPulseProvider.ts
 * @see services/suites/daisService.ts (getAllAppeals)
 */

import {
  pulseLive,
  pulseUnavailable,
  type PulseCondition,
  type PulseConditionLevel,
  type PulseHomeBrief,
  type PulsePriorityAction,
  type PulseRead,
  type PulseSourceAttribution,
  type PulseUrgency,
} from '../../../contracts/pulseHome';
import type { PulseReaderContext } from '../pulseHomeService';
import { getAllAppeals, type Appeal } from '../../suites/daisService';

/** Injectable dependency so the provider is testable without a network. */
export interface AppealsPulseDeps {
  getAllAppeals: () => Promise<Appeal[]>;
}

const DEFAULT_DEPS: AppealsPulseDeps = { getAllAppeals };

/** Appeal statuses that are still open work (not decided/withdrawn). */
const OPEN_STATUSES: ReadonlySet<Appeal['status']> = new Set(['filed', 'scheduled', 'hearing']);

function urgencyFor(level: PulseConditionLevel): PulseUrgency {
  if (level === 'critical') return 'today';
  if (level === 'attention') return 'this_week';
  return 'scheduled';
}

/**
 * Read the appeals docket as a PulseHome brief. `readBrief`-compatible.
 *
 * @param ctx   County scope from the read layer.
 * @param deps  Injectable source (defaults to the governed daisService call).
 */
export async function readAppealsBrief(
  ctx: PulseReaderContext,
  deps: AppealsPulseDeps = DEFAULT_DEPS
): Promise<PulseRead<PulseHomeBrief>> {
  let appeals: Appeal[];
  try {
    appeals = await deps.getAllAppeals();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return pulseUnavailable(`Appeals docket unavailable: ${message}`);
  }

  if (!Array.isArray(appeals)) {
    return pulseUnavailable('Appeals source returned an unexpected shape.');
  }

  const observedAt = new Date().toISOString();
  const source: PulseSourceAttribution = {
    system: 'TerraDais appeals',
    reference: 'dais:/api/dais/appeals',
    observedAt,
    classification: 'CONFIDENTIAL',
  };

  const open = appeals.filter((a) => OPEN_STATUSES.has(a.status));
  const inHearing = open.filter((a) => a.status === 'hearing').length;

  // Level derived only from concrete states — no capacity thresholds invented.
  const level: PulseConditionLevel =
    open.length === 0 ? 'stable' : inHearing > 0 ? 'attention' : 'watching';

  const reason =
    open.length === 0
      ? 'No open appeals.'
      : inHearing > 0
        ? `${inHearing} appeal${inHearing === 1 ? '' : 's'} in hearing.`
        : `${open.length} open appeal${open.length === 1 ? '' : 's'}.`;

  const condition: PulseCondition = {
    function: 'appeals',
    level,
    reason,
    destination: 'dossier.appeal-packets',
  };

  const priorityActions: PulsePriorityAction[] = [];
  if (open.length > 0) {
    priorityActions.push({
      id: 'appeals-docket',
      title: 'Work the appeal docket',
      // Qualitative only. Operational counts belong on sourced evidence items,
      // not inlined in action copy (the evidence region may be a gap).
      why:
        inHearing > 0
          ? 'Open appeals include cases now in hearing.'
          : 'Appeals are open and awaiting work.',
      rank: 1,
      urgency: urgencyFor(level),
      evidence: [],
      destination: 'dossier.appeal-packets',
    });
  }

  const brief: PulseHomeBrief = {
    county: ctx.county,
    generatedAt: observedAt,
    overallCondition: level,
    headline:
      open.length === 0
        ? 'No open appeals on the docket.'
        : `Appeals need attention: ${reason}`,
    conditions: [condition],
    priorityActions,
    recommendedFirstActionId: priorityActions[0]?.id,
  };

  return pulseLive(brief, source);
}
