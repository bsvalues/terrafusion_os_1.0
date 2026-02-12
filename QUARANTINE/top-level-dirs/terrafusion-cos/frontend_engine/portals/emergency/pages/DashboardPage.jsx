/**
 * Emergency Management Portal - Dashboard Page
 * Real-time incident monitoring and emergency response overview
 */

import { TerraCard, TerraMetric, TerraTable, TerraButton } from '../../../src/components';
import './DashboardPage.css';

const DashboardPage = () => {
  // Mock data - replace with real-time API calls
  const metrics = [
    { label: 'Active Incidents', value: '12', trend: '-3', trendUp: false, icon: '🚨' },
    { label: 'Response Units', value: '47', trend: '+2', trendUp: true, icon: '🚒' },
    { label: 'Avg Response Time', value: '4.2 min', trend: '-0.8 min', trendUp: false, icon: '⏱️' },
    { label: 'Resources Available', value: '89%', trend: '+5%', trendUp: true, icon: '📦' },
  ];

  const activeIncidents = [
    { id: 'INC-2025-1047', type: 'Fire', location: '1234 Oak Street', severity: 'High', status: 'Responding', units: 3, time: '8 min ago' },
    { id: 'INC-2025-1048', type: 'Medical', location: '456 Maple Ave', severity: 'Critical', status: 'En Route', units: 2, time: '12 min ago' },
    { id: 'INC-2025-1049', type: 'Traffic', location: 'I-5 Mile 247', severity: 'Medium', status: 'Clearing', units: 2, time: '25 min ago' },
    { id: 'INC-2025-1050', type: 'Hazmat', location: 'Industrial Park', severity: 'High', status: 'Contained', units: 4, time: '45 min ago' },
    { id: 'INC-2025-1051', type: 'Rescue', location: 'River Trail', severity: 'Medium', status: 'Responding', units: 2, time: '1 hour ago' },
  ];

  const recentAlerts = [
    { id: 1, type: 'Weather', message: 'Severe thunderstorm warning until 8:00 PM', priority: 'High', time: '5 min ago' },
    { id: 2, type: 'Road', message: 'Highway 20 closed due to accident', priority: 'Medium', time: '15 min ago' },
    { id: 3, type: 'Public', message: 'Community evacuation drill scheduled for Oct 15', priority: 'Low', time: '1 hour ago' },
  ];

  const incidentColumns = [
    { key: 'id', label: 'Incident ID', width: '15%' },
    { key: 'type', label: 'Type', width: '12%' },
    { key: 'location', label: 'Location', width: '25%' },
    { key: 'severity', label: 'Severity', width: '12%' },
    { key: 'status', label: 'Status', width: '15%' },
    { key: 'units', label: 'Units', width: '10%' },
    { key: 'time', label: 'Time', width: '11%' },
  ];

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'Critical': return 'severity-critical';
      case 'High': return 'severity-high';
      case 'Medium': return 'severity-medium';
      default: return 'severity-low';
    }
  };

  return (
    <div className="emergency-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Emergency Operations Center</h1>
          <p className="dashboard-subtitle">Real-time incident monitoring and response coordination</p>
        </div>
        <div className="dashboard-actions">
          <TerraButton variant="danger">🚨 New Incident</TerraButton>
          <TerraButton variant="primary">📊 View Reports</TerraButton>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <TerraMetric
            key={index}
            label={metric.label}
            value={metric.value}
            trend={metric.trend}
            trendUp={metric.trendUp}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Active Incidents */}
      <TerraCard className="incidents-card">
        <div className="card-header">
          <h2>Active Incidents</h2>
          <span className="incident-count">{activeIncidents.length} Active</span>
        </div>
        <TerraTable
          columns={incidentColumns}
          data={activeIncidents}
          pageSize={5}
        />
      </TerraCard>

      {/* Alerts & Status Grid */}
      <div className="dashboard-grid">
        {/* Recent Alerts */}
        <TerraCard className="alerts-card">
          <h2>Recent Alerts</h2>
          <div className="alerts-list">
            {recentAlerts.map(alert => (
              <div key={alert.id} className={`alert-item priority-${alert.priority.toLowerCase()}`}>
                <div className="alert-icon">
                  {alert.type === 'Weather' ? '🌩️' : alert.type === 'Road' ? '🚧' : '📢'}
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <span className="alert-type">{alert.type}</span>
                    <span className="alert-priority">{alert.priority}</span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <span className="alert-time">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </TerraCard>

        {/* Resource Status */}
        <TerraCard className="resources-card">
          <h2>Resource Status</h2>
          <div className="resource-list">
            <div className="resource-item">
              <div className="resource-icon">🚒</div>
              <div className="resource-info">
                <span className="resource-label">Fire Engines</span>
                <div className="resource-bar">
                  <div className="resource-bar-fill" style={{ width: '85%' }}></div>
                </div>
                <span className="resource-count">17 / 20 Available</span>
              </div>
            </div>
            <div className="resource-item">
              <div className="resource-icon">🚑</div>
              <div className="resource-info">
                <span className="resource-label">Ambulances</span>
                <div className="resource-bar">
                  <div className="resource-bar-fill" style={{ width: '92%' }}></div>
                </div>
                <span className="resource-count">23 / 25 Available</span>
              </div>
            </div>
            <div className="resource-item">
              <div className="resource-icon">👮</div>
              <div className="resource-info">
                <span className="resource-label">Police Units</span>
                <div className="resource-bar">
                  <div className="resource-bar-fill" style={{ width: '78%' }}></div>
                </div>
                <span className="resource-count">28 / 36 Available</span>
              </div>
            </div>
            <div className="resource-item">
              <div className="resource-icon">🚁</div>
              <div className="resource-info">
                <span className="resource-label">Air Support</span>
                <div className="resource-bar">
                  <div className="resource-bar-fill" style={{ width: '100%' }}></div>
                </div>
                <span className="resource-count">2 / 2 Available</span>
              </div>
            </div>
          </div>
        </TerraCard>
      </div>
    </div>
  );
};

export default DashboardPage;
