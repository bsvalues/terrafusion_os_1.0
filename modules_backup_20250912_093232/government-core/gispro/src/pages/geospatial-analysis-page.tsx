import {useState, useCallback, useRef} from 'react';
import {MapContainer, TileLayer, GeoJSON, FeatureGroup, useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import {Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,} from '@/components/ui/card';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Slider} from '@/components/ui/slider';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {useToast} from '@/hooks/use-toast';
import {useIsMobile} from '@/hooks/use-mobile';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {useMutation} from '@tanstack/react-query';
import {apiRequest} from '@/lib/queryClient';
import {DrawControl} from '@/components/maps/draw-control';
import ExportResultsDialog from '@/components/analysis/export-results-dialog';
import {FileImportExport} from '@/components/maps/file-import-export';
import {CoordinateAddressDisplay} from '@/components/maps/coordinate-address-display';
import {BuildingFootprintsLayer} from '@/components/maps/building-footprints-layer';
import {PropertyListingsPanel} from '@/components/maps/property-listings-panel';
import {Building, Map, Home} from '@mui/icons-material';
import {Calculator,
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
  DownloadCloud,} from '@mui/icons-material';
import {cn} from '@/lib/utils';

// Geospatial operation types
enum GeospatialOperationType {BUFFER = 'buffer',
  INTERSECTION = 'intersection',
  UNION = 'union',
  DIFFERENCE = 'difference',
  AREA = 'area',
  CENTROID = 'centroid',
  DISTANCE = 'distance',
  MERGE = 'merge',
  SPLIT = 'split',
  SIMPLIFY = 'simplify',}

// Measurement units
enum MeasurementUnit {METERS = 'meters',
  KILOMETERS = 'kilometers',
  FEET = 'feet',
  YARDS = 'yards',
  MILES = 'miles',
  ACRES = 'acres',
  HECTARES = 'hectares',
  SQUARE_FEET = 'square_feet',
  SQUARE_MILES = 'square_miles',}

// Icons for each operation type
const operationIcons: Record<GeospatialOperationType, React.ReactNode>= {[GeospatialOperationType.BUFFER]:<Circle className="h-5 w-5" />,
  [GeospatialOperationType.INTERSECTION]: <Combine className="h-5 w-5" />,
  [GeospatialOperationType.UNION]: <LayoutGrid className="h-5 w-5" />,
  [GeospatialOperationType.DIFFERENCE]: <Minimize className="h-5 w-5" />,
  [GeospatialOperationType.AREA]: <Calculator className="h-5 w-5" />,
  [GeospatialOperationType.CENTROID]: <Move className="h-5 w-5" />,
  [GeospatialOperationType.DISTANCE]: <Ruler className="h-5 w-5" />,
  [GeospatialOperationType.MERGE]: <Maximize className="h-5 w-5" />,
  [GeospatialOperationType.SPLIT]: <Scissors className="h-5 w-5" />,
  [GeospatialOperationType.SIMPLIFY]: <Refresh className="h-5 w-5" />,};

// Operation labels
const operationLabels: Record<GeospatialOperationType, string> = {[GeospatialOperationType.BUFFER]: 'Buffer',
  [GeospatialOperationType.INTERSECTION]: 'Intersection',
  [GeospatialOperationType.UNION]: 'Union',
  [GeospatialOperationType.DIFFERENCE]: 'Difference',
  [GeospatialOperationType.AREA]: 'Area Calculation',
  [GeospatialOperationType.CENTROID]: 'Centroid',
  [GeospatialOperationType.DISTANCE]: 'Distance Measurement',
  [GeospatialOperationType.MERGE]: 'Merge Features',
  [GeospatialOperationType.SPLIT]: 'Split Features',
  [GeospatialOperationType.SIMPLIFY]: 'Simplify Geometry',};

// Form validation schema
const formSchema = z.object({operation: z.nativeEnum(GeospatialOperationType),
  bufferDistance: z.number().min(0).optional(),
  bufferUnit: z.nativeEnum(MeasurementUnit).optional(),
  toleranceDistance: z.number().min(0).optional(),
  preserveProperties: z.boolean().optional(),});

type GeospatialFormValues = z.infer<typeof formSchema>;

export default function GeospatialAnalysisPage() {const [selectedFeatures, setSelectedFeatures] = useState<any[]>([]);
  const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [resultFeatures, setResultFeatures] = useState<any>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showBuildingFootprints, setShowBuildingFootprints] = useState(false);
  const [showPropertyListings, setShowPropertyListings] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number} | null>(null);

  const {toast} = useToast();
  const isMobile = useIsMobile();

  const form = useForm<GeospatialFormValues>({resolver: zodResolver(formSchema),
    defaultValues: {
      operation: GeospatialOperationType.BUFFER,
      bufferDistance: 100,
      bufferUnit: MeasurementUnit.METERS,
      toleranceDistance: 1,
      preserveProperties: true,},
  });

  // Analysis mutation
  const analysisMutation = useMutation({mutationFn: async (data: any) =>{
      return apiRequest('/api/geospatial-analysis', 'POST', data);},
    onSuccess: data => {setAnalysisResult(data);

      if (data.result) {
        if (data.result.type === 'FeatureCollection') {
          setResultFeatures(data.result);} else if (typeof data.result === 'object') {setResultFeatures({
            type: 'FeatureCollection',
            features: [data.result],});
        } else {setResultFeatures(null);}
      } else {setResultFeatures(null);}

      toast({
        title: 'Analysis Complete',
        description: `Successfully performed ${operationLabels[data.type]} operation`,
      });
    },
    onError: error => {
      toast({
        title: 'Analysis Failed',
        description: `Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    },
  });

  // Submit analysis
  const onSubmit = useCallback(
    async (values: GeospatialFormValues) => {if (selectedFeatures.length === 0 && (!drawnItems || drawnItems.getLayers().length === 0)) {
        toast({
          title: 'No Features Selected',
          description: 'Please select features or draw on the map before running analysis',
          variant: 'destructive',});
        return;
      }

      const allFeatures = [...selectedFeatures];

      if (drawnItems) {drawnItems.eachLayer((layer: any) => {
          if (layer.toGeoJSON) {
            allFeatures.push(layer.toGeoJSON());}
        });
      }

      const requestData = {operation: values.operation,
        features: allFeatures,
        parameters: {
          bufferDistance: values.bufferDistance,
          bufferUnit: values.bufferUnit,
          toleranceDistance: values.toleranceDistance,
          preserveProperties: values.preserveProperties,},
      };

      analysisMutation.mutate(requestData);
    },
    [selectedFeatures, drawnItems, analysisMutation, toast]
  );

  // Map click handler component
  const MapClickHandler = () => {useMapEvents({
      click: e => {
        setClickedCoords({ lat: e.latlng.lat, lng: e.latlng.lng});
      },
    });
    return null;
  };

  // Event handlers
  const handleClearSelection = () => {setSelectedFeatures([]);
    if (drawnItems) {
      drawnItems.clearLayers();}
  };

  const handleClearResults = () => {setAnalysisResult(null);
    setResultFeatures(null);};

  const handleCloseAddressPanel = () => {setClickedCoords(null);};

  const handleClosePropertyListingsPanel = () => {setShowPropertyListings(false);};

  const handleCloseExportDialog = () => {setShowExportDialog(false);};

  // Style functions for map layers
  const selectedFeaturesStyle = {color: '#3B82F6',
    weight: 3,
    fillOpacity: 0.2,};

  const resultFeaturesStyle = {color: '#10B981',
    weight: 3,
    fillOpacity: 0.3,};

  return (<div className="container mx-auto p-6 space-y-6"><div className="flex flex-col lg:flex-row gap-6">{/* Analysis Controls */}<div className="w-full lg:w-1/3 space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Geospatial Analysis</CardTitle><CardDescription>Perform spatial operations on geographic data</CardDescription></CardHeader><CardContent><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><FormField
                    control={form.control}
                    name="operation"
                    render={({ field}) => (<FormItem><FormLabel>Analysis Operation</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select operation" /></SelectTrigger></FormControl><SelectContent>{Object.values(GeospatialOperationType).map(op => (<SelectItem key={op} value={op}><div className="flex items-center gap-2">{operationIcons[op]}
                                  {operationLabels[op]}</div></SelectItem>))}</SelectContent></Select><FormDescription>Choose the spatial operation to perform</FormDescription></FormItem>)}
                  />

                  {/* Conditional parameters based on operation */}
                  {form.watch('operation') === GeospatialOperationType.BUFFER && (<div><FormField
                        control={form.control}
                        name="bufferDistance"
                        render={({ field}) => (<FormItem><FormLabel>Buffer Distance</FormLabel><FormControl><Input
                                type="number"
                                placeholder="100"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              /></FormControl><FormDescription>Distance for buffer operation</FormDescription></FormItem>
                        )}
                      /><FormField
                        control={form.control}
                        name="bufferUnit"
                        render={({ field}) => (<FormItem><FormLabel>Distance Unit</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl><SelectContent><SelectItem value={MeasurementUnit.METERS}>Meters</SelectItem><SelectItem value={MeasurementUnit.KILOMETERS}>Kilometers</SelectItem><SelectItem value={MeasurementUnit.FEET}>Feet</SelectItem><SelectItem value={MeasurementUnit.YARDS}>Yards</SelectItem><SelectItem value={MeasurementUnit.MILES}>Miles</SelectItem></SelectContent></Select></FormItem>
                        )}
                      /></div>)}

                  {form.watch('operation') === GeospatialOperationType.SIMPLIFY && (<FormField
                      control={form.control}
                      name="toleranceDistance"
                      render={({ field}) => (<FormItem><FormLabel>Tolerance Distance</FormLabel><FormControl><Input
                              type="number"
                              placeholder="1"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            /></FormControl><FormDescription>Simplification tolerance in meters</FormDescription></FormItem>)}
                    />
                  )}<Button type="submit" disabled={analysisMutation.isPending} className="w-full">{analysisMutation.isPending ? 'Analyzing...' : 'Run Analysis'}</Button></form></Form></CardContent></Card>{/* File Import/Export */}<Card><CardHeader><CardTitle className="flex items-center gap-2"><DownloadCloud className="h-5 w-5" />Data Management</CardTitle></CardHeader><CardContent><FileImportExport
                onFeaturesImported={setSelectedFeatures}
                onExportRequested={() => setShowExportDialog(true)}
              /></CardContent></Card>{/* Analysis Results */}
          {analysisResult && (<Card><CardHeader><CardTitle className="flex items-center justify-between"><span>Analysis Results</span><Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}><DownloadCloud className="h-4 w-4" />Export</Button></CardTitle></CardHeader><CardContent><Tabs defaultValue="summary"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="summary">Summary</TabsTrigger><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="metadata">Metadata</TabsTrigger></TabsList><TabsContent value="summary"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">{operationLabels[analysisResult.type as GeospatialOperationType]}</span><Badge variant="outline">Success</Badge></div><Separator className="my-2" />{typeof analysisResult.result === 'number' ? (<div className="text-center p-4"><div className="text-3xl font-bold">{analysisResult.result.toFixed(2)}</div><div className="text-sm text-muted-foreground mt-1">{analysisResult.metadata?.unit || ''}</div></div>) : (<div className="space-y-1"><div className="flex justify-between"><span className="text-sm text-muted-foreground">Features:</span><span className="font-medium">{resultFeatures?.features?.length || 1}</span></div>{analysisResult.metadata?.area && (<div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Area:</span><span className="font-medium">{analysisResult.metadata.area.toFixed(2)}{' '}
                              {analysisResult.metadata.unit}</span></div>)}

                        {analysisResult.metadata?.distance && (<div className="flex justify-between"><span className="text-sm text-muted-foreground">Distance:</span><span className="font-medium">{analysisResult.metadata.distance.toFixed(2)}{' '}
                              {analysisResult.metadata.unit}</span></div>)}</div>)}</TabsContent><TabsContent value="details" className="max-h-60 overflow-y-auto">{resultFeatures?.features ? (
                      resultFeatures.features.map((feature: any, idx: number) => (<div key={idx} className="mb-2 p-2 border rounded"><div className="font-medium">Feature {idx + 1}</div>{feature.properties &&
                            Object.entries(feature.properties).map(([key, value]) => (<div key={key} className="flex justify-between text-sm"><span className="text-muted-foreground">{key}:</span><span>{String(value)}</span></div>))}</div>))
                    ) : (<div className="text-center p-4 text-muted-foreground">No detailed feature data available</div>)}</TabsContent><TabsContent value="metadata" className="max-h-60 overflow-y-auto">{analysisResult.metadata ? (<div className="space-y-1">{Object.entries(analysisResult.metadata).map(([key, value]) => (<div key={key} className="flex justify-between"><span className="text-sm text-muted-foreground">{key}:</span><span className="font-medium">{String(value)}</span></div>))}<div className="flex justify-between"><span className="text-sm text-muted-foreground">Computation Time:</span><span className="font-medium">{analysisResult.metadata.computationTimeMs || 0} ms</span></div></div>) : (<div className="text-center p-4 text-muted-foreground">No metadata available</div>)}</TabsContent></Tabs></CardContent></Card>)}</div>{/* Map */}<div className="w-full lg:w-2/3"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Map className="h-5 w-5" />Interactive Map</CardTitle><CardDescription>Draw, select, and visualize geographic features</CardDescription></CardHeader><CardContent className="p-0"><div className="relative h-[600px]"><MapContainer
                  center={[45.5152, -122.6784]}
                  zoom={13}
                  style={{ height: '100%', width: '100%'}}
                  className="rounded-b-lg"
                ><TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Selected features layer */}
                  {selectedFeatures.map((feature, index) => (<GeoJSON
                      key={`selected-${index}`}
                      data={feature}
                      style={selectedFeaturesStyle} />))}

                  {/* Result features layer */}
                  {resultFeatures &&<GeoJSON data={resultFeatures} style={resultFeaturesStyle} />}

                  {/* Drawing controls */}
                  <DrawControl
                    onCreated={e =>{
                      if (!drawnItems) {
                        const newDrawnItems = new L.FeatureGroup();
                        setDrawnItems(newDrawnItems);}
                      if (drawnItems) {drawnItems.addLayer(e.layer);}
                    }}
                    onEdited={e => {
                      // Handle edited features}}
                    onDeleted={e => {
                      // Handle deleted features}}
                    drawOptions={{
                      polyline: {
                        shapeOptions: {
                          color: '#3B82F6',
                          weight: 4,},
                      },
                      polygon: {shapeOptions: {
                          color: '#3B82F6',
                          weight: 2,
                          fillOpacity: 0.2,},
                      },
                      rectangle: {shapeOptions: {
                          color: '#3B82F6',
                          weight: 2,
                          fillOpacity: 0.2,},
                      },
                      circle: {shapeOptions: {
                          color: '#3B82F6',
                          weight: 2,
                          fillOpacity: 0.2,},
                      },
                      marker: false,
                      circlemarker: false,
                    }}
                    edit={{
                      featureGroup: drawnItems || new L.FeatureGroup(),}}
                  />

                  {/* Building footprints layer */}
                  {showBuildingFootprints && (<BuildingFootprintsLayer
                      fillColor="#6366f1"
                      strokeColor="#4338ca"
                      opacity={0.15}
                      weight={1} />)}

                  {/* Map click handler */}<MapClickHandler /></MapContainer>{/* Show address information when a location is clicked */}
                {clickedCoords && (<div className="absolute bottom-4 right-4 z-[1000] max-w-md"><CoordinateAddressDisplay
                      latitude={clickedCoords.lat}
                      longitude={clickedCoords.lng}
                      onClose={handleCloseAddressPanel} /></div>)}

                {/* Show property listings when enabled */}
                {showPropertyListings && clickedCoords && (<div className="absolute top-4 right-4 z-[1000] max-w-md"><PropertyListingsPanel
                      latitude={clickedCoords.lat}
                      longitude={clickedCoords.lng}
                      radiusMiles={1}
                      onClose={handleClosePropertyListingsPanel} /></div>)}</div></CardContent><CardFooter className="flex justify-between"><div className="flex items-center space-x-2"><Button variant="outline" size="sm" onClick={handleClearSelection}>Clear Selection</Button><Button variant="outline" size="sm" onClick={handleClearResults}>Clear Results</Button><Button
                  variant={showBuildingFootprints ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowBuildingFootprints(!showBuildingFootprints)}
                  title="Toggle Building Footprints"
                ><Building className="h-4 w-4" /></Button><Button
                  variant={showPropertyListings ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowPropertyListings(!showPropertyListings)}
                  title="Toggle Property Listings"
                ><Home className="h-4 w-4" /></Button></div><div className="text-sm text-muted-foreground">Selected: {selectedFeatures.length + (drawnItems?.getLayers().length || 0)} features</div></CardFooter></Card></div></div>{/* Export Results Dialog */}<ExportResultsDialog
        open={showExportDialog}
        onClose={handleCloseExportDialog}
        analysisResult={analysisResult}
        defaultTitle={analysisResult
            ? `${operationLabels[analysisResult.type as GeospatialOperationType]} Analysis`
            : ''
        } /></div>
  );
}
