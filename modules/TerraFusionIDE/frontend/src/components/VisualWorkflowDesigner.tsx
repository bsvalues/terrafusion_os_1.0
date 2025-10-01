/**
 * Visual Workflow Designer - Drag-and-drop government process designer
 * Transforms visual workflows into executable TerraFusion modules
 */
import React, { useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { DynamicTFCard, DynamicTFButton, DynamicTFHeading, DynamicTFFlex } from './DynamicTerraFusion';
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  Zap, 
  GitBranch, 
  CheckCircle
} from 'lucide-react';

const DesignerContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--tf-color-dark);
`;

const ToolBar = styled.div`
  background: rgba(26, 31, 58, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md);
`;

const DesignerWorkspace = styled.div`
  flex: 1;
  display: flex;
`;

const ComponentPalette = styled.div`
  width: 300px;
  background: rgba(26, 31, 58, 0.8);
  border-right: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md);
  overflow-y: auto;
`;

const Canvas = styled.div`
  flex: 1;
  position: relative;
  background: 
    radial-gradient(circle at 25% 25%, rgba(0, 153, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(0, 255, 238, 0.1) 0%, transparent 50%),
    var(--tf-color-dark);
  overflow: hidden;
`;

const PropertiesPanel = styled.div`
  width: 350px;
  background: rgba(26, 31, 58, 0.8);
  border-left: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md);
  overflow-y: auto;
`;

const WorkflowNode = styled.div<{ 
  x: number; 
  y: number; 
  selected?: boolean;
  nodeType: string;
}>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  min-width: 200px;
  padding: var(--tf-spacing-md);
  background: ${props => {
    switch (props.nodeType) {
      case 'start': return 'linear-gradient(135deg, var(--tf-color-success) 0%, var(--tf-color-accent) 100%)';
      case 'process': return 'linear-gradient(135deg, var(--tf-color-primary) 0%, var(--tf-color-transcend) 100%)';
      case 'decision': return 'linear-gradient(135deg, var(--tf-color-warning) 0%, var(--tf-color-primary) 100%)';
      case 'end': return 'linear-gradient(135deg, var(--tf-color-error) 0%, var(--tf-color-warning) 100%)';
      default: return 'var(--tf-color-primary)';
    }
  }};
  border: ${props => props.selected ? '2px solid var(--tf-color-transcend)' : '1px solid rgba(255, 255, 255, 0.2)'};
  border-radius: var(--tf-radius-lg);
  color: white;
  cursor: move;
  box-shadow: var(--tf-shadow-lg);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--tf-shadow-transcend);
  }
`;

const ComponentItem = styled.div<{ nodeType: string }>`
  display: flex;
  align-items: center;
  padding: var(--tf-spacing-sm);
  margin-bottom: var(--tf-spacing-xs);
  background: rgba(0, 153, 255, 0.1);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: var(--tf-radius-md);
  cursor: grab;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 153, 255, 0.2);
    transform: translateX(5px);
  }
  
  &:active {
    cursor: grabbing;
  }
  
  svg {
    margin-right: var(--tf-spacing-sm);
    color: ${props => {
      switch (props.nodeType) {
        case 'start': return 'var(--tf-color-success)';
        case 'process': return 'var(--tf-color-primary)';
        case 'decision': return 'var(--tf-color-warning)';
        case 'end': return 'var(--tf-color-error)';
        default: return 'var(--tf-color-accent)';
      }
    }};
  }
`;

interface WorkflowNode {
  id: string;
  type: 'start' | 'process' | 'decision' | 'end';
  name: string;
  x: number;
  y: number;
  properties: Record<string, any>;
}

interface WorkflowConnection {
  from: string;
  to: string;
  condition?: string;
}

export const VisualWorkflowDesigner: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const componentTypes = [
    { type: 'start', name: 'Start Process', icon: Play, description: 'Begin government workflow' },
    { type: 'process', name: 'AI Process', icon: Zap, description: 'AI-enhanced processing step' },
    { type: 'decision', name: 'Decision Point', icon: GitBranch, description: 'Government decision logic' },
    { type: 'end', name: 'Complete', icon: CheckCircle, description: 'Workflow completion' }
  ];

  const handleDragStart = (componentType: string) => {
    setDraggedComponent(componentType);
    setIsDragging(true);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedComponent || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: draggedComponent as any,
      name: `${draggedComponent.charAt(0).toUpperCase() + draggedComponent.slice(1)} Step`,
      x: Math.max(0, x - 100),
      y: Math.max(0, y - 50),
      properties: {
        aiEnhanced: true,
        governmentCompliant: true,
        description: `AI-generated ${draggedComponent} step`
      }
    };
    
    setNodes(prev => [...prev, newNode]);
    setDraggedComponent(null);
    setIsDragging(false);
  }, [draggedComponent]);

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node);
  };

  const handleGenerateCode = async () => {
    try {
      const workflow = {
        name: "Custom Government Workflow",
        description: "AI-generated government workflow",
        nodes,
        connections
      };

      const response = await fetch('/api/ai-code-generation/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Workflow code generated successfully!\n\nFiles created:\n${Object.keys(result.generatedFiles).join('\n')}`);
      } else {
        alert('Code generation failed: ' + result.errorMessage);
      }
    } catch (error) {
      alert('Failed to generate code: ' + error);
    }
  };

  const handleSaveWorkflow = () => {
    const workflow = { nodes, connections };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terrafusion-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        setNodes(workflow.nodes || []);
        setConnections(workflow.connections || []);
      } catch (error) {
        alert('Failed to load workflow file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <DesignerContainer>
      <ToolBar>
        <DynamicTFFlex justify="space-between" align="center">
          <DynamicTFFlex align="center" gap="var(--tf-spacing-md)">
            <div style={{
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🎨
            </div>
            <div>
              <DynamicTFHeading level={4} style={{ margin: 0 }}>
                Visual Workflow Designer
              </DynamicTFHeading>
              <p style={{ 
                color: 'var(--tf-color-gray)', 
                fontSize: '0.875rem',
                margin: 0 
              }}>
                AI-Enhanced Government Process Designer
              </p>
            </div>
          </DynamicTFFlex>
          
          <DynamicTFFlex gap="var(--tf-spacing-sm)">
            <input
              type="file"
              accept=".json"
              onChange={handleLoadWorkflow}
              style={{ display: 'none' }}
              id="load-workflow"
            />
            <label htmlFor="load-workflow">
              <DynamicTFButton variant="ghost" as="span">
                <Upload size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Load
              </DynamicTFButton>
            </label>
            
            <DynamicTFButton variant="secondary" onClick={handleSaveWorkflow}>
              <Save size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
              Save
            </DynamicTFButton>
            
            <DynamicTFButton variant="accent" onClick={handleGenerateCode}>
              <Zap size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
              Generate Code
            </DynamicTFButton>
            
            <DynamicTFButton variant="primary">
              <Download size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
              Deploy
            </DynamicTFButton>
          </DynamicTFFlex>
        </DynamicTFFlex>
      </ToolBar>

      <DesignerWorkspace>
        <ComponentPalette>
          <DynamicTFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
            Workflow Components
          </DynamicTFHeading>
          
          {componentTypes.map(component => {
            const IconComponent = component.icon;
            return (
              <ComponentItem
                key={component.type}
                nodeType={component.type}
                draggable
                onDragStart={() => handleDragStart(component.type)}
              >
                <IconComponent size={20} />
                <div>
                  <div style={{ fontWeight: 600 }}>{component.name}</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--tf-color-gray)',
                    marginTop: '2px'
                  }}>
                    {component.description}
                  </div>
                </div>
              </ComponentItem>
            );
          })}
          
          <div style={{ marginTop: 'var(--tf-spacing-lg)' }}>
            <DynamicTFHeading level={6} style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
              Government Templates
            </DynamicTFHeading>
            
            <DynamicTFButton variant="ghost" size="sm" fullWidth style={{ marginBottom: 'var(--tf-spacing-xs)' }}>
              Property Valuation Workflow
            </DynamicTFButton>
            <DynamicTFButton variant="ghost" size="sm" fullWidth style={{ marginBottom: 'var(--tf-spacing-xs)' }}>
              Appeal Processing Workflow
            </DynamicTFButton>
            <DynamicTFButton variant="ghost" size="sm" fullWidth style={{ marginBottom: 'var(--tf-spacing-xs)' }}>
              Permit Application Workflow
            </DynamicTFButton>
            <DynamicTFButton variant="ghost" size="sm" fullWidth>
              Citizen Service Workflow
            </DynamicTFButton>
          </div>
        </ComponentPalette>

        <Canvas
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Render workflow nodes */}
          {nodes.map(node => (
            <WorkflowNode
              key={node.id}
              x={node.x}
              y={node.y}
              nodeType={node.type}
              selected={selectedNode?.id === node.id}
              onClick={() => handleNodeClick(node)}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--tf-spacing-xs)' }}>
                {node.type === 'start' && <Play size={16} />}
                {node.type === 'process' && <Zap size={16} />}
                {node.type === 'decision' && <GitBranch size={16} />}
                {node.type === 'end' && <CheckCircle size={16} />}
                <span style={{ marginLeft: 'var(--tf-spacing-xs)', fontWeight: 600 }}>
                  {node.name}
                </span>
              </div>
              
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                {node.properties.description}
              </div>
              
              {node.properties.aiEnhanced && (
                <div style={{
                  marginTop: 'var(--tf-spacing-xs)',
                  padding: '2px 6px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--tf-radius-sm)',
                  fontSize: '0.625rem',
                  textAlign: 'center'
                }}>
                  🤖 AI Enhanced
                </div>
              )}
            </WorkflowNode>
          ))}

          {/* Render connections */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {connections.map((connection, index) => {
              const fromNode = nodes.find(n => n.id === connection.from);
              const toNode = nodes.find(n => n.id === connection.to);
              
              if (!fromNode || !toNode) return null;
              
              const x1 = fromNode.x + 100;
              const y1 = fromNode.y + 50;
              const x2 = toNode.x + 100;
              const y2 = toNode.y + 50;
              
              return (
                <g key={index}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="var(--tf-color-primary)"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="var(--tf-color-primary)"
                />
              </marker>
            </defs>
          </svg>

          {/* Drop zone indicator */}
          {isDragging && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 153, 255, 0.1)',
              border: '2px dashed var(--tf-color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'var(--tf-color-primary)',
              pointerEvents: 'none'
            }}>
              Drop workflow component here
            </div>
          )}
        </Canvas>

        <PropertiesPanel>
          <DynamicTFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
            Properties
          </DynamicTFHeading>
          
          {selectedNode ? (
            <DynamicTFCard variant="elevated" style={{ padding: 'var(--tf-spacing-md)' }}>
              <DynamicTFHeading level={6} style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
                {selectedNode.name}
              </DynamicTFHeading>
              
              <div style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--tf-spacing-xs)',
                  fontSize: '0.875rem',
                  color: 'var(--tf-color-gray)'
                }}>
                  Node Name:
                </label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => {
                    setNodes(prev => prev.map(node => 
                      node.id === selectedNode.id 
                        ? { ...node, name: e.target.value }
                        : node
                    ));
                    setSelectedNode({ ...selectedNode, name: e.target.value });
                  }}
                  style={{
                    width: '100%',
                    padding: 'var(--tf-spacing-sm)',
                    background: 'rgba(26, 31, 58, 0.8)',
                    border: '1px solid rgba(0, 153, 255, 0.3)',
                    borderRadius: 'var(--tf-radius-md)',
                    color: 'var(--tf-color-light)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--tf-spacing-xs)',
                  fontSize: '0.875rem',
                  color: 'var(--tf-color-gray)'
                }}>
                  Description:
                </label>
                <textarea
                  value={selectedNode.properties.description || ''}
                  onChange={(e) => {
                    setNodes(prev => prev.map(node => 
                      node.id === selectedNode.id 
                        ? { ...node, properties: { ...node.properties, description: e.target.value }}
                        : node
                    ));
                  }}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 'var(--tf-spacing-sm)',
                    background: 'rgba(26, 31, 58, 0.8)',
                    border: '1px solid rgba(0, 153, 255, 0.3)',
                    borderRadius: 'var(--tf-radius-md)',
                    color: 'var(--tf-color-light)',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--tf-color-gray)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedNode.properties.aiEnhanced || false}
                    onChange={(e) => {
                      setNodes(prev => prev.map(node => 
                        node.id === selectedNode.id 
                          ? { ...node, properties: { ...node.properties, aiEnhanced: e.target.checked }}
                          : node
                      ));
                    }}
                    style={{ marginRight: 'var(--tf-spacing-xs)' }}
                  />
                  AI Enhanced Processing
                </label>
              </div>

              <div style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--tf-color-gray)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedNode.properties.governmentCompliant || false}
                    onChange={(e) => {
                      setNodes(prev => prev.map(node => 
                        node.id === selectedNode.id 
                          ? { ...node, properties: { ...node.properties, governmentCompliant: e.target.checked }}
                          : node
                      ));
                    }}
                    style={{ marginRight: 'var(--tf-spacing-xs)' }}
                  />
                  Government Compliant
                </label>
              </div>

              <DynamicTFButton 
                variant="transcendent" 
                size="sm" 
                fullWidth
                onClick={() => {
                  // AI enhance this specific node
                  alert(`AI enhancing ${selectedNode.name}...`);
                }}
              >
                🤖 AI Enhance Node
              </DynamicTFButton>
            </DynamicTFCard>
          ) : (
            <DynamicTFCard variant="elevated" style={{ padding: 'var(--tf-spacing-md)' }}>
              <p style={{ 
                color: 'var(--tf-color-gray)',
                textAlign: 'center',
                fontSize: '0.875rem'
              }}>
                Select a workflow node to edit its properties
              </p>
              
              <div style={{ marginTop: 'var(--tf-spacing-md)' }}>
                <DynamicTFHeading level={6} style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
                  Workflow Statistics
                </DynamicTFHeading>
                <div style={{ fontSize: '0.875rem', color: 'var(--tf-color-gray)' }}>
                  <div>Nodes: {nodes.length}</div>
                  <div>Connections: {connections.length}</div>
                  <div>AI Enhanced: {nodes.filter(n => n.properties.aiEnhanced).length}</div>
                  <div>Compliant: {nodes.filter(n => n.properties.governmentCompliant).length}</div>
                </div>
              </div>
            </DynamicTFCard>
          )}

          <div style={{ marginTop: 'var(--tf-spacing-lg)' }}>
            <DynamicTFHeading level={6} style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
              AI Assistant
            </DynamicTFHeading>
            
            <DynamicTFCard variant="transcendent" style={{ padding: 'var(--tf-spacing-md)' }}>
              <div style={{ fontSize: '0.875rem', marginBottom: 'var(--tf-spacing-sm)' }}>
                🤖 AI is analyzing your workflow...
              </div>
              
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--tf-color-transcend)',
                marginBottom: 'var(--tf-spacing-sm)'
              }}>
                Suggestions:
                <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                  <li>Add error handling step</li>
                  <li>Include compliance validation</li>
                  <li>Optimize for performance</li>
                </ul>
              </div>
              
              <DynamicTFButton variant="ghost" size="sm" fullWidth>
                Apply AI Suggestions
              </DynamicTFButton>
            </DynamicTFCard>
          </div>
        </PropertiesPanel>
      </DesignerWorkspace>
    </DesignerContainer>
  );
};
