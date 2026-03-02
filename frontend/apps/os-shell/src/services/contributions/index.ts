/**
 * TerraFusion OS — Workbench Contribution Registry
 * ═══════════════════════════════════════════════════════════════
 *
 * Unified registry where each suite registers a single WorkbenchContribution
 * object that bundles tabs, badges, and quick actions.
 *
 * This replaces the previous pattern of separate badge and quick-action
 * registries. Suites are self-contained: add one contribution → everything
 * (tabs, badges, actions) comes along automatically.
 *
 * Canonical order: forge → atlas → dais → dossier → os
 *
 * @see contracts/workbench.ts — WorkbenchContribution interface
 * @see hooks/useWorkbenchContributions.ts — Consumption hook
 */

import type {
  WorkbenchContribution,
  WorkbenchContext,
  TabDefinition,
  QuickActionDefinition,
} from '../../contracts/workbench';
import { forgeBadgeProvider } from '../badges/forgeBadgeProvider';
import { atlasBadgeProvider } from '../badges/atlasBadgeProvider';
import { daisBadgeProvider } from '../badges/daisBadgeProvider';
import { dossierBadgeProvider } from '../badges/dossierBadgeProvider';

// ============================================================================
// Suite Contributions
// ============================================================================

const forgeContribution: WorkbenchContribution = {
  async getTabs(): Promise<TabDefinition[]> {
    return [{
      slug: 'forge',
      title: 'Forge',
      icon: '🔥',
      owner: 'forge',
      route: '/property/:parcelId/forge',
      pathSegment: 'forge',
    }];
  },
  badgeProvider: forgeBadgeProvider,
};

const atlasContribution: WorkbenchContribution = {
  async getTabs(): Promise<TabDefinition[]> {
    return [{
      slug: 'atlas',
      title: 'Atlas',
      icon: '🗺️',
      owner: 'atlas',
      route: '/property/:parcelId/atlas',
      pathSegment: 'atlas',
    }];
  },
  badgeProvider: atlasBadgeProvider,
};

const daisContribution: WorkbenchContribution = {
  async getTabs(): Promise<TabDefinition[]> {
    return [{
      slug: 'dais',
      title: 'Dais',
      icon: '⚖️',
      owner: 'dais',
      route: '/property/:parcelId/dais',
      pathSegment: 'dais',
    }];
  },
  badgeProvider: daisBadgeProvider,
};

const dossierContribution: WorkbenchContribution = {
  async getTabs(): Promise<TabDefinition[]> {
    return [{
      slug: 'dossier',
      title: 'Dossier',
      icon: '📁',
      owner: 'dossier',
      route: '/property/:parcelId/dossier',
      pathSegment: 'dossier',
    }];
  },
  badgeProvider: dossierBadgeProvider,
};

const osContribution: WorkbenchContribution = {
  async getTabs(): Promise<TabDefinition[]> {
    return [
      {
        slug: 'summary',
        title: 'Summary',
        icon: '📊',
        owner: 'os',
        route: '/property/:parcelId',
        pathSegment: '',
      },
      {
        slug: 'pilot',
        title: 'Pilot',
        icon: '🤖',
        owner: 'pilot',
        route: '/property/:parcelId/pilot',
        pathSegment: 'pilot',
      },
    ];
  },

  async getQuickActions(ctx: WorkbenchContext): Promise<QuickActionDefinition[]> {
    const actions: QuickActionDefinition[] = [
      {
        id: 'pilot-ask',
        label: '💬 Ask Pilot',
        toolId: 'pilot.ask',
        toolParams: { parcelId: ctx.parcelId },
      },
    ];

    if (ctx.workMode === 'valuation') {
      actions.push({
        id: 'forge-run-comps',
        label: '📊 Run Comps',
        toolId: 'forge.run_comparable_analysis',
        toolParams: { parcelId: ctx.parcelId },
      });
    }

    if (ctx.workMode === 'admin') {
      actions.push({
        id: 'dais-new-workflow',
        label: '📋 New Workflow',
        toolId: 'dais.create_workflow',
        toolParams: { parcelId: ctx.parcelId },
      });
    }

    if (ctx.workMode === 'case') {
      actions.push({
        id: 'dossier-new-packet',
        label: '📁 New Packet',
        toolId: 'dossier.create_packet',
        toolParams: { parcelId: ctx.parcelId },
      });
    }

    return actions;
  },
};

// ============================================================================
// Registry
// ============================================================================

/**
 * All registered suite contributions, in canonical order.
 *
 * To add a new suite:
 * 1. Create its WorkbenchContribution (badge provider, tabs, quick actions)
 * 2. Add it to this array
 * 3. The hook and both workbench components pick it up automatically
 */
export const WORKBENCH_CONTRIBUTIONS: readonly WorkbenchContribution[] = [
  forgeContribution,
  atlasContribution,
  daisContribution,
  dossierContribution,
  osContribution,
];

// ============================================================================
// Canonical Tab Order (synchronous, single source of truth)
// ============================================================================

/**
 * Locked canonical tab order — derived from contributions.
 *
 * Both PropertyWorkbench (route-based) and PropertyWorkbenchWindow (window
 * adapter) should import this instead of maintaining their own tab arrays.
 * This eliminates icon/label drift between the two surfaces.
 *
 * Order matches the Constitution v1.0 specification.
 */
export const CANONICAL_TAB_ORDER: readonly TabDefinition[] = [
  { slug: 'summary', title: 'Summary', icon: '📊', owner: 'os', route: '/property/:parcelId', pathSegment: '' },
  { slug: 'forge', title: 'Forge', icon: '🔥', owner: 'forge', route: '/property/:parcelId/forge', pathSegment: 'forge' },
  { slug: 'atlas', title: 'Atlas', icon: '🗺️', owner: 'atlas', route: '/property/:parcelId/atlas', pathSegment: 'atlas' },
  { slug: 'dais', title: 'Dais', icon: '⚖️', owner: 'dais', route: '/property/:parcelId/dais', pathSegment: 'dais' },
  { slug: 'dossier', title: 'Dossier', icon: '📁', owner: 'dossier', route: '/property/:parcelId/dossier', pathSegment: 'dossier' },
  { slug: 'pilot', title: 'Pilot', icon: '🤖', owner: 'pilot', route: '/property/:parcelId/pilot', pathSegment: 'pilot' },
];
