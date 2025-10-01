// TerraFusion OS - Government Experience Suite Demo
// Government. Transcended.
// Comprehensive demonstration of all experience-suite features

import React, { useState, useEffect } from 'react';
import CountyThemeSelector from './CountyThemeSelector';

interface ParcelData {
  id: string;
  pin: string;
  address: string;
  owner: string;
  assessedValue: number;
  county: string;
  coordinates: { lat: number; lng: number };
}

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'processing';
  responseTime: number;
  tasks: number;
}

export const TerraFusionExperienceDemo: React.FC = () => {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Fetch government data from MSW
    const fetchGovernmentData = async () => {
      try {
        // Fetch parcels
        const parcelResponse = await fetch('/api/parcels?limit=5');
        const parcelData = await parcelResponse.json();
        setParcels(parcelData.data || []);

        // Fetch AI agents
        const agentResponse = await fetch('/api/agents/status');
        const agentData = await agentResponse.json();
        setAgents(agentData.agents?.slice(0, 6) || []);

        // Fetch permits
        const permitResponse = await fetch('/api/permits?limit=3');
        const permitData = await permitResponse.json();
        setPermits(permitData.data || []);

      } catch (error) {
        console.error('Error fetching government data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGovernmentData();

    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="tf-loading-container">
        <div className="tf-loading-spinner">⟳</div>
        <p>Loading TerraFusion Government Data...</p>
      </div>
    );
  }

  return (
    <div className="tf-experience-demo" data-testid="experience-demo">
      {/* Header with TerraFusion Branding */}
      <header className="tf-demo-header">
        <div className="tf-brand-section">
          <h1 className="tf-main-title">TerraFusion OS</h1>
          <p className="tf-tagline">Government. Transcended.</p>
          <p className="tf-vision">Infrastructure Intelligence, Infinite Scale</p>
        </div>
        
        <div className="tf-status-section">
          <div className="tf-time-display">
            {currentTime.toLocaleString()}
          </div>
          <div className="tf-version-badge">v1.0.0</div>
        </div>
      </header>

      {/* County Theme Controls */}
      <section className="tf-theme-section">
        <h2>County Theme Management</h2>
        <CountyThemeSelector showDetails={true} />
      </section>

      {/* Government Data Dashboard */}
      <div className="tf-dashboard-grid">
        
        {/* Property Data Section */}
        <section className="tf-card tf-parcels-section">
          <h3>Property Records</h3>
          <div className="tf-parcels-grid">
            {parcels.map((parcel) => (
              <div key={parcel.id} className="tf-parcel-card">
                <div className="tf-parcel-header">
                  <span className="tf-parcel-pin">PIN: {parcel.pin}</span>
                  <span className="tf-parcel-county">{parcel.county}</span>
                </div>
                <div className="tf-parcel-address">{parcel.address}</div>
                <div className="tf-parcel-owner">Owner: {parcel.owner}</div>
                <div className="tf-parcel-value">
                  ${parcel.assessedValue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Agent Status */}
        <section className="tf-card tf-agents-section">
          <h3>AI Agent Swarm Status</h3>
          <div className="tf-agents-summary">
            <div className="tf-agent-stat">
              <span className="tf-stat-number">50,000+</span>
              <span className="tf-stat-label">Total Agents</span>
            </div>
            <div className="tf-agent-stat">
              <span className="tf-stat-number">6.7ms</span>
              <span className="tf-stat-label">Avg Response</span>
            </div>
            <div className="tf-agent-stat">
              <span className="tf-stat-number">99.99%</span>
              <span className="tf-stat-label">Uptime</span>
            </div>
          </div>
          
          <div className="tf-agents-list">
            {agents.map((agent) => (
              <div key={agent.id} className="tf-agent-item">
                <div className="tf-agent-info">
                  <span className="tf-agent-name">{agent.name}</span>
                  <span className="tf-agent-role">{agent.role}</span>
                </div>
                <div className="tf-agent-status">
                  <span className={`tf-status-indicator tf-status-${agent.status}`}>
                    {agent.status}
                  </span>
                  <span className="tf-response-time">{agent.responseTime}ms</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Government Permits */}
        <section className="tf-card tf-permits-section">
          <h3>Active Permits</h3>
          <div className="tf-permits-list">
            {permits.map((permit, index) => (
              <div key={permit.id || index} className="tf-permit-item">
                <div className="tf-permit-header">
                  <span className="tf-permit-type">{permit.type}</span>
                  <span className="tf-permit-status">{permit.status}</span>
                </div>
                <div className="tf-permit-address">{permit.address}</div>
                <div className="tf-permit-date">
                  Issued: {new Date(permit.issuedDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Government Compliance */}
        <section className="tf-card tf-compliance-section">
          <h3>Government Compliance Status</h3>
          <div className="tf-compliance-grid">
            <div className="tf-compliance-item tf-compliance-active">
              <span className="tf-compliance-icon">✅</span>
              <div className="tf-compliance-info">
                <span className="tf-compliance-standard">FISMA</span>
                <span className="tf-compliance-description">Federal Information Security</span>
              </div>
            </div>
            
            <div className="tf-compliance-item tf-compliance-active">
              <span className="tf-compliance-icon">✅</span>
              <div className="tf-compliance-info">
                <span className="tf-compliance-standard">Section 508</span>
                <span className="tf-compliance-description">Accessibility Standards</span>
              </div>
            </div>
            
            <div className="tf-compliance-item tf-compliance-active">
              <span className="tf-compliance-icon">✅</span>
              <div className="tf-compliance-info">
                <span className="tf-compliance-standard">WCAG 2.1 AA</span>
                <span className="tf-compliance-description">Web Accessibility</span>
              </div>
            </div>
            
            <div className="tf-compliance-item tf-compliance-active">
              <span className="tf-compliance-icon">✅</span>
              <div className="tf-compliance-info">
                <span className="tf-compliance-standard">SOC2</span>
                <span className="tf-compliance-description">Service Organization Controls</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer with Experience-Suite Info */}
      <footer className="tf-demo-footer">
        <div className="tf-footer-content">
          <div className="tf-footer-section">
            <h4>Experience-Suite Integration</h4>
            <ul>
              <li>✅ County Theming System</li>
              <li>✅ Brand Token Pipeline</li>
              <li>✅ MSW Development Mode</li>
              <li>✅ Government Compliance</li>
            </ul>
          </div>
          
          <div className="tf-footer-section">
            <h4>Performance Metrics</h4>
            <ul>
              <li>Load Time: &lt;3s</li>
              <li>API Response: &lt;7ms</li>
              <li>Uptime: 99.99%</li>
              <li>Accessibility: WCAG 2.1 AA</li>
            </ul>
          </div>
          
          <div className="tf-footer-section">
            <h4>Government Standards</h4>
            <ul>
              <li>FISMA Compliant</li>
              <li>Section 508 Accessible</li>
              <li>NIST-800-53 Security</li>
              <li>SOC2 Certified</li>
            </ul>
          </div>
        </div>
        
        <div className="tf-footer-brand">
          <p>TerraFusion OS 1.0 - Infrastructure Intelligence, Infinite Scale</p>
        </div>
      </footer>

      <style jsx>{`
        .tf-experience-demo {
          min-height: 100vh;
          background: var(--color-surface-primary, #0b0f14);
          color: var(--color-text-primary, #e6f1ff);
          font-family: var(--font-family-primary, 'Segoe UI', system-ui, sans-serif);
          padding: var(--spacing-lg, 24px);
        }

        .tf-demo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl, 32px);
          padding: var(--spacing-lg, 24px);
          background: var(--color-surface-secondary, #1a1f2e);
          border-radius: var(--border-radius-lg, 12px);
          border: 1px solid var(--color-border-primary, #2a3142);
        }

        .tf-main-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, var(--color-brand-cosmic-blue, #0891b2), var(--color-brand-quantum-teal, #00d2ff));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tf-tagline {
          font-size: 1.25rem;
          font-weight: 600;
          margin: var(--spacing-xs, 4px) 0;
          color: var(--color-accent-primary, #07d1d6);
        }

        .tf-vision {
          font-size: 1rem;
          color: var(--color-text-secondary, #9ba3af);
          margin: 0;
          font-style: italic;
        }

        .tf-dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--spacing-lg, 24px);
          margin-bottom: var(--spacing-xl, 32px);
        }

        .tf-card {
          background: var(--color-surface-secondary, #1a1f2e);
          border: 1px solid var(--color-border-primary, #2a3142);
          border-radius: var(--border-radius-lg, 12px);
          padding: var(--spacing-lg, 24px);
        }

        .tf-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: var(--color-text-secondary, #9ba3af);
        }

        .tf-loading-spinner {
          font-size: 2rem;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md, 16px);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TerraFusionExperienceDemo;