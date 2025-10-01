import React, { useState, useEffect } from 'react';

interface EmergencyIncident {
  id: string;
  type: string;
  alertLevel: string;
  status: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  reportedAt: string;
  updatedAt: string;
  resourcesDeployed: string[];
  affectedPopulation: number;
  estimatedDamage: number;
  incidentCommander: string;
  responseUnits: string[];
  evacuationZones: string[];
}

interface EmergencyAlert {
  id: string;
  incidentId: string;
  alertType: string;
  message: string;
  severity: string;
  issuedAt: string;
  expiresAt: string;
  affectedAreas: string[];
  deliveryMethods: string[];
  status: string;
}

interface EmergencyResource {
  id: string;
  name: string;
  type: string;
  status: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: number;
  currentlyDeployed: boolean;
  deploymentTime?: string;
  specializations: string[];
}

const EmergencyDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data initialization
  useEffect(() => {
    const mockIncidents: EmergencyIncident[] = [
      {
        id: 'INC-2025-001',
        type: 'fire',
        alertLevel: 'major',
        status: 'active',
        title: 'Wildfire - Horse Heaven Hills',
        description: 'Fast-moving wildfire threatening residential areas near Benton City',
        location: {
          lat: 46.263,
          lng: -119.489,
          address: 'Horse Heaven Hills, Benton City, WA'
        },
        reportedAt: '2025-09-14T10:30:00Z',
        updatedAt: '2025-09-14T12:45:00Z',
        resourcesDeployed: ['Fire District 1', 'Fire District 4', 'State DNR', 'Air Support'],
        affectedPopulation: 2500,
        estimatedDamage: 1200000,
        incidentCommander: 'Chief Michael Rodriguez',
        responseUnits: ['Engine 41', 'Engine 12', 'Tender 15', 'Air Attack 210'],
        evacuationZones: ['Zone A-1', 'Zone A-2']
      },
      {
        id: 'INC-2025-002',
        type: 'severe_weather',
        alertLevel: 'moderate',
        status: 'monitoring',
        title: 'Severe Thunderstorm Warning',
        description: 'Severe thunderstorms with potential for damaging winds and hail',
        location: {
          lat: 46.239,
          lng: -119.137,
          address: 'Richland, WA'
        },
        reportedAt: '2025-09-14T14:15:00Z',
        updatedAt: '2025-09-14T14:30:00Z',
        resourcesDeployed: ['Emergency Management', 'Public Works'],
        affectedPopulation: 58000,
        estimatedDamage: 0,
        incidentCommander: 'Emergency Manager Sarah Chen',
        responseUnits: ['EM Team 1', 'PW Crew 3'],
        evacuationZones: []
      },
      {
        id: 'INC-2025-003',
        type: 'hazmat',
        alertLevel: 'minor',
        status: 'contained',
        title: 'Chemical Spill - Highway 240',
        description: 'Minor chemical spill from commercial transport vehicle',
        location: {
          lat: 46.227,
          lng: -119.202,
          address: 'Highway 240, West Richland, WA'
        },
        reportedAt: '2025-09-14T08:20:00Z',
        updatedAt: '2025-09-14T11:15:00Z',
        resourcesDeployed: ['Hazmat Team 1', 'Fire District 3', 'WSP'],
        affectedPopulation: 150,
        estimatedDamage: 25000,
        incidentCommander: 'Captain James Wilson',
        responseUnits: ['Hazmat 31', 'Engine 32', 'WSP Unit 47'],
        evacuationZones: []
      }
    ];

    const mockAlerts: EmergencyAlert[] = [
      {
        id: 'ALERT-001',
        incidentId: 'INC-2025-001',
        alertType: 'evacuation',
        message: 'IMMEDIATE EVACUATION ORDERED for Horse Heaven Hills area due to fast-moving wildfire. Residents in Zones A-1 and A-2 must evacuate immediately via Highway 224 south.',
        severity: 'extreme',
        issuedAt: '2025-09-14T11:00:00Z',
        expiresAt: '2025-09-14T23:59:59Z',
        affectedAreas: ['Zone A-1', 'Zone A-2', 'Benton City'],
        deliveryMethods: ['WEA', 'Siren', 'Radio', 'Social Media', 'Door-to-Door'],
        status: 'active'
      },
      {
        id: 'ALERT-002',
        incidentId: 'INC-2025-002',
        alertType: 'weather',
        message: 'SEVERE THUNDERSTORM WARNING for Richland area until 6:00 PM. Seek shelter immediately. Damaging winds up to 70 mph and quarter-size hail possible.',
        severity: 'major',
        issuedAt: '2025-09-14T14:15:00Z',
        expiresAt: '2025-09-14T18:00:00Z',
        affectedAreas: ['Richland', 'West Richland'],
        deliveryMethods: ['WEA', 'Radio', 'Social Media'],
        status: 'active'
      }
    ];

    const mockResources: EmergencyResource[] = [
      {
        id: 'RES-001',
        name: 'Fire District 1 - Station 11',
        type: 'fire_suppression',
        status: 'deployed',
        location: {
          lat: 46.263,
          lng: -119.489,
          address: '1000 W 4th Ave, Kennewick, WA'
        },
        capacity: 6,
        currentlyDeployed: true,
        deploymentTime: '2025-09-14T10:45:00Z',
        specializations: ['Structure Fire', 'Wildland Fire', 'Rescue']
      },
      {
        id: 'RES-002',
        name: 'Benton County Emergency Shelter',
        type: 'shelter',
        status: 'standby',
        location: {
          lat: 46.279,
          lng: -119.108,
          address: '2721 W 10th Ave, Kennewick, WA'
        },
        capacity: 500,
        currentlyDeployed: false,
        specializations: ['Mass Care', 'Pet Sheltering', 'Medical Support']
      },
      {
        id: 'RES-003',
        name: 'Hazmat Response Team 1',
        type: 'hazmat',
        status: 'deployed',
        location: {
          lat: 46.227,
          lng: -119.202,
          address: 'Highway 240, West Richland, WA'
        },
        capacity: 4,
        currentlyDeployed: true,
        deploymentTime: '2025-09-14T08:35:00Z',
        specializations: ['Chemical Response', 'Decontamination', 'Air Monitoring']
      },
      {
        id: 'RES-004',
        name: 'Mobile Emergency Operations Center',
        type: 'command',
        status: 'available',
        location: {
          lat: 46.279,
          lng: -119.108,
          address: '7122 W Okanogan Pl, Kennewick, WA'
        },
        capacity: 12,
        currentlyDeployed: false,
        specializations: ['Incident Command', 'Communications', 'Coordination']
      }
    ];

    setIncidents(mockIncidents);
    setAlerts(mockAlerts);
    setResources(mockResources);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'deployed': return 'status-active';
      case 'major': case 'extreme': return 'status-error';
      case 'monitoring': case 'standby': return 'status-warning';
      case 'contained': case 'available': return 'status-info';
      case 'resolved': case 'closed': return 'status-neutral';
      default: return 'status-neutral';
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'extreme': return 'alert-extreme';
      case 'major': return 'alert-major';
      case 'moderate': return 'alert-moderate';
      case 'minor': return 'alert-minor';
      case 'minimal': return 'alert-minimal';
      default: return 'alert-minimal';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateResponseTime = (reportedAt: string, deploymentTime?: string) => {
    if (!deploymentTime) return 'N/A';
    const reported = new Date(reportedAt);
    const deployed = new Date(deploymentTime);
    const diffMinutes = Math.floor((deployed.getTime() - reported.getTime()) / (1000 * 60));
    return `${diffMinutes} min`;
  };

  if (loading) {
    return (
      <div className="emergency-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading Emergency Management Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="emergency-dashboard">
      {/* Dashboard Overview */}
      <div className="dashboard-overview">
        <div className="overview-grid">
          <div className="overview-card critical">
            <div className="card-header">
              <h3>🚨 Critical Incidents</h3>
            </div>
            <div className="card-content">
              <div className="metric-large">{incidents.filter(i => i.alertLevel === 'extreme' || i.alertLevel === 'major').length}</div>
              <div className="metric-label">Requiring Immediate Action</div>
            </div>
          </div>

          <div className="overview-card active">
            <div className="card-header">
              <h3>⚠️ Active Incidents</h3>
            </div>
            <div className="card-content">
              <div className="metric-large">{incidents.filter(i => i.status === 'active').length}</div>
              <div className="metric-label">Currently Ongoing</div>
            </div>
          </div>

          <div className="overview-card resources">
            <div className="card-header">
              <h3>🚒 Deployed Resources</h3>
            </div>
            <div className="card-content">
              <div className="metric-large">{resources.filter(r => r.currentlyDeployed).length}</div>
              <div className="metric-label">Units in Field</div>
            </div>
          </div>

          <div className="overview-card alerts">
            <div className="card-header">
              <h3>📢 Active Alerts</h3>
            </div>
            <div className="card-content">
              <div className="metric-large">{alerts.filter(a => a.status === 'active').length}</div>
              <div className="metric-label">Public Notifications</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Active Incidents */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">⚠️</span>
              Active Emergency Incidents
            </h3>
            <div className="section-actions">
              <button className="action-button">New Incident</button>
              <button className="action-button primary">Command Center</button>
            </div>
          </div>

          <div className="incidents-list">
            {incidents.map((incident) => (
              <div key={incident.id} className="incident-card">
                <div className="incident-header">
                  <div className="incident-info">
                    <div className="incident-title">{incident.title}</div>
                    <div className="incident-id">{incident.id}</div>
                  </div>
                  <div className="incident-badges">
                    <span className={`badge ${getAlertLevelColor(incident.alertLevel)}`}>
                      {incident.alertLevel.toUpperCase()}
                    </span>
                    <span className={`badge ${getStatusColor(incident.status)}`}>
                      {incident.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="incident-details">
                  <p className="incident-description">{incident.description}</p>
                  <div className="incident-location">📍 {incident.location.address}</div>
                </div>

                <div className="incident-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Affected Population:</span>
                    <span className="metric-value">{incident.affectedPopulation.toLocaleString()}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Resources Deployed:</span>
                    <span className="metric-value">{incident.resourcesDeployed.length}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Incident Commander:</span>
                    <span className="metric-value">{incident.incidentCommander}</span>
                  </div>
                </div>

                <div className="incident-timeline">
                  <div className="timeline-item">
                    <span className="timeline-label">Reported:</span>
                    <span className="timeline-value">{formatTimestamp(incident.reportedAt)}</span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-label">Last Update:</span>
                    <span className="timeline-value">{formatTimestamp(incident.updatedAt)}</span>
                  </div>
                </div>

                {incident.evacuationZones.length > 0 && (
                  <div className="evacuation-zones">
                    <strong>Evacuation Zones:</strong> {incident.evacuationZones.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Alerts */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">📢</span>
              Emergency Alerts & Notifications
            </h3>
            <div className="section-actions">
              <button className="action-button">Send Alert</button>
              <button className="action-button">Activate Sirens</button>
            </div>
          </div>

          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className="alert-card">
                <div className="alert-header">
                  <div className="alert-type">{alert.alertType.toUpperCase()}</div>
                  <span className={`badge ${getAlertLevelColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>

                <div className="alert-message">{alert.message}</div>

                <div className="alert-details">
                  <div className="alert-timing">
                    <div className="timing-item">
                      <span className="timing-label">Issued:</span>
                      <span className="timing-value">{formatTimestamp(alert.issuedAt)}</span>
                    </div>
                    <div className="timing-item">
                      <span className="timing-label">Expires:</span>
                      <span className="timing-value">{formatTimestamp(alert.expiresAt)}</span>
                    </div>
                  </div>

                  <div className="alert-coverage">
                    <div className="coverage-item">
                      <span className="coverage-label">Areas:</span>
                      <span className="coverage-value">{alert.affectedAreas.join(', ')}</span>
                    </div>
                    <div className="coverage-item">
                      <span className="coverage-label">Methods:</span>
                      <span className="coverage-value">{alert.deliveryMethods.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Resources */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">🚒</span>
              Emergency Resources & Response Units
            </h3>
            <div className="section-actions">
              <button className="action-button">Deploy Resource</button>
              <button className="action-button">Resource Map</button>
            </div>
          </div>

          <div className="resources-grid">
            {resources.map((resource) => (
              <div key={resource.id} className="resource-card">
                <div className="resource-header">
                  <div className="resource-name">{resource.name}</div>
                  <span className={`badge ${getStatusColor(resource.status)}`}>
                    {resource.status.toUpperCase()}
                  </span>
                </div>

                <div className="resource-details">
                  <div className="resource-type">{resource.type.replace('_', ' ').toUpperCase()}</div>
                  <div className="resource-location">📍 {resource.location.address}</div>
                </div>

                <div className="resource-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Capacity:</span>
                    <span className="metric-value">{resource.capacity} personnel</span>
                  </div>
                  {resource.currentlyDeployed && resource.deploymentTime && (
                    <div className="metric-item">
                      <span className="metric-label">Deployed:</span>
                      <span className="metric-value">{formatTimestamp(resource.deploymentTime)}</span>
                    </div>
                  )}
                </div>

                <div className="resource-specializations">
                  <strong>Specializations:</strong>
                  <div className="specializations-list">
                    {resource.specializations.map((spec, index) => (
                      <span key={index} className="specialization-tag">{spec}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="actions-grid">
          <button className="quick-action-btn emergency">
            <span className="action-icon">🚨</span>
            <span className="action-text">Declare Emergency</span>
          </button>
          <button className="quick-action-btn alert">
            <span className="action-icon">📢</span>
            <span className="action-text">Mass Notification</span>
          </button>
          <button className="quick-action-btn evacuate">
            <span className="action-icon">🚪</span>
            <span className="action-text">Evacuation Order</span>
          </button>
          <button className="quick-action-btn shelter">
            <span className="action-icon">🏠</span>
            <span className="action-text">Open Shelters</span>
          </button>
          <button className="quick-action-btn coordinate">
            <span className="action-icon">🤝</span>
            <span className="action-text">Agency Coordination</span>
          </button>
          <button className="quick-action-btn media">
            <span className="action-icon">📺</span>
            <span className="action-text">Media Briefing</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDashboard;