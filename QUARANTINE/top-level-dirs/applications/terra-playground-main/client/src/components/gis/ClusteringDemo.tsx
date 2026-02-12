import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import AnimatedClusterLayer from './AnimatedClusterLayer';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { Feature } from 'ol';
import 'ol/ol.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define types for base map and data point
type BaseMapType = 'osm' | 'satellite' | 'topo';

interface DataPoint {
  id: string;
  position: [number, number]; // [longitude, latitude]
  properties: {
    [key: string]: any;
  };
}

interface ClusteringDemoProps {
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

/**
 * Clustering Demonstration Component
 *
 * This component showcases animated clustering for property data:
 * - Demonstrates how clustering groups nearby properties
 * - Shows animation effects when zooming or panning
 * - Allows customization of clustering parameters
 * - Displays different types of property data
 */
const ClusteringDemo = ({
  className,
  initialCenter = [-119.7, 46.2], // Benton County, WA
  initialZoom = 10,
}: ClusteringDemoProps) => {
  // Map reference
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<Map | null>(null);

  // State for controls
  const [baseMapType, setBaseMapType] = useState<BaseMapType>('osm');
  const [clusterDistance, setClusterDistance] = useState<number>(40);
  const [minDistance, setMinDistance] = useState<number>(20);
  const [animationEnabled, setAnimationEnabled] = useState<boolean>(true);
  const [layoutTab, setLayoutTab] = useState<'map' | 'split'>('map');
  const [selectedCluster, setSelectedCluster] = useState<DataPoint[] | null>(null);

  // Fetch property data for clustering
  const { data: clusterData, isLoading } = useQuery<DataPoint[]>({
    queryKey: ['/api/gis/clustering-demo/data'],
    staleTime: 60000,
  });

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
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
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

  // Generate random coordinates for testing
  function generateRandomNearbyCoordinate(center: [number, number]): [number, number] {
    const randomOffset = () => (Math.random() - 0.5) * 0.4; // ~20km radius
    return [center[0] + randomOffset(), center[1] + randomOffset()];
  }

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
  const handleClusterClick = (features: Feature[], coordinate: number[]) => {
    // Convert features to data points
    const dataPoints = features.map(feature => {
      const id =
        (feature.getId() as string) || `property-${Math.random().toString(36).substr(2, 9)}`;
      const properties = feature.getProperties();
      return {
        id,
        position: properties.originalCoordinates || [0, 0],
        properties: properties.properties || {},
      };
    });

    setSelectedCluster(dataPoints);
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      <div className="flex-none p-4 bg-background border-b">
        <Tabs value={layoutTab} onValueChange={value => setLayoutTab(value as 'map' | 'split')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
<>
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger
</> value="split">Split View</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
<>
                <Label htmlFor="baseMapType" className="text-sm">
                  Base Map:
                </Label>
                <Select
</>
                  value={baseMapType}
                  onValueChange={(value: BaseMapType) => setBaseMapType(value)}
                >
                  <SelectTrigger className="w-28 h-8">
<>
                    <SelectValue placeholder="Map Type" />
                  </SelectTrigger>
                  <SelectContent
</>>
<>
                    <SelectItem value="osm">Streets</SelectItem>
                    <SelectItem
</> value="satellite">Satellite</SelectItem>
                    <SelectItem value="topo">Terrain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <TabsContent value="map" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="col-span-1 h-[calc(100vh-12rem)]">
                <div
                  ref={mapRef}
                  className="w-full h-full rounded-lg border overflow-hidden shadow-sm"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="split" className="mt-0">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 h-[calc(100vh-12rem)]">
<>
                <div
                  ref={mapRef}
                  className="w-full h-full rounded-lg border overflow-hidden shadow-sm"
                />
              </div>

              <div
</> className="col-span-1 h-[calc(100vh-12rem)] overflow-y-auto">
                <Card>
                  <CardHeader>
<>
                    <CardTitle>Cluster Settings</CardTitle>
                    <CardDescription
</>>
                      Adjust clustering parameters to see how data points are grouped
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
                          The distance (in pixels) within which points will be clustered together
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
                          The minimum distance between clusters
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="animationEnabled"
                          checked={animationEnabled}
                          onChange={e => setAnimationEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="animationEnabled">Enable Animation</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedCluster && selectedCluster.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
<>
                      <CardTitle>Selected Cluster</CardTitle>
                      <CardDescription
</>>
                        {selectedCluster.length} properties in this cluster
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedCluster.map(point => (
                          <div key={point.id} className="p-2 bg-muted rounded-md text-sm">
<>
                            <div className="font-medium">
                              {point.properties.address || 'Property'}
                            </div>
                            <div
</> className="text-xs text-muted-foreground">
                              {point.properties.type} - {point.properties.status}
                            </div>
                            <div className="text-xs">Value: {point.properties.value || 'N/A'}</div>
                          </div>
                        ))}
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
        <AnimatedClusterLayer
          map={olMapRef.current}
          data={clusterData as DataPoint[]}
          distance={clusterDistance}
          minDistance={minDistance}
          animationEnabled={animationEnabled}
          onClusterClick={handleClusterClick}
        />
      )}
    </div>
  );
};

export default ClusteringDemo;
