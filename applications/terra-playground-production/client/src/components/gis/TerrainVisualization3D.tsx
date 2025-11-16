import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import { defaults as defaultControls } from 'ol/control';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Fill, Stroke, Circle, Icon } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
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
  Sun,
  Moon,
  Sliders,
  Maximize,
  Minimize,
  Plus,
  Minus,
 } from '@mui/icons-material';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGIS } from '@/contexts/gis-context';
import { importOlExt } from '@/utils/ol-ext-utils';
import { cn } from '@/lib/utils';
import '@/styles/terrain-visualization.css';
import '@/styles/terrain-3d.css';

interface TerrainVisualization3DProps {
  className?: string;
  map?: Map;
  initialCenter?: [number, number];
  initialZoom?: number;
  showControls?: boolean;
  renderTarget?: HTMLElement;
}

type ElevationMode = 'gradient' | 'hillshade' | 'contour' | 'none';
type TerrainSource = 'usgs' | 'mapzen' | 'terrain-rgb';
type LightingDirection = 'morning' | 'noon' | 'evening' | 'custom';
type ZScaleLevel = 'low' | 'medium' | 'high' | 'custom';

/**
 * Advanced 3D Terrain Visualization Component
 *
 * Enhanced version of TerrainVisualization with:
 * - True 3D terrain rendering
 * - Dynamic lighting and shadow analysis
 * - Advanced elevation data integration
 * - Property extrusion in 3D space
 * - Interactive viewshed analysis
 */
const TerrainVisualization3D = ({
  className,
  map: existingMap,
  initialCenter = [-119.7, 46.2], // Benton County, WA
  initialZoom = 10,
  showControls = true,
  renderTarget,
}: TerrainVisualization3DProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const terrainMapRef = useRef<Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elevationMode, setElevationMode] = useState<ElevationMode>('hillshade');
  const [terrainSource, setTerrainSource] = useState<TerrainSource>('terrain-rgb');
  const [showElevationProfile, setShowElevationProfile] = useState(false);
  const [elevationProfile, setElevationProfile] = useState<any>(null);
  const [elevationFilter, setElevationFilter] = useState<any>(null);
  const [terrain3DEffect, setTerrain3DEffect] = useState(true);
  const [zScale, setZScale] = useState<ZScaleLevel>('medium');
  const [customZScale, setCustomZScale] = useState<number>(1.5);
  const [lightingDirection, setLightingDirection] = useState<LightingDirection>('noon');
  const [customLightingAngle, setCustomLightingAngle] = useState<number>(315); // NW light
  const [customLightingElevation, setCustomLightingElevation] = useState<number>(45); // 45-degree elevation
  const [showPropertyExtrusion, setShowPropertyExtrusion] = useState(false);
  const [showViewshedAnalysis, setShowViewshedAnalysis] = useState(false);
  const [viewshedPoint, setViewshedPoint] = useState<[number, number] | null>(null);
  const [viewshedDistance, setViewshedDistance] = useState<number>(2000); // meters
  const [viewshedLayer, setViewshedLayer] = useState<VectorLayer<VectorSource> | null>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const propertyExtrusionLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

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
        // Check for Mapbox token
        const mapboxToken = import.meta.env.MAPBOX_TOKEN;
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
      target: renderTarget || mapRef.current,
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

    // Listen for clicks for viewshed analysis
    if (showViewshedAnalysis) {
      map.on('click', evt => {
        const coordinate = toLonLat(evt.coordinate) as [number, number];
        setViewshedPoint(coordinate);
        updateViewshedAnalysis(coordinate);
      });
    }

    setIsLoading(false);

    return () => {
      if (terrainMapRef.current && !existingMap) {
        terrainMapRef.current.setTarget(undefined);
        terrainMapRef.current = null;
      }
    };
  }, [existingMap, terrainSource, showViewshedAnalysis]);

  // Initialize terrain-specific layers and controls
  const initializeTerrainLayers = async () => {
    if (!terrainMapRef.current) return;

    try {
      // Import ol-ext components dynamically
      const elevationModule = await importOlExt('control/Elevation');
      const elevationFilterModule = await importOlExt('filter/Elevation');

      // Add elevation profile if enabled
      if (showElevationProfile && profileContainerRef.current && elevationModule?.default) {
        try {
          // Remove any existing elevation profile
          if (elevationProfile) {
            terrainMapRef.current.removeControl(elevationProfile);
          }

          const profile = new elevationModule.default({
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
      if (elevationFilterModule?.default) {
        applyElevationMode(elevationMode, elevationFilterModule.default);
      }

      // Initialize 3D property extrusion if enabled
      if (showPropertyExtrusion) {
        initializePropertyExtrusion();
      } else if (propertyExtrusionLayerRef.current && terrainMapRef.current) {
        terrainMapRef.current.removeLayer(propertyExtrusionLayerRef.current);
        propertyExtrusionLayerRef.current = null;
      }

      // Initialize viewshed analysis if enabled
      if (showViewshedAnalysis && viewshedPoint) {
        updateViewshedAnalysis(viewshedPoint);
      } else if (viewshedLayer && terrainMapRef.current) {
        terrainMapRef.current.removeLayer(viewshedLayer);
        setViewshedLayer(null);
      }
    } catch (error) {
      console.error('Error initializing terrain layers:', error);
    }
  };

  // Apply the selected elevation visualization mode
  const applyElevationMode = (mode: ElevationMode, ElevationFilter: any) => {
    if (!terrainMapRef.current) return;

    try {
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
              shading: getLightingIntensity(),
              azimuth: getAzimuthAngle(),
            });
            break;

          case 'contour':
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
  };

  // Get lighting intensity based on time of day
  const getLightingIntensity = () => {
    switch (lightingDirection) {
      case 'morning':
        return 0.6;
      case 'noon':
        return 0.4;
      case 'evening':
        return 0.7;
      case 'custom':
        return 0.5 + (customLightingElevation / 90) * 0.3;
      default:
        return 0.5;
    }
  };

  // Get azimuth angle based on time of day
  const getAzimuthAngle = () => {
    switch (lightingDirection) {
      case 'morning':
        return 90; // East
      case 'noon':
        return 180; // South
      case 'evening':
        return 270; // West
      case 'custom':
        return customLightingAngle;
      default:
        return 315; // Northwest (default)
    }
  };

  // Initialize property extrusion layer
  const initializePropertyExtrusion = async () => {
    if (!terrainMapRef.current) return;

    try {
      // Fetch property data from API
      const response = await fetch('/api/properties');
      const properties = await response.json();

      // Create features for each property
      const features = properties.map((property: any) => {
        // Parse coordinates from property data
        const coordinates = property.coordinates || [
          parseFloat(property.longitude || initialCenter[0]),
          parseFloat(property.latitude || initialCenter[1]),
        ];

        // Create feature with point geometry
        const feature = new Feature({
          geometry: new Point(fromLonLat(coordinates)),
          properties: {
            ...property,
            height: getExtrusionHeight(property),
          },
        });

        return feature;
      });

      // Create vector source with property features
      const vectorSource = new VectorSource({
        features,
      });

      // Create vector layer with custom style for extruded properties
      const extrusionLayer = new VectorLayer({
        source: vectorSource,
        style: feature => {
          const height = feature.get('properties')?.height || 20;
          const propertyType = feature.get('properties')?.type || 'residential';
          const baseColor = getPropertyTypeColor(propertyType);

          return new Style({
            image: new Icon({
              src: createExtrudedPropertyIcon(height, baseColor),
              scale: 1,
              anchor: [0.5, 1],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
            }),
          });
        },
        zIndex: 10,
      });

      // Remove existing extrusion layer if any
      if (propertyExtrusionLayerRef.current) {
        terrainMapRef.current.removeLayer(propertyExtrusionLayerRef.current);
      }

      // Add new extrusion layer
      terrainMapRef.current.addLayer(extrusionLayer);
      propertyExtrusionLayerRef.current = extrusionLayer;
    } catch (error) {
      console.error('Error initializing property extrusion:', error);
    }
  };

  // Create SVG icon for extruded property
  const createExtrudedPropertyIcon = (height: number, baseColor: string) => {
    const width = 20;
    const topWidth = 16;

    // Scale height based on value
    const scaledHeight = Math.max(10, Math.min(50, height));

    // Create light and dark versions of the color for 3D effect
    const topColor = baseColor;
    const frontColor = adjustBrightness(baseColor, -20);
    const sideColor = adjustBrightness(baseColor, -40);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scaledHeight + 5}" viewBox="0 0 ${width} ${scaledHeight + 5}">
        <!-- Top face -->
        <polygon points="${(width - topWidth) / 2},0 ${width - (width - topWidth) / 2},0 ${width},${scaledHeight} 0,${scaledHeight}" fill="${topColor}" />
        
        <!-- Front face -->
        <polygon points="0,${scaledHeight} ${width},${scaledHeight} ${width},${scaledHeight + 5} 0,${scaledHeight + 5}" fill="${frontColor}" />
        
        <!-- Right face -->
        <polygon points="${width},${scaledHeight} ${width},${scaledHeight + 5} ${width - (width - topWidth) / 2},0" fill="${sideColor}" />
        
        <!-- Outline -->
        <polygon points="${(width - topWidth) / 2},0 ${width - (width - topWidth) / 2},0 ${width},${scaledHeight} 0,${scaledHeight}" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="0.5" />
      </svg>
    `;

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  // Get color based on property type
  const getPropertyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      residential: '#4285F4',
      commercial: '#34A853',
      industrial: '#FBBC05',
      agricultural: '#EA4335',
      vacant: '#673AB7',
      'mixed-use': '#3F51B5',
    };

    return colors[type] || '#4285F4';
  };

  // Adjust color brightness
  const adjustBrightness = (hex: string, percent: number) => {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Calculate extrusion height based on property value
  const getExtrusionHeight = (property: any) => {
    // Base height on property value or size if available
    const value = parseFloat(property.value || 0);
    const size = parseFloat(property.size || 0);

    if (value > 0) {
      // Scale by property value (normalize to range 10-50)
      return 10 + Math.min(40, Math.log(value / 10000) * 10);
    } else if (size > 0) {
      // Scale by property size
      return 10 + Math.min(40, Math.log(size / 100) * 5);
    }

    // Default height based on property type
    const typeHeights: Record<string, number> = {
      commercial: 35,
      industrial: 30,
      residential: 20,
      agricultural: 15,
      vacant: 10,
      'mixed-use': 25,
    };

    return typeHeights[property.type] || 20;
  };

  // Update viewshed analysis
  const updateViewshedAnalysis = (point: [number, number]) => {
    if (!terrainMapRef.current) return;

    try {
      // Create viewshed feature
      const viewshedFeature = new Feature({
        geometry: new Point(fromLonLat(point)),
      });

      // Create a simple circle representation for viewshed
      // In a real implementation, this would use terrain data to calculate actual visibility
      const viewshedSource = new VectorSource({
        features: [viewshedFeature],
      });

      // Create viewshed layer
      const newViewshedLayer = new VectorLayer({
        source: viewshedSource,
        style: new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: 'rgba(255, 0, 0, 0.4)' }),
            stroke: new Stroke({ color: 'red', width: 2 }),
          }),
        }),
        zIndex: 20,
      });

      // Remove existing viewshed layer if any
      if (viewshedLayer) {
        terrainMapRef.current.removeLayer(viewshedLayer);
      }

      // Add new viewshed layer
      terrainMapRef.current.addLayer(newViewshedLayer);
      setViewshedLayer(newViewshedLayer);

      // Simulate viewshed with a radial gradient overlay
      // This would be replaced with actual viewshed calculation in production
      const viewshedOverlay = document.createElement('div');
      viewshedOverlay.className = 'viewshed-overlay';
      viewshedOverlay.style.background = `radial-gradient(circle at center, rgba(255, 255, 0, 0.2) 0%, rgba(255, 255, 0, 0) ${viewshedDistance / 100}%)`;

      new Overlay({
        element: viewshedOverlay,
        position: fromLonLat(point),
        positioning: 'center-center',
        offset: [0, 0],
        className: 'viewshed-overlay-container',
      });
    } catch (error) {
      console.error('Error updating viewshed analysis:', error);
    }
  };

  // Handle elevation mode change
  useEffect(() => {
    // Dynamically import ol-ext ElevationFilter component
    importOlExt('filter/Elevation')
      .then(module => {
        if (module?.default) {
          applyElevationMode(elevationMode, module.default);
        }
      })
      .catch(error => {
        console.error('Error importing ElevationFilter:', error);
      });
  }, [elevationMode, lightingDirection, customLightingAngle, customLightingElevation]);

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

  // Handle z-scale change
  useEffect(() => {
    if (!terrainMapRef.current) return;

    const terrainContainer = terrainMapRef.current.getTargetElement();
    if (!terrainContainer) return;

    // Remove existing z-scale classes
    terrainContainer.classList.remove('terrain-z-scale-low');
    terrainContainer.classList.remove('terrain-z-scale-medium');
    terrainContainer.classList.remove('terrain-z-scale-high');
    terrainContainer.classList.remove('terrain-z-scale-custom');

    // Apply new z-scale class
    switch (zScale) {
      case 'low':
        terrainContainer.classList.add('terrain-z-scale-low');
        break;
      case 'medium':
        terrainContainer.classList.add('terrain-z-scale-medium');
        break;
      case 'high':
        terrainContainer.classList.add('terrain-z-scale-high');
        break;
      case 'custom':
        terrainContainer.classList.add('terrain-z-scale-custom');
        terrainContainer.style.setProperty('--terrain-z-scale', customZScale.toString());
        break;
    }
  }, [zScale, customZScale]);

  // Handle property extrusion toggle
  useEffect(() => {
    if (showPropertyExtrusion) {
      initializePropertyExtrusion();
    } else if (propertyExtrusionLayerRef.current && terrainMapRef.current) {
      terrainMapRef.current.removeLayer(propertyExtrusionLayerRef.current);
      propertyExtrusionLayerRef.current = null;
    }
  }, [showPropertyExtrusion]);

  // Handle viewshed analysis toggle
  useEffect(() => {
    if (!showViewshedAnalysis && viewshedLayer && terrainMapRef.current) {
      terrainMapRef.current.removeLayer(viewshedLayer);
      setViewshedLayer(null);
      setViewshedPoint(null);
    }

    // Add click handler when viewshed is enabled
    if (terrainMapRef.current) {
      terrainMapRef.current.getViewport().style.cursor = showViewshedAnalysis ? 'crosshair' : '';
    }
  }, [showViewshedAnalysis]);

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
    importOlExt('filter/Elevation')
      .then(module => {
        if (module?.default) {
          applyElevationMode(elevationMode, module.default);
        }
      })
      .catch(error => {
        console.error('Error importing ElevationFilter:', error);
      });
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
            <p className="mt-4 font-medium">Loading 3D terrain data...</p>
          </div>
        </div>
      )}

      {/* Terrain Controls */}
      <div className="absolute top-4 right-4 z-10 bg-background/90 p-3 rounded-lg shadow-md border border-border max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <Box className="h-4 w-4 mr-1 text-primary" />
            3D Terrain Controls
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
          <TabsList className="grid w-full grid-cols-3"><>

            <TabsTrigger value="visualization" className="text-xs">
              Visualization
            </TabsTrigger>
            <TabsTrigger
</> value="3d-options" className="text-xs">
              3D Options
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              Advanced
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
              ><>

                <Droplets className="h-3 w-3 mr-1" /> Gradient
              </Button>

              <Button
</>
                variant={elevationMode === 'hillshade' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setElevationMode('hillshade')}
              ><>

                <Mountain className="h-3 w-3 mr-1" /> Hillshade
              </Button>

              <Button
</>
                variant={elevationMode === 'contour' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setElevationMode('contour')}
              ><>

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

            <div className="flex items-center justify-between"><>

              <Label className="text-xs">Data Source:</Label>
              <div
</> className="flex space-x-1"><>

                <Button
                  variant={terrainSource === 'terrain-rgb' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setTerrainSource('terrain-rgb')}
                >
                  Mapbox
                </Button>
                <Button
</>
                  variant={terrainSource === 'usgs' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setTerrainSource('usgs')}
                >
                  USGS
                </Button>
              </div>
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

          {/* 3D Options Tab */}
          <TabsContent value="3d-options" className="space-y-3 mt-2">
            {/* Z-Scale Control */}
            <div className="space-y-1">
              <div className="flex items-center justify-between"><>

                <Label className="text-xs">Elevation Scale:</Label>
                <div
</> className="flex space-x-1">
                  <Button
                    variant={zScale === 'low' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setZScale('low')}
                  ><>

                    <Minimize className="h-3 w-3 mr-1" /> Low
                  </Button>
                  <Button
</>
                    variant={zScale === 'medium' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setZScale('medium')}
                  >
                    Medium
                  </Button>
                  <Button
                    variant={zScale === 'high' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setZScale('high')}
                  >
                    <Maximize className="h-3 w-3 mr-1" /> High
                  </Button>
                </div>
              </div>

              {/* Custom Z-Scale */}
              <div className={cn('space-y-1', zScale === 'custom' ? 'block' : 'hidden')}>
                <div className="flex items-center justify-between"><>

                  <Label className="text-xs">Custom Scale:</Label>
                  <span
</> className="text-xs">{customZScale.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[customZScale]}
                  min={0.5}
                  max={3}
                  step={0.1}
                  onValueChange={value => setCustomZScale(value[0])}
                />
              </div>
            </div>

            {/* Light Direction */}
            <div className="space-y-1">
              <div className="flex items-center justify-between"><>

                <Label className="text-xs">Light Direction:</Label>
                <div
</> className="flex space-x-1">
                  <Button
                    variant={lightingDirection === 'morning' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setLightingDirection('morning')}
                  ><>

                    <Sun className="h-3 w-3 mr-1" /> Morning
                  </Button>
                  <Button
</>
                    variant={lightingDirection === 'noon' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setLightingDirection('noon')}
                  >
                    Noon
                  </Button>
                  <Button
                    variant={lightingDirection === 'evening' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setLightingDirection('evening')}
                  >
                    <Moon className="h-3 w-3 mr-1" /> Evening
                  </Button>
                </div>
              </div>

              {/* Custom Light Direction */}
              <div className={cn('space-y-2', lightingDirection === 'custom' ? 'block' : 'hidden')}>
                <div>
                  <div className="flex items-center justify-between"><>

                    <Label className="text-xs">Azimuth:</Label>
                    <span
</> className="text-xs">{customLightingAngle}°</span>
                  </div><>

                  <Slider
                    value={[customLightingAngle]}
                    min={0}
                    max={359}
                    step={5}
                    onValueChange={value => setCustomLightingAngle(value[0])}
                  />
                </div>

                <div
</>>
                  <div className="flex items-center justify-between"><>

                    <Label className="text-xs">Elevation:</Label>
                    <span
</> className="text-xs">{customLightingElevation}°</span>
                  </div>
                  <Slider
                    value={[customLightingElevation]}
                    min={10}
                    max={80}
                    step={5}
                    onValueChange={value => setCustomLightingElevation(value[0])}
                  />
                </div>
              </div>
            </div>

            {/* Custom Button */}
            <Button
              variant={
                lightingDirection === 'custom' || zScale === 'custom' ? 'default' : 'outline'
              }
              size="sm"
              className="text-xs w-full"
              onClick={() => {
                setLightingDirection(prev => (prev === 'custom' ? 'noon' : 'custom'));
                setZScale(prev => (prev === 'custom' ? 'medium' : 'custom'));
              }}
            >
              <Sliders className="h-3 w-3 mr-1" />
              {lightingDirection === 'custom' || zScale === 'custom'
                ? 'Hide Custom Controls'
                : 'Custom Settings'}
            </Button>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-3 mt-2">
            {/* Property Extrusion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="property-extrusion"
                  checked={showPropertyExtrusion}
                  onCheckedChange={setShowPropertyExtrusion}
                />
                <Label htmlFor="property-extrusion" className="text-xs">
                  Property Extrusion
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                disabled={!showPropertyExtrusion}
                onClick={() => initializePropertyExtrusion()}
              >
                <Plus className="h-3 w-3 mr-1" /> Refresh
              </Button>
            </div>

            {/* Viewshed Analysis */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="viewshed-analysis"
                  checked={showViewshedAnalysis}
                  onCheckedChange={setShowViewshedAnalysis}
                />
                <Label htmlFor="viewshed-analysis" className="text-xs">
                  Viewshed Analysis
                </Label>
              </div>
              {viewshedPoint && (
                <Badge variant="outline" className="text-xs">
                  Point set
                </Badge>
              )}
            </div>

            {/* Viewshed Distance (only shown when viewshed is enabled) */}
            {showViewshedAnalysis && (
              <div className="space-y-1">
                <div className="flex items-center justify-between"><>

                  <Label className="text-xs">View Distance:</Label>
                  <span
</> className="text-xs">{(viewshedDistance / 1000).toFixed(1)} km</span>
                </div>
                <Slider
                  value={[viewshedDistance]}
                  min={500}
                  max={5000}
                  step={100}
                  onValueChange={value => {
                    setViewshedDistance(value[0]);
                    if (viewshedPoint) {
                      updateViewshedAnalysis(viewshedPoint);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground italic">
                  Click on the map to set a viewshed analysis point
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/90 p-2 rounded-lg shadow-md border border-border">
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              if (terrainMapRef.current) {
                const view = terrainMapRef.current.getView();
                const currentZoom = view.getZoom() || initialZoom;
                view.setZoom(currentZoom + 1);
              }
            }}
          ><>

            <Plus className="h-4 w-4" />
          </Button>

          <Button
</>
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              if (terrainMapRef.current) {
                const view = terrainMapRef.current.getView();
                const currentZoom = view.getZoom() || initialZoom;
                view.setZoom(currentZoom - 1);
              }
            }}
          ><>

            <Minus className="h-4 w-4" />
          </Button>

          <Button
</>
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              if (terrainMapRef.current) {
                terrainMapRef.current.getView().setCenter(fromLonLat(initialCenter));
                terrainMapRef.current.getView().setZoom(initialZoom);
              }
            }}
          >
            <Compass className="h-4 w-4" />
          </Button>
        </div>
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
    <path d="M5 7v12h14V7l-7-4-7 4z" />
    <path d="M19 7L5 7" />
    <path d="M12 3v16" />
    <path d="M5 19l7-4 7 4" />
  </svg>
);

export default TerrainVisualization3D;
