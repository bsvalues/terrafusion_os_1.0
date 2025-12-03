/**
 * TerraFusion Desktop OS - Tahoe Style
 * macOS-inspired OS environment with permanent chrome + overlays
 */

import { EliteQuantumIcon } from '@/components/icons/EliteIcons';
import React, { useEffect, useState } from 'react';
import { ActivityBar } from './ActivityBar';
import { LaunchpadOverlay } from './LaunchpadOverlay';
import { TaskManagerWindow } from './TaskManagerWindow';
import { WidgetsColumn } from './WidgetsColumn';

export type UserMode = 'county' | 'power';

type View = { type: 'desktop' } | { type: 'suite'; id: string } | { type: 'app'; id: string };

export const TerraFusionDesktop: React.FC = () => {
  const [mode, setMode] = useState<UserMode>('county');
  const [view, setView] = useState<View>({ type: 'desktop' });
  const [isLaunchpadOpen, setLaunchpadOpen] = useState(false);
  const [isTaskManagerOpen, setTaskManagerOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleMode = () => setMode((prev) => (prev === 'county' ? 'power' : 'county'));

  const openLaunchpad = () => setLaunchpadOpen(true);
  const closeLaunchpad = () => setLaunchpadOpen(false);

  const openTaskManager = () => setTaskManagerOpen(true);
  const closeTaskManager = () => setTaskManagerOpen(false);

  const openSuite = (suiteId: string) => {
    setView({ type: 'suite', id: suiteId });
    setLaunchpadOpen(false);
  };

  const openApp = (appId: string) => {
    setView({ type: 'app', id: appId });
    setLaunchpadOpen(false);
  };

  const selectDockItem = (id: string) => {
    if (id.startsWith('suite:')) {
      openSuite(id.replace('suite:', ''));
    } else if (id.startsWith('app:')) {
      openApp(id.replace('app:', ''));
    } else if (id === 'desktop') {
      setView({ type: 'desktop' });
    }
  };

  const activeLabel =
    view.type === 'desktop'
      ? 'Desktop'
      : view.type === 'suite'
        ? `${capitalize(view.id)} Suite`
        : `${capitalize(view.id)} App`;

  return (
    <div className={`tf-desktop-root tf-mode-${mode}`}>
      {/* Wallpaper + subtle grid */}
      <div className='tf-desktop-wallpaper' />
      <div className='tf-desktop-grid-overlay' />

      {/* Top menu bar */}
      <header className='tf-menu-bar'>
        <div className='tf-menu-left'>
          <div className='tf-menu-brand'>
            <span className='tf-menu-logo'>TerraFusion</span>
            <span className='tf-menu-logo-subtitle'>OS</span>
          </div>
          <span className='tf-menu-item'>Intelligence</span>
          <span className='tf-menu-item'>Suites</span>
          <span className='tf-menu-item'>Operations</span>
          <span className='tf-menu-item'>AI Swarm</span>
          <span className='tf-menu-item'>Excellence</span>
        </div>
        <div className='tf-menu-center'>
          <div className='tf-menu-suite-title'>
            <EliteQuantumIcon iconType='Monitor' className='w-4 h-4' glowIntensity='medium' />
            <span>{activeLabel} - Government Transcended</span>
          </div>
        </div>
        <div className='tf-menu-right'>
          <button className='tf-menu-mode-toggle' type='button' onClick={toggleMode}>
            {mode === 'county' ? 'County Staff' : 'Power User'}
          </button>
          <span className='tf-menu-clock'>
            {time.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
        </div>
      </header>

      {/* Desktop main area: clean like real macOS */}
      <main className='tf-desktop-main'>
        <div className='tf-desktop-main-inner'>
          {/* Clean desktop - only show content when in actual app/suite */}
          {view.type !== 'desktop' && (
            <div className='tf-desktop-center'>{renderWorkspace(view, mode)}</div>
          )}
          <WidgetsColumn view={view} />
        </div>
      </main>

      {/* Launchpad overlay */}
      {isLaunchpadOpen && (
        <LaunchpadOverlay
          mode={mode}
          onClose={closeLaunchpad}
          onOpenSuite={openSuite}
          onOpenApp={openApp}
        />
      )}

      {/* Task manager window */}
      {isTaskManagerOpen && <TaskManagerWindow onClose={closeTaskManager} />}

      {/* Bottom dock / activity bar */}
      <ActivityBar
        mode={mode}
        view={view}
        onOpenLaunchpad={openLaunchpad}
        onOpenTaskManager={openTaskManager}
        onSelectItem={selectDockItem}
      />
    </div>
  );
};

function renderWorkspace(view: View, mode: UserMode): React.ReactNode {
  if (view.type === 'desktop') {
    return null; // Clean desktop like real macOS
  }

  if (view.type === 'suite') {
    switch (view.id) {
      case 'assessment':
        return <SuitePlaceholder name='Assessment' mode={mode} />;
      case 'levy':
        return <SuitePlaceholder name='Levy & Tax' mode={mode} />;
      case 'gis':
        return <SuitePlaceholder name='GIS & Mapping' mode={mode} />;
      case 'insights':
        return <SuitePlaceholder name='TerraInsights' mode={mode} />;
      default:
        return (
          <GlassPanel>
            <h1 className='tf-hero-title'>{capitalize(view.id)} Suite (coming soon)</h1>
            <p className='tf-muted'>
              This suite isn&apos;t wired up yet. We&apos;ll plug in its workspace here.
            </p>
          </GlassPanel>
        );
    }
  }

  // Apps
  if (view.type === 'app') {
    return (
      <GlassPanel>
        <h1 className='tf-hero-title'>{capitalize(view.id)} App</h1>
        <p className='tf-muted'>
          This is a placeholder for the <strong>{view.id}</strong> app. Later, we&apos;ll mount the
          real full-stack app UI here.
        </p>
      </GlassPanel>
    );
  }

  return null;
}

// Clean macOS-style desktop - no center content

interface SuitePlaceholderProps {
  name: string;
  mode: UserMode;
}

const SuitePlaceholder: React.FC<SuitePlaceholderProps> = ({ name, mode }) => (
  <GlassPanel>
    <div className='tf-suite-header'>
      <h1 className='tf-hero-title'>{name} Suite</h1>
      <div className='tf-brand-accent'>TerraFusion Excellence</div>
    </div>
    <p className='tf-muted'>
      {mode === 'county'
        ? `${name} workspace engineered for championship performance - experience government simplified with autonomous workflows and intelligent automation.`
        : `${name} power workspace with infinite scale analytics - leverage infrastructure intelligence for tactical municipal excellence and data-driven decisions.`}
    </p>
    <div className='tf-placeholder-content'>
      <div className='tf-placeholder-section'>
        <h3>Quick Actions</h3>
        <ul>
          <li>View recent items</li>
          <li>Start new workflow</li>
          <li>Access help & guidance</li>
        </ul>
      </div>
      <div className='tf-placeholder-section'>
        <h3>Live Status</h3>
        <ul>
          <li>System: Operational</li>
          <li>Data: Synchronized</li>
          <li>AI: Active</li>
        </ul>
      </div>
    </div>
  </GlassPanel>
);

interface GlassPanelProps {
  children: React.ReactNode;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ children }) => (
  <div className='tf-glass-panel'>{children}</div>
);

// GlassTile removed - using clean macOS desktop approach

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default TerraFusionDesktop;
