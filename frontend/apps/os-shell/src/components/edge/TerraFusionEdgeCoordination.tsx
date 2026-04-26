/**
 * TerraFusion Edge Coordination Evidence
 * Edge nodes, IoT devices, and processing tasks require governed telemetry.
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useState } from 'react';

interface EdgeNode {
  id: string;
  name: string;
  type: 'EDGE_GATEWAY' | 'IOT_COORDINATOR' | 'PROCESSING_NODE' | 'QUANTUM_EDGE' | 'GOVERNMENT_EDGE';
  status: 'ONLINE' | 'OFFLINE' | 'PROCESSING' | 'MAINTENANCE' | 'SYNCING';
  location: string;
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  connectedDevices: number;
  processingLoad: number;
  quantumEnhanced: boolean;
  lastHeartbeat: string;
  capabilities: string[];
}

interface IoTDevice {
  id: string;
  name: string;
  type: 'SENSOR' | 'CAMERA' | 'ACTUATOR' | 'GATEWAY' | 'SMART_METER' | 'ENVIRONMENTAL_MONITOR';
  category: 'TRAFFIC' | 'ENVIRONMENTAL' | 'SECURITY' | 'UTILITY' | 'INFRASTRUCTURE' | 'EMERGENCY';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'MAINTENANCE';
  location: string;
  edgeNodeId: string;
  batteryLevel?: number;
  signalStrength: number;
  dataRate: number;
  lastUpdate: string;
  firmwareVersion: string;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'GOVERNMENT_GRADE';
}

interface EdgeProcessingTask {
  id: string;
  name: string;
  type:
    | 'DATA_ANALYSIS'
    | 'ML_INFERENCE'
    | 'REAL_TIME_PROCESSING'
    | 'QUANTUM_COMPUTATION'
    | 'AI_COORDINATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  assignedNode: string;
  progress: number;
  estimatedCompletion: number;
  resourceRequirements: {
    cpu: number;
    memory: number;
    networkBandwidth: number;
  };
  quantumAccelerated: boolean;
}

interface EdgeCoordinationProps {
  className?: string;
}

export const TerraFusionEdgeCoordination: React.FC<EdgeCoordinationProps> = ({
  className = '',
}) => {
  const [edgeNodes] = useState<EdgeNode[]>([]);
  const [iotDevices] = useState<IoTDevice[]>([]);
  const [processingTasks] = useState<EdgeProcessingTask[]>([]);

  const coordinationMetrics = {
    totalEdgeNodes: edgeNodes.length,
    activeNodes: edgeNodes.filter((node) => node.status === 'ONLINE' || node.status === 'PROCESSING')
      .length,
    totalDevices: iotDevices.length,
    activeDevices: iotDevices.filter((device) => device.status === 'ACTIVE').length,
    totalTasks: processingTasks.length,
    processingTasks: processingTasks.filter((task) => task.status === 'PROCESSING').length,
    averageLatency:
      edgeNodes.length > 0
        ? edgeNodes.reduce((sum, node) => sum + node.networkLatency, 0) / edgeNodes.length
        : 0,
    networkThroughput: iotDevices.reduce((sum, device) => sum + device.dataRate, 0),
  };

  const getNodeTypeColor = (type: EdgeNode['type']) => {
    switch (type) {
      case 'EDGE_GATEWAY':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'IOT_COORDINATOR':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PROCESSING_NODE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'QUANTUM_EDGE':
        return 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30';
      case 'GOVERNMENT_EDGE':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    }
  };

  const getStatusColor = (
    status: EdgeNode['status'] | IoTDevice['status'] | EdgeProcessingTask['status']
  ) => {
    switch (status) {
      case 'ONLINE':
      case 'ACTIVE':
        return 'bg-green-500 text-white';
      case 'PROCESSING':
        return 'bg-blue-500 text-white';
      case 'QUEUED':
      case 'SYNCING':
        return 'bg-yellow-500 text-terra-midnight';
      case 'COMPLETED':
        return 'bg-terra-cyan text-terra-midnight';
      case 'OFFLINE':
      case 'INACTIVE':
      case 'ERROR':
      case 'FAILED':
        return 'bg-red-500 text-white';
      case 'MAINTENANCE':
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6 ${className}`}
    >
      <div className='text-center mb-8'>
        <div className='flex items-center justify-center gap-6 mb-4'>
          <TerraSphere size='lg' variant='quantum' />
          <h1 className='text-4xl font-bold text-terra-cyan glow-text'>
            Edge Coordination Evidence
          </h1>
        </div>
        <p className='text-lg text-terra-blue/80 mb-6'>
          Edge nodes, devices, and processing tasks appear only from governed telemetry.
        </p>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-8'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-terra-cyan'>
              {coordinationMetrics.activeNodes}/{coordinationMetrics.totalEdgeNodes}
            </div>
            <div className='text-sm text-terra-blue/70'>Verified Nodes</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-400'>
              {coordinationMetrics.activeDevices}/{coordinationMetrics.totalDevices}
            </div>
            <div className='text-sm text-terra-blue/70'>Verified Devices</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-blue-400'>
              {coordinationMetrics.averageLatency.toFixed(1)}ms
            </div>
            <div className='text-sm text-terra-blue/70'>Average Latency</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-400'>
              {coordinationMetrics.networkThroughput.toFixed(0)}/min
            </div>
            <div className='text-sm text-terra-blue/70'>Message Throughput</div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        <Card className='terra-glass border-terra-cyan/20'>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-terra-cyan flex items-center gap-3'>
              <TerraSphere size='sm' variant='pulse' />
              Edge Nodes
            </h2>
          </CardHeader>
          <CardBody className='space-y-4'>
            {edgeNodes.length === 0 ? (
              <div className='text-terra-blue/80'>
                No edge nodes are displayed because no governed edge registry has returned node
                status, heartbeat, resource, and location evidence.
              </div>
            ) : (
              edgeNodes.map((node) => (
                <div key={node.id} className='terra-glass p-4 rounded-lg border border-terra-cyan/10'>
                  <div className='flex justify-between items-start mb-3'>
                    <div>
                      <h3 className='text-lg font-semibold text-terra-cyan'>{node.name}</h3>
                      <div className='text-sm text-terra-blue/70'>{node.location}</div>
                    </div>
                    <div className='flex gap-2'>
                      <Badge className={getNodeTypeColor(node.type)} variant='outline'>
                        {node.type}
                      </Badge>
                      <Badge className={getStatusColor(node.status)} variant='secondary'>
                        {node.status}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={node.processingLoad} className='h-2' />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className='terra-glass border-terra-green/20'>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-terra-green'>IoT Devices</h2>
          </CardHeader>
          <CardBody className='space-y-4'>
            {iotDevices.length === 0 ? (
              <div className='text-terra-blue/80'>
                No devices are displayed because no governed device feed has returned identity,
                signal, firmware, security, and update evidence.
              </div>
            ) : (
              iotDevices.map((device) => (
                <div key={device.id} className='terra-glass p-4 rounded-lg border border-terra-cyan/10'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <h3 className='text-lg font-semibold text-terra-cyan'>{device.name}</h3>
                      <div className='text-sm text-terra-blue/70'>{device.location}</div>
                    </div>
                    <Badge className={getStatusColor(device.status)} variant='secondary'>
                      {device.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card className='terra-glass border-terra-cyan/20'>
        <CardHeader>
          <h2 className='text-2xl font-semibold text-terra-cyan'>Processing Tasks</h2>
        </CardHeader>
        <CardBody>
          {processingTasks.length === 0 ? (
            <div className='text-terra-blue/80'>
              No processing tasks are displayed because no governed edge task queue has returned
              task id, assigned node, priority, progress, and resource evidence.
            </div>
          ) : (
            <div className='space-y-4'>
              {processingTasks.map((task) => (
                <div key={task.id} className='terra-glass p-4 rounded-lg border border-terra-cyan/10'>
                  <div className='flex justify-between items-start mb-3'>
                    <div>
                      <h3 className='text-lg font-semibold text-terra-cyan'>{task.name}</h3>
                      <div className='text-sm text-terra-blue/70'>Node: {task.assignedNode}</div>
                    </div>
                    <Badge className={getStatusColor(task.status)} variant='secondary'>
                      {task.status}
                    </Badge>
                  </div>
                  <Progress value={task.progress} className='h-2' />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TerraFusionEdgeCoordination;
