/**
 * SuiteHome - Generic Suite Landing Page
 * ═══════════════════════════════════════════════════════════════
 *
 * Placeholder landing page for constitutional suites.
 * Each suite will eventually have its own specialized home,
 * but this provides the WIP structure.
 *
 * @see config/suiteRegistry.ts
 */

import {
    ArrowLeft,
    Bot,
    Clock,
    FileStack,
    Globe,
    Hammer,
    LayoutDashboard,
    Search,
    Star,
    type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSuiteById, type SuiteId } from '../../config/suiteRegistry';

const ICON_MAP: Record<string, LucideIcon> = {
  Hammer,
  Globe,
  LayoutDashboard,
  FileStack,
  Bot,
};

interface SuiteHomeProps {
  suiteId: SuiteId;
}

export function SuiteHome({ suiteId }: SuiteHomeProps) {
  const navigate = useNavigate();
  const suite = getSuiteById(suiteId);

  if (!suite) {
    return (
      <div className='h-full flex flex-col items-center justify-center bg-slate-950'>
        <p className='text-red-400'>Suite not found: {suiteId}</p>
      </div>
    );
  }

  const Icon = ICON_MAP[suite.iconName] || Globe;

  return (
    <div className='h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
      {/* Header */}
      <header className='border-b border-white/5 bg-slate-900/50 backdrop-blur-xl'>
        <div className='max-w-6xl mx-auto px-6 py-4 flex items-center gap-4'>
          <button
            onClick={() => navigate('/')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
          >
            <ArrowLeft size={20} className='text-slate-400' />
          </button>

          <div className='p-2 rounded-lg' style={{ backgroundColor: `${suite.color}20` }}>
            <Icon size={24} style={{ color: suite.color }} />
          </div>

          <div>
            <h1 className='text-xl font-medium text-white'>{suite.displayName}</h1>
            <p className='text-sm text-slate-400'>{suite.description}</p>
          </div>

          {suite.status !== 'live' && (
            <span
              className='ml-auto px-3 py-1 text-sm rounded-full
                           bg-amber-500/20 text-amber-400 border border-amber-500/30'
            >
              Work in Progress
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-6xl mx-auto px-6 py-8'>
        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          <QuickAction
            icon={Search}
            title='Search'
            description={`Search within ${suite.shortName}`}
            onClick={() => {
              /* TODO */
            }}
          />
          <QuickAction
            icon={Clock}
            title='Recent'
            description='View recent items'
            onClick={() => {
              /* TODO */
            }}
          />
          <QuickAction
            icon={Star}
            title='Favorites'
            description='Your saved items'
            onClick={() => {
              /* TODO */
            }}
          />
        </div>

        {/* Workbench Entry Point */}
        {suite.workbenchTab && (
          <div
            className='p-6 rounded-2xl bg-slate-800/50 border border-white/5
                       hover:border-cyan-500/30 cursor-pointer transition-all'
            onClick={() => navigate('/property/search')}
          >
            <h3 className='text-lg font-medium text-white mb-2'>Open in Property Workbench</h3>
            <p className='text-slate-400'>
              Access {suite.shortName} in parcel context via the Property Workbench.
            </p>
          </div>
        )}

        {/* WIP Notice */}
        <div className='mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20'>
          <h3 className='text-lg font-medium text-amber-400 mb-2'>Suite Under Development</h3>
          <p className='text-slate-400'>
            This suite home page is a placeholder. The full {suite.displayName} experience is being
            built. For now, access {suite.shortName} features through the Property Workbench.
          </p>
        </div>
      </main>
    </div>
  );
}

interface QuickActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickAction({ icon: Icon, title, description, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className='flex items-center gap-4 p-4 rounded-xl
                 bg-slate-800/50 border border-white/5
                 hover:bg-slate-700/50 hover:border-white/10
                 transition-all text-left'
    >
      <Icon size={24} className='text-cyan-400' />
      <div>
        <h4 className='text-white font-medium'>{title}</h4>
        <p className='text-sm text-slate-400'>{description}</p>
      </div>
    </button>
  );
}

// Specific suite exports for lazy loading
export const ForgeHome = () => <SuiteHome suiteId='forge' />;
export const AtlasHome = () => <SuiteHome suiteId='atlas' />;
export const DaisHome = () => <SuiteHome suiteId='dais' />;
export const DossierHome = () => <SuiteHome suiteId='dossier' />;
export const GptHome = () => <SuiteHome suiteId='gpt' />;

export default SuiteHome;
