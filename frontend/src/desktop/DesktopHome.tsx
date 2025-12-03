/**
 * TerraFusion OS - Desktop Home
 *
 * macOS/Windows-style desktop launcher
 * Shows suite tiles and standalone apps
 */

import React, { useEffect, useState } from 'react';
import './desktop.css';

type ModuleKind = 'suite' | 'app';

interface DesktopTile {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'syncing';
  kind: ModuleKind;
}

const TILES: DesktopTile[] = [
  // Suites
  {
    id: 'suite-assessment',
    name: 'Assessment Suite',
    description: 'Parcels, properties, and mass appraisal.',
    status: 'active',
    kind: 'suite',
  },
  {
    id: 'suite-levy',
    name: 'Levy Suite',
    description: 'Levy rates, budgets, and DOR reporting.',
    status: 'active',
    kind: 'suite',
  },
  {
    id: 'suite-gis',
    name: 'GIS Suite',
    description: 'Maps, tax areas, and spatial analysis.',
    status: 'active',
    kind: 'suite',
  },
  {
    id: 'suite-collections',
    name: 'Collections Suite',
    description: 'Tax collection and treasurer workflows.',
    status: 'active',
    kind: 'suite',
  },
  {
    id: 'suite-sync',
    name: 'Sync Suite',
    description: 'Harris PACS, Tyler, Aumentum integration.',
    status: 'syncing',
    kind: 'suite',
  },
  {
    id: 'suite-flow',
    name: 'Flow Suite',
    description: 'Workflow automation and orchestration.',
    status: 'active',
    kind: 'suite',
  },
  {
    id: 'suite-insights',
    name: 'Insights Suite',
    description: 'Analytics, reporting, and dashboards.',
    status: 'active',
    kind: 'suite',
  },
  {
    id: 'suite-agent',
    name: 'Agent Suite',
    description: 'AI agent swarm coordination.',
    status: 'active',
    kind: 'suite',
  },
  {
    id: 'suite-admin',
    name: 'Admin Suite',
    description: 'System configuration and user management.',
    status: 'active',
    kind: 'suite',
  },
  // Apps
  {
    id: 'app-costforge',
    name: 'CostForge AI',
    description: 'Advanced cost modeling and scenarios.',
    status: 'active',
    kind: 'app',
  },
  {
    id: 'app-leafscope',
    name: 'LeafScope',
    description: 'GIS visualization and spatial intelligence.',
    status: 'active',
    kind: 'app',
  },
  {
    id: 'app-emergency',
    name: 'Emergency Quantum',
    description: 'Crisis response and quantum coordination.',
    status: 'active',
    kind: 'app',
  },
];

interface DesktopHomeProps {
  onOpenSuite: (suiteId: string) => void;
  onOpenApp: (appId: string) => void;
  mode: 'county' | 'power';
  onToggleMode: () => void;
}

export const DesktopHome: React.FC<DesktopHomeProps> = ({
  onOpenSuite,
  onOpenApp,
  mode,
  onToggleMode,
}) => {
  const [status, setStatus] = useState('Initializing TerraFusion desktop...');

  useEffect(() => {
    // Simulate initialization
    const timer = setTimeout(() => {
      setStatus('TerraFusion OS Desktop ready • 42 web apps • 17 native modules operational');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLaunch = (tile: DesktopTile) => {
    if (tile.kind === 'suite') {
      const suiteId = tile.id.replace('suite-', '');
      onOpenSuite(suiteId);
    } else {
      const appId = tile.id.replace('app-', '');
      onOpenApp(appId);
    }
  };

  return (
    <div className='desktop-shell'>
      <div className='desktop-background' />
      <div className='desktop-quantum-grid' />

      <div className='desktop-shell-inner'>
        <div className='desktop-header'>
          <div className='desktop-logo'>
            <div className='desktop-logo-orb' />
            <div>
              <div className='desktop-logo-text'>TerraFusion OS</div>
              <div className='desktop-logo-subtitle'>Government. Transcended.</div>
            </div>
          </div>

          <button className='desktop-mode-toggle' onClick={onToggleMode}>
            <span className='desktop-mode-icon'>{mode === 'county' ? '👤' : '🔬'}</span>
            <span className='desktop-mode-text'>
              {mode === 'county' ? 'County Staff Mode' : 'Power User Mode'}
            </span>
          </button>
        </div>

        <div className='desktop-status'>{status}</div>

        <div className='desktop-tiles'>
          {TILES.map((tile) => (
            <button
              key={tile.id}
              className={`desktop-tile ${tile.kind === 'suite' ? 'desktop-tile-suite' : 'desktop-tile-app'}`}
              onClick={() => handleLaunch(tile)}
              type='button'
            >
              <div className='desktop-tile-icon'>{tile.kind === 'suite' ? '🧭' : '🚀'}</div>
              <div className='desktop-tile-content'>
                <div className='desktop-tile-name'>{tile.name}</div>
                <div className='desktop-tile-description'>{tile.description}</div>
                <div className='desktop-tile-status'>
                  <span
                    className={`desktop-tile-status-dot ${tile.status === 'active' ? 'active' : 'syncing'}`}
                  />
                  <span className='desktop-tile-status-text'>
                    {tile.status === 'syncing' ? 'Syncing...' : 'Active'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className='desktop-footer'>
          <div className='desktop-footer-text'>Benton County Assessor • TF-Substrate Connected</div>
        </div>
      </div>
    </div>
  );
};
