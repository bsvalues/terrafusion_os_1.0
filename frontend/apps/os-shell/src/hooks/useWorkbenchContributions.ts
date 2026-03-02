/**
 * TerraFusion OS — useWorkbenchContributions
 * ═══════════════════════════════════════════════════════════════
 *
 * Single hook that queries all WorkbenchContributions and returns
 * unified badges, quick actions (and tabs when needed).
 *
 * Replaces the two separate useEffect loops for badge providers
 * and quick action providers that were duplicated in both
 * PropertyWorkbench and PropertyWorkbenchWindow.
 *
 * @see services/contributions/index.ts — Contribution registry
 * @see contracts/workbench.ts — WorkbenchContribution interface
 */

import { useEffect, useState } from 'react';
import type {
  Badge,
  QuickActionDefinition,
  WorkbenchContext,
  WorkMode,
} from '../../contracts/workbench';
import { WORKBENCH_CONTRIBUTIONS } from '../../services/contributions';

export interface UseWorkbenchContributionsResult {
  badges: Badge[];
  quickActions: QuickActionDefinition[];
  loading: boolean;
}

/**
 * Collects badges and quick actions from all registered WorkbenchContributions.
 *
 * Uses Promise.allSettled so one failing suite doesn't break the others.
 * Re-fetches when parcelId or workMode changes.
 */
export function useWorkbenchContributions(
  parcelId: string | null | undefined,
  workMode: WorkMode,
): UseWorkbenchContributionsResult {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [quickActions, setQuickActions] = useState<QuickActionDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!parcelId) {
      setBadges([]);
      setQuickActions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const ctx: WorkbenchContext = {
      countyId: 'benton', // TODO: from session context
      userId: 'current-user', // TODO: from auth context
      roles: [],
      parcelId,
      workMode,
    };

    // Collect badges from all contributions that have badge providers
    const badgePromises = WORKBENCH_CONTRIBUTIONS
      .filter((c) => c.badgeProvider)
      .map((c) => c.badgeProvider!.getBadges(parcelId, ctx));

    // Collect quick actions from all contributions that implement getQuickActions
    const actionPromises = WORKBENCH_CONTRIBUTIONS
      .filter((c) => c.getQuickActions)
      .map((c) => c.getQuickActions!(ctx));

    Promise.all([
      Promise.allSettled(badgePromises),
      Promise.allSettled(actionPromises),
    ]).then(([badgeResults, actionResults]) => {
      if (cancelled) return;

      const allBadges: Badge[] = [];
      for (const r of badgeResults) {
        if (r.status === 'fulfilled') allBadges.push(...r.value);
      }
      setBadges(allBadges);

      const allActions: QuickActionDefinition[] = [];
      for (const r of actionResults) {
        if (r.status === 'fulfilled') allActions.push(...r.value);
      }
      setQuickActions(allActions);

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [parcelId, workMode]);

  return { badges, quickActions, loading };
}
