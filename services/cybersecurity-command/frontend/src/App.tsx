import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Header, { TabType } from './components/Header';
import SecurityDashboard from './components/SecurityDashboard';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('security-overview');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    // Initialize Socket.IO connection to backend
    const socket = io('http://localhost:\${{TF_FRONTEND_3013_PORT:-3013}}');

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('Connected to Cybersecurity Command');
      console.log('Connected to TerraFusion Cybersecurity Command Backend');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected from Backend');
      console.log('Disconnected from Cybersecurity Command Backend');
    });

    socket.on('security-update', (data) => {
      console.log('Security Update:', data);
      // Handle real-time security updates
    });

    socket.on('threat-detected', (data) => {
      console.log('Threat Detected:', data);
      // Handle threat detection alerts
    });

    socket.on('incident-alert', (data) => {
      console.log('Incident Alert:', data);
      // Handle incident alerts
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'security-overview':
        return <SecurityDashboard />;
      case 'threat-intelligence':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>🔍 Threat Intelligence Dashboard</h2>
              <p>Advanced threat intelligence monitoring and analysis coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Global Threat Feed Integration</div>
                <div className="feature-item">✓ AI-Powered Threat Analysis</div>
                <div className="feature-item">✓ Predictive Threat Modeling</div>
                <div className="feature-item">✓ Real-time Intelligence Sharing</div>
              </div>
            </div>
          </div>
        );
      case 'quantum-security':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>⚡ Quantum Security Operations</h2>
              <p>Quantum encryption and security protocols management coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Quantum Key Distribution</div>
                <div className="feature-item">✓ Post-Quantum Cryptography</div>
                <div className="feature-item">✓ Quantum-Safe Protocols</div>
                <div className="feature-item">✓ Advanced Encryption Standards</div>
              </div>
            </div>
          </div>
        );
      case 'incident-response':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>🚨 Incident Response Center</h2>
              <p>Automated incident response and crisis management coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Automated Response Workflows</div>
                <div className="feature-item">✓ Crisis Communication Tools</div>
                <div className="feature-item">✓ Forensic Investigation Suite</div>
                <div className="feature-item">✓ Recovery Coordination Platform</div>
              </div>
            </div>
          </div>
        );
      case 'security-operations':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>🛡️ Security Operations Management</h2>
              <p>Comprehensive security operations control center coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Security Policy Management</div>
                <div className="feature-item">✓ Compliance Monitoring</div>
                <div className="feature-item">✓ Risk Assessment Tools</div>
                <div className="feature-item">✓ Security Audit Systems</div>
              </div>
            </div>
          </div>
        );
      case 'ai-security':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>🧠 AI Security Intelligence</h2>
              <p>AI-powered security analytics and automation coming soon...</p>
              <div className="feature-list">
                <div className="feature-item">✓ Machine Learning Threat Detection</div>
                <div className="feature-item">✓ Behavioral Analysis Systems</div>
                <div className="feature-item">✓ Automated Security Orchestration</div>
                <div className="feature-item">✓ Intelligent Threat Hunting</div>
              </div>
            </div>
          </div>
        );
      default:
        return <SecurityDashboard />;
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
          Backend: localhost:\${{TF_FRONTEND_3013_PORT:-3013}} | Cybersecurity Command API
        </div>
      </div>

      <main className="main-content">
        {renderActiveTab()}
      </main>

      {/* Footer with System Information */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="system-info">
              <span className="system-name">TerraFusion OS Cybersecurity Command</span>
              <span className="system-version">v2.0.0 | Build 2024.12.19</span>
            </div>
          </div>
          <div className="footer-center">
            <div className="security-badges">
              <div className="security-badge">🔒 QUANTUM SECURED</div>
              <div className="security-badge">🛡️ AI PROTECTED</div>
              <div className="security-badge">⚡ REAL-TIME MONITORING</div>
            </div>
          </div>
          <div className="footer-right">
            <div className="compliance-info">
              <span>FISMA Compliant | NIST Framework</span>
              <span>Government Security Operations</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;