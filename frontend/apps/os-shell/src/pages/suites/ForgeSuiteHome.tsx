/**
 * TerraForge Suite Home -- Property Valuation & Cost Analysis
 * ===================================================================
 * Constitutional Suite: forge (Article I)
 * Standalone route: /forge
 *
 * Lineage: BCBSCOSTApp → TerraBuild → TerraFusionBuild → CostForge → TerraForge
 *
 * Layout: Stage Tabs (horizontal) + BentoGrid content area
 * Phase 3 Design Manifesto: replaces sidebar navigation with Stage Tabs
 *
 * Modules (ALL 6 ACTIVE):
 *   - CostForge: Benton County Cost Approach calculator
 *   - CompsForge: Sales comparison analysis
 *   - IncomeForge: Income approach (direct capitalization)
 *   - AppealForge: BOE appeal preparation & defense
 *   - Reconciliation: Three-approach value reconciliation
 *   - Value Audit: FISMA-compliant valuation audit trail
 */

import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Hammer,
  Calculator,
  BarChart3,
  Scale,
  TrendingUp,
  FileSearch,
  Gavel,
} from 'lucide-react';

const CostForgeModule = lazy(() => import('./modules/CostForgeModule'));
const CompsForgeModule = lazy(() => import('./modules/CompsForgeModule'));
const IncomeForgeModule = lazy(() => import('./modules/IncomeForgeModule'));
const AppealForgeModule = lazy(() => import('./modules/AppealForgeModule'));
const ReconciliationModule = lazy(() => import('./modules/ReconciliationModule'));
const ValueAuditModule = lazy(() => import('./modules/ValueAuditModule'));

interface ForgeModuleDef {
  id: string;
  label: string;
  icon: typeof Calculator;
  status: 'active' | 'planned';
  description: string;
}

const FORGE_MODULES: ForgeModuleDef[] = [
  {
    id: 'costforge',
    label: 'CostForge',
    icon: Calculator,
    status: 'active',
    description: 'Benton County Cost Approach — replacement cost calculator',
  },
  {
    id: 'comps',
    label: 'CompsForge',
    icon: BarChart3,
    status: 'active',
    description: 'Sales comparison approach with paired adjustments',
  },
  {
    id: 'income',
    label: 'IncomeForge',
    icon: TrendingUp,
    status: 'active',
    description: 'Income approach — direct capitalization for commercial properties',
  },
  {
    id: 'appeal',
    label: 'AppealForge',
    icon: Gavel,
    status: 'active',
    description: 'BOE appeal preparation, evidence packets, and defense builder',
  },
  {
    id: 'reconcile',
    label: 'Reconciliation',
    icon: Scale,
    status: 'active',
    description: 'Three-approach reconciliation and final opinion of value',
  },
  {
    id: 'audit',
    label: 'Value Audit',
    icon: FileSearch,
    status: 'active',
    description: 'FISMA-compliant audit trail for valuation changes',
  },
];

function ModuleLoading() {
  return (
    <div className='flex items-center justify-center min-h-[400px]'>
      <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading module...</p>
    </div>
  );
}

export default function ForgeSuiteHome() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('costforge');

  return (
    <div data-testid="suite-forge-root" className='h-full flex flex-col' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Header + Stage Tabs */}
      <header
        style={{
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-card-bg) / 0.5)',
        }}
        className='backdrop-blur-xl shrink-0'
      >
        <div className='max-w-[1600px] mx-auto px-6 pt-4 pb-0 flex items-center gap-4'>
          <button
            onClick={() => navigate('/')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div
            className='p-2 rounded-lg'
            style={{ background: 'hsl(var(--tf-suite-forge) / 0.15)' }}
          >
            <Hammer size={24} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
          </div>
          <div>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              TerraForge
            </h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              Property Valuation & Cost Analysis Engine
            </p>
          </div>
        </div>

        {/* Stage Tabs */}
        <nav
          role='tablist'
          aria-label='TerraForge modules'
          className='max-w-[1600px] mx-auto px-6 flex gap-1 mt-3 overflow-x-auto'
        >
          {FORGE_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModule;
            const isPlanned = mod.status === 'planned';
            return (
              <button
                key={mod.id}
                role='tab'
                aria-selected={isActive}
                aria-controls={`forge-panel-${mod.id}`}
                onClick={() => !isPlanned && setActiveModule(mod.id)}
                disabled={isPlanned}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white/10'
                    : isPlanned
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-white/5'
                }`}
                style={{
                  color: isActive
                    ? 'hsl(var(--tf-fg))'
                    : 'hsl(var(--tf-muted))',
                  borderBottom: isActive
                    ? '2px solid hsl(var(--tf-suite-forge))'
                    : '2px solid transparent',
                }}
              >
                <Icon
                  size={16}
                  style={{
                    color: isActive
                      ? 'hsl(var(--tf-suite-forge))'
                      : 'hsl(var(--tf-muted))',
                  }}
                />
                {mod.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Module Content */}
      <main className='flex-1 min-h-0 overflow-y-auto'>
        <Suspense fallback={<ModuleLoading />}>
          {activeModule === 'costforge' && (
            <div role='tabpanel' id='forge-panel-costforge'>
              <CostForgeModule />
            </div>
          )}
          {activeModule === 'comps' && (
            <div role='tabpanel' id='forge-panel-comps'>
              <CompsForgeModule />
            </div>
          )}
          {activeModule === 'income' && (
            <div role='tabpanel' id='forge-panel-income'>
              <IncomeForgeModule />
            </div>
          )}
          {activeModule === 'appeal' && (
            <div role='tabpanel' id='forge-panel-appeal'>
              <AppealForgeModule />
            </div>
          )}
          {activeModule === 'reconcile' && (
            <div role='tabpanel' id='forge-panel-reconcile'>
              <ReconciliationModule />
            </div>
          )}
          {activeModule === 'audit' && (
            <div role='tabpanel' id='forge-panel-audit'>
              <ValueAuditModule />
            </div>
          )}
          {!['costforge', 'comps', 'income', 'appeal', 'reconcile', 'audit'].includes(activeModule) && (
            <div className='p-6 flex items-center justify-center min-h-[400px]'>
              <div className='text-center space-y-3'>
                <Hammer
                  size={48}
                  className='mx-auto'
                  style={{ color: 'hsl(var(--tf-suite-forge) / 0.3)' }}
                />
                <p style={{ color: 'hsl(var(--tf-muted))' }}>
                  {FORGE_MODULES.find((m) => m.id === activeModule)?.label} is under
                  development
                </p>
              </div>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
