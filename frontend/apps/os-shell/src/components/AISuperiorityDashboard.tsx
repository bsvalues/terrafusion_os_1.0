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
  demoId: string;
  onDemoStop?: () => void;
}

interface DemoData {
  demoId: string;
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
  terraFusionResults: {
    responseTime: number;
    throughput: number;
    accuracy: number;
    cpuUtilization: number;
    memoryUsage: number;
    errorRate: number;
    systemVersion: string;
  };
  harrisPACSResults: {
    responseTime: number;
    throughput: number;
    accuracy: number;
    cpuUtilization: number;
    memoryUsage: number;
    errorRate: number;
    systemVersion: string;
  };
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
    harrisPACSPerformance: {
      executionTime: number;
      recordsProcessed: number;
      accuracy: number;
      throughput: number;
      failed: boolean;
    };
  }>;
}

const AISuperiorityDashboard: React.FC<AISuperiorityDashboardProps> = ({ demoId, onDemoStop }) => {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<any>(null);

  // Fetch demo data
  const fetchDemoData = useCallback(async () => {
    try {
      const response = await fetch(`/api/aisuperiority/demo/${demoId}/dashboard`);
      if (!response.ok) {
        throw new Error(`Failed to fetch demo data: ${response.statusText}`);
      }
      const data = await response.json();
      setDemoData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  // Initialize SignalR connection for real-time updates
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');

        const newConnection = new HubConnectionBuilder()
          .withUrl('/hubs/aisuperiority')
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Information)
          .build();

        newConnection.on('SupremacyUpdate', (data) => {
          if (data.demoId === demoId) {
            setDemoData((prevData) => ({
              ...prevData!,
              competitiveAdvantage: {
                ...prevData!.competitiveAdvantage,
                overallSuperiority: data.overallSuperiority,
                performanceSuperiority: data.performanceAdvantage,
                accuracySuperiority: data.accuracyAdvantage,
              },
            }));
          }
        });

        newConnection.on('DemoStatusUpdate', (data) => {
          if (data.demoId === demoId) {
            setDemoData((prevData) => ({
              ...prevData!,
              status: data.status,
            }));
          }
        });

        await newConnection.start();
        await newConnection.invoke('SubscribeToDemo', demoId);

        setConnection(newConnection);
      } catch (err) {
        console.error('Failed to establish SignalR connection:', err);
      }
    };

    initializeConnection();
    fetchDemoData();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [demoId, fetchDemoData]);

  const handleStopDemo = async () => {
    try {
      const response = await fetch(`/api/aisuperiority/demo/${demoId}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        onDemoStop?.();
      } else {
        throw new Error('Failed to stop demonstration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop demo');
    }
  };

  const getSupremacyBadgeVariant = (superiority: number) => {
    if (superiority >= 0.8) return 'quantum';
    if (superiority >= 0.6) return 'primary';
    if (superiority >= 0.4) return 'secondary';
    return 'default';
  };

  const getSupremacyLabel = (superiority: number) => {
    if (superiority >= 0.8) return 'CHAMPIONSHIP';
    if (superiority >= 0.6) return 'SUPERIOR';
    if (superiority >= 0.4) return 'COMPETITIVE';
    return 'BASELINE';
  };

  // Chart configurations
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
        data: demoData
          ? [
              demoData.terraFusionResults.responseTime,
              demoData.terraFusionResults.throughput,
              demoData.terraFusionResults.accuracy * 100,
              demoData.terraFusionResults.cpuUtilization * 100,
              demoData.terraFusionResults.memoryUsage * 100,
            ]
          : [],
        backgroundColor: 'hsl(var(--tf-primary-hs) 50% / 0.6)',
        borderColor: 'hsl(var(--tf-primary-hs) 50%)',
        borderWidth: 2,
      },
      {
        label: 'Harris PACS v12.4.7',
        data: demoData
          ? [
              demoData.harrisPACSResults.responseTime,
              demoData.harrisPACSResults.throughput,
              demoData.harrisPACSResults.accuracy * 100,
              demoData.harrisPACSResults.cpuUtilization * 100,
              demoData.harrisPACSResults.memoryUsage * 100,
            ]
          : [],
        backgroundColor: 'hsl(var(--tf-danger-hs) 69% / 0.6)',
        borderColor: 'hsl(var(--tf-danger-hs) 69%)',
        borderWidth: 2,
      },
    ],
  };

  const supremacyData = {
    labels: ['Performance', 'Accuracy', 'Throughput', 'Efficiency', 'Reliability'],
    datasets: [
      {
        data: demoData
          ? [
              demoData.competitiveAdvantage.performanceSuperiority * 100,
              demoData.competitiveAdvantage.accuracySuperiority * 100,
              demoData.competitiveAdvantage.throughputSuperiority * 100,
              demoData.competitiveAdvantage.efficiencySuperiority * 100,
              demoData.competitiveAdvantage.reliabilitySuperiority * 100,
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
          <p className='text-terra-cyan'>Initializing AI Superiority Dashboard...</p>
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
          <Button onClick={fetchDemoData} variant='primary' className='mt-4'>
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!demoData) {
    return null;
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card variant='glass' glow>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-terra-cyan'>AI Superiority Demonstration</h1>
              <p className='text-terra-blue'>Demo ID: {demoData.demoId}</p>
            </div>
            <div className='flex items-center gap-4'>
              <Badge variant={demoData.status === 'Active' ? 'quantum' : 'default'}>
                {demoData.status}
              </Badge>
              <Button
                onClick={handleStopDemo}
                variant='secondary'
                className='bg-red-600 hover:bg-red-700'
              >
                Stop Demo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Championship Status */}
      <Card variant='glass' glow>
        <CardHeader>
          <h2 className='text-xl font-semibold text-terra-cyan'>🏆 Championship Status</h2>
        </CardHeader>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='text-4xl font-bold text-terra-cyan mb-2'>
                {(demoData.competitiveAdvantage.overallSuperiority * 100).toFixed(1)}%
              </div>
              <Badge
                variant={getSupremacyBadgeVariant(demoData.competitiveAdvantage.overallSuperiority)}
              >
                {getSupremacyLabel(demoData.competitiveAdvantage.overallSuperiority)}
              </Badge>
              <p className='text-sm text-gray-400 mt-2'>Overall Superiority</p>
            </div>

            <div className='col-span-2'>
              <div className='space-y-3'>
                {[
                  {
                    label: 'Performance',
                    value: demoData.competitiveAdvantage.performanceSuperiority,
                  },
                  { label: 'Accuracy', value: demoData.competitiveAdvantage.accuracySuperiority },
                  {
                    label: 'Efficiency',
                    value: demoData.competitiveAdvantage.efficiencySuperiority,
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
            <h3 className='text-lg font-semibold text-terra-cyan'>Superiority Breakdown</h3>
          </CardHeader>
          <CardBody>
            <Doughnut
              data={supremacyData}
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

      {/* AI Agent Battalions */}
      <Card variant='glass'>
        <CardHeader>
          <h3 className='text-lg font-semibold text-terra-cyan'>🤖 AI Agent Battalions</h3>
        </CardHeader>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Object.entries(demoData.agentBattalions).map(([key, battalion]) => (
              <div key={key} className='terra-glass p-4 rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='font-semibold text-terra-cyan'>{battalion.name}</h4>
                  <Badge variant={battalion.quantumEnhanced ? 'quantum' : 'primary'}>
                    {battalion.agentCount} Agents
                  </Badge>
                </div>
                <p className='text-sm text-gray-300 mb-2'>{battalion.specialization}</p>
                <div className='flex gap-2'>
                  {battalion.quantumEnhanced && (
                    <Badge variant='quantum' className='text-xs'>
                      Quantum
                    </Badge>
                  )}
                  {battalion.consciousnessOptimized && (
                    <Badge variant='primary' className='text-xs'>
                      Conscious
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Test Results */}
      <Card variant='glass'>
        <CardHeader>
          <h3 className='text-lg font-semibold text-terra-cyan'>📊 Test Scenario Results</h3>
        </CardHeader>
        <CardBody>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-terra-slate'>
                  <th className='text-left p-2 text-terra-cyan'>Scenario</th>
                  <th className='text-left p-2 text-terra-cyan'>TerraFusion</th>
                  <th className='text-left p-2 text-terra-cyan'>Harris PACS</th>
                  <th className='text-left p-2 text-terra-cyan'>Advantage</th>
                </tr>
              </thead>
              <tbody>
                {demoData.testResults.map((result, index) => (
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
                        <div>⚡ {result.harrisPACSPerformance.executionTime}ms</div>
                        <div>📊 {result.harrisPACSPerformance.recordsProcessed} records</div>
                        <div>🎯 {(result.harrisPACSPerformance.accuracy * 100).toFixed(1)}%</div>
                        {result.harrisPACSPerformance.failed && (
                          <Badge variant='destructive' className='text-xs'>
                            FAILED
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className='p-2'>
                      <Badge variant='quantum' className='text-xs'>
                        {result.harrisPACSPerformance.failed
                          ? '∞%'
                          : `${((result.terraFusionPerformance.throughput / result.harrisPACSPerformance.throughput - 1) * 100).toFixed(0)}%`}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Live Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card variant='glass'>
          <CardHeader>
            <h3 className='text-lg font-semibold text-terra-cyan'>🚀 TerraFusion AI Live</h3>
          </CardHeader>
          <CardBody>
            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span>Response Time:</span>
                <span className='text-terra-cyan font-mono'>
                  {demoData.terraFusionResults.responseTime}ms
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Throughput:</span>
                <span className='text-terra-cyan font-mono'>
                  {demoData.terraFusionResults.throughput.toFixed(0)} ops/sec
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Accuracy:</span>
                <span className='text-terra-cyan font-mono'>
                  {(demoData.terraFusionResults.accuracy * 100).toFixed(2)}%
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Error Rate:</span>
                <span className='text-terra-cyan font-mono'>
                  {(demoData.terraFusionResults.errorRate * 100).toFixed(3)}%
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant='glass'>
          <CardHeader>
            <h3 className='text-lg font-semibold text-red-400'>📉 Harris PACS Baseline</h3>
          </CardHeader>
          <CardBody>
            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span>Response Time:</span>
                <span className='text-red-400 font-mono'>
                  {demoData.harrisPACSResults.responseTime}ms
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Throughput:</span>
                <span className='text-red-400 font-mono'>
                  {demoData.harrisPACSResults.throughput.toFixed(0)} ops/sec
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Accuracy:</span>
                <span className='text-red-400 font-mono'>
                  {(demoData.harrisPACSResults.accuracy * 100).toFixed(2)}%
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Error Rate:</span>
                <span className='text-red-400 font-mono'>
                  {(demoData.harrisPACSResults.errorRate * 100).toFixed(1)}%
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
