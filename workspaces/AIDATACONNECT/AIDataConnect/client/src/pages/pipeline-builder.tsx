import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  SourceNode, 
  TransformNode, 
  FilterNode, 
  JoinNode, 
  OutputNode 
} from '@/components/pipeline/nodes';

const nodeTypes = {
  source: SourceNode,
  transform: TransformNode,
  filter: FilterNode,
  join: JoinNode,
  output: OutputNode,
};

function Flow() {
  const { toast } = useToast();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [pipelineName, setPipelineName] = useState('');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const savePipelineMutation = useMutation({
    mutationFn: async () => {
      const pipeline = {
        name: pipelineName,
        nodes,
        edges,
      };
      const res = await apiRequest('POST', '/api/pipelines', pipeline);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Pipeline saved',
        description: 'Your pipeline has been saved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving pipeline',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - event.currentTarget.getBoundingClientRect().left,
        y: event.clientY - event.currentTarget.getBoundingClientRect().top,
      };

      const newNode = {
        id: `${type}-${nodes.length + 1}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Label htmlFor="pipeline-name">Pipeline Name</Label>
          <Input
            id="pipeline-name"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder="Enter pipeline name"
            className="w-64"
          />
        </div>
        <Button
          onClick={() => savePipelineMutation.mutate()}
          disabled={!pipelineName || savePipelineMutation.isPending}
        >
          {savePipelineMutation.isPending ? 'Saving...' : 'Save Pipeline'}
        </Button>
      </div>

      <div className="flex gap-6 flex-1">
        <div className="w-48 space-y-4">
          <h2 className="font-semibold">Nodes</h2>
          <div className="space-y-2">
            {['source', 'transform', 'filter', 'join', 'output'].map((type) => (
              <div
                key={type}
                className="p-2 border rounded cursor-move bg-background"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', type);
                  e.dataTransfer.effectAllowed = 'move';
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 border rounded-lg bg-background/50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

function PipelineBuilder() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default PipelineBuilder;