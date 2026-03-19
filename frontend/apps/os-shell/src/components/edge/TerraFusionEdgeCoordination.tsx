/**
 * ═══════════════════════════════════════════════════════════════
 * EDGE COMPUTING & IOT COORDINATION PLATFORM
 * Elite Distributed Processing & Quantum-Enhanced Edge Intelligence
 * Real-Time IoT Device Management & Coordination
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useCallback, useEffect, useState } from 'react';

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
  dataRate: number; // messages per minute
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
  estimatedCompletion: number; // minutes
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
  const [edgeNodes, setEdgeNodes] = useState<EdgeNode[]>([]);
  const [iotDevices, setIoTDevices] = useState<IoTDevice[]>([]);
  const [processingTasks, setProcessingTasks] = useState<EdgeProcessingTask[]>([]);
  const [coordinationMetrics, setCoordinationMetrics] = useState({
    totalEdgeNodes: 0,
    activeNodes: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalTasks: 0,
    processingTasks: 0,
    averageLatency: 0,
    networkThroughput: 0,
  });

  useEffect(() => {
    initializeEdgeCoordination();
    const interval = setInterval(updateCoordinationMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const initializeEdgeCoordination = useCallback(() => {

    // Initialize edge nodes
    const nodes: EdgeNode[] = [
      {
        id: 'edge-seattle-001',
        name: 'Seattle Government Edge Hub',
        type: 'GOVERNMENT_EDGE',
        status: 'ONLINE',
        location: 'Seattle, WA',
        cpuUsage: 67.8,
        memoryUsage: 72.3,
        networkLatency: 8.4,
        connectedDevices: 2847,
        processingLoad: 78.9,
        quantumEnhanced: true,
        lastHeartbeat: new Date().toISOString(),
        capabilities: [
          'ML_INFERENCE',
          'QUANTUM_PROCESSING',
          'REAL_TIME_ANALYTICS',
          'IoT_COORDINATION',
        ],
      },
      {
        id: 'edge-tacoma-002',
        name: 'Tacoma IoT Coordination Center',
        type: 'IOT_COORDINATOR',
        status: 'ONLINE',
        location: 'Tacoma, WA',
        cpuUsage: 45.2,
        memoryUsage: 58.7,
        networkLatency: 12.7,
        connectedDevices: 1847,
        processingLoad: 56.3,
        quantumEnhanced: false,
        lastHeartbeat: new Date().toISOString(),
        capabilities: ['IoT_MANAGEMENT', 'DATA_AGGREGATION', 'DEVICE_MONITORING'],
      },
      {
        id: 'edge-spokane-003',
        name: 'Spokane Quantum Edge Node',
        type: 'QUANTUM_EDGE',
        status: 'PROCESSING',
        location: 'Spokane, WA',
        cpuUsage: 89.4,
        memoryUsage: 91.2,
        networkLatency: 6.1,
        connectedDevices: 847,
        processingLoad: 94.7,
        quantumEnhanced: true,
        lastHeartbeat: new Date().toISOString(),
        capabilities: ['QUANTUM_COMPUTATION', 'ADVANCED_ML', 'PREDICTIVE_ANALYTICS'],
      },
      {
        id: 'edge-bellevue-004',
        name: 'Bellevue Processing Gateway',
        type: 'PROCESSING_NODE',
        status: 'ONLINE',
        location: 'Bellevue, WA',
        cpuUsage: 34.8,
        memoryUsage: 42.1,
        networkLatency: 15.3,
        connectedDevices: 1247,
        processingLoad: 38.9,
        quantumEnhanced: false,
        lastHeartbeat: new Date().toISOString(),
        capabilities: ['DATA_PROCESSING', 'STREAM_ANALYSIS', 'DEVICE_COORDINATION'],
      },
      {
        id: 'edge-olympia-005',
        name: 'Olympia Government Edge Station',
        type: 'EDGE_GATEWAY',
        status: 'SYNCING',
        location: 'Olympia, WA',
        cpuUsage: 23.7,
        memoryUsage: 31.4,
        networkLatency: 22.8,
        connectedDevices: 647,
        processingLoad: 28.5,
        quantumEnhanced: false,
        lastHeartbeat: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
        capabilities: ['GATEWAY_SERVICES', 'DATA_ROUTING', 'PROTOCOL_TRANSLATION'],
      },
    ];

    // Initialize IoT devices
    const devices: IoTDevice[] = [
      {
        id: 'iot-traffic-001',
        name: 'I-5 Traffic Monitor North',
        type: 'SENSOR',
        category: 'TRAFFIC',
        status: 'ACTIVE',
        location: 'I-5 Mile 165, Seattle',
        edgeNodeId: 'edge-seattle-001',
        signalStrength: 89,
        dataRate: 120,
        lastUpdate: new Date().toISOString(),
        firmwareVersion: '2.1.4',
        securityLevel: 'GOVERNMENT_GRADE',
      },
      {
        id: 'iot-env-002',
        name: 'Port of Tacoma Air Quality Sensor',
        type: 'ENVIRONMENTAL_MONITOR',
        category: 'ENVIRONMENTAL',
        status: 'ACTIVE',
        location: 'Port of Tacoma, Building 7',
        edgeNodeId: 'edge-tacoma-002',
        batteryLevel: 87,
        signalStrength: 76,
        dataRate: 24,
        lastUpdate: new Date().toISOString(),
        firmwareVersion: '3.2.1',
        securityLevel: 'HIGH',
      },
      {
        id: 'iot-security-003',
        name: 'Government Building Security Cam',
        type: 'CAMERA',
        category: 'SECURITY',
        status: 'ACTIVE',
        location: 'Spokane County Courthouse',
        edgeNodeId: 'edge-spokane-003',
        signalStrength: 94,
        dataRate: 1800, // High data rate for video
        lastUpdate: new Date().toISOString(),
        firmwareVersion: '1.8.7',
        securityLevel: 'GOVERNMENT_GRADE',
      },
      {
        id: 'iot-utility-004',
        name: 'Bellevue Smart Grid Meter',
        type: 'SMART_METER',
        category: 'UTILITY',
        status: 'ACTIVE',
        location: 'Bellevue Residential District 4',
        edgeNodeId: 'edge-bellevue-004',
        signalStrength: 82,
        dataRate: 12,
        lastUpdate: new Date().toISOString(),
        firmwareVersion: '4.1.2',
        securityLevel: 'MEDIUM',
      },
      {
        id: 'iot-emergency-005',
        name: 'Emergency Response Beacon',
        type: 'ACTUATOR',
        category: 'EMERGENCY',
        status: 'ACTIVE',
        location: 'Olympia Emergency Operations Center',
        edgeNodeId: 'edge-olympia-005',
        batteryLevel: 92,
        signalStrength: 67,
        dataRate: 6,
        lastUpdate: new Date().toISOString(),
        firmwareVersion: '2.3.8',
        securityLevel: 'GOVERNMENT_GRADE',
      },
    ];

    // Initialize processing tasks
    const tasks: EdgeProcessingTask[] = [
      {
        id: 'task-001',
        name: 'Real-Time Traffic Pattern Analysis',
        type: 'REAL_TIME_PROCESSING',
        priority: 'HIGH',
        status: 'PROCESSING',
        assignedNode: 'edge-seattle-001',
        progress: 67.4,
        estimatedCompletion: 4,
        resourceRequirements: {
          cpu: 75,
          memory: 68,
          networkBandwidth: 150,
        },
        quantumAccelerated: true,
      },
      {
        id: 'task-002',
        name: 'Environmental Data ML Inference',
        type: 'ML_INFERENCE',
        priority: 'MEDIUM',
        status: 'PROCESSING',
        assignedNode: 'edge-tacoma-002',
        progress: 34.8,
        estimatedCompletion: 12,
        resourceRequirements: {
          cpu: 45,
          memory: 52,
          networkBandwidth: 85,
        },
        quantumAccelerated: false,
      },
      {
        id: 'task-003',
        name: 'Quantum Security Threat Analysis',
        type: 'QUANTUM_COMPUTATION',
        priority: 'CRITICAL',
        status: 'PROCESSING',
        assignedNode: 'edge-spokane-003',
        progress: 89.2,
        estimatedCompletion: 2,
        resourceRequirements: {
          cpu: 95,
          memory: 88,
          networkBandwidth: 200,
        },
        quantumAccelerated: true,
      },
      {
        id: 'task-004',
        name: 'Smart Grid Optimization',
        type: 'DATA_ANALYSIS',
        priority: 'MEDIUM',
        status: 'QUEUED',
        assignedNode: 'edge-bellevue-004',
        progress: 0,
        estimatedCompletion: 18,
        resourceRequirements: {
          cpu: 35,
          memory: 40,
          networkBandwidth: 60,
        },
        quantumAccelerated: false,
      },
      {
        id: 'task-005',
        name: 'Emergency Response Coordination',
        type: 'AI_COORDINATION',
        priority: 'LOW',
        status: 'QUEUED',
        assignedNode: 'edge-olympia-005',
        progress: 0,
        estimatedCompletion: 25,
        resourceRequirements: {
          cpu: 25,
          memory: 30,
          networkBandwidth: 40,
        },
        quantumAccelerated: false,
      },
    ];

    setEdgeNodes(nodes);
    setIoTDevices(devices);
    setProcessingTasks(tasks);
    calculateCoordinationMetrics(nodes, devices, tasks);

  }, []);

  const calculateCoordinationMetrics = useCallback(
    (nodes: EdgeNode[], devices: IoTDevice[], tasks: EdgeProcessingTask[]) => {
      const totalEdgeNodes = nodes.length;
      const activeNodes = nodes.filter(
        (n) => n.status === 'ONLINE' || n.status === 'PROCESSING'
      ).length;
      const totalDevices = devices.length;
      const activeDevices = devices.filter((d) => d.status === 'ACTIVE').length;
      const totalTasks = tasks.length;
      const processingTasks = tasks.filter((t) => t.status === 'PROCESSING').length;
      const averageLatency =
        nodes.reduce((sum, node) => sum + node.networkLatency, 0) / nodes.length;
      const networkThroughput = devices.reduce((sum, device) => sum + device.dataRate, 0);

      setCoordinationMetrics({
        totalEdgeNodes,
        activeNodes,
        totalDevices,
        activeDevices,
        totalTasks,
        processingTasks,
        averageLatency,
        networkThroughput,
      });
    },
    []
  );

  const updateCoordinationMetrics = useCallback(() => {
    // Simulate real-time edge coordination updates
    setEdgeNodes((prev) =>
      prev.map((node) => ({
        ...node,
        cpuUsage: Math.max(0, Math.min(100, node.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.max(0, Math.min(100, node.memoryUsage + (Math.random() - 0.5) * 3)),
        networkLatency: Math.max(1, node.networkLatency + (Math.random() - 0.5) * 2),
        processingLoad: Math.max(0, Math.min(100, node.processingLoad + (Math.random() - 0.5) * 4)),
        lastHeartbeat:
          node.status === 'ONLINE' || node.status === 'PROCESSING'
            ? new Date().toISOString()
            : node.lastHeartbeat,
      }))
    );

    setIoTDevices((prev) =>
      prev.map((device) => ({
        ...device,
        signalStrength: Math.max(
          0,
          Math.min(100, device.signalStrength + (Math.random() - 0.5) * 5)
        ),
        dataRate: Math.max(
          1,
          device.dataRate + (Math.random() - 0.5) * (device.type === 'CAMERA' ? 100 : 10)
        ),
        batteryLevel: device.batteryLevel
          ? Math.max(0, Math.min(100, device.batteryLevel + (Math.random() - 0.5) * 2))
          : undefined,
        lastUpdate: new Date().toISOString(),
      }))
    );

    setProcessingTasks((prev) =>
      prev.map((task) => {
        if (task.status === 'PROCESSING') {
          const progressIncrement = Math.random() * 5;
          const newProgress = Math.min(100, task.progress + progressIncrement);
          const newEstimatedCompletion = Math.max(0, task.estimatedCompletion - 0.5);

          return {
            ...task,
            progress: newProgress,
            estimatedCompletion: newEstimatedCompletion,
            status: newProgress >= 100 ? 'COMPLETED' : 'PROCESSING',
          };
        }
        return task;
      })
    );
  }, []);

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

  const getPriorityColor = (priority: EdgeProcessingTask['priority']) => {
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

  const getSecurityColor = (level: IoTDevice['securityLevel']) => {
    switch (level) {
      case 'LOW':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'HIGH':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'GOVERNMENT_GRADE':
        return 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30';
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6 ${className}`}
    >
      {/* Edge Coordination Header */}
      <div className='text-center mb-8'>
        <div className='flex items-center justify-center gap-6 mb-4'>
          <TerraSphere size='lg' variant='quantum' />
          <h1 className='text-4xl font-bold text-terra-cyan glow-text'>
            Edge Computing & IoT Coordination
          </h1>
        </div>
        <p className='text-lg text-terra-blue/80 mb-6'>
          Elite Distributed Processing & Quantum-Enhanced Edge Intelligence
        </p>

        {/* Coordination Metrics Overview */}
        <div className='flex justify-center gap-8 mb-8'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-terra-cyan'>
              {coordinationMetrics.activeNodes}/{coordinationMetrics.totalEdgeNodes}
            </div>
            <div className='text-sm text-terra-blue/70'>Edge Nodes Active</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-400'>
              {coordinationMetrics.activeDevices}/{coordinationMetrics.totalDevices}
            </div>
            <div className='text-sm text-terra-blue/70'>IoT Devices Online</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-blue-400'>
              {coordinationMetrics.processingTasks}
            </div>
            <div className='text-sm text-terra-blue/70'>Active Tasks</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-400'>
              {coordinationMetrics.averageLatency.toFixed(1)}ms
            </div>
            <div className='text-sm text-terra-blue/70'>Avg Latency</div>
          </div>
        </div>
      </div>

      {/* Edge Nodes */}
      <div className='mb-8'>
        <h2 className='text-2xl font-semibold text-terra-cyan mb-4 flex items-center gap-3'>
          <TerraSphere size='sm' variant='pulse' />
          Edge Computing Nodes
        </h2>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {edgeNodes.map((node) => (
            <Card key={node.id} className='terra-glass border-terra-cyan/20'>
              <CardHeader className='pb-3'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='text-lg font-semibold text-terra-cyan mb-1'>{node.name}</h3>
                    <div className='flex gap-2 mb-2'>
                      <Badge className={getNodeTypeColor(node.type)} variant='outline'>
                        {node.type}
                      </Badge>
                      <Badge className={getStatusColor(node.status)} variant='secondary'>
                        {node.status}
                      </Badge>
                      {node.quantumEnhanced && (
                        <Badge
                          className='bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30'
                          variant='outline'
                        >
                          QUANTUM
                        </Badge>
                      )}
                    </div>
                    <div className='text-sm text-terra-blue/70'>{node.location}</div>
                  </div>
                  <div className='text-right text-sm'>
                    <div className='text-terra-blue/70'>Devices</div>
                    <div className='text-terra-cyan font-semibold'>{node.connectedDevices}</div>
                  </div>
                </div>
              </CardHeader>
              <CardBody className='space-y-4'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <div className='text-terra-blue/70'>Network Latency</div>
                    <div className='text-lg font-semibold text-blue-400'>
                      {node.networkLatency.toFixed(1)}ms
                    </div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Processing Load</div>
                    <div className='text-lg font-semibold text-purple-400'>
                      {node.processingLoad.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Last Heartbeat</div>
                    <div className='text-terra-blue'>
                      {new Date(node.lastHeartbeat).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Capabilities</div>
                    <div className='text-terra-blue'>{node.capabilities.length} services</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-terra-blue/70'>CPU Usage</span>
                      <span className='text-orange-400'>{node.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={node.cpuUsage} className='h-2' />
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-terra-blue/70'>Memory Usage</span>
                      <span className='text-purple-400'>{node.memoryUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={node.memoryUsage} className='h-2' />
                  </div>
                </div>

                <div>
                  <div className='text-terra-blue/70 text-xs mb-1'>Capabilities:</div>
                  <div className='flex flex-wrap gap-1'>
                    {node.capabilities.map((capability, index) => (
                      <Badge key={index} variant='outline' className='text-xs terra-glass'>
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* IoT Devices */}
      <div className='mb-8'>
        <h2 className='text-2xl font-semibold text-terra-cyan mb-4 flex items-center gap-3'>
          <TerraSphere size='sm' variant='glow' />
          IoT Device Network
        </h2>
        <div className='Grid gap-4'>
          {iotDevices.map((device) => (
            <Card key={device.id} className='terra-glass border-terra-cyan/20'>
              <CardBody className='space-y-4'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='text-lg font-semibold text-terra-cyan mb-1'>{device.name}</h3>
                    <div className='flex gap-2 mb-2'>
                      <Badge
                        className='bg-blue-500/20 text-blue-300 border-blue-500/30'
                        variant='outline'
                      >
                        {device.type}
                      </Badge>
                      <Badge
                        className='bg-green-500/20 text-green-300 border-green-500/30'
                        variant='outline'
                      >
                        {device.category}
                      </Badge>
                      <Badge className={getStatusColor(device.status)} variant='secondary'>
                        {device.status}
                      </Badge>
                      <Badge className={getSecurityColor(device.securityLevel)} variant='outline'>
                        {device.securityLevel}
                      </Badge>
                    </div>
                    <div className='text-sm text-terra-blue/70'>{device.location}</div>
                  </div>
                  <div className='text-right text-sm'>
                    <div className='text-terra-blue/70'>Signal</div>
                    <div className='text-green-400 font-semibold'>{device.signalStrength}%</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
                  <div>
                    <div className='text-terra-blue/70'>Edge Node</div>
                    <div className='text-terra-cyan font-mono text-xs'>{device.edgeNodeId}</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Data Rate</div>
                    <div className='text-blue-400'>{device.dataRate}/min</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Firmware</div>
                    <div className='text-terra-blue'>v{device.firmwareVersion}</div>
                  </div>
                  {device.batteryLevel && (
                    <div>
                      <div className='text-terra-blue/70'>Battery</div>
                      <div className='text-green-400'>{device.batteryLevel}%</div>
                    </div>
                  )}
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-terra-blue/70'>Signal Strength</span>
                      <span className='text-green-400'>{device.signalStrength}%</span>
                    </div>
                    <Progress value={device.signalStrength} className='h-2' />
                  </div>
                  {device.batteryLevel && (
                    <div>
                      <div className='flex justify-between text-sm mb-1'>
                        <span className='text-terra-blue/70'>Battery Level</span>
                        <span className='text-green-400'>{device.batteryLevel}%</span>
                      </div>
                      <Progress value={device.batteryLevel} className='h-2' />
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Processing Tasks */}
      <Card className='terra-glass border-terra-cyan/20'>
        <CardHeader>
          <h2 className='text-2xl font-semibold text-terra-cyan flex items-center gap-3'>
            <TerraSphere size='sm' variant='quantum' />
            Edge Processing Tasks
          </h2>
          <p className='text-terra-blue/70'>Real-time distributed processing coordination</p>
        </CardHeader>
        <CardBody>
          <div className='space-y-4'>
            {processingTasks.map((task) => (
              <div key={task.id} className='terra-glass p-4 rounded-lg border border-terra-cyan/10'>
                <div className='flex justify-between items-start mb-3'>
                  <div className='flex items-center gap-3'>
                    <h3 className='text-lg font-semibold text-terra-cyan'>{task.name}</h3>
                    <Badge
                      className='bg-blue-500/20 text-blue-300 border-blue-500/30'
                      variant='outline'
                    >
                      {task.type}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)} variant='outline'>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)} variant='secondary'>
                      {task.status}
                    </Badge>
                    {task.quantumAccelerated && (
                      <Badge
                        className='bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30'
                        variant='outline'
                      >
                        QUANTUM
                      </Badge>
                    )}
                  </div>
                  <div className='text-right text-sm'>
                    <div className='text-terra-blue/70'>ETA</div>
                    <div className='text-terra-cyan font-semibold'>
                      {task.estimatedCompletion}min
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4'>
                  <div>
                    <div className='text-terra-blue/70'>Assigned Node</div>
                    <div className='text-terra-cyan font-mono text-xs'>{task.assignedNode}</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>CPU Required</div>
                    <div className='text-orange-400'>{task.resourceRequirements.cpu}%</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Memory Required</div>
                    <div className='text-purple-400'>{task.resourceRequirements.memory}%</div>
                  </div>
                  <div>
                    <div className='text-terra-blue/70'>Bandwidth</div>
                    <div className='text-blue-400'>
                      {task.resourceRequirements.networkBandwidth}MB/s
                    </div>
                  </div>
                </div>

                {task.status === 'PROCESSING' && (
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-terra-blue/70'>Processing Progress</span>
                      <span className='text-terra-cyan'>{task.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={task.progress} className='h-3' />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TerraFusionEdgeCoordination;
