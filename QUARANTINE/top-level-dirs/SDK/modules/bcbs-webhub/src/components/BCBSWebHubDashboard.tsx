// TerraFusion Elite Government OS BCBS WebHub Dashboard
// Business Correspondence & Building Services Management Interface
// Government. Transcended.

import React, { useState } from 'react';
import {
  useBuildingsData,
  usePermitsData,
  useInspectionsData,
  useViolationsData,
  useBusinessLicensesData,
  useCorrespondenceData,
  useBCBSAnalytics,
  useBCBSMetrics,
  useRealTimeRefresh
} from '../hooks/useBCBSData';
import { TerraFilterOptions } from '../types';

// Mock UI Components (would be imported from TerraFusion Design System)
const Card = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`terra-card terra-glass ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`terra-card-header ${className}`}>{children}</div>
);

const CardBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`terra-card-body ${className}`}>{children}</div>
);

const Badge = ({ children, variant = 'default', className = '' }: {
  children: React.ReactNode;
  variant?: string;
  className?: string
}) => (
  <span className={`terra-badge terra-badge-${variant} ${className}`}>{children}</span>
);

const Progress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`terra-progress ${className}`}>
    <div className="terra-progress-bar" style={{ width: `${value}%` }}></div>
  </div>
);

const Button = ({ children, variant = 'default', size = 'md', className = '', onClick, ...props }: {
  children: React.ReactNode;
  variant?: string;
  size?: string;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) => (
  <button
    className={`terra-button terra-button-${variant} terra-button-${size} ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

// Building Services Overview Widget
const BuildingServicesOverview: React.FC = () => {
  const { data: analytics, isLoading, error } = useBCBSAnalytics();
  const { refreshAllData } = useRealTimeRefresh();

  if (isLoading) {
    return (
      <Card className="loading-shimmer">
        <CardHeader>
          <h3>Building Services Overview</h3>
        </CardHeader>
        <CardBody>
          <div className="loading-content">Loading building services data...</div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="error-state">
        <CardHeader>
          <h3>Building Services Overview</h3>
        </CardHeader>
        <CardBody>
          <div className="error-message">Failed to load building services data</div>
          <Button onClick={refreshAllData} variant="outline" size="sm">Retry</Button>
        </CardBody>
      </Card>
    );
  }

  const stats = analytics?.data;
  if (!stats) return null;

  return (
    <Card className="building-services-overview terra-glow">
      <CardHeader className="flex justify-between items-center">
        <h3 className="terra-heading-lg terra-gradient-text">Building Services Overview</h3>
        <Badge variant="success" className="terra-pulse">OPERATIONAL</Badge>
      </CardHeader>
      <CardBody>
        <div className="overview-grid">
          <div className="overview-stat">
            <div className="stat-value terra-text-cyan">{stats.buildings.total.toLocaleString()}</div>
            <div className="stat-label">Total Buildings</div>
            <div className="stat-change">
              <Badge variant="success">+{stats.buildings.underConstruction} Under Construction</Badge>
            </div>
          </div>

          <div className="overview-stat">
            <div className="stat-value terra-text-green">{stats.permits.total.toLocaleString()}</div>
            <div className="stat-label">Total Permits</div>
            <div className="stat-change">
              <Badge variant="warning">{stats.permits.pending} Pending</Badge>
            </div>
          </div>

          <div className="overview-stat">
            <div className="stat-value terra-text-blue">{stats.inspections.total.toLocaleString()}</div>
            <div className="stat-label">Total Inspections</div>
            <div className="stat-change">
              <Badge variant="info">{stats.inspections.scheduled} Scheduled</Badge>
            </div>
          </div>

          <div className="overview-stat">
            <div className="stat-value terra-text-orange">{stats.violations.total.toLocaleString()}</div>
            <div className="stat-label">Code Violations</div>
            <div className="stat-change">
              <Badge variant="danger">{stats.violations.open} Open</Badge>
            </div>
          </div>
        </div>

        <div className="compliance-overview">
          <h4 className="terra-heading-md">Building Compliance Status</h4>
          <div className="compliance-stats">
            <div className="compliance-item">
              <span>Compliant Buildings</span>
              <Progress value={(stats.buildings.compliant / stats.buildings.total) * 100} />
              <span className="percentage">{((stats.buildings.compliant / stats.buildings.total) * 100).toFixed(1)}%</span>
            </div>
            <div className="compliance-item">
              <span>Inspection Pass Rate</span>
              <Progress value={(stats.inspections.passed / stats.inspections.completed) * 100} />
              <span className="percentage">{((stats.inspections.passed / stats.inspections.completed) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// Active Permits Widget
const ActivePermitsWidget: React.FC = () => {
  const [filters] = useState<TerraFilterOptions>({
    status: ['pending', 'under-review', 'approved']
  });
  const { data: permitsData, isLoading } = usePermitsData(filters);

  if (isLoading) {
    return (
      <Card className="loading-shimmer">
        <CardHeader>
          <h3>Active Permits</h3>
        </CardHeader>
        <CardBody>
          <div className="loading-content">Loading active permits...</div>
        </CardBody>
      </Card>
    );
  }

  const permits = permitsData?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'under-review': return 'info';
      case 'approved': return 'success';
      case 'issued': return 'primary';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card className="active-permits-widget">
      <CardHeader className="flex justify-between items-center">
        <h3 className="terra-heading-lg">Active Permits</h3>
        <Badge variant="info">{permits.length} Active</Badge>
      </CardHeader>
      <CardBody>
        <div className="permits-list">
          {permits.slice(0, 10).map((permit) => (
            <div key={permit.id} className="permit-item terra-hover-lift">
              <div className="permit-info">
                <div className="permit-header">
                  <span className="permit-number terra-text-semibold">{permit.permitNumber}</span>
                  <div className="permit-badges">
                    <Badge variant={getStatusColor(permit.status)}>{permit.status}</Badge>
                    <Badge variant={getPriorityColor(permit.priority)}>{permit.priority}</Badge>
                  </div>
                </div>
                <div className="permit-details">
                  <div className="permit-type">{permit.type.charAt(0).toUpperCase() + permit.type.slice(1)} - {permit.subType}</div>
                  <div className="permit-description">{permit.description}</div>
                  <div className="permit-applicant">Applicant: {permit.applicant.name}</div>
                </div>
                <div className="permit-meta">
                  <span>Applied: {permit.applicationDate.toLocaleDateString()}</span>
                  {permit.fees.balance > 0 && (
                    <span className="fees-due terra-text-warning">
                      Balance Due: ${permit.fees.balance.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {permits.length === 0 && (
          <div className="empty-state">
            <div className="empty-message">No active permits found</div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// Inspection Schedule Widget
const InspectionScheduleWidget: React.FC = () => {
  const [filters] = useState<TerraFilterOptions>({
    status: ['scheduled', 'in-progress']
  });
  const { data: inspectionsData, isLoading } = useInspectionsData(filters);

  if (isLoading) {
    return (
      <Card className="loading-shimmer">
        <CardHeader>
          <h3>Upcoming Inspections</h3>
        </CardHeader>
        <CardBody>
          <div className="loading-content">Loading inspection schedule...</div>
        </CardBody>
      </Card>
    );
  }

  const inspections = inspectionsData?.data || [];

  const getInspectionTypeColor = (type: string) => {
    switch (type) {
      case 'initial': return 'info';
      case 'rough': return 'warning';
      case 'final': return 'success';
      case 'follow-up': return 'danger';
      case 'complaint': return 'dark';
      case 'routine': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Card className="inspection-schedule-widget">
      <CardHeader className="flex justify-between items-center">
        <h3 className="terra-heading-lg">Upcoming Inspections</h3>
        <Badge variant="primary">{inspections.length} Scheduled</Badge>
      </CardHeader>
      <CardBody>
        <div className="inspection-list">
          {inspections.slice(0, 8).map((inspection) => (
            <div key={inspection.id} className="inspection-item terra-hover-lift">
              <div className="inspection-info">
                <div className="inspection-header">
                  <span className="inspection-number terra-text-semibold">{inspection.inspectionNumber}</span>
                  <div className="inspection-badges">
                    <Badge variant={getInspectionTypeColor(inspection.type)}>{inspection.type}</Badge>
                    <Badge variant="outline">{inspection.category}</Badge>
                  </div>
                </div>
                <div className="inspection-details">
                  <div className="inspection-date">
                    Scheduled: {inspection.scheduledDate.toLocaleDateString()} at {inspection.scheduledDate.toLocaleTimeString()}
                  </div>
                  <div className="inspection-inspector">Inspector: {inspection.inspector}</div>
                  <div className="inspection-address">
                    Building ID: {inspection.buildingId}
                    {inspection.permitId && ` | Permit: ${inspection.permitId}`}
                  </div>
                </div>
                {inspection.notes && (
                  <div className="inspection-notes">{inspection.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {inspections.length === 0 && (
          <div className="empty-state">
            <div className="empty-message">No upcoming inspections</div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// Performance Metrics Widget
const PerformanceMetricsWidget: React.FC = () => {
  const { data: metricsData, isLoading } = useBCBSMetrics();
  const { data: analytics } = useBCBSAnalytics();

  if (isLoading) {
    return (
      <Card className="loading-shimmer">
        <CardHeader>
          <h3>Performance Metrics</h3>
        </CardHeader>
        <CardBody>
          <div className="loading-content">Loading performance metrics...</div>
        </CardBody>
      </Card>
    );
  }

  const metrics = metricsData?.data?.[0];
  const performance = analytics?.data?.performance;

  if (!metrics || !performance) return null;

  return (
    <Card className="performance-metrics-widget terra-glow">
      <CardHeader>
        <h3 className="terra-heading-lg terra-gradient-text">Performance Metrics</h3>
        <div className="metrics-timestamp">
          Last Updated: {metrics.timestamp.toLocaleTimeString()}
        </div>
      </CardHeader>
      <CardBody>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-label">Permit Processing Time</div>
            <div className="metric-value terra-text-cyan">{performance.permitProcessingTime} days</div>
            <div className="metric-trend">
              <Badge variant="success">-2.3 days from last month</Badge>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Inspection Scheduling</div>
            <div className="metric-value terra-text-green">{performance.inspectionSchedulingTime} days</div>
            <div className="metric-trend">
              <Badge variant="success">-0.5 days from last month</Badge>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Violation Resolution</div>
            <div className="metric-value terra-text-orange">{performance.violationResolutionTime} days</div>
            <div className="metric-trend">
              <Badge variant="warning">+1.2 days from last month</Badge>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Customer Satisfaction</div>
            <div className="metric-value terra-text-blue">{performance.customerSatisfaction}%</div>
            <div className="metric-trend">
              <Badge variant="success">+2.1% from last month</Badge>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">System Uptime</div>
            <div className="metric-value terra-text-green">{metrics.systemHealth.uptime}%</div>
            <div className="metric-trend">
              <Badge variant="success">Excellent</Badge>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Response Time</div>
            <div className="metric-value terra-text-cyan">{metrics.systemHealth.responseTime}ms</div>
            <div className="metric-trend">
              <Badge variant="info">Normal</Badge>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// Business Licenses Summary Widget
const BusinessLicensesSummaryWidget: React.FC = () => {
  const { data: licensesData, isLoading } = useBusinessLicensesData();
  const { data: analytics } = useBCBSAnalytics();

  if (isLoading) {
    return (
      <Card className="loading-shimmer">
        <CardHeader>
          <h3>Business Licenses</h3>
        </CardHeader>
        <CardBody>
          <div className="loading-content">Loading business licenses...</div>
        </CardBody>
      </Card>
    );
  }

  const licenses = licensesData?.data || [];
  const licenseStats = analytics?.data?.businessLicenses;

  return (
    <Card className="business-licenses-widget">
      <CardHeader className="flex justify-between items-center">
        <h3 className="terra-heading-lg">Business Licenses</h3>
        <Badge variant="primary">{licenseStats?.total || 0} Total</Badge>
      </CardHeader>
      <CardBody>
        <div className="license-stats">
          <div className="stat-row">
            <span>Active Licenses</span>
            <Badge variant="success">{licenseStats?.active || 0}</Badge>
          </div>
          <div className="stat-row">
            <span>Expired Licenses</span>
            <Badge variant="danger">{licenseStats?.expired || 0}</Badge>
          </div>
          <div className="stat-row">
            <span>Pending Applications</span>
            <Badge variant="warning">{licenseStats?.pending || 0}</Badge>
          </div>
          <div className="stat-row">
            <span>Renewal Rate</span>
            <Badge variant="info">{licenseStats?.renewalRate || 0}%</Badge>
          </div>
        </div>

        <div className="revenue-summary">
          <h4 className="terra-heading-sm">Revenue Summary</h4>
          <div className="revenue-item">
            <span>Total Revenue</span>
            <span className="revenue-amount terra-text-green">
              ${licenseStats?.revenueTotal.toLocaleString() || 0}
            </span>
          </div>
          <div className="revenue-item">
            <span>This Month</span>
            <span className="revenue-amount terra-text-cyan">
              ${licenseStats?.revenueThisMonth.toLocaleString() || 0}
            </span>
          </div>
        </div>

        <div className="recent-licenses">
          <h4 className="terra-heading-sm">Recent Licenses</h4>
          {licenses.slice(0, 3).map((license) => (
            <div key={license.id} className="license-item">
              <div className="license-name">{license.businessName}</div>
              <div className="license-type">{license.businessType}</div>
              <Badge variant={license.status === 'active' ? 'success' : 'warning'}>
                {license.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

// Main BCBS WebHub Dashboard Component
const BCBSWebHubDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { refreshAllData } = useRealTimeRefresh();

  const handleRefresh = () => {
    refreshAllData();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bcbs-webhub-dashboard terra-quantum-bg">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title terra-heading-xl terra-gradient-text">
            Business Correspondence & Building Services WebHub
          </h1>
          <p className="dashboard-subtitle terra-text-muted">
            Comprehensive building services and business correspondence management for government operations
          </p>
          <div className="header-actions">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="refresh-button terra-hover-glow"
            >
              🔄 Refresh Data
            </Button>
            <Badge variant="success" className="terra-pulse">Government. Transcended.</Badge>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" key={refreshKey}>
        <div className="grid-item span-2">
          <BuildingServicesOverview />
        </div>

        <div className="grid-item">
          <PerformanceMetricsWidget />
        </div>

        <div className="grid-item">
          <ActivePermitsWidget />
        </div>

        <div className="grid-item">
          <InspectionScheduleWidget />
        </div>

        <div className="grid-item">
          <BusinessLicensesSummaryWidget />
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="footer-content">
          <div className="system-info">
            <span className="system-name">TerraFusion Elite Government OS</span>
            <span className="version">BCBS WebHub v1.0.0</span>
            <Badge variant="success" className="terra-glow">Port 5016</Badge>
          </div>
          <div className="footer-links">
            <span className="footer-link">Building Services</span>
            <span className="footer-link">Business Licenses</span>
            <span className="footer-link">Code Enforcement</span>
            <span className="footer-link">Correspondence</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BCBSWebHubDashboard;
