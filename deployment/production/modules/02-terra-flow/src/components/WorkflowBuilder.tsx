import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus,
  Play,
  Save,
  Settings,
  Trash2,
  GitBranch,
  Database,
  Globe,
  Mail,
  FileText,
  Filter,
  Shuffle,
  Clock,
  CheckCircle,
  AlertCircle,
  PauseCircle
 } from '@mui/icons-material';

// Types for our workflow system
interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'data';
  category: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  status: 'idle' | 'running' | 'completed' | 'error';
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: Record<string, any>;
  triggers: string[];
  status: 'draft' | 'active' | 'paused';
}

// Node templates for different apps
const NODE_TEMPLATES = {
  triggers: [
    {
      type: 'trigger',
      category: 'schedule',
      name: 'Schedule Trigger',
      description: 'Run workflow on a schedule',
      icon: Clock,
      color: 'from-green-500 to-emerald-600',
      config: { interval: '*/5 * * * *', timezone: 'UTC' }
    },
    {
      type: 'trigger',
      category: 'file',
      name: 'File Change',
      description: 'Trigger when files change',
      icon: FileText,
      color: 'from-blue-500 to-cyan-600',
      config: { path: '', events: ['create', 'modify'] }
    },
    {
      type: 'trigger',
      category: 'webhook',
      name: 'Webhook',
      description: 'HTTP webhook trigger',
      icon: Globe,
      color: 'from-purple-500 to-violet-600',
      config: { method: 'POST', path: '/webhook' }
    }
  ],
  actions: [
    {
      type: 'action',
      category: 'database',
      name: 'Database Query',
      description: 'Execute database query',
      icon: Database,
      color: 'from-orange-500 to-red-600',
      config: { query: '', connection: 'default' }
    },
    {
      type: 'action',
      category: 'email',
      name: 'Send Email',
      description: 'Send email notification',
      icon: Mail,
      color: 'from-pink-500 to-rose-600',
      config: { to: '', subject: '', body: '' }
    },
    {
      type: 'action',
      category: 'http',
      name: 'HTTP Request',
      description: 'Make HTTP API call',
      icon: Globe,
      color: 'from-indigo-500 to-blue-600',
      config: { url: '', method: 'GET', headers: {} }
    },
    {
      type: 'action',
      category: 'processing',
      name: 'Data Transform',
      description: 'Transform data using rules',
      icon: Shuffle,
      color: 'from-teal-500 to-cyan-600',
      config: { transformations: [] }
    }
  ],
  conditions: [
    {
      type: 'condition',
      category: 'logic',
      name: 'If Condition',
      description: 'Conditional logic branch',
      icon: GitBranch,
      color: 'from-yellow-500 to-amber-600',
      config: { condition: '', trueAction: '', falseAction: '' }
    },
    {
      type: 'condition',
      category: 'filter',
      name: 'Filter Data',
      description: 'Filter data based on criteria',
      icon: Filter,
      color: 'from-emerald-500 to-green-600',
      config: { filters: [] }
    }
  ]
};

// Component for draggable workflow nodes
const WorkflowNodeComponent: React.FC<{
  node: WorkflowNode;
  onNodeUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
  onNodeDelete: (id: string) => void;
  onNodeSelect: (id: string) => void;
  selected: boolean;
}> = ({ node, onNodeUpdate, onNodeDelete, onNodeSelect, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const template = [...NODE_TEMPLATES.triggers, ...NODE_TEMPLATES.actions, ...NODE_TEMPLATES.conditions]
    .find(t => t.name === node.name);

  const getStatusIcon = () => {
    switch (node.status) {
      case 'running': return <PauseCircle className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onNodeUpdate(node.id, {
          position: {
            x: node.position.x + info.offset.x,
            y: node.position.y + info.offset.y
          }
        });
      }}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05, zIndex: 1000 }}
      className={`absolute bg-white rounded-xl shadow-lg border-2 cursor-move min-w-[200px] ${
        selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
      }`}
      style={{
        left: node.position.x,
        top: node.position.y
      }}
      onClick={() => onNodeSelect(node.id)}
    >
      <div className={`h-2 rounded-t-xl bg-gradient-to-r ${template?.color || 'from-gray-400 to-gray-500'}`} />
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {template?.icon && (
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${template.color} text-white`}>
                <template.icon className="w-4 h-4" />
              </div>
            )}
            <div><>

              <h4 className="font-semibold text-gray-900 text-sm">{node.name}</h4>
              <p
</>

className="text-xs text-gray-500">{node.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            ><>

              <Settings className="w-3 h-3 text-gray-400" />
            </button>
            <button
</>

              onClick={(e) => {
                e.stopPropagation();
                onNodeDelete(node.id);
              }}
              className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Connection Points */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <div className="flex space-x-1">
            {node.inputs.map((input, _idx) => (<>

              <div
                key={input}
                className="w-3 h-3 rounded-full bg-blue-200 border-2 border-blue-400 cursor-pointer hover:bg-blue-300"
                title={`Input: ${input}`}
              />
            ))}
          </div>
          <div
</>

className="flex space-x-1">
            {node.outputs.map((output, _idx) => (
              <div
                key={output}
                className="w-3 h-3 rounded-full bg-green-200 border-2 border-green-400 cursor-pointer hover:bg-green-300"
                title={`Output: ${output}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            ><>

              <h3 className="text-lg font-semibold mb-4">Configure {node.name}</h3>
              <div
</>

className="space-y-4">
                <div><>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
</>

                    type="text"
                    value={node.name}
                    onChange={(e) => onNodeUpdate(node.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div><>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
</>

                    value={node.description}
                    onChange={(e) => onNodeUpdate(node.id, { description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                {/* Add more configuration fields based on node type */}
              </div>
              <div className="flex justify-end space-x-3 mt-6"><>

                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
</>

                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Node palette component
const NodePalette: React.FC<{
  onAddNode: (template: any) => void;
  visible: boolean;
}> = ({ onAddNode, visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          className="fixed left-4 top-20 bottom-4 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-200"><>

            <h3 className="font-semibold text-gray-900">Workflow Components</h3>
            <p
</>

className="text-sm text-gray-500">Drag to add to workflow</p>
          </div>
          
          <div className="p-4 overflow-y-auto">
            {Object.entries(NODE_TEMPLATES).map(([category, templates]) => (
              <div key={category} className="mb-6"><>

                <h4 className="font-medium text-gray-700 mb-3 capitalize">{category}</h4>
                <div
</>

className="space-y-2">
                  {templates.map((template, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onAddNode(template)}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color} text-white`}><>

                          <template.icon className="w-4 h-4" />
                        </div>
                        <div
</>

</>><>

                          <h5 className="font-medium text-gray-900 text-sm">{template.name}</h5>
                          <p
</>

className="text-xs text-gray-500">{template.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main workflow builder component
const WorkflowBuilder: React.FC<{
  workflow?: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => void;
  onClose: () => void;
}> = ({ workflow, onSave, onClose }) => {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowDefinition>(
    workflow || {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      description: 'A new workflow',
      nodes: [],
      connections: [],
      variables: {},
      triggers: [],
      status: 'draft'
    }
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddNode = useCallback((template: any) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: template.type,
      category: template.category,
      name: template.name,
      description: template.description,
      position: { x: 400, y: 200 },
      config: { ...template.config },
      inputs: template.type === 'trigger' ? [] : ['input'],
      outputs: ['output'],
      status: 'idle'
    };

    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn => 
        conn.source !== nodeId && conn.target !== nodeId
      )
    }));
  }, []);

  const handleSave = () => {
    onSave(currentWorkflow);
  };

  const handleRun = async () => {
    setIsRunning(true);
    
    // Simulate workflow execution
    for (const node of currentWorkflow.nodes) {
      handleNodeUpdate(node.id, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      handleNodeUpdate(node.id, { status: 'completed' });
    }
    
    setIsRunning(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-30">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={currentWorkflow.name}
              onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, name: e.target.value }))}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
            />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentWorkflow.status === 'active' ? 'bg-green-100 text-green-700' :
              currentWorkflow.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {currentWorkflow.status}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPalette(!showPalette)}
              className={`px-3 py-2 rounded-lg font-medium transition-all ${
                showPalette ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            ><>

              <Plus className="w-4 h-4" />
            </button>
            
            <motion
</>

</>.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRun}
              disabled={isRunning || currentWorkflow.nodes.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </motion.button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={canvasRef}
          className="absolute inset-0 bg-gray-50"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        >
          {/* Render workflow nodes */}
          {currentWorkflow.nodes.map(node => (
            <WorkflowNodeComponent
              key={node.id}
              node={node}
              onNodeUpdate={handleNodeUpdate}
              onNodeDelete={handleNodeDelete}
              onNodeSelect={setSelectedNodeId}
              selected={selectedNodeId === node.id}
            />
          ))}

          {/* Empty state */}
          {currentWorkflow.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="p-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center"><>

                  <GitBranch className="w-16 h-16 text-blue-600" />
                </div>
                <h3
</>

className="text-xl font-semibold text-gray-900 mb-2">
                  Start Building Your Workflow
                </h3><>

                <p className="text-gray-500 mb-4">
                  Drag components from the palette to create your automated workflow
                </p>
                <button
</>

                  onClick={() => setShowPalette(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Open Component Palette
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Node Palette */}
        <NodePalette
          onAddNode={handleAddNode}
          visible={showPalette}
        />
      </div>
    </div>
  );
};

export default WorkflowBuilder;