/**
 * Dock Component
 * macOS-style bottom dock with suite and app icons
 */

import { EliteQuantumIcon } from '@/components/icons/EliteIcons';
import type { UserMode } from './Desktop';

interface DockProps {
  mode: UserMode;
  onLaunchpadToggle: () => void;
  onOpenItem: (id: string, type: 'suite' | 'app', title: string) => void;
  activeApps: string[];
}

export function Dock({ mode, onLaunchpadToggle, onOpenItem, activeApps }: DockProps) {
  const suites = [
    { id: 'assessment', title: 'TerraFusion Assessment', icon: 'Database' },
    { id: 'levy', title: 'TerraFusion Levy', icon: 'Shield' },
    { id: 'gis', title: 'TerraFusion GIS', icon: 'Layers' },
    { id: 'insights', title: 'TerraFusion Insights', icon: 'Activity' },
  ];

  const powerApps = [
    { id: 'costforge', title: 'CostForge AI', icon: 'Brain' },
    { id: 'sync', title: 'TerraSync Intelligence', icon: 'Network' },
    { id: 'flow', title: 'TerraFlow Orchestration', icon: 'Zap' },
    { id: 'analytics', title: 'TerraFusion Analytics', icon: 'Gauge' },
  ];

  const countyApps = [
    { id: 'help', title: 'TerraFusion Support', icon: 'Settings' },
    { id: 'reports', title: 'TerraFusion Reports', icon: 'Activity' },
  ];

  const apps = mode === 'power' ? powerApps : countyApps;

  return (
    <div className='tahoe-dock'>
      {/* Launchpad */}
      <button
        className='tahoe-dock-icon'
        onClick={onLaunchpadToggle}
        title='Launchpad'
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <EliteQuantumIcon iconType='Layers' className='w-7 h-7' glowIntensity='low' />
      </button>

      <div className='tahoe-dock-divider' />

      {/* Suites */}
      {suites.map((suite) => (
        <button
          key={suite.id}
          className={`tahoe-dock-icon ${activeApps.includes(suite.id) ? 'active' : ''}`}
          onClick={() => onOpenItem(suite.id, 'suite', suite.title)}
          title={suite.title}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <EliteQuantumIcon iconType={suite.icon as any} className='w-7 h-7' glowIntensity='low' />
        </button>
      ))}

      <div className='tahoe-dock-divider' />

      {/* Apps */}
      {apps.map((app) => (
        <button
          key={app.id}
          className={`tahoe-dock-icon ${activeApps.includes(app.id) ? 'active' : ''}`}
          onClick={() => onOpenItem(app.id, 'app', app.title)}
          title={app.title}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <EliteQuantumIcon iconType={app.icon as any} className='w-7 h-7' glowIntensity='low' />
        </button>
      ))}
    </div>
  );
}
