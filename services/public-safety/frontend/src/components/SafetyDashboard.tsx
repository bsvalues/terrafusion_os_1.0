import React, { useState, useEffect } from 'react';
import './SafetyDashboard.css';

interface IncidentReport {
  id: string;
  type: string;
  priority: number;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  reportedTime: string;
  respondingUnits: string[];
  status: 'active' | 'investigating' | 'resolved' | 'closed';
  description: string;
  reporterInfo: {
    type: string;
    phone: string;
  };
  evidenceCollected: string[];
  caseNumber?: string;
}

interface OfficerProfile {
  id: string;
  badgeNumber: string;
  name: string;
  rank: string;
  department: string;
  specializations: string[];
  currentStatus: 'on-patrol' | 'on-duty' | 'off-duty' | 'emergency-response';
  assignedPatrol: string;
  location: {
    lat: number;
    lng: number;
  };
  shiftStart: string;
  certifications: string[];
  performanceMetrics: {
    arrestsYtd?: number;
    citationsYtd?: number;
    commendations?: number;
    casesClosedYtd?: number;
    clearanceRate?: number;
  };
}

interface EmergencyCall {
  id: string;
  phoneNumber: string;
  callerLocation: {
    lat: number;
    lng: number;
  };
  callType: string;
  priority: number;
  timestamp: string;
  dispatcherId: string;
  unitsDispatched: string[];
  responseTime?: number;
  resolutionTime?: number;
  status: 'active' | 'dispatched' | 'resolved';
}

const SafetyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('command');
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [officers, setOfficers] = useState<OfficerProfile[]>([]);
  const [emergencyCalls, setEmergencyCalls] = useState<EmergencyCall[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    totalIncidents: 0,
    activeOfficers: 0,
    emergencyCallsToday: 0,
    averageResponseTime: 0.0,
    caseClearanceRate: 0.0,
    officerSafetyScore: 0.0,
    lastUpdate: new Date().toISOString()
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        averageResponseTime: Math.max(3.0, Math.min(8.0, prev.averageResponseTime + (Math.random() - 0.5) * 0.3)),
        officerSafetyScore: Math.max(0.85, Math.min(0.98, prev.officerSafetyScore + (Math.random() - 0.5) * 0.02)),
        lastUpdate: new Date().toISOString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Initialize demo data
  useEffect(() => {
    setIncidents([
      {
        id: 'BC-24-001234',
        type: 'Traffic Accident',
        priority: 3,
        location: 'US-395 & Court Street, Kennewick, WA',
        coordinates: { lat: 46.2112, lng: -119.1372 },
        reportedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        respondingUnits: ['BC-PATROL-15', 'BC-FIRE-3'],
        status: 'resolved',
        description: 'Two-vehicle collision with minor injuries',
        reporterInfo: { type: 'witness', phone: '509-xxx-xxxx' },
        evidenceCollected: ['photos', 'statements', 'measurements']
      },
      {
        id: 'BC-24-001235',
        type: 'Burglary',
        priority: 2,
        location: '1234 W Kennewick Ave, Kennewick, WA',
        coordinates: { lat: 46.2085, lng: -119.1526 },
        reportedTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        respondingUnits: ['BC-DETECTIVE-7', 'BC-PATROL-23'],
        status: 'investigating',
        description: 'Residential burglary - electronics and jewelry stolen',
        reporterInfo: { type: 'victim', phone: '509-xxx-xxxx' },
        evidenceCollected: ['fingerprints', 'photos', 'security_footage'],
        caseNumber: 'BC-CASE-2024-5678'
      },
      {
        id: 'BC-24-001236',
        type: 'Domestic Violence',
        priority: 1,
        location: '567 N Elm Street, Richland, WA',
        coordinates: { lat: 46.2859, lng: -119.2845 },
        reportedTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        respondingUnits: ['RPD-PATROL-8', 'BC-SUPERVISOR-2'],
        status: 'active',
        description: 'Domestic violence call - suspect arrested',
        reporterInfo: { type: 'victim', phone: '911' },
        evidenceCollected: ['photos', 'statements', 'medical_report']
      }
    ]);

    setOfficers([
      {
        id: 'BC-OFF-2024-001',
        badgeNumber: 'BC-451',
        name: 'Officer Sarah Martinez',
        rank: 'Patrol Officer',
        department: 'Benton County Sheriff\'s Office',
        specializations: ['Traffic Enforcement', 'Field Training Officer'],
        currentStatus: 'on-patrol',
        assignedPatrol: 'Sector 7 - West Kennewick',
        location: { lat: 46.2100, lng: -119.1500 },
        shiftStart: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        certifications: ['Basic Law Enforcement', 'Traffic Collision Investigation', 'CPR/First Aid'],
        performanceMetrics: { arrestsYtd: 34, citationsYtd: 127, commendations: 3 }
      },
      {
        id: 'BC-OFF-2024-002',
        badgeNumber: 'KPD-234',
        name: 'Detective Mike Thompson',
        rank: 'Detective',
        department: 'Kennewick Police Department',
        specializations: ['Property Crimes', 'Financial Crimes'],
        currentStatus: 'on-duty',
        assignedPatrol: 'Investigations Unit',
        location: { lat: 46.2112, lng: -119.1372 },
        shiftStart: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        certifications: ['Advanced Criminal Investigation', 'Computer Forensics', 'Interview & Interrogation'],
        performanceMetrics: { casesClosedYtd: 23, clearanceRate: 0.78, commendations: 5 }
      },
      {
        id: 'BC-OFF-2024-003',
        badgeNumber: 'RPD-189',
        name: 'Sergeant Lisa Chen',
        rank: 'Sergeant',
        department: 'Richland Police Department',
        specializations: ['Supervision', 'Community Relations', 'Crisis Intervention'],
        currentStatus: 'on-duty',
        assignedPatrol: 'Supervisor - North District',
        location: { lat: 46.2859, lng: -119.2845 },
        shiftStart: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        certifications: ['Supervision & Management', 'Crisis Intervention Team', 'Active Shooter Response'],
        performanceMetrics: { commendations: 8 }
      }
    ]);

    setEmergencyCalls([
      {
        id: 'BC-911-20240911-0847',
        phoneNumber: '509-xxx-xxxx',
        callerLocation: { lat: 46.2112, lng: -119.1372 },
        callType: 'Medical Emergency',
        priority: 1,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        dispatcherId: 'BCEM-DISP-007',
        unitsDispatched: ['BC-AMB-12', 'BC-FIRE-3'],
        responseTime: 4.2,
        status: 'active'
      },
      {
        id: 'BC-911-20240911-0923',
        phoneNumber: '509-xxx-xxxx',
        callerLocation: { lat: 46.2085, lng: -119.1526 },
        callType: 'Suspicious Activity',
        priority: 3,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        dispatcherId: 'BCEM-DISP-003',
        unitsDispatched: ['BC-PATROL-15'],
        responseTime: 7.8,
        resolutionTime: 23.5,
        status: 'resolved'
      }
    ]);

    setSystemMetrics(prev => ({
      ...prev,
      totalIncidents: 3,
      activeOfficers: 3,
      emergencyCallsToday: 2,
      averageResponseTime: 6.0,
      caseClearanceRate: 0.78,
      officerSafetyScore: 0.94
    }));
  }, []);

  const renderCommandCenter = () => (
    <div className="command-center-content">
      <div className="command-grid">
        {/* Emergency Response Overview */}
        <div className="metric-card large">
          <div className="card-header">
            <h3>🚨 Emergency Response Command</h3>
            <div className="response-status">
              <span className="status-value">94%</span>
              <span className="status-label">Ready</span>
            </div>
          </div>
          <div className="response-grid">
            <div className="response-item">
              <div className="response-icon">👮</div>
              <div className="response-info">
                <div className="response-value">{systemMetrics.activeOfficers}</div>
                <div className="response-label">Active Officers</div>
              </div>
            </div>
            <div className="response-item">
              <div className="response-icon">🚓</div>
              <div className="response-info">
                <div className="response-value">23</div>
                <div className="response-label">Units Available</div>
              </div>
            </div>
            <div className="response-item">
              <div className="response-icon">📞</div>
              <div className="response-info">
                <div className="response-value">{systemMetrics.emergencyCallsToday}</div>
                <div className="response-label">Calls Today</div>
              </div>
            </div>
            <div className="response-item">
              <div className="response-icon">⏱️</div>
              <div className="response-info">
                <div className="response-value">{systemMetrics.averageResponseTime.toFixed(1)}m</div>
                <div className="response-label">Avg Response</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="metric-card">
          <div className="card-header">
            <h3>📋 Active Incidents</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="incidents-list">
            {incidents.filter(incident => incident.status === 'active' || incident.status === 'investigating').map(incident => (
              <div key={incident.id} className={`incident-item priority-${incident.priority}`}>
                <div className="incident-header">
                  <div className="incident-id">{incident.id}</div>
                  <div className={`incident-priority priority-${incident.priority}`}>
                    P{incident.priority}
                  </div>
                </div>
                <div className="incident-details">
                  <div className="incident-type">{incident.type}</div>
                  <div className="incident-location">📍 {incident.location}</div>
                  <div className="incident-time">
                    🕐 {new Date(incident.reportedTime).toLocaleTimeString()}
                  </div>
                </div>
                <div className={`incident-status status-${incident.status}`}>
                  {incident.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Officer Status */}
        <div className="metric-card">
          <div className="card-header">
            <h3>👮 Officer Status</h3>
          </div>
          <div className="officer-list">
            {officers.slice(0, 4).map(officer => (
              <div key={officer.id} className="officer-item">
                <div className="officer-info">
                  <div className="officer-name">{officer.name}</div>
                  <div className="officer-badge">{officer.badgeNumber}</div>
                  <div className="officer-assignment">{officer.assignedPatrol}</div>
                </div>
                <div className={`officer-status status-${officer.currentStatus}`}>
                  {officer.currentStatus.replace('-', ' ').toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Calls */}
        <div className="metric-card">
          <div className="card-header">
            <h3>📞 Recent 911 Calls</h3>
          </div>
          <div className="calls-list">
            {emergencyCalls.slice(0, 3).map(call => (
              <div key={call.id} className="call-item">
                <div className="call-header">
                  <div className="call-type">{call.callType}</div>
                  <div className={`call-priority priority-${call.priority}`}>
                    P{call.priority}
                  </div>
                </div>
                <div className="call-details">
                  <div className="call-time">
                    🕐 {new Date(call.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="call-dispatcher">👤 {call.dispatcherId}</div>
                  <div className="call-units">
                    🚓 {call.unitsDispatched.join(', ')}
                  </div>
                </div>
                <div className={`call-status status-${call.status}`}>
                  {call.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Overview */}
        <div className="metric-card large">
          <div className="card-header">
            <h3>🏢 Department Overview</h3>
          </div>
          <div className="department-grid">
            <div className="department-card">
              <div className="department-icon">🛡️</div>
              <div className="department-info">
                <div className="department-name">Sheriff's Office</div>
                <div className="department-stats">89 Officers</div>
              </div>
            </div>
            <div className="department-card">
              <div className="department-icon">👮</div>
              <div className="department-info">
                <div className="department-name">Kennewick PD</div>
                <div className="department-stats">67 Officers</div>
              </div>
            </div>
            <div className="department-card">
              <div className="department-icon">🚔</div>
              <div className="department-info">
                <div className="department-name">Richland PD</div>
                <div className="department-stats">52 Officers</div>
              </div>
            </div>
            <div className="department-card">
              <div className="department-icon">🚓</div>
              <div className="department-info">
                <div className="department-name">Pasco PD</div>
                <div className="department-stats">43 Officers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="metric-card">
          <div className="card-header">
            <h3>📊 Performance Metrics</h3>
          </div>
          <div className="performance-metrics">
            <div className="metric-item">
              <div className="metric-circle">
                <svg viewBox="0 0 100 100" className="metric-chart">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#1976d2"
                    strokeWidth="8"
                    strokeDasharray={`${systemMetrics.caseClearanceRate * 282.7} 282.7`}
                    strokeDashoffset="-70.675"
                    className="metric-progress"
                  />
                </svg>
                <div className="metric-value">
                  <span className="percentage">{(systemMetrics.caseClearanceRate * 100).toFixed(0)}%</span>
                  <span className="label">Clearance</span>
                </div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-circle">
                <svg viewBox="0 0 100 100" className="metric-chart">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#4caf50"
                    strokeWidth="8"
                    strokeDasharray={`${systemMetrics.officerSafetyScore * 282.7} 282.7`}
                    strokeDashoffset="-70.675"
                    className="metric-progress"
                  />
                </svg>
                <div className="metric-value">
                  <span className="percentage">{(systemMetrics.officerSafetyScore * 100).toFixed(0)}%</span>
                  <span className="label">Safety</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'command':
        return renderCommandCenter();
      case 'dispatch':
        return (
          <div className="dispatch-content">
            <div className="content-header">
              <h2>📞 911 Emergency Dispatch Center</h2>
              <button className="new-call-btn">+ New Call</button>
            </div>
            <div className="dispatch-grid">
              {emergencyCalls.map(call => (
                <div key={call.id} className="call-detail-card">
                  <div className="call-card-header">
                    <h3>{call.id}</h3>
                    <div className={`priority-badge priority-${call.priority}`}>
                      Priority {call.priority}
                    </div>
                  </div>
                  <div className="call-details">
                    <p><strong>Type:</strong> {call.callType}</p>
                    <p><strong>Phone:</strong> {call.phoneNumber}</p>
                    <p><strong>Dispatcher:</strong> {call.dispatcherId}</p>
                    <p><strong>Units:</strong> {call.unitsDispatched.join(', ')}</p>
                    <p><strong>Response Time:</strong> {call.responseTime?.toFixed(1)} minutes</p>
                    <p><strong>Time:</strong> {new Date(call.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'officers':
        return (
          <div className="officers-content">
            <div className="content-header">
              <h2>👮 Officer Management</h2>
              <button className="add-officer-btn">+ Add Officer</button>
            </div>
            <div className="officers-grid">
              {officers.map(officer => (
                <div key={officer.id} className="officer-detail-card">
                  <div className="officer-card-header">
                    <h3>{officer.name}</h3>
                    <div className={`status-badge status-${officer.currentStatus}`}>
                      {officer.currentStatus.replace('-', ' ')}
                    </div>
                  </div>
                  <div className="officer-details">
                    <p><strong>Badge:</strong> {officer.badgeNumber}</p>
                    <p><strong>Rank:</strong> {officer.rank}</p>
                    <p><strong>Department:</strong> {officer.department}</p>
                    <p><strong>Assignment:</strong> {officer.assignedPatrol}</p>
                    <p><strong>Shift Started:</strong> {new Date(officer.shiftStart).toLocaleTimeString()}</p>
                  </div>
                  <div className="officer-specializations">
                    <strong>Specializations:</strong>
                    <div className="specialization-tags">
                      {officer.specializations.map(spec => (
                        <span key={spec} className="specialization-tag">{spec}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'incidents':
        return (
          <div className="incidents-content">
            <div className="content-header">
              <h2>📋 Incident Management</h2>
              <button className="new-incident-btn">+ New Incident</button>
            </div>
            <div className="incidents-grid">
              {incidents.map(incident => (
                <div key={incident.id} className="incident-detail-card">
                  <div className="incident-card-header">
                    <h3>{incident.id}</h3>
                    <div className={`priority-badge priority-${incident.priority}`}>
                      Priority {incident.priority}
                    </div>
                  </div>
                  <div className="incident-details">
                    <p><strong>Type:</strong> {incident.type}</p>
                    <p><strong>Location:</strong> {incident.location}</p>
                    <p><strong>Status:</strong> <span className={`status-${incident.status}`}>{incident.status}</span></p>
                    <p><strong>Description:</strong> {incident.description}</p>
                    <p><strong>Units:</strong> {incident.respondingUnits.join(', ')}</p>
                    <p><strong>Reported:</strong> {new Date(incident.reportedTime).toLocaleString()}</p>
                  </div>
                  {incident.evidenceCollected.length > 0 && (
                    <div className="evidence-section">
                      <strong>Evidence:</strong>
                      <div className="evidence-tags">
                        {incident.evidenceCollected.map(evidence => (
                          <span key={evidence} className="evidence-tag">{evidence}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return renderCommandCenter();
    }
  };

  return (
    <div className="safety-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h1>🚔 Public Safety Command Center</h1>
          <p>Advanced law enforcement, emergency response, and public safety coordination for Benton County</p>
        </div>
        <div className="header-actions">
          <button className="emergency-button">🚨 Emergency Alert</button>
          <button className="sync-button">🔄 Sync Data</button>
        </div>
      </div>

      <div className="dashboard-tabs">
        {[
          { id: 'command', label: 'Command Center', icon: '🏠' },
          { id: 'dispatch', label: '911 Dispatch', icon: '📞' },
          { id: 'officers', label: 'Officers', icon: '👮' },
          { id: 'incidents', label: 'Incidents', icon: '📋' },
          { id: 'investigations', label: 'Investigations', icon: '🔍' },
          { id: 'fire-ems', label: 'Fire & EMS', icon: '🚒' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'admin', label: 'Admin', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SafetyDashboard;