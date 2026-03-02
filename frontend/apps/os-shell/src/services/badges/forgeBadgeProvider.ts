/**
 * TerraForge Badge Provider — Valuation status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';

export const forgeBadgeProvider: BadgeProvider = {
  owner: 'forge',
  async getBadges(_parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    // TODO: Wire to real Forge API when available
    return [
      {
        key: 'forge-valuation-status',
        label: 'Valuation Current',
        severity: 'info',
        classification: 'PUBLIC',
        tooltip: 'Property valuation is up to date',
      },
    ];
  },
};
