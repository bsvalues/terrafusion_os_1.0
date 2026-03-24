/**
 * TerraDossier Badge Provider — Evidence/document status badges for Context Ribbon
 * @see contracts/workbench.ts — BadgeProvider interface
 */

import type { Badge, BadgeProvider, WorkbenchContext } from '../../contracts/workbench';

export const dossierBadgeProvider: BadgeProvider = {
  owner: 'dossier',
  async getBadges(_parcelId: string, _ctx: WorkbenchContext): Promise<Badge[]> {
    // Dossier owns evidence/document status badges.
    // Data provenance (source system name) is an internal infrastructure detail
    // and must not be exposed in the OS surface layer.
    return [];
  },
};
