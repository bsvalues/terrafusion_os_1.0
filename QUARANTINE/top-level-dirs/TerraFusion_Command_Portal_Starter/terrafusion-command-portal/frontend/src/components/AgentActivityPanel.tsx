/**
 * AgentActivityPanel Component
 * Displays AI agent activity based on transparency layer
 */

import React from 'react';
import type { AgentAction, DisplayModel, TransparencyLayer } from '../hooks/useTransparencyEngine';

interface AgentActivityPanelProps {
  actions: AgentAction[];
  displayModel: DisplayModel | null;
  layer: TransparencyLayer;
}

export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({
  actions,
  displayModel,
  layer,
}) => {
  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'planning':
        return '#0080ff';
      case 'executing':
        return '#ffaa00';
      case 'waiting':
        return '#888';
      case 'error':
        return '#ff5370';
      case 'complete':
        return '#00ff00';
      default:
        return '#fff';
    }
  };

  const getPhaseIcon = (phase: string): string => {
    switch (phase) {
      case 'planning':
        return '📋';
      case 'executing':
        return '⚡';
      case 'waiting':
        return '⏳';
      case 'error':
        return '❌';
      case 'complete':
        return '✅';
      default:
        return '○';
    }
  };

  const renderSurfaceView = () => {
    const recentActions = actions.slice(-10);
    return (
      <div className="surface-view">
        <h3>Recent Activity</h3>
        {recentActions.length === 0 ? (
          <p className="empty-state">No activity yet</p>
        ) : (
          <div className="activity-list">
            {recentActions.map((action, idx) => (
              <div key={idx} className="activity-item">
                <span className="activity-icon">{getPhaseIcon(action.phase)}</span>
                <div className="activity-content">
                  <div className="activity-summary">{action.summary}</div>
                  <div className="activity-meta">{action.service}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderHintView = () => {
    if (!displayModel?.buckets) return renderSurfaceView();

    return (
      <div className="hint-view">
        <h3>Activity by Service</h3>
        {Object.entries(displayModel.buckets).map(([service, serviceActions]) => (
          <div key={service} className="service-bucket">
            <div className="service-header">
              <span className="service-name">{service}</span>
              <span className="service-count">{serviceActions.length}</span>
            </div>
            <div className="service-actions">
              {serviceActions.slice(-5).map((action, idx) => (
                <div key={idx} className="action-summary">
                  <span style={{ color: getPhaseColor(action.phase) }}>
                    {getPhaseIcon(action.phase)}
                  </span>
                  <span>{action.summary}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDepthView = () => {
    const recentActions = actions.slice(-50);

    return (
      <div className="depth-view">
        <h3>Detailed Timeline</h3>
        <div className="timeline">
          {recentActions.map((action, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-time">{new Date(action.timestamp).toLocaleTimeString()}</div>
              <div className="timeline-content">
                <div className="timeline-agent">{action.agentRole}</div>
                <div className="timeline-summary">{action.summary}</div>
                <div className="timeline-meta">
                  <span className="meta-service">{action.service}</span>
                  <span className="meta-workspace">{action.workspace}</span>
                  <span className="meta-phase" style={{ color: getPhaseColor(action.phase) }}>
                    {action.phase}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayModel?.metrics && (
          <div className="metrics-section">
            <h4>Metrics</h4>
            <div className="metrics-grid">
              {Object.entries(displayModel.metrics).map(([service, metrics]) => (
                <div key={service} className="metric-card">
                  <div className="metric-name">{service}</div>
                  <div className="metric-value">{metrics.count}</div>
                  {metrics.errors > 0 && (
                    <div className="metric-errors">{metrics.errors} errors</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExpertView = () => {
    return (
      <div className="expert-view">
        <h3>Full System Log</h3>
        <div className="expert-actions">
          {actions.map((action, idx) => (
            <div key={idx} className="expert-action">
              <div className="expert-header">
                <span className="expert-time">{new Date(action.timestamp).toISOString()}</span>
                <span className="expert-id">{action.agentId}</span>
              </div>
              <div className="expert-body">
                <div className="expert-role">{action.agentRole}</div>
                <div className="expert-summary">{action.summary}</div>
                <div className="expert-details">
                  <span>Service: {action.service}</span>
                  <span>Workspace: {action.workspace}</span>
                  <span>Phase: {action.phase}</span>
                  {action.durationMs && <span>Duration: {action.durationMs}ms</span>}
                </div>
                {action.details && (
                  <pre className="expert-json">{JSON.stringify(action.details, null, 2)}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="agent-activity-panel">
      <div className="panel-header">
        <h2>🤖 AI Agent Activity</h2>
        <span className="activity-count">{actions.length} actions</span>
      </div>

      <div className="panel-content">
        {layer === 'surface' && renderSurfaceView()}
        {layer === 'hint' && renderHintView()}
        {layer === 'depth' && renderDepthView()}
        {layer === 'expert' && renderExpertView()}
      </div>

      <style>{`
        .agent-activity-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(10, 14, 26, 0.5);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }

        .panel-header h2 {
          font-size: 1rem;
          margin: 0;
          color: #00ffff;
        }

        .activity-count {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .empty-state {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          padding: 2rem 1rem;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .activity-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 0.5rem;
          border-left: 2px solid #00ffff;
        }

        .activity-icon {
          font-size: 1.25rem;
        }

        .activity-content {
          flex: 1;
        }

        .activity-summary {
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .activity-meta {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .service-bucket {
          margin-bottom: 1.5rem;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: rgba(0, 255, 255, 0.1);
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .service-name {
          font-weight: 600;
          color: #00ffff;
        }

        .service-count {
          color: rgba(255, 255, 255, 0.6);
        }

        .service-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .action-summary {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          font-size: 0.875rem;
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .timeline-item {
          display: flex;
          gap: 1rem;
        }

        .timeline-time {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          min-width: 70px;
        }

        .timeline-content {
          flex: 1;
        }

        .timeline-agent {
          font-weight: 600;
          color: #00ffff;
          margin-bottom: 0.25rem;
        }

        .timeline-summary {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .timeline-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .metrics-section {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 255, 255, 0.2);
        }

        .metrics-section h4 {
          color: #00ffff;
          margin-bottom: 1rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .metric-card {
          padding: 1rem;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 0.5rem;
        }

        .metric-name {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: #00ffff;
        }

        .metric-errors {
          font-size: 0.75rem;
          color: #ff5370;
          margin-top: 0.25rem;
        }

        .expert-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .expert-action {
          padding: 1rem;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 0.5rem;
          border-left: 2px solid #00ffff;
        }

        .expert-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.5rem;
        }

        .expert-role {
          font-weight: 600;
          color: #00ffff;
          margin-bottom: 0.25rem;
        }

        .expert-summary {
          margin-bottom: 0.5rem;
        }

        .expert-details {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
        }

        .expert-json {
          font-size: 0.75rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.25rem;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};
