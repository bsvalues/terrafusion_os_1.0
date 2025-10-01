import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TestDashboard from './components/TestDashboard';
import TestSuites from './components/TestSuites';
import TestExecution from './components/TestExecution';
import './App.css';

type ActiveTab = 'dashboard' | 'suites' | 'execution' | 'coverage' | 'performance' | 'automation';

interface SystemStatus {
  status: 'healthy' | 'warning' | 'error';
  testsRunning: number;
  lastUpdate: string;
  version: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'healthy',
    testsRunning: 0,
    lastUpdate: new Date().toISOString(),
    version: '1.0.0'
  });

  useEffect(() => {
    // Simulate system status updates
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        lastUpdate: new Date().toISOString(),
        testsRunning: Math.floor(Math.random() * 5),
        status: Math.random() > 0.8 ? 'warning' : 'healthy'
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TestDashboard />;
      case 'suites':
        return <TestSuites />;
      case 'execution':
        return <TestExecution />;
      case 'coverage':
        return <CoverageReports />;
      case 'performance':
        return <PerformanceMonitor />;
      case 'automation':
        return <AutomationCenter />;
      default:
        return <TestDashboard />;
    }
  };

  return (
    <div className="terrafusion-testing-suite">
      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        systemStatus={systemStatus}
      />
      
      <main className="main-content">
        {renderActiveComponent()}
      </main>

      {/* Global Status Bar */}
      <div className="global-status-bar">
        <div className="status-section">
          <span className={`status-indicator ${systemStatus.status}`}>
            {systemStatus.status === 'healthy' ? '🟢' : 
             systemStatus.status === 'warning' ? '🟡' : '🔴'}
          </span>
          <span className="status-text">
            System {systemStatus.status === 'healthy' ? 'Healthy' : 
                   systemStatus.status === 'warning' ? 'Warning' : 'Error'}
          </span>
        </div>

        <div className="status-section">
          <span className="status-label">Tests Running:</span>
          <span className="status-value">{systemStatus.testsRunning}</span>
        </div>

        <div className="status-section">
          <span className="status-label">Version:</span>
          <span className="status-value">v{systemStatus.version}</span>
        </div>

        <div className="status-section">
          <span className="status-label">Last Update:</span>
          <span className="status-value">
            {new Date(systemStatus.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for remaining tabs
const CoverageReports: React.FC = () => (
  <div className="placeholder-component">
    <div className="placeholder-content">
      <h1>Coverage Reports</h1>
      <p>Code coverage analysis and reporting dashboard</p>
      <div className="placeholder-features">
        <div className="feature-item">📊 Line Coverage Analysis</div>
        <div className="feature-item">🎯 Branch Coverage Metrics</div>
        <div className="feature-item">📈 Coverage Trends</div>
        <div className="feature-item">🗂️ Detailed Reports</div>
        <div className="feature-item">⚠️ Coverage Warnings</div>
        <div className="feature-item">📋 Export Capabilities</div>
      </div>
    </div>
  </div>
);

const PerformanceMonitor: React.FC = () => (
  <div className="placeholder-component">
    <div className="placeholder-content">
      <h1>Performance Monitor</h1>
      <p>Real-time performance metrics and benchmarking</p>
      <div className="placeholder-features">
        <div className="feature-item">⚡ Performance Benchmarks</div>
        <div className="feature-item">📊 Response Time Analysis</div>
        <div className="feature-item">💾 Memory Usage Tracking</div>
        <div className="feature-item">🔧 Performance Optimization</div>
        <div className="feature-item">📈 Historical Trends</div>
        <div className="feature-item">🚨 Performance Alerts</div>
      </div>
    </div>
  </div>
);

const AutomationCenter: React.FC = () => (
  <div className="placeholder-component">
    <div className="placeholder-content">
      <h1>Automation Center</h1>
      <p>Test automation configuration and scheduling</p>
      <div className="placeholder-features">
        <div className="feature-item">🤖 Automated Test Runs</div>
        <div className="feature-item">📅 Scheduled Executions</div>
        <div className="feature-item">🔄 CI/CD Integration</div>
        <div className="feature-item">📧 Notification Settings</div>
        <div className="feature-item">⚙️ Automation Rules</div>
        <div className="feature-item">🎯 Smart Test Selection</div>
      </div>
    </div>
  </div>
);

export default App;