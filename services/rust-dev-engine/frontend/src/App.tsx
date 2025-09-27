import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProjectManager from './components/ProjectManager';
import BuildManager from './components/BuildManager';
import './App.css';

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [currentTab, setCurrentTab] = useState('dashboard');

  useEffect(() => {
    // Check connection to Rust Dev Engine backend
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/rust-dev/health');
        setConnectionStatus(response.ok ? 'connected' : 'disconnected');
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <ProjectManager />;
      case 'builds':
        return <BuildManager />;
      case 'editor':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>🦀 Code Editor</h2>
              <p className="feature-description">Monaco Editor integration with Rust language support</p>
              <div className="feature-list">
                <div className="feature-item">✨ Syntax highlighting for Rust</div>
                <div className="feature-item">🔍 IntelliSense and auto-completion</div>
                <div className="feature-item">🐛 Integrated debugging support</div>
                <div className="feature-item">📝 Live error checking</div>
                <div className="feature-item">🔧 Code formatting with rustfmt</div>
              </div>
              <p className="status-text">Transcendence in progress...</p>
            </div>
          </div>
        );
      case 'deploy':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>🚀 Deployment Manager</h2>
              <p className="feature-description">Automated deployment orchestration for Rust services</p>
              <div className="feature-list">
                <div className="feature-item">🐳 Docker containerization</div>
                <div className="feature-item">☸️ Kubernetes deployment</div>
                <div className="feature-item">🌊 Blue-green deployments</div>
                <div className="feature-item">📊 Deployment monitoring</div>
                <div className="feature-item">🔄 Rollback capabilities</div>
              </div>
              <p className="status-text">Excellence in development...</p>
            </div>
          </div>
        );
      case 'logs':
        return (
          <div className="tab-content">
            <div className="coming-soon">
              <h2>📋 Log Viewer</h2>
              <p className="feature-description">Centralized logging and monitoring for Rust applications</p>
              <div className="feature-list">
                <div className="feature-item">📈 Real-time log streaming</div>
                <div className="feature-item">🔍 Advanced search and filtering</div>
                <div className="feature-item">📊 Log analytics and metrics</div>
                <div className="feature-item">🚨 Error alerting and notifications</div>
                <div className="feature-item">📁 Log aggregation and archival</div>
              </div>
              <p className="status-text">Clarity is coming...</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="tab-content">
            <div className="welcome-content">
              <h2>🦀 Welcome to Rust Development Engine</h2>
              <p>Government. Transcended. Through Rust.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <Header 
        connectionStatus={connectionStatus}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;