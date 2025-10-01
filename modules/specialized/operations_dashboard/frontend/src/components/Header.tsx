import React from 'react'
import './Header.css'

interface HeaderProps {
  connected: boolean
  activeTab: string
  onTabChange: (tab: 'overview' | 'modules' | 'services' | 'logs' | 'alerts') => void
  alertCount: number
}

const Header: React.FC<HeaderProps> = ({ connected, activeTab, onTabChange, alertCount }) => {
  const tabs = [
    { id: 'overview', label: 'System Overview', icon: '📊' },
    { id: 'modules', label: 'Modules', icon: '🔧' },
    { id: 'services', label: 'Services', icon: '🌐' },
    { id: 'logs', label: 'Logs', icon: '📄' },
    { id: 'alerts', label: 'Alerts', icon: '🚨', badge: alertCount }
  ] as const

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo">
            <span className="logo-icon">🌍</span>
            <div className="brand-text">
              <h1>TerraFusion</h1>
              <span className="brand-subtitle">Operations Dashboard</span>
            </div>
          </div>
          
          <div className="connection-status">
            <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <nav className="header-nav">
          <div className="nav-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id as any)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="tab-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="header-actions">
          <button className="action-btn" title="Refresh Data">
            <span className="action-icon">🔄</span>
          </button>
          <button className="action-btn" title="System Settings">
            <span className="action-icon">⚙️</span>
          </button>
          <button className="action-btn" title="Export Data">
            <span className="action-icon">📤</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header