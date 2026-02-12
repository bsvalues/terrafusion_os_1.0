/**
 * Map Composer Component
 *
 * This component provides a comprehensive GIS map interface with
 * layer management, drawing tools, and analysis capabilities.
 * It integrates with the AI agents to allow for intelligent spatial operations.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layers,
  Map,
  Pen,
  MapPin,
  Ruler,
  Cog,
  Refresh,
  EyeOff,
  Eye,
  Trash2,
  Save,
  Plus,
  Download,
  Share2,
  PanelLeft,
  Maximize,
 } from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAgentActivity } from '@/hooks/use-agent-activity';
import { AIPulseIndicator } from '@/components/ui/ai-pulse-indicator';

// Layer interface
interface MapLayer {
  id: number;
  name: string;
  type: 'vector' | 'raster' | 'tile' | 'wms' | 'geojson';
  url?: string;
  data?: any;
  visible: boolean;
  opacity: number;
  zIndex: number;
  attribution?: string;
  metadata?: any;
}

// Map project interface
interface MapProject {
  id: number;
  name: string;
  description?: string;
  layers: MapLayer[];
  center: [number, number];
  zoom: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Component props
interface MapComposerProps {
  projectId?: number;
  editable?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
  onLayerClick?: (layer: MapLayer) => void;
  onMapClick?: (event: any) => void;
}

/**
 * Map Composer Component
 */
export function MapComposer({
  projectId,
  editable = true,
  height = '600px',
  width = '100%',
  className,
  onLayerClick,
  onMapClick,
}: MapComposerProps) {
  // Map container ref
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [activeTab, setActiveTab] = useState('layers');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-122.4194, 37.7749]); // Default to San Francisco
  const [mapZoom, setMapZoom] = useState(12);
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Toast
  const { toast } = useToast();

  // Agent activity
  const { submitTask, activeTasks } = useAgentActivity();

  // Fetch map project
  const {
    data: mapProject,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery({
    queryKey: ['/api/gis/map-projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const response = await fetch(`/api/gis/map-projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch map project');
      return (await response.json()) as MapProject;
    },
    enabled: !!projectId,
  });

  // Fetch available layers
  const { data: availableLayers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['/api/gis/layers'],
    queryFn: async () => {
      const response = await fetch('/api/gis/layers');
      if (!response.ok) throw new Error('Failed to fetch layers');
      return (await response.json()) as MapLayer[];
    },
  });

  // Save map project mutation
  const saveProjectMutation = useMutation({
    mutationFn: async (project: Partial<MapProject>) => {
      const url = projectId ? `/api/gis/map-projects/${projectId}` : '/api/gis/map-projects';

      const method = projectId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) throw new Error('Failed to save map project');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Map project saved successfully',
        variant: 'default',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: `Failed to save map project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // In a real implementation, this would use a mapping library
    // like Leaflet, Mapbox GL, or OpenLayers
    const initializeMap = async () => {
      try {
        // Mock map instance for this example
        const mockMapInstance = {
          setCenter: (center: [number, number]) => setMapCenter(center),
          getCenter: () => mapCenter,
          setZoom: (zoom: number) => setMapZoom(zoom),
          getZoom: () => mapZoom,
          addLayer: (layer: any) => ,
          removeLayer: (layerId: number) => ,
          on: (event: string, callback: any) => ,
        };

        setMapInstance(mockMapInstance);

        // Register event listeners
        if (onMapClick) {
          mockMapInstance.on('click', onMapClick);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize map',
          variant: 'destructive',
        });
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      // In a real implementation, this would clean up the map instance
      if (mapInstance) {
        // mapInstance.remove();
      }
    };
  }, [mapContainerRef, onMapClick, toast]);

  // Load project data
  useEffect(() => {
    if (mapProject && mapInstance) {
      // Set map center and zoom
      setMapCenter(mapProject.center);
      setMapZoom(mapProject.zoom);

      // Set layers
      setLayers(mapProject.layers);
    }
  }, [mapProject, mapInstance]);

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: number) => {
    setLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer))
    );
  };

  // Update layer opacity
  const updateLayerOpacity = (layerId: number, opacity: number) => {
    setLayers(prev => prev.map(layer => (layer.id === layerId ? { ...layer, opacity } : layer)));
  };

  // Remove layer
  const removeLayer = (layerId: number) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
  };

  // Add layer
  const addLayer = (layer: MapLayer) => {
    setLayers(prev => [...prev, layer]);
  };

  // Save map project
  const saveProject = () => {
    if (!mapInstance) return;

    const project: Partial<MapProject> = {
      name: mapProject?.name || 'New Map Project',
      description: mapProject?.description || '',
      layers,
      center: mapCenter,
      zoom: mapZoom,
    };

    saveProjectMutation.mutate(project);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!isFullscreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    setIsFullscreen(!isFullscreen);
  };

  // Handle tool activation
  const activateTool = (tool: string) => {
    setActiveTool(prevTool => (prevTool === tool ? null : tool));
  };

  // Run spatial analysis
  const runSpatialAnalysis = (analysisType: string) => {
    setIsAnalyzing(true);

    // Get the selected layer
    const selectedLayer = layers.find(layer => layer.id === selectedLayerId);

    if (!selectedLayer) {
      toast({
        title: 'Error',
        description: 'Please select a layer to analyze',
        variant: 'destructive',
      });
      setIsAnalyzing(false);
      return;
    }

    // Submit task to GIS specialist agent
    submitTask('gis_specialist', `analyze_${analysisType}`, {
      layerId: selectedLayer.id,
      layerName: selectedLayer.name,
      analysisType,
      mapExtent: {
        center: mapCenter,
        zoom: mapZoom,
      },
    });

    toast({
      title: 'Analysis Started',
      description: `${analysisType} analysis started on layer "${selectedLayer.name}"`,
      variant: 'default',
    });
  };

  // Check for topology errors
  const checkTopologyErrors = () => {
    setIsAnalyzing(true);

    // Get the selected layer
    const selectedLayer = layers.find(layer => layer.id === selectedLayerId);

    if (!selectedLayer) {
      toast({
        title: 'Error',
        description: 'Please select a layer to check',
        variant: 'destructive',
      });
      setIsAnalyzing(false);
      return;
    }

    // Submit task to topology repair agent
    submitTask('topology_repair', 'topology_check', {
      layerId: selectedLayer.id,
      layerName: selectedLayer.name,
      rules: [
        { ruleType: 'must_not_self_intersect' },
        { ruleType: 'must_not_overlap' },
        { ruleType: 'must_not_have_gaps' },
      ],
    });

    toast({
      title: 'Topology Check Started',
      description: `Checking topology errors on layer "${selectedLayer.name}"`,
      variant: 'default',
    });
  };

  // Generate export dialog
  const exportOptions = [
    { value: 'geojson', label: 'GeoJSON' },
    { value: 'shapefile', label: 'Shapefile' },
    { value: 'kml', label: 'KML' },
    { value: 'csv', label: 'CSV' },
  ];

  // Loading state
  if (isLoadingProject || isLoadingLayers) {
    return (
      <div className="flex items-center justify-center" style={{ height, width }}>
        <div className="flex flex-col items-center gap-2">
          <Refresh className="w-8 h-8 animate-spin text-primary" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (projectError) {
    return (
      <div className="flex items-center justify-center" style={{ height, width }}>
        <div className="flex flex-col items-center gap-2 text-destructive">
<>
          <p>Error loading map project:</p>
          <p
</>>{projectError instanceof Error ? projectError.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative border rounded-md overflow-hidden bg-background', className)}
      style={{ height, width }}
    >
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{
          left: showLayerPanel ? '300px' : '0',
          right: '0',
          transition: 'left 0.3s ease-in-out',
        }}
      >
        {/* Map will be rendered here by the mapping library */}
        {/* This is a placeholder for the actual map */}
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <div className="text-center">
            <Map className="w-16 h-16 mx-auto mb-4 text-primary opacity-20" />
<>
            <p className="text-muted-foreground">Map view would render here</p>
            <p
</> className="text-xs text-muted-foreground mt-1">
              Center: {mapCenter.join(', ')} | Zoom: {mapZoom}
            </p>
          </div>
        </div>
      </div>

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="absolute top-0 left-0 bottom-0 w-[300px] bg-background border-r overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 py-2 border-b">
              <TabsList className="w-full">
                <TabsTrigger value="layers" className="flex-1">
<>
                  <Layers className="w-4 h-4 mr-2" />
                  Layers
                </TabsTrigger>
                <TabsTrigger
</> value="analysis" className="flex-1">
                  <Cog className="w-4 h-4 mr-2" />
                  Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="layers" className="p-0 m-0">
              <div className="p-4">
                <div className="mb-4 flex justify-between items-center">
<>
                  <h3 className="text-sm font-medium">Map Layers</h3>
                  <Button
</>
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Show layer selection dialog
                      // This would be implemented with a Dialog component
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Layer List */}
                <div className="space-y-3">
                  {layers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No layers added to this map
                    </p>
                  ) : (
                    layers.map(layer => (
                      <Card
                        key={layer.id}
                        className={cn(
                          'p-0 overflow-hidden',
                          selectedLayerId === layer.id && 'border-primary'
                        )}
                        onClick={() => setSelectedLayerId(layer.id)}
                      >
                        <div className="p-3">
                          <div className="flex justify-between items-center mb-2">
<>
                            <h4 className="text-sm font-medium truncate">{layer.name}</h4>
                            <div
</> className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleLayerVisibility(layer.id)}
                              >
                                {layer.visible ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
<>
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
</>
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeLayer(layer.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
<>
                            <Label htmlFor={`opacity-${layer.id}`} className="text-xs">
                              Opacity:
                            </Label>
                            <Slider
</>
                              id={`opacity-${layer.id}`}
                              min={0}
                              max={1}
                              step={0.1}
                              value={[layer.opacity]}
                              onValueChange={([value]) => updateLayerOpacity(layer.id, value)}
                              className="flex-1"
                            />
                            <span className="text-xs w-8 text-center">
                              {Math.round(layer.opacity * 100)}%
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="p-0 m-0">
              <div className="p-4">
                <h3 className="text-sm font-medium mb-4">Spatial Analysis</h3>

                {/* Analysis Tools */}
                <div className="space-y-3">
                  <Card className="p-3">
<>
                    <CardTitle className="text-sm">Topology</CardTitle>
                    <CardDescription
</> className="text-xs">
                      Check and repair geometry errors
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!selectedLayerId || isAnalyzing}
                        onClick={checkTopologyErrors}
                      >
                        Check Errors
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-3">
<>
                    <CardTitle className="text-sm">Statistics</CardTitle>
                    <CardDescription
</> className="text-xs">
                      Calculate statistics on layer data
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!selectedLayerId || isAnalyzing}
                        onClick={() => runSpatialAnalysis('statistics')}
                      >
                        Calculate
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-3">
<>
                    <CardTitle className="text-sm">Buffer</CardTitle>
                    <CardDescription
</> className="text-xs">
                      Create buffer zones around features
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!selectedLayerId || isAnalyzing}
                        onClick={() => runSpatialAnalysis('buffer')}
                      >
                        Create Buffer
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-3">
<>
                    <CardTitle className="text-sm">Intersection</CardTitle>
                    <CardDescription
</> className="text-xs">
                      Find where features overlap
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={layers.length < 2 || isAnalyzing}
                        onClick={() => runSpatialAnalysis('intersection')}
                      >
                        Find Intersections
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          title={showLayerPanel ? 'Hide panel' : 'Show panel'}
        >
<>
          <PanelLeft className="h-4 w-4" />
        </Button>

        <Button
</>
          variant="secondary"
          size="icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* Drawing Tools */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-background border rounded-md shadow-sm flex z-10">
        <Button
          variant={activeTool === 'pan' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none"
          onClick={() => activateTool('pan')}
          title="Pan"
        >
<>
          <MapPin className="h-4 w-4" />
        </Button>
        <Button
</>
          variant={activeTool === 'draw' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none"
          onClick={() => activateTool('draw')}
          title="Draw"
        >
<>
          <Pen className="h-4 w-4" />
        </Button>
        <Button
</>
          variant={activeTool === 'measure' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none"
          onClick={() => activateTool('measure')}
          title="Measure"
        >
          <Ruler className="h-4 w-4" />
        </Button>
      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-background border rounded-md shadow-sm flex z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={saveProject}
          disabled={!editable || saveProjectMutation.isPending}
          title="Save"
        >
<>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>

        <Dialog
</>>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" title="Export">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
<>
              <DialogTitle>Export Map</DialogTitle>
              <DialogDescription
</>>
                Choose a format to export the current map view or selected layer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                {exportOptions.map(option => (
                  <Button key={option.value} variant="outline">
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="export-selected" />
                <Label htmlFor="export-selected">Export selected layer only</Label>
              </div>
            </div>
            <DialogFooter>
              <Button>Export</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="sm" title="Share">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>

      {/* AI Pulse Indicator */}
      <AIPulseIndicator position="bottom-right" />
    </div>
  );
}

export default MapComposer;

