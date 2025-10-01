import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Header, { TabType } from './components/Header';
import ComplianceDashboard from './components/ComplianceDashboard';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('compliance-overview');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    // Initialize Socket.IO connection to backend
    const socket = io('http://localhost:\${{TF_FRONTEND_3015_PORT:-3015}}');

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('Connected to Federal Compliance Service');
      console.log('Connected to TerraFusion Federal Compliance Backend');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected from Backend');
      console.log('Disconnected from Federal Compliance Backend');
    });

    socket.on('compliance-update', (data) => {
      console.log('Compliance Update:', data);
      // Handle real-time compliance updates
    });

    socket.on('audit-notification', (data) => {
      console.log('Audit Notification:', data);
      // Handle audit notifications
    });

    socket.on('violation-alert', (data) => {
      console.log('Violation Alert:', data);
      // Handle violation alerts
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'compliance-overview':
        return <ComplianceDashboard />;
      case 'fisma-tracking':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>📋 FISMA Compliance Tracking</h2>
              <p>Comprehensive Federal Information Security Management Act compliance monitoring coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ FISMA Control Implementation</div>
                <div className="feature-item">✓ Security Control Assessment</div>
                <div className="feature-item">✓ Authority to Operate (ATO) Management</div>
                <div className="feature-item">✓ Continuous Monitoring Dashboard</div>
              </div>
            </div>
          </div>
        );
      case 'nist-framework':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>🔒 NIST Cybersecurity Framework</h2>
              <p>Advanced NIST framework implementation and maturity assessment coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Framework Core Implementation</div>
                <div className="feature-item">✓ Maturity Level Assessment</div>
                <div className="feature-item">✓ Risk Management Integration</div>
                <div className="feature-item">✓ Continuous Improvement Tracking</div>
              </div>
            </div>
          </div>
        );
      case 'audit-management':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>👁️ Audit Management System</h2>
              <p>Comprehensive audit planning, execution, and reporting platform coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Audit Planning & Scheduling</div>
                <div className="feature-item">✓ Evidence Collection & Management</div>
                <div className="feature-item">✓ Finding Tracking & Remediation</div>
                <div className="feature-item">✓ Automated Reporting Generation</div>
              </div>
            </div>
          </div>
        );
      case 'violations-remediation':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>⚠️ Violations & Remediation Center</h2>
              <p>Advanced violation tracking and automated remediation workflows coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Automated Violation Detection</div>
                <div className="feature-item">✓ Risk-based Prioritization</div>
                <div className="feature-item">✓ Remediation Workflow Management</div>
                <div className="feature-item">✓ Compliance Verification Tracking</div>
              </div>
            </div>
          </div>
        );
      case 'regulatory-analytics':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>📊 Regulatory Analytics Platform</h2>
              <p>Advanced compliance analytics and predictive regulatory intelligence coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Compliance Trend Analysis</div>
                <div className="feature-item">✓ Predictive Risk Modeling</div>
                <div className="feature-item">✓ Regulatory Change Impact Assessment</div>
                <div className="feature-item">✓ Executive Compliance Reporting</div>
              </div>
            </div>
          </div>
        );
      default:
        return <ComplianceDashboard />;
    }
  };

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Connection Status Banner */}
      <div className={`connection-banner ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="connection-indicator">
          <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span className="connection-text">{connectionStatus}</span>
        </div>
        <div className="backend-info">
          Backend: localhost:\${{TF_FRONTEND_3015_PORT:-3015}} | Federal Compliance Service API
        </div>
      </div>

      <main className="main-content">
        {renderActiveTab()}
      </main>

      {/* Footer with Government Information */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="government-info">
              <span className="department-name">TerraFusion OS Federal Compliance Service</span>
              <span className="department-version">v2.0.0 | Build 2025.09.14</span>
            </div>
          </div>
          <div className="footer-center">
            <div className="compliance-badges">
              <div className="compliance-badge">📋 FISMA COMPLIANT</div>
              <div className="compliance-badge">🔒 NIST CERTIFIED</div>
              <div className="compliance-badge">⚖️ FEDRAMP AUTHORIZED</div>
            </div>
          </div>
          <div className="footer-right">
            <div className="authority-info">
              <span>Federal Information Security Standards</span>
              <span>Government Regulatory Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;