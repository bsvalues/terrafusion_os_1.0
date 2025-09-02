import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import EnhancedMapViewer from '@/components/maps/enhanced-map-viewer';
import { EnhancedLayerControl } from '@/components/maps/enhanced-layer-control';
import { ParcelOverlay } from '@/components/maps/parcel-overlay';
import { ParcelPopup } from '@/components/maps/parcel-popup';
import { WorkflowMapControls } from '@/components/maps/workflow-map-controls';
import { WorkflowMapIntegration } from '@/lib/workflow-map-integration';
import { GeoJSONFeature, MapLayerType, MapTool, MeasurementType, MeasurementUnit } from '@/lib/map-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, 
  Map, 
  MapPin, 
  Info,
  FileDown,
  FileUp,
  Layers as LayersIcon,
  Ruler,
  PenTool,
  SquareStack,
  Move,
  Trash2
 } from '@mui/icons-material';

export default function MapViewerPage() {
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [mapFeatures, setMapFeatures] = useState<GeoJSONFeature[]>([]);
  const [mapLayers, setMapLayers] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<MapTool>(MapTool.PAN);
  const [measurementType, setMeasurementType] = useState<MeasurementType | null>(null);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(MeasurementUnit.FEET);
  const [measurementValue, setMeasurementValue] = useState<number | undefined>(undefined);
  const mapRef = useRef<any>(null);
  
  // Fetch map layers from the API
  useEffect(() => {
    const fetchMapLayers = async () => {
      try {
        const response = await fetch('/api/map-layers', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch map layers: ${response.statusText}`);
        }
        
        const layers = await response.json();
        
        // Transform API layers to the format expected by the map component
        const formattedLayers = layers.map((layer: {
          name: string;
          metadata?: {
            style?: {
              color: string;
              weight: number;
              fillOpacity?: number;
              fillColor?: string;
            }
          }
        }) => ({
          name: layer.name,
          data: {
            type: "FeatureCollection",
            features: []
          },
          style: layer.metadata?.style || {
            color: "#3B82F6",
            weight: 2,
            fillOpacity: 0.2,
            fillColor: "#93C5FD"
          }
        }));
        
        setMapLayers(formattedLayers);
      } catch (error) {
        console.error('Error fetching map layers:', error);
        // Fallback to empty layers array in case of error
        setMapLayers([]);
      }
    };
    
    fetchMapLayers();
  }, []);
  
  // Handle parcel selection
  const handleParcelSelect = (parcelId: string) => {
    setSelectedParcelId(parcelId);
    // In a real app, we would fetch the parcel details from the server
  };
  
  // Handle map features changed
  const handleFeaturesChanged = (features: GeoJSONFeature[]) => {
    setMapFeatures(features);
    console.log('Map features changed:', features);
    // In a real app, we might sync these with the server
  };
  
  // Handle export to shapefile
  const handleExportShapefile = () => {
    alert('In a production app, this would export the current features as a shapefile');
    // In a real application, we would call an API to convert GeoJSON to Shapefile
  };
  
  // Handle import from shapefile
  const handleImportShapefile = () => {
    alert('In a production app, this would open a file picker for shapefile import');
    // In a real application, we would handle file upload and conversion
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar className="h-full" />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <div><>

              <h1 className="text-2xl font-bold">Map Viewer</h1>
              <p
</> className="text-gray-500">View and analyze geographical data</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /><>

                <Input 
                  className="pl-8" 
                  placeholder="Search for parcel, owner, or address..."
                />
              </div>
              <Button
</> variant="outline" className="gap-1" onClick={handleExportShapefile}><>

                <FileDown size={18} /> Export
              </Button>
              <Button
</> variant="outline" className="gap-1" onClick={handleImportShapefile}>
                <FileUp size={18} /> Import
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-4">
            {/* Main map area */}
            <div className="col-span-9">
              <Card className="h-[calc(100vh-180px)]">
                <CardContent className="p-0 h-full">
                  <EnhancedMapViewer 
                    height="100%" 
                    width="100%"
                    mapLayers={mapLayers}
                    initialFeatures={[]}
                    onFeaturesChanged={handleFeaturesChanged}
                    onParcelSelect={handleParcelSelect}
                    ref={mapRef}
                    activeTool={activeTool}
                    showMeasureTools={true}
                    measurementType={measurementType}
                    measurementUnit={measurementUnit}
                    onMeasure={(value, type) => {
                      setMeasurementValue(value);
                      if (type) setMeasurementType(type);
                    }}
                  >
                    {/* Add ParcelOverlay component for interactive parcel display */}
                    <ParcelOverlay 
                      showPopups={true}
                      onParcelSelect={(parcelId) => handleParcelSelect(parcelId.toString())}
                      style={{
                        color: '#3B82F6',
                        weight: 2,
                        fillOpacity: 0.2,
                        fillColor: '#93C5FD'
                      }}
                    />
                    
                    {/* Add WorkflowMapControls for workflow-specific map tools */}
                    <WorkflowMapControls 
                      workflow={{
                        id: 1,
                        title: "Sample Workflow",
                        type: "long_plat",
                        userId: 1,
                        description: "A sample workflow for development",
                        status: "in_progress",
                        priority: "medium",
                        createdAt: new Date(),
                        updatedAt: new Date()
                      }}
                      activeTool={activeTool}
                      onToolChange={(tool) => setActiveTool(tool)}
                      onSaveGeometry={() => console.log('Saving geometry...')}
                      onImportGeoJSON={(data) => console.log('Importing GeoJSON:', data)}
                      onExportGeoJSON={() => {
                        console.log('Exporting GeoJSON...');
                        return { type: 'FeatureCollection', features: mapFeatures };
                      }}
                    />
                  </EnhancedMapViewer>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar with property details and layers */}
            <div className="col-span-3">
              <Tabs defaultValue="property" className="h-[calc(100vh-180px)]">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="property" className="flex items-center gap-1"><>

                    <MapPin size={16} /> Property
                  </TabsTrigger>
                  <TabsTrigger
</> value="layers" className="flex items-center gap-1"><>

                    <LayersIcon size={16} /> Layers
                  </TabsTrigger>
                  <TabsTrigger
</> value="tools" className="flex items-center gap-1"><>

                    <Ruler size={16} /> Tools
                  </TabsTrigger>
                  <TabsTrigger
</> value="info" className="flex items-center gap-1">
                    <Info size={16} /> Info
                  </TabsTrigger>
                </TabsList>
                
                {/* Property tab */}
                <TabsContent value="property" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    {selectedParcelId ? (
                      <>
                        <CardHeader><>

                          <CardTitle>Parcel Details</CardTitle>
                          <CardDescription
</>>
                            Parcel ID: {selectedParcelId}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div><>

                              <Label className="text-xs font-medium text-gray-500">Owner</Label>
                              <p
</> className="text-sm font-medium">John Smith</p>
                            </div>
                            <div><>

                              <Label className="text-xs font-medium text-gray-500">Address</Label>
                              <p
</> className="text-sm font-medium">123 Main St, Kennewick, WA 99336</p>
                            </div>
                            <div><>

                              <Label className="text-xs font-medium text-gray-500">Area</Label>
                              <p
</> className="text-sm font-medium">2.45 acres (10,724 sq ft)</p>
                            </div>
                            <div><>

                              <Label className="text-xs font-medium text-gray-500">Zoning</Label>
                              <p
</> className="text-sm font-medium">Residential (R-1)</p>
                            </div>
                            <div><>

                              <Label className="text-xs font-medium text-gray-500">Assessed Value</Label>
                              <p
</> className="text-sm font-medium">$245,000</p>
                            </div>
                            <div><>

                              <Label className="text-xs font-medium text-gray-500">Last Updated</Label>
                              <p
</> className="text-sm font-medium">Jan 15, 2024</p>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <Button variant="secondary" className="w-full gap-1"><>

                                <Map size={16} /> View Details
                              </Button>
                              <Button
</> variant="secondary" className="w-full gap-1">
                                <FileDown size={16} /> Export
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <MapPin className="text-gray-400 mb-2" size={40} /><>

                        <p className="text-gray-500 mb-1">No parcel selected</p>
                        <p
</> className="text-xs text-gray-400">Click on a parcel on the map to see its details</p>
                      </CardContent>
                    )}
                  </Card>
                </TabsContent>
                
                {/* Layers tab */}
                <TabsContent value="layers" className="h-[calc(100%-40px)] overflow-y-auto">
                  <EnhancedLayerControl />
                </TabsContent>
                
                {/* Tools tab */}
                <TabsContent value="tools" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    <CardHeader><>

                      <CardTitle>Measurement Tools</CardTitle>
                      <CardDescription
</>>
                        Measure distances, areas, and perimeters on the map
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div><>

                          <Label className="text-sm font-medium">Measurement Type</Label>
                          <RadioGroup
</>
                            value={measurementType || ''}
                            onValueChange={(value) => {
                              if (value === '') {
                                setMeasurementType(null);
                                setActiveTool(MapTool.PAN);
                              } else {
                                setMeasurementType(value as MeasurementType);
                                setActiveTool(MapTool.MEASURE);
                              }
                            }}
                            className="grid grid-cols-3 gap-2 mt-2"
                          >
                            <div>
                              <RadioGroupItem
                                value={MeasurementType.DISTANCE}
                                id="measurement-distance"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="measurement-distance"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <Ruler className="mb-1" size={20} />
                                <span className="text-xs">Distance</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem
                                value={MeasurementType.AREA}
                                id="measurement-area"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="measurement-area"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <SquareStack className="mb-1" size={20} />
                                <span className="text-xs">Area</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem
                                value={MeasurementType.PERIMETER}
                                id="measurement-perimeter"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="measurement-perimeter"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <PenTool className="mb-1" size={20} />
                                <span className="text-xs">Perimeter</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div><>

                          <Label className="text-sm font-medium">Measurement Units</Label>
                          <RadioGroup
</>
                            value={measurementUnit}
                            onValueChange={(value) => {
                              setMeasurementUnit(value as MeasurementUnit);
                            }}
                            className="grid grid-cols-2 gap-2 mt-2"
                          >
                            {measurementType === MeasurementType.AREA ? (
                              <>
                                <div>
                                  <RadioGroupItem
                                    value={MeasurementUnit.ACRES}
                                    id="unit-acres"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="unit-acres"
                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <span className="text-xs">Acres</span>
                                  </Label>
                                </div>
                                <div>
                                  <RadioGroupItem
                                    value={MeasurementUnit.SQUARE_METERS}
                                    id="unit-sq-meters"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="unit-sq-meters"
                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <span className="text-xs">Square Meters</span>
                                  </Label>
                                </div>
                                <div>
                                  <RadioGroupItem
                                    value={MeasurementUnit.HECTARES}
                                    id="unit-hectares"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="unit-hectares"
                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <span className="text-xs">Hectares</span>
                                  </Label>
                                </div>
                                <div>
                                  <RadioGroupItem
                                    value={MeasurementUnit.SQUARE_FEET}
                                    id="unit-sq-feet"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="unit-sq-feet"
                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <span className="text-xs">Square Feet</span>
                                  </Label>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <RadioGroupItem
                                    value={MeasurementUnit.FEET}
                                    id="unit-feet"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="unit-feet"
                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <span className="text-xs">Feet</span>
                                  </Label>
                                </div>
                                <div>
                                  <RadioGroupItem
                                    value={MeasurementUnit.METERS}
                                    id="unit-meters"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="unit-meters"
                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <span className="text-xs">Meters</span>
                                  </Label>
                                </div>
                                <div>
                                  <RadioGroupItem
                                    value={MeasurementUnit.MILES}
                                    id="unit-miles"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="unit-miles"
                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <span className="text-xs">Miles</span>
                                  </Label>
                                </div>
                                <div>
                                  <RadioGroupItem
                                    value={MeasurementUnit.KILOMETERS}
                                    id="unit-kilometers"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="unit-kilometers"
                                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <span className="text-xs">Kilometers</span>
                                  </Label>
                                </div>
                              </>
                            )}
                          </RadioGroup>
                        </div>

                        {measurementValue !== undefined && (
                          <div className="mt-4 p-3 bg-muted rounded-md"><>

                            <h4 className="font-medium mb-1">Measurement Result</h4>
                            <div
</> className="text-lg font-semibold">
                              {measurementType === MeasurementType.AREA ? (
                                <>
                                  {measurementUnit === MeasurementUnit.ACRES && (
                                    <>{(measurementValue * 0.000247105).toFixed(2)} acres</>
                                  )}
                                  {measurementUnit === MeasurementUnit.HECTARES && (
                                    <>{(measurementValue / 10000).toFixed(2)} ha</>
                                  )}
                                  {measurementUnit === MeasurementUnit.SQUARE_METERS && (
                                    <>{Math.round(measurementValue)} m²</>
                                  )}
                                  {measurementUnit === MeasurementUnit.SQUARE_FEET && (
                                    <>{Math.round(measurementValue * 10.7639)} ft²</>
                                  )}
                                </>
                              ) : (
                                <>
                                  {measurementUnit === MeasurementUnit.FEET && (
                                    <>{Math.round(measurementValue * 3.28084)} ft</>
                                  )}
                                  {measurementUnit === MeasurementUnit.METERS && (
                                    <>{Math.round(measurementValue)} m</>
                                  )}
                                  {measurementUnit === MeasurementUnit.MILES && (
                                    <>{(measurementValue * 0.000621371).toFixed(2)} mi</>
                                  )}
                                  {measurementUnit === MeasurementUnit.KILOMETERS && (
                                    <>{(measurementValue / 1000).toFixed(2)} km</>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setMeasurementType(null);
                              setMeasurementValue(undefined);
                              setActiveTool(MapTool.PAN);
                            }}
                            className="w-full"
                          >
                            <Trash2 size={16} className="mr-2" /> Clear Measurements
                          </Button>
                        </div>

                        {measurementType && (
                          <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 mt-2"><>

                            <p className="font-medium">How to use:</p>
                            <ol
</> className="list-decimal pl-4 mt-1 space-y-1"><>

                              <li>Click on the map to start measuring</li>
                            <li
</>>Click multiple points to continue the measurement</li><>

                              <li>For area measurements, create at least three points to form a polygon</li>
                            <li
</>>Change units at any time to see different measurement formats</li>
                              <li>Use Clear Measurements to start over</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Info tab */}
                <TabsContent value="info" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    <CardHeader><>

                      <CardTitle>Map Information</CardTitle>
                      <CardDescription
</>>
                        Map status and statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div><>

                          <Label className="text-xs font-medium text-gray-500">Current Features</Label>
                          <p
</> className="text-sm font-medium">{mapFeatures.length} features</p>
                        </div>
                        
                        <div><>

                          <Label className="text-xs font-medium text-gray-500">Map View</Label>
                          <p
</> className="text-sm font-medium">Benton County, WA</p>
                        </div>
                        
                        <div><>

                          <Label className="text-xs font-medium text-gray-500">Data Updated</Label>
                          <p
</> className="text-sm font-medium">January 15, 2025</p>
                        </div>
                        
                        <div><>

                          <Label className="text-xs font-medium text-gray-500">Sources</Label>
                          <ul
</> className="text-sm pl-5 mt-1 list-disc space-y-1"><>

                            <li>Benton County GIS</li>
                            <li
</>>USGS Topographic Data</li>
                            <li>WA State Department of Transportation</li>
                          </ul>
                        </div>
                        
                        <Separator />
                        
                        <div><>

                          <Label className="text-xs font-medium text-gray-500">Legend</Label>
                          <div
</> className="mt-2 space-y-2">
                            <div className="flex items-center gap-2"><>

                              <div className="w-4 h-4 bg-[#3B82F6] opacity-50"></div>
                              <span
</> className="text-xs">Parcels</span>
                            </div>
                            <div className="flex items-center gap-2"><>

                              <div className="w-4 h-4 bg-[#10B981] opacity-50"></div>
                              <span
</> className="text-xs">Zoning Districts</span>
                            </div>
                            <div className="flex items-center gap-2"><>

                              <div className="w-4 h-4 bg-[#6B7280] opacity-80"></div>
                              <span
</> className="text-xs">Streets</span>
                            </div>
                            <div className="flex items-center gap-2"><>

                              <div className="w-4 h-4 bg-[#2563EB] opacity-50"></div>
                              <span
</> className="text-xs">Hydrology</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}