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
        setMapLayers([]);
      }
    };
    
    fetchMapLayers();
  }, []);
  
  // Handle parcel selection
  const handleParcelSelect = (parcelId: string) => {
    setSelectedParcelId(parcelId);
  };
  
  // Handle map features changed
  const handleFeaturesChanged = (features: GeoJSONFeature[]) => {
    setMapFeatures(features);
  };
  
  // Handle measurement completion
  const handleMeasurementComplete = (value: number, type: MeasurementType, unit: MeasurementUnit) => {
    setMeasurementValue(value);
    setMeasurementType(type);
    setMeasurementUnit(unit);
  };
  
  // Handle clearing measurements
  const handleClearMeasurements = () => {
    setMeasurementValue(undefined);
    setMeasurementType(null);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="grid grid-cols-9 gap-4 p-4 h-[calc(100vh-64px)]">
            {/* Main map area */}
            <div className="col-span-6">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Map className="h-5 w-5" />
                        Interactive Map Viewer
                      </CardTitle>
                      <CardDescription>
                        Government property and workflow mapping system
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileUp className="h-4 w-4 mr-1" />
                        Import
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-80px)]">
                  <EnhancedMapViewer
                    ref={mapRef}
                    features={mapFeatures}
                    onFeaturesChanged={handleFeaturesChanged}
                    onParcelSelect={handleParcelSelect}
                    selectedParcelId={selectedParcelId}
                    onMeasurementComplete={handleMeasurementComplete}
                    className="h-full rounded-b-lg"
                  >
                    <ParcelOverlay
                      onParcelClick={handleParcelSelect}
                      selectedParcelId={selectedParcelId}
                    />
                    
                    {selectedParcelId && (
                      <ParcelPopup
                        parcelId={selectedParcelId}
                        onClose={() => setSelectedParcelId(null)}
                      />
                    )}
                    
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
                  <TabsTrigger value="property" className="flex items-center gap-1">
                    <MapPin size={16} /> Property
                  </TabsTrigger>
                  <TabsTrigger value="layers" className="flex items-center gap-1">
                    <LayersIcon size={16} /> Layers
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="flex items-center gap-1">
                    <Ruler size={16} /> Tools
                  </TabsTrigger>
                  <TabsTrigger value="info" className="flex items-center gap-1">
                    <Info size={16} /> Info
                  </TabsTrigger>
                </TabsList>
                
                {/* Property tab */}
                <TabsContent value="property" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    {selectedParcelId ? (
                      <div>
                        <CardHeader>
                          <CardTitle>Parcel Details</CardTitle>
                          <CardDescription>
                            Parcel ID: {selectedParcelId}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Owner</Label>
                              <p className="text-sm font-medium">John Smith</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Address</Label>
                              <p className="text-sm font-medium">123 Main St, Kennewick, WA 99336</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Area</Label>
                              <p className="text-sm font-medium">2.45 acres (10,724 sq ft)</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Zoning</Label>
                              <p className="text-sm font-medium">Residential (R-1)</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Tax Assessment</Label>
                              <p className="text-sm font-medium">$245,000</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Legal Description</Label>
                              <p className="text-sm">
                                Lot 15, Block 2, Riverview Subdivision, as recorded in Volume 12 of Plats, page 34, records of Benton County, Washington.
                              </p>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1">
                                View Workflow
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                Export Data
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    ) : (
                      <React.Fragment>
                        <CardHeader>
                          <CardTitle>Property Information</CardTitle>
                          <CardDescription>
                            Click on a parcel to view details
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <MapPin className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">
                              Select a parcel on the map to view property information
                            </p>
                          </div>
                        </CardContent>
                      </React.Fragment>
                    )}
                  </Card>
                </TabsContent>
                
                {/* Layers tab */}
                <TabsContent value="layers" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Map Layers</CardTitle>
                      <CardDescription>
                        Toggle visibility of map layers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EnhancedLayerControl
                        layers={mapLayers}
                        onLayerToggle={(layerName, visible) => {
                          console.log(`Layer ${layerName} visibility: ${visible}`);
                        }}
                        onLayerOpacityChange={(layerName, opacity) => {
                          console.log(`Layer ${layerName} opacity: ${opacity}`);
                        }}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Tools tab */}
                <TabsContent value="tools" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Measurement Tools</CardTitle>
                      <CardDescription>
                        Measure distances and areas on the map
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Measurement Type</Label>
                        <RadioGroup
                          value={measurementType || ""}
                          onValueChange={(value) => {
                            setMeasurementType(value as MeasurementType);
                            handleClearMeasurements();
                          }}
                          className="grid grid-cols-2 gap-2 mt-2"
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
                      
                      <div>
                        <Label className="text-sm font-medium">Measurement Units</Label>
                        <RadioGroup
                          value={measurementUnit}
                          onValueChange={(value) => {
                            setMeasurementUnit(value as MeasurementUnit);
                          }}
                          className="grid grid-cols-2 gap-2 mt-2"
                        >
                          {measurementType === MeasurementType.AREA ? (
                            <React.Fragment>
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
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
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
                                  value={MeasurementUnit.YARDS}
                                  id="unit-yards"
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor="unit-yards"
                                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                  <span className="text-xs">Yards</span>
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
                            </React.Fragment>
                          )}
                        </RadioGroup>
                      </div>
                      
                      {measurementValue !== undefined && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <Label className="text-xs font-medium text-blue-800">Measurement Result</Label>
                          <p className="text-lg font-bold text-blue-900">
                            {measurementValue.toFixed(2)} {measurementUnit}
                          </p>
                          <p className="text-xs text-blue-700">
                            {measurementType}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleClearMeasurements}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                        <Button size="sm" className="flex-1">
                          <FileDown className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Info tab */}
                <TabsContent value="info" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Map Information</CardTitle>
                      <CardDescription>
                        Data sources and map details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Current Features</Label>
                          <p className="text-sm font-medium">{mapFeatures.length} features</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Map View</Label>
                          <p className="text-sm font-medium">Benton County, WA</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Data Updated</Label>
                          <p className="text-sm font-medium">January 15, 2025</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Sources</Label>
                          <ul className="text-sm pl-5 mt-1 list-disc space-y-1">
                            <li>Benton County GIS</li>
                            <li>USGS Topographic Data</li>
                            <li>WA State Department of Transportation</li>
                          </ul>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Legend</Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#3B82F6] opacity-50"></div>
                              <span className="text-xs">Parcels</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#10B981] opacity-50"></div>
                              <span className="text-xs">Zoning Districts</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#6B7280] opacity-80"></div>
                              <span className="text-xs">Streets</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#2563EB] opacity-50"></div>
                              <span className="text-xs">Hydrology</span>
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
