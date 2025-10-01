import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SystemMonitoring from './components/SystemMonitoring';
import Diagnostics from './components/Diagnostics';
import './App.css';

interface ConnectionStatus {
  isConnected: boolean;
  lastHeartbeat: string;
  latency: number;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastHeartbeat: 'Never',
    latency: 0
  });

  useEffect(() => {
    // Initialize connection monitoring
    checkConnection();
    const connectionInterval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(connectionInterval);
  }, []);

  const checkConnection = async () => {
    try {
      const startTime = performance.now();
      
      // Test connection to the backend service
      const response = await fetch('/health', {
        method: 'GET',
        timeout: 5000
      } as RequestInit);
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      if (response.ok) {
        setConnectionStatus({
          isConnected: true,
          lastHeartbeat: new Date().toLocaleTimeString(),
          latency
        });
      } else {
        throw new Error('Service unavailable');
      }
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        lastHeartbeat: 'Connection lost',
        latency: 0
      });
    }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'monitoring':
        return <SystemMonitoring />;
      case 'diagnostics':
        return <Diagnostics />;
      case 'maintenance':
        return (
          <div className="placeholder-component">
            <div className="placeholder-content">
              <div className="placeholder-icon">🔧</div>
              <h2>Maintenance Scheduler</h2>
              <p>System maintenance and scheduling interface</p>
              <div className="placeholder-note">
                Component under development - Coming soon with automated maintenance workflows
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="placeholder-component">
            <div className="placeholder-content">
              <div className="placeholder-icon">🛡️</div>
              <h2>Security Center</h2>
              <p>Comprehensive security monitoring and threat detection</p>
              <div className="placeholder-note">
                Component under development - Coming soon with real-time security analytics
              </div>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="placeholder-component">
            <div className="placeholder-content">
              <div className="placeholder-icon">⚡</div>
              <h2>Performance Analytics</h2>
              <p>Advanced performance monitoring and optimization tools</p>
              <div className="placeholder-note">
                Component under development - Coming soon with detailed performance insights
              </div>
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="placeholder-component">
            <div className="placeholder-content">
              <div className="placeholder-icon">🚨</div>
              <h2>Alert Manager</h2>
              <p>Centralized alert configuration and notification management</p>
              <div className="placeholder-note">
                Component under development - Coming soon with intelligent alerting system
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="operations-tools-app">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        connectionStatus={connectionStatus}
      />
      
      <main className="main-content">
        {renderActiveComponent()}
      </main>
      
      {/* Connection Status Indicator */}
      <div className={`connection-indicator ${connectionStatus.isConnected ? 'connected' : 'disconnected'}`}>
        <div className="connection-dot"></div>
        <div className="connection-info">
          <div className="connection-status">
            {connectionStatus.isConnected ? 'Operations Tools Connected' : 'Connection Lost'}
          </div>
          {connectionStatus.isConnected && (
            <div className="connection-details">
              Latency: {connectionStatus.latency}ms | Last: {connectionStatus.lastHeartbeat}
            </div>
          )}
        </div>
      </div>
      
      {/* System Status Footer */}
      <footer className="system-footer">
        <div className="footer-content">
          <div className="footer-section">
            <span className="footer-label">Operations Tools</span>
            <span className="footer-value">v1.0.0</span>
          </div>
          <div className="footer-section">
            <span className="footer-label">System Status</span>
            <span className={`footer-value ${connectionStatus.isConnected ? 'online' : 'offline'}`}>
              {connectionStatus.isConnected ? 'OPERATIONAL' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="footer-section">
            <span className="footer-label">Port</span>
            <span className="footer-value">9000</span>
          </div>
          <div className="footer-section">
            <span className="footer-label">TerraFusion OS</span>
            <span className="footer-value transcendence">Government. Transcended.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;