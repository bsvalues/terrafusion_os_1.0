import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

// Type definitions for draw events and features
interface DrawEvent {
  type: string;
  features: GeoJSON.Feature<any, any>[];
}

// Extend GeoJSON Feature to ensure it has an id property
declare module 'geojson' {
  interface Feature<G = any, P = any> {
    id?: string | number;
  }
}

// Simple direct implementation that doesn't rely on other components
export function MapboxDemoPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('view');
  const [drawnFeatures, setDrawnFeatures] = useState<GeoJSON.Feature[]>([]);

  useEffect(() => {
    // First check for WebGL support before doing anything else
    if (!mapboxgl.supported()) {
      setError('Your browser does not support WebGL, which is required for the map to display.');
      toast({
        title: 'Browser not supported',
        description: 'Your browser does not support WebGL, which is required for the map to display.',
        variant: 'destructive'
      });
      return;
    }
    
    // Initialize mapbox with access token
    // Try direct method, fallback to API if needed
    const initMapbox = async () => {
      try {
        // First try the direct environment variable approach
        if (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
          mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
          initMap();
        } else {
          // Fallback to API endpoint
          console.log("VITE_MAPBOX_ACCESS_TOKEN not available, trying API endpoint");
          const response = await fetch('/api/mapbox-token');
          
          if (!response.ok) {
            throw new Error(`Failed to get Mapbox token: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!data.token) {
            throw new Error('No token returned from server');
          }
          
          mapboxgl.accessToken = data.token;
          initMap();
        }
      } catch (error) {
        console.error('Error initializing Mapbox:', error);
        setError('Failed to get Mapbox access token. Please ensure the token is properly configured.');
        toast({
          title: 'Mapbox token error',
          description: 'Could not retrieve Mapbox access token. Please check console for details.',
          variant: 'destructive'
        });
      }
    };
    
    const initMap = () => {
      // Only create the map if one doesn't already exist and container is ready
      if (!map.current && mapContainer.current) {
        try {
          console.log("Initializing Mapbox map with token:", mapboxgl.accessToken ? mapboxgl.accessToken.substring(0, 8) + "..." : "None");
          
          // Create a new map instance
          const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [-119.16, 46.23], // Benton County, WA
            zoom: 11,
            attributionControl: true
          });
          
          // Add navigation controls (zoom in/out buttons)
          newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Add scale control
          newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
          
          // Add fullscreen control
          newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
          
          // Initialize the MapboxDraw instance
          draw.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
              polygon: true,
              line_string: true,
              point: true,
              trash: true
            }
          });
          
          // Add the drawing controls to the map
          newMap.addControl(draw.current, 'top-left');
          
          // Wait for map to load
          newMap.on('load', () => {
            console.log('Map loaded successfully');
            toast({
              title: 'Map loaded',
              description: 'The Mapbox map has been successfully loaded.',
            });
            
            // Set up event listeners for draw
            newMap.on('draw.create', (e: DrawEvent) => {
              console.log('Feature created:', e.features);
              setDrawnFeatures(prev => [...prev, ...e.features]);
              toast({
                title: 'Feature created',
                description: `Created a new ${e.features[0].geometry.type} feature.`,
              });
            });
            
            newMap.on('draw.update', (e: DrawEvent) => {
              console.log('Feature updated:', e.features);
              // Update the drawn features by replacing the updated ones
              setDrawnFeatures(prev => 
                prev.map(feature => {
                  const updated = e.features.find(f => f.id === feature.id);
                  return updated || feature;
                })
              );
            });
            
            newMap.on('draw.delete', (e: DrawEvent) => {
              console.log('Feature deleted:', e.features);
              // Remove deleted features from the state
              setDrawnFeatures(prev => 
                prev.filter(feature => !e.features.some(f => f.id === feature.id))
              );
              toast({
                title: 'Feature deleted',
                description: 'Successfully deleted the selected feature(s).',
              });
            });
          });
          
          // Add error handler
          newMap.on('error', (e) => {
            console.error('Mapbox error:', e);
            setError('An error occurred with the map. Please check the console for details.');
          });
          
          // Set the map instance
          map.current = newMap;
        } catch (error) {
          console.error('Error initializing Mapbox map:', error);
          setError('Failed to initialize the map. Please check the console for details.');
        }
      }
    };
    
    // Start the initialization process
    initMapbox();
    
    // Cleanup function to remove the map instance
    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Function to handle drawing mode changes
  const setDrawMode = (mode: string) => {
    if (!map.current || !draw.current) return;
    
    // Disable active draw mode first
    if (activeTab !== 'view') {
      draw.current.changeMode('simple_select');
    }
    
    // Set the new mode
    setActiveTab(mode);
    if (mode !== 'view') {
      draw.current.changeMode(mode);
      toast({
        title: 'Draw mode activated',
        description: `Now in ${mode} drawing mode. Click on the map to start drawing.`,
      });
    }
  };
  
  // Format feature type for display
  const formatFeatureType = (type: string): string => {
    switch (type) {
      case 'Point': return 'Point';
      case 'LineString': return 'Line';
      case 'Polygon': return 'Polygon';
      default: return type;
    }
  };
  
  return (
    <div className="container mx-auto p-4 h-screen flex flex-col"><>

      <h1 className="text-2xl font-bold mb-4">Mapbox Demo</h1>
      
      <Card
</> className="flex-grow overflow-hidden">
        <CardHeader className="pb-2"><>

          <CardTitle>Mapbox GL JS Map</CardTitle>
          <CardDescription
</>>
            Interactive map with drawing capabilities.
          </CardDescription>
          <Tabs value={activeTab} className="mt-2">
            <TabsList><>

              <TabsTrigger value="view" onClick={() => setDrawMode('view')}>View</TabsTrigger>
              <TabsTrigger
</> value="draw_polygon" onClick={() => setDrawMode('draw_polygon')}>Draw Polygon</TabsTrigger><>

              <TabsTrigger value="draw_line_string" onClick={() => setDrawMode('draw_line_string')}>Draw Line</TabsTrigger>
              <TabsTrigger
</> value="draw_point" onClick={() => setDrawMode('draw_point')}>Draw Point</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-7rem)]">
          {error ? (
            <div className="flex items-center justify-center h-full bg-red-50 text-red-700 p-4">
              <div className="text-center"><>

                <h3 className="text-lg font-semibold mb-2">Error Loading Map</h3>
                <p
</>>{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              <div 
                ref={mapContainer} 
                className="h-full flex-grow"
                style={{ background: '#e5e7eb' }} // Light gray background while loading
              />
              
              {/* Feature sidebar */}
              <div className="w-64 bg-white border-l border-gray-200 overflow-auto p-3">
                <h3 className="font-medium text-sm mb-2 text-gray-700">Drawn Features</h3>
                
                {drawnFeatures.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No features drawn yet. Use the drawing tools to create shapes on the map.</p>
                ) : (
                  <ul className="space-y-2">
                    {drawnFeatures.map((feature /* , index */) => (
                      <li key={String(feature.id || index)} className="text-sm border rounded p-2 bg-gray-50"><>

                        <div className="font-medium">{formatFeatureType(feature.geometry.type)} #{index + 1}</div>
                        <div
</> className="text-xs text-gray-500 mt-1">
                          ID: {String(feature.id).substring(0, 8)}...
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="mt-2 h-7 text-xs w-full"
                          onClick={() => {
                            if (map.current && draw.current && feature.id) {
                              draw.current.delete(String(feature.id));
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                
                {drawnFeatures.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 w-full"
                    onClick={() => {
                      if (map.current && draw.current) {
                        draw.current.deleteAll();
                        setDrawnFeatures([]);
                      }
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MapboxDemoPage;