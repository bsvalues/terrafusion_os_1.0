/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE SYSTEM DASHBOARD - REAL-TIME CHAMPIONSHIP MONITORING
 * Government-Grade Performance Visualization
 * Government. Transcended. - THE TERRAFUSION WAY
 * ═══════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  EliteHealthStatus,
  EliteSystemMetrics,
  eliteSystemMonitor,
} from '@/services/EliteSystemMonitor';
import React, { useEffect, useState } from 'react';

const EliteSystemDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<EliteSystemMetrics>(
    eliteSystemMonitor.getCurrentMetrics()
  );
  const [healthStatus, setHealthStatus] = useState<EliteHealthStatus>(
    eliteSystemMonitor.getHealthStatus()
  );
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to real-time metrics updates
    const unsubscribe = eliteSystemMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setHealthStatus(eliteSystemMonitor.getHealthStatus());
      setIsConnected(true);
    });

    // Start monitoring if not already active
    eliteSystemMonitor.startMonitoring(3000); // 3-second intervals for real-time feel

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUANTUM':
        return 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white';
      case 'TRANSCENDENT':
        return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white';
      case 'CHAMPIONSHIP':
        return 'bg-gradient-to-r from-green-500 to-teal-600 text-white';
      case 'ELITE':
        return 'bg-gradient-to-r from-orange-500 to-red-600 text-white';
      case 'OPERATIONAL':
        return 'bg-green-500 text-white';
      case 'DEGRADED':
        return 'bg-yellow-500 text-black';
      case 'ERROR':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  return (
    <div className='elite-system-dashboard p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
          🏆 ELITE SYSTEM DASHBOARD
        </h1>
        <p className='text-xl text-slate-600 font-medium'>
          Government. Transcended. - Real-Time Championship Monitoring
        </p>
        <div className='flex items-center justify-center space-x-2'>
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          ></div>
          <span className='text-sm text-slate-500'>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Overall Status */}
      <Card className='border-2 shadow-lg'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>System Status</CardTitle>
        </CardHeader>
        <CardContent className='text-center space-y-4'>
          <Badge className={`text-lg px-6 py-2 ${getStatusColor(healthStatus.overall)}`}>
            {healthStatus.overall} LEVEL
          </Badge>

          {healthStatus.alerts.length > 0 && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <h4 className='font-semibold text-yellow-800 mb-2'>⚠️ Active Alerts</h4>
              <ul className='text-sm text-yellow-700 space-y-1'>
                {healthStatus.alerts.map((alert, index) => (
                  <li key={index}>• {alert}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {/* Response Time */}
        <Card className='border shadow-md hover:shadow-lg transition-shadow'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg text-center'>⚡ Response Time</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='text-3xl font-bold text-blue-600'>
              {metrics.responseTime.toFixed(1)}ms
            </div>
            <Progress value={Math.max(0, 100 - metrics.responseTime / 2)} className='mt-2' />
            <div className='text-sm text-slate-500 mt-1'>Target: &lt;100ms</div>
          </CardContent>
        </Card>

        {/* AI Accuracy */}
        <Card className='border shadow-md hover:shadow-lg transition-shadow'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg text-center'>🧠 AI Accuracy</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='text-3xl font-bold text-purple-600'>
              {metrics.aiAccuracy.toFixed(1)}%
            </div>
            <Progress value={metrics.aiAccuracy} className='mt-2' />
            <div className='text-sm text-slate-500 mt-1'>Championship: &gt;99%</div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className='border shadow-md hover:shadow-lg transition-shadow'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg text-center'>✅ Success Rate</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='text-3xl font-bold text-green-600'>
              {metrics.successRate.toFixed(2)}%
            </div>
            <Progress value={metrics.successRate} className='mt-2' />
            <div className='text-sm text-slate-500 mt-1'>Elite: &gt;99.5%</div>
          </CardContent>
        </Card>

        {/* Server Uptime */}
        <Card className='border shadow-md hover:shadow-lg transition-shadow'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg text-center'>🚀 Uptime</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='text-3xl font-bold text-cyan-600'>
              {formatUptime(metrics.serverUptime)}
            </div>
            <Progress value={metrics.serverUptime} className='mt-2' />
            <div className='text-sm text-slate-500 mt-1'>Transcendent: 99.99%</div>
          </CardContent>
        </Card>
      </div>

      {/* System Components Status */}
      <Card className='border shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl text-center'>🏛️ System Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center space-y-2'>
              <div className='text-lg font-semibold'>Frontend</div>
              <Badge className={getStatusColor(healthStatus.systems.frontend)}>
                {healthStatus.systems.frontend}
              </Badge>
            </div>
            <div className='text-center space-y-2'>
              <div className='text-lg font-semibold'>Backend</div>
              <Badge className={getStatusColor(healthStatus.systems.backend)}>
                {healthStatus.systems.backend}
              </Badge>
            </div>
            <div className='text-center space-y-2'>
              <div className='text-lg font-semibold'>Database</div>
              <Badge className={getStatusColor(healthStatus.systems.database)}>
                {healthStatus.systems.database}
              </Badge>
            </div>
            <div className='text-center space-y-2'>
              <div className='text-lg font-semibold'>AI Systems</div>
              <Badge className={getStatusColor(healthStatus.systems.ai)}>
                {healthStatus.systems.ai}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Government Compliance */}
        <Card className='border shadow-lg'>
          <CardHeader>
            <CardTitle className='text-xl text-center'>🏛️ Government Compliance</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span>FISMA Compliance</span>
              <Badge
                className={
                  metrics.fismaCompliance ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }
              >
                {metrics.fismaCompliance ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}
              </Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span>Security Score</span>
              <Badge className='bg-blue-500 text-white'>{metrics.securityScore}%</Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span>Accessibility</span>
              <Badge className='bg-purple-500 text-white'>{metrics.accessibilityScore}%</Badge>
            </div>
          </CardContent>
        </Card>

        {/* CostForge AI Performance */}
        <Card className='border shadow-lg'>
          <CardHeader>
            <CardTitle className='text-xl text-center'>💎 CostForge AI</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-cyan-600 mb-2'>
                {metrics.costForgePerformance.toFixed(1)}%
              </div>
              <Progress value={metrics.costForgePerformance} className='mb-2' />
              <div className='text-sm text-slate-500'>Performance Score</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-green-600'>
                {metrics.mlProcessingTime}ms
              </div>
              <div className='text-sm text-slate-500'>ML Processing Time</div>
            </div>
            <div className='text-center'>
              <Badge className='bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg px-4 py-1'>
                Quantum Factor: {metrics.quantumOptimization}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {healthStatus.recommendations.length > 0 && (
        <Card className='border shadow-lg'>
          <CardHeader>
            <CardTitle className='text-xl text-center'>💡 Championship Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2'>
              {healthStatus.recommendations.map((recommendation, index) => (
                <li key={index} className='flex items-start space-x-2'>
                  <span className='text-blue-600 font-bold'>•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className='text-center text-slate-500 text-sm'>
        <p>TerraFusion Elite System Dashboard - Last Updated: {new Date().toLocaleTimeString()}</p>
        <p className='font-semibold text-blue-600'>
          Government. Transcended. - THE TERRAFUSION WAY
        </p>
      </div>
    </div>
  );
};

export default EliteSystemDashboard;
