/**
 * Emergency Portal - Alerts Page
 * Alert management and distribution system
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton, TerraInput, TerraModal } from '../../../src/components';
import { useAlerts } from '../../../src/hooks/useEmergency';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './AlertsPage.css';

const AlertsPage = () => {
  const { alerts: alertsData, templates: templatesData, zones: zonesData, loading, error, refetch } = useAlerts();
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');

  // Show loading state
  if (loading) {
    return <LoadingState message="Loading alerts..." fullPage />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} message="Failed to load alerts" onRetry={refetch} fullPage />;
  }

  // Use API data or fallback to mock data
  const alerts = alertsData || [
    { id: 'ALT-2025-089', type: 'Weather', title: 'Severe Thunderstorm Warning', priority: 'High', status: 'Active', recipients: 12847, sent: '15 min ago', expiresIn: '3 hours' },
    { id: 'ALT-2025-088', type: 'Road', title: 'Highway 20 Closure - Accident', priority: 'Medium', status: 'Active', recipients: 8934, sent: '45 min ago', expiresIn: '2 hours' },
    { id: 'ALT-2025-087', type: 'Public Safety', title: 'Water Main Break - Boil Advisory', priority: 'High', status: 'Active', recipients: 15782, sent: '2 hours ago', expiresIn: '22 hours' },
    { id: 'ALT-2025-086', type: 'Health', title: 'Air Quality Alert - Smoke', priority: 'Medium', status: 'Active', recipients: 12847, sent: '4 hours ago', expiresIn: '8 hours' },
    { id: 'ALT-2025-085', type: 'Public', title: 'Community Evacuation Drill', priority: 'Low', status: 'Scheduled', recipients: 5234, sent: 'Scheduled', expiresIn: '24 hours' },
    { id: 'ALT-2025-084', type: 'Weather', title: 'Winter Storm Watch', priority: 'Medium', status: 'Active', recipients: 12847, sent: '6 hours ago', expiresIn: '42 hours' },
    { id: 'ALT-2025-083', type: 'Emergency', title: 'Flash Flood Warning', priority: 'Critical', status: 'Expired', recipients: 18943, sent: '1 day ago', expiresIn: 'Expired' },
    { id: 'ALT-2025-082', type: 'Road', title: 'Bridge Inspection - Lane Closure', priority: 'Low', status: 'Expired', recipients: 4567, sent: '2 days ago', expiresIn: 'Expired' },
  ];

  const templates = templatesData || [
    { id: 1, name: 'Severe Weather Alert', type: 'Weather', uses: 47 },
    { id: 2, name: 'Road Closure Notice', type: 'Road', uses: 89 },
    { id: 3, name: 'Emergency Evacuation', type: 'Emergency', uses: 12 },
    { id: 4, name: 'Health Advisory', type: 'Health', uses: 34 },
    { id: 5, name: 'Public Service Announcement', type: 'Public', uses: 156 },
  ];

  const zones = zonesData || [
    { id: 1, name: 'County-Wide', subscribers: 12847, active: true },
    { id: 2, name: 'Urban Core', subscribers: 8934, active: true },
    { id: 3, name: 'Suburban Areas', subscribers: 6723, active: true },
    { id: 4, name: 'Rural Communities', subscribers: 2145, active: true },
    { id: 5, name: 'Business District', subscribers: 4567, active: false },
  ];

  const filteredAlerts = alerts.filter(alert => 
    filterPriority === 'all' || alert.priority.toLowerCase() === filterPriority.toLowerCase()
  );

  const alertColumns = [
    { key: 'id', label: 'ID', width: '10%' },
    { key: 'type', label: 'Type', width: '12%' },
    { key: 'title', label: 'Title', width: '25%' },
    { key: 'priority', label: 'Priority', width: '10%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'recipients', label: 'Recipients', width: '10%' },
    { key: 'sent', label: 'Sent', width: '10%' },
    { key: 'expiresIn', label: 'Expires In', width: '10%' },
    { key: 'actions', label: '', width: '3%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  const templateColumns = [
    { key: 'name', label: 'Template Name', width: '50%' },
    { key: 'type', label: 'Type', width: '25%' },
    { key: 'uses', label: 'Uses', width: '15%' },
    { key: 'actions', label: '', width: '10%', render: () => <TerraButton size="sm" variant="outline">Use</TerraButton> },
  ];

  const zoneColumns = [
    { key: 'name', label: 'Zone Name', width: '40%' },
    { key: 'subscribers', label: 'Subscribers', width: '25%' },
    { key: 'active', label: 'Status', width: '20%', render: (row) => row.active ? '✅ Active' : '⏸️ Inactive' },
    { key: 'actions', label: '', width: '15%', render: () => <TerraButton size="sm" variant="outline">Edit</TerraButton> },
  ];

  return (
    <div className="alerts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alert Management</h1>
          <p className="page-subtitle">Create and manage emergency alerts and notifications</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Alert History</TerraButton>
          <TerraButton variant="primary" onClick={() => setShowNewAlert(true)}>🚨 New Alert</TerraButton>
        </div>
      </div>

      <div className="alerts-stats">
        <div className="stat-card">
          <span className="stat-icon">🚨</span>
          <div className="stat-content">
            <span className="stat-value">{alerts.filter(a => a.status === 'Active').length}</span>
            <span className="stat-label">Active Alerts</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-value">{zones.reduce((sum, z) => sum + z.subscribers, 0).toLocaleString()}</span>
            <span className="stat-label">Total Subscribers</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📤</span>
          <div className="stat-content">
            <span className="stat-value">{alerts.reduce((sum, a) => sum + a.recipients, 0).toLocaleString()}</span>
            <span className="stat-label">Alerts Sent Today</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-content">
            <span className="stat-value">{templates.length}</span>
            <span className="stat-label">Templates Available</span>
          </div>
        </div>
      </div>

      <TerraCard className="alerts-card">
        <h2>Recent Alerts</h2>
        <div className="alerts-controls">
          <div className="filter-buttons">
            <TerraButton 
              variant={filterPriority === 'all' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterPriority('all')}
            >
              All ({alerts.length})
            </TerraButton>
            <TerraButton 
              variant={filterPriority === 'critical' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterPriority('critical')}
            >
              Critical
            </TerraButton>
            <TerraButton 
              variant={filterPriority === 'high' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterPriority('high')}
            >
              High
            </TerraButton>
            <TerraButton 
              variant={filterPriority === 'medium' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterPriority('medium')}
            >
              Medium
            </TerraButton>
            <TerraButton 
              variant={filterPriority === 'low' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterPriority('low')}
            >
              Low
            </TerraButton>
          </div>
        </div>
        <TerraTable columns={alertColumns} data={filteredAlerts} pageSize={10} />
      </TerraCard>

      <div className="alerts-grid">
        <TerraCard className="templates-card">
          <h2>Alert Templates</h2>
          <TerraTable columns={templateColumns} data={templates} pageSize={5} />
        </TerraCard>

        <TerraCard className="zones-card">
          <h2>Distribution Zones</h2>
          <TerraTable columns={zoneColumns} data={zones} pageSize={5} />
        </TerraCard>
      </div>

      {showNewAlert && (
        <TerraModal
          title="Create New Alert"
          onClose={() => setShowNewAlert(false)}
          size="large"
        >
          <div className="new-alert-form">
            <div className="form-row">
              <div className="form-group">
                <label>Alert Type</label>
                <select className="terra-select">
                  <option>Weather</option>
                  <option>Road</option>
                  <option>Emergency</option>
                  <option>Health</option>
                  <option>Public Safety</option>
                  <option>Public</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority Level</label>
                <select className="terra-select">
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div className="form-group full-width">
              <label>Alert Title</label>
              <TerraInput type="text" placeholder="Enter alert title..." />
            </div>
            <div className="form-group full-width">
              <label>Message Content</label>
              <textarea className="terra-textarea" rows="4" placeholder="Enter alert message..."></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Distribution Zones</label>
                <select className="terra-select" multiple>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name} ({zone.subscribers} subs)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Expiration</label>
                <TerraInput type="datetime-local" />
              </div>
            </div>
            <div className="form-actions">
              <TerraButton variant="outline" onClick={() => setShowNewAlert(false)}>Cancel</TerraButton>
              <TerraButton variant="primary">Send Alert</TerraButton>
            </div>
          </div>
        </TerraModal>
      )}
    </div>
  );
};

export default AlertsPage;
