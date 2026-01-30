import { TerraSphere } from '@/components/brand/TerraSphere';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Progress,
} from '@/components/terrafusion-design-system';
import React, { useEffect, useMemo, useState } from 'react';

// =============================
// Type Definitions
// =============================

interface ServiceHealthStatus {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number; // Percentage 0-100
  lastCheck: Date;
  responseTime: number; // Milliseconds
  errorRate: number; // Percentage 0-100
  requestsPerSecond: number;
}

interface PerformanceMetrics {
  p50: number; // 50th percentile response time (ms)
  p95: number; // 95th percentile response time (ms)
  p99: number; // 99th percentile response time (ms)
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  timestamp: Date;
}

interface ErrorRateMetrics {
  clientErrors: number; // 4xx errors
  serverErrors: number; // 5xx errors
  networkErrors: number;
  timeoutErrors: number;
  totalErrors: number;
  totalRequests: number;
  errorPercentage: number;
}

interface UptimeMetrics {
  currentUptime: number; // Percentage 0-100
  uptimeTarget: number; // Target uptime (99.9%)
  downtimeIncidents: DowntimeIncident[];
  mttr: number; // Mean Time To Recovery (minutes)
  mtbf: number; // Mean Time Between Failures (hours)
}

interface DowntimeIncident {
  serviceName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // Minutes
  severity: 'critical' | 'major' | 'minor';
  resolution: string;
}

interface ResourceMetrics {
  cpuUtilization: number; // Percentage 0-100
  memoryUsage: number; // Percentage 0-100
  diskSpace: number; // Percentage 0-100
  connectionPoolHealth: number; // Percentage 0-100
  databaseQueryPerformance: number; // Average query time (ms)
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  currentValue: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

interface SystemHealthData {
  services: ServiceHealthStatus[];
  performanceMetrics: PerformanceMetrics;
  errorRates: ErrorRateMetrics;
  uptimeMetrics: UptimeMetrics;
  resourceMetrics: ResourceMetrics;
  activeAlerts: AlertThreshold[];
}

// =============================
// Service Names Configuration
// =============================

const MONITORED_SERVICES = [
  'researchSession',
  'quantumVisualization',
  'consciousnessParameter',
  'statisticalAnalysis',
  'aiSwarm',
  'iaaCompliance',
  'export',
] as const;

// =============================
// Health Check Service
// =============================

class HealthCheckService {
  private static instance: HealthCheckService;
  private healthData: SystemHealthData | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  public async startPolling(intervalMs: number = 5000): Promise<void> {
    // Initial fetch
    await this.fetchHealthData();

    // Setup polling
    this.pollingInterval = setInterval(async () => {
      await this.fetchHealthData();
    }, intervalMs);
  }

  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async fetchHealthData(): Promise<void> {
    try {
      // In production, this would call actual health check endpoints
      // For now, simulating realistic health data
      this.healthData = this.generateMockHealthData();
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    }
  }

  public getHealthData(): SystemHealthData | null {
    return this.healthData;
  }

  private generateMockHealthData(): SystemHealthData {
    const services: ServiceHealthStatus[] = MONITORED_SERVICES.map((serviceName) => {
      const isHealthy = Math.random() > 0.05; // 95% chance of being healthy
      const isDegraded = !isHealthy && Math.random() > 0.5;

      return {
        serviceName,
        status: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'down',
        uptime: isHealthy ? 99.95 : isDegraded ? 99.5 : 95.2,
        lastCheck: new Date(),
        responseTime: isHealthy ? Math.random() * 20 + 5 : Math.random() * 100 + 50,
        errorRate: isHealthy
          ? Math.random() * 0.1
          : isDegraded
            ? Math.random() * 2
            : Math.random() * 10,
        requestsPerSecond: Math.random() * 100 + 50,
      };
    });

    const performanceMetrics: PerformanceMetrics = {
      p50: Math.random() * 10 + 5,
      p95: Math.random() * 30 + 20,
      p99: Math.random() * 60 + 40,
      avgResponseTime: Math.random() * 20 + 10,
      maxResponseTime: Math.random() * 100 + 50,
      minResponseTime: Math.random() * 5 + 2,
      timestamp: new Date(),
    };

    const errorRates: ErrorRateMetrics = {
      clientErrors: Math.floor(Math.random() * 10),
      serverErrors: Math.floor(Math.random() * 5),
      networkErrors: Math.floor(Math.random() * 3),
      timeoutErrors: Math.floor(Math.random() * 2),
      totalErrors: 0,
      totalRequests: 10000,
      errorPercentage: 0,
    };
    errorRates.totalErrors =
      errorRates.clientErrors +
      errorRates.serverErrors +
      errorRates.networkErrors +
      errorRates.timeoutErrors;
    errorRates.errorPercentage = (errorRates.totalErrors / errorRates.totalRequests) * 100;

    const downtimeIncidents: DowntimeIncident[] = [
      {
        serviceName: 'quantumVisualization',
        startTime: new Date(Date.now() - 86400000), // 1 day ago
        endTime: new Date(Date.now() - 86400000 + 300000), // 5 minutes duration
        duration: 5,
        severity: 'minor',
        resolution: 'Auto-recovered after database connection pool refresh',
      },
    ];

    const uptimeMetrics: UptimeMetrics = {
      currentUptime: 99.92,
      uptimeTarget: 99.9,
      downtimeIncidents,
      mttr: 4.5, // 4.5 minutes average recovery time
      mtbf: 720, // 720 hours (30 days) between failures
    };

    const resourceMetrics: ResourceMetrics = {
      cpuUtilization: Math.random() * 30 + 20, // 20-50%
      memoryUsage: Math.random() * 20 + 40, // 40-60%
      diskSpace: Math.random() * 10 + 30, // 30-40%
      connectionPoolHealth: Math.random() * 10 + 90, // 90-100%
      databaseQueryPerformance: Math.random() * 5 + 2, // 2-7ms
    };

    const activeAlerts: AlertThreshold[] = [];

    // Generate alerts based on thresholds
    if (resourceMetrics.cpuUtilization > 80) {
      activeAlerts.push({
        metric: 'CPU Utilization',
        threshold: 80,
        currentValue: resourceMetrics.cpuUtilization,
        severity: 'warning',
        message: 'CPU utilization exceeds 80%',
      });
    }

    if (errorRates.errorPercentage > 1) {
      activeAlerts.push({
        metric: 'Error Rate',
        threshold: 1,
        currentValue: errorRates.errorPercentage,
        severity: 'critical',
        message: 'Error rate exceeds 1%',
      });
    }

    return {
      services,
      performanceMetrics,
      errorRates,
      uptimeMetrics,
      resourceMetrics,
      activeAlerts,
    };
  }
}

// =============================
// Main Component
// =============================

export const SystemHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const healthCheckService = useMemo(() => HealthCheckService.getInstance(), []);

  useEffect(() => {
    const initializeHealthMonitoring = async () => {
      setIsLoading(true);
      await healthCheckService.startPolling(5000); // Poll every 5 seconds

      // Setup state update interval
      const updateInterval = setInterval(() => {
        const data = healthCheckService.getHealthData();
        if (data) {
          setHealthData(data);
          setIsLoading(false);
        }
      }, 1000); // Update UI every second

      return () => {
        clearInterval(updateInterval);
        healthCheckService.stopPolling();
      };
    };

    initializeHealthMonitoring();
  }, [healthCheckService]);

  // Helper Functions
  const getStatusBadgeVariant = (status: string): 'primary' | 'quantum' | 'glass' => {
    switch (status) {
      case 'healthy':
        return 'primary';
      case 'degraded':
        return 'quantum';
      case 'down':
        return 'glass';
      default:
        return 'glass';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-terra-cyan';
      case 'degraded':
        return 'text-yellow-400';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-terra-slate';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-terra-slate';
    }
  };

  const formatUptime = (uptime: number): string => {
    return `${uptime.toFixed(3)}%`;
  };

  const formatResponseTime = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const getProgressColor = (value: number, isInverted: boolean = false): string => {
    // For inverted metrics (like error rates), higher is worse
    if (isInverted) {
      if (value < 1) return 'terra-cyan'; // < 1% error rate is good
      if (value < 5) return 'yellow'; // 1-5% is warning
      return 'red'; // > 5% is critical
    } else {
      // For normal metrics (like uptime), higher is better
      if (value >= 99.9) return 'terra-cyan'; // >= 99.9% is excellent
      if (value >= 99) return 'yellow'; // 99-99.9% is warning
      return 'red'; // < 99% is critical
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-terra-midnight flex items-center justify-center'>
        <Card variant='glass' glow className='max-w-md'>
          <CardBody>
            <div className='flex flex-col items-center space-y-4'>
              <TerraSphere size='lg' variant='quantum' />
              <p className='text-terra-cyan text-lg'>Initializing System Health Monitoring...</p>
              <Progress value={50} variant='quantum' pulse />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className='min-h-screen bg-terra-midnight flex items-center justify-center'>
        <Card variant='glass' className='max-w-md'>
          <CardBody>
            <p className='text-red-500 text-lg'>Failed to load system health data</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-terra-midnight p-6'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center space-x-4 mb-4'>
          <TerraSphere size='md' variant='glow' />
          <h1 className='text-3xl font-bold text-terra-cyan'>System Health Dashboard</h1>
        </div>
        <p className='text-terra-slate text-lg'>
          Real-time operational monitoring for TerraFusion Quantum Research Portal
        </p>
      </div>

      {/* Active Alerts */}
      {healthData.activeAlerts.length > 0 && (
        <Card variant='glass' glow className='mb-6'>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-terra-cyan'>
              🚨 Active Alerts ({healthData.activeAlerts.length})
            </h2>
          </CardHeader>
          <CardBody>
            <div className='space-y-3'>
              {healthData.activeAlerts.map((alert, index) => (
                <div key={index} className='terra-glass p-4 rounded-lg border border-terra-cyan/20'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className={`text-lg font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.metric}
                      </p>
                      <p className='text-terra-slate text-sm mt-1'>{alert.message}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-terra-cyan text-xl font-bold'>
                        {formatPercentage(alert.currentValue)}
                      </p>
                      <p className='text-terra-slate text-xs'>
                        Threshold: {formatPercentage(alert.threshold)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Overall System Health */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
        {/* Overall Uptime */}
        <Card variant='glass' glow>
          <CardBody>
            <h3 className='text-lg font-semibold text-terra-cyan mb-2'>System Uptime</h3>
            <p className='text-4xl font-bold text-white mb-2'>
              {formatUptime(healthData.uptimeMetrics.currentUptime)}
            </p>
            <Progress
              value={healthData.uptimeMetrics.currentUptime}
              variant='quantum'
              className='mb-2'
            />
            <p className='text-terra-slate text-sm'>
              Target: {formatUptime(healthData.uptimeMetrics.uptimeTarget)}
            </p>
          </CardBody>
        </Card>

        {/* Average Response Time */}
        <Card variant='glass' glow>
          <CardBody>
            <h3 className='text-lg font-semibold text-terra-cyan mb-2'>Avg Response Time</h3>
            <p className='text-4xl font-bold text-white mb-2'>
              {formatResponseTime(healthData.performanceMetrics.avgResponseTime)}
            </p>
            <div className='space-y-1 text-sm'>
              <p className='text-terra-slate'>
                P50: {formatResponseTime(healthData.performanceMetrics.p50)}
              </p>
              <p className='text-terra-slate'>
                P95: {formatResponseTime(healthData.performanceMetrics.p95)}
              </p>
              <p className='text-terra-slate'>
                P99: {formatResponseTime(healthData.performanceMetrics.p99)}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Error Rate */}
        <Card variant='glass' glow>
          <CardBody>
            <h3 className='text-lg font-semibold text-terra-cyan mb-2'>Error Rate</h3>
            <p className='text-4xl font-bold text-white mb-2'>
              {formatPercentage(healthData.errorRates.errorPercentage)}
            </p>
            <Progress
              value={healthData.errorRates.errorPercentage}
              variant={healthData.errorRates.errorPercentage < 1 ? 'quantum' : 'glass'}
              className='mb-2'
            />
            <p className='text-terra-slate text-sm'>
              Total Errors: {healthData.errorRates.totalErrors}
            </p>
          </CardBody>
        </Card>

        {/* Resource Utilization */}
        <Card variant='glass' glow>
          <CardBody>
            <h3 className='text-lg font-semibold text-terra-cyan mb-2'>Resources</h3>
            <div className='space-y-2'>
              <div>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-terra-slate'>CPU</span>
                  <span className='text-white'>
                    {formatPercentage(healthData.resourceMetrics.cpuUtilization)}
                  </span>
                </div>
                <Progress value={healthData.resourceMetrics.cpuUtilization} variant='quantum' />
              </div>
              <div>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-terra-slate'>Memory</span>
                  <span className='text-white'>
                    {formatPercentage(healthData.resourceMetrics.memoryUsage)}
                  </span>
                </div>
                <Progress value={healthData.resourceMetrics.memoryUsage} variant='quantum' />
              </div>
              <div>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-terra-slate'>Disk</span>
                  <span className='text-white'>
                    {formatPercentage(healthData.resourceMetrics.diskSpace)}
                  </span>
                </div>
                <Progress value={healthData.resourceMetrics.diskSpace} variant='quantum' />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Service Health Status */}
      <Card variant='glass' glow className='mb-6'>
        <CardHeader>
          <h2 className='text-2xl font-semibold text-terra-cyan'>Service Health Status</h2>
        </CardHeader>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {healthData.services.map((service) => (
              <div
                key={service.serviceName}
                className='terra-glass p-4 rounded-lg border border-terra-cyan/20 hover:border-terra-cyan/50 transition-all cursor-pointer'
                onClick={() =>
                  setSelectedService(
                    service.serviceName === selectedService ? null : service.serviceName
                  )
                }
              >
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-lg font-semibold text-white'>{service.serviceName}</h3>
                  <Badge variant={getStatusBadgeVariant(service.status)}>
                    {service.status.toUpperCase()}
                  </Badge>
                </div>

                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-terra-slate'>Uptime:</span>
                    <span className={getStatusColor(service.status)}>
                      {formatUptime(service.uptime)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-terra-slate'>Response Time:</span>
                    <span className='text-terra-cyan'>
                      {formatResponseTime(service.responseTime)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-terra-slate'>Error Rate:</span>
                    <span className={service.errorRate < 1 ? 'text-terra-cyan' : 'text-yellow-400'}>
                      {formatPercentage(service.errorRate)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-terra-slate'>Requests/sec:</span>
                    <span className='text-white'>{service.requestsPerSecond.toFixed(0)}</span>
                  </div>
                </div>

                {selectedService === service.serviceName && (
                  <div className='mt-4 pt-4 border-t border-terra-cyan/20'>
                    <p className='text-xs text-terra-slate'>
                      Last checked: {service.lastCheck.toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Error Breakdown */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        <Card variant='glass' glow>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-terra-cyan'>Error Distribution</h2>
          </CardHeader>
          <CardBody>
            <div className='space-y-4'>
              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-terra-slate'>Client Errors (4xx)</span>
                  <span className='text-white font-semibold'>
                    {healthData.errorRates.clientErrors}
                  </span>
                </div>
                <Progress
                  value={
                    (healthData.errorRates.clientErrors / healthData.errorRates.totalErrors) * 100
                  }
                  variant='quantum'
                />
              </div>
              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-terra-slate'>Server Errors (5xx)</span>
                  <span className='text-white font-semibold'>
                    {healthData.errorRates.serverErrors}
                  </span>
                </div>
                <Progress
                  value={
                    (healthData.errorRates.serverErrors / healthData.errorRates.totalErrors) * 100
                  }
                  variant='glass'
                />
              </div>
              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-terra-slate'>Network Errors</span>
                  <span className='text-white font-semibold'>
                    {healthData.errorRates.networkErrors}
                  </span>
                </div>
                <Progress
                  value={
                    (healthData.errorRates.networkErrors / healthData.errorRates.totalErrors) * 100
                  }
                  variant='quantum'
                />
              </div>
              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-terra-slate'>Timeout Errors</span>
                  <span className='text-white font-semibold'>
                    {healthData.errorRates.timeoutErrors}
                  </span>
                </div>
                <Progress
                  value={
                    (healthData.errorRates.timeoutErrors / healthData.errorRates.totalErrors) * 100
                  }
                  variant='quantum'
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Reliability Metrics */}
        <Card variant='glass' glow>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-terra-cyan'>Reliability Metrics</h2>
          </CardHeader>
          <CardBody>
            <div className='space-y-4'>
              <div className='terra-glass p-4 rounded-lg'>
                <p className='text-terra-slate text-sm mb-1'>Mean Time To Recovery (MTTR)</p>
                <p className='text-3xl font-bold text-terra-cyan'>
                  {healthData.uptimeMetrics.mttr.toFixed(1)} min
                </p>
              </div>
              <div className='terra-glass p-4 rounded-lg'>
                <p className='text-terra-slate text-sm mb-1'>Mean Time Between Failures (MTBF)</p>
                <p className='text-3xl font-bold text-terra-cyan'>
                  {healthData.uptimeMetrics.mtbf.toFixed(0)} hours
                </p>
              </div>
              <div className='terra-glass p-4 rounded-lg'>
                <p className='text-terra-slate text-sm mb-1'>Downtime Incidents (Last 30 Days)</p>
                <p className='text-3xl font-bold text-terra-cyan'>
                  {healthData.uptimeMetrics.downtimeIncidents.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Downtime Incidents */}
      {healthData.uptimeMetrics.downtimeIncidents.length > 0 && (
        <Card variant='glass' glow>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-terra-cyan'>Recent Downtime Incidents</h2>
          </CardHeader>
          <CardBody>
            <div className='space-y-3'>
              {healthData.uptimeMetrics.downtimeIncidents.map((incident, index) => (
                <div key={index} className='terra-glass p-4 rounded-lg border border-terra-cyan/20'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3 mb-2'>
                        <h3 className='text-lg font-semibold text-white'>{incident.serviceName}</h3>
                        <Badge variant={incident.severity === 'critical' ? 'glass' : 'quantum'}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className='text-terra-slate text-sm mb-2'>{incident.resolution}</p>
                      <div className='flex items-center space-x-4 text-xs text-terra-slate'>
                        <span>Started: {incident.startTime.toLocaleString()}</span>
                        {incident.endTime && (
                          <span>Ended: {incident.endTime.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-2xl font-bold text-terra-cyan'>{incident.duration} min</p>
                      <p className='text-xs text-terra-slate'>Duration</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Footer */}
      <div className='mt-8 text-center'>
        <p className='text-terra-slate text-sm'>
          Data refreshes every 5 seconds • Last updated:{' '}
          {healthData.performanceMetrics.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;
