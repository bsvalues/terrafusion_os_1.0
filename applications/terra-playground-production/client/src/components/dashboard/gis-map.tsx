import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search,
  Layers,
  Maximize,
  Info,
  Map as MapIcon,
  PenTool,
  Settings,
  Mountain,
  BarChart4,
  Share2,
  Download,
  Ruler,
  ExternalLink,
 } from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import QGISMap from '@/components/gis/QGISMap';
import GISControlPanel from '@/components/gis/GISControlPanel';
import { GISProvider } from '@/contexts/gis-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMapProvider } from '@/services/map-provider-service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TerrainVisualization from '@/components/gis/TerrainVisualization';
import PredictiveAnalysisLayer from '@/components/gis/PredictiveAnalysisLayer';
import Map from 'ol/Map';

const GISMap = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [baseMapType, setBaseMapType] = useState<'osm' | 'satellite' | 'terrain'>('osm');
  const { currentProvider, providers, setCurrentProvider } = useMapProvider();
  const [map, setMap] = useState<Map | null>(null);
  const [showTerrainVisualization, setShowTerrainVisualization] = useState(false);
  const [showPredictiveAnalysis, setShowPredictiveAnalysis] = useState(false);
  const [activeVisualization, setActiveVisualization] = useState<'none' | 'terrain' | 'predictive'>(
    'none'
  );

  // Pass map instance from QGISMap to parent component
  const handleMapInit = (mapInstance: Map) => {
    setMap(mapInstance);
    console.debug('Map instance initialized successfully');

    // Set up event listeners for map performance monitoring
    if (mapInstance) {
      mapInstance.on('rendercomplete', () => {
        console.debug('Map render completed');
        // Could add performance metrics here in the future
      });

      // Handle map errors
      mapInstance.on('error', error => {
        console.error('Map error:', error);
      });
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    // In a real app, you would implement actual full screen functionality here
    // using the Fullscreen API or a library like react-full-screen
  };

  // Handle basemap type changes
  const handleBaseMapChange = (type: 'osm' | 'satellite' | 'terrain') => {
    setBaseMapType(type);
  };

  // Toggle terrain visualization
  const toggleTerrainVisualization = () => {
    if (activeVisualization === 'terrain') {
      setActiveVisualization('none');
      setShowTerrainVisualization(false);
    } else {
      setActiveVisualization('terrain');
      setShowTerrainVisualization(true);
      setShowPredictiveAnalysis(false);
    }
  };

  // Toggle predictive analysis layer
  const togglePredictiveAnalysis = () => {
    if (activeVisualization === 'predictive') {
      setActiveVisualization('none');
      setShowPredictiveAnalysis(false);
    } else {
      setActiveVisualization('predictive');
      setShowPredictiveAnalysis(true);
      setShowTerrainVisualization(false);
    }
  };

  return (
    <GISProvider>
      <Card className="overflow-hidden shadow rounded-lg bg-surface-light">
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4"><>

            <h3 className="text-lg leading-6 font-medium text-primary-blue-dark tf-font-display">
              Terrafusion Property Map
            </h3>
            <div
</>>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[160px]">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="map"><>

                    <MapIcon className="h-4 w-4 mr-1" />
                    Map
                  </TabsTrigger>
                  <TabsTrigger
</> value="controls">
                    <Layers className="h-4 w-4 mr-1" />
                    Controls
                  </TabsTrigger>
                </TabsList>

                <div className="mt-2">
                  <TabsContent value="map" className="m-0">
                    <div className="h-[450px] rounded overflow-hidden border border-secondary-gray relative">
                      <QGISMap baseMapType={baseMapType} onMapInit={handleMapInit} />

                      {/* Advanced visualization layers */}
                      {map && showTerrainVisualization && (
                        <TerrainVisualization map={map} showControls={true} />
                      )}

                      {map && showPredictiveAnalysis && (
                        <PredictiveAnalysisLayer
                          map={map}
                          onClose={() => setShowPredictiveAnalysis(false)}
                        />
                      )}

                      <Badge
                        variant="outline"
                        className="absolute top-2 left-2 bg-white/80 text-primary font-medium px-2 py-1 text-xs"
                      >
                        <span className="text-green-600 mr-1">▲</span> QGIS Open Source
                      </Badge>

                      {/* Map type controls */}
                      <div className="absolute top-2 right-2 flex space-x-1"><>

                        <Button
                          size="sm"
                          variant={baseMapType === 'osm' ? 'default' : 'outline'}
                          className="h-8 px-3 text-xs bg-white/90 hover:bg-white/100 text-gray-700"
                          onClick={() => handleBaseMapChange('osm')}
                        >
                          Streets
                        </Button>
                        <Button
</>
                          size="sm"
                          variant={baseMapType === 'satellite' ? 'default' : 'outline'}
                          className="h-8 px-3 text-xs bg-white/90 hover:bg-white/100 text-gray-700"
                          onClick={() => handleBaseMapChange('satellite')}
                        >
                          Satellite
                        </Button>
                        <Button
                          size="sm"
                          variant={baseMapType === 'terrain' ? 'default' : 'outline'}
                          className="h-8 px-3 text-xs bg-white/90 hover:bg-white/100 text-gray-700"
                          onClick={() => handleBaseMapChange('terrain')}
                        >
                          Terrain
                        </Button>
                      </div>

                      {/* Advanced visualization toggle panel */}
                      <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg shadow-md border border-gray-200 overflow-hidden">
                        <div className="p-2"><>

                          <h4 className="text-xs font-semibold text-primary mb-2">
                            Advanced Visualization
                          </h4>
                          <div
</> className="flex gap-1">
                            <Button
                              size="sm"
                              variant={activeVisualization === 'terrain' ? 'default' : 'outline'}
                              className="h-8 text-xs"
                              onClick={toggleTerrainVisualization}
                            ><>

                              <Mountain className="h-3 w-3 mr-1" /> 3D Terrain
                            </Button>
                            <Button
</>
                              size="sm"
                              variant={activeVisualization === 'predictive' ? 'default' : 'outline'}
                              className="h-8 text-xs"
                              onClick={togglePredictiveAnalysis}
                            >
                              <BarChart4 className="h-3 w-3 mr-1" /> AI Predictions
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Export tools */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute bottom-2 right-2 h-8 text-xs bg-white/90"
                          >
                            <Download className="h-3 w-3 mr-1" /> Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem><>

                            <Download className="h-3 w-3 mr-2" /> Export as PNG
                          </DropdownMenuItem>
                          <DropdownMenuItem
</>><>

                            <Download className="h-3 w-3 mr-2" /> Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator
</> />
                          <DropdownMenuItem>
                            <Share2 className="h-3 w-3 mr-2" /> Share Map
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center">
                              <Search className="h-4 w-4 mr-2" />
                              Find Property
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Search for properties by address or ID</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center"
                              onClick={() => setActiveTab('controls')}
                            >
                              <Layers className="h-4 w-4 mr-2" />
                              Layer Controls
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manage map layers and visibility</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center"
                              onClick={toggleFullScreen}
                            >
                              <Maximize className="h-4 w-4 mr-2" />
                              Full Screen
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View map in full screen mode</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center">
                              <Info className="h-4 w-4 mr-2" />
                              AI Insights
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Get AI-powered insights for this area</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex items-center"
                              asChild
                            >
                              <Link to="/gis">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                GIS Hub
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open the GIS Analysis Hub with advanced features</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TabsContent>

                  <TabsContent value="controls" className="m-0">
                    <div className="h-[450px] overflow-auto">
                      <GISControlPanel />

                      {/* QGIS Open Source Features */}
                      <div className="mt-6 border rounded-md p-4 bg-gray-50">
                        <h4 className="text-sm font-semibold flex items-center mb-3 text-primary">
                          <span className="text-green-600 mr-1">▲</span> QGIS Open Source Features
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <PenTool className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                            <div><>

                              <h5 className="text-xs font-medium">Advanced Editing Tools</h5>
                              <p
</> className="text-xs text-gray-600">
                                Access to powerful vector editing capabilities for modifying parcel
                                boundaries
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Layers className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                            <div><>

                              <h5 className="text-xs font-medium">Enhanced Layer Management</h5>
                              <p
</> className="text-xs text-gray-600">
                                Support for complex layer structures and relationships between GIS
                                datasets
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Settings className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                            <div><>

                              <h5 className="text-xs font-medium">Custom Processing Tools</h5>
                              <p
</> className="text-xs text-gray-600">
                                Create and execute specialized spatial analysis workflows specific
                                to assessment needs
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-600"><>

                          <p className="italic">
                            QGIS is a free, open-source geographic information system enabling users
                            to create, edit, visualize, analyze, and publish geospatial information.
                          </p>
                          <p
</> className="mt-1">
                            The Terrafusion platform leverages QGIS capabilities for property
                            assessment visualization and analysis.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => setActiveTab('map')}
                      >
                        <MapIcon className="h-4 w-4 mr-2" />
                        Back to Map
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </GISProvider>
  );
};

export default GISMap;
