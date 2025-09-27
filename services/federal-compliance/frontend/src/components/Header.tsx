import React from 'react';
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  BookOpen,
  Scale,
  Eye,
  Clock,
  CheckCircle,
  Search,
  Download
} from 'lucide-react';
import './Header.css';

export type TabType = 'compliance-overview' | 'fisma-tracking' | 'nist-framework' | 'audit-management' | 'violations-remediation' | 'regulatory-analytics';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'compliance-overview' as TabType, label: 'Compliance Overview', icon: Shield },
    { id: 'fisma-tracking' as TabType, label: 'FISMA Tracking', icon: FileCheck },
    { id: 'nist-framework' as TabType, label: 'NIST Framework', icon: BookOpen },
    { id: 'audit-management' as TabType, label: 'Audit Management', icon: Eye },
    { id: 'violations-remediation' as TabType, label: 'Violations & Remediation', icon: AlertTriangle },
    { id: 'regulatory-analytics' as TabType, label: 'Regulatory Analytics', icon: BarChart3 }
  ];

  return (
    <header className="federal-compliance-header">
      {/* Government Authority Banner */}
      <div className="authority-notice">
        <div className="notice-content">
          <div className="authority-badge">FEDERAL AUTHORITY</div>
          <div className="notice-text">
            TerraFusion Federal Compliance Service - Government Regulatory Oversight System
          </div>
          <div className="compliance-badges">
            <span className="compliance-badge">📋 FISMA COMPLIANT</span>
            <span className="compliance-badge">🔒 NIST CERTIFIED</span>
            <span className="compliance-badge">⚖️ FEDRAMP AUTHORIZED</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="header-main">
        {/* Left Section */}
        <div className="header-left">
          <div className="terrafusion-logo">
            <div className="logo-icon">⚖️</div>
            <div className="logo-text">
              <div className="logo-primary">TerraFusion</div>
              <div className="logo-secondary">Federal Compliance</div>
            </div>
          </div>
          
          <div className="service-info">
            <div className="service-title">Regulatory Compliance Center</div>
            <div className="service-port">Port: 3015 | Compliance Dashboard</div>
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
          <div className="compliance-status">
            <div className="status-group">
              <div className="status-item">
                <span className="status-label">Compliance Score:</span>
                <span className="status-value score">98.9%</span>
              </div>
              <div className="status-item">
                <span className="status-label">Active Audits:</span>
                <span className="status-value audits">847</span>
              </div>
              <div className="status-item">
                <span className="status-label">Violations:</span>
                <span className="status-value violations">23</span>
              </div>
            </div>
            <div className="version-info">
              v2.0.0 | Government Standard
            </div>
          </div>

          <div className="quick-actions">
            <button className="quick-action report">
              <FileCheck className="action-icon" />
              <span className="action-label">Generate Report</span>
            </button>
            <button className="quick-action audit">
              <Search className="action-icon" />
              <span className="action-label">Run Audit</span>
            </button>
            <button className="quick-action config">
              <Settings className="action-icon" />
              <span className="action-label">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Metrics Bar */}
      <div className="metrics-bar">
        <div className="metrics-group">
          <div className="metric">
            <Scale className="metric-icon" />
            <span className="metric-label">Regulations Tracked:</span>
            <span className="metric-value">15,642</span>
          </div>
          <div className="metric">
            <CheckCircle className="metric-icon" />
            <span className="metric-label">Controls Implemented:</span>
            <span className="metric-value">14,891</span>
          </div>
          <div className="metric">
            <Clock className="metric-icon" />
            <span className="metric-label">Avg Remediation Time:</span>
            <span className="metric-value">4.2 hrs</span>
          </div>
          <div className="metric">
            <FileCheck className="metric-icon" />
            <span className="metric-label">FedRAMP Status:</span>
            <span className="metric-value">AUTHORIZED</span>
          </div>
        </div>
        
        <div className="compliance-indicator">
          <div className="compliance-dot"></div>
          <span className="compliance-text">FULLY COMPLIANT</span>
        </div>
      </div>
    </header>
  );
};

export default Header;