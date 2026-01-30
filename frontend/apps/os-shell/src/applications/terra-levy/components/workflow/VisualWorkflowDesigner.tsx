import { Box, OrbitControls, Text } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Vector3 } from 'three';
import './VisualWorkflowDesigner.css';

// Types for workflow components
interface WorkflowNode {
  id: string;
  type: 'start' | 'process' | 'decision' | 'approval' | 'notification' | 'integration' | 'end';
  label: string;
  position: { x: number; y: number; z: number };
  properties: Record<string, any>;
  connections: string[];
  aiSuggestions?: string[];
  complianceValidation?: {
    status: 'valid' | 'warning' | 'error';
    message: string;
  };
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  conditions?: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'levy-assessment' | 'collection' | 'appeal' | 'compliance' | 'reporting';
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  estimatedTime: string;
  complianceLevel: 'FISMA-LOW' | 'FISMA-MODERATE' | 'FISMA-HIGH';
}

// Sample workflow templates
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'standard-levy-assessment',
    name: 'Standard Levy Assessment',
    description: 'AI-optimized levy assessment workflow with quantum validation',
    category: 'levy-assessment',
    estimatedTime: '2-4 hours',
    complianceLevel: 'FISMA-HIGH',
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        label: 'Initiate Assessment',
        position: { x: -5, y: 0, z: 0 },
        properties: { trigger: 'citizen-request' },
        connections: ['validation-1'],
      },
      {
        id: 'validation-1',
        type: 'process',
        label: 'AI Data Validation',
        position: { x: -2, y: 0, z: 0 },
        properties: { aiModel: 'quantum-validator-v3', accuracy: 99.8 },
        connections: ['decision-1'],
        aiSuggestions: ['Apply predictive validation', 'Cross-reference historical data'],
      },
      {
        id: 'decision-1',
        type: 'decision',
        label: 'Assessment Required?',
        position: { x: 1, y: 0, z: 0 },
        properties: { criteria: ['property-value', 'tax-status', 'exemptions'] },
        connections: ['process-1', 'notification-1'],
      },
      {
        id: 'process-1',
        type: 'process',
        label: 'Calculate Levy Amount',
        position: { x: 4, y: 1, z: 0 },
        properties: { calculation: 'quantum-enhanced', accuracy: 99.9 },
        connections: ['approval-1'],
      },
      {
        id: 'approval-1',
        type: 'approval',
        label: 'Supervisor Approval',
        position: { x: 7, y: 1, z: 0 },
        properties: { requiredRole: 'levy-supervisor', timeout: '24h' },
        connections: ['end-1'],
      },
      {
        id: 'notification-1',
        type: 'notification',
        label: 'Send Exemption Notice',
        position: { x: 4, y: -1, z: 0 },
        properties: { template: 'exemption-notification' },
        connections: ['end-1'],
      },
      {
        id: 'end-1',
        type: 'end',
        label: 'Complete Assessment',
        position: { x: 10, y: 0, z: 0 },
        properties: { generateReport: true },
        connections: [],
      },
    ],
    connections: [],
  },
  {
    id: 'appeal-processing',
    name: 'Citizen Appeal Processing',
    description: 'Quantum-accelerated appeal review with AI recommendation engine',
    category: 'appeal',
    estimatedTime: '1-3 days',
    complianceLevel: 'FISMA-HIGH',
    nodes: [
      {
        id: 'start-2',
        type: 'start',
        label: 'Appeal Received',
        position: { x: -5, y: 0, z: 0 },
        properties: { source: 'citizen-portal' },
        connections: ['ai-analysis-1'],
      },
      {
        id: 'ai-analysis-1',
        type: 'process',
        label: 'AI Document Analysis',
        position: { x: -2, y: 0, z: 0 },
        properties: { model: 'legal-document-analyzer', confidence: 94.7 },
        connections: ['merit-decision'],
        aiSuggestions: ['Review similar cases', 'Check precedent database'],
      },
      {
        id: 'merit-decision',
        type: 'decision',
        label: 'Has Merit?',
        position: { x: 1, y: 0, z: 0 },
        properties: { aiRecommendation: true, humanReview: true },
        connections: ['investigation', 'denial'],
      },
      {
        id: 'investigation',
        type: 'process',
        label: 'Detailed Investigation',
        position: { x: 4, y: 1, z: 0 },
        properties: { assignee: 'senior-investigator', duration: '3-5 days' },
        connections: ['final-decision'],
      },
      {
        id: 'denial',
        type: 'notification',
        label: 'Send Denial Notice',
        position: { x: 4, y: -1, z: 0 },
        properties: { template: 'appeal-denial', autoGenerate: true },
        connections: ['end-2'],
      },
      {
        id: 'final-decision',
        type: 'approval',
        label: 'Director Approval',
        position: { x: 7, y: 1, z: 0 },
        properties: { role: 'department-director', escalation: true },
        connections: ['end-2'],
      },
      {
        id: 'end-2',
        type: 'end',
        label: 'Appeal Resolved',
        position: { x: 10, y: 0, z: 0 },
        properties: { notifyCitizen: true, updateRecords: true },
        connections: [],
      },
    ],
    connections: [],
  },
];

// 3D Node Component
const WorkflowNode3D: React.FC<{
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onMove: (nodeId: string, position: Vector3) => void;
}> = ({ node, isSelected, onSelect, onMove }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const getNodeColor = (type: string, isSelected: boolean) => {
    const colors = {
      start: 'var(--success-green)',
      process: 'var(--tf-network-blue)',
      decision: 'var(--warning-amber)',
      approval: 'var(--tf-retro-orange)',
      notification: 'var(--tf-accent-purple)',
      integration: 'var(--tf-accent-orange-light)',
      end: 'var(--error-red)',
    };
    return isSelected ? 'var(--tf-text-primary)fff' : colors[type as keyof typeof colors] || 'var(--gray-400)';
  };

  const getNodeShape = (type: string) => {
    switch (type) {
      case 'start':
      case 'end':
        return <Box args={[1.5, 0.8, 0.3]} />;
      case 'decision':
        return <Box args={[1.2, 1.2, 0.3]} rotation={[0, 0, Math.PI / 4]} />;
      case 'approval':
        return <Box args={[1.4, 1.0, 0.4]} />;
      default:
        return <Box args={[1.6, 1.0, 0.3]} />;
    }
  };

  return (
    <group
      position={[node.position.x, node.position.y, node.position.z]}
      onClick={() => onSelect(node.id)}
    >
      <mesh ref={meshRef}>
        {getNodeShape(node.type)}
        <meshStandardMaterial
          color={getNodeColor(node.type, isSelected)}
          transparent
          opacity={isSelected ? 1.0 : 0.8}
          emissive={isSelected ? 'var(--gray-700)' : 'var(--tf-bg-void)'}
        />
      </mesh>

      <Text
        position={[0, -1.2, 0]}
        fontSize={0.3}
        color='var(--tf-text-primary)fff'
        anchorX='center'
        anchorY='middle'
        maxWidth={3}
      >
        {node.label}
      </Text>

      {node.aiSuggestions && node.aiSuggestions.length > 0 && (
        <mesh position={[1.2, 0.8, 0]}>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color='var(--success-green)' emissive='var(--tf-surface-darker)' />
        </mesh>
      )}

      {node.complianceValidation && (
        <mesh position={[-1.2, 0.8, 0]}>
          <sphereGeometry args={[0.12]} />
          <meshStandardMaterial
            color={
              node.complianceValidation.status === 'valid'
                ? 'var(--success-green)'
                : node.complianceValidation.status === 'warning'
                  ? 'var(--warning-amber)'
                  : 'var(--error-red)'
            }
          />
        </mesh>
      )}
    </group>
  );
};

// Connection Line Component
const ConnectionLine3D: React.FC<{
  connection: WorkflowConnection;
  nodes: WorkflowNode[];
}> = ({ connection, nodes }) => {
  const fromNode = nodes.find((n) => n.id === connection.from);
  const toNode = nodes.find((n) => n.id === connection.to);

  if (!fromNode || !toNode) return null;

  const points = [
    new Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
    new Vector3(toNode.position.x, toNode.position.y, toNode.position.z),
  ];

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach='attributes-position'
            array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
            count={points.length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color='var(--gray-700)' linewidth={2} />
      </line>
    </group>
  );
};

// Main Visual Workflow Designer Component
export const VisualWorkflowDesigner: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [viewMode, setViewMode] = useState<'design' | 'simulate' | 'deploy'>('design');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize workflow from template
  const loadTemplate = useCallback((template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setCurrentWorkflow([...template.nodes]);
    setSelectedNode(null);
    setSimulationStep(0);
  }, []);

  // Start workflow simulation
  const startSimulation = useCallback(() => {
    if (currentWorkflow.length === 0) return;

    setIsSimulating(true);
    setSimulationStep(0);
    setViewMode('simulate');

    // Simulate workflow execution
    const simulate = (step: number) => {
      if (step >= currentWorkflow.length) {
        setIsSimulating(false);
        return;
      }

      setSimulationStep(step);
      setSelectedNode(currentWorkflow[step].id);

      setTimeout(() => simulate(step + 1), 2000);
    };

    simulate(0);
  }, [currentWorkflow]);

  // Move node position
  const moveNode = useCallback((nodeId: string, newPosition: Vector3) => {
    setCurrentWorkflow((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? { ...node, position: { x: newPosition.x, y: newPosition.y, z: newPosition.z } }
          : node
      )
    );
  }, []);

  // Add new node
  const addNode = useCallback((type: WorkflowNode['type'], position: Vector3) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      position: { x: position.x, y: position.y, z: position.z },
      properties: {},
      connections: [],
      aiSuggestions: type === 'process' ? ['Optimize with AI', 'Add validation step'] : undefined,
    };

    setCurrentWorkflow((prev) => [...prev, newNode]);
  }, []);

  // Generate AI suggestions for workflow optimization
  const generateAISuggestions = useCallback(() => {
    // Simulate AI analysis of workflow
    const suggestions = [
      'Add parallel processing for steps 3-5 to reduce execution time by 40%',
      'Implement quantum validation at decision points for 99.8% accuracy',
      'Add citizen notification automation to improve satisfaction scores',
      'Integrate with external compliance systems for real-time validation',
      'Add automated escalation rules for time-sensitive processes',
    ];

    return suggestions;
  }, []);

  useEffect(() => {
    // Load default template
    if (WORKFLOW_TEMPLATES.length > 0) {
      loadTemplate(WORKFLOW_TEMPLATES[0]);
    }
  }, [loadTemplate]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='visual-workflow-designer'>
        {/* Control Panel */}
        <div className='workflow-controls'>
          <div className='control-section'>
            <h3>Workflow Templates</h3>
            <div className='template-list'>
              {WORKFLOW_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`template-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
                  onClick={() => loadTemplate(template)}
                >
                  <div className='template-name'>{template.name}</div>
                  <div className='template-meta'>
                    <span className='category'>{template.category}</span>
                    <span className='time'>{template.estimatedTime}</span>
                    <span className={`compliance ${template.complianceLevel.toLowerCase()}`}>
                      {template.complianceLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='control-section'>
            <h3>View Mode</h3>
            <div className='view-controls'>
              <button
                className={viewMode === 'design' ? 'active' : ''}
                onClick={() => setViewMode('design')}
              >
                🎨 Design
              </button>
              <button
                className={viewMode === 'simulate' ? 'active' : ''}
                onClick={() => setViewMode('simulate')}
              >
                ⚡ Simulate
              </button>
              <button
                className={viewMode === 'deploy' ? 'active' : ''}
                onClick={() => setViewMode('deploy')}
              >
                🚀 Deploy
              </button>
            </div>
          </div>

          {viewMode === 'design' && (
            <div className='control-section'>
              <h3>Add Components</h3>
              <div className='component-palette'>
                <button onClick={() => addNode('start', new Vector3(0, 0, 0))}>🟢 Start</button>
                <button onClick={() => addNode('process', new Vector3(0, 0, 0))}>🔵 Process</button>
                <button onClick={() => addNode('decision', new Vector3(0, 0, 0))}>
                  🟡 Decision
                </button>
                <button onClick={() => addNode('approval', new Vector3(0, 0, 0))}>
                  🟠 Approval
                </button>
                <button onClick={() => addNode('notification', new Vector3(0, 0, 0))}>
                  🟣 Notification
                </button>
                <button onClick={() => addNode('end', new Vector3(0, 0, 0))}>🔴 End</button>
              </div>
            </div>
          )}

          {viewMode === 'simulate' && (
            <div className='control-section'>
              <h3>Simulation Controls</h3>
              <div className='simulation-controls'>
                <button
                  onClick={startSimulation}
                  disabled={isSimulating || currentWorkflow.length === 0}
                >
                  {isSimulating ? 'Simulating...' : 'Start Simulation'}
                </button>
                <div className='simulation-progress'>
                  Step: {simulationStep + 1} / {currentWorkflow.length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3D Workflow Canvas */}
        <div className='workflow-canvas'>
          <Canvas
            ref={canvasRef}
            camera={{ position: [0, 5, 15], fov: 60 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <pointLight position={[-10, -10, -5]} intensity={0.8} color='var(--tf-network-blue)' />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI / 2}
            />

            {/* Render workflow nodes */}
            {currentWorkflow.map((node) => (
              <WorkflowNode3D
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                onSelect={setSelectedNode}
                onMove={moveNode}
              />
            ))}

            {/* Render connections */}
            {currentWorkflow.map((node) =>
              node.connections.map((targetId) => (
                <ConnectionLine3D
                  key={`${node.id}-${targetId}`}
                  connection={{
                    id: `${node.id}-${targetId}`,
                    from: node.id,
                    to: targetId,
                  }}
                  nodes={currentWorkflow}
                />
              ))
            )}

            {/* Grid helper */}
            <gridHelper args={[20, 20, 'var(--tf-bg-surface)333', 'var(--gray-500)']} />
          </Canvas>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className='properties-panel'>
            <h3>Node Properties</h3>
            {(() => {
              const node = currentWorkflow.find((n) => n.id === selectedNode);
              if (!node) return null;

              return (
                <div className='node-details'>
                  <div className='property-group'>
                    <label>Type:</label>
                    <span className={`node-type ${node.type}`}>{node.type}</span>
                  </div>
                  <div className='property-group'>
                    <label>Label:</label>
                    <input
                      type='text'
                      value={node.label}
                      placeholder='Enter node label'
                      title='Node Label'
                      onChange={(e) => {
                        setCurrentWorkflow((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode ? { ...n, label: e.target.value } : n
                          )
                        );
                      }}
                    />
                  </div>{' '}
                  {node.aiSuggestions && (
                    <div className='property-group'>
                      <label>AI Suggestions:</label>
                      <div className='ai-suggestions'>
                        {node.aiSuggestions.map((suggestion, index) => (
                          <div key={index} className='suggestion'>
                            💡 {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {node.complianceValidation && (
                    <div className='property-group'>
                      <label>Compliance Status:</label>
                      <div className={`compliance-status ${node.complianceValidation.status}`}>
                        {node.complianceValidation.status.toUpperCase()}:{' '}
                        {node.complianceValidation.message}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* AI Suggestions Panel */}
        <div className='ai-suggestions-panel'>
          <h3>🤖 AI Workflow Optimization</h3>
          <div className='suggestions-list'>
            {generateAISuggestions().map((suggestion, index) => (
              <div key={index} className='suggestion-item'>
                <span className='suggestion-text'>{suggestion}</span>
                <button className='apply-suggestion'>Apply</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
