/**
 * TerraAtlas Badge Provider — GIS/boundary status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';

export const atlasBadgeProvider: BadgeProvider = {
  owner: 'atlas',
  async getBadges(_parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    // TODO: Wire to real Atlas API when available
    return [];
  },
};
