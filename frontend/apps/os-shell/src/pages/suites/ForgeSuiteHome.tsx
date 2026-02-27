/**
 * TerraForge Suite Home -- Property Valuation & Cost Analysis
 * ===================================================================
 * Constitutional Suite: forge (Article I)
 * Standalone route: /forge
 *
 * Lineage: BCBSCOSTApp → TerraBuild → TerraFusionBuild → CostForge → TerraForge
 *
 * Modules:
 *   - CostForge: Benton County Cost Approach calculator
 *   - CompsForge: Sales comparison analysis
 *   - IncomeForge: Income approach (direct capitalization)
 *   - AppealForge: BOE appeal preparation & defense
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
    status: 'planned',
    description: 'Three-approach reconciliation and final value opinion',
  },
  {
    id: 'audit',
    label: 'Value Audit',
    icon: FileSearch,
    status: 'planned',
    description: 'Audit trail for valuation changes and approvals',
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
    <div className='min-h-screen' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-card-bg) / 0.5)',
        }}
        className='backdrop-blur-xl'
      >
        <div className='max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4'>
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
      </header>

      <div className='flex'>
        {/* Module Sidebar */}
        <nav
          className='w-64 shrink-0 p-4 space-y-1'
          style={{ borderRight: '1px solid hsl(var(--tf-border))' }}
        >
          <p
            className='text-xs font-medium uppercase tracking-wider px-3 py-2'
            style={{ color: 'hsl(var(--tf-muted))' }}
          >
            Modules
          </p>
          {FORGE_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModule;
            const isPlanned = mod.status === 'planned';
            return (
              <button
                key={mod.id}
                onClick={() => !isPlanned && setActiveModule(mod.id)}
                disabled={isPlanned}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-white/10'
                    : isPlanned
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-white/5'
                }`}
              >
                <Icon
                  size={18}
                  style={{
                    color: isActive
                      ? 'hsl(var(--tf-suite-forge))'
                      : 'hsl(var(--tf-muted))',
                  }}
                />
                <div>
                  <span
                    className='text-sm font-medium'
                    style={{
                      color: isActive ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
                    }}
                  >
                    {mod.label}
                  </span>
                  {isPlanned && (
                    <span
                      className='block text-xs'
                      style={{ color: 'hsl(var(--tf-muted))' }}
                    >
                      Coming soon
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Module Content */}
        <main className='flex-1 min-w-0'>
          <Suspense fallback={<ModuleLoading />}>
            {activeModule === 'costforge' && <CostForgeModule />}
            {activeModule === 'comps' && <CompsForgeModule />}
            {activeModule === 'income' && <IncomeForgeModule />}
            {activeModule === 'appeal' && <AppealForgeModule />}
            {!['costforge', 'comps', 'income', 'appeal'].includes(activeModule) && (
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
    </div>
  );
}
