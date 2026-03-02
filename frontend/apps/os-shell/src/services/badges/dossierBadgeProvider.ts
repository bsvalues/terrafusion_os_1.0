/**
 * TerraDossier Badge Provider — Evidence/document status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';
import { fetchPropertyBadgeData } from '../api/workbenchBadgeApi';

export const dossierBadgeProvider: BadgeProvider = {
  owner: 'dossier',
  async getBadges(parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    const data = await fetchPropertyBadgeData(parcelId);
    if (!data) return [];

    // Dossier badge: indicates data source provenance
    if (data.source) {
      return [
        {
          key: 'dossier-source',
          label: data.source,
          severity: 'info',
          classification: 'PUBLIC',
          tooltip: `Property data sourced from ${data.source}`,
        },
      ];
    }

    return [];
  },
};
