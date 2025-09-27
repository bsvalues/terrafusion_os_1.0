import React, { useState, useEffect } from 'react';
import './Header.css';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isConnected: boolean;
  connectionStatus: string;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onTabChange, 
  isConnected, 
  connectionStatus 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Test Dashboard', icon: '📊' },
    { id: 'suites', label: 'Test Suites', icon: '🧪' },
    { id: 'execution', label: 'Test Execution', icon: '▶️' },
    { id: 'coverage', label: 'Coverage Reports', icon: '📈' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'automation', label: 'Automation', icon: '🤖' }
  ];

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#00ff88';
      case 'connecting': return '#ffaa00';
      case 'error': return '#ff3333';
      default: return '#888888';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  return (
    <header className="testing-header">
      
      {/* System Notice Banner */}
      <div className="system-notice">
        <div className="notice-content">
          <span className="notice-icon">🛡️</span>
          <span className="notice-text">
            TerraFusion Testing Suite - Government Quality Assurance Platform
          </span>
          <div className="notice-badges">
            <span className="badge">ISO 9001</span>
            <span className="badge">SOC 2</span>
            <span className="badge">Gov Compliant</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="header-main">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-icon">🧪</div>
            <div className="logo-text">
              <h1>TerraFusion Testing Suite</h1>
              <span className="logo-subtitle">Quality Assurance & Automation</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <nav className="main-navigation">
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
            <div className="connection-status">
              <span 
                className="status-indicator"
                style={{ color: getConnectionStatusColor() }}
              >
                {getConnectionStatusIcon()}
              </span>
              <span className="status-text">
                Testing Engine {connectionStatus}
              </span>
            </div>
            
            <div className="current-time">
              <span className="time-icon">🕐</span>
              <span className="time-text">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>

            <div className="environment-indicator">
              <span className="env-icon">🔧</span>
              <span className="env-text">QA Environment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-actions">
        <div className="actions-left">
          <button className="quick-action" title="Run All Tests">
            <span className="action-icon">🚀</span>
            <span>Run All Tests</span>
          </button>
          <button className="quick-action" title="Stop All Tests">
            <span className="action-icon">⏹️</span>
            <span>Stop Tests</span>
          </button>
          <button className="quick-action" title="Generate Report">
            <span className="action-icon">📄</span>
            <span>Generate Report</span>
          </button>
        </div>

        <div className="actions-center">
          <div className="live-metrics">
            <div className="metric">
              <span className="metric-label">Active Tests:</span>
              <span className="metric-value">0</span>
            </div>
            <div className="metric">
              <span className="metric-label">Success Rate:</span>
              <span className="metric-value">98.7%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Coverage:</span>
              <span className="metric-value">94.2%</span>
            </div>
          </div>
        </div>

        <div className="actions-right">
          <button className="quick-action settings" title="Test Settings">
            <span className="action-icon">⚙️</span>
          </button>
          <button className="quick-action notifications" title="Notifications">
            <span className="action-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>
          <button className="quick-action help" title="Help & Documentation">
            <span className="action-icon">❓</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;