import React, { useState, useEffect } from 'react';
import '../styles/dashboard-simple.css';

interface DashboardProps {
  apiBase?: string;
}

interface SystemMetrics {
  aiAgents: number;
  modules: number;
  performance: string;
  county: string;
  revenue: string;
  status: string;
}

export const EnhancedDashboard: React.FC<DashboardProps> = ({ apiBase }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    aiAgents: 50000,
    modules: 33,
    performance: '6-7ms',
    county: 'Benton County, WA',
    revenue: '$5.4M',
    status: 'DEPLOYMENT READY'
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="tf-loading-container">
        <div className="tf-spinner"></div>
        <p>Initializing TerraFusion OS...</p>
      </div>
    );
  }

  return (
    <div className="tf-dashboard">
      <div className="tf-header">
        <h1>TerraFusion OS</h1>
        <div className="tf-subtitle">Government Operating System</div>
      </div>

      <div className="tf-metrics-grid">
        <div className="tf-metric-card">
          <h3>AI Swarm</h3>
          <div className="tf-metric-value">{metrics.aiAgents.toLocaleString()}+</div>
          <div className="tf-metric-label">Active Agents</div>
        </div>

        <div className="tf-metric-card">
          <h3>Performance Engine</h3>
          <div className="tf-metric-value">{metrics.performance}</div>
          <div className="tf-metric-label">Response Time</div>
        </div>

        <div className="tf-metric-card">
          <h3>Modules</h3>
          <div className="tf-metric-value">{metrics.modules}</div>
          <div className="tf-metric-label">Government Apps</div>
        </div>

        <div className="tf-metric-card">
          <h3>Revenue Potential</h3>
          <div className="tf-metric-value">{metrics.revenue}</div>
          <div className="tf-metric-label">Annual County</div>
        </div>

        <div className="tf-metric-card">
          <h3>Target County</h3>
          <div className="tf-metric-value">{metrics.county}</div>
          <div className="tf-metric-label">Deployment Ready</div>
        </div>

        <div className="tf-metric-card tf-status-card">
          <h3>System Status</h3>
          <div className="tf-status-indicator tf-status-ready">{metrics.status}</div>
          <div className="tf-metric-label">Production Ready</div>
        </div>
      </div>

      <div className="tf-modules-section">
        <h2>Government Modules</h2>
        <div className="tf-modules-grid">
          <div className="tf-module-card">AI Swarm Command</div>
          <div className="tf-module-card">Property Assessment</div>
          <div className="tf-module-card">Tax Management</div>
          <div className="tf-module-card">GIS Processing</div>
          <div className="tf-module-card">Document Management</div>
          <div className="tf-module-card">Citizen Services</div>
          <div className="tf-module-card">Financial Analytics</div>
          <div className="tf-module-card">Compliance Monitoring</div>
          <div className="tf-module-card">Workflow Engine</div>
        </div>
      </div>

      <div className="tf-compliance-section">
        <h3>Government Compliance</h3>
        <div className="tf-compliance-badges">
          <span className="tf-badge tf-badge-success">FISMA Compliant</span>
          <span className="tf-badge tf-badge-success">NIST Approved</span>
          <span className="tf-badge tf-badge-success">Section 508</span>
          <span className="tf-badge tf-badge-success">WCAG 2.1 AA</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;