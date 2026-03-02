/**
 * TerraDais Badge Provider — Workflow/admin status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';

export const daisBadgeProvider: BadgeProvider = {
  owner: 'dais',
  async getBadges(_parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    // TODO: Wire to real Dais API when available
    return [
      {
        key: 'dais-cert-status',
        label: 'Not Certified',
        severity: 'warn',
        classification: 'PUBLIC',
        tooltip: 'Roll certification pending for this parcel',
      },
    ];
  },
};
