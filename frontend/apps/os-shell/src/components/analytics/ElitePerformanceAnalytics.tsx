/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE PERFORMANCE ANALYTICS DASHBOARD
 * Advanced Real-time Performance Monitoring & Optimization
 * THE TERRAFUSION WAY - PhD-Level Performance Excellence
 * ═══════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import EliteProgress from '@/components/ui/EliteProgress';
import React, { useState } from 'react';
import {
  EliteActivityIcon,
  EliteBrainIcon,
  EliteCpuIcon,
  EliteGaugeIcon,
  EliteMemoryStickIcon,
  EliteNetworkIcon,
  EliteZapIcon,
} from '../icons/EliteIcons';

interface PerformanceMetrics {
  timestamp: Date;
  cpu: number | null;
  memory: number | null;
  network: number | null;
  renderTime: number | null;
  bundleSize: number | null;
  fps: number | null;
}

interface OptimizationSuggestion {
  id: string;
  category: 'performance' | 'memory' | 'network' | 'rendering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  action: string;
}

const ElitePerformanceAnalytics: React.FC = () => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>({
    timestamp: new Date(),
    cpu: null,
    memory: null,
    network: null,
    renderTime: null,
    bundleSize: null,
    fps: null,
  });

  const [optimizationSuggestions] = useState<OptimizationSuggestion[]>([]);

  const [autoOptimization] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const runOptimization = async () => {
    setIsOptimizing(true);
    setCurrentMetrics((prev) => ({ ...prev, timestamp: new Date() }));
    setActionMessage('Optimization was not run. Performance actions require a governed backend/Pilot execution path.');
    setIsOptimizing(false);
  };

  const applySuggestion = (suggestionId: string) => {
    const suggestion = optimizationSuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    setActionMessage(`Suggestion "${suggestion.title}" was not applied. Suggestions require governed evidence and execution.`);
  };

  const getPerformanceGrade = () => {
    if (
      currentMetrics.cpu == null ||
      currentMetrics.memory == null ||
      currentMetrics.network == null ||
      currentMetrics.fps == null
    ) {
      return { grade: '—', color: 'text-gray-400', label: 'Unavailable' };
    }

    const score =
      (100 - currentMetrics.cpu) * 0.25 +
      (100 - currentMetrics.memory) * 0.25 +
      (Math.max(0, 60 - currentMetrics.network) / 60) * 100 * 0.25 +
      (currentMetrics.fps / 60) * 100 * 0.25;

    if (score >= 90) return { grade: 'A+', color: 'text-green-400', label: 'Elite' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400', label: 'Excellent' };
    if (score >= 70) return { grade: 'B+', color: 'text-yellow-400', label: 'Good' };
    if (score >= 60) return { grade: 'B', color: 'text-yellow-400', label: 'Fair' };
    return { grade: 'C', color: 'text-red-400', label: 'Needs Optimization' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const performanceGrade = getPerformanceGrade();
  const fmtMetric = (value: number | null, suffix = '') => value == null ? 'Unavailable' : `${value.toFixed(suffix === 'ms' ? 1 : 0)}${suffix}`;
  const progressValue = (value: number | null) => value ?? 0;

  return (
    <Card className='w-full terra-glass border-terra-cyan/20 backdrop-blur-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 rounded-lg bg-terra-cyan/10 border border-terra-cyan/20'>
            <EliteGaugeIcon className='w-6 h-6 text-terra-cyan' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-white'>Elite Performance Analytics</h3>
            <p className='text-sm text-gray-400'>Real-time performance monitoring & optimization</p>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <div className='text-right mr-4'>
            <div className={`text-2xl font-bold ${performanceGrade.color}`}>
              {performanceGrade.grade}
            </div>
            <div className='text-xs text-gray-400'>{performanceGrade.label}</div>
          </div>

          <Button
            variant='outline'
            size='sm'
            disabled
            className={`border-purple-500/30 ${autoOptimization ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400'} hover:bg-purple-500/10`}
            title='Auto-optimization requires governed backend execution'
          >
            <EliteBrainIcon className='w-4 h-4 mr-2' />
            Governed only
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={runOptimization}
            disabled={isOptimizing}
            className='border-terra-cyan/30 text-terra-cyan hover:bg-terra-cyan/10'
          >
            {isOptimizing ? (
              <>
                <EliteZapIcon className='w-4 h-4 mr-2 animate-pulse' />
                Optimizing...
              </>
            ) : (
              <>
                <EliteZapIcon className='w-4 h-4 mr-2' />
                Optimize
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {actionMessage && (
          <div className='p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300'>
            {actionMessage}
          </div>
        )}

        {/* Real-time Performance Metrics */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          <div className='p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteCpuIcon className='w-5 h-5 text-blue-400' />
              <span className='text-lg font-bold text-white'>{fmtMetric(currentMetrics.cpu, '%')}</span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>CPU Usage</div>
            <EliteProgress value={progressValue(currentMetrics.cpu)} className='h-1 mt-2' variant='glow' />
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteMemoryStickIcon className='w-5 h-5 text-purple-400' />
              <span className='text-lg font-bold text-white'>{fmtMetric(currentMetrics.memory, '%')}</span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>Memory</div>
            <EliteProgress value={progressValue(currentMetrics.memory)} className='h-1 mt-2' variant='quantum' />
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteNetworkIcon className='w-5 h-5 text-green-400' />
              <span className='text-lg font-bold text-white'>{fmtMetric(currentMetrics.network, 'ms')}</span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>Latency</div>
            <EliteProgress
              value={currentMetrics.network == null ? 0 : Math.min(100, (currentMetrics.network / 200) * 100)}
              className='h-1 mt-2'
              variant='default'
            />
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteActivityIcon className='w-5 h-5 text-yellow-400' />
              <span className='text-lg font-bold text-white'>
                {fmtMetric(currentMetrics.renderTime, 'ms')}
              </span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>Render Time</div>
            <EliteProgress
              value={currentMetrics.renderTime == null ? 0 : Math.min(100, (currentMetrics.renderTime / 33) * 100)}
              className='h-1 mt-2'
              variant='glow'
            />
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteZapIcon className='w-5 h-5 text-orange-400' />
              <span className='text-lg font-bold text-white'>
                {currentMetrics.bundleSize == null ? 'Unavailable' : `${currentMetrics.bundleSize.toFixed(1)}MB`}
              </span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>Bundle Size</div>
            <EliteProgress
              value={currentMetrics.bundleSize == null ? 0 : Math.min(100, (currentMetrics.bundleSize / 5) * 100)}
              className='h-1 mt-2'
              variant='quantum'
            />
          </div>

          <div className='p-3 rounded-lg bg-gradient-to-br from-terra-cyan/10 to-transparent border border-terra-cyan/20'>
            <div className='flex items-center justify-between mb-2'>
              <EliteGaugeIcon className='w-5 h-5 text-terra-cyan' />
              <span className='text-lg font-bold text-white'>{fmtMetric(currentMetrics.fps)}</span>
            </div>
            <div className='text-xs text-gray-400 uppercase tracking-wide'>FPS</div>
            <EliteProgress
              value={currentMetrics.fps == null ? 0 : (currentMetrics.fps / 60) * 100}
              className='h-1 mt-2'
              variant='glow'
            />
          </div>
        </div>

        {/* Optimization Suggestions */}
        {optimizationSuggestions.length > 0 ? (
          <div className='space-y-3'>
            <h4 className='text-sm font-semibold text-white flex items-center'>
              <EliteBrainIcon className='w-4 h-4 mr-2 text-purple-400' />
              AI Optimization Suggestions
            </h4>

            {optimizationSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className='p-4 rounded-lg bg-terra-slate/30 border border-terra-cyan/10'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <h5 className='text-sm font-medium text-white'>{suggestion.title}</h5>
                      <Badge className={getSeverityColor(suggestion.severity)}>
                        {suggestion.severity}
                      </Badge>
                    </div>
                    <p className='text-xs text-gray-400 mb-2'>{suggestion.description}</p>
                    <div className='flex items-center space-x-4 text-xs'>
                      <span className='text-green-400'>Impact: {suggestion.impact}</span>
                      <span className='text-blue-400'>Action: {suggestion.action}</span>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    onClick={() => applySuggestion(suggestion.id)}
                    className='ml-4 bg-terra-cyan/20 text-terra-cyan border border-terra-cyan/30 hover:bg-terra-cyan/30'
                  >
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='p-4 rounded-lg bg-terra-slate/30 border border-terra-cyan/10 text-sm text-gray-300'>
            No optimization suggestions are displayed because no governed performance evidence endpoint has returned recommendations.
          </div>
        )}

        {/* Performance Summary */}
        <div className='p-4 rounded-lg bg-gradient-to-r from-terra-cyan/10 to-purple-500/10 border border-terra-cyan/20'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-semibold text-white'>Elite Performance Status</h4>
              <p className='text-xs text-gray-400'>Performance evidence unavailable until a governed telemetry source is connected</p>
            </div>
            <div className='text-right'>
              <div className={`text-xl font-bold ${performanceGrade.color}`}>
                {performanceGrade.grade} Grade
              </div>
              <div className='text-xs text-gray-400'>Evidence required</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElitePerformanceAnalytics;
