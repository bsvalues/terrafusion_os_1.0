/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION PERFORMANCE EVIDENCE
 * Governed telemetry display. No source-backed metrics means no claims.
 * ═══════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useState } from 'react';

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
  const [performanceMetrics] = useState<PerformanceMetric[]>([]);
  const [systemResources] = useState<SystemResource[]>([]);
  const [advancedMetrics] = useState<QuantumMetric | null>(null);
  const [predictiveInsights] = useState<PredictiveInsight[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('No governed telemetry endpoint connected');

  const updateMetrics = () => {
    setLastUpdate('Governed telemetry endpoint is not configured');
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

  const overallPerformanceScore =
    performanceMetrics.length > 0
      ? Math.round(
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
        )
      : 0;

  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-terra-cyan glow-text mb-2'>
          TerraFusion Performance Evidence
        </h1>
        <p className='text-terra-blue text-xl mb-4'>
          Governed performance telemetry and predictive insights require source-backed evidence
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
            onClick={updateMetrics}
            variant='outline'
            size='sm'
          >
            Check Evidence
          </Button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8'>
        {performanceMetrics.length === 0 ? (
          <Card className='terra-glass border-terra-cyan/30 xl:col-span-4'>
            <CardBody className='text-terra-blue/80'>
              Performance metrics are unavailable because no governed telemetry feed has returned
              response time, throughput, error rate, or availability evidence.
            </CardBody>
          </Card>
        ) : performanceMetrics.map((metric, index) => (
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

      {/* System Resources & Advanced Metrics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        <Card className='terra-glass border-terra-blue/30'>
          <CardHeader>
            <h3 className='text-xl font-semibold text-terra-blue'>System Resources</h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            {systemResources.length === 0 ? (
              <div className='text-terra-blue/80'>
                Resource telemetry is unavailable because no governed host metrics feed is
                connected.
              </div>
            ) : systemResources.map((resource, index) => (
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
            <h3 className='text-xl font-semibold text-terra-green'>Advanced Compute Metrics</h3>
          </CardHeader>
          <CardBody className='space-y-4'>
            {advancedMetrics === null ? (
              <div className='text-terra-blue/80'>
                Advanced compute metrics are unavailable. No quantum advantage, fidelity, or gate
                error values are displayed without source-backed telemetry.
              </div>
            ) : (
            <>
              <div className='grid grid-cols-2 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {advancedMetrics.coherenceTime.toFixed(1)}μs
                </div>
                <div className='text-sm text-terra-blue'>Coherence Time</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {advancedMetrics.entanglement.toFixed(3)}
                </div>
                <div className='text-sm text-terra-blue'>Entanglement</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {advancedMetrics.fidelity.toFixed(2)}%
                </div>
                <div className='text-sm text-terra-blue'>Fidelity</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {advancedMetrics.quantumAdvantage.toFixed(0)}x
                </div>
                <div className='text-sm text-terra-blue'>Quantum Advantage</div>
              </div>
            </div>

            <div className='text-center pt-2 border-t border-terra-cyan/20'>
              <div className='text-lg font-semibold text-green-400'>
                Gate Error Rate: {(advancedMetrics.gateErrors * 100).toFixed(4)}%
              </div>
              <div className='text-xs text-terra-blue'>Target: &lt;0.01%</div>
            </div>
            </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Predictive Insights */}
      <Card className='terra-glass border-terra-cyan/20 mb-8'>
        <CardHeader>
          <h3 className='text-xl font-semibold text-terra-cyan'>Predictive Performance Insights</h3>
        </CardHeader>
        <CardBody>
          <div className='space-y-4'>
            {predictiveInsights.length === 0 ? (
              <div className='text-terra-blue/80'>
                No predictive insights are displayed because no governed prediction service has
                returned confidence, uncertainty, provenance, and recommended action evidence.
              </div>
            ) : predictiveInsights.map((insight, index) => (
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
          Performance claims require evidence.
        </div>
        <div className='text-terra-blue text-lg'>
          TerraFusion Performance Evidence
        </div>
        <div className='text-terra-blue text-sm mt-2'>
          Performance Score: {overallPerformanceScore}/100 | Telemetry Status: {lastUpdate}
        </div>
      </div>
    </div>
  );
};

export default TerraFusionElitePerformanceAnalytics;
