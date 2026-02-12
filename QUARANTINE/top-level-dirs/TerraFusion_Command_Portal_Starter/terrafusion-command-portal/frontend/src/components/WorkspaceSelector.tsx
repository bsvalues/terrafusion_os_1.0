/**
 * WorkspaceSelector Component
 * Select and switch between TerraFusion workspaces
 */

import React, { useState } from 'react';

interface WorkspaceSelectorProps {
  currentWorkspace: string;
  environment: 'local' | 'dev' | 'staging' | 'prod';
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  currentWorkspace,
  environment,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const workspaces = [
    { name: 'TerraFusion Command Portal', icon: '🎨', type: 'portal' },
    { name: 'Backend Services', icon: '⚙️', type: 'backend' },
    { name: 'Frontend Applications', icon: '🖼️', type: 'frontend' },
    { name: 'TDC Developer Console', icon: '🔧', type: 'tdc' },
    { name: 'SDK Development', icon: '📦', type: 'sdk' },
    { name: 'TerraBuild Modernization', icon: '🏗️', type: 'terrabuild' },
  ];

  const getEnvColor = (env: string): string => {
    switch (env) {
      case 'local':
        return '#00ffff';
      case 'dev':
        return '#ffaa00';
      case 'staging':
        return '#0080ff';
      case 'prod':
        return '#ff5370';
      default:
        return '#888';
    }
  };

  return (
    <div className="workspace-selector">
      <button className="selector-button" onClick={() => setIsOpen(!isOpen)}>
        <div className="current-workspace">
          <span className="workspace-icon">🏛️</span>
          <div className="workspace-details">
            <div className="workspace-name">{currentWorkspace}</div>
            <div className="workspace-env" style={{ color: getEnvColor(environment) }}>
              {(environment ?? 'local').toUpperCase()}
            </div>
          </div>
        </div>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="workspace-dropdown">
          <div className="dropdown-header">Switch Workspace</div>
          {workspaces.map(ws => (
            <button
              key={ws.type}
              className={`workspace-option ${ws.name === currentWorkspace ? 'active' : ''}`}
              onClick={() => {
                // Handle workspace switch
                console.log('Switching to workspace:', ws.type);
                setIsOpen(false);
              }}
            >
              <span className="option-icon">{ws.icon}</span>
              <span className="option-name">{ws.name}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        .workspace-selector {
          position: relative;
        }

        .selector-button {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 0.5rem;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .selector-button:hover {
          background: rgba(30, 41, 59, 0.7);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
        }

        .current-workspace {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .workspace-icon {
          font-size: 1.5rem;
        }

        .workspace-details {
          text-align: left;
        }

        .workspace-name {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .workspace-env {
          font-size: 0.75rem;
          font-weight: 700;
          margin-top: 0.125rem;
        }

        .dropdown-arrow {
          margin-left: auto;
          color: rgba(255, 255, 255, 0.5);
        }

        .workspace-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          min-width: 300px;
          background: rgba(10, 14, 26, 0.95);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 0.5rem;
          padding: 0.5rem;
          z-index: 1000;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .dropdown-header {
          padding: 0.75rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
          margin-bottom: 0.5rem;
        }

        .workspace-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .workspace-option:hover {
          background: rgba(0, 255, 255, 0.1);
          border-color: rgba(0, 255, 255, 0.3);
        }

        .workspace-option.active {
          background: rgba(0, 255, 255, 0.2);
          border-color: #00ffff;
        }

        .option-icon {
          font-size: 1.25rem;
        }

        .option-name {
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};
