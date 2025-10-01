import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Activity, 
  Zap, 
  Lock,
  Globe,
  Brain,
  Search,
  Settings
} from 'lucide-react';
import './Header.css';

export type TabType = 'security-overview' | 'threat-intelligence' | 'quantum-security' | 'incident-response' | 'security-operations' | 'ai-security';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'security-overview' as TabType, label: 'Security Overview', icon: Shield },
    { id: 'threat-intelligence' as TabType, label: 'Threat Intelligence', icon: Eye },
    { id: 'quantum-security' as TabType, label: 'Quantum Security', icon: Zap },
    { id: 'incident-response' as TabType, label: 'Incident Response', icon: AlertTriangle },
    { id: 'security-operations' as TabType, label: 'Security Operations', icon: Activity },
    { id: 'ai-security' as TabType, label: 'AI Security', icon: Brain }
  ];

  return (
    <header className="cybersecurity-header">
      {/* Government Notice Banner */}
      <div className="government-notice">
        <div className="notice-content">
          <div className="notice-badge">CLASSIFIED</div>
          <div className="notice-text">
            TerraFusion Cybersecurity Command Center - Government Security Operations
          </div>
          <div className="notice-badges">
            <span className="security-badge">🔒 QUANTUM SECURED</span>
            <span className="clearance-badge">🛡️ TOP SECRET</span>
            <span className="threat-badge">⚡ THREAT LEVEL: GREEN</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="header-main">
        {/* Left Section */}
        <div className="header-left">
          <div className="terrafusion-logo">
            <div className="logo-icon">🛡️</div>
            <div className="logo-text">
              <div className="logo-primary">TerraFusion</div>
              <div className="logo-secondary">Cybersecurity Command</div>
            </div>
          </div>
          
          <div className="service-info">
            <div className="service-title">Security Operations Center</div>
            <div className="service-port">Port: 3013 | SOC Dashboard</div>
          </div>
        </div>

        {/* Center Navigation */}
        <div className="header-center">
          <nav className="navigation-tabs">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => onTabChange(tab.id)}
                >
                  <div className="tab-icon">
                    <IconComponent size={18} />
                  </div>
                  <div className="tab-label">{tab.label}</div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="header-right">
          <div className="system-status">
            <div className="status-group">
              <div className="status-item">
                <span className="status-label">Active Threats:</span>
                <span className="status-value threats">0</span>
              </div>
              <div className="status-item">
                <span className="status-label">Security Agents:</span>
                <span className="status-value agents">15,847</span>
              </div>
              <div className="status-item">
                <span className="status-label">Detection Rate:</span>
                <span className="status-value accuracy">99.8%</span>
              </div>
            </div>
            <div className="version-info">
              v2.0.0 | Quantum Enhanced
            </div>
          </div>

          <div className="quick-actions">
            <button className="quick-action emergency">
              <AlertTriangle className="action-icon" />
              <span className="action-label">Emergency</span>
            </button>
            <button className="quick-action scan">
              <Search className="action-icon" />
              <span className="action-label">Scan</span>
            </button>
            <button className="quick-action config">
              <Settings className="action-icon" />
              <span className="action-label">Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Security Metrics Bar */}
      <div className="metrics-bar">
        <div className="metrics-group">
          <div className="metric">
            <Lock className="metric-icon" />
            <span className="metric-label">Threats Neutralized:</span>
            <span className="metric-value">2,847,293</span>
          </div>
          <div className="metric">
            <Shield className="metric-icon" />
            <span className="metric-label">Incidents Prevented:</span>
            <span className="metric-value">184,729</span>
          </div>
          <div className="metric">
            <Zap className="metric-icon" />
            <span className="metric-label">Quantum Protection:</span>
            <span className="metric-value">ACTIVE</span>
          </div>
          <div className="metric">
            <Globe className="metric-icon" />
            <span className="metric-label">Global Monitoring:</span>
            <span className="metric-value">24/7</span>
          </div>
        </div>
        
        <div className="live-indicator">
          <div className="live-dot"></div>
          <span className="live-text">LIVE SECURITY MONITORING</span>
        </div>
      </div>
    </header>
  );
};

export default Header;