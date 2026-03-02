/**
 * TerraDais Badge Provider — Workflow/admin status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';
import { fetchPropertyBadgeData } from '../api/workbenchBadgeApi';

export const daisBadgeProvider: BadgeProvider = {
  owner: 'dais',
  async getBadges(parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    const data = await fetchPropertyBadgeData(parcelId);
    if (!data) return [];

    const currentYear = new Date().getFullYear();
    const isCertified = data.appraisalYear != null && data.appraisalYear >= currentYear;

    return [
      {
        key: 'dais-cert-status',
        label: isCertified ? 'Roll Certified' : 'Not Certified',
        severity: isCertified ? 'info' : 'warn',
        classification: 'PUBLIC',
        tooltip: isCertified
          ? `Roll certified for ${currentYear}`
          : 'Roll certification pending for this parcel',
      },
    ];
  },
};
