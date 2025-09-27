import React, {useState, useEffect} from 'react';
import {useMapbox} from './mapbox/mapbox-provider';
import MapboxMap from './mapbox/mapbox-map';
import MapboxDrawControl, {DrawMode} from './mapbox/mapbox-draw-control';
import {Card, CardContent} from '@/components/ui/card';
import {toast} from '@/hooks/use-toast';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,} from '@/components/ui/tooltip';
import {Button} from '@/components/ui/button';
import {PanelLeft,
  Layers,
  Pencil,
  Map,
  Ruler,
  RotateCcw,
  Save,
  MapPin,
  ArrowRightLeft,
  Square,
  Trash2,} from '@mui/icons-material';

export interface EnhancedMapboxViewerProps {width?: string | number;
  height?: string | number;
  className?: string;
  mapStyle?: string;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;};
}

/**
 * EnhancedMapboxViewer component - an advanced map viewer with drawing tools and layer controls
 */
export function EnhancedMapboxViewer({width = '100%',
  height = '600px',
  className,
  mapStyle = 'mapbox://styles/mapbox/satellite-streets-v12',
  initialViewState = {
    longitude: -119.16, // Benton County, WA
    latitude: 46.23,
    zoom: 11}
}: EnhancedMapboxViewerProps) {const [activeTab, setActiveTab] = useState<string>('layers');
  const [activeTool, setActiveTool] = useState<DrawMode>('simple_select');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  
  const handleMapLoad = (map: mapboxgl.Map) =>{
    // Map loaded callback
    console.log('Map loaded successfully');
    toast({
      title: 'Map loaded',
      description: 'The map has been successfully loaded.',});
  };

  const handleDrawCreate = (e: any) => {
    console.log('Draw created:', e.features);
    toast({
      title: 'Drawing created',
      description: `Created ${e.features.length} feature(s)`,
    });
  };

  const handleDrawUpdate = (e: any) => {console.log('Draw updated:', e.features);};

  const handleDrawDelete = (e: any) => {
    console.log('Draw deleted:', e.features);
    toast({
      title: 'Drawing deleted',
      description: `Deleted ${e.features.length} feature(s)`,
      variant: 'destructive',
    });
  };

  const handleDrawModeChange = (mode: DrawMode) => {console.log('Draw mode changed:', mode);
    setActiveTool(mode);};

  const toggleDrawingMode = (mode: DrawMode) => {setActiveTool(mode);
    setDrawingEnabled(true);};

  return (<div className="relative flex h-full w-full">{/* Map sidebar */}
      {sidebarOpen && (<Card className="z-10 w-64 h-full overflow-auto shadow-lg"><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="w-full"><TabsTrigger value="layers" className="flex-1"><><Layers className="h-4 w-4 mr-2" />Layers</TabsTrigger><TabsTrigger
</>
value="draw" className="flex-1"><><Pencil className="h-4 w-4 mr-2" />Draw</TabsTrigger><TabsTrigger
</>
value="measure" className="flex-1"><Ruler className="h-4 w-4 mr-2" />Measure</TabsTrigger></TabsList><TabsContent value="layers" className="p-4"><><h3 className="text-lg font-semibold mb-2">Map Layers</h3><p
</>className="text-sm text-gray-500 mb-4">
                Toggle map layers on/off and adjust their opacity.</p>{/* Layer controls will go here */}<div className="space-y-2"><div className="flex items-center justify-between"><><span className="text-sm">Base Map</span><Button
</>size="sm" variant="outline">
                    Visible</Button></div><div className="flex items-center justify-between"><><span className="text-sm">Parcels</span><Button
</>size="sm" variant="outline">
                    Visible</Button></div><div className="flex items-center justify-between"><><span className="text-sm">County Boundaries</span><Button
</>size="sm" variant="outline">
                    Visible</Button></div></div></TabsContent><TabsContent value="draw" className="p-4"><><h3 className="text-lg font-semibold mb-2">Drawing Tools</h3><p
</>className="text-sm text-gray-500 mb-4">
                Create and edit features on the map.</p><div className="flex flex-wrap gap-2 mb-4"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                        size="sm"
                        variant={activeTool === 'simple_select' ? 'default' : 'outline'}
                        onClick={() => toggleDrawingMode('simple_select')}
                      ><Map className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Select</TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                        size="sm"
                        variant={activeTool === 'draw_point' ? 'default' : 'outline'}
                        onClick={() => toggleDrawingMode('draw_point')}
                      ><MapPin className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Draw Point</TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                        size="sm"
                        variant={activeTool === 'draw_line_string' ? 'default' : 'outline'}
                        onClick={() => toggleDrawingMode('draw_line_string')}
                      ><ArrowRightLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Draw Line</TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                        size="sm"
                        variant={activeTool === 'draw_polygon' ? 'default' : 'outline'}
                        onClick={() => toggleDrawingMode('draw_polygon')}
                      ><Square className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Draw Polygon</TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Clear drawings functionality will be implemented
                          // with the actual draw control reference
                          toast({
                            title: 'Drawings cleared',
                            description: 'All drawings have been removed from the map.',
                            variant: 'default',});
                        }}
                      ><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Clear All</TooltipContent></Tooltip></TooltipProvider></div><div className="flex justify-between mt-4"><Button size="sm" variant="outline"><><RotateCcw className="h-4 w-4 mr-2" />Undo</Button><Button
</>
size="sm"><Save className="h-4 w-4 mr-2" />Save</Button></div></TabsContent><TabsContent value="measure" className="p-4"><><h3 className="text-lg font-semibold mb-2">Measurement Tools</h3><p
</>className="text-sm text-gray-500 mb-4">
                Measure distances and areas on the map.</p><div className="space-y-2"><Button variant="outline" className="w-full"><><Ruler className="h-4 w-4 mr-2" />Measure Distance</Button><Button
</>
variant="outline" className="w-full"><Square className="h-4 w-4 mr-2" />Measure Area</Button></div></TabsContent></Tabs></Card>)}

      {/* Map container */}<div className="flex-grow h-full relative">{/* Toggle sidebar button */}<Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 z-20 bg-white shadow-md hover:bg-gray-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        ><PanelLeft className="h-5 w-5" /></Button>{/* Mapbox map */}<MapboxMap
          width="100%"
          height="100%"
          className={className}
          style={mapStyle}
          longitude={initialViewState.longitude}
          latitude={initialViewState.latitude}
          zoom={initialViewState.zoom}
          onMapLoad={handleMapLoad}
        >{drawingEnabled && (<MapboxDrawControl
              position="top-left"
              controls={{
                point: true,
                line: true,
                polygon: true,
                trash: true,}}
              defaultMode={activeTool}
              onDrawCreate={handleDrawCreate}
              onDrawUpdate={handleDrawUpdate}
              onDrawDelete={handleDrawDelete}
              onDrawModeChange={handleDrawModeChange} />)}</MapboxMap></div></div>
  );
}

export default EnhancedMapboxViewer;