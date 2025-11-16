import { useState } from 'react';
import { useGIS } from '@/modules/gis/contexts/GISContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search,
  SlidersHorizontal,
  Map,
  Database,
  FileDown,
  Camera,
  RotateCw,
  Compass,
  BookOpen,
 } from '@mui/icons-material';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import GeospatialExportWizard from '@/modules/gis/components/GeospatialExportWizard';
import GeospatialStorytellingWizard from '@/modules/gis/components/GeospatialStorytellingWizard';

const GISControlPanel = () => {
  const {
    isLayersPanelOpen,
    toggleLayersPanel,
    setZoom,
    setCenter,
    createSnapshot,
    exportCurrentView,
  } = useGIS();

  const [activeTab, setActiveTab] = useState('layers');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('png');
  const [addressSearchValue, setAddressSearchValue] = useState('');
  const [is3DEnabled, setIs3DEnabled] = useState(false);

  // Handle address search
  const handleAddressSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // This would typically call a geocoding service
    // For demo purposes, we'll just center on Benton County
    setCenter([-119.7, 46.2]);
    setZoom(13);
  };

  // Handle snapshot
  const handleCreateSnapshot = async () => {
    try {
      const snapshotUrl = await createSnapshot();
      // Would typically display the snapshot or allow download
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportUrl = await exportCurrentView(exportFormat as 'png' | 'jpg' | 'pdf');
      // Would typically trigger a download
    } catch (error) {
      console.error(`Failed to export as ${exportFormat}:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  // Render layers tab
  const renderLayersTab = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-1"><>

          <Label htmlFor="layer-filter" className="text-xs">
            Filter Layers
          </Label>
          <div
</> className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="layer-filter" placeholder="Search layers..." className="pl-8" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-secondary/50 p-2 rounded-sm"><>

            <h4 className="text-xs font-medium mb-1">Base Maps</h4>
            <div
</> className="space-y-1">
              <label className="text-xs flex items-center"><>

                <input
                  type="radio"
                  name="basemap"
                  className="mr-2 h-3 w-3"
                  checked={true}
                  onChange={() => {}}
                />
                Streets
              </label>

              <label
</> className="text-xs flex items-center"><>

                <input
                  type="radio"
                  name="basemap"
                  className="mr-2 h-3 w-3"
                  checked={false}
                  onChange={() => {}}
                />
                Satellite
              </label>

              <label
</> className="text-xs flex items-center">
                <input
                  type="radio"
                  name="basemap"
                  className="mr-2 h-3 w-3"
                  checked={false}
                  onChange={() => {}}
                />
                Topographic
              </label>
            </div>
          </div><>


          <div className="pb-1 text-sm font-medium">Data Layers</div>
          <div
</> className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            <div className="bg-card rounded-sm p-2 border border-input">
              <div className="flex items-center justify-between">
                <label className="text-xs flex items-center"><>

                  <input
                    type="checkbox"
                    className="mr-2 h-3 w-3"
                    checked={true}
                    onChange={() => {}}
                  />
                  Parcels
                </label>
                <Button
</> variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <SlidersHorizontal className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-2"><>

                <div className="text-xs text-muted-foreground mb-1">Opacity</div>
                <Slider
</> defaultValue={[100]} max={100} step={1} className="h-2" />
              </div>
            </div>

            <div className="bg-card rounded-sm p-2 border border-input">
              <div className="flex items-center justify-between">
                <label className="text-xs flex items-center"><>

                  <input
                    type="checkbox"
                    className="mr-2 h-3 w-3"
                    checked={true}
                    onChange={() => {}}
                  />
                  Zoning
                </label>
                <Button
</> variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <SlidersHorizontal className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-2"><>

                <div className="text-xs text-muted-foreground mb-1">Opacity</div>
                <Slider
</> defaultValue={[70]} max={100} step={1} className="h-2" />
              </div>
            </div>

            <div className="bg-card rounded-sm p-2 border border-input">
              <div className="flex items-center justify-between">
                <label className="text-xs flex items-center"><>

                  <input
                    type="checkbox"
                    className="mr-2 h-3 w-3"
                    checked={false}
                    onChange={() => {}}
                  />
                  Flood Zones
                </label>
                <Button
</> variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <SlidersHorizontal className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-2"><>

                <div className="text-xs text-muted-foreground mb-1">Opacity</div>
                <Slider
</> defaultValue={[80]} max={100} step={1} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render search tab
  const renderSearchTab = () => {
    return (
      <div className="space-y-4">
        <form onSubmit={handleAddressSearch}>
          <div className="space-y-1"><>

            <Label htmlFor="address-search" className="text-xs">
              Search Address
            </Label>
            <div
</> className="flex">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><>

                <Input
                  id="address-search"
                  placeholder="Enter address..."
                  className="pl-8"
                  value={addressSearchValue}
                  onChange={e => setAddressSearchValue(e.target.value)}
                />
              </div>
              <Button
</> type="submit" size="sm" className="ml-2">
                Search
              </Button>
            </div>
          </div>
        </form>

        <div className="space-y-2"><>

          <Label className="text-xs">Property Filter</Label>
          <Select
</> defaultValue="all">
            <SelectTrigger><>

              <SelectValue placeholder="Filter Properties" />
            </SelectTrigger>
            <SelectContent
</>><>

              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem
</> value="residential">Residential</SelectItem><>

              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem
</> value="industrial">Industrial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <div><>

              <Label htmlFor="min-value" className="text-xs">
                Min Value
              </Label>
              <Input
</> id="min-value" type="number" placeholder="0" />
            </div>
            <div><>

              <Label htmlFor="max-value" className="text-xs">
                Max Value
              </Label>
              <Input
</> id="max-value" type="number" placeholder="1,000,000" />
            </div>
          </div>

          <div><>

            <Label htmlFor="district" className="text-xs">
              District
            </Label>
            <Select
</> defaultValue="">
              <SelectTrigger id="district"><>

                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent
</>><>

                <SelectItem value="">All Districts</SelectItem>
                <SelectItem
</> value="north">North District</SelectItem><>

                <SelectItem value="south">South District</SelectItem>
                <SelectItem
</> value="east">East District</SelectItem>
                <SelectItem value="west">West District</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full mt-2" size="sm">
            Apply Filters
          </Button>
        </div>
      </div>
    );
  };

  // Render tools tab
  const renderToolsTab = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2"><>

          <h3 className="text-sm font-medium">Map Controls</h3>

          <div
</> className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex justify-start items-center"
              onClick={() => {
                setCenter([-119.7, 46.2]);
                setZoom(10);
              }}
            >
              <Compass className="h-4 w-4 mr-2" />
              <span className="text-xs">Reset View</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex justify-start items-center"
              onClick={() => setIs3DEnabled(!is3DEnabled)}
            >
              <Map className="h-4 w-4 mr-2" />
              <span className="text-xs">Toggle 3D</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex justify-start items-center"
              onClick={handleCreateSnapshot}
            >
              <Camera className="h-4 w-4 mr-2" />
              <span className="text-xs">Snapshot</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex justify-start items-center"
              onClick={() => {}}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2"><>

          <h3 className="text-sm font-medium">Export</h3>

          <div
</> className="flex space-x-2">
            <Select defaultValue="png" onValueChange={value => setExportFormat(value)}>
              <SelectTrigger className="w-[110px]"><>

                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent
</>><>

                <SelectItem value="png">PNG Image</SelectItem>
                <SelectItem
</> value="jpg">JPG Image</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={handleExport}
              disabled={isExporting}
            >
              <FileDown className="h-4 w-4 mr-2" />
              <span className="text-xs">{isExporting ? 'Exporting...' : 'Export Map'}</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Data Operations</h3>

          {/* Geospatial Export Wizard */}
          <GeospatialExportWizard />

          {/* Geospatial Storytelling Wizard */}
          <GeospatialStorytellingWizard />

          <div className="flex items-center space-x-2 mt-3"><>

            <Label htmlFor="ai-analysis" className="text-xs flex-1">
              AI-Enhanced Analysis
            </Label>
            <Switch
</> id="ai-analysis" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3"><>

        <CardTitle className="text-base">GIS Controls</CardTitle>
        <CardDescription
</>>Manage map layers and tools</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="layers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full px-6">
            <TabsTrigger value="layers" className="flex-1"><>

              <Map className="h-4 w-4 mr-2" />
              Layers
            </TabsTrigger>
            <TabsTrigger
</> value="search" className="flex-1"><>

              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger
</> value="tools" className="flex-1">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>
          <div className="px-6 py-4"><>

            <TabsContent value="layers" className="m-0">
              {renderLayersTab()}
            </TabsContent>
            <TabsContent
</> value="search" className="m-0">
              {renderSearchTab()}
            </TabsContent>
            <TabsContent value="tools" className="m-0">
              {renderToolsTab()}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GISControlPanel;
