/**
 * SuiteLauncher - Constitutional Suite Navigation
 * ═══════════════════════════════════════════════════════════════
 *
 * Displays ONLY constitutional suites from SUITE_REGISTRY.
 * Legacy modules are hidden or clearly labeled as deprecated.
 *
 * Follows the Hierarchy of Materials:
 * - Shell: Liquid Glass container
 * - Infrastructure: Bento grid layout
 * - Interactive: Tactile button feedback
 *
 * @see config/suiteRegistry.ts - Single source of truth
 */

import { useNavigate } from 'react-router-dom';
import {
    CONSTITUTIONAL_SUITES,
    OS_FEATURES,
    type OsFeatureDefinition,
    type SuiteDefinition
} from '../../config/suiteRegistry';

// Icon imports - using Lucide
import {
    Activity,
    Bot,
    Building,
    ChevronRight,
    Compass,
    FileStack,
    Globe,
    Hammer,
    LayoutDashboard,
    type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Hammer,
  Globe,
  LayoutDashboard,
  FileStack,
  Bot,
  Compass,
  Activity,
  Building,
};

type LauncherStatus = SuiteDefinition['status'] | OsFeatureDefinition['status'];

function getLauncherStatusLabel(status: LauncherStatus): string | null {
  switch (status) {
    case 'live':
      return null;
    case 'wip':
      return 'In progress';
    case 'planned':
      return 'Planned';
    default:
      return null;
  }
}

function getLauncherStatusClassName(status: Exclude<LauncherStatus, 'live'>): string {
  switch (status) {
    case 'planned':
      return 'bg-slate-500/20 text-slate-300 border border-slate-400/30';
    case 'wip':
    default:
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  }
}

interface SuiteCardProps {
  suite: SuiteDefinition;
  onClick: () => void;
}

function SuiteCard({ suite, onClick }: SuiteCardProps) {
  const Icon = ICON_MAP[suite.iconName] || Globe;
  const statusLabel = getLauncherStatusLabel(suite.status);

  return (
    <button
      onClick={onClick}
      className='group relative flex flex-col items-start p-6 rounded-2xl 
                 bg-slate-900/60 backdrop-blur-xl border border-white/10
                 hover:border-white/20 hover:bg-slate-800/70
                 transition-all duration-200 text-left
                 focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
      style={{
        boxShadow: `0 0 0 0 ${suite.color}00`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 32px ${suite.color}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 0 ${suite.color}00`;
      }}
    >
      {/* Icon */}
      <div className='p-3 rounded-xl mb-4' style={{ backgroundColor: `${suite.color}20` }}>
        <Icon size={28} style={{ color: suite.color }} />
      </div>

      {/* Title & Description */}
      <h3 className='text-lg font-medium text-white mb-1'>{suite.displayName}</h3>
      <p className='text-sm text-slate-400 line-clamp-2'>{suite.description}</p>

      {/* Status badge */}
      {statusLabel && (
        <span
          data-testid={`suite-status-badge-${suite.id}`}
          className={`absolute top-4 right-4 px-2 py-0.5 text-xs rounded-full ${getLauncherStatusClassName(suite.status)}`}
        >
          {statusLabel}
        </span>
      )}

      {/* Hover arrow */}
      <ChevronRight
        size={20}
        className='absolute bottom-6 right-6 text-slate-500 
                   opacity-0 group-hover:opacity-100 
                   translate-x-[-8px] group-hover:translate-x-0
                   transition-all duration-200'
      />
    </button>
  );
}

interface FeatureChipProps {
  feature: OsFeatureDefinition;
  onClick?: () => void;
}

function FeatureChip({ feature, onClick }: FeatureChipProps) {
  const Icon = ICON_MAP[feature.iconName] || Activity;
  const statusLabel = getLauncherStatusLabel(feature.status);

  return (
    <button
      onClick={onClick}
      disabled={!feature.route}
      className='flex items-center gap-2 px-3 py-2 rounded-lg
                 bg-slate-800/50 border border-white/5
                 hover:bg-slate-700/50 hover:border-white/10
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-150'
    >
      <Icon size={16} className='text-cyan-400' />
      <span className='text-sm text-slate-300'>{feature.shortName}</span>
      {statusLabel && (
        <span
          data-testid={`feature-status-badge-${feature.id}`}
          className={`text-xs ${feature.status === 'planned' ? 'text-slate-400' : 'text-slate-500'}`}
        >
          {statusLabel}
        </span>
      )}
    </button>
  );
}

export interface SuiteLauncherProps {
  showLegacy?: boolean;
  onSuiteSelect?: (suiteId: string) => void;
}

export function SuiteLauncher({ showLegacy = false, onSuiteSelect }: SuiteLauncherProps) {
  const navigate = useNavigate();

  const handleSuiteClick = (suite: SuiteDefinition) => {
    if (onSuiteSelect) {
      onSuiteSelect(suite.id);
    }
    navigate(suite.route);
  };

  const handleFeatureClick = (feature: OsFeatureDefinition) => {
    if (feature.route) {
      if (onSuiteSelect) {
        onSuiteSelect(feature.id);
      }
      navigate(feature.route);
    }
  };

  return (
    <div className='w-full max-w-5xl mx-auto p-6'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-light text-white mb-2'>
          TerraFusion <span className='text-cyan-400'>Suites</span>
        </h1>
        <p className='text-slate-400'>
          Constitutional experience surfaces for county assessment operations.
        </p>
      </div>

      {/* Primary Workbench CTA */}
      <div
        className='mb-8 p-6 rounded-2xl 
                   bg-gradient-to-br from-cyan-500/10 to-blue-500/10
                   border border-cyan-500/20 cursor-pointer
                   hover:border-cyan-500/40 transition-all duration-200'
        onClick={() => navigate('/property/search')}
      >
        <div className='flex items-center gap-4'>
          <div className='p-3 rounded-xl bg-cyan-500/20'>
            <Building size={28} className='text-cyan-400' />
          </div>
          <div className='flex-1'>
            <h2 className='text-lg font-medium text-white'>Property Workbench</h2>
            <p className='text-sm text-slate-400'>
              Search for a parcel to open the unified property workspace
            </p>
          </div>
          <ChevronRight size={24} className='text-cyan-400' />
        </div>
      </div>

      {/* Suite Grid - Bento Layout */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
        {CONSTITUTIONAL_SUITES.map((suite) => (
          <SuiteCard key={suite.id} suite={suite} onClick={() => handleSuiteClick(suite)} />
        ))}
      </div>

      {/* OS Features */}
      <div className='border-t border-white/5 pt-6'>
        <h3 className='text-sm font-medium text-slate-500 uppercase tracking-wider mb-4'>
          OS Features
        </h3>
        <div className='flex flex-wrap gap-2'>
          {OS_FEATURES.map((feature) => (
            <FeatureChip
              key={feature.id}
              feature={feature}
              onClick={() => handleFeatureClick(feature)}
            />
          ))}
        </div>
      </div>

      {/* Legacy Warning */}
      {showLegacy && (
        <div className='mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20'>
          <p className='text-sm text-amber-400'>
            Legacy modules are available in the Start Menu but are not constitutional suites. They
            will be migrated or deprecated in future releases.
          </p>
        </div>
      )}
    </div>
  );
}

export default SuiteLauncher;
