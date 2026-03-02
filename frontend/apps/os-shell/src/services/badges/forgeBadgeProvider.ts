/**
 * TerraForge Badge Provider — Valuation status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';
import { fetchPropertyBadgeData } from '../api/workbenchBadgeApi';

export const forgeBadgeProvider: BadgeProvider = {
  owner: 'forge',
  async getBadges(parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    const data = await fetchPropertyBadgeData(parcelId);
    if (!data) return [];

    const currentYear = new Date().getFullYear();
    const isStale = data.appraisalYear != null && data.appraisalYear < currentYear;

    const badges: Badge[] = [
      {
        key: 'forge-valuation-status',
        label: isStale ? `Valuation ${data.appraisalYear}` : 'Valuation Current',
        severity: isStale ? 'warn' : 'info',
        classification: 'PUBLIC',
        tooltip: isStale
          ? `Last appraised in ${data.appraisalYear} — review may be needed`
          : 'Property valuation is up to date',
      },
    ];

    if (data.marketValue > 0 && data.assessedValue > 0) {
      const ratio = data.assessedValue / data.marketValue;
      if (ratio < 0.85 || ratio > 1.15) {
        badges.push({
          key: 'forge-ratio-flag',
          label: 'Ratio Review',
          severity: 'warn',
          classification: 'PUBLIC',
          tooltip: `Assessment ratio ${(ratio * 100).toFixed(0)}% — outside 85–115% band`,
        });
      }
    }

    return badges;
  },
};
