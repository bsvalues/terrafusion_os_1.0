import React from 'react'
import './Header.css'

interface HeaderProps {
  currentView: string
  onViewChange: (view: 'dashboard' | 'projects' | 'builds' | 'editor' | 'deploy' | 'logs') => void
  isConnected: boolean
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, isConnected }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'projects', label: 'Projects', icon: '📦' },
    { id: 'builds', label: 'Builds', icon: '🔨' },
    { id: 'editor', label: 'Code Editor', icon: '💻' },
    { id: 'deploy', label: 'Deploy', icon: '🚀' },
    { id: 'logs', label: 'Logs', icon: '📄' }
  ] as const

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo">
            <span className="logo-icon">🦀</span>
            <div className="brand-text">
              <h1>TerraFusion</h1>
              <span className="brand-subtitle">Rust Development Engine</span>
            </div>
          </div>
          
          <div className="rust-version">
            <span className="version-label">Rust</span>
            <span className="version-number">1.75.0</span>
          </div>
        </div>

        <nav className="header-nav">
          <div className="nav-tabs">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-tab ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onViewChange(item.id as any)}
              >
                <span className="tab-icon">{item.icon}</span>
                <span className="tab-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="header-status">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isConnected ? 'Engine Online' : 'Engine Offline'}
            </span>
          </div>
          
          <div className="header-actions">
            <button className="action-btn" title="Compile All">
              <span className="action-icon">🔧</span>
            </button>
            <button className="action-btn" title="Run Tests">
              <span className="action-icon">🧪</span>
            </button>
            <button className="action-btn" title="Settings">
              <span className="action-icon">⚙️</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header