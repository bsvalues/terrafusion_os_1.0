import React, { useState } from 'react';
import { useTitle } from '@/hooks/use-title';
import { CartographerMap } from '@/components/maps/cartographer-map';
import { GeoJSONFeature, DEFAULT_MAP_LAYERS } from '@/lib/map-utils';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download,
  Upload,
  Save,
  FileText,
  Map,
  Eye,
  Code,
  HelpCircle
 } from '@mui/icons-material';

/**
 * Advanced cartographic tools page with precision drawing and editing features
 */
export default function CartographerToolsPage() {
  useTitle('Advanced Cartography Tools - Benton County GIS');
  const { toast } = useToast();
  const [mapFeatures, setMapFeatures] = useState<GeoJSONFeature[]>([]);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [exportTab, setExportTab] = useState('json');
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Handle features changed
  const handleFeaturesChanged = (features: GeoJSONFeature[]) => {
    setMapFeatures(features);
  };
  
  // Export features to GeoJSON
  const handleExportGeoJSON = () => {
    if (mapFeatures.length === 0) {
      toast({
        title: "No Features to Export",
        description: "Draw some features on the map first",
        variant: "destructive"
      });
      return;
    }
    
    const geoJson = {
      type: 'FeatureCollection',
      features: mapFeatures
    };
    
    setJsonText(JSON.stringify(geoJson, null, 2));
    setJsonDialogOpen(true);
    setExportTab('json');
  };
  
  // Import GeoJSON
  const handleImportGeoJSON = () => {
    try {
      const data = JSON.parse(jsonText);
      
      // Handle both FeatureCollection and individual features
      if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        setMapFeatures(data.features);
      } else if (data.type === 'Feature') {
        setMapFeatures([data]);
      } else {
        throw new Error('Invalid GeoJSON format');
      }
      
      setJsonDialogOpen(false);
      
      toast({
        title: "Import Successful",
        description: "GeoJSON data has been imported to the map",
      });
    } catch (error) {
      console.error('Failed to import GeoJSON:', error);
      toast({
        title: "Import Failed",
        description: "Invalid GeoJSON format",
        variant: "destructive"
      });
    }
  };
  
  // Handle downloading GeoJSON
  const handleDownloadGeoJSON = () => {
    if (mapFeatures.length === 0) {
      toast({
        title: "No Features to Download",
        description: "Draw some features on the map first",
        variant: "destructive"
      });
      return;
    }
    
    const geoJson = {
      type: 'FeatureCollection',
      features: mapFeatures
    };
    
    const dataStr = JSON.stringify(geoJson, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `benton-county-features-${new Date().toISOString().slice(0, 10)}.geojson`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div><>

          <h1 className="text-3xl font-bold tracking-tight">Advanced Cartography Tools</h1>
          <p
</> className="text-muted-foreground">
            Precision drawing and editing tools for cartographers
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJsonDialogOpen(true)}><>

            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
</> variant="outline" onClick={handleExportGeoJSON}><>

            <Eye className="h-4 w-4 mr-2" />
            View GeoJSON
          </Button>
          <Button
</> onClick={handleDownloadGeoJSON}><>

            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
</> variant="outline" onClick={() => setShowTutorial(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Tutorial
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3"><>

            <CardTitle>Interactive Map</CardTitle>
            <CardDescription
</>>
              Use the precision drawing tools to create and edit map features
            </CardDescription>
          </CardHeader>
          <CardContent><>

            <CartographerMap
              height="700px"
              mapLayers={DEFAULT_MAP_LAYERS}
              onFeaturesChanged={handleFeaturesChanged}
              initialFeatures={mapFeatures}
              showPrecisionTools={true}
            />
          </CardContent>
          <CardFooter
</> className="flex justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {mapFeatures.length} feature{mapFeatures.length !== 1 ? 's' : ''} on map
              <span className="ml-4 text-blue-500 font-medium">
                NEW: Animated County Boundary Transitions now available!
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTutorial(true)}>
                Feature Guide
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Data Import/Export Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh]">
          <DialogHeader><>

            <DialogTitle>
              {exportTab === 'json' ? 'GeoJSON Data' : 'Import GeoJSON'}
            </DialogTitle>
            <DialogDescription
</>>
              {exportTab === 'json' 
                ? 'View and export the GeoJSON representation of your map features' 
                : 'Paste GeoJSON data to import into the map'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="json" value={exportTab} onValueChange={setExportTab}>
            <TabsList className="grid w-full grid-cols-2"><>

              <TabsTrigger value="json">GeoJSON</TabsTrigger>
              <TabsTrigger
</> value="import">Import</TabsTrigger>
            </TabsList>
            <TabsContent value="json" className="pt-4">
              <div className="grid gap-4"><>

                <Textarea 
                  value={jsonText} 
                  readOnly 
                  className="font-mono text-sm h-96 overflow-auto" 
                />
              </div>
              
              <DialogFooter
</> className="mt-6"><>

                <Button variant="outline" onClick={() => setJsonDialogOpen(false)}>
                  Close
                </Button>
                <Button
</> onClick={handleDownloadGeoJSON}>
                  <Download className="h-4 w-4 mr-2" />
                  Download GeoJSON
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="import" className="pt-4">
              <div className="grid gap-4">
                <div className="grid gap-2"><>

                  <Label htmlFor="json-import">Paste GeoJSON Data</Label>
                  <Textarea
</> 
                    id="json-import"
                    value={jsonText} 
                    onChange={(e) => setJsonText(e.target.value)}
                    className="font-mono text-sm h-96" 
                    placeholder='{"type":"FeatureCollection","features":[...]}'
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6"><>

                <Button variant="outline" onClick={() => setJsonDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
</> onClick={handleImportGeoJSON}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Tutorial Dialog */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><>

            <DialogTitle>Advanced Cartography Tools Guide</DialogTitle>
            <DialogDescription
</>>
              Learn how to use the precision drawing and editing features
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2 mb-6 bg-blue-50 rounded"><>

              <h3 className="text-lg font-semibold mb-2 text-blue-700">NEW: Animated County Boundaries</h3>
              <p
</> className="text-sm text-muted-foreground mb-2">
                Smooth transitions between county boundary layers:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>County View:</strong> View the entire county boundary</li>
                <li><strong>Township View:</strong> Zoom to township boundaries with smooth animations</li>
                <li><strong>Section View:</strong> Transition to section boundaries within townships</li>
                <li><strong>Parcel View:</strong> View individual parcels with animated transitions</li>
              </ul>
              <p className="text-sm text-blue-700 mt-2 font-medium">
                Use the boundary control in the top-left corner of the map to try this new feature!
              </p>
            </div>
            
            <div><>

              <h3 className="text-lg font-semibold mb-2">Drawing Tools</h3>
              <p
</> className="text-sm text-muted-foreground mb-2">
                Advanced drawing tools with precision controls:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Rectangle Tool:</strong> Create rectangles with precise dimensions</li>
                <li><strong>Circle Tool:</strong> Create circles with exact radius</li>
                <li><strong>Polygon Tool:</strong> Draw polygons with snapping to existing features</li>
                <li><strong>Line Tool:</strong> Draw lines with precise measurements</li>
              </ul>
            </div>
            
            <div><>

              <h3 className="text-lg font-semibold mb-2">Editing Features</h3>
              <p
</> className="text-sm text-muted-foreground mb-2">
                Tools for editing and modifying features:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Split Tool:</strong> Split polygons by drawing a line through them</li>
                <li><strong>Join Tool:</strong> Merge adjacent polygons into a single feature</li>
                <li><strong>Move Tool:</strong> Precisely position features on the map</li>
                <li><strong>Scale Tool:</strong> Resize features while maintaining proportions</li>
              </ul>
            </div>
            
            <div><>

              <h3 className="text-lg font-semibold mb-2">Version Control</h3>
              <p
</> className="text-sm text-muted-foreground mb-2">
                Track changes to features over time:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Version History:</strong> View and restore previous versions of features</li>
                <li><strong>Compare Versions:</strong> See what changed between different versions</li>
                <li><strong>Annotations:</strong> Add notes to explain changes</li>
              </ul>
            </div>
            
            <div><>

              <h3 className="text-lg font-semibold mb-2">Legal Descriptions</h3>
              <p
</> className="text-sm text-muted-foreground mb-2">
                Generate legal descriptions from drawn parcels:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Generate Description:</strong> Create a legal description from a polygon</li>
                <li><strong>Parcel Numbers:</strong> Generate parcel numbers based on township/range</li>
                <li><strong>Export:</strong> Download descriptions for use in legal documents</li>
              </ul>
            </div>
            
            <div><>

              <h3 className="text-lg font-semibold mb-2">Data Import/Export</h3>
              <p
</> className="text-sm text-muted-foreground mb-2">
                Share and save your work:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>GeoJSON Export:</strong> Save features in standard GeoJSON format</li>
                <li><strong>Import:</strong> Load previously created features</li>
                <li><strong>Interoperability:</strong> Compatible with other GIS systems</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button onClick={() => setShowTutorial(false)}>Close Guide</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}