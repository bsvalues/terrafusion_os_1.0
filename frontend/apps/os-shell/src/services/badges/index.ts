/**
 * Badge Provider Registry — All suite BadgeProviders
 * Collected here so the workbench can query all providers at once.
 */

import type { BadgeProvider } from '../../contracts/workbench';
import { forgeBadgeProvider } from './forgeBadgeProvider';
import { atlasBadgeProvider } from './atlasBadgeProvider';
import { daisBadgeProvider } from './daisBadgeProvider';
import { dossierBadgeProvider } from './dossierBadgeProvider';

/** All registered badge providers, in canonical suite order. */
export const BADGE_PROVIDERS: readonly BadgeProvider[] = [
  forgeBadgeProvider,
  atlasBadgeProvider,
  daisBadgeProvider,
  dossierBadgeProvider,
];
