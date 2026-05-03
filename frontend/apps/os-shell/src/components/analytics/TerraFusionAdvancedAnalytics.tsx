/**
 * ═══════════════════════════════════════════════════════════════
 * ADVANCED ANALYTICS PIPELINE PLATFORM
 * Evidence-gated data processing and insight display.
 * ═══════════════════════════════════════════════════════════════
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useCallback, useEffect, useState } from 'react';

interface AnalyticsPipeline {
  id: string;
  name: string;
  type: 'STREAMING' | 'BATCH' | 'REAL_TIME' | 'ML_INFERENCE' | 'PREDICTIVE';
  status: 'ACTIVE' | 'PAUSED' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  dataSource: string;
  processingRate: number; // records per second
  totalProcessed: number;
  accuracy: number;
  latency: number; // milliseconds
  throughput: number; // MB/s
  cpuUsage: number;
  memoryUsage: number;
  lastUpdate: string;
}

interface DataVisualization {
  id: string;
  name: string;
  type: 'DASHBOARD' | 'CHART' | 'MAP' | 'GRAPH' | 'IMMERSIVE_3D' | 'AR_OVERLAY';
  category: 'FINANCIAL' | 'OPERATIONAL' | 'GEOGRAPHIC' | 'PERFORMANCE' | 'PREDICTIVE';
  refreshRate: number;
  dataPoints: number;
  interactivity: 'STATIC' | 'INTERACTIVE' | 'REAL_TIME' | 'IMMERSIVE';
  complexity: 'SIMPLE' | 'COMPLEX' | 'ADVANCED' | 'ELITE';
  users: number;
  lastAccessed: string;
}

interface GovernmentInsight {
  id: string;
  title: string;
  category:
    | 'REVENUE_OPTIMIZATION'
    | 'OPERATIONAL_EFFICIENCY'
    | 'CITIZEN_SERVICES'
    | 'COMPLIANCE'
    | 'PREDICTIVE_PLANNING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  impact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'TRANSFORMATIVE';
  description: string;
  actionItems: string[];
  estimatedValue: number;
  timeframe: string;
  aiGenerated: boolean;
}

interface AdvancedAnalyticsProps {
  className?: string;
}

export const TerraFusionAdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  className = '',
}) => {
  const [analyticsPipelines, setAnalyticsPipelines] = useState<AnalyticsPipeline[]>([]);
  const [dataVisualizations, setDataVisualizations] = useState<DataVisualization[]>([]);
  const [governmentInsights, setGovernmentInsights] = useState<GovernmentInsight[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState({
    totalPipelines: 0,
    activePipelines: 0,
    totalThroughput: 0,
    averageLatency: 0,
    insightsGenerated: 0,
    dataProcessed: 0,
  });

  const calculatePlatformMetrics = useCallback(
    (
      pipelines: AnalyticsPipeline[],
      visualizations: DataVisualization[],
      insights: GovernmentInsight[]
    ) => {
      const totalPipelines = pipelines.length;
      const activePipelines = pipelines.filter((p) => p.status === 'ACTIVE').length;
      const totalThroughput = pipelines.reduce((sum, pipeline) => sum + pipeline.throughput, 0);
      const averageLatency =
        pipelines.length > 0
          ? pipelines.reduce((sum, pipeline) => sum + pipeline.latency, 0) / pipelines.length
          : 0;
      const insightsGenerated = insights.length;
      const dataProcessed = pipelines.reduce((sum, pipeline) => sum + pipeline.totalProcessed, 0);

      setPlatformMetrics({
        totalPipelines,
        activePipelines,
        totalThroughput,
        averageLatency,
        insightsGenerated,
        dataProcessed,
      });
    },
    []
  );

  const initializeAnalyticsPlatform = useCallback(() => {
    setAnalyticsPipelines([]);
    setDataVisualizations([]);
    setGovernmentInsights([]);
    calculatePlatformMetrics([], [], []);
  }, [calculatePlatformMetrics]);

  useEffect(() => {
    initializeAnalyticsPlatform();
  }, [initializeAnalyticsPlatform]);

  const getPipelineTypeColor = (type: AnalyticsPipeline['type']) => {
    switch (type) {
      case 'STREAMING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'BATCH':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'REAL_TIME':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ML_INFERENCE':
        return 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30';
      case 'PREDICTIVE':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    }
  };

  const getStatusColor = (status: AnalyticsPipeline['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500 text-white';
      case 'PROCESSING':
        return 'bg-blue-500 text-white';
      case 'PAUSED':
        return 'bg-yellow-500 text-terra-midnight';
      case 'COMPLETED':
        return 'bg-terra-cyan text-terra-midnight';
      case 'ERROR':
        return 'bg-red-500 text-white';
    }
  };

  const getPriorityColor = (priority: GovernmentInsight['priority']) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
  };

  const getComplexityColor = (complexity: DataVisualization['complexity']) => {
    switch (complexity) {
      case 'SIMPLE':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'COMPLEX':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ADVANCED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ELITE':
        return 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30';
    }
  };

  const formatNumber = (num: number, type: 'currency' | 'number' | 'percentage' = 'number') => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
      case 'percentage':
        return `${num.toFixed(1)}%`;
      default:
        return num.toLocaleString();
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6 ${className}`}
    >
      {/* Analytics Header */}
      <div className='text-center mb-8'>
        <div className='flex items-center justify-center gap-6 mb-4'>
          <TerraSphere size='lg' variant='quantum' />
          <h1 className='text-4xl font-bold text-terra-cyan glow-text'>
            Advanced Analytics Platform
          </h1>
        </div>
        <p className='text-lg text-terra-blue/80 mb-6'>
          Governed data processing and AI insight evidence
        </p>

        {/* Platform Metrics Overview */}
        <div className='flex justify-center gap-8 mb-8'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-terra-cyan'>
              {platformMetrics.totalPipelines}
            </div>
            <div className='text-sm text-terra-blue/70'>Total Pipelines</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-400'>
              {platformMetrics.activePipelines}
            </div>
            <div className='text-sm text-terra-blue/70'>Active Pipelines</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-blue-400'>
              {platformMetrics.totalThroughput.toFixed(1)} MB/s
            </div>
            <div className='text-sm text-terra-blue/70'>Total Throughput</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-400'>
              {platformMetrics.insightsGenerated}
            </div>
            <div className='text-sm text-terra-blue/70'>AI Insights</div>
          </div>
        </div>
      </div>

      {/* Analytics Pipelines */}
      <div className='mb-8'>
        <h2 className='text-2xl font-semibold text-terra-cyan mb-4 flex items-center gap-3'>
          <TerraSphere size='sm' variant='pulse' />
          Analytics Pipelines
        </h2>
        <div className='grid gap-4'>
          {analyticsPipelines.length === 0 ? (
            <Card className='terra-glass border-terra-cyan/20'>
              <CardBody className='text-terra-blue/80'>
                No analytics pipelines are displayed because no governed pipeline registry has returned evidence.
              </CardBody>
            </Card>
          ) : analyticsPipelines.map((pipeline) => (
            <Card key={pipeline.id} className='terra-glass border-terra-cyan/20'>
              <CardBody className='space-y-4'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='text-lg font-semibold text-terra-cyan mb-1'>{pipeline.name}</h3>
                    <div className='flex gap-2 mb-2'>
                      <Badge className={getPipelineTypeColor(pipeline.type)} variant='outline'>
                        {pipeline.type}
                      </Badge>
                      <Badge className={getStatusColor(pipeline.status)} variant='secondary'>
                        {pipeline.status}
                      </Badge>
                    </div>
                    <div className='text-sm text-terra-blue/70'>{pipeline.dataSource}</div>
                  </div>
                  <div className='text-right text-sm'>
                    <div className='text-terra-blue/70'>Accuracy</div>
                    <div className='text-green-400 font-semibold'>
                      {pipeline.accuracy.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 lg:grid-cols-6 gap-4 text-sm'>
                  <div>
                    <div className='text-terra-blue/70'>Processing Rate</div>
                    <div className='text-lg font-semibold text-terra-cyan'>
                      {formatNumber(pipeline.processingRate)}/s
                    </div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Total Processed</div>
                    <div className='text-lg font-semibold text-blue-400'>
                      {formatNumber(pipeline.totalProcessed)}
                    </div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Latency</div>
                    <div className='text-terra-blue'>{pipeline.latency.toFixed(1)}ms</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Throughput</div>
                    <div className='text-terra-blue'>{pipeline.throughput.toFixed(1)} MB/s</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>CPU Usage</div>
                    <div className='text-orange-400'>{pipeline.cpuUsage.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Memory</div>
                    <div className='text-purple-400'>{pipeline.memoryUsage.toFixed(1)}%</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-terra-blue/70'>CPU Usage</span>
                      <span className='text-orange-400'>{pipeline.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={pipeline.cpuUsage} className='h-2' />
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-terra-blue/70'>Memory Usage</span>
                      <span className='text-purple-400'>{pipeline.memoryUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={pipeline.memoryUsage} className='h-2' />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Visualizations */}
      <div className='mb-8'>
        <h2 className='text-2xl font-semibold text-terra-cyan mb-4 flex items-center gap-3'>
          <TerraSphere size='sm' variant='glow' />
          Data Visualizations
        </h2>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {dataVisualizations.length === 0 ? (
            <Card className='terra-glass border-terra-cyan/20'>
              <CardBody className='text-terra-blue/80'>
                No data visualizations are displayed because no governed visualization registry has returned evidence.
              </CardBody>
            </Card>
          ) : dataVisualizations.map((viz) => (
            <Card key={viz.id} className='terra-glass border-terra-cyan/20'>
              <CardHeader className='pb-3'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='text-lg font-semibold text-terra-cyan mb-1'>{viz.name}</h3>
                    <div className='flex gap-2 mb-2'>
                      <Badge
                        className='bg-blue-500/20 text-blue-300 border-blue-500/30'
                        variant='outline'
                      >
                        {viz.type}
                      </Badge>
                      <Badge className={getComplexityColor(viz.complexity)} variant='outline'>
                        {viz.complexity}
                      </Badge>
                    </div>
                  </div>
                  <div className='text-right text-sm'>
                    <div className='text-terra-blue/70'>Users</div>
                    <div className='text-terra-cyan font-semibold'>{viz.users}</div>
                  </div>
                </div>
              </CardHeader>
              <CardBody className='space-y-3'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <div className='text-terra-blue/70'>Category</div>
                    <div className='text-terra-blue'>{viz.category}</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Refresh Rate</div>
                    <div className='text-green-400'>{viz.refreshRate}s</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Data Points</div>
                    <div className='text-blue-400'>{formatNumber(viz.dataPoints)}</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Interactivity</div>
                    <div className='text-purple-400'>{viz.interactivity}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Government Insights */}
      <Card className='terra-glass border-terra-cyan/20'>
        <CardHeader>
          <h2 className='text-2xl font-semibold text-terra-cyan flex items-center gap-3'>
            <TerraSphere size='sm' variant='quantum' />
            Governed Government Insights
          </h2>
          <p className='text-terra-blue/70'>
            AI guidance appears only with confidence, uncertainty, provenance, and action evidence.
          </p>
        </CardHeader>
        <CardBody>
          <div className='space-y-4'>
            {governmentInsights.length === 0 ? (
              <div className='terra-glass p-4 rounded-lg border border-terra-cyan/10 text-terra-blue/80'>
                No AI insights are displayed because no governed guidance endpoint has returned evidence.
              </div>
            ) : governmentInsights.map((insight) => (
              <div
                key={insight.id}
                className='terra-glass p-4 rounded-lg border border-terra-cyan/10'
              >
                <div className='flex justify-between items-start mb-3'>
                  <div className='flex items-center gap-3'>
                    <h3 className='text-lg font-semibold text-terra-cyan'>{insight.title}</h3>
                    <Badge className={getPriorityColor(insight.priority)} variant='outline'>
                      {insight.priority}
                    </Badge>
                    {insight.aiGenerated && (
                      <Badge
                        className='bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30'
                        variant='outline'
                      >
                        AI GENERATED
                      </Badge>
                    )}
                  </div>
                  <div className='text-right text-sm'>
                    <div className='text-terra-blue/70'>Confidence</div>
                    <div className='text-terra-cyan font-semibold'>
                      {insight.confidence.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <p className='text-terra-blue/80 mb-4'>{insight.description}</p>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 text-sm'>
                  <div>
                    <div className='text-terra-blue/70'>Impact Level</div>
                    <div className='text-lg font-semibold text-green-400'>{insight.impact}</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Estimated Value</div>
                    <div className='text-lg font-semibold text-terra-cyan'>
                      {formatNumber(insight.estimatedValue, 'currency')}
                    </div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Timeframe</div>
                    <div className='text-terra-blue'>{insight.timeframe}</div>
                  </div>
                </div>

                <div>
                  <div className='text-terra-blue/70 text-sm mb-2'>Recommended Actions:</div>
                  <div className='grid gap-2'>
                    {insight.actionItems.map((action, index) => (
                      <div key={index} className='flex items-center gap-2 text-sm'>
                        <div className='w-2 h-2 rounded-full bg-terra-cyan'></div>
                        <span className='text-terra-blue/80'>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='mt-3'>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-terra-blue/70'>AI Confidence Level</span>
                    <span className='text-terra-cyan'>{insight.confidence.toFixed(1)}%</span>
                  </div>
                  <Progress value={insight.confidence} className='h-2' />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TerraFusionAdvancedAnalytics;
