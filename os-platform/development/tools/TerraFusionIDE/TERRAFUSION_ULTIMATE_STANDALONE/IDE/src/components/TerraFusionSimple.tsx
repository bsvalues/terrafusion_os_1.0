import React from 'react';

const TerraFusionSimple: React.FC = () => {
  return (
    <div className="tf-main-container">
      {/* Header */}
      <header className="tf-header">
        <div className="tf-header-content">
          <div className="tf-header-left">
            <h1 className="tf-title">🌍 TerraFusion OS</h1>
            <div className="tf-subtitle">Government AI Platform v4.1</div>
          </div>
          <div className="tf-header-right">
            <span>AI Swarm: 1,008 Agents Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="tf-main-content">
        <div className="tf-dashboard">
          <h2 className="tf-section-title">🏛️ Government Specialized Agents</h2>
          
          {/* Dashboard Stats */}
          <div className="tf-stats-grid">
            <div className="tf-stat-card">
              <div className="tf-stat-label">Overall Compliance</div>
              <div className="tf-stat-value">92.9%</div>
              <div className="tf-stat-desc">Government-wide compliance score</div>
            </div>
            <div className="tf-stat-card">
              <div className="tf-stat-label">Active Agents</div>
              <div className="tf-stat-value">3</div>
              <div className="tf-stat-desc">Specialized agents online</div>
            </div>
            <div className="tf-stat-card">
              <div className="tf-stat-label">Active Tasks</div>
              <div className="tf-stat-value">0</div>
              <div className="tf-stat-desc">Compliance tasks in progress</div>
            </div>
            <div className="tf-stat-card">
              <div className="tf-stat-label">Risk Level</div>
              <div className="tf-stat-value">6</div>
              <div className="tf-stat-desc">High/Critical risk capabilities</div>
            </div>
          </div>

          {/* Agent Card */}
          <div className="tf-agent-card">
            <div className="tf-agent-header">
              <div className="tf-agent-avatar"></div>
              <h3 className="tf-agent-title">FISMA Compliance Officer</h3>
            </div>
            
            <div className="tf-agent-stats">
              <div className="tf-agent-stat">
                <div className="tf-agent-stat-label">Performance:</div>
                <div className="tf-agent-stat-value">94%</div>
              </div>
              <div className="tf-agent-stat">
                <div className="tf-agent-stat-label">Compliance:</div>
                <div className="tf-agent-stat-value">98%</div>
              </div>
            </div>

            <div className="tf-agent-capabilities">
              <div className="tf-agent-cap-label">Capabilities:</div>
              <div className="tf-agent-cap-item">FISMA Compliance Audit</div>
              <div className="tf-agent-cap-item">NIST Framework Assessment</div>
              <div className="tf-agent-cap-item">CISO/FISMA Certified</div>
            </div>
          </div>

          {/* TerraSphere Visualization */}
          <div className="tf-terrasphere">
            <h3 className="tf-terrasphere-title">TerraSphere™ Global Visualization</h3>
            <div className="tf-terrasphere-container">
              <div className="tf-sphere">
                <div className="tf-sphere-text">
                  TERRA<br/>SPHERE<br/>ACTIVE
                </div>
                <div className="tf-orbital-ring tf-ring-1"></div>
                <div className="tf-orbital-ring tf-ring-2"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="tf-footer">
        <div className="tf-footer-content">
          <div className="tf-footer-left">
            <span>AI Swarm: 1,008 Agents Online</span>
            <span>Quantum Engine: Active</span>
            <span>Performance: 379M× Enhancement</span>
          </div>
          <div className="tf-footer-right">
            <span>FISMA: Compliant</span>
            <span>Security: 100%</span>
            <span>Confidence: 97%</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TerraFusionSimple;