/**
 * TerraDossier Badge Provider — Evidence/document status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';

export const dossierBadgeProvider: BadgeProvider = {
  owner: 'dossier',
  async getBadges(_parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    // TODO: Wire to real Dossier API when available
    return [];
  },
};
