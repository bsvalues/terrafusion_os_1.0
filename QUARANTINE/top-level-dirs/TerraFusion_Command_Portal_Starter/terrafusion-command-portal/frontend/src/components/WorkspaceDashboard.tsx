/**
 * WorkspaceDashboard Component
 * Main TerraFusion Workspace UI with Transparency Engine integration
 */

import React, { useState } from 'react';
import { useTransparencyEngine } from '../hooks/useTransparencyEngine';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { AgentActivityPanel } from './AgentActivityPanel';
import { ServiceHealthStrip } from './ServiceHealthStrip';
import { TransparencyLayerWidget } from './TransparencyLayerWidget';
import { WorkspaceSelector } from './WorkspaceSelector';

export const WorkspaceDashboard: React.FC = () => {
  // Transparency Engine state
  const { connected, actions, error } = useTransparencyEngine();

  // Workspace context
  const { context, loading: contextLoading } = useWorkspaceContext();

  // Local state for transparency layer (will integrate with engine later)
  const [layer, setLayer] = useState<'surface' | 'hint' | 'depth' | 'expert'>('hint');
  const [selectedView, setSelectedView] = useState<'code' | 'swarm' | 'tasks'>('swarm');

  // Safe defaults for workspace context
  const workspaceName = context?.name ?? 'Unknown Workspace';
  const environment = context?.environment ?? 'local';
  const services = context?.services ?? {
    api: false,
    consciousness: false,
    portal: false,
    rustIde: false,
  };

  // Layer control functions
  const elevate = () => {
    const layers: Array<'surface' | 'hint' | 'depth' | 'expert'> = [
      'surface',
      'hint',
      'depth',
      'expert',
    ];
    const currentIndex = layers.indexOf(layer);
    if (currentIndex < layers.length - 1) {
      setLayer(layers[currentIndex + 1]);
    }
  };

  const reduce = () => {
    const layers: Array<'surface' | 'hint' | 'depth' | 'expert'> = [
      'surface',
      'hint',
      'depth',
      'expert',
    ];
    const currentIndex = layers.indexOf(layer);
    if (currentIndex > 0) {
      setLayer(layers[currentIndex - 1]);
    }
  };

  // Display model based on layer (simplified)
  const displayModel = {
    maxActions: layer === 'surface' ? 10 : layer === 'hint' ? 50 : layer === 'depth' ? 200 : 1000,
    showDetails: layer === 'depth' || layer === 'expert',
    showMetrics: layer === 'expert',
  };

  return (
    <div className="workspace-dashboard">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <WorkspaceSelector currentWorkspace={workspaceName} environment={environment} />
        </div>

        <div className="top-bar-center">
          <TransparencyLayerWidget
            layer={layer}
            onLayerChange={setLayer}
            onElevate={elevate}
            onReduce={reduce}
          />
        </div>

        <div className="top-bar-right">
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot" />
            <span className="status-text">{connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <div className="sidebar-section">
            <h3>Workspaces</h3>
            <div className="workspace-list">
              <div className="workspace-item active">
                <span className="workspace-icon">🏛️</span>
                <span className="workspace-name">{workspaceName}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Services</h3>
            <ServiceHealthStrip services={services} compact />
          </div>
        </div>

        {/* Center Panel */}
        <div className="center-panel">
          <div className="view-tabs">
            <button
              className={`view-tab ${selectedView === 'code' ? 'active' : ''}`}
              onClick={() => setSelectedView('code')}
            >
              Code
            </button>
            <button
              className={`view-tab ${selectedView === 'swarm' ? 'active' : ''}`}
              onClick={() => setSelectedView('swarm')}
            >
              Swarm Lattice
            </button>
            <button
              className={`view-tab ${selectedView === 'tasks' ? 'active' : ''}`}
              onClick={() => setSelectedView('tasks')}
            >
              Tasks
            </button>
          </div>

          <div className="view-content">
            {selectedView === 'swarm' && (
              <div className="swarm-view">
                <div className="swarm-lattice-placeholder">
                  <h2>🌐 AI Agent Swarm Lattice</h2>
                  <p className="lattice-status">
                    {connected ? `${actions.length} actions tracked` : 'Waiting for connection...'}
                  </p>
                  {error && <p className="error-message">Error: {error}</p>}
                </div>
              </div>
            )}

            {selectedView === 'code' && (
              <div className="code-view">
                <p>Code editor placeholder</p>
              </div>
            )}

            {selectedView === 'tasks' && (
              <div className="tasks-view">
                <p>Task runner placeholder</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane */}
        <div className="right-pane">
          <AgentActivityPanel actions={actions} displayModel={displayModel} layer={layer} />
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="bottom-strip">
        <div className="status-text">
          TDC: {services.api ? '✓' : '✗'} API · {services.consciousness ? '✓' : '✗'} Consciousness ·
          Layer: {(layer ?? 'hint').toUpperCase()} · Agents: {actions?.length ?? 0} tracked
        </div>
      </div>

      <style>{`
        .workspace-dashboard {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0a0e1a;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(30, 41, 59, 0.5);
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }

        .top-bar-left,
        .top-bar-center,
        .top-bar-right {
          flex: 1;
        }

        .top-bar-center {
          display: flex;
          justify-content: center;
        }

        .top-bar-right {
          display: flex;
          justify-content: flex-end;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          background: rgba(30, 41, 59, 0.3);
        }

        .connection-status.connected .status-dot {
          background: #00ff00;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        .connection-status.disconnected .status-dot {
          background: #ff5370;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .main-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .left-sidebar {
          width: 250px;
          background: rgba(30, 41, 59, 0.3);
          border-right: 1px solid rgba(0, 255, 255, 0.2);
          padding: 1rem;
          overflow-y: auto;
        }

        .sidebar-section {
          margin-bottom: 2rem;
        }

        .sidebar-section h3 {
          font-size: 0.875rem;
          text-transform: uppercase;
          color: #00ffff;
          margin-bottom: 0.5rem;
        }

        .workspace-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }

        .workspace-item.active {
          background: rgba(0, 255, 255, 0.1);
          border-left: 2px solid #00ffff;
        }

        .center-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .view-tabs {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(30, 41, 59, 0.3);
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }

        .view-tab {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 0.25rem;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-tab:hover {
          background: rgba(0, 255, 255, 0.1);
        }

        .view-tab.active {
          background: rgba(0, 255, 255, 0.2);
          border-color: #00ffff;
        }

        .view-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .swarm-lattice-placeholder {
          text-align: center;
          padding: 4rem 2rem;
        }

        .swarm-lattice-placeholder h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #00ffff;
        }

        .lattice-status {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .error-message {
          color: #ff5370;
          margin-top: 1rem;
        }

        .right-pane {
          width: 350px;
          background: rgba(30, 41, 59, 0.3);
          border-left: 1px solid rgba(0, 255, 255, 0.2);
          overflow-y: auto;
        }

        .bottom-strip {
          padding: 0.75rem 1rem;
          background: rgba(30, 41, 59, 0.5);
          border-top: 1px solid rgba(0, 255, 255, 0.2);
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .status-text {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};
