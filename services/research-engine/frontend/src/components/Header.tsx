import React from 'react';
import './Header.css';

interface SystemStatus {
  status: 'active' | 'idle' | 'error';
  activeAgents: number;
  activeTasks: number;
  version: string;
}

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  systemStatus: SystemStatus;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, systemStatus }) => {
  const tabs = [
    { id: 'dashboard', label: 'Research Dashboard', icon: '🔬' },
    { id: 'agents', label: 'AI Agents', icon: '🤖' },
    { id: 'tasks', label: 'Research Tasks', icon: '📋' },
    { id: 'coordination', label: 'Coordination', icon: '🧭' },
    { id: 'data', label: 'Research Data', icon: '📊' },
    { id: 'insights', label: 'AI Insights', icon: '🧠' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'idle': return '#ffaa00';
      case 'error': return '#ff3333';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'idle': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <header className="research-header">
      {/* Government Notice Banner */}
      <div className="government-notice">
        <div className="notice-content">
          <span className="notice-badge">🏛️ GOVERNMENT SYSTEM</span>
          <span className="notice-text">TerraFusion Research Engine - Autonomous Research Coordination</span>
          <div className="notice-badges">
            <span className="system-badge">🔬 Research Hub</span>
            <span className="ai-badge">🤖 AI Coordination</span>
            <span className="security-badge">🔒 Secure Research</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="header-main">
        <div className="header-left">
          <div className="terrafusion-logo">
            <div className="logo-icon">🌍</div>
            <div className="logo-text">
              <div className="logo-primary">TerraFusion</div>
              <div className="logo-secondary">Research Engine</div>
            </div>
          </div>
          
          <div className="service-info">
            <div className="service-title">Autonomous Research Coordination</div>
            <div className="service-port">Port \${{TF_API_PORT:-5000}} - Research Command Center</div>
          </div>
        </div>

        <div className="header-center">
          <nav className="navigation-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="header-right">
          <div className="system-status">
            <div className="status-group">
              <div className="status-item">
                <span className="status-label">System:</span>
                <span 
                  className="status-value"
                  style={{ color: getStatusColor(systemStatus.status) }}
                >
                  {getStatusIcon(systemStatus.status)} {systemStatus.status.toUpperCase()}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">AI Agents:</span>
                <span className="status-value agents">{systemStatus.activeAgents}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Tasks:</span>
                <span className="status-value tasks">{systemStatus.activeTasks}</span>
              </div>
            </div>
            <div className="version-info">v{systemStatus.version}</div>
          </div>

          <div className="quick-actions">
            <button className="quick-action" title="Start New Research">
              <span className="action-icon">🚀</span>
              <span className="action-label">New Research</span>
            </button>
            <button className="quick-action" title="Deploy AI Agent">
              <span className="action-icon">🤖</span>
              <span className="action-label">Deploy Agent</span>
            </button>
            <button className="quick-action" title="System Settings">
              <span className="action-icon">⚙️</span>
              <span className="action-label">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Metrics Bar */}
      <div className="metrics-bar">
        <div className="metrics-group">
          <div className="metric">
            <span className="metric-icon">🔬</span>
            <span className="metric-label">Active Research:</span>
            <span className="metric-value">{systemStatus.activeTasks}</span>
          </div>
          <div className="metric">
            <span className="metric-icon">🤖</span>
            <span className="metric-label">AI Agents:</span>
            <span className="metric-value">{systemStatus.activeAgents}</span>
          </div>
          <div className="metric">
            <span className="metric-icon">📊</span>
            <span className="metric-label">Data Points:</span>
            <span className="metric-value">847,392</span>
          </div>
          <div className="metric">
            <span className="metric-icon">🧠</span>
            <span className="metric-label">AI Insights:</span>
            <span className="metric-value">2,847</span>
          </div>
          <div className="metric">
            <span className="metric-icon">⚡</span>
            <span className="metric-label">Processing Speed:</span>
            <span className="metric-value">94.2 req/s</span>
          </div>
        </div>
        
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span className="live-text">LIVE RESEARCH COORDINATION</span>
        </div>
      </div>
    </header>
  );
};

export default Header;