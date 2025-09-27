import React, { useState, useEffect } from 'react';
import './HealthDashboard.css';

interface HealthFacility {
  id: string;
  name: string;
  type: string;
  address: string;
  capacity: number;
  currentOccupancy: number;
  status: 'operational' | 'critical' | 'maintenance';
  coordinates: {
    lat: number;
    lng: number;
  };
  specialties: string[];
  contactInfo: {
    phone: string;
    emergency: string;
  };
}

interface HealthProgram {
  id: string;
  name: string;
  type: string;
  enrollment: number;
  capacity: number;
  budget: number;
  status: 'active' | 'pending' | 'suspended';
  coordinator: string;
  metrics: {
    satisfaction: number;
    completion: number;
    effectiveness: number;
  };
}

interface SocialServiceCase {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo: string;
  createdDate: string;
  lastUpdate: string;
  clientAge: number;
  riskLevel: number;
}

interface HealthAlert {
  id: string;
  type: 'disease_outbreak' | 'environmental' | 'emergency' | 'advisory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedAreas: string[];
  status: 'active' | 'monitoring' | 'resolved';
  timestamp: string;
  responseActions: string[];
}

const HealthDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>([]);
  const [healthPrograms, setHealthPrograms] = useState<HealthProgram[]>([]);
  const [socialServiceCases, setSocialServiceCases] = useState<SocialServiceCase[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    populationServed: 206873,
    activeFacilities: 12,
    activePrograms: 5,
    openCases: 156,
    healthScore: 87.3,
    emergencyReadiness: 94.8,
    lastUpdate: new Date().toISOString()
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        healthScore: Math.max(85, Math.min(95, prev.healthScore + (Math.random() - 0.5) * 0.5)),
        emergencyReadiness: Math.max(90, Math.min(98, prev.emergencyReadiness + (Math.random() - 0.5) * 0.3)),
        lastUpdate: new Date().toISOString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Initialize demo data
  useEffect(() => {
    setHealthFacilities([
      {
        id: 'kadlec-regional',
        name: 'Kadlec Regional Medical Center',
        type: 'Hospital',
        address: '888 Swift Blvd, Richland, WA 99352',
        capacity: 254,
        currentOccupancy: 187,
        status: 'operational',
        coordinates: { lat: 46.2396, lng: -119.2751 },
        specialties: ['Emergency Medicine', 'Cardiology', 'Oncology', 'Maternity'],
        contactInfo: {
          phone: '(509) 946-4611',
          emergency: '911'
        }
      },
      {
        id: 'tridelta-hospital',
        name: 'Trios Health',
        type: 'Hospital',
        address: '900 Court St, Kennewick, WA 99336',
        capacity: 150,
        currentOccupancy: 112,
        status: 'operational',
        coordinates: { lat: 46.2068, lng: -119.1372 },
        specialties: ['Emergency Medicine', 'Surgery', 'Pediatrics'],
        contactInfo: {
          phone: '(509) 586-6111',
          emergency: '911'
        }
      },
      {
        id: 'comprehensive-healthcare',
        name: 'Comprehensive Healthcare',
        type: 'Mental Health Clinic',
        address: '1205 Jadwin Ave, Richland, WA 99354',
        capacity: 45,
        currentOccupancy: 38,
        status: 'operational',
        coordinates: { lat: 46.2740, lng: -119.2840 },
        specialties: ['Mental Health', 'Substance Abuse', 'Crisis Intervention'],
        contactInfo: {
          phone: '(509) 783-0500',
          emergency: '(509) 783-0500'
        }
      }
    ]);

    setHealthPrograms([
      {
        id: 'wic-nutrition',
        name: 'WIC Nutrition Program',
        type: 'Nutrition Assistance',
        enrollment: 2847,
        capacity: 3500,
        budget: 1750000,
        status: 'active',
        coordinator: 'Sarah Mitchell, RD',
        metrics: {
          satisfaction: 92.1,
          completion: 87.4,
          effectiveness: 94.2
        }
      },
      {
        id: 'immunization',
        name: 'Immunization Program',
        type: 'Disease Prevention',
        enrollment: 15640,
        capacity: 20000,
        budget: 850000,
        status: 'active',
        coordinator: 'Dr. Michael Chen',
        metrics: {
          satisfaction: 89.7,
          completion: 91.8,
          effectiveness: 96.5
        }
      }
    ]);

    setSocialServiceCases([
      {
        id: 'APS-2024-0892',
        type: 'Adult Protective Services',
        priority: 'high',
        status: 'investigating',
        assignedTo: 'Jennifer Rodriguez, MSW',
        createdDate: '2024-01-15',
        lastUpdate: '2024-01-18',
        clientAge: 73,
        riskLevel: 7.2
      },
      {
        id: 'CPS-2024-1456',
        type: 'Child Protective Services',
        priority: 'critical',
        status: 'open',
        assignedTo: 'David Thompson, LCSW',
        createdDate: '2024-01-12',
        lastUpdate: '2024-01-18',
        clientAge: 8,
        riskLevel: 8.9
      }
    ]);

    setHealthAlerts([
      {
        id: 'ALERT-2024-001',
        type: 'disease_outbreak',
        severity: 'medium',
        title: 'Seasonal Influenza Increase',
        description: 'Moderate increase in influenza cases across Benton County. Enhanced surveillance and prevention measures in effect.',
        affectedAreas: ['Richland', 'Kennewick', 'Pasco'],
        status: 'monitoring',
        timestamp: '2024-01-18T10:30:00Z',
        responseActions: ['Enhanced testing', 'Vaccination campaigns', 'Public awareness']
      }
    ]);
  }, []);

  const renderOverviewTab = () => (
    <div className="overview-content">
      <div className="overview-grid">
        {/* Community Health Metrics */}
        <div className="metric-card large">
          <div className="card-header">
            <h3>🏥 Community Health Overview</h3>
            <div className="health-score">
              <span className="score-value">{systemMetrics.healthScore.toFixed(1)}%</span>
              <span className="score-label">Health Score</span>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric-item">
              <div className="metric-icon">👥</div>
              <div className="metric-info">
                <div className="metric-value">{systemMetrics.populationServed.toLocaleString()}</div>
                <div className="metric-label">Population Served</div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">🏥</div>
              <div className="metric-info">
                <div className="metric-value">{systemMetrics.activeFacilities}</div>
                <div className="metric-label">Health Facilities</div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">📋</div>
              <div className="metric-info">
                <div className="metric-value">{systemMetrics.activePrograms}</div>
                <div className="metric-label">Active Programs</div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">⚠️</div>
              <div className="metric-info">
                <div className="metric-value">{systemMetrics.openCases}</div>
                <div className="metric-label">Open Cases</div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Readiness */}
        <div className="metric-card">
          <div className="card-header">
            <h3>🚨 Emergency Readiness</h3>
          </div>
          <div className="readiness-display">
            <div className="readiness-circle">
              <svg viewBox="0 0 100 100" className="readiness-chart">
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
                  stroke="#00ff88"
                  strokeWidth="8"
                  strokeDasharray={`${systemMetrics.emergencyReadiness * 2.827} 282.7`}
                  strokeDashoffset="-70.675"
                  className="readiness-progress"
                />
              </svg>
              <div className="readiness-value">
                <span className="percentage">{systemMetrics.emergencyReadiness.toFixed(1)}%</span>
                <span className="label">Ready</span>
              </div>
            </div>
            <div className="readiness-details">
              <div className="readiness-item">
                <span className="status-dot operational"></span>
                <span>Emergency Response Teams</span>
              </div>
              <div className="readiness-item">
                <span className="status-dot operational"></span>
                <span>Medical Supply Chain</span>
              </div>
              <div className="readiness-item">
                <span className="status-dot operational"></span>
                <span>Communication Systems</span>
              </div>
              <div className="readiness-item">
                <span className="status-dot operational"></span>
                <span>Backup Power Systems</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Health Alerts */}
        <div className="metric-card">
          <div className="card-header">
            <h3>🚨 Active Health Alerts</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="alerts-list">
            {healthAlerts.slice(0, 3).map(alert => (
              <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                <div className="alert-icon">
                  {alert.type === 'disease_outbreak' && '🦠'}
                  {alert.type === 'environmental' && '🌍'}
                  {alert.type === 'emergency' && '🚨'}
                  {alert.type === 'advisory' && 'ℹ️'}
                </div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-description">{alert.description}</div>
                  <div className="alert-meta">
                    <span className="alert-time">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                    <span className={`alert-status status-${alert.status}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Facility Status */}
        <div className="metric-card">
          <div className="card-header">
            <h3>🏥 Facility Status</h3>
          </div>
          <div className="facility-list">
            {healthFacilities.slice(0, 4).map(facility => (
              <div key={facility.id} className="facility-item">
                <div className="facility-info">
                  <div className="facility-name">{facility.name}</div>
                  <div className="facility-type">{facility.type}</div>
                </div>
                <div className="facility-metrics">
                  <div className="occupancy-bar">
                    <div 
                      className="occupancy-fill"
                      style={{ width: `${(facility.currentOccupancy / facility.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="occupancy-text">
                    {facility.currentOccupancy}/{facility.capacity}
                  </div>
                </div>
                <div className={`facility-status status-${facility.status}`}>
                  {facility.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Performance */}
        <div className="metric-card large">
          <div className="card-header">
            <h3>📊 Program Performance</h3>
          </div>
          <div className="program-grid">
            {healthPrograms.map(program => (
              <div key={program.id} className="program-card">
                <div className="program-header">
                  <div className="program-name">{program.name}</div>
                  <div className="program-type">{program.type}</div>
                </div>
                <div className="program-metrics">
                  <div className="enrollment-info">
                    <span className="enrollment-value">{program.enrollment.toLocaleString()}</span>
                    <span className="enrollment-label">Enrolled</span>
                  </div>
                  <div className="metrics-grid">
                    <div className="metric-mini">
                      <span className="metric-mini-value">{program.metrics.satisfaction}%</span>
                      <span className="metric-mini-label">Satisfaction</span>
                    </div>
                    <div className="metric-mini">
                      <span className="metric-mini-value">{program.metrics.completion}%</span>
                      <span className="metric-mini-label">Completion</span>
                    </div>
                    <div className="metric-mini">
                      <span className="metric-mini-value">{program.metrics.effectiveness}%</span>
                      <span className="metric-mini-label">Effectiveness</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Case Management */}
        <div className="metric-card">
          <div className="card-header">
            <h3>📋 Active Cases</h3>
          </div>
          <div className="case-list">
            {socialServiceCases.slice(0, 5).map(serviceCase => (
              <div key={serviceCase.id} className="case-item">
                <div className="case-header">
                  <div className="case-id">{serviceCase.id}</div>
                  <div className={`case-priority priority-${serviceCase.priority}`}>
                    {serviceCase.priority.toUpperCase()}
                  </div>
                </div>
                <div className="case-details">
                  <div className="case-type">{serviceCase.type}</div>
                  <div className="case-assignee">👤 {serviceCase.assignedTo}</div>
                  <div className="case-date">
                    📅 {new Date(serviceCase.lastUpdate).toLocaleDateString()}
                  </div>
                </div>
                <div className={`case-status status-${serviceCase.status}`}>
                  {serviceCase.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'facilities':
        return (
          <div className="facilities-content">
            <div className="content-header">
              <h2>🏥 Health Facilities Management</h2>
              <button className="add-facility-btn">+ Add Facility</button>
            </div>
            <div className="facilities-grid">
              {healthFacilities.map(facility => (
                <div key={facility.id} className="facility-card">
                  <div className="facility-card-header">
                    <h3>{facility.name}</h3>
                    <div className={`status-badge status-${facility.status}`}>
                      {facility.status}
                    </div>
                  </div>
                  <div className="facility-details">
                    <p><strong>Type:</strong> {facility.type}</p>
                    <p><strong>Address:</strong> {facility.address}</p>
                    <p><strong>Capacity:</strong> {facility.capacity} beds</p>
                    <p><strong>Current Occupancy:</strong> {facility.currentOccupancy} beds</p>
                    <p><strong>Occupancy Rate:</strong> {((facility.currentOccupancy / facility.capacity) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="facility-specialties">
                    <strong>Specialties:</strong>
                    <div className="specialty-tags">
                      {facility.specialties.map(specialty => (
                        <span key={specialty} className="specialty-tag">{specialty}</span>
                      ))}
                    </div>
                  </div>
                  <div className="facility-contact">
                    <p><strong>Phone:</strong> {facility.contactInfo.phone}</p>
                    <p><strong>Emergency:</strong> {facility.contactInfo.emergency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'programs':
        return (
          <div className="programs-content">
            <div className="content-header">
              <h2>📋 Health Programs</h2>
              <button className="add-program-btn">+ Add Program</button>
            </div>
            <div className="programs-grid">
              {healthPrograms.map(program => (
                <div key={program.id} className="program-detail-card">
                  <div className="program-card-header">
                    <h3>{program.name}</h3>
                    <div className={`status-badge status-${program.status}`}>
                      {program.status}
                    </div>
                  </div>
                  <div className="program-details">
                    <p><strong>Type:</strong> {program.type}</p>
                    <p><strong>Coordinator:</strong> {program.coordinator}</p>
                    <p><strong>Enrollment:</strong> {program.enrollment.toLocaleString()} / {program.capacity.toLocaleString()}</p>
                    <p><strong>Budget:</strong> ${program.budget.toLocaleString()}</p>
                  </div>
                  <div className="program-metrics-detail">
                    <h4>Performance Metrics</h4>
                    <div className="metrics-bars">
                      <div className="metric-bar">
                        <label>Satisfaction: {program.metrics.satisfaction}%</label>
                        <div className="bar">
                          <div className="bar-fill" style={{ width: `${program.metrics.satisfaction}%` }}></div>
                        </div>
                      </div>
                      <div className="metric-bar">
                        <label>Completion: {program.metrics.completion}%</label>
                        <div className="bar">
                          <div className="bar-fill" style={{ width: `${program.metrics.completion}%` }}></div>
                        </div>
                      </div>
                      <div className="metric-bar">
                        <label>Effectiveness: {program.metrics.effectiveness}%</label>
                        <div className="bar">
                          <div className="bar-fill" style={{ width: `${program.metrics.effectiveness}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'cases':
        return (
          <div className="cases-content">
            <div className="content-header">
              <h2>📋 Social Service Cases</h2>
              <button className="add-case-btn">+ New Case</button>
            </div>
            <div className="cases-grid">
              {socialServiceCases.map(serviceCase => (
                <div key={serviceCase.id} className="case-detail-card">
                  <div className="case-card-header">
                    <h3>{serviceCase.id}</h3>
                    <div className={`priority-badge priority-${serviceCase.priority}`}>
                      {serviceCase.priority.toUpperCase()}
                    </div>
                  </div>
                  <div className="case-details">
                    <p><strong>Type:</strong> {serviceCase.type}</p>
                    <p><strong>Status:</strong> <span className={`status-${serviceCase.status}`}>{serviceCase.status}</span></p>
                    <p><strong>Assigned To:</strong> {serviceCase.assignedTo}</p>
                    <p><strong>Client Age:</strong> {serviceCase.clientAge} years</p>
                    <p><strong>Risk Level:</strong> {serviceCase.riskLevel}/10</p>
                    <p><strong>Created:</strong> {new Date(serviceCase.createdDate).toLocaleDateString()}</p>
                    <p><strong>Last Update:</strong> {new Date(serviceCase.lastUpdate).toLocaleDateString()}</p>
                  </div>
                  <div className="case-actions">
                    <button className="action-btn update">Update Case</button>
                    <button className="action-btn view">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="alerts-content">
            <div className="content-header">
              <h2>🚨 Health Alerts & Surveillance</h2>
              <button className="add-alert-btn">+ New Alert</button>
            </div>
            <div className="alerts-grid">
              {healthAlerts.map(alert => (
                <div key={alert.id} className={`alert-detail-card severity-${alert.severity}`}>
                  <div className="alert-card-header">
                    <h3>{alert.title}</h3>
                    <div className={`severity-badge severity-${alert.severity}`}>
                      {alert.severity.toUpperCase()}
                    </div>
                  </div>
                  <div className="alert-details">
                    <p><strong>Type:</strong> {alert.type.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Status:</strong> <span className={`status-${alert.status}`}>{alert.status}</span></p>
                    <p><strong>Description:</strong> {alert.description}</p>
                    <p><strong>Affected Areas:</strong> {alert.affectedAreas.join(', ')}</p>
                    <p><strong>Timestamp:</strong> {new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="response-actions">
                    <h4>Response Actions:</h4>
                    <ul>
                      {alert.responseActions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'surveillance':
        return (
          <div className="surveillance-content">
            <div className="content-header">
              <h2>🔬 Disease Surveillance</h2>
            </div>
            <div className="surveillance-dashboard">
              <div className="surveillance-metrics">
                <div className="metric-card">
                  <h3>🦠 Disease Monitoring</h3>
                  <div className="disease-stats">
                    <div className="stat-item">
                      <span className="stat-value">47</span>
                      <span className="stat-label">Active Cases</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">12</span>
                      <span className="stat-label">Under Investigation</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">3</span>
                      <span className="stat-label">Outbreak Alerts</span>
                    </div>
                  </div>
                </div>
                <div className="metric-card">
                  <h3>📊 Surveillance Metrics</h3>
                  <div className="surveillance-stats">
                    <div className="stat-item">
                      <span className="stat-value">98.2%</span>
                      <span className="stat-label">Reporting Compliance</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">24h</span>
                      <span className="stat-label">Avg Response Time</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">156</span>
                      <span className="stat-label">Tests Today</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="reports-content">
            <div className="content-header">
              <h2>📊 Health Reports & Analytics</h2>
              <button className="generate-report-btn">+ Generate Report</button>
            </div>
            <div className="reports-dashboard">
              <div className="report-categories">
                <div className="report-category">
                  <h3>📈 Performance Reports</h3>
                  <div className="report-list">
                    <div className="report-item">
                      <span>Monthly Health Metrics</span>
                      <button className="download-btn">Download</button>
                    </div>
                    <div className="report-item">
                      <span>Program Effectiveness Analysis</span>
                      <button className="download-btn">Download</button>
                    </div>
                    <div className="report-item">
                      <span>Facility Utilization Report</span>
                      <button className="download-btn">Download</button>
                    </div>
                  </div>
                </div>
                <div className="report-category">
                  <h3>🏥 Operational Reports</h3>
                  <div className="report-list">
                    <div className="report-item">
                      <span>Emergency Response Summary</span>
                      <button className="download-btn">Download</button>
                    </div>
                    <div className="report-item">
                      <span>Social Services Caseload</span>
                      <button className="download-btn">Download</button>
                    </div>
                    <div className="report-item">
                      <span>Disease Surveillance Report</span>
                      <button className="download-btn">Download</button>
                    </div>
                  </div>
                </div>
                <div className="report-category">
                  <h3>📋 Compliance Reports</h3>
                  <div className="report-list">
                    <div className="report-item">
                      <span>HIPAA Compliance Audit</span>
                      <button className="download-btn">Download</button>
                    </div>
                    <div className="report-item">
                      <span>Public Health Standards</span>
                      <button className="download-btn">Download</button>
                    </div>
                    <div className="report-item">
                      <span>Quality Assurance Report</span>
                      <button className="download-btn">Download</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h1>🏥 Public Health Services Dashboard</h1>
          <p>Comprehensive health monitoring and social services coordination for Benton County</p>
        </div>
        <div className="header-actions">
          <button className="emergency-button">🚨 Emergency Response</button>
          <button className="sync-button">🔄 Sync Data</button>
        </div>
      </div>

      <div className="dashboard-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: '🏠' },
          { id: 'facilities', label: 'Facilities', icon: '🏥' },
          { id: 'programs', label: 'Programs', icon: '📋' },
          { id: 'cases', label: 'Cases', icon: '👥' },
          { id: 'alerts', label: 'Alerts', icon: '🚨' },
          { id: 'surveillance', label: 'Surveillance', icon: '🔬' },
          { id: 'reports', label: 'Reports', icon: '📊' }
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

export default HealthDashboard;