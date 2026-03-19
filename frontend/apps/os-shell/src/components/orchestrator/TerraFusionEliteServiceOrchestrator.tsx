/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION ELITE SERVICE ORCHESTRATOR
 * Automated Service Management & Health Recovery
 * Proactive Service Restart & Monitoring Protocols
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useEffect, useState } from 'react';
import { getViteEnv } from '@/shared/viteEnv';

interface ServiceStatus {
  name: string;
  port: number;
  status: 'online' | 'offline' | 'restarting' | 'error';
  lastCheck: string;
  uptime: string;
  responseTime: number;
}

interface RestartProtocol {
  serviceName: string;
  timestamp: string;
  status: 'initiated' | 'in-progress' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

export const TerraFusionEliteServiceOrchestrator: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Elite Experiments API',
      port: 5000,
      status: 'offline',
      lastCheck: new Date().toISOString(),
      uptime: '00:00:00',
      responseTime: 0,
    },
    {
      name: 'Consciousness Engine',
      port: 3004,
      status: 'offline',
      lastCheck: new Date().toISOString(),
      uptime: '00:00:00',
      responseTime: 0,
    },
    {
      name: 'Frontend PWA',
      port: 5175,
      status: 'online',
      lastCheck: new Date().toISOString(),
      uptime: '02:45:23',
      responseTime: 12,
    },
  ]);

  const [restartHistory, setRestartHistory] = useState<RestartProtocol[]>([]);
  const [isAutoRestart, setIsAutoRestart] = useState(true);
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [lastMonitoringCheck, setLastMonitoringCheck] = useState<string>('');

  useEffect(() => {
    if (!monitoringActive) return;

    const interval = setInterval(performHealthChecks, 5000);
    return () => clearInterval(interval);
  }, [monitoringActive]);

  const performHealthChecks = async () => {
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        try {
          const healthUrl = getHealthCheckUrl(service.name, service.port);
          const startTime = Date.now();

          const response = await fetch(healthUrl, {
            method: 'GET',
            cache: 'no-cache',
            signal: AbortSignal.timeout(3000),
          });

          const responseTime = Date.now() - startTime;

          if (response.ok) {
            return {
              ...service,
              status: 'online' as const,
              lastCheck: new Date().toISOString(),
              responseTime,
            };
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          // Service is offline
          const offlineService = {
            ...service,
            status: 'offline' as const,
            lastCheck: new Date().toISOString(),
            responseTime: 999,
          };

          // Auto-restart if enabled
          if (isAutoRestart && service.status !== 'restarting' && service.name !== 'Frontend PWA') {
            initiateServiceRestart(service.name);
          }

          return offlineService;
        }
      })
    );

    setServices(updatedServices);
    setLastMonitoringCheck(new Date().toLocaleTimeString());
  };

  const getHealthCheckUrl = (serviceName: string, _port: number): string => {
    switch (serviceName) {
      case 'Elite Experiments API':
        return `${getViteEnv().VITE_API_URL || '/api'}/health`;
      case 'Consciousness Engine':
        return `${getViteEnv().VITE_CONSCIOUSNESS_URL || ''}/`;
      case 'Frontend PWA':
        return '/';
      default:
        return `${getViteEnv().VITE_API_URL || '/api'}/health`;
    }
  };

  const initiateServiceRestart = async (serviceName: string) => {
    // Update service status to restarting
    setServices((prev) =>
      prev.map((service) =>
        service.name === serviceName ? { ...service, status: 'restarting' } : service
      )
    );

    // Add restart protocol entry
    const restartProtocol: RestartProtocol = {
      serviceName,
      timestamp: new Date().toISOString(),
      status: 'initiated',
    };

    setRestartHistory((prev) => [restartProtocol, ...prev.slice(0, 9)]);

    try {
      // Simulate restart process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update restart protocol
      const completedProtocol: RestartProtocol = {
        ...restartProtocol,
        status: 'completed',
        duration: 3,
      };

      setRestartHistory((prev) =>
        prev.map((protocol) =>
          protocol.timestamp === restartProtocol.timestamp ? completedProtocol : protocol
        )
      );

      // In a real implementation, this would trigger actual service restart
    } catch (error) {
      // Handle restart failure
      const failedProtocol: RestartProtocol = {
        ...restartProtocol,
        status: 'failed',
        error: error.message,
      };

      setRestartHistory((prev) =>
        prev.map((protocol) =>
          protocol.timestamp === restartProtocol.timestamp ? failedProtocol : protocol
        )
      );

      // Update service status to error
      setServices((prev) =>
        prev.map((service) =>
          service.name === serviceName ? { ...service, status: 'error' } : service
        )
      );
    }
  };

  const manualServiceRestart = async (serviceName: string) => {
    await initiateServiceRestart(serviceName);
  };

  const restartAllServices = async () => {
    const offlineServices = services.filter(
      (service) => service.status === 'offline' || service.status === 'error'
    );

    for (const service of offlineServices) {
      if (service.name !== 'Frontend PWA') {
        await initiateServiceRestart(service.name);
        // Wait between restarts to avoid overwhelming system
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-400';
      case 'offline':
        return 'text-red-400';
      case 'restarting':
        return 'text-yellow-400';
      case 'error':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online':
        return 'default';
      case 'offline':
        return 'destructive';
      case 'restarting':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getProtocolStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 border-green-400/30';
      case 'failed':
        return 'text-red-400 border-red-400/30';
      case 'in-progress':
        return 'text-yellow-400 border-yellow-400/30';
      case 'initiated':
        return 'text-terra-cyan border-terra-cyan/30';
      default:
        return 'text-gray-400 border-gray-400/30';
    }
  };

  const overallHealthScore = Math.round(
    (services.filter((s) => s.status === 'online').length / services.length) * 100
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-terra-cyan glow-text mb-2'>
          🤖 TerraFusion Elite Service Orchestrator
        </h1>
        <p className='text-terra-blue text-xl mb-4'>
          Automated Service Management & Health Recovery
        </p>
        <div className='flex justify-center items-center gap-6'>
          <div className='flex items-center gap-2'>
            <span className='text-terra-cyan'>Overall Health:</span>
            <Badge
              variant={overallHealthScore >= 75 ? 'default' : 'destructive'}
              className='text-lg px-3 py-1'
            >
              {overallHealthScore}%
            </Badge>
          </div>
          <div className='text-terra-blue'>Last Check: {lastMonitoringCheck}</div>
          <Button
            onClick={() => setIsAutoRestart(!isAutoRestart)}
            variant={isAutoRestart ? 'default' : 'outline'}
            size='sm'
          >
            {isAutoRestart ? '🔄 Auto-Restart: ON' : '⏸️ Auto-Restart: OFF'}
          </Button>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        {services.map((service, index) => (
          <Card key={index} className='terra-glass border-terra-cyan/30'>
            <CardHeader className='text-center pb-2'>
              <h3 className='text-lg font-semibold text-terra-cyan flex items-center justify-between'>
                {service.name}
                <Badge variant={getStatusBadgeVariant(service.status)} className='text-sm'>
                  {service.status.toUpperCase()}
                </Badge>
              </h3>
            </CardHeader>
            <CardBody className='space-y-3'>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span>Port:</span>
                  <span className='text-terra-cyan font-mono'>{service.port}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Response Time:</span>
                  <span
                    className={service.responseTime < 100 ? 'text-green-400' : 'text-yellow-400'}
                  >
                    {service.responseTime}ms
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Uptime:</span>
                  <span className='text-white'>{service.uptime}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Last Check:</span>
                  <span className='text-terra-blue text-xs'>
                    {new Date(service.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {service.status === 'offline' || service.status === 'error' ? (
                <Button
                  onClick={() => manualServiceRestart(service.name)}
                  disabled={service.status === 'restarting' || service.name === 'Frontend PWA'}
                  className='w-full bg-terra-cyan/20 hover:bg-terra-cyan/30 border border-terra-cyan/30'
                  size='sm'
                >
                  {service.status === 'restarting' ? '⏳ Restarting...' : '🔄 Restart Service'}
                </Button>
              ) : (
                <div className='text-center'>
                  <Badge variant='default' className='text-green-400'>
                    ✅ Service Healthy
                  </Badge>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Control Panel */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        <Card className='terra-glass border-terra-blue/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-blue'>⚡ Service Management</h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-terra-cyan'>Monitoring Status:</span>
              <Badge variant={monitoringActive ? 'default' : 'destructive'}>
                {monitoringActive ? 'ACTIVE' : 'PAUSED'}
              </Badge>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-terra-cyan'>Auto-Restart:</span>
              <Badge variant={isAutoRestart ? 'default' : 'outline'}>
                {isAutoRestart ? 'ENABLED' : 'DISABLED'}
              </Badge>
            </div>

            <div>
              <span className='text-terra-cyan'>System Health Score:</span>
              <Progress value={overallHealthScore} className='mt-2 progress-terra-cyan' />
              <div className='text-right text-sm text-terra-blue mt-1'>
                {overallHealthScore}% ({services.filter((s) => s.status === 'online').length}/
                {services.length} services)
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <Button
                onClick={() => setMonitoringActive(!monitoringActive)}
                variant={monitoringActive ? 'destructive' : 'default'}
                size='sm'
              >
                {monitoringActive ? '⏸️ Pause' : '▶️ Resume'}
              </Button>
              <Button onClick={restartAllServices} variant='outline' size='sm'>
                🔄 Restart All
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className='terra-glass border-terra-green/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-green'>📊 Service Statistics</h3>
          </CardHeader>
          <CardBody className='space-y-3'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-terra-cyan'>Total Services:</span>
                <div className='text-white text-lg font-semibold'>{services.length}</div>
              </div>
              <div>
                <span className='text-terra-cyan'>Online Services:</span>
                <div className='text-green-400 text-lg font-semibold'>
                  {services.filter((s) => s.status === 'online').length}
                </div>
              </div>
              <div>
                <span className='text-terra-cyan'>Offline Services:</span>
                <div className='text-red-400 text-lg font-semibold'>
                  {services.filter((s) => s.status === 'offline' || s.status === 'error').length}
                </div>
              </div>
              <div>
                <span className='text-terra-cyan'>Restart Events:</span>
                <div className='text-terra-blue text-lg font-semibold'>{restartHistory.length}</div>
              </div>
            </div>

            <div>
              <span className='text-terra-cyan'>Average Response Time:</span>
              <div className='text-white text-lg font-semibold'>
                {Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / services.length)}
                ms
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Restart Protocol History */}
      <Card className='terra-glass border-terra-cyan/20 mb-8'>
        <CardHeader>
          <h3 className='text-xl font-semibold text-terra-cyan'>🔄 Restart Protocol History</h3>
        </CardHeader>
        <CardBody>
          <div className='space-y-2 max-h-64 overflow-y-auto'>
            {restartHistory.length > 0 ? (
              restartHistory.map((protocol, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getProtocolStatusColor(protocol.status)} bg-terra-midnight/30`}
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <Badge variant='outline' className='text-xs text-terra-cyan'>
                          {protocol.serviceName}
                        </Badge>
                        <Badge
                          variant='outline'
                          className={`text-xs ${getProtocolStatusColor(protocol.status).split(' ')[0]}`}
                        >
                          {protocol.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className='text-sm text-white'>
                        Restart protocol {protocol.status}
                        {protocol.duration && ` (${protocol.duration}s)`}
                      </div>
                      {protocol.error && (
                        <div className='text-xs text-red-400 mt-1'>Error: {protocol.error}</div>
                      )}
                    </div>
                    <div className='text-xs text-terra-cyan ml-4'>
                      {new Date(protocol.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center text-terra-blue py-8'>
                No restart protocols executed - All services operational
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Footer */}
      <div className='text-center'>
        <div className='text-terra-cyan font-semibold text-xl mb-2'>
          🏛️ Government. Transcended.
        </div>
        <div className='text-terra-blue text-lg'>
          TerraFusion Elite Service Orchestrator - Automated Excellence
        </div>
        <div className='text-terra-blue text-sm mt-2'>
          Health Score: {overallHealthScore}% | Auto-Restart:{' '}
          {isAutoRestart ? 'Enabled' : 'Disabled'} | Monitoring:{' '}
          {monitoringActive ? 'Active' : 'Paused'}
        </div>
      </div>
    </div>
  );
};

export default TerraFusionEliteServiceOrchestrator;
