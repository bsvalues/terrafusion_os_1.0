import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus,
  Save,
  Play,
  Settings,
  Trash2,
  Copy,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  Move,
  ArrowRight,
  Database,
  Mail,
  Calendar,
  Code,
  Globe,
  FileText,
  Check,
  X,
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
  connections: string[];
  config: any;
  status?: 'idle' | 'running' | 'completed' | 'error';
}

interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle: string;
  targetHandle: string;
}

interface NodeTemplate {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  config: any;
}

interface WorkflowBuilderProps {
  className?: string;
  onSave?: (workflow: any) => void;
  onRun?: (workflow: any) => void;
  initialWorkflow?: any;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'start',
    name: 'Start',
    description: 'Workflow entry point',
    icon: <Play className="w-5 h-5" />,
    category: 'Control',
    config: {}
  },
  {
    type: 'database',
    name: 'Database Query',
    description: 'Execute database operations',
    icon: <Database className="w-5 h-5" />,
    category: 'Data',
    config: { query: '', connection: '' }
  },
  {
    type: 'email',
    name: 'Send Email',
    description: 'Send email notifications',
    icon: <Mail className="w-5 h-5" />,
    category: 'Communication',
    config: { to: '', subject: '', body: '' }
  },
  {
    type: 'schedule',
    name: 'Schedule',
    description: 'Time-based triggers',
    icon: <Calendar className="w-5 h-5" />,
    category: 'Control',
    config: { cron: '', timezone: 'UTC' }
  },
  {
    type: 'script',
    name: 'Run Script',
    description: 'Execute custom code',
    icon: <Code className="w-5 h-5" />,
    category: 'Logic',
    config: { language: 'javascript', code: '' }
  },
  {
    type: 'api',
    name: 'API Call',
    description: 'HTTP API requests',
    icon: <Globe className="w-5 h-5" />,
    category: 'Integration',
    config: { url: '', method: 'GET', headers: {}, body: '' }
  },
  {
    type: 'transform',
    name: 'Transform Data',
    description: 'Data transformation',
    icon: <FileText className="w-5 h-5" />,
    category: 'Data',
    config: { mapping: {} }
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Conditional branching',
    icon: <ArrowRight className="w-5 h-5" />,
    category: 'Logic',
    config: { expression: '', trueAction: '', falseAction: '' }
  }
];

const categories = ['All', 'Control', 'Data', 'Communication', 'Logic', 'Integration'];

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  className,
  onSave,
  onRun,
  initialWorkflow
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NodeTemplate | null>(null);
  const [draggedNode, setDraggedNode] = useState<NodeTemplate | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showNodePanel, setShowNodePanel] = useState(true);
  const [showProperties, setShowProperties] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; handle: string } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Load initial workflow
  useEffect(() => {
    if (initialWorkflow) {
      setNodes(initialWorkflow.nodes || []);
      setConnections(initialWorkflow.connections || []);
    }
  }, [initialWorkflow]);

  const filteredTemplates = nodeTemplates.filter(template => {
    const matchesCategory = categoryFilter === 'All' || template.category === categoryFilter;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDragStart = useCallback((template: NodeTemplate) => {
    setDraggedNode(template);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - canvasOffset.x) / zoom;
    const y = (event.clientY - rect.top - canvasOffset.y) / zoom;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: draggedNode.type,
      name: draggedNode.name,
      description: draggedNode.description,
      icon: draggedNode.icon,
      position: { x, y },
      connections: [],
      config: { ...draggedNode.config },
      status: 'idle'
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedNode(null);
  }, [draggedNode, canvasOffset, zoom]);

  const handleNodeClick = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
    setShowProperties(true);
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.sourceId !== nodeId && c.targetId !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setShowProperties(false);
    }
  }, [selectedNode]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.target === canvasRef.current) {
      setIsDragging(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      
      setCanvasOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  }, [isDragging, lastMousePos]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const handleSave = useCallback(() => {
    const workflow = {
      nodes,
      connections,
      metadata: {
        name: 'Untitled Workflow',
        description: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
    onSave?.(workflow);
  }, [nodes, connections, onSave]);

  const handleRun = useCallback(() => {
    const workflow = { nodes, connections };
    onRun?.(workflow);
  }, [nodes, connections, onRun]);

  const getNodeIcon = (type: string) => {
    const template = nodeTemplates.find(t => t.type === type);
    return template?.icon || <Settings className="w-5 h-5" />;
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'database': return 'bg-blue-500';
      case 'email': return 'bg-purple-500';
      case 'schedule': return 'bg-orange-500';
      case 'script': return 'bg-gray-500';
      case 'api': return 'bg-cyan-500';
      case 'transform': return 'bg-yellow-500';
      case 'condition': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`workflow-builder h-full flex ${className || ''}`}>
      {/* Node Palette */}
      <AnimatePresence>
        {showNodePanel && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Node Library</h3>
              <p className="text-sm text-gray-500 mb-4">Drag to add to workflow</p>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {filteredTemplates.map(template => (
                  <motion.div
                    key={template.type}
                    draggable
                    onDragStart={() => handleDragStart(template)}
                    onDragEnd={handleDragEnd}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg cursor-move border-2 border-transparent hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${getNodeColor(template.type)} text-white`}>
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-xs text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNodePanel(!showNodePanel)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Grid className="w-5 h-5" />
              </button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              
              <span className="text-sm text-gray-600 px-2">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Undo className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Redo className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              
              <button
                onClick={handleRun}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Run
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          <div
            ref={canvasRef}
            className="w-full h-full relative"
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{
              backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
            }}
          >
            {/* Workflow Nodes */}
            <div
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`
              }}
              className="absolute top-0 left-0"
            >
              {nodes.map(node => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    left: node.position.x,
                    top: node.position.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`bg-white rounded-lg shadow-md border-2 p-4 min-w-40 cursor-pointer transition-all ${
                    selectedNode?.id === node.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded ${getNodeColor(node.type)} text-white`}>
                      {getNodeIcon(node.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{node.name}</h4>
                      <p className="text-xs text-gray-500">{node.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeDelete(node.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Connection Points */}
                  <div className="flex justify-between">
                    <div className="w-3 h-3 bg-gray-300 rounded-full border-2 border-white -ml-6 mt-1" />
                    <div className="w-3 h-3 bg-gray-300 rounded-full border-2 border-white -mr-6 mt-1" />
                  </div>

                  {/* Status Indicator */}
                  {node.status && (
                    <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${
                      node.status === 'completed' ? 'bg-green-500' :
                      node.status === 'running' ? 'bg-blue-500' :
                      node.status === 'error' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="mb-4">
                    <Plus className="w-16 h-16 mx-auto text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Building Your Workflow</h3>
                  <p className="text-gray-500 mb-6">Drag nodes from the panel to create your automation workflow</p>
                  <button
                    onClick={() => setShowNodePanel(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Open Node Library
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <AnimatePresence>
        {showProperties && selectedNode && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 bg-white border-l border-gray-200 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Node Properties</h3>
                <button
                  onClick={() => setShowProperties(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${getNodeColor(selectedNode.type)} text-white`}>
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedNode.name}</h4>
                  <p className="text-sm text-gray-500">{selectedNode.type}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Node Name
                  </label>
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) => handleNodeUpdate(selectedNode.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedNode.description}
                    onChange={(e) => handleNodeUpdate(selectedNode.id, { description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Node-specific configuration */}
                {selectedNode.type === 'email' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        To Email
                      </label>
                      <input
                        type="email"
                        value={selectedNode.config.to || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, to: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={selectedNode.config.subject || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, subject: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Body
                      </label>
                      <textarea
                        value={selectedNode.config.body || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, body: e.target.value }
                        })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'database' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Connection String
                      </label>
                      <input
                        type="text"
                        value={selectedNode.config.connection || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, connection: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SQL Query
                      </label>
                      <textarea
                        value={selectedNode.config.query || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, query: e.target.value }
                        })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'api' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL
                      </label>
                      <input
                        type="url"
                        value={selectedNode.config.url || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, url: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Method
                      </label>
                      <select
                        value={selectedNode.config.method || 'GET'}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, method: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Body
                      </label>
                      <textarea
                        value={selectedNode.config.body || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, body: e.target.value }
                        })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'schedule' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cron Expression
                      </label>
                      <input
                        type="text"
                        value={selectedNode.config.cron || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, cron: e.target.value }
                        })}
                        placeholder="0 0 * * *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={selectedNode.config.timezone || 'UTC'}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, timezone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedNode.type === 'script' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={selectedNode.config.language || 'javascript'}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, language: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="bash">Bash</option>
                        <option value="powershell">PowerShell</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code
                      </label>
                      <textarea
                        value={selectedNode.config.code || ''}
                        onChange={(e) => handleNodeUpdate(selectedNode.id, { 
                          config: { ...selectedNode.config, code: e.target.value }
                        })}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => handleNodeDelete(selectedNode.id)}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Node
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowBuilder;
