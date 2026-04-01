import React, { useEffect, useRef, useState } from 'react';
import { ProjectModule } from './ProjectTracker';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, CircleSlash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DependencyGraphProps {
  modules: ProjectModule[];
  onModuleClick?: (module: ProjectModule) => void;
}

interface Position {
  x: number;
  y: number;
}

interface Node {
  id: string;
  module: ProjectModule;
  position: Position;
  level: number;
}

interface Edge {
  source: string;
  target: string;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return '#10b981'; // green-500
    case 'in-progress':
      return '#3b82f6'; // blue-500
    case 'planned':
      return '#6b7280'; // gray-500
    case 'blocked':
      return '#ef4444'; // red-500
    case 'skipped':
      return '#9ca3af'; // gray-400
    default:
      return '#6b7280'; // gray-500
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'in-progress':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'planned':
      return <Clock className="h-4 w-4 text-gray-500" />;
    case 'blocked':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'skipped':
      return <CircleSlash className="h-4 w-4 text-gray-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const DependencyGraph: React.FC<DependencyGraphProps> = ({ modules, onModuleClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 800, height: 600 });

  // Calculate graph layout
  useEffect(() => {
    if (modules.length === 0) return;

    // Map module IDs to level (dependency depth)
    const moduleLevels = new Map<string, number>();
    const moduleMap = new Map<string, ProjectModule>();
    
    // Create a map for quick module lookup
    modules.forEach(module => {
      moduleMap.set(module.id, module);
    });

    // Calculate dependency levels
    const calculateLevels = (moduleId: string, currentLevel = 0): number => {
      if (moduleLevels.has(moduleId) && (moduleLevels.get(moduleId) || 0) >= currentLevel) {
        return moduleLevels.get(moduleId) || 0;
      }
      
      moduleLevels.set(moduleId, currentLevel);
      
      const module = moduleMap.get(moduleId);
      if (!module || !module.dependencies || module.dependencies.length === 0) {
        return currentLevel;
      }
      
      let maxChildLevel = currentLevel;
      for (const depId of module.dependencies) {
        const childLevel = calculateLevels(depId, currentLevel + 1);
        maxChildLevel = Math.max(maxChildLevel, childLevel);
      }
      
      return maxChildLevel;
    };
    
    // Get all root modules (no dependencies)
    const rootModules = modules.filter(module => !module.dependencies || module.dependencies.length === 0);
    
    // Start level calculation from roots
    rootModules.forEach(module => {
      calculateLevels(module.id);
    });
    
    // Check for any modules that haven't been assigned a level yet (might be in a circular dependency)
    modules.forEach(module => {
      if (!moduleLevels.has(module.id)) {
        calculateLevels(module.id);
      }
    });
    
    // Get max level for layout calculations
    const maxLevel = Math.max(...Array.from(moduleLevels.values()));
    
    // Count modules per level for layout
    // Count modules per level for layout using a regular object instead of Map
    const modulesPerLevel: Record<number, number> = {};
    
    // Convert Map values to Array and count modules per level
    Array.from(moduleLevels.values()).forEach(level => {
      modulesPerLevel[level] = (modulesPerLevel[level] || 0) + 1;
    });
    
    // Position nodes based on levels
    const levelWidth = 200;
    const levelHeight = 100;
    const nodeWidth = 160;
    const nodeHeight = 80;
    
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Calculate node positions by level
    modules.forEach(module => {
      const level = moduleLevels.get(module.id) || 0;
      const modulesInLevel = modulesPerLevel[level] || 1;
      const moduleIndexInLevel = Array.from(moduleLevels.entries())
        .filter(([_, l]) => l === level)
        .findIndex(([id, _]) => id === module.id);
      
      const x = (level * levelWidth) + (nodeWidth / 2);
      const y = ((moduleIndexInLevel / modulesInLevel) * (modulesInLevel * levelHeight)) + (nodeHeight / 2);
      
      newNodes.push({
        id: module.id,
        module,
        position: { x, y },
        level
      });
      
      // Create edges
      if (module.dependencies) {
        module.dependencies.forEach(depId => {
          newEdges.push({
            source: depId,
            target: module.id
          });
        });
      }
    });
    
    // Calculate required SVG dimensions
    const graphWidth = (maxLevel + 1) * levelWidth + nodeWidth;
    // Convert object values to numbers and calculate max height
    const moduleLevelValues = Object.values(modulesPerLevel).map(count => (count as number) * levelHeight);
    const graphHeight = (moduleLevelValues.length > 0 ? Math.max(...moduleLevelValues) : levelHeight) + nodeHeight;
    
    setSvgDimensions({
      width: Math.max(800, graphWidth),
      height: Math.max(600, graphHeight)
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [modules]);

  // Handle module click
  const handleModuleClick = (module: ProjectModule) => {
    setSelectedModule(selectedModule === module.id ? null : module.id);
    if (onModuleClick) {
      onModuleClick(module);
    }
  };

  // Path generator for edges
  const generatePath = (source: Position, target: Position): string => {
    const midX = (source.x + target.x) / 2;
    return `M${source.x},${source.y} C${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
  };

  if (modules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md border border-gray-200">
        <div className="text-gray-500 text-sm">No modules to display</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700">
        <p>The dependency graph shows relationships between different modules in the project.</p>
        <p className="mt-2">Arrows indicate dependencies, flowing from prerequisite modules to dependent modules.</p>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4">
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <Clock className="h-3 w-3 mr-1" />
          Planned
        </Badge>
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Blocked
        </Badge>
      </div>
      
      <Card className="p-0 overflow-auto">
        <div className="overflow-auto max-h-[70vh]">
          <svg 
            ref={svgRef}
            width={svgDimensions.width} 
            height={svgDimensions.height}
            className="min-w-full"
          >
            <g className="edges">
              {edges.map((edge, index) => {
                const sourceNode = nodes.find(node => node.id === edge.source);
                const targetNode = nodes.find(node => node.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                const isHighlighted = 
                  selectedModule === edge.source || 
                  selectedModule === edge.target ||
                  hoveredModule === edge.source ||
                  hoveredModule === edge.target;
                
                return (
                  <g key={`edge-${index}`}>
                    <path
                      d={generatePath(sourceNode.position, targetNode.position)}
                      stroke={isHighlighted ? "#000" : "#ccc"}
                      strokeWidth={isHighlighted ? 2 : 1}
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </g>
            
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
              </marker>
            </defs>
            
            <g className="nodes">
              {nodes.map(node => {
                const isSelected = selectedModule === node.id;
                const isHovered = hoveredModule === node.id;
                const nodeColor = getStatusColor(node.module.status);
                
                return (
                  <g 
                    key={node.id}
                    transform={`translate(${node.position.x - 80}, ${node.position.y - 40})`}
                    onClick={() => handleModuleClick(node.module)}
                    onMouseEnter={() => setHoveredModule(node.id)}
                    onMouseLeave={() => setHoveredModule(null)}
                    style={{ cursor: 'pointer' }}
                    className="transition-all duration-300"
                  >
                    <rect
                      width="160"
                      height="80"
                      rx="5"
                      ry="5"
                      fill={isSelected || isHovered ? `${nodeColor}20` : "white"}
                      stroke={nodeColor}
                      strokeWidth={isSelected || isHovered ? 2 : 1}
                      className="transition-all duration-300"
                    />
                    
                    <foreignObject width="150" height="70" x="5" y="5">
                      <div className="h-full overflow-hidden flex flex-col">
                        <div className="flex items-center gap-1 text-xs font-medium truncate">
                          {getStatusIcon(node.module.status)}
                          <span>{node.module.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {node.module.status === 'in-progress' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs px-1">
                              {node.module.progress}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {node.module.description}
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </Card>
    </div>
  );
};

export default DependencyGraph;