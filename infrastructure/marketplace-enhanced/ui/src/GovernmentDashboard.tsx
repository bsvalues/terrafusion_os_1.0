import React, { useState, useEffect } from 'react';
import { governmentAPI, County, GovernmentPlugin, ValidationStatus, AuditEntry } from './services/GovernmentAPIService';
import { authService, User } from './services/AuthenticationService';
import { performanceService, PerformanceMetrics } from './services/PerformanceService';
import { notificationService, Notification, ComplianceAlert } from './services/NotificationService';
import './GovernmentDashboard.css';

export const GovernmentDashboard: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [counties, setCounties] = useState<County[]>([]);
  const [plugins, setPlugins] = useState<GovernmentPlugin[]>([]);
  const [validationStatuses, setValidationStatuses] = useState<Record<string, ValidationStatus>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'federation' | 'compliance' | 'audit'>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDashboard();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication
      const user = authService.getCurrentUser();
      if (!user) {
        // Try mock login for development
        await authService.mockLogin();
        setCurrentUser(authService.getCurrentUser());
      } else {
        setCurrentUser(user);
      }

      // Load counties
      const countiesData = await governmentAPI.getCounties();
      setCounties(countiesData);

      // Set default county if user has access
      if (countiesData.length > 0 && !selectedCounty) {
        const userCounty = countiesData.find(c => authService.canAccessCounty(c.id));
        if (userCounty) {
          setSelectedCounty(userCounty.id);
        } else {
          setSelectedCounty(countiesData[0].id);
        }
      }

      // Load plugins
      const pluginsData = await governmentAPI.getGovernmentPlugins();
      setPlugins(pluginsData);

      // Load validation statuses
      const validationData: Record<string, ValidationStatus> = {};
      for (const plugin of pluginsData) {
        try {
          validationData[plugin.id] = await governmentAPI.getValidationStatus(plugin.id);
        } catch (error) {
          console.warn(`Failed to load validation for ${plugin.id}:`, error);
        }
      }
      setValidationStatuses(validationData);

      // Load performance metrics
      const metrics = performanceService.getPerformanceMetrics();
      setPerformanceMetrics(metrics);

      // Load notifications
      const notificationsData = notificationService.getNotifications({ limit: 10 });
      setNotifications(notificationsData);

      // Load compliance alerts
      const alertsData = notificationService.getComplianceAlerts({ status: 'open' });
      setComplianceAlerts(alertsData);

    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Performance updates
    performanceService.on('performance_update', (metrics: PerformanceMetrics) => {
      setPerformanceMetrics(metrics);
    });

    // Real-time validation updates
    performanceService.on('validation_update', (data: any) => {
      if (data.pluginId && data.status) {
        setValidationStatuses(prev => ({
          ...prev,
          [data.pluginId]: data.status
        }));
      }
    });

    // Notification updates
    notificationService.on('notification_created', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    });

    // Compliance alerts
    notificationService.on('compliance_alert_created', (alert: ComplianceAlert) => {
      setComplianceAlerts(prev => [alert, ...prev]);
    });
  };

  const cleanupEventListeners = () => {
    // Remove event listeners to prevent memory leaks
    performanceService.off('performance_update', () => {});
    performanceService.off('validation_update', () => {});
    notificationService.off('notification_created', () => {});
    notificationService.off('compliance_alert_created', () => {});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': case 'active': case 'validated': return 'var(--tf-success)';
      case 'warning': case 'pending': return 'var(--tf-warning)';
      case 'failed': case 'inactive': return 'var(--tf-error)';
      default: return 'var(--tf-gray-500)';
    }
  };

  const renderOverviewTab = () => (
    <div className="tf-gov-overview">
      <div className="tf-stats-grid">
        <div className="tf-stat-card"><>

          <div className="tf-stat-icon">🏛️</div>
          <div
</>
className="tf-stat-number">{counties.length}</div><>

          <div className="tf-stat-label">Federated Counties</div>
          <div
</>
className="tf-stat-trend">+2 this month</div>
        </div>
        <div className="tf-stat-card"><>

          <div className="tf-stat-icon">🔒</div>
          <div
</>
className="tf-stat-number">98.2%</div><>

          <div className="tf-stat-label">Security Compliance</div>
          <div
</>
className="tf-stat-trend">+1.2% from last audit</div>
        </div>
        <div className="tf-stat-card"><>

          <div className="tf-stat-icon">⚡</div>
          <div
</>
className="tf-stat-number">{plugins.length}</div><>

          <div className="tf-stat-label">Active Plugins</div>
          <div
</>
className="tf-stat-trend">All validated</div>
        </div>
        <div className="tf-stat-card"><>

          <div className="tf-stat-icon">📊</div>
          <div
</>
className="tf-stat-number">$2.8M</div><>

          <div className="tf-stat-label">Monthly Processing</div>
          <div
</>
className="tf-stat-trend">PILT distributions</div>
        </div>
      </div>

      <div className="tf-gov-section"><>

        <h3>Real-Time AI Validation Status</h3>
        <div
</>
className="tf-validation-grid">
          {plugins.map(plugin => {
            const validation = validationStatuses[plugin.id];
            if (!validation) return null;
            
            return (
              <div key={plugin.id} className="tf-validation-card">
                <div className="tf-validation-header"><>

                  <h4>{plugin.name}</h4>
                  <div
</>
className="tf-ai-confidence">
                    AI Confidence: {Math.round(validation.aiConfidence * 100)}%
                  </div>
                </div>
                <div className="tf-validation-metrics">
                  <div className="tf-metric"><>

                    <span className="tf-metric-label">Security</span>
                    <span
</>

                      className="tf-metric-status"
                      style={{ color: getStatusColor(validation.security) }}
                    >
                      {validation.security.toUpperCase()}
                    </span>
                  </div>
                  <div className="tf-metric"><>

                    <span className="tf-metric-label">Compliance</span>
                    <span
</>

                      className="tf-metric-status"
                      style={{ color: getStatusColor(validation.compliance) }}
                    >
                      {validation.compliance.toUpperCase()}
                    </span>
                  </div>
                  <div className="tf-metric"><>

                    <span className="tf-metric-label">Performance</span>
                    <span
</>

                      className="tf-metric-status"
                      style={{ color: getStatusColor(validation.performance) }}
                    >
                      {validation.performance.toUpperCase()}
                    </span>
                  </div>
                  <div className="tf-metric"><>

                    <span className="tf-metric-label">Integration</span>
                    <span
</>

                      className="tf-metric-status"
                      style={{ color: getStatusColor(validation.integration) }}
                    >
                      {validation.integration.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="tf-validation-footer">
                  Last validated: {new Date(validation.lastValidated).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderFederationTab = () => (
    <div className="tf-gov-federation">
      <div className="tf-federation-header"><>

        <h3>Federated County Network</h3>
        <div
</>
className="tf-federation-controls">
          <select 
            value={selectedCounty} 
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="tf-county-selector"
            title="Select County for Federation View"
          >
            <option value="">All Counties</option>
            {counties.map(county => (
              <option key={county.id} value={county.id}>
                {county.name}, {county.state}
              </option>
            ))}
          </select>
          <button className="tf-btn tf-btn-primary">Add County</button>
        </div>
      </div>

      <div className="tf-county-grid">
        {counties.map(county => (
          <div key={county.id} className="tf-county-card">
            <div className="tf-county-header"><>

              <h4>{county.name}</h4>
              <span
</>

                className="tf-federation-status"
                style={{ color: getStatusColor(county.federationStatus) }}
              >
                {county.federationStatus.toUpperCase()}
              </span>
            </div>
            <div className="tf-county-details">
              <div className="tf-detail-row"><>

                <span>Population:</span>
                <span
</>
</>>{county.population.toLocaleString()}</span>
              </div>
              <div className="tf-detail-row"><>

                <span>Compliance Score:</span>
                <span
</>
</>>{county.complianceScore}%</span>
              </div>
              <div className="tf-detail-row"><>

                <span>Security Level:</span>
                <span
</>
style={{ color: getStatusColor(county.securityLevel) }}>
                  {county.securityLevel.toUpperCase()}
                </span>
              </div>
              <div className="tf-detail-row"><>

                <span>Last Audit:</span>
                <span
</>
</>>{county.lastAudit}</span>
              </div>
            </div>
            <div className="tf-county-actions"><>

              <button className="tf-btn tf-btn-sm">Manage</button>
              <button
</>
className="tf-btn tf-btn-sm tf-btn-outline">Audit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="tf-gov-compliance"><>

      <h3>Government Compliance Dashboard</h3>
      <div
</>
className="tf-compliance-overview">
        <div className="tf-compliance-metric">
          <div className="tf-metric-circle" data-percentage="94">
            <span>94%</span>
          </div>
          <div className="tf-metric-info"><>

            <h4>Overall Compliance</h4>
            <p
</>
</>>Federal & State Requirements</p>
          </div>
        </div>
        <div className="tf-compliance-breakdown">
          <div className="tf-compliance-item"><>

            <span className="tf-compliance-label">FISMA Compliance</span>
            <div
</>
className="tf-progress-bar">
              <div className="tf-progress-fill" style={{ width: '98%' }}></div>
            </div>
            <span className="tf-compliance-score">98%</span>
          </div>
          <div className="tf-compliance-item"><>

            <span className="tf-compliance-label">State DOE Requirements</span>
            <div
</>
className="tf-progress-bar">
              <div className="tf-progress-fill" style={{ width: '92%' }}></div>
            </div>
            <span className="tf-compliance-score">92%</span>
          </div>
          <div className="tf-compliance-item"><>

            <span className="tf-compliance-label">County Audit Standards</span>
            <div
</>
className="tf-progress-bar">
              <div className="tf-progress-fill" style={{ width: '96%' }}></div>
            </div>
            <span className="tf-compliance-score">96%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="tf-gov-audit"><>

      <h3>Comprehensive Audit Trail</h3>
      <div
</>
className="tf-audit-filters">
        <input 
          type="date" 
          className="tf-date-input"
          placeholder="Start Date"
        />
        <input 
          type="date" 
          className="tf-date-input"
          placeholder="End Date"
        />
        <select className="tf-audit-filter" title="Filter audit actions" aria-label="Filter audit actions"><>

          <option>All Actions</option>
          <option
</>
</>>Plugin Deployments</option><>

          <option>Security Events</option>
          <option
</>
</>>Compliance Changes</option>
        </select>
        <button className="tf-btn tf-btn-primary">Generate Report</button>
      </div>
      <div className="tf-audit-table">
        <div className="tf-audit-header"><>

          <span>Timestamp</span>
          <span
</>
</>>Action</span><>

          <span>User</span>
          <span
</>
</>>County</span>
          <span>Details</span>
        </div>
        <div className="tf-audit-row"><>

          <span>2025-07-30 16:15:23</span>
          <span
</>
</>>Plugin Validation</span><>

          <span>AI Agent</span>
          <span
</>
</>>Benton County</span>
          <span>PILT Calculator - Security scan completed</span>
        </div>
        <div className="tf-audit-row"><>

          <span>2025-07-30 14:30:15</span>
          <span
</>
</>>Deployment</span><>

          <span>admin@benton.gov</span>
          <span
</>
</>>Benton County</span>
          <span>CostForge Pro v2.1.3 deployed successfully</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tf-government-dashboard">
      <div className="tf-dashboard-header">
        <div className="tf-header-content"><>

          <h1>Terrafusion Government Marketplace</h1>
          <p
</>
</>>Federated Municipal Software Ecosystem</p>
        </div>
        <div className="tf-header-actions">
          <div className="tf-sovereignty-indicator"><>

            <span className="tf-sovereignty-icon">🛡️</span>
            <span
</>
</>>Sovereign Control Active</span>
          </div>
        </div>
      </div>

      <div className="tf-dashboard-tabs"><>

        <button 
          className={`tf-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
</>

          className={`tf-tab ${activeTab === 'federation' ? 'active' : ''}`}
          onClick={() => setActiveTab('federation')}
        >
          Federation
        </button><>

        <button 
          className={`tf-tab ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          Compliance
        </button>
        <button
</>

          className={`tf-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Trail
        </button>
      </div>

      <div className="tf-dashboard-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'federation' && renderFederationTab()}
        {activeTab === 'compliance' && renderComplianceTab()}
        {activeTab === 'audit' && renderAuditTab()}
      </div>
    </div>
  );
};
