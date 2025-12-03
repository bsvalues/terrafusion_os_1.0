/**
 * ActivityBar - Bottom dock with Launchpad, running apps, and system status
 * Tahoe-style glass dock similar to macOS
 */

import { EliteQuantumIcon } from '@/components/icons/EliteIcons';
import React from 'react';
import type { UserMode } from './TerraFusionDesktop';

type View = { type: 'desktop' } | { type: 'suite'; id: string } | { type: 'app'; id: string };

interface ActivityBarProps {
  mode: UserMode;
  view: View;
  onOpenLaunchpad: () => void;
  onOpenTaskManager: () => void;
  onSelectItem: (id: string) => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  mode,
  view,
  onOpenLaunchpad,
  onOpenTaskManager,
  onSelectItem,
}) => {
  // Suite and app definitions
  const suites = [
    {
      id: 'assessment',
      name: 'TerraFusion Assessment',
      icon: <EliteQuantumIcon iconType='Database' className='w-4 h-4' glowIntensity='medium' />,
    },
    {
      id: 'levy',
      name: 'TerraFusion Levy',
      icon: <EliteQuantumIcon iconType='Shield' className='w-4 h-4' glowIntensity='medium' />,
    },
    {
      id: 'gis',
      name: 'TerraFusion GIS',
      icon: <EliteQuantumIcon iconType='Layers' className='w-4 h-4' glowIntensity='medium' />,
    },
    {
      id: 'insights',
      name: 'TerraFusion Insights',
      icon: <EliteQuantumIcon iconType='Activity' className='w-4 h-4' glowIntensity='medium' />,
    },
  ];

  const apps =
    mode === 'power'
      ? [
          {
            id: 'costforge',
            name: 'CostForge AI',
            icon: <EliteQuantumIcon iconType='Brain' className='w-4 h-4' glowIntensity='medium' />,
          },
          {
            id: 'sync',
            name: 'TerraSync Intelligence',
            icon: (
              <EliteQuantumIcon iconType='Network' className='w-4 h-4' glowIntensity='medium' />
            ),
          },
          {
            id: 'flow',
            name: 'TerraFlow Orchestration',
            icon: <EliteQuantumIcon iconType='Zap' className='w-4 h-4' glowIntensity='medium' />,
          },
          {
            id: 'analytics',
            name: 'TerraFusion Analytics',
            icon: <EliteQuantumIcon iconType='Gauge' className='w-4 h-4' glowIntensity='medium' />,
          },
        ]
      : [
          {
            id: 'help',
            name: 'TerraFusion Support',
            icon: (
              <EliteQuantumIcon iconType='Settings' className='w-4 h-4' glowIntensity='medium' />
            ),
          },
          {
            id: 'reports',
            name: 'TerraFusion Reports',
            icon: (
              <EliteQuantumIcon iconType='Activity' className='w-4 h-4' glowIntensity='medium' />
            ),
          },
        ];

  const isActive = (type: string, id: string): boolean => {
    return view.type === type && view.id === id;
  };

  return (
    <div className='tf-activity-bar'>
      <div className='tf-activity-bar-inner'>
        {/* Left: Launchpad button */}
        <div className='tf-activity-left'>
          <button
            className='tf-dock-item tf-launchpad-button'
            onClick={onOpenLaunchpad}
            title='Launchpad (⌘+Space)'
          >
            <div className='tf-dock-icon'>
              <EliteQuantumIcon iconType='Layers' className='w-4 h-4' glowIntensity='medium' />
            </div>
          </button>
          <div className='tf-dock-divider' />
        </div>

        {/* Center: Running suites and apps */}
        <div className='tf-activity-center'>
          {/* Desktop icon */}
          <button
            className={`tf-dock-item ${view.type === 'desktop' ? 'tf-dock-active' : ''}`}
            onClick={() => onSelectItem('desktop')}
            title='Desktop'
          >
            <div className='tf-dock-icon'>
              <EliteQuantumIcon iconType='Monitor' className='w-4 h-4' glowIntensity='medium' />
            </div>
            {view.type === 'desktop' && <div className='tf-dock-indicator' />}
          </button>

          {/* Suite icons */}
          {suites.map((suite) => (
            <button
              key={suite.id}
              className={`tf-dock-item ${isActive('suite', suite.id) ? 'tf-dock-active' : ''}`}
              onClick={() => onSelectItem(`suite:${suite.id}`)}
              title={suite.name}
            >
              <div className='tf-dock-icon'>{suite.icon}</div>
              {isActive('suite', suite.id) && <div className='tf-dock-indicator' />}
            </button>
          ))}

          <div className='tf-dock-divider' />

          {/* App icons */}
          {apps.map((app) => (
            <button
              key={app.id}
              className={`tf-dock-item ${isActive('app', app.id) ? 'tf-dock-active' : ''}`}
              onClick={() => onSelectItem(`app:${app.id}`)}
              title={app.name}
            >
              <div className='tf-dock-icon'>{app.icon}</div>
              {isActive('app', app.id) && <div className='tf-dock-indicator' />}
            </button>
          ))}
        </div>

        {/* Right: System status and Task Manager */}
        <div className='tf-activity-right'>
          <div className='tf-dock-divider' />
          <button className='tf-dock-item' onClick={onOpenTaskManager} title='Task Manager'>
            <div className='tf-dock-icon'>
              <EliteQuantumIcon iconType='CPU' className='w-4 h-4' glowIntensity='medium' />
            </div>
          </button>

          {/* Mode indicator */}
          <div className='tf-mode-indicator'>
            <EliteQuantumIcon iconType='Settings' className='w-4 h-4' glowIntensity='low' />
            <span className='tf-mode-label'>
              {mode === 'county' ? 'Government Excellence' : 'Infrastructure Intelligence'}
            </span>
            <div className={`tf-mode-dot tf-mode-${mode}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
