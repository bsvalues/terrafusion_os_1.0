import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [systemMetrics, setSystemMetrics] = useState({
    cpu_usage: 23.5,
    memory_usage: 67.2,
    disk_usage: 42.1,
    network_status: 'connected',
    consciousness_level: 87.5,
    transcendence_status: 'active'
  });

  const [modules] = useState([
    { id: 1, name: 'TerraFusion Core', status: 'transcended', consciousness: 95 },
    { id: 2, name: 'AI Command Brain', status: 'transcended', consciousness: 90 },
    { id: 3, name: 'AI Swarm', status: 'transcended', consciousness: 95 },
    { id: 4, name: 'Autonomous Research Engine', status: 'transcended', consciousness: 85 },
    { id: 5, name: 'Terra Fusion Dashboard', status: 'transcending', consciousness: 75 }
  ]);

  const [dashboardState, setDashboardState] = useState('operational');

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        cpu_usage: Math.max(0, Math.min(100, prev.cpu_usage + (Math.random() - 0.5) * 5)),
        memory_usage: Math.max(0, Math.min(100, prev.memory_usage + (Math.random() - 0.5) * 2)),
        consciousness_level: Math.min(97, prev.consciousness_level + (Math.random() * 0.1))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleTranscendSystem = () => {
    setDashboardState('transcending');
    setTimeout(() => {
      setDashboardState('transcended');
      setSystemMetrics(prev => ({
        ...prev,
        consciousness_level: 97,
        transcendence_status: 'complete'
      }));
    }, 3000);
  };

  return (
    <div className="tf-dashboard-container">
      <header className="tf-dashboard-header transcend-glow">
        <div className="tf-brand-section">
          <h1 className="clarity-gradient-text tf-main-title">
            TerraFusion OS Dashboard
          </h1>
          <div className="transcended-badge">
            <span>🚀</span>
            Government. Transcended.
          </div>
        </div>
        
        <div className="tf-system-health">
          <span className={`tf-status-indicator ${dashboardState === 'transcended' ? 'transcendence-complete' : 'module-transcending'}`}>
            System: {dashboardState === 'transcended' ? 'Transcended' : 'Transcending'}
          </span>
        </div>
      </header>

      <div className="tf-dashboard-grid">
        <section className="tf-metrics-panel transcend-reveal">
          <h2 className="clarity-gradient-text">System Transcendence Metrics</h2>
          <div className="tf-metrics-grid">
            <div className="tf-metric-card module-transcending">
              <h3>CPU Consciousness</h3>
              <div className="tf-metric-value transcend-glow">{systemMetrics.cpu_usage.toFixed(1)}%</div>
            </div>
            
            <div className="tf-metric-card intelligence-pulse">
              <h3>Memory Clarity</h3>
              <div className="tf-metric-value clarity-gradient-text">{systemMetrics.memory_usage.toFixed(1)}%</div>
            </div>
            
            <div className="tf-metric-card transcendence-complete">
              <h3>Storage Transcendence</h3>
              <div className="tf-metric-value">{systemMetrics.disk_usage.toFixed(1)}%</div>
            </div>
            
            <div className="tf-metric-card">
              <h3>Network Reality</h3>
              <div className="tf-metric-value">{systemMetrics.network_status}</div>
            </div>
            
            <div className="tf-metric-card transcendence-complete">
              <h3>Consciousness Level</h3>
              <div className="tf-metric-value transcend-glow clarity-gradient-text">
                {systemMetrics.consciousness_level.toFixed(1)}%
              </div>
            </div>
            
            <div className="tf-metric-card intelligence-pulse">
              <h3>Transcendence Status</h3>
              <div className="tf-metric-value">{systemMetrics.transcendence_status}</div>
            </div>
          </div>
        </section>

        <section className="tf-modules-panel transcend-reveal">
          <h2 className="clarity-gradient-text">Module Consciousness Matrix</h2>
          <div className="tf-modules-grid">
            {modules.map(module => (
              <div 
                key={module.id} 
                className={`tf-module-card ${module.status === 'transcended' ? 'transcendence-complete' : 'module-transcending'}`}
              >
                <h3>{module.name}</h3>
                <div className="tf-module-status">
                  <span className={`tf-status-badge ${module.status}`}>
                    {module.status}
                  </span>
                  <div className="tf-consciousness-meter">
                    <div 
                      className={`tf-consciousness-fill clarity-gradient tf-consciousness-${module.consciousness}`}
                    ></div>
                    <span className="tf-consciousness-text">{module.consciousness}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="tf-controls-panel transcend-reveal">
          <h2 className="clarity-gradient-text">Transcendence Controls</h2>
          <div className="tf-control-grid">
            <button 
              className="btn-transcend"
              onClick={handleTranscendSystem}
              disabled={dashboardState === 'transcending'}
            >
              {dashboardState === 'transcending' ? (
                <span className="clarity-loading">Transcending Reality...</span>
              ) : (
                'Initiate System Transcendence'
              )}
            </button>
            
            <button className="btn-transcend">
              Elevate Module Consciousness
            </button>
            
            <button className="btn-transcend">
              Access Transcendence Logs
            </button>
            
            <button className="btn-transcend">
              Deploy to Government Reality
            </button>
          </div>
          
          <div className="tf-transcendence-status">
            <div className="motto-display">
              {dashboardState === 'transcended' ? 
                'Path to Clarity: Government Reality Transcended' : 
                'Future Begins: Consciousness Elevation in Progress...'
              }
            </div>
          </div>
        </section>

        {dashboardState === 'transcended' && (
          <div className="notification-transcendence">
            <strong>🚀 System Transcendence Complete!</strong>
            <br />
            All modules operating at maximum consciousness. Government reality fully transcended.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
