/**
 * TerraFusion System Integration Evidence
 * Governed platform telemetry display. Empty state is intentional until evidence exists.
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useState } from 'react';

interface PlatformStatus {
  id: string;
  name: string;
  category:
    | 'AI_PLATFORM'
    | 'QUANTUM_PLATFORM'
    | 'ANALYTICS_PLATFORM'
    | 'EDGE_PLATFORM'
    | 'BLOCKCHAIN_PLATFORM'
    | 'ML_PLATFORM';
  status: 'OPTIMAL' | 'EXCELLENT' | 'GOOD' | 'DEGRADED' | 'CRITICAL';
  performance: number;
  uptime: number;
  throughput: number;
  latency: number;
  accuracy: number;
  quantumEnhanced: boolean;
  agents: number;
  lastOptimization: string;
  criticalMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    networkLatency: number;
    errorRate: number;
  };
}

interface SystemIntegrationMetrics {
  totalPlatforms: number;
  optimalPlatforms: number;
  averagePerformance: number;
  systemUptime: number;
  totalThroughput: number;
  averageLatency: number;
  totalAgents: number;
  quantumEnhancedPlatforms: number;
  criticalIssues: number;
  optimizationOpportunities: number;
}

interface OptimizationTask {
  id: string;
  platform: string;
  task: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'PERFORMANCE' | 'SCALABILITY' | 'RELIABILITY' | 'SECURITY' | 'OPTIMIZATION';
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  estimatedCompletion: number;
  impact: 'SYSTEM_WIDE' | 'PLATFORM_SPECIFIC' | 'COMPONENT_LEVEL';
  description: string;
}

interface SystemIntegrationProps {
  className?: string;
}

const emptyMetrics: SystemIntegrationMetrics = {
  totalPlatforms: 0,
  optimalPlatforms: 0,
  averagePerformance: 0,
  systemUptime: 0,
  totalThroughput: 0,
  averageLatency: 0,
  totalAgents: 0,
  quantumEnhancedPlatforms: 0,
  criticalIssues: 0,
  optimizationOpportunities: 0,
};

export const TerraFusionSystemIntegration: React.FC<SystemIntegrationProps> = ({
  className = '',
}) => {
  const [platforms] = useState<PlatformStatus[]>([]);
  const [systemMetrics] = useState<SystemIntegrationMetrics>(emptyMetrics);
  const [optimizationTasks] = useState<OptimizationTask[]>([]);
  const [actionMessage, setActionMessage] = useState(
    'Governed platform telemetry endpoint is not configured'
  );

  const getStatusColor = (status: PlatformStatus['status']) => {
    switch (status) {
      case 'OPTIMAL':
        return 'bg-terra-cyan text-terra-midnight';
      case 'EXCELLENT':
        return 'bg-green-500 text-white';
      case 'GOOD':
        return 'bg-blue-500 text-white';
      case 'DEGRADED':
        return 'bg-yellow-500 text-terra-midnight';
      case 'CRITICAL':
        return 'bg-red-500 text-white';
    }
  };

  const getCategoryColor = (category: PlatformStatus['category']) => {
    switch (category) {
      case 'AI_PLATFORM':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'QUANTUM_PLATFORM':
        return 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30';
      case 'ML_PLATFORM':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'BLOCKCHAIN_PLATFORM':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'ANALYTICS_PLATFORM':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'EDGE_PLATFORM':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    }
  };

  const getPriorityColor = (priority: OptimizationTask['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'LOW':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTaskStatusColor = (status: OptimizationTask['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-terra-cyan text-terra-midnight';
      case 'IN_PROGRESS':
        return 'bg-blue-500 text-white';
      case 'QUEUED':
        return 'bg-yellow-500 text-terra-midnight';
      case 'FAILED':
        return 'bg-red-500 text-white';
    }
  };

  const requestOptimization = () => {
    setActionMessage(
      'Optimization blocked: governed Pilot execution and platform telemetry evidence are required'
    );
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6 ${className}`}
    >
      <div className='text-center mb-8'>
        <div className='flex items-center justify-center gap-6 mb-4'>
          <TerraSphere size='lg' variant='quantum' />
          <h1 className='text-4xl font-bold text-terra-cyan glow-text'>
            System Integration Evidence
          </h1>
        </div>
        <p className='text-lg text-terra-blue/80 mb-3'>
          Platform status, optimization tasks, and system metrics require governed telemetry.
        </p>
        <p className='text-sm text-terra-blue/70'>{actionMessage}</p>

        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8 mb-8'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-terra-cyan'>
              {systemMetrics.optimalPlatforms}/{systemMetrics.totalPlatforms}
            </div>
            <div className='text-sm text-terra-blue/70'>Platforms Verified</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-400'>
              {systemMetrics.averagePerformance.toFixed(1)}%
            </div>
            <div className='text-sm text-terra-blue/70'>Avg Performance</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-blue-400'>
              {systemMetrics.systemUptime.toFixed(2)}%
            </div>
            <div className='text-sm text-terra-blue/70'>System Uptime</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-400'>
              {(systemMetrics.totalThroughput / 1000).toFixed(0)}K
            </div>
            <div className='text-sm text-terra-blue/70'>Throughput/s</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-orange-400'>
              {systemMetrics.totalAgents.toLocaleString()}
            </div>
            <div className='text-sm text-terra-blue/70'>Source-Backed Agents</div>
          </div>
        </div>
      </div>

      <div className='mb-8'>
        <h2 className='text-2xl font-semibold text-terra-cyan mb-4 flex items-center gap-3'>
          <TerraSphere size='sm' variant='pulse' />
          Platform Status Matrix
        </h2>
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
          {platforms.length === 0 ? (
            <Card className='terra-glass border-terra-cyan/20 xl:col-span-3'>
              <CardBody className='text-terra-blue/80'>
                No platform statuses are displayed because no governed integration telemetry feed
                has returned platform health, latency, throughput, accuracy, and resource evidence.
              </CardBody>
            </Card>
          ) : (
            platforms.map((platform) => (
              <Card key={platform.id} className='terra-glass border-terra-cyan/20'>
                <CardHeader className='pb-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <h3 className='text-lg font-semibold text-terra-cyan mb-1'>
                        {platform.name}
                      </h3>
                      <div className='flex gap-2 mb-2'>
                        <Badge className={getCategoryColor(platform.category)} variant='outline'>
                          {platform.category}
                        </Badge>
                        <Badge className={getStatusColor(platform.status)} variant='secondary'>
                          {platform.status}
                        </Badge>
                      </div>
                    </div>
                    <div className='text-right text-sm'>
                      <div className='text-terra-blue/70'>Agents</div>
                      <div className='text-terra-cyan font-semibold'>
                        {platform.agents.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <div className='text-terra-blue/70'>Throughput</div>
                      <div className='text-lg font-semibold text-green-400'>
                        {(platform.throughput / 1000).toFixed(0)}K/s
                      </div>
                    </div>
                    <div>
                      <div className='text-terra-blue/70'>Latency</div>
                      <div className='text-lg font-semibold text-blue-400'>
                        {platform.latency.toFixed(1)}ms
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-terra-blue/70'>Performance Score</span>
                      <span className='text-terra-cyan'>{platform.performance.toFixed(1)}%</span>
                    </div>
                    <Progress value={platform.performance} className='h-3' />
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>

      <Card className='terra-glass border-terra-cyan/20'>
        <CardHeader>
          <h2 className='text-2xl font-semibold text-terra-cyan flex items-center gap-3'>
            <TerraSphere size='sm' variant='quantum' />
            Governed Optimization Pipeline
          </h2>
          <p className='text-terra-blue/70'>
            Optimization work is shown only when backed by Pilot-governed task evidence.
          </p>
        </CardHeader>
        <CardBody>
          <div className='space-y-4'>
            {optimizationTasks.length === 0 ? (
              <div className='terra-glass p-4 rounded-lg border border-terra-cyan/10 text-terra-blue/80'>
                No optimization tasks are displayed because no governed task queue has returned
                task id, platform, priority, status, progress, and evidence references.
              </div>
            ) : (
              optimizationTasks.map((task) => (
                <div
                  key={task.id}
                  className='terra-glass p-4 rounded-lg border border-terra-cyan/10'
                >
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex items-center gap-3'>
                      <h3 className='text-lg font-semibold text-terra-cyan'>{task.task}</h3>
                      <Badge className={getPriorityColor(task.priority)} variant='outline'>
                        {task.priority}
                      </Badge>
                      <Badge className={getTaskStatusColor(task.status)} variant='secondary'>
                        {task.status}
                      </Badge>
                    </div>
                    <div className='text-right text-sm'>
                      <div className='text-terra-blue/70'>ETA</div>
                      <div className='text-terra-cyan font-semibold'>
                        {task.estimatedCompletion}min
                      </div>
                    </div>
                  </div>
                  <div className='text-sm text-terra-blue/70 mb-1'>Platform: {task.platform}</div>
                  <div className='text-terra-blue'>{task.description}</div>
                </div>
              ))
            )}
          </div>

          <div className='mt-6 text-center'>
            <Button
              variant='outline'
              className='px-8 py-3'
              onClick={requestOptimization}
            >
              <TerraSphere size='sm' variant='pulse' className='mr-2' />
              Request Governed Optimization
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TerraFusionSystemIntegration;
