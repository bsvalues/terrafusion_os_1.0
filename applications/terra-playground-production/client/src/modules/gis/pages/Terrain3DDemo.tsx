import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info, MapPin, Mountain, Box, Layers, Eye  } from '@mui/icons-material';
import { useEffect, useRef } from 'react';
import { useGIS } from '../contexts/GISContext';

// Import terrain visualization styles
import '@/styles/terrain-visualization.css';

/**
 * Simplified 3D Terrain Visualization Demo Page
 */
export default function Terrain3DDemo() {
  const [tab, setTab] = useState('overview');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  // Center on Benton County, WA
  const initialCenter = [-119.7, 46.2];
  const initialZoom = 10;

  // Get GIS context
  const { mapboxToken, mapboxTokenAvailable, useOpenStreetMapFallback, setMapLoaded, addMapError } =
    useGIS();

  // Status states for UI feedback
  const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState<string>(
    'Initializing terrain visualization...'
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Debug: Log token info from context
    try {
      setMapStatus('loading');
      setStatusMessage('Loading terrain map tiles...');

      // Default to OpenStreetMap which doesn't require a token
      const tileSource = new XYZ({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxZoom: 19,
        attributions: '© OpenStreetMap contributors',
      });

      // Try to use Mapbox if token is available and we're not in fallback mode
      if (mapboxToken && !useOpenStreetMapFallback) {
        setStatusMessage('Loading Mapbox terrain data...');
        tileSource.setUrl(
          `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
        );
        tileSource.setAttributions('© Mapbox, © OpenStreetMap');
      } else {
      }

      const mapLayer = new TileLayer({
        source: tileSource,
      });

      const map = new Map({
        target: mapRef.current,
        layers: [mapLayer],
        view: new View({
          center: fromLonLat(initialCenter),
          zoom: initialZoom,
        }),
      });

      // Set up event listeners for map
      map.once('rendercomplete', () => {
        setMapStatus('loaded');
        setStatusMessage('Terrain visualization loaded successfully');
        setMapLoaded(true);
      });

      map.getView().on('change:resolution', () => {
        // Update zoom level when it changes
        const newZoom = Math.round(map.getView().getZoom() || initialZoom);
      });

      mapInstanceRef.current = map;

      // Add 3D effect to map container
      const mapContainer = mapRef.current;
      mapContainer.classList.add('terrain-3d-effect');

      // Force a map resize to ensure proper rendering
      setTimeout(() => {
        if (map) {
          map.updateSize();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapStatus('error');
      setStatusMessage('Failed to initialize terrain map');
      addMapError(
        `Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [mapboxToken, mapboxTokenAvailable, useOpenStreetMapFallback, setMapLoaded, addMapError]); // Add dependencies to re-run if token changes

  return (
    <>
      <Helmet>
        <title>3D Terrain Visualization | Terrafusion</title>
      </Helmet>

      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-background/90 backdrop-blur-sm border-b border-border sticky top-0 z-10 p-4">
          <div className="flex items-center justify-between container mx-auto">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/gis">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to GIS Hub
                </Link>
              </Button>

              <h1 className="text-xl font-bold ml-4 flex items-center">
                <Box className="h-5 w-5 mr-2 text-primary" />
                3D Terrain Visualization
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-primary/10"><>

                <Mountain className="h-3 w-3 mr-1" />
                3D Visualization
              </Badge>

              <Badge
</> variant="outline" className="bg-primary/10">
                <MapPin className="h-3 w-3 mr-1" />
                Benton County
              </Badge>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left sidebar with tabs */}
          <div className="w-full md:w-64 lg:w-80 p-4 border-r border-border overflow-y-auto">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3"><>

                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger
</> value="features">Features</TabsTrigger>
                <TabsTrigger value="help">Help</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="prose prose-sm dark:prose-invert"><>

                  <h3 className="text-lg font-semibold">3D Terrain Visualization</h3>

                  <p
</>>
                    Explore property data with advanced 3D terrain visualization. This demo
                    showcases our enhanced terrain rendering capabilities with true 3D effects.
                  </p><>


                  <h4 className="text-md font-semibold mt-4">Key Features</h4>

                  <ul
</> className="list-disc pl-5 space-y-1"><>

                    <li>True 3D terrain rendering with customizable elevation scale</li>
                            <li
</>>Dynamic lighting with time-of-day presets</li><>

                    <li>Property extrusion based on value or characteristics</li>
                            <li
</>>Viewshed analysis for visibility studies</li>
                  </ul>

                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md mt-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Note: This is a simplified demo. Full terrain analysis features will be
                      available in the final release.
                    </p>
                  </div>
                </div>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Getting Started</CardTitle>
                  </CardHeader>

                  <CardContent className="py-2">
                    <div className="text-sm space-y-2"><>

                      <p>Explore the terrain by:</p>

                      <ul
</> className="list-disc pl-5 space-y-1 text-xs"><>

                        <li>Panning: Click and drag the map</li>
                            <li
</>>Zooming: Use mouse wheel or pinch gesture</li>
                        <li>Exploring: Click on features for more information</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        <Mountain className="h-4 w-4 mr-2 text-primary" />
                        3D Terrain Rendering
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="py-2">
                      <div className="text-sm space-y-2"><>

                        <p>
                          Our 3D terrain visualization uses high-resolution elevation data with
                          advanced rendering techniques to create a realistic 3D effect.
                        </p>

                        <p
</> className="text-xs text-muted-foreground">
                          The full version includes adjustable elevation scale to enhance or reduce
                          the terrain exaggeration.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-primary" />
                        Viewshed Analysis
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="py-2">
                      <div className="text-sm space-y-2"><>

                        <p>
                          Viewshed analysis calculates what's visible from a specific point, taking
                          into account terrain height and obstructions.
                        </p>

                        <p
</> className="text-xs text-muted-foreground">
                          In the full version, you can perform viewshed analysis by setting
                          observation points on the terrain.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        <Layers className="h-4 w-4 mr-2 text-primary" />
                        Data Integration
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="py-2">
                      <div className="text-sm space-y-2"><>

                        <p>
                          Combine property data with terrain visualization to gain insights into
                          property values relative to topography.
                        </p>

                        <p
</> className="text-xs text-muted-foreground">
                          The full version offers comprehensive data analysis tools for examining
                          properties in relation to terrain features.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="help" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center"><>

                      <Info className="h-4 w-4 mr-2 text-primary" />
                      Help & Tips
                    </CardTitle>

                    <CardDescription
</> className="text-xs">
                      Advice for getting the most from 3D terrain visualization
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="py-2">
                    <div className="text-sm space-y-3">
                      <div><>

                        <h4 className="font-medium text-sm">Navigation</h4>

                        <ul
</> className="list-disc pl-5 space-y-1 text-xs mt-1"><>

                          <li>Pan: Click and drag the map</li>
                            <li
</>>Zoom: Use mouse wheel or pinch gesture</li>
                          <li>Reset view: Double-click the map</li>
                        </ul>
                      </div>

                      <div><>

                        <h4 className="font-medium text-sm">About Terrain Data</h4>

                        <p
</> className="text-xs mt-1">
                          This demo uses map tiles from Mapbox or OpenStreetMap. The full
                          application includes true 3D terrain data from multiple high-resolution
                          sources.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main map visualization */}
          <div className="flex-1 relative">
            {/* OpenLayers map container */}
            <div
              ref={mapRef}
              className={`w-full h-full ${mapStatus === 'loaded' ? 'terrain-3d-effect' : ''}`}
              style={{
                position: 'relative',
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                boxShadow:
                  '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                minHeight: '400px',
                backgroundColor: mapStatus === 'error' ? '#FEF2F2' : '#f0f0f0',
                border: `1px solid ${mapStatus === 'error' ? '#FCA5A5' : '#ccc'}`,
              }}
            />

            {/* Loading/Error overlay */}
            {mapStatus !== 'loaded' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                {mapStatus === 'loading' ? (
                  <><>

                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p
</> className="text-center text-muted-foreground">{statusMessage}</p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      {useOpenStreetMapFallback
                        ? 'Using OpenStreetMap'
                        : 'Using Mapbox terrain data'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div><>

                    <p className="text-center text-red-600 font-medium">
                      Failed to load terrain visualization
                    </p>
                    <p
</> className="text-center text-sm mt-2 text-muted-foreground">
                      {statusMessage}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => window.location.reload()}
                    >
                      Reload page
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Map data source info */}
            {mapStatus === 'loaded' && (
              <div className="absolute top-4 right-4 bg-background/90 p-2 rounded-md shadow-sm border border-border">
                <p className="text-xs text-muted-foreground">
                  Data source: {useOpenStreetMapFallback ? 'OpenStreetMap' : 'Mapbox'}
                </p>
              </div>
            )}

            {/* Note about simplified version */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 p-3 rounded-lg shadow-md border border-border max-w-sm">
              <p className="text-sm text-center">
                <span className="font-semibold">Note:</span> This is a simplified demo. Advanced 3D
                terrain capabilities will be available in the final release.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
