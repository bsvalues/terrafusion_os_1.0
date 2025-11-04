import { useState } from 'react';
import { useGIS } from '@/modules/gis/contexts/GISContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, Check, Layers, Download, Map, Database  } from '@mui/icons-material';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define the schema for the export form
const exportFormSchema = z.object({
  // Step 1: Select layers
  selectedLayers: z.array(z.string()).min(1, 'Select at least one layer'),

  // Step 2: Format and options
  format: z.enum(['geojson', 'shapefile', 'kml', 'csv', 'xlsx']),
  includeAttributes: z.boolean().default(true),
  includeGeometry: z.boolean().default(true),
  coordinateSystem: z.enum(['EPSG:4326', 'EPSG:3857', 'EPSG:2927']).default('EPSG:4326'),

  // Step 3: Area selection
  exportArea: z.enum(['visible', 'selection', 'all']).default('visible'),
  customBoundingBox: z.string().optional(),

  // Step 4: Output options
  filename: z.string().min(1, 'Filename is required'),
  compression: z.enum(['none', 'zip']).default('none'),
  includeMetadata: z.boolean().default(true),
});

type ExportFormType = z.infer<typeof exportFormSchema>;

// Mock data for available layers
const mockLayers = [
  { id: 'property-parcels', name: 'Property Parcels' },
  { id: 'zoning', name: 'Zoning Districts' },
  { id: 'roads', name: 'Road Network' },
  { id: 'boundaries', name: 'Administrative Boundaries' },
  { id: 'terrain', name: 'Terrain' },
];

/**
 * GeospatialExportWizard Component
 *
 * A multi-step wizard for exporting geospatial data from the GIS system
 * in various formats with configurable options.
 */
export default function GeospatialExportWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const { isMapLoaded } = useGIS();
  const { toast } = useToast();

  const form = useForm<ExportFormType>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      selectedLayers: [],
      format: 'geojson',
      includeAttributes: true,
      includeGeometry: true,
      coordinateSystem: 'EPSG:4326',
      exportArea: 'visible',
      filename: 'export',
      compression: 'none',
      includeMetadata: true,
    },
  });

  const steps = [
    { id: 'layers', title: 'Select Layers' },
    { id: 'format', title: 'Format & Options' },
    { id: 'area', title: 'Area Selection' },
    { id: 'output', title: 'Output Options' },
  ];

  const onSubmit = async (data: ExportFormType) => {
    setIsExporting(true);

    try {
      // Prepare the export request
      const exportRequest = {
        layers: data.selectedLayers,
        format: data.format,
        options: {
          includeAttributes: data.includeAttributes,
          includeGeometry: data.includeGeometry,
          coordinateSystem: data.coordinateSystem,
          exportArea: data.exportArea,
          customBoundingBox: data.customBoundingBox,
          compression: data.compression,
          includeMetadata: data.includeMetadata,
        },
        filename: data.filename,
      };

      // Call the API to generate the export
      const response = await fetch('/api/gis/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Handle the different types of responses based on format
      if (data.format === 'geojson') {
        const jsonData = await response.json();

        // Create a blob and download it
        const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.filename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For other formats, get the blob and download it
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.filename}.${getFileExtension(data.format)}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Export Successful',
        description: `Your ${data.format.toUpperCase()} export has been downloaded.`,
        variant: 'default',
      });

      // Close the modal
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export the selected data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Get file extension for download based on format
  const getFileExtension = (format: string): string => {
    switch (format) {
      case 'geojson':
        return 'json';
      case 'shapefile':
        return 'zip';
      case 'kml':
        return 'kml';
      case 'csv':
        return 'csv';
      case 'xlsx':
        return 'xlsx';
      default:
        return 'zip';
    }
  };

  // Handle next step
  const handleNext = async () => {
    // Validate the current step before moving to the next
    const fieldsToValidate: Record<number, (keyof ExportFormType)[]> = {
      0: ['selectedLayers'],
      1: ['format', 'coordinateSystem'],
      2: ['exportArea'],
      3: ['filename'],
    };

    const currentFields = fieldsToValidate[currentStep];
    const isValid = await form.trigger(currentFields as any);

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex justify-start items-center"
          onClick={() => setIsOpen(true)}
        >
          <FileDown className="h-4 w-4 mr-2" />
          <span className="text-xs">Export Geospatial Data</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
<>
            <FileDown className="h-5 w-5 mr-2" />
            Geospatial Data Export
          </DialogTitle>
          <DialogDescription
</>>
            Export map data in various formats with customized options.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="mb-4">
          <div className="flex justify-between">
            {steps.map((step /* , index */) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 
                    ${
                      index < currentStep
                        ? 'bg-primary text-white'
                        : index === currentStep
                          ? 'border-2 border-primary'
                          : 'border border-muted-foreground'
                    }`}
                >
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-xs">{step.title}</span>
              </div>
            ))}
          </div>
<>
          <Separator className="my-4" />
        </div>

        <Form
</> {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Select Layers */}
            {currentStep === 0 && (
              <div className="space-y-4">
<>
                <h3 className="text-lg font-medium">Select Layers to Export</h3>
                <p
</> className="text-sm text-muted-foreground">
                  Choose the map layers you want to include in your export.
                </p>

                <FormField
                  control={form.control}
                  name="selectedLayers"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-2">
                        {mockLayers.map(layer => (
                          <div key={layer.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.includes(layer.id)}
                              onCheckedChange={checked => {
                                const updatedLayers = checked
                                  ? [...field.value, layer.id]
                                  : field.value.filter(id => id !== layer.id);
                                field.onChange(updatedLayers);
                              }}
                              id={`layer-${layer.id}`}
                            />
                            <label
                              htmlFor={`layer-${layer.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {layer.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Format & Options */}
            {currentStep === 1 && (
              <div className="space-y-4">
<>
                <h3 className="text-lg font-medium">Export Format & Options</h3>
                <p
</> className="text-sm text-muted-foreground">
                  Choose the file format and configure export options.
                </p>

                <Tabs defaultValue="format" className="w-full">
                  <TabsList className="grid grid-cols-2">
<>
                    <TabsTrigger value="format">Format</TabsTrigger>
                    <TabsTrigger
</> value="options">Options</TabsTrigger>
                  </TabsList>

                  <TabsContent value="format" className="pt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
<>
                          <FormLabel>File Format</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
<>
                              <SelectItem value="geojson">GeoJSON (.json)</SelectItem>
                              <SelectItem
</> value="shapefile">Shapefile (.zip)</SelectItem>
<>
                              <SelectItem value="kml">KML (.kml)</SelectItem>
                              <SelectItem
</> value="csv">CSV (.csv)</SelectItem>
                              <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                            </SelectContent>
                          </Select>
<>
                          <FormDescription>
                            Choose the format for your exported data.
                          </FormDescription>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coordinateSystem"
                      render={({ field }) => (
                        <FormItem>
<>
                          <FormLabel>Coordinate System</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select coordinate system" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
<>
                              <SelectItem value="EPSG:4326">WGS 84 (EPSG:4326)</SelectItem>
                              <SelectItem
</> value="EPSG:3857">Web Mercator (EPSG:3857)</SelectItem>
                              <SelectItem value="EPSG:2927">
                                NAD83 Washington State Plane South (EPSG:2927)
                              </SelectItem>
                            </SelectContent>
                          </Select>
<>
                          <FormDescription>
                            Set the coordinate reference system for your export.
                          </FormDescription>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="options" className="pt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="includeAttributes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
<>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div
</> className="space-y-1 leading-none">
<>
                            <FormLabel>Include Attributes</FormLabel>
                            <FormDescription
</>>
                              Export all property attributes with the geometries.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeGeometry"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
<>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div
</> className="space-y-1 leading-none">
<>
                            <FormLabel>Include Geometry</FormLabel>
                            <FormDescription
</>>
                              Export the spatial geometry of each feature.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Step 3: Area Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
<>
                <h3 className="text-lg font-medium">Select Export Area</h3>
                <p
</> className="text-sm text-muted-foreground">
                  Choose which area to include in the export.
                </p>

                <FormField
                  control={form.control}
                  name="exportArea"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          <Card
                            className={`cursor-pointer border-2 ${field.value === 'visible' ? 'border-primary' : 'border-border'}`}
                            onClick={() => field.onChange('visible')}
                          >
                            <CardContent className="flex flex-col items-center justify-center p-4">
                              <Map className="h-8 w-8 mb-2 text-primary" />
<>
                              <span className="text-sm font-medium">Visible Area</span>
                              <span
</> className="text-xs text-muted-foreground">
                                Current map view
                              </span>
                            </CardContent>
                          </Card>

                          <Card
                            className={`cursor-pointer border-2 ${field.value === 'selection' ? 'border-primary' : 'border-border'}`}
                            onClick={() => field.onChange('selection')}
                          >
                            <CardContent className="flex flex-col items-center justify-center p-4">
                              <Layers className="h-8 w-8 mb-2 text-primary" />
<>
                              <span className="text-sm font-medium">Selection</span>
                              <span
</> className="text-xs text-muted-foreground">
                                Selected features
                              </span>
                            </CardContent>
                          </Card>

                          <Card
                            className={`cursor-pointer border-2 ${field.value === 'all' ? 'border-primary' : 'border-border'}`}
                            onClick={() => field.onChange('all')}
                          >
                            <CardContent className="flex flex-col items-center justify-center p-4">
                              <Database className="h-8 w-8 mb-2 text-primary" />
<>
                              <span className="text-sm font-medium">All Data</span>
                              <span
</> className="text-xs text-muted-foreground">Complete layers</span>
                            </CardContent>
                          </Card>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('exportArea') === 'visible' && (
                  <div className="p-4 bg-muted rounded-md">
<>
                    <h4 className="text-sm font-medium mb-2">Current View Bounds</h4>
                    <p
</> className="text-xs text-muted-foreground">
                      The export will include all features within the current map view.
                    </p>
                  </div>
                )}

                {form.watch('exportArea') === 'selection' && (
                  <div className="p-4 bg-muted rounded-md">
<>
                    <h4 className="text-sm font-medium mb-2">Selected Features</h4>
                    <p
</> className="text-xs text-muted-foreground">
                      The export will include only the features you've selected on the map.
                      {!isMapLoaded && ' No features are currently selected.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Output Options */}
            {currentStep === 3 && (
              <div className="space-y-4">
<>
                <h3 className="text-lg font-medium">Output Options</h3>
                <p
</> className="text-sm text-muted-foreground">Configure the output file options.</p>

                <FormField
                  control={form.control}
                  name="filename"
                  render={({ field }) => (
                    <FormItem>
<>
                      <FormLabel>Filename</FormLabel>
                      <FormControl
</>>
<>
                        <Input placeholder="export" {...field} />
                      </FormControl>
                      <FormDescription
</>>
                        Name for your export file (without extension).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="compression"
                  render={({ field }) => (
                    <FormItem>
<>
                      <FormLabel>Compression</FormLabel>
                      <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select compression option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
<>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem
</> value="zip">ZIP Archive</SelectItem>
                        </SelectContent>
                      </Select>
<>
                      <FormDescription>Choose compression for the exported files.</FormDescription>
                      <FormMessage
</> />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeMetadata"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
<>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div
</> className="space-y-1 leading-none">
<>
                        <FormLabel>Include Metadata</FormLabel>
                        <FormDescription
</>>
                          Add a metadata file with export details and layer information.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="p-4 bg-muted rounded-md">
<>
                  <h4 className="text-sm font-medium mb-2">Export Summary</h4>
                  <div
</> className="text-xs space-y-1">
                    <p>
                      <strong>Format:</strong> {form.watch('format').toUpperCase()}
                    </p>
                    <p>
                      <strong>Layers:</strong> {form.watch('selectedLayers').length} selected
                    </p>
                    <p>
                      <strong>Area:</strong> {form.watch('exportArea')} region
                    </p>
                    <p>
                      <strong>Filename:</strong> {form.watch('filename')}.
                      {getFileExtension(form.watch('format'))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>

        <DialogFooter className="flex justify-between">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious} disabled={isExporting}>
              Back
            </Button>
          )}
<>
          <div className="flex-1"></div>
          <Button
</> onClick={handleNext} disabled={isExporting}>
            {isExporting && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            )}
            {currentStep < steps.length - 1 ? 'Next' : 'Export'}
            {!isExporting && currentStep < steps.length - 1 && (
              <Download className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
