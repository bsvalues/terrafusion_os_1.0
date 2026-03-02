/**
 * Quick Action Provider Registry
 *
 * Quick actions appear in the Context Ribbon and are tool-bound
 * (execute through TerraPilot routing). Each suite can contribute
 * context-aware actions based on the current parcel and work mode.
 *
 * @see contracts/workbench.ts — QuickActionDefinition, WorkbenchContext
 */

import type { QuickActionDefinition, WorkbenchContext } from '../../contracts/workbench';

// ============================================================================
// Provider Interface
// ============================================================================

export interface QuickActionProvider {
  owner: string;
  getActions(ctx: WorkbenchContext): Promise<QuickActionDefinition[]>;
}

// ============================================================================
// Built-in Providers
// ============================================================================

/** OS-level quick actions — always available */
const osQuickActionProvider: QuickActionProvider = {
  owner: 'os',
  async getActions(ctx) {
    const actions: QuickActionDefinition[] = [
      {
        id: 'pilot-ask',
        label: '💬 Ask Pilot',
        toolId: 'pilot.ask',
        toolParams: { parcelId: ctx.parcelId },
      },
    ];

    // Mode-specific actions
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

/** All registered quick action providers. */
export const QUICK_ACTION_PROVIDERS: readonly QuickActionProvider[] = [
  osQuickActionProvider,
];
