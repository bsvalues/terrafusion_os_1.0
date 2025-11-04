import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { Feature } from 'ol';
import 'ol/ol.css';
import PieClusterLayer from '@/components/gis/PieClusterLayer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Refresh, Info, Settings  } from '@mui/icons-material';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, ChartData } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend);

// Define types
type BaseMapType = 'osm' | 'satellite' | 'topo';
type ClusterStyleAttribute = 'type' | 'status' | 'value';

interface DataPoint {
  id: string;
  position: [number, number]; // [longitude, latitude]
  properties: {
    [key: string]: any;
  };
}

// Color schemes for different property attributes
const COLOR_SCHEMES = {
  type: {
    residential: '#4285F4',
    commercial: '#34A853',
    industrial: '#FBBC05',
    agricultural: '#EA4335',
    vacant: '#673AB7',
    'mixed-use': '#3F51B5',
  },
  status: {
    active: '#4CAF50',
    pending: '#FFC107',
    sold: '#F44336',
    foreclosure: '#9C27B0',
    'off-market': '#607D8B',
  },
  value: {
    low: '#81C784',
    medium: '#FFB74D',
    high: '#E57373',
    'very-high': '#BA68C8',
  },
};

// Default colors for uncategorized items
const DEFAULT_COLORS = [
  '#4285F4',
  '#34A853',
  '#FBBC05',
  '#EA4335',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#009688',
  '#FF5722',
  '#795548',
  '#9E9E9E',
];

/**
 * Advanced Clustering Demo Page
 *
 * This page showcases the enhanced pie chart clustering capabilities:
 * - Visualizes property distribution within clusters
 * - Provides detailed analysis of cluster contents
 * - Offers customization of clustering parameters and visualization options
 */
export default function AdvancedClusteringDemoPage() {
  // Map references
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<Map | null>(null);

  // State for data fetching
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for controls
  const [baseMapType, setBaseMapType] = useState<BaseMapType>('osm');
  const [clusterDistance, setClusterDistance] = useState<number>(50);
  const [minDistance, setMinDistance] = useState<number>(25);
  const [animationEnabled, setAnimationEnabled] = useState<boolean>(true);
  const [showPieCharts, setShowPieCharts] = useState<boolean>(true);
  const [pieChartAttribute, setPieChartAttribute] = useState<ClusterStyleAttribute>('type');
  const [layoutTab, setLayoutTab] = useState<'map' | 'split'>('split');
  const [selectedCluster, setSelectedCluster] = useState<Feature[] | null>(null);
  const [clusterMetadata, setClusterMetadata] = useState<any>(null);
  const [hoverCoordinate, setHoverCoordinate] = useState<number[] | null>(null);
  const [hoverMetadata, setHoverMetadata] = useState<any>(null);

  // Get clustering data
  const {
    data: clusterData,
    isLoading,
    refetch,
  } = useQuery<DataPoint[]>({
    queryKey: ['/api/gis/clustering-demo/data'],
    staleTime: 60000,
  });

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Initialize OpenLayers map
  useEffect(() => {
    if (!mapRef.current || olMapRef.current) return;

    // Create base map layer
    const baseLayer = getBaseMapLayer(baseMapType);

    // Create map instance
    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer],
      view: new View({
        center: fromLonLat([-119.7, 46.2]), // Benton County, WA
        zoom: 10,
        maxZoom: 19,
      }),
      controls: defaultControls({
        zoom: true,
        rotate: false,
        attribution: false,
      }),
    });

    // Store map reference
    olMapRef.current = map;

    // Cleanup function
    return () => {
      if (olMapRef.current) {
        olMapRef.current.setTarget(undefined);
        olMapRef.current = null;
      }
    };
  }, []);

  // Update base map when type changes
  useEffect(() => {
    if (!olMapRef.current) return;

    const map = olMapRef.current;
    const layers = map.getLayers();

    // Remove old base layer
    if (layers.getLength() > 0) {
      layers.removeAt(0);
    }

    // Add new base layer
    const baseLayer = getBaseMapLayer(baseMapType);
    map.getLayers().insertAt(0, baseLayer);
  }, [baseMapType]);

  // Get base map layer based on type
  const getBaseMapLayer = (type: BaseMapType) => {
    switch (type) {
      case 'satellite':
        return new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19,
          }),
        });
      case 'topo':
        return new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19,
          }),
        });
      case 'osm':
      default:
        return new TileLayer({
          source: new OSM(),
        });
    }
  };

  // Handle cluster click
  const handleClusterClick = (features: Feature[], coordinate: number[], metadata: any) => {
    setSelectedCluster(features);
    setClusterMetadata(metadata);
  };

  // Handle cluster hover
  const handleClusterHover = (
    features: Feature[] | null,
    coordinate: number[] | null,
    metadata: any
  ) => {
    setHoverCoordinate(coordinate);
    setHoverMetadata(metadata);
  };

  // Generate chart data for the selected cluster
  const generateClusterChartData = () => {
    if (!selectedCluster || !clusterMetadata) return null;

    const { categoryCount } = clusterMetadata;
    if (!categoryCount) return null;

    const labels = Object.keys(categoryCount);
    const data = Object.values(categoryCount);

    // Get colors for categories
    const colors = labels.map(label => {
      // Find the right color scheme based on the attribute
      const colorScheme = COLOR_SCHEMES[pieChartAttribute];
      // Use the specific color if it exists, otherwise use a default color
      return (
        (colorScheme && colorScheme[label as keyof typeof colorScheme]) ||
        DEFAULT_COLORS[Math.abs(String(label).hashCode()) % DEFAULT_COLORS.length]
      );
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    };
  };

  // Get chart options
  const chartOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 10,
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <>
      <Helmet>
        <title>Advanced Clustering Demo | Terrafusion</title>
      </Helmet>

      <div className="relative h-screen w-full overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/90 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/gis">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to GIS
              </Link>
            </Button>

            <h1 className="ml-4 text-xl font-bold">Advanced Property Clustering</h1>
          </div>

          <div className="flex items-center space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                  >
                    <Refresh className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fetch the latest property data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center space-x-2"><>

              <Label htmlFor="baseMapType" className="text-sm">
                Base Map:
              </Label>
              <Select
</>
                value={baseMapType}
                onValueChange={(value: BaseMapType) => setBaseMapType(value)}
              >
                <SelectTrigger className="w-28 h-8"><>

                  <SelectValue placeholder="Map Type" />
                </SelectTrigger>
                <SelectContent
</>><>

                  <SelectItem value="osm">Streets</SelectItem>
                  <SelectItem
</> value="satellite">Satellite</SelectItem>
                  <SelectItem value="topo">Terrain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="absolute top-16 bottom-0 left-0 right-0">
          <Tabs value={layoutTab} onValueChange={value => setLayoutTab(value as 'map' | 'split')}>
            <div className="px-4 border-b">
              <TabsList><>

                <TabsTrigger value="map">Map View</TabsTrigger>
                <TabsTrigger
</> value="split">Split View</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="map" className="h-full p-4">
              <div className="h-full">
                <div
                  ref={mapRef}
                  className="w-full h-full rounded-lg border overflow-hidden shadow-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="split" className="h-full p-4">
              <div className="grid grid-cols-3 gap-4 h-full">
                <div className="col-span-2 h-full"><>

                  <div
                    ref={mapRef}
                    className="w-full h-full rounded-lg border overflow-hidden shadow-sm"
                  />
                </div>

                <div
</> className="col-span-1 h-full overflow-y-auto space-y-4">
                  {/* Cluster Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between"><>

                        <CardTitle>Cluster Settings</CardTitle>
                        <Settings
</> className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardDescription>
                        Customize how properties are grouped and visualized
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="clusterDistance">
                              Cluster Distance: {clusterDistance}px
                            </Label>
                          </div>
                          <Slider
                            id="clusterDistance"
                            min={10}
                            max={150}
                            step={5}
                            value={[clusterDistance]}
                            onValueChange={value => setClusterDistance(value[0])}
                          />
                          <p className="text-xs text-muted-foreground">
                            Distance in pixels within which points will cluster together
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="minDistance">Min Distance: {minDistance}px</Label>
                          </div>
                          <Slider
                            id="minDistance"
                            min={0}
                            max={100}
                            step={5}
                            value={[minDistance]}
                            onValueChange={value => setMinDistance(value[0])}
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum spacing between clusters
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between"><>

                            <Label htmlFor="showPieCharts">Show Pie Charts</Label>
                            <Switch
</>
                              id="showPieCharts"
                              checked={showPieCharts}
                              onCheckedChange={setShowPieCharts}
                            />
                          </div>

                          <div className="flex items-center justify-between"><>

                            <Label htmlFor="animationEnabled">Enable Animation</Label>
                            <Switch
</>
                              id="animationEnabled"
                              checked={animationEnabled}
                              onCheckedChange={setAnimationEnabled}
                            />
                          </div>

                          <div className="space-y-2"><>

                            <Label>Categorize By:</Label>
                            <Select
</>
                              value={pieChartAttribute}
                              onValueChange={(value: ClusterStyleAttribute) =>
                                setPieChartAttribute(value)
                              }
                              disabled={!showPieCharts}
                            >
                              <SelectTrigger><>

                                <SelectValue placeholder="Select attribute" />
                              </SelectTrigger>
                              <SelectContent
</>><>

                                <SelectItem value="type">Property Type</SelectItem>
                                <SelectItem
</> value="status">Property Status</SelectItem>
                                <SelectItem value="value">Property Value</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selected Cluster Analysis */}
                  {selectedCluster && selectedCluster.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between"><>

                          <CardTitle>Cluster Analysis</CardTitle>
                          <Info
</> className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <CardDescription>
                          {selectedCluster.length} properties in this cluster
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Distribution Chart */}
                        {clusterMetadata && (
                          <div className="h-60"><>

                            <h3 className="text-sm font-medium mb-2">
                              Distribution by{' '}
                              {pieChartAttribute === 'type'
                                ? 'Property Type'
                                : pieChartAttribute === 'status'
                                  ? 'Property Status'
                                  : 'Property Value'}
                            </h3>
                            <div
</> className="h-48">
                              {generateClusterChartData() && (
                                <Doughnut
                                  data={generateClusterChartData() as any}
                                  options={chartOptions}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Properties List */}
                        <div><>

                          <h3 className="text-sm font-medium mb-2">Properties</h3>
                          <div
</> className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedCluster.slice(0, 10).map((feature /* , index */) => {
                              const props = feature.get('properties') || {};
                              return (
                                <div key={index} className="p-2 bg-muted rounded-md text-sm"><>

                                  <div className="font-medium">
                                    {props.address || `Property ${index + 1}`}
                                  </div>
                                  <div
</> className="text-xs text-muted-foreground">
                                    {props.type || 'Unknown type'} -{' '}
                                    {props.status || 'Unknown status'}
                                  </div>
                                  <div className="text-xs">Value: {props.value || 'N/A'}</div>
                                </div>
                              );
                            })}
                            {selectedCluster.length > 10 && (
                              <div className="text-xs text-center text-muted-foreground pt-2">
                                + {selectedCluster.length - 10} more properties
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Hover Information */}
                  {hoverCoordinate && hoverMetadata && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Hover Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs space-y-1">
                          {hoverMetadata.totalItems && (
                            <div>
                              Contains{' '}
                              <span className="font-medium">{hoverMetadata.totalItems}</span>{' '}
                              properties
                            </div>
                          )}
                          {hoverMetadata.dominantCategory && (
                            <div>
                              Primarily{' '}
                              <span className="font-medium">{hoverMetadata.dominantCategory}</span>{' '}
                              properties
                            </div>
                          )}
                          {hoverMetadata.categoryCount &&
                            Object.entries(hoverMetadata.categoryCount).length > 0 && (
                              <div className="pt-1"><>

                                <span className="font-medium">Breakdown:</span>
                                <ul
</> className="pl-2 pt-1">
                                  {Object.entries(hoverMetadata.categoryCount || {}).map(
                                    ([category, count]) => (
                                      <li key={category}>
                                        {category}: {String(count)}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add clustering layer if map is initialized and data is loaded */}
        {olMapRef.current && clusterData && Array.isArray(clusterData) && (
          <PieClusterLayer
            map={olMapRef.current}
            data={clusterData}
            distance={clusterDistance}
            minDistance={minDistance}
            animationEnabled={animationEnabled}
            clusterStyleOptions={{
              showPieCharts: showPieCharts,
              pieChartAttribute: pieChartAttribute,
              colorScheme: {
                ...COLOR_SCHEMES.type,
                ...COLOR_SCHEMES.status,
                ...COLOR_SCHEMES.value,
              },
              defaultColors: DEFAULT_COLORS,
            }}
            onClusterClick={handleClusterClick}
            onClusterHover={handleClusterHover}
          />
        )}
      </div>
    </>
  );
}
