import React, {useState, useRef, useEffect} from 'react';
import mapboxgl from 'mapbox-gl';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Slider} from '@/components/ui/slider';
import {Label} from '@/components/ui/label';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {getMapboxToken} from '@/lib/mapbox-token';
import {Map as MapIcon,
  Layers,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Palette,
  MapPin,
  Route,} from '@mui/icons-material';

interface MapStyle {id: string;
  name: string;
  url: string;
  description: string;}

interface MapMarker {id: string;
  coordinates: [number, number];
  title: string;
  description: string;
  color: string;}

export default function MapboxDemoPage() {const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('streets-v12');
  const [mapZoom, setMapZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-119.2781, 46.2396]);
  const [mapBearing, setMapBearing] = useState(0);
  const [mapPitch, setMapPitch] = useState(0);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedTab, setSelectedTab] = useState('controls');

  const mapStyles: MapStyle[] = [
    {
      id: 'streets-v12',
      name: 'Streets',
      url: 'mapbox://styles/mapbox/streets-v12',
      description: 'Standard street map with detailed road network',},
    {id: 'satellite-v9',
      name: 'Satellite',
      url: 'mapbox://styles/mapbox/satellite-v9',
      description: 'High-resolution satellite imagery',},
    {id: 'satellite-streets-v12',
      name: 'Satellite Streets',
      url: 'mapbox://styles/mapbox/satellite-streets-v12',
      description: 'Satellite imagery with street overlay',},
    {id: 'light-v11',
      name: 'Light',
      url: 'mapbox://styles/mapbox/light-v11',
      description: 'Clean, minimal style for data visualization',},
    {id: 'dark-v11',
      name: 'Dark',
      url: 'mapbox://styles/mapbox/dark-v11',
      description: 'Dark theme for reduced eye strain',},
    {id: 'outdoors-v12',
      name: 'Outdoors',
      url: 'mapbox://styles/mapbox/outdoors-v12',
      description: 'Topographic style with hiking trails and parks',},
  ];

  const sampleMarkers: MapMarker[] = [
    {id: 'marker-1',
      coordinates: [-119.2781, 46.2396],
      title: 'Richland City Hall',
      description: 'Municipal government center',
      color: '#3B82F6',},
    {id: 'marker-2',
      coordinates: [-119.2901, 46.2516],
      title: 'Columbia River',
      description: 'Major waterway and recreation area',
      color: '#06B6D4',},
    {id: 'marker-3',
      coordinates: [-119.2651, 46.2276],
      title: 'Hanford Site',
      description: 'Historical nuclear production complex',
      color: '#F59E0B',},
    {id: 'marker-4',
      coordinates: [-119.3001, 46.2596],
      title: 'Sacajawea State Park',
      description: 'State park and boat launch',
      color: '#10B981',},
  ];

  // Initialize Mapbox
  useEffect(() =>{
    const initializeMap = async () => {
      if (!mapContainer.current || map.current) return;

      try {
        const accessToken = await getMapboxToken();
        mapboxgl.accessToken = accessToken;

        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: `mapbox://styles/mapbox/${currentStyle}`,
          center: mapCenter,
          zoom: mapZoom,
          bearing: mapBearing,
          pitch: mapPitch,
          attributionControl: false,
        });

        // Wait for map to load
        mapInstance.on('load', () => {setIsMapLoaded(true);

          // Add navigation controls
          mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

          // Add scale control
          mapInstance.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

          // Add fullscreen control
          mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

          // Set up event listeners
          mapInstance.on('move', () => {
            const center = mapInstance.getCenter();
            setMapCenter([center.lng, center.lat]);
            setMapZoom(mapInstance.getZoom());
            setMapBearing(mapInstance.getBearing());
            setMapPitch(mapInstance.getPitch());});

          // Add sample markers
          addMarkersToMap(mapInstance, sampleMarkers);
          setMarkers(sampleMarkers);
        });

        map.current = mapInstance;
      } catch (error) {console.error('Failed to initialize Mapbox:', error);}
    };

    initializeMap();

    return () => {if (map.current) {
        map.current.remove();
        map.current = null;}
    };
  }, []);

  // Add markers to map
  const addMarkersToMap = (mapInstance: mapboxgl.Map, markerData: MapMarker[]) => {markerData.forEach(marker => {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = marker.color;
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25}).setHTML(`<div style="padding: 8px;"><h3 style="margin: 0 0 4px 0; font-weight: bold;">${marker.title}</h3><p style="margin: 0; font-size: 14px; color: #666;">${marker.description}</p></div>`);

      // Add marker to map
      new mapboxgl.Marker(el).setLngLat(marker.coordinates).setPopup(popup).addTo(mapInstance);
    });
  };

  // Change map style
  const changeMapStyle = (styleId: string) => {if (!map.current) return;

    const style = mapStyles.find(s => s.id === styleId);
    if (style) {
      map.current.setStyle(style.url);
      setCurrentStyle(styleId);}
  };

  // Navigation functions
  const zoomIn = () => {if (map.current) {
      map.current.zoomIn();}
  };

  const zoomOut = () => {if (map.current) {
      map.current.zoomOut();}
  };

  const resetBearing = () => {if (map.current) {
      map.current.rotateTo(0);}
  };

  const resetPitch = () => {if (map.current) {
      map.current.setPitch(0);}
  };

  const flyToLocation = (coordinates: [number, number], zoom?: number) => {if (map.current) {
      map.current.flyTo({
        center: coordinates,
        zoom: zoom || mapZoom,
        duration: 2000,});
    }
  };

  // Update map zoom
  const handleZoomChange = (value: number[]) => {if (map.current) {
      map.current.setZoom(value[0]);}
  };

  // Update map pitch
  const handlePitchChange = (value: number[]) => {if (map.current) {
      map.current.setPitch(value[0]);}
  };

  return (<div className="container mx-auto p-6 space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Mapbox Integration Demo</h1><p className="text-muted-foreground">Interactive map with Mapbox GL JS featuring various styles and controls</p></div><div className="flex items-center gap-2"><Badge variant={isMapLoaded ? 'default' : 'secondary'}>{isMapLoaded ? 'Map Loaded' : 'Loading...'}</Badge><Badge variant="outline">Zoom: {mapZoom.toFixed(1)}</Badge></div></div><div className="grid grid-cols-1 lg:grid-cols-4 gap-6">{/* Map Container */}<div className="lg:col-span-3"><Card><CardHeader><CardTitle className="flex items-center gap-2"><MapIcon className="h-5 w-5" />Interactive Map</CardTitle></CardHeader><CardContent><div
                ref={mapContainer}
                className="w-full h-[600px] rounded-lg overflow-hidden border" />{!isMapLoaded && (<div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div><div className="text-sm text-muted-foreground">Loading Mapbox...</div></div></div>)}</CardContent></Card></div>{/* Controls Panel */}<div className="lg:col-span-1"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Map Controls</CardTitle></CardHeader><CardContent><Tabs value={selectedTab} onValueChange={setSelectedTab}><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="controls">Controls</TabsTrigger><TabsTrigger value="styles">Styles</TabsTrigger><TabsTrigger value="locations">Places</TabsTrigger></TabsList><TabsContent value="controls" className="space-y-4">{/* Navigation Controls */}<div><Label className="text-sm font-medium">Navigation</Label><div className="grid grid-cols-2 gap-2 mt-2"><Button size="sm" onClick={zoomIn} disabled={!isMapLoaded}><ZoomIn className="h-4 w-4" /></Button><Button size="sm" onClick={zoomOut} disabled={!isMapLoaded}><ZoomOut className="h-4 w-4" /></Button><Button size="sm" onClick={resetBearing} disabled={!isMapLoaded}><RotateCcw className="h-4 w-4" /></Button><Button size="sm" onClick={resetPitch} disabled={!isMapLoaded}><Navigation className="h-4 w-4" /></Button></div></div>{/* Zoom Control */}<div><Label className="text-sm font-medium">Zoom Level: {mapZoom.toFixed(1)}</Label><Slider
                      value={[mapZoom]}
                      onValueChange={handleZoomChange}
                      min={0}
                      max={22}
                      step={0.1}
                      className="mt-2"
                      disabled={!isMapLoaded} /></div>{/* Pitch Control */}<div><Label className="text-sm font-medium">Pitch: {mapPitch.toFixed(0)}°</Label><Slider
                      value={[mapPitch]}
                      onValueChange={handlePitchChange}
                      min={0}
                      max={60}
                      step={1}
                      className="mt-2"
                      disabled={!isMapLoaded} /></div>{/* Coordinates Display */}<div><Label className="text-sm font-medium">Center Coordinates</Label><div className="text-xs text-muted-foreground mt-1 font-mono">Lat: {mapCenter[1].toFixed(4)}<br />Lng: {mapCenter[0].toFixed(4)}</div></div></TabsContent><TabsContent value="styles" className="space-y-4"><div><Label className="text-sm font-medium">Map Style</Label><Select value={currentStyle} onValueChange={changeMapStyle}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{mapStyles.map(style => (<SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2">{mapStyles.map(style => (<div
                        key={style.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          currentStyle === style.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:border-gray-300'}`}
                        onClick={() => changeMapStyle(style.id)}
                      ><div className="flex items-center gap-2"><Palette className="h-4 w-4" /><span className="font-medium">{style.name}</span></div><p className="text-xs text-muted-foreground mt-1">{style.description}</p></div>))}</div></TabsContent><TabsContent value="locations" className="space-y-4"><div><Label className="text-sm font-medium">Quick Navigation</Label></div><div className="space-y-2">{markers.map(marker => (<div
                        key={marker.id}
                        className="p-3 border rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
                        onClick={() => flyToLocation(marker.coordinates, 15)}
                      ><div className="flex items-center gap-2"><div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: marker.color}} /><span className="font-medium text-sm">{marker.title}</span></div><p className="text-xs text-muted-foreground mt-1">{marker.description}</p></div>))}</div><Alert><MapPin className="h-4 w-4" /><AlertDescription>Click on any location to fly to that area on the map.</AlertDescription></Alert></TabsContent></Tabs></CardContent></Card></div></div>{/* Map Information */}<div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Card><CardContent className="p-6"><div className="flex items-center gap-3"><Layers className="h-8 w-8 text-blue-600" /><div><h3 className="font-semibold">Multiple Styles</h3><p className="text-sm text-muted-foreground">Choose from 6 different map styles</p></div></div></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center gap-3"><Navigation className="h-8 w-8 text-green-600" /><div><h3 className="font-semibold">Interactive Controls</h3><p className="text-sm text-muted-foreground">Zoom, rotate, and navigate smoothly</p></div></div></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center gap-3"><Route className="h-8 w-8 text-purple-600" /><div><h3 className="font-semibold">Local Points</h3><p className="text-sm text-muted-foreground">Explore Benton County landmarks</p></div></div></CardContent></Card></div></div>
  );
}
