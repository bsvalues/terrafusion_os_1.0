import { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, FeatureGroup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DrawControl } from '@/components/maps/draw-control';
import ExportResultsDialog from '@/components/analysis/export-results-dialog';
import { FileImportExport } from '@/components/maps/file-import-export';
import { CoordinateAddressDisplay } from '@/components/maps/coordinate-address-display';
import { BuildingFootprintsLayer } from '@/components/maps/building-footprints-layer';
import { PropertyListingsPanel } from '@/components/maps/property-listings-panel';
import { Building, Map, Home  } from '@mui/icons-material';
import { Calculator,
  Scissors, 
  Combine, 
  Ruler, 
  Maximize, 
  Minimize,
  Circle,
  Move,
  LayoutGrid,
  Layers,
  Refresh,
  DownloadCloud
 } from '@mui/icons-material';
import { cn } from '@/lib/utils';

// Geospatial operation types
enum GeospatialOperationType {
  BUFFER = 'buffer',
  INTERSECTION = 'intersection',
  UNION = 'union',
  DIFFERENCE = 'difference',
  AREA = 'area',
  CENTROID = 'centroid',
  DISTANCE = 'distance',
  MERGE = 'merge',
  SPLIT = 'split',
  SIMPLIFY = 'simplify'
}

// Measurement units
enum MeasurementUnit {
  METERS = 'meters',
  KILOMETERS = 'kilometers',
  FEET = 'feet',
  YARDS = 'yards',
  MILES = 'miles',
  ACRES = 'acres',
  HECTARES = 'hectares',
  SQUARE_FEET = 'square_feet',
  SQUARE_MILES = 'square_miles'
}

// Icons for each operation type
const operationIcons: Record<GeospatialOperationType, React.ReactNode> = {
  [GeospatialOperationType.BUFFER]: <Circle className="h-5 w-5" />,
  [GeospatialOperationType.INTERSECTION]: <Combine className="h-5 w-5" />,
  [GeospatialOperationType.UNION]: <LayoutGrid className="h-5 w-5" />,
  [GeospatialOperationType.DIFFERENCE]: <Minimize className="h-5 w-5" />,
  [GeospatialOperationType.AREA]: <Calculator className="h-5 w-5" />,
  [GeospatialOperationType.CENTROID]: <Move className="h-5 w-5" />,
  [GeospatialOperationType.DISTANCE]: <Ruler className="h-5 w-5" />,
  [GeospatialOperationType.MERGE]: <Maximize className="h-5 w-5" />,
  [GeospatialOperationType.SPLIT]: <Scissors className="h-5 w-5" />,
  [GeospatialOperationType.SIMPLIFY]: <Refresh className="h-5 w-5" />
};

// Labels for each operation type
const operationLabels: Record<GeospatialOperationType, string> = {
  [GeospatialOperationType.BUFFER]: 'Buffer',
  [GeospatialOperationType.INTERSECTION]: 'Intersection',
  [GeospatialOperationType.UNION]: 'Union',
  [GeospatialOperationType.DIFFERENCE]: 'Difference',
  [GeospatialOperationType.AREA]: 'Area Calculation',
  [GeospatialOperationType.CENTROID]: 'Find Centroid',
  [GeospatialOperationType.DISTANCE]: 'Measure Distance',
  [GeospatialOperationType.MERGE]: 'Merge Parcels',
  [GeospatialOperationType.SPLIT]: 'Split Parcel',
  [GeospatialOperationType.SIMPLIFY]: 'Simplify Geometry'
};

// Descriptions for each operation
const operationDescriptions: Record<GeospatialOperationType, string> = {
  [GeospatialOperationType.BUFFER]: 'Create a buffer zone around a feature',
  [GeospatialOperationType.INTERSECTION]: 'Find the overlapping area between two features',
  [GeospatialOperationType.UNION]: 'Combine multiple features into one',
  [GeospatialOperationType.DIFFERENCE]: 'Subtract one feature from another',
  [GeospatialOperationType.AREA]: 'Calculate the area of a feature',
  [GeospatialOperationType.CENTROID]: 'Find the geometric center of a feature',
  [GeospatialOperationType.DISTANCE]: 'Measure the distance between two points',
  [GeospatialOperationType.MERGE]: 'Merge multiple parcels into a single parcel',
  [GeospatialOperationType.SPLIT]: 'Split a parcel using a line',
  [GeospatialOperationType.SIMPLIFY]: 'Simplify a complex geometry'
};

// Form schema for geospatial analysis
const geospatialFormSchema = z.object({
  operation: z.nativeEnum(GeospatialOperationType),
  bufferDistance: z.number().optional(),
  bufferUnit: z.nativeEnum(MeasurementUnit).optional(),
  toleranceDistance: z.number().optional(),
  preserveProperties: z.boolean().optional()
});

type GeospatialFormValues = z.infer<typeof geospatialFormSchema>;

// Sample GeoJSON data for testing
const sampleParcel1 = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-119.210, 46.250],
      [-119.200, 46.250],
      [-119.200, 46.260],
      [-119.210, 46.260],
      [-119.210, 46.250]
    ]]
  },
  properties: {
    parcelId: '123456',
    owner: 'John Doe',
    area: 10.5,
    zoning: 'Residential'
  }
};

const sampleParcel2 = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-119.205, 46.255],
      [-119.195, 46.255],
      [-119.195, 46.265],
      [-119.205, 46.265],
      [-119.205, 46.255]
    ]]
  },
  properties: {
    parcelId: '789012',
    owner: 'Jane Smith',
    area: 12.3,
    zoning: 'Commercial'
  }
};

const sampleLine = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-119.205, 46.255],
      [-119.195, 46.265]
    ]
  },
  properties: {
    type: 'Split Line'
  }
};

export default function GeospatialAnalysisPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mapCenter] = useState<[number, number]>([46.255, -119.205]);
  const [zoom] = useState<number>(14);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [resultFeatures, setResultFeatures] = useState<any | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<any[]>([]);
  const [drawnItems, setDrawnItems] = useState<any | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showBuildingFootprints, setShowBuildingFootprints] = useState(false);
  const [showPropertyListings, setShowPropertyListings] = useState(false);

  // Handle imported data from the FileImportExport component
  const handleImportedData = (data: any) => {
    if (!data) return;
    
    try {
      // Clear any existing selected features
      setSelectedFeatures([]);
      setDrawnItems(null);
      
      // Process imported features
      if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        // Handle GeoJSON FeatureCollection
        setSelectedFeatures(data.features);
        toast({
          title: "Data Imported",
          description: `Imported ${data.features.length} features`,
        });
      } else if (data.type === 'Feature') {
        // Handle single GeoJSON Feature
        setSelectedFeatures([data]);
        toast({
          title: "Data Imported",
          description: "Imported 1 feature",
        });
      } else {
        throw new Error('Invalid GeoJSON format');
      }
    } catch (error) {
      console.error('Error processing imported data:', error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to process imported data",
        variant: "destructive"
      });
    }
  };
  
  // Setup form
  const form = useForm<GeospatialFormValues>({
    resolver: zodResolver(geospatialFormSchema),
    defaultValues: {
      operation: GeospatialOperationType.BUFFER,
      bufferDistance: 100,
      bufferUnit: MeasurementUnit.FEET,
      toleranceDistance: 0.01,
      preserveProperties: true
    }
  });

  // Current operation
  const currentOperation = form.watch('operation');
  
  // API mutation for geospatial analysis
  const analysisMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/geospatial/analyze', data);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      
      // Extract the result features for display
      if (data.result) {
        if (data.result.type === 'FeatureCollection') {
          setResultFeatures(data.result);
        } else if (typeof data.result === 'object') {
          setResultFeatures({
            type: 'FeatureCollection',
            features: [data.result]
          });
        } else {
          // For scalar results like area or distance
          setResultFeatures(null);
        }
      } else {
        setResultFeatures(null);
      }
      
      toast({
        title: 'Analysis Complete',
        description: `Successfully performed ${operationLabels[data.type]} operation`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: `Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: GeospatialFormValues) => {
    // Prepare the analysis parameters
    const params: any = {};
    
    // Add operation-specific parameters
    switch (values.operation) {
      case GeospatialOperationType.BUFFER:
        params.bufferDistance = values.bufferDistance;
        params.bufferUnit = values.bufferUnit;
        break;
      case GeospatialOperationType.SIMPLIFY:
        params.toleranceDistance = values.toleranceDistance;
        break;
      default:
        break;
    }
    
    // Common parameters
    params.preserveProperties = values.preserveProperties;
    
    // Get features for analysis
    const features = selectedFeatures.length > 0 ? selectedFeatures : 
                     (drawnItems ? drawnItems.toGeoJSON() : [sampleParcel1]);
    
    // Run the analysis
    analysisMutation.mutate({
      operation: values.operation,
      features,
      params
    });
  };

  // Handle drawn items
  const handleCreated = (e: any) => {
    setDrawnItems(e.layer);
    const newFeature = e.layer.toGeoJSON();
    setSelectedFeatures([...selectedFeatures, newFeature]);
  };

  // Handle selecting sample features
  const handleSelectSample = (sampleFeature: any) => {
    setSelectedFeatures([...selectedFeatures, sampleFeature]);
  };
  
  // Clear selected features
  const handleClearSelection = () => {
    setSelectedFeatures([]);
    setDrawnItems(null);
  };
  
  // Clear analysis results
  const handleClearResults = () => {
    setAnalysisResult(null);
    setResultFeatures(null);
  };
  
  // Run a quick analysis with the current settings
  const handleQuickAnalysis = () => {
    form.handleSubmit(onSubmit)();
  };
  
  // Generate a report of the analysis
  const handleDownloadReport = () => {
    if (!analysisResult) return;
    
    // Open the export dialog
    setShowExportDialog(true);
  };
  
  // Close the export dialog
  const handleCloseExportDialog = () => {
    setShowExportDialog(false);
  };
  
  // Close address information panel
  const handleCloseAddressPanel = () => {
    setClickedCoords(null);
  };
  
  // Close property listings panel
  const handleClosePropertyListingsPanel = () => {
    setShowPropertyListings(false);
  };
  
  // Map click handler component
  const MapClickHandler = useCallback(() => {
    const map = useMapEvents({
      click: (e) => {
        // Update coordinates
        setClickedCoords({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    });
    return null;
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col lg:flex-row h-full gap-4 p-4">
        {/* Left panel - Map and controls */}
        <div className="flex flex-col w-full lg:w-2/3 h-full">
          <Card className="flex-1">
            <CardHeader className="pb-4"><>

              <CardTitle>Geospatial Analysis</CardTitle>
              <CardDescription
</>>Perform advanced geospatial operations on map features</CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-8rem)]">
              <div className="h-full w-full relative">
                <MapContainer
                  center={mapCenter}
                  zoom={zoom}
                  className="h-full w-full rounded-md overflow-hidden"
                >
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Display sample features */}
                  <GeoJSON 
                    data={sampleParcel1 as any} 
                    style={() => ({
                      color: selectedFeatures.includes(sampleParcel1) ? '#ff4500' : '#3388ff',
                      weight: 2,
                      fillOpacity: 0.4
                    })}
                    eventHandlers={{
                      click: () => handleSelectSample(sampleParcel1)
                    }}
                  />
                  
                  <GeoJSON 
                    data={sampleParcel2 as any} 
                    style={() => ({
                      color: selectedFeatures.includes(sampleParcel2) ? '#ff4500' : '#33cc33',
                      weight: 2,
                      fillOpacity: 0.4
                    })}
                    eventHandlers={{
                      click: () => handleSelectSample(sampleParcel2)
                    }}
                  />
                  
                  <GeoJSON 
                    data={sampleLine as any} 
                    style={() => ({
                      color: selectedFeatures.includes(sampleLine) ? '#ff4500' : '#ff3333',
                      weight: 3
                    })}
                    eventHandlers={{
                      click: () => handleSelectSample(sampleLine)
                    }}
                  />
                  
                  {/* Display selected features */}
                  {selectedFeatures.length > 0 && (
                    <FeatureGroup>
                      {selectedFeatures.map((feature, idx) => (
                        <GeoJSON 
                          key={idx}
                          data={feature} 
                          style={() => ({
                            color: '#ff4500',
                            weight: 3,
                            fillOpacity: 0.6
                          })}
                        />
                      ))}
                    </FeatureGroup>
                  )}
                  
                  {/* Display analysis results */}
                  {resultFeatures && (
                    <GeoJSON 
                      data={resultFeatures} 
                      style={() => ({
                        color: '#9c27b0',
                        weight: 4,
                        dashArray: '5, 5',
                        fillOpacity: 0.5
                      })}
                    />
                  )}
                  
                  {/* Drawing tools */}
                  <DrawControl 
                    position="topright"
                    onCreate={handleCreated}
                    draw={{
                      polyline: {
                        shapeOptions: {
                          color: '#3B82F6',
                          weight: 4
                        }
                      },
                      polygon: {
                        shapeOptions: {
                          color: '#3B82F6',
                          weight: 2,
                          fillOpacity: 0.2
                        }
                      },
                      rectangle: {
                        shapeOptions: {
                          color: '#3B82F6',
                          weight: 2,
                          fillOpacity: 0.2
                        }
                      },
                      circle: {
                        shapeOptions: {
                          color: '#3B82F6',
                          weight: 2,
                          fillOpacity: 0.2
                        }
                      },
                      marker: false,
                      circlemarker: false
                    }}
                    edit={{
                      featureGroup: drawnItems || new L.FeatureGroup()
                    }}
                  />
                  
                  {/* Building footprints layer */}
                  {showBuildingFootprints && (
                    <BuildingFootprintsLayer 
                      fillColor="#6366f1"
                      strokeColor="#4338ca"
                      opacity={0.15}
                      weight={1}
                    />
                  )}
                  
                  {/* Map click handler */}
                  <MapClickHandler />
                </MapContainer>
                
                {/* Show address information when a location is clicked */}
                {clickedCoords && (
                  <div className="absolute bottom-4 right-4 z-[1000] max-w-md">
                    <CoordinateAddressDisplay 
                      latitude={clickedCoords.lat}
                      longitude={clickedCoords.lng}
                      onClose={handleCloseAddressPanel}
                    />
                  </div>
                )}
                
                {/* Show property listings when enabled */}
                {showPropertyListings && clickedCoords && (
                  <div className="absolute top-4 right-4 z-[1000] max-w-md">
                    <PropertyListingsPanel
                      latitude={clickedCoords.lat}
                      longitude={clickedCoords.lng}
                      radiusMiles={1}
                      onClose={handleClosePropertyListingsPanel}
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center space-x-2"><>

                <Button variant="outline" size="sm" onClick={handleClearSelection}>
                  Clear Selection
                </Button>
                <Button
</> variant="outline" size="sm" onClick={handleClearResults}>
                  Clear Results
                </Button>
                <Button 
                  variant={showBuildingFootprints ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowBuildingFootprints(!showBuildingFootprints)}
                  title="Toggle Building Footprints"
                  className="flex items-center"
                ><>

                  <Building className="mr-1 h-4 w-4" />
                  {!isMobile && "Buildings"}
                </Button>
                <Button
</> 
                  variant={showPropertyListings ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowPropertyListings(!showPropertyListings)}
                  title="Toggle Property Listings"
                  className="flex items-center"
                >
                  <Home className="mr-1 h-4 w-4" />
                  {!isMobile && "Properties"}
                </Button>
              </div>
              <div className="flex items-center space-x-2"><>

                <Button variant="secondary" size="sm" onClick={handleQuickAnalysis}>
                  Run Analysis
                </Button>
                <Button
</> variant="default" size="sm" onClick={handleDownloadReport} disabled={!analysisResult}><>

                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                <FileImportExport
</> 
                  features={selectedFeatures.length > 0 ? selectedFeatures : (resultFeatures ? resultFeatures : undefined)}
                  onImport={handleImportedData} 
                />
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right panel - Controls and results */}
        <div className="flex flex-col w-full lg:w-1/3 h-full gap-4">
          {/* Operation controls */}
          <Card>
            <CardHeader className="pb-2"><>

              <CardTitle>Analysis Controls</CardTitle>
              <CardDescription
</>>Select operation and parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="operation"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Operation</FormLabel>
                        <div
</> className="grid grid-cols-2 gap-2">
                          {Object.values(GeospatialOperationType).map((op) => (
                            <Button
                              key={op}
                              type="button"
                              variant={field.value === op ? "default" : "outline"}
                              className={cn(
                                "flex items-center justify-start text-left",
                                field.value === op && "border-primary text-primary-foreground"
                              )}
                              onClick={() => field.onChange(op)}
                            ><>

                              <span className="mr-2">{operationIcons[op]}</span>
                              <span
</>>{operationLabels[op]}</span>
                            </Button>
                          ))}
                        </div>
                        <FormDescription>
                          {operationDescriptions[field.value]}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {/* Buffer-specific controls */}
                  {currentOperation === GeospatialOperationType.BUFFER && (
                    <>
                      <FormField
                        control={form.control}
                        name="bufferDistance"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Buffer Distance</FormLabel>
                            <div
</> className="flex items-center gap-2">
                              <Slider
                                defaultValue={[field.value || 100]}
                                min={1}
                                max={1000}
                                step={1}
                                onValueChange={(vals) => field.onChange(vals[0])}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={field.value}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-20"
                              />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bufferUnit"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Distance Unit</FormLabel>
                            <Select
</>
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent><>

                                <SelectItem value={MeasurementUnit.FEET}>Feet</SelectItem>
                                <SelectItem
</> value={MeasurementUnit.METERS}>Meters</SelectItem><>

                                <SelectItem value={MeasurementUnit.KILOMETERS}>Kilometers</SelectItem>
                                <SelectItem
</> value={MeasurementUnit.MILES}>Miles</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {/* Simplify-specific controls */}
                  {currentOperation === GeospatialOperationType.SIMPLIFY && (
                    <FormField
                      control={form.control}
                      name="toleranceDistance"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Simplification Tolerance</FormLabel>
                          <div
</> className="flex items-center gap-2">
                            <Slider
                              defaultValue={[field.value || 0.01]}
                              min={0.001}
                              max={0.1}
                              step={0.001}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              className="flex-1"
                            /><>

                            <Input
                              type="number"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="w-20"
                              step={0.001}
                            />
                          </div>
                          <FormDescription
</>>Higher values result in more simplification</FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Common controls */}
                  <FormField
                    control={form.control}
                    name="preserveProperties"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><>

                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4"
                          />
                        </FormControl>
                        <FormLabel
</>>Preserve Properties</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? "Processing..." : "Run Analysis"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Results display */}
          {analysisResult && (
            <Card>
              <CardHeader className="pb-2"><>

                <CardTitle>Analysis Results</CardTitle>
                <CardDescription
</>>
                  {operationLabels[analysisResult.type as GeospatialOperationType]} operation completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary">
                  <TabsList className="w-full"><>

                    <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
                    <TabsTrigger
</> value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="metadata" className="flex-1">Metadata</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center"><>

                        <span className="mr-2">{operationIcons[analysisResult.type as GeospatialOperationType]}</span>
                        <span
</> className="font-medium">{operationLabels[analysisResult.type as GeospatialOperationType]}</span>
                      </div>
                      <Badge variant="outline">Success</Badge>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    {typeof analysisResult.result === 'number' ? (
                      <div className="text-center p-4"><>

                        <div className="text-3xl font-bold">
                          {analysisResult.result.toFixed(2)}
                        </div>
                        <div
</> className="text-sm text-muted-foreground mt-1">
                          {analysisResult.metadata?.unit || ''}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between"><>

                          <span className="text-sm text-muted-foreground">Features:</span>
                          <span
</> className="font-medium">
                            {resultFeatures?.features?.length || 1}
                          </span>
                        </div>
                        
                        {analysisResult.metadata?.area && (
                          <div className="flex justify-between"><>

                            <span className="text-sm text-muted-foreground">Total Area:</span>
                            <span
</> className="font-medium">
                              {analysisResult.metadata.area.toFixed(2)} {analysisResult.metadata.unit}
                            </span>
                          </div>
                        )}
                        
                        {analysisResult.metadata?.distance && (
                          <div className="flex justify-between"><>

                            <span className="text-sm text-muted-foreground">Distance:</span>
                            <span
</> className="font-medium">
                              {analysisResult.metadata.distance.toFixed(2)} {analysisResult.metadata.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="details" className="max-h-60 overflow-y-auto">
                    {resultFeatures?.features ? (
                      resultFeatures.features.map((feature: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 border rounded">
                          <div className="font-medium">Feature {idx + 1}</div>
                          {feature.properties && Object.entries(feature.properties).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm"><>

                              <span className="text-muted-foreground">{key}:</span>
                              <span
</>>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        No detailed feature data available
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="metadata" className="max-h-60 overflow-y-auto">
                    {analysisResult.metadata ? (
                      <div className="space-y-1">
                        {Object.entries(analysisResult.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between"><>

                            <span className="text-sm text-muted-foreground">{key}:</span>
                            <span
</> className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                        
                        <div className="flex justify-between"><>

                          <span className="text-sm text-muted-foreground">Computation Time:</span>
                          <span
</> className="font-medium">
                            {analysisResult.metadata.computationTimeMs || 0} ms
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        No metadata available
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Export Results Dialog */}
      <ExportResultsDialog
        open={showExportDialog}
        onClose={handleCloseExportDialog}
        analysisResult={analysisResult}
        defaultTitle={analysisResult ? `${operationLabels[analysisResult.type as GeospatialOperationType]} Analysis` : ''}
      />
    </div>
  );
}