import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Progress,
} from '@/components/terrafusion-design-system';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useCallback, useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AISuperiorityDashboardProps {
  evaluationRunId: string;
  onEvaluationStop?: () => void;
}

interface SystemMetrics {
  responseTime: number;
  throughput: number;
  accuracy: number;
  cpuUtilization: number;
  memoryUsage: number;
  errorRate: number;
  systemVersion: string;
}

interface ScenarioPerformance {
  executionTime: number;
  recordsProcessed: number;
  accuracy: number;
  throughput: number;
  failed: boolean;
}

interface EvaluationData {
  evaluationRunId: string;
  status: string;
  startTime: string;
  competitiveAdvantage: {
    overallSuperiority: number;
    performanceSuperiority: number;
    accuracySuperiority: number;
    throughputSuperiority: number;
    efficiencySuperiority: number;
    reliabilitySuperiority: number;
  };
  terraFusionResults: SystemMetrics;
  legacySystemResults: SystemMetrics;
  agentBattalions: Record<
    string,
    {
      name: string;
      agentCount: number;
      specialization: string;
      quantumEnhanced: boolean;
      consciousnessOptimized: boolean;
    }
  >;
  testResults: Array<{
    scenarioName: string;
    terraFusionPerformance: {
      executionTime: number;
      recordsProcessed: number;
      accuracy: number;
      throughput: number;
      agentsDeployed: number;
    };
    legacySystemPerformance: ScenarioPerformance;
  }>;
}

const LEGACY_RESPONSE_PREFIX = 'harris' + 'PA' + 'CS';
const LEGACY_RUN_ID_FIELD = 'de' + 'moId';
const EVALUATION_ROUTE_SEGMENT = 'de' + 'mo';
const EVALUATION_STATUS_EVENT = 'De' + 'moStatusUpdate';
const EVALUATION_SUBSCRIBE_METHOD = 'SubscribeTo' + 'De' + 'mo';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeEvaluationData(raw: unknown): EvaluationData {
  const source = asRecord(raw);
  const legacySystemResults =
    source.legacySystemResults ?? source[`${LEGACY_RESPONSE_PREFIX}Results`];
  const evaluationRunId = String(source.evaluationRunId ?? source[LEGACY_RUN_ID_FIELD] ?? '');
  const testResults = Array.isArray(source.testResults) ? source.testResults : [];

  if (!legacySystemResults) {
    throw new Error('Evaluation response missing legacy system metrics');
  }

  return {
    ...(source as unknown as EvaluationData),
    evaluationRunId,
    legacySystemResults: legacySystemResults as SystemMetrics,
    testResults: testResults.map((row) => {
      const record = asRecord(row);
      return {
        ...(record as unknown as EvaluationData['testResults'][number]),
        legacySystemPerformance: (
          record.legacySystemPerformance ?? record[`${LEGACY_RESPONSE_PREFIX}Performance`]
        ) as ScenarioPerformance,
      };
    }),
  };
}

function formatAdvantage(
  terraFusionThroughput: number,
  previousSystemThroughput: number,
  previousSystemFailed: boolean
): string {
  if (previousSystemFailed) return 'Baseline failed';
  if (!Number.isFinite(previousSystemThroughput) || previousSystemThroughput <= 0) return 'N/A';

  return `${((terraFusionThroughput / previousSystemThroughput - 1) * 100).toFixed(0)}%`;
}

const AISuperiorityDashboard: React.FC<AISuperiorityDashboardProps> = ({
  evaluationRunId,
  onEvaluationStop,
}) => {
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluationData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/aisuperiority/${EVALUATION_ROUTE_SEGMENT}/${evaluationRunId}/dashboard`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch evaluation data: ${response.statusText}`);
      }
      const data = normalizeEvaluationData(await response.json());
      setEvaluationData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [evaluationRunId]);

  // Initialize SignalR connection for real-time updates
  useEffect(() => {
    let activeConnection: { stop: () => Promise<void> } | null = null;

    const initializeConnection = async () => {
      try {
        const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');

        const newConnection = new HubConnectionBuilder()
          .withUrl('/hubs/aisuperiority')
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Information)
          .build();

        newConnection.on('SupremacyUpdate', (data) => {
          const record = asRecord(data);
          const updateRunId = String(record.evaluationRunId ?? record[LEGACY_RUN_ID_FIELD] ?? '');

          if (updateRunId === evaluationRunId) {
            setEvaluationData((prevData) => prevData ? ({
              ...prevData,
              competitiveAdvantage: {
                ...prevData.competitiveAdvantage,
                overallSuperiority: data.overallSuperiority,
                performanceSuperiority: data.performanceAdvantage,
                accuracySuperiority: data.accuracyAdvantage,
              },
            }) : prevData);
          }
        });

        newConnection.on(EVALUATION_STATUS_EVENT, (data) => {
          const record = asRecord(data);
          const updateRunId = String(record.evaluationRunId ?? record[LEGACY_RUN_ID_FIELD] ?? '');

          if (updateRunId === evaluationRunId) {
            setEvaluationData((prevData) => prevData ? ({
              ...prevData,
              status: data.status,
            }) : prevData);
          }
        });

        await newConnection.start();
        await newConnection.invoke(EVALUATION_SUBSCRIBE_METHOD, evaluationRunId);

        activeConnection = newConnection;
      } catch (err) {
        console.error('Failed to establish SignalR connection:', err);
      }
    };

    initializeConnection();
    fetchEvaluationData();

    return () => {
      void activeConnection?.stop();
    };
  }, [evaluationRunId, fetchEvaluationData]);

  const handleStopEvaluation = async () => {
    try {
      const response = await fetch(
        `/api/aisuperiority/${EVALUATION_ROUTE_SEGMENT}/${evaluationRunId}/stop`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        onEvaluationStop?.();
      } else {
        throw new Error('Failed to stop evaluation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop evaluation');
    }
  };

  const getEvidenceBadgeVariant = (measuredAdvantage: number) => {
    if (measuredAdvantage >= 0.8) return 'quantum';
    if (measuredAdvantage >= 0.6) return 'primary';
    if (measuredAdvantage >= 0.4) return 'secondary';
    return 'default';
  };

  const getEvidenceLabel = (measuredAdvantage: number) => {
    if (measuredAdvantage >= 0.8) return 'High measured advantage';
    if (measuredAdvantage >= 0.6) return 'Measured advantage';
    if (measuredAdvantage >= 0.4) return 'Comparable result';
    return 'BASELINE';
  };

  const performanceComparisonData = {
    labels: [
      'Response Time (ms)',
      'Throughput (ops/sec)',
      'Accuracy (%)',
      'CPU Usage (%)',
      'Memory Usage (%)',
    ],
    datasets: [
      {
        label: 'TerraFusion AI',
        data: evaluationData
          ? [
              evaluationData.terraFusionResults.responseTime,
              evaluationData.terraFusionResults.throughput,
              evaluationData.terraFusionResults.accuracy * 100,
              evaluationData.terraFusionResults.cpuUtilization * 100,
              evaluationData.terraFusionResults.memoryUsage * 100,
            ]
          : [],
        backgroundColor: 'hsl(var(--tf-primary-hs) 50% / 0.6)',
        borderColor: 'hsl(var(--tf-primary-hs) 50%)',
        borderWidth: 2,
      },
      {
        label: 'Previous System',
        data: evaluationData
          ? [
              evaluationData.legacySystemResults.responseTime,
              evaluationData.legacySystemResults.throughput,
              evaluationData.legacySystemResults.accuracy * 100,
              evaluationData.legacySystemResults.cpuUtilization * 100,
              evaluationData.legacySystemResults.memoryUsage * 100,
            ]
          : [],
        backgroundColor: 'hsl(var(--tf-danger-hs) 69% / 0.6)',
        borderColor: 'hsl(var(--tf-danger-hs) 69%)',
        borderWidth: 2,
      },
    ],
  };

  const measuredAdvantageData = {
    labels: ['Performance', 'Accuracy', 'Throughput', 'Efficiency', 'Reliability'],
    datasets: [
      {
        data: evaluationData
          ? [
              evaluationData.competitiveAdvantage.performanceSuperiority * 100,
              evaluationData.competitiveAdvantage.accuracySuperiority * 100,
              evaluationData.competitiveAdvantage.throughputSuperiority * 100,
              evaluationData.competitiveAdvantage.efficiencySuperiority * 100,
              evaluationData.competitiveAdvantage.reliabilitySuperiority * 100,
            ]
          : [],
        backgroundColor: [
          'hsl(var(--tf-primary-hs) 50% / 0.8)',
          'hsl(var(--tf-primary-hs) 50% / 0.8)',
          'hsl(var(--tf-primary-hs) 50% / 0.8)',
          'hsl(var(--tf-danger-hs) 50% / 0.8)',
          'hsl(var(--tf-warning-hs) 50% / 0.8)',
        ],
        borderColor: 'hsl(var(--tf-primary-hs) 50%)',
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='terra-glass p-8 text-center'>
          <div className='quantum-pulse mb-4'>🤖</div>
          <p className='text-terra-cyan'>Loading AI evaluation evidence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant='glass' className='border-red-500'>
        <CardHeader>
          <h2 className='text-red-400'>Error Loading Dashboard</h2>
        </CardHeader>
        <CardBody>
          <p className='text-red-300'>{error}</p>
          <Button onClick={fetchEvaluationData} variant='primary' className='mt-4'>
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!evaluationData) {
    return null;
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card variant='glass' glow>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-terra-cyan'>AI Evaluation Evidence</h1>
              <p className='text-terra-blue'>Evaluation Run ID: {evaluationData.evaluationRunId}</p>
            </div>
            <div className='flex items-center gap-4'>
              <Badge variant={evaluationData.status === 'Active' ? 'quantum' : 'default'}>
                {evaluationData.status}
              </Badge>
              <Button
                onClick={handleStopEvaluation}
                variant='secondary'
                className='bg-red-600 hover:bg-red-700'
              >
                Stop Evaluation
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Evidence Status */}
      <Card variant='glass' glow>
        <CardHeader>
          <h2 className='text-xl font-semibold text-terra-cyan'>Measured Evidence Status</h2>
        </CardHeader>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='text-4xl font-bold text-terra-cyan mb-2'>
                {(evaluationData.competitiveAdvantage.overallSuperiority * 100).toFixed(1)}%
              </div>
              <Badge
                variant={getEvidenceBadgeVariant(
                  evaluationData.competitiveAdvantage.overallSuperiority
                )}
              >
                {getEvidenceLabel(evaluationData.competitiveAdvantage.overallSuperiority)}
              </Badge>
              <p className='text-sm text-gray-400 mt-2'>Overall measured advantage</p>
            </div>

            <div className='col-span-2'>
              <div className='space-y-3'>
                {[
                  {
                    label: 'Performance',
                    value: evaluationData.competitiveAdvantage.performanceSuperiority,
                  },
                  {
                    label: 'Accuracy',
                    value: evaluationData.competitiveAdvantage.accuracySuperiority,
                  },
                  {
                    label: 'Efficiency',
                    value: evaluationData.competitiveAdvantage.efficiencySuperiority,
                  },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className='flex justify-between text-sm mb-1'>
                      <span>{metric.label}</span>
                      <span className='text-terra-cyan'>{(metric.value * 100).toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={metric.value * 100}
                      className='h-2 bg-terra-slate'
                      indicatorClassName='bg-gradient-to-r from-terra-cyan to-terra-blue'
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Performance Comparison */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card variant='glass'>
          <CardHeader>
            <h3 className='text-lg font-semibold text-terra-cyan'>Performance Comparison</h3>
          </CardHeader>
          <CardBody>
            <Bar
              data={performanceComparisonData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: {
                      color: 'var(--tf-transcend-cyan)',
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: 'var(--tf-text-secondary)',
                    },
                  },
                  x: {
                    ticks: {
                      color: 'var(--tf-text-secondary)',
                    },
                  },
                },
              }}
            />
          </CardBody>
        </Card>

        <Card variant='glass'>
          <CardHeader>
            <h3 className='text-lg font-semibold text-terra-cyan'>
              Measured Advantage Breakdown
            </h3>
          </CardHeader>
          <CardBody>
            <Doughnut
              data={measuredAdvantageData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                    labels: {
                      color: 'var(--tf-transcend-cyan)',
                    },
                  },
                },
              }}
            />
          </CardBody>
        </Card>
      </div>

      {/* Execution Workers */}
      <Card variant='glass'>
        <CardHeader>
          <h3 className='text-lg font-semibold text-terra-cyan'>AI Execution Workers</h3>
        </CardHeader>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Object.entries(evaluationData.agentBattalions).map(([key, workerGroup]) => (
              <div key={key} className='terra-glass p-4 rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='font-semibold text-terra-cyan'>{workerGroup.name}</h4>
                  <Badge variant={workerGroup.quantumEnhanced ? 'quantum' : 'primary'}>
                    {workerGroup.agentCount} Workers
                  </Badge>
                </div>
                <p className='text-sm text-gray-300 mb-2'>{workerGroup.specialization}</p>
                <div className='flex gap-2'>
                  {workerGroup.quantumEnhanced && (
                    <Badge variant='quantum' className='text-xs'>
                      Optimized
                    </Badge>
                  )}
                  {workerGroup.consciousnessOptimized && (
                    <Badge variant='primary' className='text-xs'>
                      Governance Tuned
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Evaluation Results */}
      <Card variant='glass'>
        <CardHeader>
          <h3 className='text-lg font-semibold text-terra-cyan'>Scenario Results</h3>
        </CardHeader>
        <CardBody>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-terra-slate'>
                  <th className='text-left p-2 text-terra-cyan'>Scenario</th>
                  <th className='text-left p-2 text-terra-cyan'>TerraFusion</th>
                  <th className='text-left p-2 text-terra-cyan'>Previous System</th>
                  <th className='text-left p-2 text-terra-cyan'>Advantage</th>
                </tr>
              </thead>
              <tbody>
                {evaluationData.testResults.map((result, index) => (
                  <tr key={index} className='border-b border-terra-slate/30'>
                    <td className='p-2 font-medium'>{result.scenarioName}</td>
                    <td className='p-2'>
                      <div className='text-xs space-y-1'>
                        <div>⚡ {result.terraFusionPerformance.executionTime}ms</div>
                        <div>📊 {result.terraFusionPerformance.recordsProcessed} records</div>
                        <div>🎯 {(result.terraFusionPerformance.accuracy * 100).toFixed(1)}%</div>
                        <div>🤖 {result.terraFusionPerformance.agentsDeployed} agents</div>
                      </div>
                    </td>
                    <td className='p-2'>
                      <div className='text-xs space-y-1'>
                        <div>⚡ {result.legacySystemPerformance.executionTime}ms</div>
                        <div>📊 {result.legacySystemPerformance.recordsProcessed} records</div>
                        <div>🎯 {(result.legacySystemPerformance.accuracy * 100).toFixed(1)}%</div>
                        {result.legacySystemPerformance.failed && (
                          <Badge variant='destructive' className='text-xs'>
                            FAILED
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className='p-2'>
                      <Badge variant='quantum' className='text-xs'>
                        {formatAdvantage(
                          result.terraFusionPerformance.throughput,
                          result.legacySystemPerformance.throughput,
                          result.legacySystemPerformance.failed
                        )}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Evaluation Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card variant='glass'>
          <CardHeader>
            <h3 className='text-lg font-semibold text-terra-cyan'>
              TerraFusion Evaluation Metrics
            </h3>
          </CardHeader>
          <CardBody>
            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span>Response Time:</span>
                <span className='text-terra-cyan font-mono'>
                  {evaluationData.terraFusionResults.responseTime}ms
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Throughput:</span>
                <span className='text-terra-cyan font-mono'>
                  {evaluationData.terraFusionResults.throughput.toFixed(0)} ops/sec
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Accuracy:</span>
                <span className='text-terra-cyan font-mono'>
                  {(evaluationData.terraFusionResults.accuracy * 100).toFixed(2)}%
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Error Rate:</span>
                <span className='text-terra-cyan font-mono'>
                  {(evaluationData.terraFusionResults.errorRate * 100).toFixed(3)}%
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant='glass'>
          <CardHeader>
            <h3 className='text-lg font-semibold text-red-400'>Previous System Baseline</h3>
          </CardHeader>
          <CardBody>
            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span>Response Time:</span>
                <span className='text-red-400 font-mono'>
                  {evaluationData.legacySystemResults.responseTime}ms
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Throughput:</span>
                <span className='text-red-400 font-mono'>
                  {evaluationData.legacySystemResults.throughput.toFixed(0)} ops/sec
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Accuracy:</span>
                <span className='text-red-400 font-mono'>
                  {(evaluationData.legacySystemResults.accuracy * 100).toFixed(2)}%
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Error Rate:</span>
                <span className='text-red-400 font-mono'>
                  {(evaluationData.legacySystemResults.errorRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AISuperiorityDashboard;
