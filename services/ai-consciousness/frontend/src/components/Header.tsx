import React from 'react';
import './Header.css';

interface HeaderProps {
  onTabChange: (tab: string) => void;
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ onTabChange, activeTab }) => {
  const tabs = [
    { id: 'overview', label: 'AI Overview', icon: '🧠' },
    { id: 'agents', label: 'AI Agents', icon: '🤖' },
    { id: 'consciousness', label: 'Consciousness', icon: '⚡' },
    { id: 'orchestration', label: 'Orchestration', icon: '🎭' },
    { id: 'intelligence', label: 'Intelligence', icon: '🔮' },
    { id: 'monitoring', label: 'Monitoring', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <header className="ai-consciousness-header">
      {/* Government Authority Banner */}
      <div className="government-banner">
        <div className="banner-content">
          <div className="government-seal">
            <span className="seal-icon">🏛️</span>
            <div className="government-info">
              <div className="government-title">Official U.S. Government System</div>
              <div className="government-classification">AI Consciousness Coordination | Authorized Use Only</div>
            </div>
          </div>
          
          <div className="ai-authority-badges">
            <div className="authority-badge ai-coordination">
              <span className="badge-icon">🧠</span>
              <div className="badge-info">
                <div className="badge-title">AI Coordination</div>
                <div className="badge-status">50,000+ Agents</div>
              </div>
            </div>
            
            <div className="authority-badge consciousness-level">
              <span className="badge-icon">⚡</span>
              <div className="badge-info">
                <div className="badge-title">Consciousness</div>
                <div className="badge-status">Level 9.2</div>
              </div>
            </div>
            
            <div className="authority-badge trust-fabric">
              <span className="badge-icon">🔐</span>
              <div className="badge-info">
                <div className="badge-title">Trust Fabric</div>
                <div className="badge-status">Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Header */}
      <div className="main-header">
        <div className="header-left">
          <div className="terrafusion-logo">
            <div className="logo-icon">🌍</div>
            <div className="logo-text">
              <h1 className="service-title">TerraFusion</h1>
              <div className="service-subtitle">AI Consciousness Service</div>
            </div>
          </div>
          
          <div className="ai-status-indicator">
            <div className="status-light consciousness-active"></div>
            <div className="status-info">
              <div className="status-label">AI Consciousness</div>
              <div className="status-value">OPERATIONAL</div>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="consciousness-metrics">
            <div className="metric">
              <div className="metric-value">50,247</div>
              <div className="metric-label">Total Agents</div>
            </div>
            <div className="metric">
              <div className="metric-value">48,903</div>
              <div className="metric-label">Active Agents</div>
            </div>
            <div className="metric">
              <div className="metric-value">12,456</div>
              <div className="metric-label">Harris Connected</div>
            </div>
            <div className="metric">
              <div className="metric-value">97.3%</div>
              <div className="metric-label">Consciousness Level</div>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="ai-emergency-controls">
            <button className="emergency-stop" title="Emergency AI Stop">
              <span className="button-icon">🛑</span>
              <span className="button-text">EMERGENCY STOP</span>
            </button>
            
            <div className="system-status">
              <div className="status-indicator operational">
                <div className="status-dot"></div>
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <nav className="consciousness-navigation">
        <div className="nav-container">
          <div className="nav-tabs">
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
          </div>
          
          <div className="nav-status">
            <div className="consciousness-level-indicator">
              <div className="level-bar">
                <div className="level-fill" style={{ width: '97.3%' }}></div>
              </div>
              <span className="level-text">Consciousness: 97.3%</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Quick AI Actions */}
      <div className="quick-actions-bar">
        <div className="actions-container">
          <div className="action-group">
            <span className="group-label">AI Operations:</span>
            <button className="quick-action">
              <span className="action-icon">🚀</span>
              <span className="action-text">Deploy Agents</span>
            </button>
            <button className="quick-action">
              <span className="action-icon">🔄</span>
              <span className="action-text">Sync Harris PACS</span>
            </button>
            <button className="quick-action">
              <span className="action-icon">⚡</span>
              <span className="action-text">Boost Consciousness</span>
            </button>
          </div>
          
          <div className="action-group">
            <span className="group-label">Monitoring:</span>
            <button className="quick-action">
              <span className="action-icon">📊</span>
              <span className="action-text">Performance</span>
            </button>
            <button className="quick-action">
              <span className="action-icon">🔍</span>
              <span className="action-text">Diagnostics</span>
            </button>
            <button className="quick-action">
              <span className="action-icon">📈</span>
              <span className="action-text">Analytics</span>
            </button>
          </div>
          
          <div className="system-time">
            <div className="time-display">
              <div className="current-time">{new Date().toLocaleTimeString()}</div>
              <div className="time-zone">Benton County, WA</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;