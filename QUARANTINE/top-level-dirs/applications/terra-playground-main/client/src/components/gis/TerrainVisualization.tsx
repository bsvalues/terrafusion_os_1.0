import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';
import 'ol-ext/dist/ol-ext.css';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers,
  Mountain,
  CircleOff,
  Droplets,
  ChevronDown,
  Eye,
  Compass,
  Box,
 } from '@mui/icons-material';
import { useGIS } from '@/contexts/gis-context';
import { cn } from '@/lib/utils';
import '@/styles/terrain-visualization.css';

// Import from our custom fallback utilities instead of direct ol-ext import
import { olExtFallbacks } from '@/modules/gis/utils/ol-ext-utils';

// Define placeholders for ol-ext components
let Elevation: any = null;
let ElevationFilter: any = null;
let Contour: any = null;

// Use the fallback implementations
Elevation = olExtFallbacks.createElevationControl;
ElevationFilter = olExtFallbacks.createElevationFilter;
Contour = olExtFallbacks.createContourSource;

interface TerrainVisualizationProps {
  className?: string;
  map?: Map;
  initialCenter?: [number, number];
  initialZoom?: number;
  showControls?: boolean;
}

type ElevationMode = 'gradient' | 'hillshade' | 'contour' | 'none';
type TerrainSource = 'usgs' | 'mapzen' | 'terrain-rgb';

/**
 * Advanced Terrain Visualization Component
 *
 * This component provides enhanced terrain visualization using various techniques:
 * - Elevation data with color gradients
 * - Hillshading for relief visualization
 * - Contour lines for elevation representation
 * - 3D-like terrain effects using shading techniques
 */
const TerrainVisualization = ({
  className,
  map: existingMap,
  initialCenter = [-119.7, 46.2], // Benton County, WA
  initialZoom = 10,
  showControls = true,
}: TerrainVisualizationProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const terrainMapRef = useRef<Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elevationMode, setElevationMode] = useState<ElevationMode>('hillshade');
  const [terrainSource, setTerrainSource] = useState<TerrainSource>('terrain-rgb');
  const [showElevationProfile, setShowElevationProfile] = useState(false);
  const [elevationProfile, setElevationProfile] = useState<any>(null);
  const [elevationFilter, setElevationFilter] = useState<any>(null);
  const [terrain3DEffect, setTerrain3DEffect] = useState(true);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  const { center, zoom, setCenter, setZoom } = useGIS();

  // Function to get terrain tile layer based on source
  const getTerrainLayer = (source: TerrainSource) => {
    switch (source) {
      case 'usgs':
        return new TileLayer({
          source: new XYZ({
            url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 16,
            attributions:
              'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
          }),
          className: 'terrain-layer',
        });
      case 'mapzen':
        return new TileLayer({
          source: new XYZ({
            url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
            maxZoom: 15,
            attributions:
              'Elevation data from <a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles</a>',
          }),
          className: 'terrain-layer',
        });
      case 'terrain-rgb':
      default:
        // Get Mapbox token from environment
        // Client-side environment variables must be prefixed with VITE_
        const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!mapboxToken) {
          console.warn('Mapbox token not found. Using default terrain source.');
          // Fallback to USGS if no token available
          return new TileLayer({
            source: new XYZ({
              url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
              maxZoom: 16,
              attributions:
                'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
            }),
            className: 'terrain-layer',
          });
        }
        return new TileLayer({
          source: new XYZ({
            url: `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=${mapboxToken}`,
            maxZoom: 15,
            attributions: 'Elevation data © <a href="https://www.mapbox.com/">Mapbox</a>',
          }),
          className: 'terrain-layer',
        });
    }
  };

  // Initialize terrain visualization
  useEffect(() => {
    if (existingMap) {
      // If map is provided, use it and add terrain layers
      terrainMapRef.current = existingMap;
      initializeTerrainLayers();
      setIsLoading(false);
      return;
    }

    if (!mapRef.current || terrainMapRef.current) return;

    // Create new map if none provided
    const map = new Map({
      target: mapRef.current,
      layers: [getTerrainLayer(terrainSource)],
      view: new View({
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
        maxZoom: 19,
      }),
      controls: defaultControls({
        zoom: showControls,
        rotate: showControls,
        attribution: true,
      }),
    });

    terrainMapRef.current = map;
    initializeTerrainLayers();

    // Handle map events
    map.on('moveend', () => {
      const view = map.getView();
      const center = view.getCenter();
      if (center) {
        setCenter(toLonLat(center) as [number, number]);
      }
      setZoom(view.getZoom() || initialZoom);
    });

    setIsLoading(false);

    return () => {
      if (terrainMapRef.current && !existingMap) {
        terrainMapRef.current.setTarget(undefined);
        terrainMapRef.current = null;
      }
    };
  }, [existingMap, terrainSource]);

  // Initialize terrain-specific layers and controls
  const initializeTerrainLayers = () => {
    if (!terrainMapRef.current || !Elevation) return;

    // Remove any existing terrain controls
    if (elevationProfile) {
      terrainMapRef.current.removeControl(elevationProfile);
    }

    // Add elevation profile if enabled
    if (showElevationProfile && profileContainerRef.current && Elevation) {
      try {
        const profile = new Elevation({
          target: profileContainerRef.current,
          style: {
            fillColor: 'rgba(0,128,255,0.2)',
            strokeColor: 'rgba(0,128,255,0.8)',
            lineWidth: 2,
          },
        });

        terrainMapRef.current.addControl(profile);
        setElevationProfile(profile);
      } catch (e) {
        console.error('Failed to initialize elevation profile:', e);
      }
    }

    // Apply elevation visualization based on selected mode
    applyElevationMode(elevationMode);
  };

  // Apply the selected elevation visualization mode
  const applyElevationMode = (mode: ElevationMode) => {
    if (!terrainMapRef.current) return;

    // Handle ol-ext filters if available
    if (ElevationFilter && terrainMapRef.current) {
      // Remove existing filter if any
      if (elevationFilter && terrainMapRef.current.getLayers().getArray()[0]) {
        try {
          // Use type assertion to handle the ol-ext specific methods
          const terrainLayer = terrainMapRef.current.getLayers().getArray()[0] as any;
          if (terrainLayer && typeof terrainLayer.removeFilter === 'function') {
            terrainLayer.removeFilter(elevationFilter);
          }
          setElevationFilter(null);
        } catch (e) {
          console.error('Error removing filter:', e);
        }
      }

      try {
        // Apply new filter based on mode
        if (mode !== 'none') {
          // Use type assertion to access ol-ext specific methods
          const terrainLayer = terrainMapRef.current.getLayers().getArray()[0] as any;

          let filter;
          switch (mode) {
            case 'gradient':
              filter = new ElevationFilter({
                colorScheme: [
                  { color: '#d8f2fa', level: 0 }, // Water level
                  { color: '#c8e6d0', level: 50 }, // Low elevation
                  { color: '#a4d8a5', level: 100 }, // Low hills
                  { color: '#73c378', level: 200 }, // Hills
                  { color: '#48ae5c', level: 350 }, // Mountains
                  { color: '#328a44', level: 500 }, // High mountains
                  { color: '#2a623a', level: 650 }, // Very high mountains
                  { color: '#eae5d9', level: 800 }, // Snow
                ],
              });
              break;

            case 'hillshade':
              filter = new ElevationFilter({
                hillshading: true,
                shading: 0.5,
              });
              break;

            case 'contour':
              // Contour lines implementation goes here, using Contour from ol-ext if available
              filter = new ElevationFilter({
                contours: true,
                contourWidth: 0.5,
                contourSteps: [100, 500],
                contourColors: ['rgba(100, 100, 100, 0.5)', 'rgba(100, 100, 100, 1)'],
              });
              break;
          }

          if (filter && terrainLayer && typeof terrainLayer.addFilter === 'function') {
            terrainLayer.addFilter(filter);
            setElevationFilter(filter);
          }
        }
      } catch (e) {
        console.error('Failed to apply elevation mode:', e);
      }
    }
  };

  // Handle elevation mode change
  useEffect(() => {
    applyElevationMode(elevationMode);
  }, [elevationMode]);

  // Handle elevation profile toggle
  useEffect(() => {
    initializeTerrainLayers();
  }, [showElevationProfile]);

  // Handle 3D effect toggle
  useEffect(() => {
    if (!terrainMapRef.current) return;

    const terrainContainer = terrainMapRef.current.getTargetElement();
    if (terrainContainer) {
      if (terrain3DEffect) {
        terrainContainer.classList.add('terrain-3d-effect');
      } else {
        terrainContainer.classList.remove('terrain-3d-effect');
      }
    }
  }, [terrain3DEffect]);

  // Handle terrain source change
  useEffect(() => {
    if (!terrainMapRef.current) return;

    const currentView = terrainMapRef.current.getView();
    const currentCenter = currentView.getCenter();
    const currentZoom = currentView.getZoom();

    // Replace terrain layer
    const layers = terrainMapRef.current.getLayers();
    if (layers.getLength() > 0) {
      layers.removeAt(0);
    }

    layers.insertAt(0, getTerrainLayer(terrainSource));

    // Restore view
    if (currentCenter && currentZoom) {
      currentView.setCenter(currentCenter);
      currentView.setZoom(currentZoom);
    }

    // Re-apply elevation mode
    applyElevationMode(elevationMode);
  }, [terrainSource]);

  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* Map Container */}
      {existingMap ? null : (
        <div
          ref={mapRef}
          className={cn(
            'w-full h-full terrain-visualization-container',
            terrain3DEffect && 'terrain-3d-effect'
          )}
        />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
          <div className="text-center">
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            <p className="mt-4 font-medium">Loading terrain data...</p>
          </div>
        </div>
      )}

      {/* Terrain Controls */}
      <div className="absolute top-4 right-4 z-10 bg-background/90 p-3 rounded-lg shadow-md border border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <Mountain className="h-4 w-4 mr-1 text-primary" />
            Terrain Controls
          </h3>

          {/* 3D effect toggle */}
          <div className="flex items-center">
            <Badge
              variant={terrain3DEffect ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTerrain3DEffect(!terrain3DEffect)}
            >
              <ThreeDIcon className="h-3 w-3 mr-1" /> 3D Effect
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="visualization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
<>
            <TabsTrigger value="visualization" className="text-xs">
              Visualization
            </TabsTrigger>
            <TabsTrigger
</> value="source" className="text-xs">
              Data Source
            </TabsTrigger>
          </TabsList>

          {/* Visualization Options */}
          <TabsContent value="visualization" className="space-y-2 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={elevationMode === 'gradient' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setElevationMode('gradient')}
              >
<>
                <Droplets className="h-3 w-3 mr-1" /> Gradient
              </Button>

              <Button
</>
                variant={elevationMode === 'hillshade' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setElevationMode('hillshade')}
              >
<>
                <Mountain className="h-3 w-3 mr-1" /> Hillshade
              </Button>

              <Button
</>
                variant={elevationMode === 'contour' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setElevationMode('contour')}
              >
<>
                <Layers className="h-3 w-3 mr-1" /> Contour
              </Button>

              <Button
</>
                variant={elevationMode === 'none' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setElevationMode('none')}
              >
                <CircleOff className="h-3 w-3 mr-1" /> None
              </Button>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-2 flex-grow"
                onClick={() => setShowElevationProfile(!showElevationProfile)}
              >
                <ChevronDown
                  className={cn(
                    'h-3 w-3 mr-1 transition-transform',
                    showElevationProfile && 'rotate-180'
                  )}
                />
                Elevation Profile
              </Button>
            </div>

            {/* Elevation Profile Container */}
            {showElevationProfile && (
              <div
                ref={profileContainerRef}
                className="terrain-elevation-profile"
                style={{ height: '100px', width: '100%', background: 'rgba(255,255,255,0.8)' }}
              ></div>
            )}
          </TabsContent>

          {/* Data Source Options */}
          <TabsContent value="source" className="space-y-2 mt-2">
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={terrainSource === 'usgs' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 justify-start"
                onClick={() => setTerrainSource('usgs')}
              >
                <Badge variant="outline" className="mr-2 h-5 px-1">
                  USGS
                </Badge>
                National Map
              </Button>

              <Button
                variant={terrainSource === 'mapzen' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 justify-start"
                onClick={() => setTerrainSource('mapzen')}
              >
                <Badge variant="outline" className="mr-2 h-5 px-1">
                  AWS
                </Badge>
                Terrain Tiles
              </Button>

              <Button
                variant={terrainSource === 'terrain-rgb' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 justify-start"
                onClick={() => setTerrainSource('terrain-rgb')}
              >
                <Badge variant="outline" className="mr-2 h-5 px-1">
                  Mapbox
                </Badge>
                Terrain RGB
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              <Eye className="h-3 w-3 inline mr-1" />
              Different sources provide varying levels of detail depending on location
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reset View Button */}
      {showControls && !existingMap && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="shadow-md"
            onClick={() => {
              if (terrainMapRef.current) {
                terrainMapRef.current.getView().animate({
                  center: fromLonLat(initialCenter),
                  zoom: initialZoom,
                  duration: 500,
                });
              }
            }}
          >
            <Compass className="h-4 w-4 mr-1" /> Reset View
          </Button>
        </div>
      )}

      {/* Data Attribution */}
      <div className="absolute bottom-2 left-2 z-10 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
        Terrain data:{' '}
        {terrainSource === 'usgs'
          ? 'USGS'
          : terrainSource === 'mapzen'
            ? 'AWS Terrain Tiles'
            : 'Mapbox'}
      </div>
    </div>
  );
};

// Custom 3D icon component
const ThreeDIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 7v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4" />
    <path d="M13 17h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
    <path d="M13 7v4a2 2 0 0 0 2 2h4" />
    <path d="M3 11h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H3Z" />
  </svg>
);

export default TerrainVisualization;
