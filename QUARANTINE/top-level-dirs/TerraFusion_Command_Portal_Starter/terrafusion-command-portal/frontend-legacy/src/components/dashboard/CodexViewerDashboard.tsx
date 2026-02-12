import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Monitor,
  Network,
  Server,
  Shield,
  Zap,
  TrendingUp,
  Users,
  FileText,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  MapPin,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  CloudLightning,
  Bell,
  RefreshCw,
} from 'lucide-react';

/**
 * TerraFusion Codex Viewer Dashboard
 * 
 * Real-time visualization dashboard for system health monitoring,
 * phase tracking, operational insights, and compliance status.
 * 
 * Features:
 * - Live system health monitoring
 * - Phase progression visualization
 * - Real-time telemetry display
 * - Compliance status tracking
 * - Federation health monitoring
 * - Performance metrics visualization
 * - Alert and notification management
 */

// Types for dashboard data structures
interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  uptime: string;
  lastUpdated: Date;
  services: ServiceHealth[];
  infrastructure: InfrastructureMetrics;
  alerts: Alert[];
}

interface ServiceHealth {
  name: string;
  status: 'running' | 'degraded' | 'stopped';
  responseTime: number;
  errorRate: number;
  throughput: number;
  lastHealthCheck: Date;
}

interface InfrastructureMetrics {
  cpu: MetricValue;
  memory: MetricValue;
  disk: MetricValue;
  network: NetworkMetrics;
}

interface MetricValue {
  current: number;
  max: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface NetworkMetrics {
  latency: number;
  bandwidth: MetricValue;
  connections: number;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  source: string;
}

interface PhaseStatus {
  currentPhase: string;
  completionPercentage: number;
  phaseHistory: PhaseHistoryEntry[];
  nextMilestones: Milestone[];
  estimatedCompletion: Date;
}

interface PhaseHistoryEntry {
  phase: string;
  startDate: Date;
  endDate?: Date;
  duration?: number;
  status: 'completed' | 'active' | 'pending';
  achievements: string[];
}

interface Milestone {
  name: string;
  description: string;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];
}

interface ComplianceStatus {
  overallScore: number;
  controlsImplemented: number;
  totalControls: number;
  evidenceCollected: number;
  openFindings: number;
  lastAssessment: Date;
  nextAssessment: Date;
}

interface FederationHealth {
  counties: CountyStatus[];
  meshConnectivity: number;
  averageLatency: number;
  messagesThroughput: number;
  failoverCount: number;
}

interface CountyStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  lastContact: Date;
  services: string[];
}

const CodexViewerDashboard: React.FC = () => {
  // State management for real-time data
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [phaseStatus, setPhaseStatus] = useState<PhaseStatus | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [federationHealth, setFederationHealth] = useState<FederationHealth | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'health' | 'phases' | 'compliance' | 'federation'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Real-time data fetching
  const fetchSystemHealth = useCallback(async () => {
    try {
      // In production, this would be actual API calls
      const mockHealth: SystemHealth = {
        overall: 'healthy',
        uptime: '15d 7h 23m',
        lastUpdated: new Date(),
        services: [
          {
            name: 'TerraFusion Portal',
            status: 'running',
            responseTime: 145,
            errorRate: 0.02,
            throughput: 1247,
            lastHealthCheck: new Date(),
          },
          {
            name: 'Federation Relay',
            status: 'running',
            responseTime: 89,
            errorRate: 0.01,
            throughput: 892,
            lastHealthCheck: new Date(),
          },
          {
            name: 'XMTP Escrow Service',
            status: 'degraded',
            responseTime: 267,
            errorRate: 0.15,
            throughput: 445,
            lastHealthCheck: new Date(),
          },
          {
            name: 'OPA Policy Engine',
            status: 'running',
            responseTime: 34,
            errorRate: 0.00,
            throughput: 2341,
            lastHealthCheck: new Date(),
          },
        ],
        infrastructure: {
          cpu: { current: 67, max: 100, unit: '%', trend: 'stable' },
          memory: { current: 12.4, max: 32, unit: 'GB', trend: 'up' },
          disk: { current: 245, max: 500, unit: 'GB', trend: 'up' },
          network: {
            latency: 12.5,
            bandwidth: { current: 125, max: 1000, unit: 'Mbps', trend: 'stable' },
            connections: 1847,
          },
        },
        alerts: [
          {
            id: '1',
            severity: 'medium',
            title: 'XMTP Service Degraded',
            description: 'Response time above threshold for XMTP Escrow Service',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            acknowledged: false,
            source: 'Health Monitor',
          },
          {
            id: '2',
            severity: 'low',
            title: 'Disk Usage Increasing',
            description: 'Disk usage trending upward, monitor for capacity planning',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            acknowledged: true,
            source: 'Infrastructure Monitor',
          },
        ],
      };
      setSystemHealth(mockHealth);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  }, []);

  const fetchPhaseStatus = useCallback(async () => {
    try {
      const mockPhase: PhaseStatus = {
        currentPhase: 'Phase-2 Enhancement Kit',
        completionPercentage: 87.5,
        phaseHistory: [
          {
            phase: 'Foundation Setup',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-15'),
            duration: 14,
            status: 'completed',
            achievements: ['Portal Infrastructure', 'Basic Services', 'Security Framework'],
          },
          {
            phase: 'Phase-1 Enhancement',
            startDate: new Date('2024-01-16'),
            endDate: new Date('2024-02-28'),
            duration: 43,
            status: 'completed',
            achievements: ['Advanced Dashboard', 'Analytics Engine', 'Collaboration Tools'],
          },
          {
            phase: 'Phase-2 Enhancement Kit',
            startDate: new Date('2024-03-01'),
            status: 'active',
            achievements: ['XMTP Integration', 'Federation Relay', 'OPA Policies', 'Compliance Framework'],
          },
        ],
        nextMilestones: [
          {
            name: 'Complete Compliance Binder',
            description: 'Finalize FedRAMP Moderate documentation generation',
            targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            priority: 'high',
            dependencies: ['Evidence Collection', 'Policy Validation'],
          },
          {
            name: 'Production Readiness Review',
            description: 'Final security and compliance assessment',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priority: 'high',
            dependencies: ['Compliance Binder', 'Performance Testing'],
          },
        ],
        estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      };
      setPhaseStatus(mockPhase);
    } catch (error) {
      console.error('Failed to fetch phase status:', error);
    }
  }, []);

  const fetchComplianceStatus = useCallback(async () => {
    try {
      const mockCompliance: ComplianceStatus = {
        overallScore: 96.8,
        controlsImplemented: 87,
        totalControls: 90,
        evidenceCollected: 245,
        openFindings: 3,
        lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextAssessment: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      };
      setComplianceStatus(mockCompliance);
    } catch (error) {
      console.error('Failed to fetch compliance status:', error);
    }
  }, []);

  const fetchFederationHealth = useCallback(async () => {
    try {
      const mockFederation: FederationHealth = {
        counties: [
          {
            name: 'Benton County',
            status: 'online',
            latency: 45,
            lastContact: new Date(),
            services: ['Permits', 'Utilities', 'Emergency'],
          },
          {
            name: 'Franklin County',
            status: 'online',
            latency: 52,
            lastContact: new Date(Date.now() - 30 * 1000),
            services: ['Permits', 'Health Services'],
          },
          {
            name: 'Yakima County',
            status: 'degraded',
            latency: 156,
            lastContact: new Date(Date.now() - 2 * 60 * 1000),
            services: ['Emergency', 'Transportation'],
          },
        ],
        meshConnectivity: 89.7,
        averageLatency: 67.3,
        messagesThroughput: 1247,
        failoverCount: 2,
      };
      setFederationHealth(mockFederation);
    } catch (error) {
      console.error('Failed to fetch federation health:', error);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    const fetchAllData = () => {
      fetchSystemHealth();
      fetchPhaseStatus();
      fetchComplianceStatus();
      fetchFederationHealth();
    };

    fetchAllData(); // Initial fetch

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchSystemHealth, fetchPhaseStatus, fetchComplianceStatus, fetchFederationHealth]);

  // Status badge component
  const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
    const baseClasses = `inline-flex items-center font-medium rounded-full ${size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'}`;
    
    switch (status) {
      case 'healthy':
      case 'running':
      case 'online':
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>● {status}</span>;
      case 'warning':
      case 'degraded':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>● {status}</span>;
      case 'critical':
      case 'stopped':
      case 'offline':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>● {status}</span>;
      case 'active':
      case 'pending':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>● {status}</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>● {status}</span>;
    }
  };

  // Metric card component
  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'stable';
    status?: 'good' | 'warning' | 'error';
  }> = ({ title, value, subtitle, icon, trend, status = 'good' }) => {
    const statusColors = {
      good: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50',
    };

    const trendIcons = {
      up: <TrendingUp className="w-4 h-4 text-green-500" />,
      down: <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />,
      stable: <div className="w-4 h-4 bg-gray-400 rounded-full" />,
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${statusColors[status]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium text-gray-700">{title}</span>
          </div>
          {trend && trendIcons[trend]}
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
        </div>
      </div>
    );
  };

  // Overview dashboard
  const OverviewDashboard = () => (
    <div className="space-y-6">
      {/* System Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="System Health"
          value={systemHealth?.overall || 'unknown'}
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          status={systemHealth?.overall === 'healthy' ? 'good' : 'warning'}
        />
        <MetricCard
          title="Phase Progress"
          value={`${phaseStatus?.completionPercentage || 0}%`}
          subtitle={phaseStatus?.currentPhase}
          icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
        />
        <MetricCard
          title="Compliance Score"
          value={`${complianceStatus?.overallScore || 0}%`}
          subtitle={`${complianceStatus?.controlsImplemented}/${complianceStatus?.totalControls} controls`}
          icon={<Shield className="w-5 h-5 text-green-500" />}
          status={complianceStatus && complianceStatus.overallScore > 95 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Federation Health"
          value={`${federationHealth?.meshConnectivity || 0}%`}
          subtitle={`${federationHealth?.counties?.filter(c => c.status === 'online').length || 0}/3 counties online`}
          icon={<Network className="w-5 h-5 text-orange-500" />}
        />
      </div>

      {/* Active Alerts */}
      {systemHealth?.alerts && systemHealth.alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-red-500" />
            Active Alerts
          </h3>
          <div className="space-y-3">
            {systemHealth.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Source: {alert.source}</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <StatusBadge status={alert.acknowledged ? 'acknowledged' : alert.severity} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Uptime"
          value={systemHealth?.uptime || '0d 0h 0m'}
          icon={<Clock className="w-5 h-5 text-blue-500" />}
        />
        <MetricCard
          title="Services"
          value={`${systemHealth?.services?.filter(s => s.status === 'running').length || 0}/${systemHealth?.services?.length || 0}`}
          subtitle="Running"
          icon={<Server className="w-5 h-5 text-green-500" />}
        />
        <MetricCard
          title="Evidence Items"
          value={complianceStatus?.evidenceCollected || 0}
          subtitle="Collected"
          icon={<FileText className="w-5 h-5 text-purple-500" />}
        />
        <MetricCard
          title="Federation Latency"
          value={`${federationHealth?.averageLatency || 0}ms`}
          subtitle="Average"
          icon={<Zap className="w-5 h-5 text-yellow-500" />}
        />
      </div>
    </div>
  );

  // Navigation tabs
  const navigationTabs = [
    { id: 'overview', label: 'Overview', icon: <Monitor className="w-4 h-4" /> },
    { id: 'health', label: 'System Health', icon: <Activity className="w-4 h-4" /> },
    { id: 'phases', label: 'Phase Progress', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'compliance', label: 'Compliance', icon: <Shield className="w-4 h-4" /> },
    { id: 'federation', label: 'Federation', icon: <Network className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">TerraFusion Codex</h1>
                  <p className="text-sm text-gray-600">Live System Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RefreshCw 
                  className={`w-4 h-4 ${autoRefresh ? 'text-green-500 animate-spin' : 'text-gray-400'}`} 
                />
                <span className="text-sm text-gray-600">
                  {autoRefresh ? `Auto-refresh ${refreshInterval/1000}s` : 'Manual refresh'}
                </span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {autoRefresh ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="text-right text-sm text-gray-600">
                <div>Last updated</div>
                <div className="font-medium">
                  {systemHealth?.lastUpdated ? new Date(systemHealth.lastUpdated).toLocaleTimeString() : '--:--:--'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-8 px-6">
          {navigationTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                selectedView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {selectedView === 'overview' && <OverviewDashboard />}
        {selectedView === 'health' && (
          <div className="text-center py-12">
            <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">System Health Dashboard</h2>
            <p className="text-gray-600">Detailed system health monitoring view coming soon...</p>
          </div>
        )}
        {selectedView === 'phases' && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Phase Progress Dashboard</h2>
            <p className="text-gray-600">Phase tracking and milestone visualization coming soon...</p>
          </div>
        )}
        {selectedView === 'compliance' && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Compliance Dashboard</h2>
            <p className="text-gray-600">Compliance monitoring and reporting dashboard coming soon...</p>
          </div>
        )}
        {selectedView === 'federation' && (
          <div className="text-center py-12">
            <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Federation Health Dashboard</h2>
            <p className="text-gray-600">Multi-county federation monitoring dashboard coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CodexViewerDashboard;