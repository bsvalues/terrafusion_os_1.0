// Phase 6: Government Monitoring Dashboard - Core Implementation
// Government. Transcended. - TerraFusion Elite OS

import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Progress,
    TerraSphere
} from '@/components/terrafusion-design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Server,
    Shield,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

/**
 * TerraFusion Government Monitoring Dashboard
 *
 * Championship-level operational intelligence for infinite scale government administration.
 * Real-time visualization of data synchronization performance, government compliance metrics,
 * and quantum-enhanced system health monitoring.
 *
 * Features:
 * - Real-time sync performance monitoring (1,000+ ops/second)
 * - Government compliance tracking (FISMA-HIGH)
 * - County data sovereignty visualization
 * - Conflict resolution status and escalation management
 * - System health monitoring with autonomous recovery alerts
 * - Championship performance metrics with quantum optimization
 */

// ========================================================================================
// GOVERNMENT MONITORING INTERFACES
// ========================================================================================

interface SyncPerformanceMetrics {
  operations_per_second: number;
  average_processing_time_ms: number;
  queue_depth_total: number;
  queue_depth_by_priority: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  success_rate: number;
  conflicts_detected_last_hour: number;
  conflicts_resolved_last_hour: number;
  manual_reviews_pending: number;
  county_distribution: Record<string, number>;
  performance_trend: Array<{
    timestamp: string;
    ops_per_second: number;
    success_rate: number;
  }>;
}

interface GovernmentComplianceStatus {
  fisma_compliance_score: number;
  county_sovereignty_violations: number;
  audit_trail_coverage: number;
  data_integrity_score: number;
  security_incidents_last_24h: number;
  compliance_alerts: Array<{
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    county_id: string;
    timestamp: string;
    resolved: boolean;
  }>;
  government_approvals_pending: number;
  escalation_queue_depth: number;
}

interface SystemHealthStatus {
  terra_agent_connectivity: boolean;
  terra_agent_response_time_ms: number;
  terrafusion_api_health: boolean;
  terrafusion_response_time_ms: number;
  database_health: boolean;
  database_connection_pool: number;
  conflict_engine_status: boolean;
  sync_orchestrator_status: boolean;
  overall_system_health: number; // 0-100 score
  autonomous_recovery_active: boolean;
  last_health_check: string;
  uptime_percentage: number;
}

interface CountyOperationalStatus {
  county_id: string;
  county_name: string;
  sync_operations_active: number;
  data_sovereignty_status: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  last_sync_timestamp: string;
  pending_approvals: number;
  escalated_conflicts: number;
  system_health_score: number;
  citizen_services_available: boolean;
}

// ========================================================================================
// GOVERNMENT MONITORING DASHBOARD COMPONENT
// ========================================================================================

export const GovernmentMonitoringDashboard: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Real-time data queries with automatic refresh
  const { data: syncMetrics, isLoading: syncLoading } = useQuery({
    queryKey: ['sync-performance', timeRange],
    queryFn: () => fetchSyncPerformanceMetrics(timeRange),
    refetchInterval: autoRefresh ? 5000 : false, // 5-second refresh
    staleTime: 1000, // Consider data stale after 1 second
  });

  const { data: complianceStatus, isLoading: complianceLoading } = useQuery({
    queryKey: ['government-compliance'],
    queryFn: fetchGovernmentComplianceStatus,
    refetchInterval: autoRefresh ? 10000 : false, // 10-second refresh
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealthStatus,
    refetchInterval: autoRefresh ? 3000 : false, // 3-second refresh
  });

  const { data: countyStatuses, isLoading: countiesLoading } = useQuery({
    queryKey: ['county-statuses', selectedCounty],
    queryFn: () => fetchCountyOperationalStatuses(selectedCounty),
    refetchInterval: autoRefresh ? 15000 : false, // 15-second refresh
  });

  // Manual refresh mutation
  const refreshDashboard = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sync-performance'] }),
        queryClient.invalidateQueries({ queryKey: ['government-compliance'] }),
        queryClient.invalidateQueries({ queryKey: ['system-health'] }),
        queryClient.invalidateQueries({ queryKey: ['county-statuses'] }),
      ]);
    },
  });

  // Calculate overall system status
  const overallSystemStatus = useMemo(() => {
    if (!syncMetrics || !complianceStatus || !systemHealth) return 'UNKNOWN';

    const performanceScore = (syncMetrics.operations_per_second >= 1000 && syncMetrics.success_rate >= 0.99) ? 100 : 85;
    const complianceScore = complianceStatus.fisma_compliance_score;
    const healthScore = systemHealth.overall_system_health;

    const averageScore = (performanceScore + complianceScore + healthScore) / 3;

    if (averageScore >= 95) return 'TRANSCENDENT';
    if (averageScore >= 90) return 'EXCELLENT';
    if (averageScore >= 80) return 'GOOD';
    if (averageScore >= 70) return 'WARNING';
    return 'CRITICAL';
  }, [syncMetrics, complianceStatus, systemHealth]);

  const handleCountySelect = useCallback((countyId: string) => {
    setSelectedCounty(prev => prev === countyId ? null : countyId);
  }, []);

  if (syncLoading || complianceLoading || healthLoading) {
    return (
      <div className="tf-loading-portal min-h-screen bg-gradient-to-br from-[#0b1020] via-[#1a2332] to-[#0b1020]
        flex items-center justify-center">
        <div className="tf-quantum-loader text-center">
          <TerraSphere size="xl" variant="quantum" className="mb-6" />
          <div className="text-2xl font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa]
            bg-clip-text text-transparent">
            QUANTUM ALGORITHMS COMPUTING...
          </div>
          <div className="text-[#00ffee] mt-2">Government operational intelligence initializing</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tf-government-dashboard min-h-screen bg-gradient-to-br from-[#0b1020] via-[#1a2332] to-[#0b1020]
      text-white p-6 overflow-auto">

      {/* Dashboard Header */}
      <div className="tf-dashboard-header mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <TerraSphere size="lg" variant="quantum" />
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa]
                bg-clip-text text-transparent">
                GOVERNMENT OPERATIONS CENTER
              </h1>
              <p className="text-[#00ffee] text-lg font-semibold">
                Infrastructure Intelligence • Infinite Scale • Government. Transcended.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge
              variant={overallSystemStatus === 'TRANSCENDENT' ? 'quantum' :
                       overallSystemStatus === 'EXCELLENT' ? 'success' : 'warning'}
              className="px-4 py-2 text-lg font-bold">
              {overallSystemStatus}
            </Badge>

            <Button
              onClick={() => refreshDashboard.mutate()}
              disabled={refreshDashboard.isPending}
              className="tf-clarity-button bg-gradient-to-br from-[#0099ff] via-[#00ffee] to-[#00ffaa]
                text-white uppercase font-semibold rounded-full px-6 py-3">
              <Activity className="w-5 h-5 mr-2" />
              REFRESH
            </Button>

            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'quantum' : 'outline'}
              className="tf-auto-refresh-toggle">
              <Zap className="w-5 h-5 mr-2" />
              AUTO-REFRESH
            </Button>
          </div>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="tf-status-overview grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20
          rounded-2xl shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1
          transition-all duration-500 relative overflow-hidden">
          <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent
            via-[#00ffee]/20 to-transparent -translate-x-full hover:translate-x-full
            transition-transform duration-1000" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <BarChart3 className="w-8 h-8 text-[#00ffee]" />
              <Badge variant="quantum" className="text-xs">LIVE</Badge>
            </div>
          </CardHeader>
          <CardBody className="relative z-10">
            <div className="text-3xl font-black text-[#00ffee] mb-2">
              {syncMetrics?.operations_per_second?.toLocaleString() || '0'}/s
            </div>
            <div className="text-sm text-gray-300">Sync Operations</div>
            <div className="text-xs text-[#00ffaa] mt-1">
              Target: 1,000+ ops/sec • Success: {((syncMetrics?.success_rate || 0) * 100).toFixed(1)}%
            </div>
          </CardBody>
        </Card>

        <Card className="tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20
          rounded-2xl shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1
          transition-all duration-500 relative overflow-hidden">
          <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent
            via-[#00ffee]/20 to-transparent -translate-x-full hover:translate-x-full
            transition-transform duration-1000" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <Shield className="w-8 h-8 text-[#00ffaa]" />
              <Badge variant="success" className="text-xs">FISMA-HIGH</Badge>
            </div>
          </CardHeader>
          <CardBody className="relative z-10">
            <div className="text-3xl font-black text-[#00ffaa] mb-2">
              {complianceStatus?.fisma_compliance_score || 0}%
            </div>
            <div className="text-sm text-gray-300">FISMA Compliance</div>
            <div className="text-xs text-[#00ffee] mt-1">
              Violations: {complianceStatus?.county_sovereignty_violations || 0} •
              Audit Coverage: {complianceStatus?.audit_trail_coverage || 0}%
            </div>
          </CardBody>
        </Card>

        <Card className="tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20
          rounded-2xl shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1
          transition-all duration-500 relative overflow-hidden">
          <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent
            via-[#00ffee]/20 to-transparent -translate-x-full hover:translate-x-full
            transition-transform duration-1000" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <Server className="w-8 h-8 text-[#0099ff]" />
              <Badge
                variant={systemHealth?.overall_system_health >= 95 ? 'quantum' : 'warning'}
                className="text-xs">
                {systemHealth?.overall_system_health >= 95 ? 'OPTIMAL' : 'MONITORING'}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="relative z-10">
            <div className="text-3xl font-black text-[#0099ff] mb-2">
              {systemHealth?.overall_system_health || 0}%
            </div>
            <div className="text-sm text-gray-300">System Health</div>
            <div className="text-xs text-[#00ffaa] mt-1">
              Uptime: {systemHealth?.uptime_percentage?.toFixed(2) || 0}% •
              Auto-Recovery: {systemHealth?.autonomous_recovery_active ? 'ACTIVE' : 'STANDBY'}
            </div>
          </CardBody>
        </Card>

        <Card className="tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20
          rounded-2xl shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1
          transition-all duration-500 relative overflow-hidden">
          <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent
            via-[#00ffee]/20 to-transparent -translate-x-full hover:translate-x-full
            transition-transform duration-1000" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-[#ff6b35]" />
              <Badge variant="warning" className="text-xs">PENDING</Badge>
            </div>
          </CardHeader>
          <CardBody className="relative z-10">
            <div className="text-3xl font-black text-[#ff6b35] mb-2">
              {complianceStatus?.government_approvals_pending || 0}
            </div>
            <div className="text-sm text-gray-300">Gov. Approvals</div>
            <div className="text-xs text-[#00ffee] mt-1">
              Escalations: {complianceStatus?.escalation_queue_depth || 0} •
              Manual Reviews: {syncMetrics?.manual_reviews_pending || 0}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Performance Analytics & County Status */}
      <div className="tf-analytics-section grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Real-Time Performance Chart */}
        <Card className="tf-performance-chart tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20
          rounded-2xl shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#00ffee]">QUANTUM PERFORMANCE ANALYTICS</h3>
              <div className="flex space-x-2">
                {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                  <Button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    variant={timeRange === range ? 'quantum' : 'outline'}
                    size="sm"
                    className="text-xs">
                    {range.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="tf-performance-visualization h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-[#00ffee] mx-auto mb-4" />
                <div className="text-lg font-bold text-[#00ffaa]">
                  Championship Performance Monitoring
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Real-time visualization of 1,000+ operations/second
                </div>
                <div className="text-xs text-[#00ffee] mt-2">
                  Average Processing: {syncMetrics?.average_processing_time_ms || 0}ms
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* County Data Sovereignty Status */}
        <Card className="tf-county-status tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20
          rounded-2xl shadow-xl">
          <CardHeader>
            <h3 className="text-xl font-bold text-[#00ffee]">COUNTY DATA SOVEREIGNTY</h3>
          </CardHeader>
          <CardBody>
            <div className="tf-county-grid space-y-3 max-h-64 overflow-y-auto">
              {countiesLoading ? (
                <div className="text-center text-gray-400">Loading county statuses...</div>
              ) : (
                countyStatuses?.map((county: CountyOperationalStatus) => (
                  <div
                    key={county.county_id}
                    onClick={() => handleCountySelect(county.county_id)}
                    className={`tf-county-item p-3 rounded-lg border cursor-pointer transition-all duration-300
                      ${selectedCounty === county.county_id
                        ? 'border-[#00ffee] bg-[#00ffee]/10'
                        : 'border-gray-600 hover:border-[#00ffee]/50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{county.county_name}</div>
                        <div className="text-xs text-gray-400">
                          Active Operations: {county.sync_operations_active}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            county.data_sovereignty_status === 'COMPLIANT' ? 'success' :
                            county.data_sovereignty_status === 'WARNING' ? 'warning' : 'destructive'
                          }
                          className="text-xs">
                          {county.data_sovereignty_status}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#00ffaa]">
                            {county.system_health_score}%
                          </div>
                        </div>
                      </div>
                    </div>
                    {county.pending_approvals > 0 && (
                      <div className="mt-2 text-xs text-[#ff6b35]">
                        ⚠️ {county.pending_approvals} pending approvals
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Queue Status & Government Alerts */}
      <div className="tf-operations-section grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Sync Queue Management */}
        <Card className="tf-queue-status tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20
          rounded-2xl shadow-xl">
          <CardHeader>
            <h3 className="text-xl font-bold text-[#00ffee]">PRIORITY QUEUE STATUS</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Object.entries(syncMetrics?.queue_depth_by_priority || {}).map(([priority, depth]) => (
                <div key={priority} className="tf-queue-item">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${
                      priority === 'CRITICAL' ? 'text-[#ff6b35]' :
                      priority === 'HIGH' ? 'text-[#ff9500]' :
                      priority === 'MEDIUM' ? 'text-[#00ffee]' : 'text-gray-400'
                    }`}>
                      {priority}
                    </span>
                    <span className="text-white font-bold">{depth}</span>
                  </div>
                  <Progress
                    value={Math.min((depth / 100) * 100, 100)}
                    className="tf-priority-progress"
                    color={
                      priority === 'CRITICAL' ? 'destructive' :
                      priority === 'HIGH' ? 'warning' :
                      priority === 'MEDIUM' ? 'primary' : 'secondary'
                    }
                  />
                </div>
              ))}

              <div className="tf-queue-summary mt-6 p-3 bg-black/20 rounded-lg">
                <div className="text-sm text-gray-300">Total Queue Depth</div>
                <div className="text-2xl font-bold text-[#00ffee]">
                  {syncMetrics?.queue_depth_total || 0}
                </div>
                <div className="text-xs text-[#00ffaa] mt-1">
                  Processing Rate: {syncMetrics?.operations_per_second || 0} ops/sec
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Government Compliance Alerts */}
        <Card className="tf-compliance-alerts tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20
          rounded-2xl shadow-xl">
          <CardHeader>
            <h3 className="text-xl font-bold text-[#00ffee]">GOVERNMENT COMPLIANCE ALERTS</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {complianceStatus?.compliance_alerts?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-[#00ffaa] mx-auto mb-3" />
                  <div className="text-[#00ffaa] font-semibold">ALL SYSTEMS COMPLIANT</div>
                  <div className="text-sm text-gray-400">No compliance alerts detected</div>
                </div>
              ) : (
                complianceStatus?.compliance_alerts?.map((alert) => (
                  <div key={alert.id} className={`tf-alert-item p-3 rounded-lg border-l-4 ${
                    alert.severity === 'CRITICAL' ? 'border-[#ff6b35] bg-[#ff6b35]/10' :
                    alert.severity === 'HIGH' ? 'border-[#ff9500] bg-[#ff9500]/10' :
                    alert.severity === 'MEDIUM' ? 'border-[#00ffee] bg-[#00ffee]/10' :
                    'border-gray-500 bg-gray-500/10'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className={`w-4 h-4 ${
                            alert.severity === 'CRITICAL' ? 'text-[#ff6b35]' :
                            alert.severity === 'HIGH' ? 'text-[#ff9500]' :
                            'text-[#00ffee]'
                          }`} />
                          <Badge
                            variant={
                              alert.severity === 'CRITICAL' ? 'destructive' :
                              alert.severity === 'HIGH' ? 'warning' : 'secondary'
                            }
                            className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="text-sm text-white">{alert.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          County: {alert.county_id} • {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {alert.resolved && (
                        <CheckCircle className="w-5 h-5 text-[#00ffaa] ml-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

// ========================================================================================
// API FUNCTIONS (Mock Implementation - Replace with actual API calls)
// ========================================================================================

async function fetchSyncPerformanceMetrics(timeRange: string): Promise<SyncPerformanceMetrics> {
  // Mock data - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    operations_per_second: 1247,
    average_processing_time_ms: 125,
    queue_depth_total: 89,
    queue_depth_by_priority: {
      CRITICAL: 12,
      HIGH: 23,
      MEDIUM: 34,
      LOW: 20
    },
    success_rate: 0.997,
    conflicts_detected_last_hour: 15,
    conflicts_resolved_last_hour: 14,
    manual_reviews_pending: 3,
    county_distribution: {
      'BENTON': 25,
      'FRANKLIN': 18,
      'WALLA_WALLA': 22,
      'YAKIMA': 24
    },
    performance_trend: [
      { timestamp: '2025-10-21T10:00:00Z', ops_per_second: 1200, success_rate: 0.995 },
      { timestamp: '2025-10-21T11:00:00Z', ops_per_second: 1247, success_rate: 0.997 },
    ]
  };
}

async function fetchGovernmentComplianceStatus(): Promise<GovernmentComplianceStatus> {
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    fisma_compliance_score: 98.5,
    county_sovereignty_violations: 0,
    audit_trail_coverage: 100,
    data_integrity_score: 99.9,
    security_incidents_last_24h: 0,
    compliance_alerts: [],
    government_approvals_pending: 7,
    escalation_queue_depth: 2
  };
}

async function fetchSystemHealthStatus(): Promise<SystemHealthStatus> {
  await new Promise(resolve => setTimeout(resolve, 200));

  return {
    terra_agent_connectivity: true,
    terra_agent_response_time_ms: 45,
    terrafusion_api_health: true,
    terrafusion_response_time_ms: 32,
    database_health: true,
    database_connection_pool: 87,
    conflict_engine_status: true,
    sync_orchestrator_status: true,
    overall_system_health: 97.8,
    autonomous_recovery_active: true,
    last_health_check: '2025-10-21T12:00:00Z',
    uptime_percentage: 99.97
  };
}

async function fetchCountyOperationalStatuses(selectedCounty?: string | null): Promise<CountyOperationalStatus[]> {
  await new Promise(resolve => setTimeout(resolve, 400));

  const counties = [
    {
      county_id: 'BENTON',
      county_name: 'Benton County',
      sync_operations_active: 25,
      data_sovereignty_status: 'COMPLIANT' as const,
      last_sync_timestamp: '2025-10-21T11:58:00Z',
      pending_approvals: 2,
      escalated_conflicts: 0,
      system_health_score: 98,
      citizen_services_available: true
    },
    {
      county_id: 'FRANKLIN',
      county_name: 'Franklin County',
      sync_operations_active: 18,
      data_sovereignty_status: 'COMPLIANT' as const,
      last_sync_timestamp: '2025-10-21T11:59:00Z',
      pending_approvals: 1,
      escalated_conflicts: 1,
      system_health_score: 95,
      citizen_services_available: true
    },
    {
      county_id: 'WALLA_WALLA',
      county_name: 'Walla Walla County',
      sync_operations_active: 22,
      data_sovereignty_status: 'WARNING' as const,
      last_sync_timestamp: '2025-10-21T11:55:00Z',
      pending_approvals: 3,
      escalated_conflicts: 0,
      system_health_score: 92,
      citizen_services_available: true
    },
    {
      county_id: 'YAKIMA',
      county_name: 'Yakima County',
      sync_operations_active: 24,
      data_sovereignty_status: 'COMPLIANT' as const,
      last_sync_timestamp: '2025-10-21T12:00:00Z',
      pending_approvals: 1,
      escalated_conflicts: 1,
      system_health_score: 97,
      citizen_services_available: true
    }
  ];

  return selectedCounty ? counties.filter(c => c.county_id === selectedCounty) : counties;
}

export default GovernmentMonitoringDashboard;
