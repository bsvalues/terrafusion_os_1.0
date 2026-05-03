/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE SYSTEM HEALTH MONITOR - THE TERRAFUSION WAY
 * Advanced Health Monitoring with Quantum Excellence
 * Evidence-gated health surface
 * ═══════════════════════════════════════════════════════════════
 */

import { Card, CardHeader } from '@/components/terrafusion-design-system';
import React, { useState } from 'react';
import {
  EliteActivityIcon,
  EliteBrainIcon,
  EliteCpuIcon,
  EliteGaugeIcon,
  EliteShieldIcon,
  EliteZapIcon,
} from '../icons/EliteIcons';

interface SystemHealth {
  backend: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    connected: boolean;
    responseTime: number;
    lastCheck: string;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  database: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    connected: boolean;
    queryCount: number;
    slowQueries: number;
    connectionPool: number;
    diskUsage: number;
  };
  users: {
    activeUsers: number;
    peakUsers: number;
    sessionsToday: number;
    avgSessionDuration: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
  };
  realTime: {
    timestamp: string;
    systemLoad: number;
    networkLatency: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

const SystemHealthMonitor: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    backend: {
      status: 'unhealthy',
      connected: false,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    },
    database: {
      status: 'unhealthy',
      connected: false,
      queryCount: 0,
      slowQueries: 0,
      connectionPool: 0,
      diskUsage: 0,
    },
    users: {
      activeUsers: 0,
      peakUsers: 0,
      sessionsToday: 0,
      avgSessionDuration: 0,
    },
    performance: {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      availability: 0,
    },
    realTime: {
      timestamp: new Date().toISOString(),
      systemLoad: 0,
      networkLatency: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    },
  });

  const [isLive] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <EliteShieldIcon className='w-5 h-5 text-terra-cyan' />;
      case 'degraded':
        return <EliteActivityIcon className='w-5 h-5 text-yellow-500' />;
      case 'unhealthy':
        return <EliteActivityIcon className='w-5 h-5 text-red-500' />;
      default:
        return <EliteActivityIcon className='w-5 h-5 text-gray-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-terra-cyan';
      case 'degraded':
        return 'text-yellow-500';
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getHealthPercentage = () => {
    if (!systemHealth.backend.connected && !systemHealth.database.connected) {
      return 0;
    }

    const backendHealth =
      systemHealth.backend.status === 'healthy'
        ? 100
        : systemHealth.backend.status === 'degraded'
          ? 70
          : 30;
    const dbHealth =
      systemHealth.database.status === 'healthy'
        ? 100
        : systemHealth.database.status === 'degraded'
          ? 70
          : 30;
    const performanceHealth = systemHealth.performance.availability;

    return Math.round((backendHealth + dbHealth + performanceHealth) / 3);
  };

  return (
    <div className='elite-health-monitor space-y-6'>
      {/* Elite Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='p-3 rounded-lg bg-terra-cyan/10 border border-terra-cyan/20'>
            <EliteActivityIcon className='w-8 h-8 text-terra-cyan' />
          </div>
          <div>
            <h2 className='text-2xl font-bold text-white'>Elite System Health Monitor</h2>
            <p className='text-gray-400'>Evidence-gated monitoring. Connect telemetry before trusting health metrics.</p>
          </div>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='text-center'>
            <div
              className={`text-3xl font-bold ${
                getHealthPercentage() >= 90
                  ? 'text-terra-cyan'
                  : getHealthPercentage() >= 70
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {getHealthPercentage()}%
            </div>
            <div className='text-xs text-gray-400'>System Health</div>
          </div>
          <div
            className={`w-4 h-4 rounded-full ${isLive ? 'bg-terra-cyan animate-pulse' : 'bg-gray-400'}`}
          />
          <span className='text-xs text-gray-400'>{isLive ? 'LIVE' : 'UNAVAILABLE'}</span>
        </div>
      </div>

      {/* System Overview Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Backend Status */}
        <Card className='terra-glass border-terra-cyan/20 backdrop-blur-md'>
          <CardHeader className='flex flex-row items-center space-x-3'>
            <EliteShieldIcon className='w-6 h-6 text-terra-cyan' />
            <div>
              <h3 className='text-lg font-semibold text-white'>Backend API</h3>
              <div className='flex items-center space-x-2'>
                {getStatusIcon(systemHealth.backend.status)}
                <span
                  className={`text-sm font-medium ${getStatusColor(systemHealth.backend.status)}`}
                >
                  {systemHealth.backend.status.toUpperCase()}
                </span>
              </div>
            </div>
          </CardHeader>
          <div className='p-6 pt-0'>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Response Time:</span>
                <span className='text-white font-medium'>
                  {systemHealth.backend.responseTime}ms
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>CPU Usage:</span>
                <span className='text-white font-medium'>{systemHealth.backend.cpuUsage}%</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Memory:</span>
                <span className='text-white font-medium'>{systemHealth.backend.memoryUsage}%</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Uptime:</span>
                <span className='text-terra-cyan font-medium'>{systemHealth.backend.uptime}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Database Status */}
        <Card className='terra-glass border-terra-cyan/20 backdrop-blur-md'>
          <CardHeader className='flex flex-row items-center space-x-3'>
            <EliteCpuIcon className='w-6 h-6 text-terra-cyan' />
            <div>
              <h3 className='text-lg font-semibold text-white'>Database</h3>
              <div className='flex items-center space-x-2'>
                {getStatusIcon(systemHealth.database.status)}
                <span
                  className={`text-sm font-medium ${getStatusColor(systemHealth.database.status)}`}
                >
                  {systemHealth.database.status.toUpperCase()}
                </span>
              </div>
            </div>
          </CardHeader>
          <div className='p-6 pt-0'>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Queries Today:</span>
                <span className='text-white font-medium'>
                  {systemHealth.database.queryCount.toLocaleString()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Slow Queries:</span>
                <span
                  className={
                    systemHealth.database.slowQueries > 10 ? 'text-yellow-500' : 'text-terra-cyan'
                  }
                >
                  {systemHealth.database.slowQueries}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Connections:</span>
                <span className='text-white font-medium'>
                  {systemHealth.database.connectionPool}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Disk Usage:</span>
                <span className='text-white font-medium'>{systemHealth.database.diskUsage}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* User Activity */}
        <Card className='terra-glass border-terra-cyan/20 backdrop-blur-md'>
          <CardHeader className='flex flex-row items-center space-x-3'>
            <EliteBrainIcon className='w-6 h-6 text-terra-cyan' />
            <div>
              <h3 className='text-lg font-semibold text-white'>User Activity</h3>
              <div className='flex items-center space-x-2'>
                <EliteShieldIcon className='w-4 h-4 text-terra-cyan' />
                <span className='text-sm font-medium text-gray-400'>UNVERIFIED</span>
              </div>
            </div>
          </CardHeader>
          <div className='p-6 pt-0'>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Active Users:</span>
                <span className='text-white font-medium'>{systemHealth.users.activeUsers}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Peak Today:</span>
                <span className='text-terra-cyan font-medium'>{systemHealth.users.peakUsers}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Sessions:</span>
                <span className='text-white font-medium'>{systemHealth.users.sessionsToday}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Avg Duration:</span>
                <span className='text-white font-medium'>
                  {systemHealth.users.avgSessionDuration}m
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card className='terra-glass border-terra-cyan/20 backdrop-blur-md'>
          <CardHeader className='flex flex-row items-center space-x-3'>
            <EliteZapIcon className='w-6 h-6 text-terra-cyan' />
            <div>
              <h3 className='text-lg font-semibold text-white'>Performance</h3>
              <div className='flex items-center space-x-2'>
                <EliteActivityIcon className='w-4 h-4 text-green-400' />
                <span className='text-sm font-medium text-gray-400'>UNVERIFIED</span>
              </div>
            </div>
          </CardHeader>
          <div className='p-6 pt-0'>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Response Time:</span>
                <span className='text-white font-medium'>
                  {systemHealth.performance.responseTime}ms
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Throughput:</span>
                <span className='text-terra-cyan font-medium'>
                  {systemHealth.performance.throughput}/min
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Error Rate:</span>
                <span
                  className={
                    systemHealth.performance.errorRate > 1 ? 'text-red-500' : 'text-terra-cyan'
                  }
                >
                  {systemHealth.performance.errorRate}%
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Availability:</span>
                <span className='text-terra-cyan font-medium'>
                  {systemHealth.performance.availability}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Real-time Metrics */}
        <Card className='terra-glass border-terra-cyan/20 backdrop-blur-md'>
          <CardHeader className='flex flex-row items-center space-x-3'>
            <EliteGaugeIcon className='w-6 h-6 text-terra-cyan' />
            <div>
              <h3 className='text-lg font-semibold text-white'>Real-time</h3>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 rounded-full bg-terra-cyan animate-pulse' />
                <span className='text-sm font-medium text-gray-400'>UNAVAILABLE</span>
              </div>
            </div>
          </CardHeader>
          <div className='p-6 pt-0'>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>System Load:</span>
                <span className='text-white font-medium'>
                  {systemHealth.realTime.systemLoad.toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Network:</span>
                <span className='text-white font-medium'>
                  {systemHealth.realTime.networkLatency}ms
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Memory:</span>
                <span className='text-white font-medium'>
                  {systemHealth.realTime.memoryUsage}GB
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>CPU:</span>
                <span className='text-white font-medium'>{systemHealth.realTime.cpuUsage}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* System Summary */}
        <Card className='terra-glass border-terra-cyan/20 backdrop-blur-md md:col-span-2 lg:col-span-1'>
          <CardHeader className='flex flex-row items-center space-x-3'>
            <EliteActivityIcon className='w-6 h-6 text-terra-cyan' />
            <div>
              <h3 className='text-lg font-semibold text-white'>Elite Status</h3>
              <div className='flex items-center space-x-2'>
                <EliteShieldIcon className='w-4 h-4 text-green-400' />
                <span className='text-sm font-medium text-yellow-400'>EVIDENCE REQUIRED</span>
              </div>
            </div>
          </CardHeader>
          <div className='p-6 pt-0'>
            <div className='space-y-3'>
              <div className='text-center p-4 rounded-lg bg-gradient-to-r from-terra-cyan/10 to-green-500/10 border border-terra-cyan/20'>
                <div className='text-2xl font-bold text-yellow-400 mb-1'>UNVERIFIED</div>
                <div className='text-xs text-gray-400'>Telemetry required</div>
              </div>
              <div className='text-xs text-gray-400 text-center'>
                No local health claim
                <br />
                Governed telemetry not connected
                <br />
                Last Updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;
