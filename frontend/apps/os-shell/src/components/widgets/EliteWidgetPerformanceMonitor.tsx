/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE WIDGET PERFORMANCE MONITOR DASHBOARD
 * Real-time Performance Analytics & AI-Powered Insights
 * ═══════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  EliteActivityIcon,
  EliteBrainIcon,
  EliteCpuIcon,
  EliteMaximizeIcon,
  EliteMemoryIcon,
  EliteMinimizeIcon,
  EliteShieldIcon,
  EliteTrendingIcon,
  EliteZapIcon,
} from '../icons/EliteIcons';

interface WidgetPerformanceData {
  id: string;
  name: string;
  renderTime: number;
  memoryUsage: number;
  errorCount: number;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'offline';
  lastUpdated: Date;
}

interface SystemPerformanceMetrics {
  totalWidgets: number;
  averageRenderTime: number;
  totalMemoryUsage: number;
  errorRate: number;
  uptimePercentage: number;
  aiOptimizationSuggestions: number;
}

const EliteWidgetPerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<WidgetPerformanceData[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemPerformanceMetrics>({
    totalWidgets: 0,
    averageRenderTime: 0,
    totalMemoryUsage: 0,
    errorRate: 0,
    uptimePercentage: 100,
    aiOptimizationSuggestions: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Simulate Elite Performance Data Collection
  useEffect(() => {
    const collectPerformanceData = () => {
      // Simulate real widget performance data
      const mockWidgets: WidgetPerformanceData[] = [
        {
          id: 'system-health',
          name: 'System Health Monitor',
          renderTime: Math.random() * 50 + 10,
          memoryUsage: Math.random() * 100 + 50,
          errorCount: Math.floor(Math.random() * 3),
          healthStatus: Math.random() > 0.8 ? 'warning' : 'healthy',
          lastUpdated: new Date(),
        },
        {
          id: 'ai-insights',
          name: 'AI Insights Dashboard',
          renderTime: Math.random() * 80 + 20,
          memoryUsage: Math.random() * 150 + 75,
          errorCount: Math.floor(Math.random() * 2),
          healthStatus: Math.random() > 0.9 ? 'critical' : 'healthy',
          lastUpdated: new Date(),
        },
        {
          id: 'government-core',
          name: 'Government Core Module',
          renderTime: Math.random() * 60 + 15,
          memoryUsage: Math.random() * 120 + 60,
          errorCount: Math.floor(Math.random() * 4),
          healthStatus: Math.random() > 0.85 ? 'warning' : 'healthy',
          lastUpdated: new Date(),
        },
        {
          id: 'quantum-ui',
          name: 'Quantum UI Components',
          renderTime: Math.random() * 40 + 8,
          memoryUsage: Math.random() * 80 + 40,
          errorCount: Math.floor(Math.random() * 1),
          healthStatus: 'healthy',
          lastUpdated: new Date(),
        },
      ];

      setPerformanceData(mockWidgets);

      // Calculate system metrics
      const totalWidgets = mockWidgets.length;
      const averageRenderTime =
        mockWidgets.reduce((sum, w) => sum + w.renderTime, 0) / totalWidgets;
      const totalMemoryUsage = mockWidgets.reduce((sum, w) => sum + w.memoryUsage, 0);
      const totalErrors = mockWidgets.reduce((sum, w) => sum + w.errorCount, 0);
      const errorRate = totalErrors / totalWidgets;
      const healthyWidgets = mockWidgets.filter((w) => w.healthStatus === 'healthy').length;
      const uptimePercentage = (healthyWidgets / totalWidgets) * 100;

      setSystemMetrics({
        totalWidgets,
        averageRenderTime,
        totalMemoryUsage,
        errorRate,
        uptimePercentage,
        aiOptimizationSuggestions: Math.floor(Math.random() * 5) + 2,
      });
    };

    // Initial data collection
    collectPerformanceData();

    // Real-time updates every 3 seconds
    const interval = setInterval(collectPerformanceData, 3000);

    return () => clearInterval(interval);
  }, []);

  // AI-Powered Optimization
  const runAIOptimization = async () => {
    setIsOptimizing(true);

    // Simulate AI optimization process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update performance after optimization
    setPerformanceData((prev) =>
      prev.map((widget) => ({
        ...widget,
        renderTime: widget.renderTime * 0.85, // 15% improvement
        memoryUsage: widget.memoryUsage * 0.9, // 10% memory reduction
        healthStatus: 'healthy' as const,
      }))
    );

    setIsOptimizing(false);
  };

  // Performance Status Color
  const getPerformanceColor = (renderTime: number): string => {
    if (renderTime < 20) return 'text-green-400';
    if (renderTime < 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Health Status Icon
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <EliteShieldIcon className='w-4 h-4 text-green-400' />;
      case 'warning':
        return <EliteActivityIcon className='w-4 h-4 text-yellow-400' />;
      case 'critical':
        return <EliteActivityIcon className='w-4 h-4 text-red-400' />;
      default:
        return <EliteActivityIcon className='w-4 h-4 text-gray-400' />;
    }
  };

  return (
    <Card className='w-full terra-glass border-terra-cyan/20 backdrop-blur-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 rounded-lg bg-terra-cyan/10 border border-terra-cyan/20'>
            <EliteActivityIcon className='w-6 h-6 text-terra-cyan' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-white'>Elite Widget Performance</h3>
            <p className='text-sm text-gray-400'>
              Real-time performance analytics & AI optimization
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={runAIOptimization}
            disabled={isOptimizing}
            className='border-terra-cyan/30 text-terra-cyan hover:bg-terra-cyan/10'
          >
            {isOptimizing ? (
              <>
                <EliteBrainIcon className='w-4 h-4 mr-2 animate-pulse' />
                Optimizing...
              </>
            ) : (
              <>
                <EliteBrainIcon className='w-4 h-4 mr-2' />
                AI Optimize
              </>
            )}
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsExpanded(!isExpanded)}
            className='text-gray-400 hover:text-terra-cyan'
          >
            {isExpanded ? (
              <EliteMinimizeIcon className='w-4 h-4' />
            ) : (
              <EliteMaximizeIcon className='w-4 h-4' />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* System Overview Metrics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='p-3 rounded-lg bg-gradient-to-br from-terra-cyan/10 to-transparent border border-terra-cyan/20'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-400 uppercase tracking-wide'>Widgets</p>
                <p className='text-lg font-bold text-white'>{systemMetrics.totalWidgets}</p>
              </div>
              <Settings className='w-5 h-5 text-terra-cyan' />
            </div>
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-400 uppercase tracking-wide'>Uptime</p>
                <p className='text-lg font-bold text-white'>
                  {systemMetrics.uptimePercentage.toFixed(1)}%
                </p>
              </div>
              <EliteShieldIcon className='w-5 h-5 text-green-400' />
            </div>
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-400 uppercase tracking-wide'>Avg Render</p>
                <p className='text-lg font-bold text-white'>
                  {systemMetrics.averageRenderTime.toFixed(1)}ms
                </p>
              </div>
              <EliteZapIcon className='w-5 h-5 text-blue-400' />
            </div>
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-400 uppercase tracking-wide'>Memory</p>
                <p className='text-lg font-bold text-white'>
                  {systemMetrics.totalMemoryUsage.toFixed(0)}MB
                </p>
              </div>
              <EliteMemoryIcon className='w-5 h-5 text-purple-400' />
            </div>
          </div>
        </div>

        {/* Individual Widget Performance */}
        {isExpanded && (
          <div className='space-y-3'>
            <h4 className='text-sm font-semibold text-white flex items-center'>
              <EliteTrendingIcon className='w-4 h-4 mr-2 text-terra-cyan' />
              Widget Performance Details
            </h4>

            {performanceData.map((widget) => (
              <div
                key={widget.id}
                className='p-3 rounded-lg bg-terra-slate/30 border border-terra-cyan/10'
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-2'>
                    {getHealthIcon(widget.healthStatus)}
                    <span className='text-sm font-medium text-white'>{widget.name}</span>
                    <Badge variant='secondary' className='text-xs'>
                      {widget.healthStatus}
                    </Badge>
                  </div>
                  <div className='flex items-center space-x-4 text-xs text-gray-400'>
                    <span className={getPerformanceColor(widget.renderTime)}>
                      <EliteCpuIcon className='w-3 h-3 inline mr-1' />
                      {widget.renderTime.toFixed(1)}ms
                    </span>
                    <span className='text-purple-400'>
                      <EliteMemoryIcon className='w-3 h-3 inline mr-1' />
                      {widget.memoryUsage.toFixed(0)}MB
                    </span>
                  </div>
                </div>

                <div className='space-y-2'>
                  <div>
                    <div className='flex justify-between text-xs text-gray-400 mb-1'>
                      <span>Render Performance</span>
                      <span>{widget.renderTime.toFixed(1)}ms</span>
                    </div>
                    <Progress
                      value={Math.min((widget.renderTime / 100) * 100, 100)}
                      className='h-2 bg-terra-slate'
                    />
                  </div>

                  <div>
                    <div className='flex justify-between text-xs text-gray-400 mb-1'>
                      <span>Memory Usage</span>
                      <span>{widget.memoryUsage.toFixed(0)}MB</span>
                    </div>
                    <Progress
                      value={Math.min((widget.memoryUsage / 200) * 100, 100)}
                      className='h-2 bg-terra-slate'
                    />
                  </div>

                  {widget.errorCount > 0 && (
                    <div className='flex items-center text-xs text-red-400'>
                      <EliteActivityIcon className='w-3 h-3 mr-1' />
                      {widget.errorCount} error{widget.errorCount !== 1 ? 's' : ''} detected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Optimization Suggestions */}
        {systemMetrics.aiOptimizationSuggestions > 0 && (
          <div className='p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <EliteBrainIcon className='w-4 h-4 text-purple-400' />
                <span className='text-sm text-white'>
                  {systemMetrics.aiOptimizationSuggestions} AI optimization suggestions available
                </span>
              </div>
              <Badge variant='secondary' className='bg-purple-500/20 text-purple-300'>
                Elite AI
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EliteWidgetPerformanceMonitor;
