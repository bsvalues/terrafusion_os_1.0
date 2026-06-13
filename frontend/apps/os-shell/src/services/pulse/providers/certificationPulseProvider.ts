/**
 * Certification Readiness — Pulse Source Pilot
 * ═══════════════════════════════════════════════════════════════
 *
 * The FIRST real Pulse provider. It reads the governed TerraDais certification
 * readiness source (`/api/dais/cert/status`) and maps it into the PulseHome
 * contract: a {@link PulseCondition}, an optional {@link PulsePriorityAction},
 * and a {@link PulseSourceAttribution}. Returned as a `readBrief`-compatible
 * region reader for {@link getPulseHomeSnapshot}.
 *
 * This is the proof that the architecture is real:
 *   governed source → provider → PulseRead<PulseHomeBrief> → snapshot.
 *
 * Honesty:
 * - Every value is DERIVED from real `CertificationStatus` fields. Nothing is
 *   fabricated.
 * - If the source throws or returns no data, this returns
 *   {@link pulseUnavailable} with a reason — never a placeholder value.
 * - The live read always carries its source attribution.
 * - No UI. No StageZeroState. Single domain only (certification).
 *
 * @see contracts/pulseHome.ts
 * @see services/pulse/pulseHomeService.ts
 * @see services/suites/daisService.ts (getCertificationStatus)
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
import {
  getCertificationStatus,
  type CertificationStatus,
} from '../../suites/daisService';

/** Injectable dependency so the provider is testable without a network. */
export interface CertificationPulseDeps {
  getCertificationStatus: () => Promise<CertificationStatus[]>;
}

const DEFAULT_DEPS: CertificationPulseDeps = { getCertificationStatus };

/** Worst-to-best severity ranking for choosing the overall condition. */
const SEVERITY: Record<PulseConditionLevel, number> = {
  critical: 3,
  attention: 2,
  watching: 1,
  stable: 0,
};

/** Map one certification area's status to a Pulse condition level. */
function levelFor(s: CertificationStatus): PulseConditionLevel {
  if (s.status === 'overdue') return 'critical';
  if (s.status === 'at-risk') return 'attention';
  if (s.percentComplete >= 100) return 'stable';
  return 'watching';
}

function urgencyFor(level: PulseConditionLevel): PulseUrgency {
  if (level === 'critical') return 'today';
  if (level === 'attention') return 'this_week';
  return 'scheduled';
}

/**
 * Read certification readiness as a PulseHome brief. `readBrief`-compatible.
 *
 * @param ctx   County scope from the read layer.
 * @param deps  Injectable source (defaults to the governed daisService call).
 */
export async function readCertificationBrief(
  ctx: PulseReaderContext,
  deps: CertificationPulseDeps = DEFAULT_DEPS
): Promise<PulseRead<PulseHomeBrief>> {
  let statuses: CertificationStatus[];
  try {
    statuses = await deps.getCertificationStatus();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return pulseUnavailable(`Certification readiness unavailable: ${message}`);
  }

  if (!Array.isArray(statuses) || statuses.length === 0) {
    return pulseUnavailable('Certification readiness source returned no data.');
  }

  const observedAt = new Date().toISOString();
  const source: PulseSourceAttribution = {
    system: 'TerraDais certification readiness',
    reference: 'dais:/api/dais/cert/status',
    observedAt,
    classification: 'CONFIDENTIAL',
  };

  // Overall condition = worst area; tie-break to the least-complete area.
  let worst = statuses[0];
  let overall = levelFor(statuses[0]);
  for (const s of statuses) {
    const level = levelFor(s);
    if (
      SEVERITY[level] > SEVERITY[overall] ||
      (SEVERITY[level] === SEVERITY[overall] && s.percentComplete < worst.percentComplete)
    ) {
      worst = s;
      overall = level;
    }
  }

  const overdueCount = statuses.filter((s) => s.status === 'overdue').length;
  const atRiskCount = statuses.filter((s) => s.status === 'at-risk').length;
  const incompleteCount = statuses.filter((s) => s.percentComplete < 100).length;

  const reason =
    overall === 'critical'
      ? `${overdueCount} certification area${overdueCount === 1 ? '' : 's'} overdue.`
      : overall === 'attention'
        ? `${atRiskCount} certification area${atRiskCount === 1 ? '' : 's'} at risk.`
        : overall === 'watching'
          ? `${incompleteCount} certification area${incompleteCount === 1 ? '' : 's'} still completing.`
          : 'All certification areas complete.';

  const condition: PulseCondition = {
    function: 'certification',
    level: overall,
    reason,
    destination: 'certification.roll-readiness',
  };

  const priorityActions: PulsePriorityAction[] = [];
  if (overall !== 'stable') {
    priorityActions.push({
      id: `cert-${worst.area}`,
      title: `Resolve ${worst.area} certification`,
      why: `${worst.area} is ${worst.status} at ${worst.percentComplete}% (${worst.completedParcels}/${worst.totalParcels} parcels).`,
      rank: 1,
      urgency: urgencyFor(overall),
      dueLabel: worst.deadline ? `Due ${worst.deadline}` : undefined,
      // No fabricated evidence: counts above are derived from the source and
      // narrated in `why`. The evidence region stays empty until wired.
      evidence: [],
      destination: 'certification.roll-readiness',
    });
  }

  const brief: PulseHomeBrief = {
    county: ctx.county,
    generatedAt: observedAt,
    overallCondition: overall,
    headline:
      overall === 'stable'
        ? 'Roll certification is complete across all areas.'
        : `Certification needs attention: ${reason}`,
    conditions: [condition],
    priorityActions,
    recommendedFirstActionId: priorityActions[0]?.id,
  };

  return pulseLive(brief, source);
}
