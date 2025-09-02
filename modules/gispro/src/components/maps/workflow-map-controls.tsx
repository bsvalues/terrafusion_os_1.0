import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, 
  Hand, 
  Pointer, 
  PenTool, 
  Edit, 
  Map, 
  Ruler, 
  Square, 
  Circle, 
  Pencil, 
  Trash2, 
  FilePlus, 
  FileDown,
  FileUp
 } from '@mui/icons-material';
import { Workflow, WorkflowState } from '@shared/schema';
import { WorkflowType, workflowTypeLabels } from '@/lib/workflow-types';
import { MapTool } from '@/lib/map-utils';
import { GeoDataIO } from '@/components/maps/geo-data-io';
import { WorkflowMapIntegration } from '@/lib/workflow-map-integration';

type WorkflowMapControlsProps = {
  workflow: Workflow;
  activeTool: MapTool;
  onToolChange: (tool: MapTool) => void;
  onSaveGeometry: () => void;
  onImportGeoJSON: (data: any) => void;
  onExportGeoJSON: () => any;
  className?: string;
};

/**
 * Component that displays map controls specific to workflow type and state
 */
export function WorkflowMapControls({
  workflow,
  activeTool,
  onToolChange,
  onSaveGeometry,
  onImportGeoJSON,
  onExportGeoJSON,
  className = '',
}: WorkflowMapControlsProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [enabledTools, setEnabledTools] = useState<string[]>(['pan', 'select']);
  const [mapIntegration, setMapIntegration] = useState<WorkflowMapIntegration | null>(null);
  
  // Get workflow type and state
  const workflowType = workflow.type as WorkflowType;
  const workflowLabel = workflowTypeLabels[workflowType] || 'Workflow';
  
  // Fetch current workflow state
  const { data: workflowState } = useQuery<WorkflowState>({
    queryKey: ['/api/workflows', workflow.id, 'state'],
  });
  
  // Initialize and update the map integration service
  useEffect(() => {
    const integration = new WorkflowMapIntegration(workflow);
    setMapIntegration(integration);
    
    // Load state and get enabled tools
    const loadState = async () => {
      await integration.loadState();
      const tools = integration.getEnabledMapTools();
      setEnabledTools(tools);
    };
    
    loadState();
  }, [workflow, workflowState]);
  
  // Tool icon mapping
  const toolIcons = {
    [MapTool.PAN]: <Hand className="h-4 w-4" />,
    [MapTool.SELECT]: <Pointer className="h-4 w-4" />,
    [MapTool.MEASURE]: <Ruler className="h-4 w-4" />,
    [MapTool.DRAW]: <PenTool className="h-4 w-4" />,
    [MapTool.EDIT]: <Edit className="h-4 w-4" />,
  };
  
  // Tool labels for tooltips
  const toolLabels = {
    [MapTool.PAN]: 'Pan Map',
    [MapTool.SELECT]: 'Select Features',
    [MapTool.MEASURE]: 'Measure',
    [MapTool.DRAW]: 'Draw',
    [MapTool.EDIT]: 'Edit Features',
  };
  
  // Check if a tool is enabled based on workflow state
  const isToolEnabled = (tool: MapTool): boolean => {
    return enabledTools.includes(tool);
  };
  
  // Get workflow status badge color
  const getStatusBadgeVariant = (status?: string | null): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case 'draft': return 'outline';
      case 'in_progress': return 'default';
      case 'review': return 'secondary';
      case 'completed': return 'default';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };
  
  // Handle workflow-specific drawing tools
  const renderDrawingTools = () => {
    if (activeTool !== MapTool.DRAW) return null;
    
    // Different workflow types might need different drawing tools
    switch (workflowType) {
      case 'long_plat':
        return (
          <div className="flex justify-between items-center mt-2 space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw Parcel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Circle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw Circle</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw Line</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove Shape</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
        
      case 'bla':
        return (
          <div className="flex justify-between items-center mt-2 space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw Boundary Line</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw New Boundary</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove Boundary</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
        
      case 'merge_split':
        return (
          <div className="flex justify-between items-center mt-2 space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw New Parcel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw Line</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove Shape</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Log tool change when user selects a different tool
  const handleToolChange = (tool: MapTool) => {
    onToolChange(tool);
    
    // Log the interaction using the map integration service
    if (mapIntegration) {
      mapIntegration.logMapInteraction('tool_change', { 
        tool, 
        timestamp: new Date().toISOString() 
      });
    }
  };
  
  // Handle save operation
  const handleSave = () => {
    onSaveGeometry();
    
    // Log the save interaction
    if (mapIntegration) {
      mapIntegration.logMapInteraction('save_geometry', { 
        timestamp: new Date().toISOString() 
      });
    }
  };

  return (
    <Card className={`w-full border shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center"><>

              <Map className="mr-2 h-4 w-4" /> 
              {workflowLabel} Map Tools
            </CardTitle>
            <CardDescription
</>>
              Step {workflowState?.currentStep || '?'}: {workflowState?.currentStepName || 'Loading...'}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(workflowState?.status)}>
            {workflowState?.status || 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {/* Main map tools */}
        <Tabs defaultValue={activeTool} value={activeTool} onValueChange={(value) => handleToolChange(value as MapTool)}>
          <TabsList className="w-full grid grid-cols-5">
            {Object.values(MapTool).map((tool) => (
              <TooltipProvider key={tool}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value={tool}
                      disabled={!isToolEnabled(tool)}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {toolIcons[tool]}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{toolLabels[tool]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Render specific drawing tools if the draw tool is active */}
        {renderDrawingTools()}
        
        {/* Import/Export and Save */}
        <div className="flex justify-between mt-4">
          <div className="space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setImportDialogOpen(true)}
                    disabled={!enabledTools.includes('draw')}
                  >
                    <FileUp className="h-3.5 w-3.5 mr-1" />
                    Import
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import GeoJSON</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setExportDialogOpen(true)}
                  >
                    <FileDown className="h-3.5 w-3.5 mr-1" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export as GeoJSON</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={!enabledTools.includes('draw') && !enabledTools.includes('edit')}
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save Changes
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save map changes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
      
      {workflowState?.workflowSpecificControls && (
        <>
          <Separator />
          <CardFooter className="pt-2 pb-2">
            <div className="text-sm text-muted-foreground">
              {workflowState.workflowSpecificControls}
            </div>
          </CardFooter>
        </>
      )}
      
      {/* Import/Export Dialogs */}
      <GeoDataIO
        onImport={onImportGeoJSON}
        onExport={onExportGeoJSON}
        importDialogOpen={importDialogOpen}
        onImportDialogOpenChange={setImportDialogOpen}
        exportDialogOpen={exportDialogOpen}
        onExportDialogOpenChange={setExportDialogOpen}
      />
    </Card>
  );
}

export default WorkflowMapControls;