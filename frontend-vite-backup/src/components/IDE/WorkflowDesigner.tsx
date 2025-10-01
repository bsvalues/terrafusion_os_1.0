import React, {useState, useCallback, useRef, useEffect} from 'react';
import { useSecureAPI } from '../../contexts/InfrastructureContext';
import { CircuitBreakerError, AttestationError } from '../../infrastructure/SecureAPIClient';
import {Box,
  Paper,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Badge,} from '@mui/material';
import {PlayArrow,
  Stop,
  Save,
  Add,
  Delete,
  Settings,
  Visibility,
  VisibilityOff,
  AccountTree,
  Psychology,
  Code,
  Security,
  Assessment,
  BugReport,
  CloudSync,
  DataObject,} from '@mui/icons-material';

// Import React Flow for workflow visualization
import ReactFlow, {Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  NodeTypes,
  EdgeTypes,} from 'reactflow';
import 'reactflow/dist/style.css';

// Type assertion to fix React Flow TypeScript compatibility
const ReactFlowComponent = ReactFlow as any;
const ControlsComponent = Controls as any;
const MiniMapComponent = MiniMap as any;
const BackgroundComponent = Background as any;

// Custom node types for AI agents and government operations
import {AIAgentNode} from './nodes/AIAgentNode';
// import {GovernmentServiceNode} from './nodes/GovernmentServiceNode';
// import {ComplianceCheckNode} from './nodes/ComplianceCheckNode';
// import {DataFlowNode} from './nodes/DataFlowNode';

// AI Swarm types
interface AIAgent {
  id: string;
  name: string;
  type: 'SUPREME_COMMANDER' | 'FIELD_GENERAL' | 'OPERATIONAL_AGENT';
  specialization: string[];
  status: 'ACTIVE' | 'IDLE' | 'PROCESSING' | 'ERROR';
  securityClearance: 'RED' | 'YELLOW' | 'GREEN';
  currentTask?: string;
  performanceMetrics: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
    confidenceAverage: number;
  };
}

interface WorkflowNode extends Node {
  data: {
    label: string;
    agentType?: string;
    agentId?: string;
    configuration?: Record<string, any>;
    complianceLevel?: 'RED' | 'YELLOW' | 'GREEN';
    governmentStandards?: string[];
    status?: 'READY' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  };
}

interface WorkflowEdge extends Omit<Edge, 'id' | 'source' | 'target'> {
  id: string;
  source: string;
  target: string;
  data?: {
    dataType: string;
    security: 'ENCRYPTED' | 'STANDARD';
    complianceRequired: boolean;
  };
}

interface WorkflowDesignerProps {
  onWorkflowSave?: (workflow: any) => void;
  onWorkflowExecute?: (workflow: any) => void;
  initialWorkflow?: any;
}

// Custom node components
const nodeTypes: NodeTypes = {
  aiAgent: AIAgentNode,
  // governmentService: GovernmentServiceNode,
  // complianceCheck: ComplianceCheckNode,
  // dataFlow: DataFlowNode
};

// Custom edge types for government data flow
const edgeTypes: EdgeTypes = {
  // Custom edge types will be implemented separately
};

// Agent templates for drag-and-drop
const agentTemplates = [
  {id: 'supreme-commander',
    name: 'Supreme Commander',
    icon: Psychology,
    type: 'SUPREME_COMMANDER',
    description: 'Master AI orchestrator with RED clearance',
    color: '#FF5722',},
  {id: 'field-general',
    name: 'Field General',
    icon: AccountTree,
    type: 'FIELD_GENERAL',
    description: 'Domain specialist with YELLOW clearance',
    color: '#FF9800',},
  {id: 'code-completion-agent',
    name: 'Code Completion Agent',
    icon: Code,
    type: 'OPERATIONAL_AGENT',
    specialization: ['CODE_COMPLETION', 'TYPESCRIPT_EXPERT'],
    description: 'AI-powered code completion specialist',
    color: '#4CAF50',},
  {id: 'security-auditor',
    name: 'Security Auditor',
    icon: Security,
    type: 'OPERATIONAL_AGENT',
    specialization: ['SECURITY_AUDITOR', 'COMPLIANCE_VALIDATOR'],
    description: 'Government security compliance validator',
    color: '#F44336',},
  {id: 'compliance-checker',
    name: 'Compliance Checker',
    icon: Assessment,
    type: 'OPERATIONAL_AGENT',
    specialization: ['FISMA', 'NIST', 'Section508'],
    description: 'Multi-standard compliance validation',
    color: '#9C27B0',},
  {id: 'government-service',
    name: 'Government Service',
    icon: CloudSync,
    type: 'SERVICE',
    description: 'FISMA-compliant government service endpoint',
    color: '#2196F3',},
  {id: 'data-processor',
    name: 'Data Processor',
    icon: DataObject,
    type: 'OPERATIONAL_AGENT',
    specialization: ['DATA_PROCESSING', 'PYTHON_AI_ENGINEER'],
    description: 'Government data processing and analytics',
    color: '#607D8B',},
];

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({onWorkflowSave,
  onWorkflowExecute,
  initialWorkflow,}) => {// React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const secureAPI = useSecureAPI();

  // UI state
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [configDialog, setConfigDialog] = useState(false);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<string>('Ready');

  // AI Swarm state
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [swarmStatus, setSwarmStatus] = useState<'IDLE' | 'COORDINATING' | 'PROCESSING'>('IDLE');

  // Drag and drop
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Load AI agents on component mount
  useEffect(() => {
    loadAIAgents();
    if (initialWorkflow) {
      loadWorkflow(initialWorkflow);}
  }, [initialWorkflow]);

  const loadAIAgents = async () => {try {
      const response = await secureAPI.get('terrafusion-backend', '/api/ai-swarm/agents');
      const agentData = await response.json();

      setAiAgents(agentData.agents || []);
      setSwarmStatus(agentData.swarmStatus || 'IDLE');} catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('Failed to load AI agents:', error);
      }
  };

  const loadWorkflow = (workflow: any) => {if (workflow.nodes) setNodes(workflow.nodes);
    if (workflow.edges) setEdges(workflow.edges);};

  const onConnect = useCallback(
    (params: Connection) => {
      // Add government compliance validation to connections
      const newEdge: WorkflowEdge = {
        ...params,
        id: 'edge-' + Date.now(),
        type: 'default',
        data: {dataType: 'GOVERNMENT_DATA',
          security: 'ENCRYPTED',
          complianceRequired: true,},
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {event.preventDefault();
    event.dataTransfer.dropEffect = 'move';}, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - (reactFlowWrapper.current?.getBoundingClientRect().left || 0),
        y: event.clientY - (reactFlowWrapper.current?.getBoundingClientRect().top || 0),});

      const template = agentTemplates.find((t) => t.id === type);
      if (!template) return;

      const newNode: WorkflowNode = {
        id: type + '-' + Date.now(),
        type: getNodeTypeForTemplate(template),
        position,
        data: {
          label: template.name,
          agentType: template.type,
          configuration: {
            specialization: template.specialization || [],
            securityClearance:
              template.type === 'SUPREME_COMMANDER'
                ? 'RED'
                : template.type === 'FIELD_GENERAL'
                  ? 'YELLOW'
                  : 'GREEN',
            complianceFrameworks: ['FISMA', 'NIST', 'Section508'],
          },
          complianceLevel: 'GREEN',
          governmentStandards: ['FISMA', 'NIST', 'Section508'],
          status: 'READY',
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const getNodeTypeForTemplate = (template: any): string => {if (template.type === 'SERVICE') return 'governmentService';
    if (template.id.includes('compliance')) return 'complianceCheck';
    if (template.id.includes('data')) return 'dataFlow';
    return 'aiAgent';};

  const onDragStart = (event: React.DragEvent, nodeType: string) => {event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedItem(nodeType);};

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {setSelectedNode(node as WorkflowNode);}, []);

  const handleNodeDelete = () => {if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
      );
      setSelectedNode(null);}
  };

  const handleWorkflowSave = () => {
    const workflow = {
      id: 'workflow-' + Date.now(),
      name: 'TerraFusion AI Workflow',
      nodes: nodes,
      edges: edges,
      metadata: {createdAt: new Date().toISOString(),
        version: '1.0.0',
        complianceLevel: 'GOVERNMENT_APPROVED',
        securityClassification: 'FOUO',},
    };

    onWorkflowSave?.(workflow);
  };

  const handleWorkflowExecute = async () => {
    setWorkflowRunning(true);
    setWorkflowStatus('Initializing AI Swarm...');

    try {
      // Validate workflow compliance
      const complianceValidation = await validateWorkflowCompliance();
      if (!complianceValidation.isCompliant) {
        throw new Error(
          'Workflow compliance validation failed: ' + complianceValidation.violations.join(', ')
        );
      }

      setWorkflowStatus('Orchestrating AI Agents...');

      // Execute workflow through AI swarm
      const executionPlan = buildExecutionPlan();
      const result = await executeWorkflowPlan(executionPlan);

      setWorkflowStatus('Completed Successfully - ' + result.tasksExecuted + ' tasks');
      onWorkflowExecute?.(result);
    } catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('Workflow execution failed:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Workflow execution failed:', error);
    } finally {setWorkflowRunning(false);}
  };

  const validateWorkflowCompliance = async () => {
    // Validate that all nodes have proper compliance settings
    const violations = [];

    for (const node of nodes) {
      if (!node.data.complianceLevel) {
        violations.push('Node ' + node.data.label + ' missing compliance level');
      }

      if (node.data.agentType === 'SUPREME_COMMANDER' && node.data.complianceLevel !== 'RED') {violations.push('Supreme Commander must have RED clearance');}

      if (!node.data.governmentStandards || node.data.governmentStandards.length === 0) {
        violations.push('Node ' + node.data.label + ' missing government standards');
      }
    }

    return {isCompliant: violations.length === 0,
      violations,};
  };

  const buildExecutionPlan = () => {// Build execution plan from workflow graph
    const plan = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        agentType: node.data.agentType,
        configuration: node.data.configuration,
        dependencies: edges.filter((e) => e.target === node.id).map((e) => e.source),
      })),
      executionOrder: topologicalSort(nodes, edges),
      complianceRequirements: {auditLogging: true,
        securityValidation: true,
        governmentStandards: ['FISMA', 'NIST', 'Section508'],},
    };

    return plan;
  };

  const executeWorkflowPlan = async (plan: any) => {
    const response = await secureAPI.get('terrafusion-backend', '/api/ai-swarm/execute-workflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (localStorage.getItem('terrafusion-token') || ''),
      },
      body: JSON.stringify({executionPlan: plan,
        governmentCompliance: true,
        auditRequired: true,
        realTimeMonitoring: true,}),
    });

    try {
      return response.data;
    } catch (error) {
      throw new Error('Workflow execution failed: ' + "API request failed");
    }
  };

  const topologicalSort = (nodes: Node[], edges: Edge[]): string[] => {// Simple topological sort for execution order
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;

      visited.add(nodeId);

      // Visit dependencies first
      const dependencies = edges.filter((e) => e.target === nodeId).map((e) => e.source);
      dependencies.forEach(visit);

      result.push(nodeId);};

    nodes.forEach((node) => visit(node.id));
    return result;
  };

  const getAgentStatusColor = (status: string) => {switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PROCESSING':
        return 'warning';
      case 'ERROR':
        return 'error';
      default:
        return 'default';}
  };

  const getClearanceColor = (clearance: string) => {switch (clearance) {
      case 'RED':
        return '#F44336';
      case 'YELLOW':
        return '#FF9800';
      case 'GREEN':
        return '#4CAF50';
      default:
        return '#9E9E9E';}
  };

  return (<Box sx={{ height: '100vh', display: 'flex'}}>{/* Agent Toolbox */}<Drawer
        variant='persistent'
        anchor='left'
        open={isToolboxOpen}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%',},
        }}
      ><Toolbar><Typography variant='h6' noWrap component='div'>AI Agent Toolbox</Typography></Toolbar>{/* AI Swarm Status */}<Box sx={{ p: 2}}><Card><CardContent><Typography variant='subtitle1' gutterBottom>AI Swarm Status</Typography><Box sx={{ display: 'flex', alignItems: 'center', mb: 1}}><Chip
                  label={swarmStatus}
                  color={swarmStatus === 'PROCESSING' ? 'warning' : 'success'}
                  size='small' /><Typography variant='body2' sx={{ ml: 1}}>{aiAgents.length} agents</Typography></Box><Typography variant='caption' color='text.secondary'>Supreme Commander: 1 | Field Generals: 7 | Operational: {aiAgents.length - 8}</Typography></CardContent></Card></Box>{/* Agent Templates */}<Typography variant='subtitle1' sx={{ px: 2, py: 1}}>Drag & Drop Agents</Typography><List>{agentTemplates.map((template) => {
            const IconComponent = template.icon;
            return (<ListItem
                key={template.id}
                draggable
                onDragStart={(event) => onDragStart(event, template.id)}
                sx={{
                  cursor: 'grab',
                  '&:hover': { backgroundColor: 'action.hover'},
                  borderLeft: '4px solid ' + template.color,
                  mb: 1,
                }}
              ><ListItemIcon><IconComponent sx={{ color: template.color}} /></ListItemIcon><ListItemText
                  primary={template.name}
                  secondary={template.description}
                  primaryTypographyProps={{ variant: 'body2'}}
                  secondaryTypographyProps={{ variant: 'caption'}} />{template.type !== 'SERVICE' && (<Chip
                    label={template.type === 'SUPREME_COMMANDER'
                        ? 'RED'
                        : template.type === 'FIELD_GENERAL'
                          ? 'YELLOW'
                          : 'GREEN'}
                    size='small'
                    sx={{
                      backgroundColor: getClearanceColor(
                        template.type === 'SUPREME_COMMANDER'
                          ? 'RED'
                          : template.type === 'FIELD_GENERAL'
                            ? 'YELLOW'
                            : 'GREEN'
                      ),
                      color: 'white',
                      fontSize: '10px',}} />)}</ListItem>);
          })}</List>{/* Active Agents */}<Typography variant='subtitle1' sx={{ px: 2, py: 1}}>Active Agents ({aiAgents.filter((a) => a.status === 'ACTIVE').length})</Typography><List dense>{aiAgents.slice(0, 10).map((agent) => (<ListItem key={agent.id}><ListItemIcon><Badge
                  badgeContent={agent.type === 'SUPREME_COMMANDER'
                      ? 'SC'
                      : agent.type === 'FIELD_GENERAL'
                        ? 'FG'
                        : 'OA'}
                  color={getAgentStatusColor(agent.status)}
                ><Psychology sx={{ color: getClearanceColor(agent.securityClearance)}} /></Badge></ListItemIcon><ListItemText
                primary={agent.name}
                secondary={agent.status + ' | ' + agent.performanceMetrics.tasksCompleted + ' tasks'}
                primaryTypographyProps={{ variant: 'caption'}}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary'}} /></ListItem>))}</List></Drawer>{/* Main Workflow Canvas */}<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column'}}>{/* Toolbar */}<Toolbar variant='dense' sx={{ borderBottom: 1, borderColor: 'divider'}}><IconButton onClick={() =>setIsToolboxOpen(!isToolboxOpen)}>
            {isToolboxOpen ?<VisibilityOff />:<Visibility />}
          </IconButton><Typography variant='h6' component='div' sx={{ flexGrow: 1}}>TerraFusion AI Workflow Designer</Typography><Chip
            label={workflowStatus}
            color={workflowRunning ? 'warning' : workflowStatus.includes('Error') ? 'error' : 'success'}
            sx={{ mr: 1}} /><IconButton onClick={handleWorkflowSave} color='primary'><Save /></IconButton><IconButton
            onClick={handleWorkflowExecute}
            color='success'
            disabled={workflowRunning || nodes.length === 0}
          >{workflowRunning ?<Stop />:<PlayArrow />}
          </IconButton>{selectedNode && (<IconButton onClick={() => setConfigDialog(true)} color='secondary'><Settings /></IconButton>)}

          {selectedNode && (<IconButton onClick={handleNodeDelete} color='error'><Delete /></IconButton>)}</Toolbar>{/* React Flow Canvas */}<Box
          ref={reactFlowWrapper}
          sx={{
            flexGrow: 1,
            '& .react-flow__node': {
              border: '2px solid transparent',},
            '& .react-flow__node.selected': {border: '2px solid #1976d2',},
          }}
        ><ReactFlowComponent
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Strict}
            defaultViewport={{ x: 0, y: 0, zoom: 1}}
            attributionPosition='bottom-left'
          ><ControlsComponent /><MiniMapComponent nodeStrokeColor='#1976d2' nodeColor='#e3f2fd' nodeBorderRadius={2} /><BackgroundComponent variant={BackgroundVariant.Dots} gap={20} size={1} /></ReactFlowComponent></Box></Box>{/* Node Configuration Dialog */}<Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth='md' fullWidth><DialogTitle>Configure {selectedNode?.data.label}</DialogTitle><DialogContent>{selectedNode && (<Grid container spacing={2} sx={{ mt: 1}}><Grid item xs={12} md={6}><TextField
                  fullWidth
                  label='Agent Name'
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: { ...selectedNode.data, label: e.target.value},
                    };
                    setSelectedNode(updatedNode);
                    setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? updatedNode : n)));
                  }}
                /></Grid><Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>Compliance Level</InputLabel><Select
                    value={selectedNode.data.complianceLevel || 'GREEN'}
                    label='Compliance Level'
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: {
                          ...selectedNode.data,
                          complianceLevel: e.target.value as 'RED' | 'YELLOW' | 'GREEN',},
                      };
                      setSelectedNode(updatedNode);
                      setNodes((nds) =>
                        nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                      );
                    }}
                  ><MenuItem value='RED'>RED (Top Secret)</MenuItem><MenuItem value='YELLOW'>YELLOW (Secret)</MenuItem><MenuItem value='GREEN'>GREEN (Confidential)</MenuItem></Select></FormControl></Grid>{selectedNode.data.agentType && (<Grid item xs={12}><Typography variant='subtitle2' gutterBottom>Agent Configuration</Typography><Box sx={{ pl: 2}}><Typography variant='body2'>Type: {selectedNode.data.agentType}</Typography><Typography variant='body2'>Specialization:{' '}
                      {selectedNode.data.configuration?.specialization?.join(', ') || 'General'}</Typography><Typography variant='body2'>Security Clearance: {selectedNode.data.configuration?.securityClearance}</Typography></Box></Grid>)}<Grid item xs={12}><Typography variant='subtitle2' gutterBottom>Government Standards</Typography><Box sx={{ pl: 2}}>{(selectedNode.data.governmentStandards || []).map((standard) => (<Chip
                      key={standard}
                      label={standard}
                      size='small'
                      sx={{ mr: 1, mb: 1}}
                      color='primary' />))}</Box></Grid></Grid>)}</DialogContent><DialogActions><Button onClick={() => setConfigDialog(false)}>Cancel</Button><Button onClick={() =>setConfigDialog(false)} variant='contained'>
            Save Configuration</Button></DialogActions></Dialog></Box>
  );
};

export default WorkflowDesigner;
