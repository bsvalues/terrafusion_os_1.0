/**
 * ═══════════════════════════════════════════════════════════════
 * AI INSIGHTS PANEL - Real-time Intelligence Dashboard
 * TerraFusion OS Predictive Analytics Engine
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  Progress,
} from '@/components/terrafusion-design-system';
import { cn } from '@utils/cn';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Eye,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  confidence: number;
  impact: {
    category: string;
    value: number;
    unit: string;
  };
  actionable: boolean;
  timestamp: Date;
}

interface PredictiveMetric {
  name: string;
  current: number;
  predicted: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  unit: string;
}

interface AIInsightsPanelProps {
  countyId: string;
  department: string;
  timeframe?: '24h' | '7d' | '30d';
  className?: string;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  countyId,
  department,
  timeframe = '7d',
  className,
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictiveMetric[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    analyzeAndGenerateInsights();
  }, [countyId, department, timeframe]);

  const analyzeAndGenerateInsights = async () => {
    setIsAnalyzing(true);

    // Simulate AI analysis (replace with actual API)
    setTimeout(() => {
      setInsights([
        {
          id: '1',
          type: 'trend',
          severity: 'success',
          title: 'Market Value Increase Detected',
          description:
            'Residential properties in District 5 showing +3.2% value increase over past 30 days. 847 properties analyzed.',
          confidence: 0.957,
          impact: {
            category: 'revenue',
            value: 1.2,
            unit: 'million',
          },
          actionable: true,
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'anomaly',
          severity: 'warning',
          title: 'Assessment Outliers Identified',
          description:
            '2 commercial properties (Parcels #8842, #9103) showing significant deviation from comparable properties.',
          confidence: 0.943,
          impact: {
            category: 'accuracy',
            value: -2.1,
            unit: 'percent',
          },
          actionable: true,
          timestamp: new Date(),
        },
        {
          id: '3',
          type: 'recommendation',
          severity: 'info',
          title: 'Workflow Optimization Available',
          description:
            'AI identified 5 manual tasks that can be automated, saving estimated 18.5 hours per week.',
          confidence: 0.982,
          impact: {
            category: 'efficiency',
            value: 18.5,
            unit: 'hours/week',
          },
          actionable: true,
          timestamp: new Date(),
        },
        {
          id: '4',
          type: 'prediction',
          severity: 'info',
          title: 'Q1 2026 Assessment Volume Forecast',
          description:
            'Predictive model forecasts 12% increase in assessment requests for Q1 2026 based on historical patterns.',
          confidence: 0.891,
          impact: {
            category: 'workload',
            value: 12,
            unit: 'percent',
          },
          actionable: false,
          timestamp: new Date(),
        },
        {
          id: '5',
          type: 'trend',
          severity: 'critical',
          title: 'IAAO Compliance Metric Alert',
          description:
            'Coefficient of Dispersion trending toward 14.8%. Recommend review before reaching 15% threshold.',
          confidence: 0.967,
          impact: {
            category: 'compliance',
            value: 14.8,
            unit: 'percent',
          },
          actionable: true,
          timestamp: new Date(),
        },
      ]);

      setPredictions([
        {
          name: 'Property Assessments',
          current: 847,
          predicted: 950,
          trend: 'up',
          confidence: 0.89,
          unit: 'properties',
        },
        {
          name: 'Processing Time',
          current: 45,
          predicted: 28,
          trend: 'down',
          confidence: 0.93,
          unit: 'minutes',
        },
        {
          name: 'Accuracy Score',
          current: 99.5,
          predicted: 99.7,
          trend: 'up',
          confidence: 0.96,
          unit: 'percent',
        },
        {
          name: 'Citizen Satisfaction',
          current: 87.3,
          predicted: 92.1,
          trend: 'up',
          confidence: 0.88,
          unit: 'percent',
        },
      ]);

      setIsAnalyzing(false);
    }, 1200);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'success':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      default:
        return 'text-terra-cyan bg-terra-cyan/10 border-terra-cyan/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className='w-5 h-5' />;
      case 'anomaly':
        return <AlertTriangle className='w-5 h-5' />;
      case 'recommendation':
        return <Sparkles className='w-5 h-5' />;
      case 'prediction':
        return <Eye className='w-5 h-5' />;
      default:
        return <Brain className='w-5 h-5' />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'down':
        return <TrendingDown className='w-4 h-4 text-red-400' />;
      default:
        return <BarChart3 className='w-4 h-4 text-slate-400' />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-white mb-1'>AI Insights & Predictions</h2>
          <p className='text-sm text-slate-400'>
            Real-time intelligence for {countyId.toUpperCase()} {department}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {isAnalyzing ? (
            <Badge variant='outline' className='text-xs'>
              <div className='w-3 h-3 border-2 border-terra-cyan border-t-transparent rounded-full animate-spin mr-2' />
              Analyzing
            </Badge>
          ) : (
            <Badge variant='quantum' className='quantum-pulse'>
              <Brain className='w-3 h-3 mr-2' />
              AI Active
            </Badge>
          )}
          <Badge variant='outline' className='text-xs'>
            {timeframe === '24h' ? '24 Hours' : timeframe === '7d' ? '7 Days' : '30 Days'}
          </Badge>
        </div>
      </div>

      {/* Predictive Metrics */}
      <Card className='terra-glass' glow>
        <CardHeader className='border-b border-terra-cyan/20'>
          <div className='flex items-center gap-2'>
            <Target className='w-5 h-5 text-terra-cyan' />
            <h3 className='text-lg font-semibold text-white'>Predictive Metrics</h3>
          </div>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='grid grid-cols-2 gap-4'>
            {predictions.map((metric) => {
              const change = ((metric.predicted - metric.current) / metric.current) * 100;
              const isPositive = metric.trend === 'up' && change > 0;

              return (
                <div
                  key={metric.name}
                  className='p-4 bg-terra-midnight/50 rounded-lg border border-slate-700 hover-quantum'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-semibold text-slate-300'>{metric.name}</span>
                    {getTrendIcon(metric.trend)}
                  </div>

                  <div className='flex items-baseline gap-2 mb-2'>
                    <span className='text-2xl font-bold text-white'>{metric.current}</span>
                    <span className='text-sm text-slate-400'>{metric.unit}</span>
                  </div>

                  <div className='flex items-center justify-between text-xs mb-2'>
                    <span className='text-slate-400'>Predicted:</span>
                    <span
                      className={cn(
                        'font-semibold',
                        isPositive ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {metric.predicted} {metric.unit}
                    </span>
                  </div>

                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-slate-400'>Confidence:</span>
                    <span className='text-terra-cyan font-mono'>
                      {(metric.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <Progress value={metric.confidence * 100} className='h-1 mt-2' />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className='space-y-4'>
        {insights.map((insight) => (
          <Card
            key={insight.id}
            className={cn('terra-glass border', getSeverityColor(insight.severity))}
          >
            <CardContent className='p-4'>
              <div className='flex items-start gap-3'>
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    insight.severity === 'critical' && 'bg-red-500/20',
                    insight.severity === 'warning' && 'bg-yellow-500/20',
                    insight.severity === 'success' && 'bg-green-500/20',
                    insight.severity === 'info' && 'bg-terra-cyan/20'
                  )}
                >
                  {getTypeIcon(insight.type)}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h4 className='text-sm font-semibold text-white'>{insight.title}</h4>
                        <Badge variant='outline' className='text-xs capitalize'>
                          {insight.type}
                        </Badge>
                      </div>
                      <p className='text-xs text-slate-400 mb-2'>{insight.description}</p>
                    </div>

                    {insight.actionable && (
                      <Badge variant='quantum' className='ml-2 quantum-pulse'>
                        <Zap className='w-3 h-3 mr-1' />
                        Action
                      </Badge>
                    )}
                  </div>

                  <div className='flex items-center gap-4 text-xs'>
                    <div className='flex items-center gap-1'>
                      <Brain className='w-3 h-3 text-slate-400' />
                      <span className='text-slate-400'>
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Target className='w-3 h-3 text-slate-400' />
                      <span className='text-slate-400'>
                        Impact: {insight.impact.value > 0 ? '+' : ''}
                        {insight.impact.value} {insight.impact.unit}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <CheckCircle className='w-3 h-3 text-slate-400' />
                      <span className='text-slate-400'>
                        {insight.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className='terra-glass border border-terra-cyan/20'>
        <CardContent className='p-4'>
          <div className='flex items-center gap-2 text-sm text-slate-400'>
            <Sparkles className='w-4 h-4 text-terra-cyan' />
            <span>
              AI analyzed {insights.length} insights with average{' '}
              {(
                (insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length) *
                100
              ).toFixed(1)}
              % confidence. Quantum optimization factor: 949. Government. Transcended.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsightsPanel;
