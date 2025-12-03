/**
 * Launchpad Overlay Component
 * Full-screen app grid launcher
 */

import { EliteQuantumIcon } from '@/components/icons/EliteIcons';
import React from 'react';

interface LaunchpadOverlayProps {
  visible: boolean;
  mode: 'county' | 'power';
  onClose: () => void;
  onOpenItem: (itemType: string, itemId: string, itemTitle: string) => void;
}

// Suite and App definitions
const SUITES = [
  { id: 'assessment', icon: 'Database', title: 'Assessment Suite' },
  { id: 'levy', icon: 'Shield', title: 'Levy Management' },
  { id: 'gis', icon: 'Layers', title: 'GIS Platform' },
  { id: 'insights', icon: 'Activity', title: 'AI Insights' },
];

const POWER_APPS = [
  { id: 'costforge', icon: 'Brain', title: 'CostForge AI' },
  { id: 'sync', icon: 'Network', title: 'TerraSync' },
  { id: 'flow', icon: 'Zap', title: 'WorkFlow Engine' },
  { id: 'analytics', icon: 'Gauge', title: 'Advanced Analytics' },
  { id: 'security', icon: 'Lock', title: 'Security Center' },
  { id: 'settings', icon: 'Settings', title: 'System Settings' },
];

const COUNTY_APPS = [
  { id: 'help', icon: 'Settings', title: 'Help & Support' },
  { id: 'reports', icon: 'Activity', title: 'Reports Portal' },
  { id: 'resources', icon: 'HardDrive', title: 'Resources' },
  { id: 'training', icon: 'Monitor', title: 'Training Center' },
];

export function LaunchpadOverlay({ visible, mode, onClose, onOpenItem }: LaunchpadOverlayProps) {
  const [currentMode, setCurrentMode] = React.useState<'power' | 'county'>(mode);

  // Sync with parent mode
  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleItemClick = (itemId: string, itemTitle: string) => {
    onOpenItem('app', itemId, itemTitle);
    onClose();
  };

  if (!visible) return null;

  const apps = currentMode === 'power' ? POWER_APPS : COUNTY_APPS;

  return (
    <div
      className={`tahoe-launchpad ${visible ? 'tahoe-launchpad-visible' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className='tahoe-launchpad-container'>
        {/* Header with Mode Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '48px',
            padding: '0 32px',
          }}
        >
          <h2
            style={{
              fontSize: '32px',
              fontWeight: '300',
              color: 'var(--terra-cyan)',
              margin: 0,
            }}
          >
            Launchpad
          </h2>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setCurrentMode('county')}
              style={{
                padding: '8px 16px',
                background:
                  currentMode === 'county'
                    ? 'rgba(0, 204, 204, 0.15)'
                    : 'rgba(255, 255, 255, 0.04)',
                border:
                  currentMode === 'county'
                    ? '1px solid rgba(0, 204, 204, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color:
                  currentMode === 'county' ? 'rgba(0, 204, 204, 0.95)' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            >
              👥 County Staff
            </button>
            <button
              onClick={() => setCurrentMode('power')}
              style={{
                padding: '8px 16px',
                background:
                  currentMode === 'power' ? 'rgba(0, 204, 204, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border:
                  currentMode === 'power'
                    ? '1px solid rgba(0, 204, 204, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color:
                  currentMode === 'power' ? 'rgba(0, 204, 204, 0.95)' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            >
              ⚡ Power User
            </button>
          </div>
        </div>

        {/* Suites Section */}
        <section style={{ marginBottom: '64px' }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '24px',
              padding: '0 32px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Government Suites
          </h3>
          <div className='tahoe-launchpad-grid'>
            {SUITES.map((suite) => (
              <button
                key={suite.id}
                className='tahoe-launchpad-icon-container'
                onClick={() => handleItemClick(suite.id, suite.title)}
              >
                <EliteQuantumIcon
                  iconType={suite.icon as any}
                  className='w-10 h-10'
                  glowIntensity='medium'
                />
                <div className='tahoe-launchpad-icon-label'>{suite.title}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Apps Section */}
        <section>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '24px',
              padding: '0 32px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {currentMode === 'power' ? 'Power User Tools' : 'County Staff Tools'}
          </h3>
          <div className='tahoe-launchpad-grid'>
            {apps.map((app) => (
              <button
                key={app.id}
                className='tahoe-launchpad-icon-container'
                onClick={() => handleItemClick(app.id, app.title)}
              >
                <EliteQuantumIcon
                  iconType={app.icon as any}
                  className='w-10 h-10'
                  glowIntensity='low'
                />
                <div className='tahoe-launchpad-icon-label'>{app.title}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Close hint */}
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
          }}
        >
          Press{' '}
          <kbd
            style={{
              padding: '2px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              fontFamily: 'SF Mono, Monaco, monospace',
            }}
          >
            ESC
          </kbd>{' '}
          or click outside to close
        </div>
      </div>
    </div>
  );
}
