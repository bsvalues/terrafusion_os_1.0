/**
 * TerraAtlas Badge Provider — GIS/boundary status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';
import { fetchPropertyBadgeData } from '../api/workbenchBadgeApi';

export const atlasBadgeProvider: BadgeProvider = {
  owner: 'atlas',
  async getBadges(parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    const data = await fetchPropertyBadgeData(parcelId);
    if (!data) return [];

    // GIS badge: indicates whether the parcel has an address (basic geo presence)
    if (data.address) {
      return [
        {
          key: 'atlas-geo-linked',
          label: 'GIS Linked',
          severity: 'info',
          classification: 'PUBLIC',
          tooltip: 'Parcel has situs address and is GIS-linked',
        },
      ];
    }

    return [
      {
        key: 'atlas-geo-missing',
        label: 'No Situs',
        severity: 'warn',
        classification: 'PUBLIC',
        tooltip: 'Parcel has no situs address — may need GIS review',
      },
    ];
  },
};
