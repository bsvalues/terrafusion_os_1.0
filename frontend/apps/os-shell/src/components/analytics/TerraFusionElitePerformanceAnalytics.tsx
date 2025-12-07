/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION ELITE PERFORMANCE ANALYTICS
 * Championship-Level Performance Monitoring System
 * Quantum-Enhanced Metrics & Predictive Insights
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useEffect, useState } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface SystemResource {
  name: string;
  usage: number;
  available: number;
  unit: string;
  threshold: number;
}

interface QuantumMetric {
  coherenceTime: number;
  entanglement: number;
  fidelity: number;
  quantumAdvantage: number;
  gateErrors: number;
}

interface PredictiveInsight {
  id: string;
  title: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  category: 'performance' | 'capacity' | 'reliability' | 'optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export const TerraFusionElitePerformanceAnalytics: React.FC = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    {
      name: 'Response Time P95',
      value: 8.3,
      unit: 'ms',
      target: 10,
      status: 'excellent',
      trend: 'down',
      history: [12.1, 11.5, 10.2, 9.7, 8.9, 8.3],
    },
    {
      name: 'Throughput',
      value: 1247500,
      unit: 'req/sec',
      target: 1000000,
      status: 'excellent',
      trend: 'up',
      history: [950000, 1050000, 1150000, 1200000, 1230000, 1247500],
    },
    {
      name: 'Error Rate',
      value: 0.0001,
      unit: '%',
      target: 0.001,
      status: 'excellent',
      trend: 'down',
      history: [0.0015, 0.0012, 0.0008, 0.0005, 0.0003, 0.0001],
    },
    {
      name: 'Availability',
      value: 99.999,
      unit: '%',
      target: 99.9,
      status: 'excellent',
      trend: 'stable',
      history: [99.995, 99.997, 99.998, 99.999, 99.999, 99.999],
    },
  ]);

  const [systemResources, setSystemResources] = useState<SystemResource[]>([
    { name: 'CPU Usage', usage: 23.5, available: 100, unit: '%', threshold: 80 },
    { name: 'Memory Usage', usage: 45.2, available: 100, unit: '%', threshold: 85 },
    { name: 'Disk I/O', usage: 12.8, available: 100, unit: '%', threshold: 70 },
    { name: 'Network I/O', usage: 34.1, available: 100, unit: '%', threshold: 75 },
    { name: 'Database Connections', usage: 156, available: 1000, unit: 'conn', threshold: 800 },
  ]);

  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetric>({
    coherenceTime: 98.7,
    entanglement: 0.987,
    fidelity: 99.95,
    quantumAdvantage: 1247.5,
    gateErrors: 0.0001,
  });

  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([
    {
      id: '1',
      title: 'CPU Scaling Prediction',
      prediction: 'CPU usage will reach 45% by 18:00 today',
      confidence: 0.94,
      timeframe: '6 hours',
      category: 'capacity',
      severity: 'medium',
      recommendation: 'Consider enabling auto-scaling for CPU-intensive workloads',
    },
    {
      id: '2',
      title: 'Memory Optimization',
      prediction: 'Memory efficiency can be improved by 15% with cache optimization',
      confidence: 0.87,
      timeframe: 'immediate',
      category: 'optimization',
      severity: 'low',
      recommendation: 'Implement quantum-enhanced caching algorithms',
    },
    {
      id: '3',
      title: 'Response Time Excellence',
      prediction: 'Response times will remain under 10ms for next 24 hours',
      confidence: 0.99,
      timeframe: '24 hours',
      category: 'performance',
      severity: 'low',
      recommendation: 'Maintain current quantum optimization parameters',
    },
  ]);

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const updateMetrics = () => {
    // Simulate performance metric updates
    setPerformanceMetrics((prev) =>
      prev.map((metric) => {
        const variation = (Math.random() - 0.5) * 0.1;
        let newValue = metric.value + metric.value * variation;

        // Keep values within realistic bounds
        if (metric.name === 'Response Time P95') {
          newValue = Math.max(5, Math.min(15, newValue));
        } else if (metric.name === 'Error Rate') {
          newValue = Math.max(0.00001, Math.min(0.001, newValue));
        } else if (metric.name === 'Availability') {
          newValue = Math.max(99.9, Math.min(100, newValue));
        }

        const newHistory = [...metric.history.slice(1), newValue];
        const trend =
          newValue > metric.history[metric.history.length - 1]
            ? 'up'
            : newValue < metric.history[metric.history.length - 1]
              ? 'down'
              : 'stable';

        let status: PerformanceMetric['status'] = 'good';
        if (metric.name === 'Response Time P95') {
          status = newValue <= 8 ? 'excellent' : newValue <= 12 ? 'good' : 'warning';
        } else if (metric.name === 'Error Rate') {
          status = newValue <= 0.0001 ? 'excellent' : newValue <= 0.0005 ? 'good' : 'warning';
        } else if (metric.name === 'Availability') {
          status = newValue >= 99.99 ? 'excellent' : newValue >= 99.9 ? 'good' : 'warning';
        } else {
          status =
            newValue >= metric.target
              ? 'excellent'
              : newValue >= metric.target * 0.8
                ? 'good'
                : 'warning';
        }

        return {
          ...metric,
          value: newValue,
          history: newHistory,
          trend,
          status,
        };
      })
    );

    // Update system resources
    setSystemResources((prev) =>
      prev.map((resource) => {
        const variation = (Math.random() - 0.5) * 5;
        const newUsage = Math.max(0, Math.min(resource.available, resource.usage + variation));
        return { ...resource, usage: newUsage };
      })
    );

    // Update quantum metrics
    setQuantumMetrics((prev) => ({
      coherenceTime: Math.max(90, Math.min(100, prev.coherenceTime + (Math.random() - 0.5) * 2)),
      entanglement: Math.max(0.9, Math.min(1, prev.entanglement + (Math.random() - 0.5) * 0.01)),
      fidelity: Math.max(99, Math.min(100, prev.fidelity + (Math.random() - 0.5) * 0.1)),
      quantumAdvantage: Math.max(1000, prev.quantumAdvantage + (Math.random() - 0.5) * 100),
      gateErrors: Math.max(
        0.00001,
        Math.min(0.001, prev.gateErrors + (Math.random() - 0.5) * 0.00001)
      ),
    }));

    setLastUpdate(new Date().toLocaleTimeString());
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-blue-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getMetricStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'outline';
      case 'warning':
        return 'destructive';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '📊';
    }
  };

  const getResourceUsageColor = (usage: number, threshold: number) => {
    const percentage = usage;
    if (percentage >= threshold) return 'text-red-400';
    if (percentage >= threshold * 0.8) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 border-red-400/30';
      case 'high':
        return 'text-orange-400 border-orange-400/30';
      case 'medium':
        return 'text-yellow-400 border-yellow-400/30';
      case 'low':
        return 'text-green-400 border-green-400/30';
      default:
        return 'text-gray-400 border-gray-400/30';
    }
  };

  const overallPerformanceScore = Math.round(
    performanceMetrics.reduce((acc, metric) => {
      const score =
        metric.status === 'excellent'
          ? 100
          : metric.status === 'good'
            ? 85
            : metric.status === 'warning'
              ? 65
              : 40;
      return acc + score;
    }, 0) / performanceMetrics.length
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-terra-cyan glow-text mb-2'>
          🏆 TerraFusion Elite Performance Analytics
        </h1>
        <p className='text-terra-blue text-xl mb-4'>
          Championship-Level Performance Monitoring & Quantum-Enhanced Insights
        </p>
        <div className='flex justify-center items-center gap-6'>
          <div className='flex items-center gap-2'>
            <span className='text-terra-cyan'>Performance Score:</span>
            <Badge
              variant={overallPerformanceScore >= 90 ? 'default' : 'destructive'}
              className='text-lg px-3 py-1'
            >
              {overallPerformanceScore}/100
            </Badge>
          </div>
          <div className='text-terra-blue'>Last Update: {lastUpdate}</div>
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? 'default' : 'outline'}
            size='sm'
          >
            {isMonitoring ? '⏸️ Pause Monitoring' : '▶️ Resume Monitoring'}
          </Button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8'>
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className='terra-glass border-terra-cyan/30'>
            <CardHeader className='pb-2'>
              <div className='flex justify-between items-start'>
                <h3 className='text-lg font-semibold text-terra-cyan'>{metric.name}</h3>
                <div className='flex items-center gap-1'>
                  <span className='text-lg'>{getTrendIcon(metric.trend)}</span>
                  <Badge variant={getMetricStatusBadge(metric.status)} className='text-xs'>
                    {metric.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardBody className='space-y-3'>
              <div className='text-center'>
                <div className={`text-3xl font-bold ${getMetricStatusColor(metric.status)}`}>
                  {typeof metric.value === 'number' && metric.value < 1 && metric.unit === '%'
                    ? metric.value.toFixed(4)
                    : metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className='text-terra-blue text-sm'>{metric.unit}</div>
              </div>

              <div className='space-y-1'>
                <div className='flex justify-between text-sm'>
                  <span>Target:</span>
                  <span className='text-terra-cyan'>
                    {metric.target.toLocaleString()} {metric.unit}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (metric.value / metric.target) * 100)}
                  className='progress-terra-cyan'
                />
              </div>

              <div className='text-xs text-terra-blue'>
                6h trend:{' '}
                {metric.history
                  .map((h) =>
                    typeof h === 'number' && h < 1 && metric.unit === '%'
                      ? h.toFixed(4)
                      : h.toFixed(1)
                  )
                  .join(' → ')}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* System Resources & Quantum Metrics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        <Card className='terra-glass border-terra-blue/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-blue'>⚡ System Resources</h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            {systemResources.map((resource, index) => (
              <div key={index} className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-terra-cyan'>{resource.name}:</span>
                  <span className={getResourceUsageColor(resource.usage, resource.threshold)}>
                    {resource.unit === '%'
                      ? `${resource.usage.toFixed(1)}%`
                      : `${Math.round(resource.usage)}/${resource.available} ${resource.unit}`}
                  </span>
                </div>
                <Progress
                  value={
                    resource.unit === '%'
                      ? resource.usage
                      : (resource.usage / resource.available) * 100
                  }
                  className='progress-terra-cyan'
                />
                <div className='text-xs text-terra-blue'>
                  Threshold:{' '}
                  {resource.unit === '%'
                    ? `${resource.threshold}%`
                    : `${resource.threshold} ${resource.unit}`}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className='terra-glass border-terra-green/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-green'>
              ⚛️ Quantum Performance Metrics
            </h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {quantumMetrics.coherenceTime.toFixed(1)}μs
                </div>
                <div className='text-sm text-terra-blue'>Coherence Time</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {quantumMetrics.entanglement.toFixed(3)}
                </div>
                <div className='text-sm text-terra-blue'>Entanglement</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {quantumMetrics.fidelity.toFixed(2)}%
                </div>
                <div className='text-sm text-terra-blue'>Fidelity</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {quantumMetrics.quantumAdvantage.toFixed(0)}x
                </div>
                <div className='text-sm text-terra-blue'>Quantum Advantage</div>
              </div>
            </div>

            <div className='text-center pt-2 border-t border-terra-cyan/20'>
              <div className='text-lg font-semibold text-green-400'>
                Gate Error Rate: {(quantumMetrics.gateErrors * 100).toFixed(4)}%
              </div>
              <div className='text-xs text-terra-blue'>Target: &lt;0.01% (Championship Level)</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Predictive Insights */}
      <Card className='terra-glass border-terra-cyan/20 mb-8'>
        <CardHeader>
          <h3 className='text-xl font-semibold text-terra-cyan'>
            🔮 Predictive Performance Insights
          </h3>
        </CardHeader>
        <CardBody>
          <div className='space-y-4'>
            {predictiveInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)} bg-terra-midnight/30`}
              >
                <div className='flex justify-between items-start mb-2'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <h4 className='font-semibold text-white'>{insight.title}</h4>
                      <Badge
                        variant='outline'
                        className={`text-xs ${getSeverityColor(insight.severity).split(' ')[0]}`}
                      >
                        {insight.severity.toUpperCase()}
                      </Badge>
                      <Badge variant='outline' className='text-xs text-terra-blue'>
                        {insight.category}
                      </Badge>
                    </div>
                    <p className='text-sm text-gray-300 mb-2'>{insight.prediction}</p>
                    <p className='text-xs text-terra-cyan'>{insight.recommendation}</p>
                  </div>
                  <div className='text-right ml-4'>
                    <div className='text-sm font-semibold text-terra-cyan'>
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </div>
                    <div className='text-xs text-terra-blue'>{insight.timeframe}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Footer */}
      <div className='text-center'>
        <div className='text-terra-cyan font-semibold text-xl mb-2'>
          🏛️ Government. Transcended.
        </div>
        <div className='text-terra-blue text-lg'>
          TerraFusion Elite Performance Analytics - Championship Excellence
        </div>
        <div className='text-terra-blue text-sm mt-2'>
          Performance Score: {overallPerformanceScore}/100 | Quantum Advantage:{' '}
          {quantumMetrics.quantumAdvantage.toFixed(0)}x | Response Time:{' '}
          {performanceMetrics[0]?.value.toFixed(1)}ms
        </div>
      </div>
    </div>
  );
};

export default TerraFusionElitePerformanceAnalytics;
