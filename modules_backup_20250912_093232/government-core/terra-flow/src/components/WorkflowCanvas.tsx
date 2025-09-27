import React, {useState, useCallback, useRef, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Plus,
  Play,
  Trash2,
  Settings,
  ArrowRight,
  GitBranch,
  Database,
  Globe,
  Cpu,
  Zap,} from 'lucide-react';

interface WorkflowNode {id: string;
  type: 'start' | 'action' | 'condition' | 'end';
  title: string;
  description: string;
  position: { x: number; y: number};
  inputs: string[];
  outputs: string[];
  config: Record<string, any>;
}

interface WorkflowConnection {id: string;
  fromNode: string;
  toNode: string;
  fromOutput: string;
  toInput: string;}

interface WorkflowCanvasProps {className?: string;}

const nodeTypes = [
  {type: 'action', label: 'Action', icon: Play, color: 'bg-blue-500'},
  {type: 'condition', label: 'Condition', icon: GitBranch, color: 'bg-yellow-500'},
  {type: 'database', label: 'Database', icon: Database, color: 'bg-green-500'},
  {type: 'api', label: 'API Call', icon: Globe, color: 'bg-purple-500'},
  {type: 'transform', label: 'Transform', icon: Cpu, color: 'bg-red-500'},
  {type: 'ai', label: 'AI Process', icon: Zap, color: 'bg-orange-500'},
];

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({className}) => {const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'start',
      type: 'start',
      title: 'Start',
      description: 'Workflow entry point',
      position: { x: 100, y: 200},
      inputs: [],
      outputs: ['output'],
      config: {},
    },
  ]);

  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{isDragging: boolean;
    nodeId: string | null;
    offset: { x: number; y: number};
  }>({isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0},
  });

  const [showNodePalette, setShowNodePalette] = useState(false);
  const [connectionState, setConnectionState] = useState<{isConnecting: boolean;
    fromNode: string | null;
    fromOutput: string | null;}>({isConnecting: false,
    fromNode: null,
    fromOutput: null,});

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeMouseDown = useCallback(
    (nodeId: string, event: React.MouseEvent) =>{event.preventDefault();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const offset = {
        x: event.clientX - node.position.x,
        y: event.clientY - node.position.y,};

      setDragState({isDragging: true,
        nodeId,
        offset,});
      setSelectedNode(nodeId);
    },
    [nodes]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {if (!dragState.isDragging || !dragState.nodeId) return;

      const newPosition = {
        x: event.clientX - dragState.offset.x,
        y: event.clientY - dragState.offset.y,};

      setNodes(prev =>
        prev.map(node => (node.id === dragState.nodeId ? {...node, position: newPosition} : node))
      );
    },
    [dragState]
  );

  const handleMouseUp = useCallback(() => {setDragState({
      isDragging: false,
      nodeId: null,
      offset: { x: 0, y: 0},
    });
  }, []);

  useEffect(() => {if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);};
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const addNode = useCallback((type: string, position: {x: number; y: number}) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: type as any,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      description: `New ${type} node`,
      position,
      inputs: ['input'],
      outputs: ['output'],
      config: {},
    };

    setNodes(prev => [...prev, newNode]);
    setShowNodePalette(false);
  }, []);

  const deleteNode = useCallback(
    (nodeId: string) => {if (nodeId === 'start') return; // Prevent deleting start node

      setNodes(prev => prev.filter(node => node.id !== nodeId));
      setConnections(prev =>
        prev.filter(conn => conn.fromNode !== nodeId && conn.toNode !== nodeId)
      );

      if (selectedNode === nodeId) {
        setSelectedNode(null);}
    },
    [selectedNode]
  );

  const startConnection = useCallback((nodeId: string, outputId: string) => {setConnectionState({
      isConnecting: true,
      fromNode: nodeId,
      fromOutput: outputId,});
  }, []);

  const completeConnection = useCallback(
    (toNodeId: string, toInputId: string) => {
      if (!connectionState.isConnecting || !connectionState.fromNode) return;

      const newConnection: WorkflowConnection = {
        id: `conn-${Date.now()}`,
        fromNode: connectionState.fromNode,
        toNode: toNodeId,
        fromOutput: connectionState.fromOutput || 'output',
        toInput: toInputId,
      };

      setConnections(prev => [...prev, newConnection]);
      setConnectionState({isConnecting: false,
        fromNode: null,
        fromOutput: null,});
    },
    [connectionState]
  );

  const renderNode = (node: WorkflowNode) => {
    const nodeTypeInfo = nodeTypes.find(nt => nt.type === node.type);
    const isSelected = selectedNode === node.id;
    const isDragging = dragState.isDragging && dragState.nodeId === node.id;

    return (<motion.div
        key={node.id}
        layout
        initial={{ scale: 0, opacity: 0}}
        animate={{
          scale: isDragging ? 1.05 : 1,
          opacity: 1,
          zIndex: isDragging ? 50 : isSelected ? 20 : 10,}}
        transition={{ duration: 0.2}}
        className={`absolute bg-white rounded-lg shadow-lg border-2 cursor-move ${
          isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: 200,
          minHeight: 120,}}
        onMouseDown={e =>handleNodeMouseDown(node.id, e)}
      >
        {/* Node Header */}<div
          className={`p-3 rounded-t-lg ${
            node.type === 'start' ? 'bg-green-500' : nodeTypeInfo?.color || 'bg-gray-500'} text-white`}
        ><div className="flex items-center justify-between"><div className="flex items-center gap-2">{nodeTypeInfo?.icon &&<nodeTypeInfo.icon className="w-4 h-4" />}
              <span className="font-medium text-sm">{node.title}</span></div>{node.id !== 'start' && (<button
                onClick={e => {
                  e.stopPropagation();
                  deleteNode(node.id);}}
                className="text-white/70 hover:text-white transition-colors"
              ><Trash2 className="w-4 h-4" /></button>)}</div></div>{/* Node Content */}<div className="p-3"><p className="text-sm text-gray-600 mb-3">{node.description}</p>{/* Input Connectors */}
          {node.inputs.length > 0 && (<div className="flex gap-1 mb-2">{node.inputs.map((input, index) => (<div
                  key={input}
                  className="w-3 h-3 bg-blue-400 rounded-full cursor-pointer hover:bg-blue-500 transition-colors"
                  style={{ marginLeft: index * 20}}
                  onClick={() =>completeConnection(node.id, input)}
                  title={`Input: ${input}`}
                />
              ))}</div>)}

          {/* Output Connectors */}
          {node.outputs.length > 0 && (<div className="flex gap-1 justify-end">{node.outputs.map((output, index) => (<div
                  key={output}
                  className="w-3 h-3 bg-green-400 rounded-full cursor-pointer hover:bg-green-500 transition-colors"
                  style={{ marginRight: index * 20}}
                  onClick={() =>startConnection(node.id, output)}
                  title={`Output: ${output}`}
                />
              ))}</div>)}</div>{/* AI Enhancement Indicator */}
        {node.type !== 'start' && (<div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>)}</motion.div>);
  };

  const renderConnection = (connection: WorkflowConnection) => {
    const fromNode = nodes.find(n => n.id === connection.fromNode);
    const toNode = nodes.find(n => n.id === connection.toNode);

    if (!fromNode || !toNode) return null;

    const startX = fromNode.position.x + 200;
    const startY = fromNode.position.y + 60;
    const endX = toNode.position.x;
    const endY = toNode.position.y + 60;

    const pathData = `M ${startX} ${startY} C ${startX + 50} ${startY} ${endX - 50} ${endY} ${endX} ${endY}`;

    return (<motion.path
        key={connection.id}
        d={pathData}
        stroke="#6B7280"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0}}
        animate={{ pathLength: 1}}
        transition={{ duration: 0.5}}
        markerEnd="url(#arrowhead)"
        className="hover:stroke-blue-500 transition-colors cursor-pointer" />);
  };

  return (<div
      className={`workflow-canvas relative h-full bg-gray-50 overflow-hidden ${className || ''}`}
    >{/* Canvas */}<div
        ref={canvasRef}
        className="relative w-full h-full"
        onDoubleClick={e =>{
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,};

          setShowNodePalette(true);
        }}
      >
        {/* Grid Background */}<div className="absolute inset-0 opacity-20"><svg width="100%" height="100%" className="pointer-events-none"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg></div>{/* Connections SVG */}<svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1}}><defs><marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            ><polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" /></marker></defs>{connections.map(renderConnection)}</svg>{/* Nodes */}<div className="relative" style={{ zIndex: 10}}>{nodes.map(renderNode)}</div></div>{/* Node Palette */}<AnimatePresence>{showNodePalette && (<motion.div
            initial={{ opacity: 0, scale: 0.9}}
            animate={{ opacity: 1, scale: 1}}
            exit={{ opacity: 0, scale: 0.9}}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
          ><h3 className="text-lg font-semibold mb-4">Add Node</h3><div className="grid grid-cols-2 gap-3">{nodeTypes.map(nodeType => (<motion.button
                  key={nodeType.type}
                  whileHover={{ scale: 1.05}}
                  whileTap={{ scale: 0.95}}
                  onClick={() => addNode(nodeType.type, { x: 300, y: 300})}
                  className={`flex items-center gap-2 p-3 rounded-lg ${nodeType.color} text-white hover:opacity-90 transition-opacity`}
                ><nodeType.icon className="w-5 h-5" /><span className="text-sm font-medium">{nodeType.label}</span></motion.button>))}</div><button
              onClick={() =>setShowNodePalette(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel</button></motion.div>)}</AnimatePresence>{/* Toolbar */}<div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-40"><div className="flex gap-2"><motion.button
            whileHover={{ scale: 1.05}}
            whileTap={{ scale: 0.95}}
            onClick={() => setShowNodePalette(true)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Add Node"
          ><Plus className="w-5 h-5" /></motion.button><motion.button
            whileHover={{ scale: 1.05}}
            whileTap={{ scale: 0.95}}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            title="Run Workflow"
          ><Play className="w-5 h-5" /></motion.button><motion.button
            whileHover={{ scale: 1.05}}
            whileTap={{ scale: 0.95}}
            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="Settings"
          ><Settings className="w-5 h-5" /></motion.button></div></div>{/* Instructions */}
      {nodes.length === 1 && (<div className="absolute bottom-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md"><h4 className="font-medium text-blue-900 mb-2">Getting Started</h4><ul className="text-sm text-blue-700 space-y-1"><li>• Double-click to add nodes</li><li>• Drag nodes to reposition</li><li>• Click output dots to start connections</li><li>• Click input dots to complete connections</li></ul></div>)}</div>
  );
};

export default WorkflowCanvas;
