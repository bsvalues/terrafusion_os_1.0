import React, {useRef, useEffect, useState, useCallback} from 'react';
import mapboxgl from 'mapbox-gl';
import {useEnhancedWebSocket, MessageTypeEnum} from '@/hooks/use-enhanced-websocket';
import {getMapboxToken} from '@/lib/mapbox-token';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Users, MapPin, Cursor, Draw, Move} from '@mui/icons-material';

interface CollaborativeMapboxProps {roomId: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapLoad?: (map: mapboxgl.Map) => void;
  onUserCursor?: (cursors: UserCursor[]) => void;
  onMapChange?: (center: [number, number], zoom: number) => void;}

interface UserCursor {userId: string;
  username: string;
  position: [number, number];
  timestamp: number;}

interface MapAnnotation {id: string;
  userId: string;
  username: string;
  type: 'point' | 'line' | 'polygon';
  coordinates: any;
  properties: Record<string, any>;
  timestamp: number;}

export function CollaborativeMapbox({roomId,
  initialCenter = [-96.7969, 32.7767],
  initialZoom = 12,
  onMapLoad,
  onUserCursor,
  onMapChange,}: CollaborativeMapboxProps) {const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userCursors, setUserCursors] = useState<UserCursor[]>([]);
  const [annotations, setAnnotations] = useState<MapAnnotation[]>([]);
  const [drawingMode, setDrawingMode] = useState<'none' | 'point' | 'line' | 'polygon'>('none');
  const [currentUser] = useState({
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    name: 'User ' + Math.floor(Math.random() * 1000),});

  // WebSocket for real-time collaboration
  const {send, messages, participants, connected} = useEnhancedWebSocket({roomId,
    autoConnect: true,
    onMessage: handleWebSocketMessage,});

  // Handle incoming WebSocket messages
  function handleWebSocketMessage(message: any) {switch (message.type) {
      case MessageTypeEnum.CURSOR_MOVE:
        if (message.data.userId !== currentUser.id) {
          updateUserCursor(message.data);}
        break;

      case MessageTypeEnum.MAP_ANNOTATION:
        if (message.data.annotation) {addAnnotation(message.data.annotation);}
        break;

      case MessageTypeEnum.MAP_VIEW_CHANGE:
        if (message.data.userId !== currentUser.id && map.current) {map.current.flyTo({
            center: message.data.center,
            zoom: message.data.zoom,
            duration: 1000,});
        }
        break;
    }
  }

  // Initialize Mapbox
  useEffect(() =>{const initializeMap = async () => {
      if (!mapContainer.current || map.current) return;

      try {
        const accessToken = await getMapboxToken();
        mapboxgl.accessToken = accessToken;

        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: initialCenter,
          zoom: initialZoom,
          attributionControl: false,});

        // Wait for map to load
        mapInstance.on('load', () => {setIsLoaded(true);
          onMapLoad?.(mapInstance);

          // Add sources for collaborative features
          mapInstance.addSource('user-cursors', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: []},
          });

          mapInstance.addSource('annotations', {type: 'geojson',
            data: { type: 'FeatureCollection', features: []},
          });

          // Add layers for cursors and annotations
          mapInstance.addLayer({id: 'user-cursors-layer',
            type: 'symbol',
            source: 'user-cursors',
            layout: {
              'icon-image': 'custom-marker',
              'icon-size': 0.8,
              'text-field': ['get', 'username'],
              'text-offset': [0, 2],
              'text-anchor': 'top',
              'text-size': 12,},
            paint: {'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 1,},
          });

          mapInstance.addLayer({id: 'annotations-points',
            type: 'circle',
            source: 'annotations',
            filter: ['==', ['get', 'type'], 'point'],
            paint: {
              'circle-radius': 8,
              'circle-color': ['get', 'color'],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,},
          });

          mapInstance.addLayer({id: 'annotations-lines',
            type: 'line',
            source: 'annotations',
            filter: ['==', ['get', 'type'], 'line'],
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 3,},
          });

          mapInstance.addLayer({id: 'annotations-polygons',
            type: 'fill',
            source: 'annotations',
            filter: ['==', ['get', 'type'], 'polygon'],
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.3,},
          });
        });

        // Track mouse movement for cursor sharing
        mapInstance.on('mousemove', e => {if (connected && drawingMode === 'none') {
            const throttledSend = throttle(() => {
              send({
                type: MessageTypeEnum.CURSOR_MOVE,
                data: {
                  userId: currentUser.id,
                  username: currentUser.name,
                  position: [e.lngLat.lng, e.lngLat.lat],
                  timestamp: Date.now(),},
              });
            }, 100);
            throttledSend();
          }
        });

        // Track map view changes
        mapInstance.on('moveend', () => {if (connected) {
            const center = mapInstance.getCenter();
            const zoom = mapInstance.getZoom();

            send({
              type: MessageTypeEnum.MAP_VIEW_CHANGE,
              data: {
                userId: currentUser.id,
                center: [center.lng, center.lat],
                zoom: zoom,
                timestamp: Date.now(),},
            });

            onMapChange?.([center.lng, center.lat], zoom);
          }
        });

        // Handle click events for drawing
        mapInstance.on('click', e => {if (drawingMode !== 'none') {
            handleDrawing(e.lngLat);}
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

  // Update user cursor positions
  const updateUserCursor = useCallback(
    (cursorData: UserCursor) => {setUserCursors(prev => {
        const updated = prev.filter(c => c.userId !== cursorData.userId);
        return [...updated, cursorData];});

      onUserCursor?.(userCursors);
    },
    [userCursors, onUserCursor]
  );

  // Add annotation to map
  const addAnnotation = useCallback((annotation: MapAnnotation) => {setAnnotations(prev => {
      const updated = prev.filter(a => a.id !== annotation.id);
      return [...updated, annotation];});
  }, []);

  // Handle drawing actions
  const handleDrawing = (lngLat: mapboxgl.LngLat) => {if (!connected || drawingMode === 'none') return;

    const annotation: MapAnnotation = {
      id: 'annotation-' + Date.now(),
      userId: currentUser.id,
      username: currentUser.name,
      type: drawingMode === 'point' ? 'point' : drawingMode === 'line' ? 'line' : 'polygon',
      coordinates: drawingMode === 'point' ? [lngLat.lng, lngLat.lat] : [[lngLat.lng, lngLat.lat]],
      properties: {
        color: getRandomColor(),
        createdBy: currentUser.name,},
      timestamp: Date.now(),
    };

    // Add locally
    addAnnotation(annotation);

    // Broadcast to other users
    send({type: MessageTypeEnum.MAP_ANNOTATION,
      data: {
        annotation,
        userId: currentUser.id,},
    });

    // Reset drawing mode after point creation
    if (drawingMode === 'point') {setDrawingMode('none');}
  };

  // Update map sources when data changes
  useEffect(() => {if (!map.current || !isLoaded) return;

    // Update cursor positions
    const cursorFeatures = userCursors.map(cursor => ({
      type: 'Feature' as const,
      properties: {
        userId: cursor.userId,
        username: cursor.username,},
      geometry: {type: 'Point' as const,
        coordinates: cursor.position,},
    }));

    const cursorSource = map.current.getSource('user-cursors') as mapboxgl.GeoJSONSource;
    if (cursorSource) {cursorSource.setData({
        type: 'FeatureCollection',
        features: cursorFeatures,});
    }
  }, [userCursors, isLoaded]);

  useEffect(() => {if (!map.current || !isLoaded) return;

    // Update annotations
    const annotationFeatures = annotations.map(annotation => ({
      type: 'Feature' as const,
      properties: {
        type: annotation.type,
        color: annotation.properties.color,
        createdBy: annotation.properties.createdBy,
        id: annotation.id,},
      geometry: {type:
          annotation.type === 'point'
            ? 'Point'
            : annotation.type === 'line'
              ? 'LineString'
              : 'Polygon',
        coordinates: annotation.coordinates,} as any,
    }));

    const annotationSource = map.current.getSource('annotations') as mapboxgl.GeoJSONSource;
    if (annotationSource) {annotationSource.setData({
        type: 'FeatureCollection',
        features: annotationFeatures,});
    }
  }, [annotations, isLoaded]);

  // Utility functions
  const throttle = (func: Function, limit: number) => {let inThrottle: boolean;
    return function (this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);}
    };
  };

  const getRandomColor = () => {const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    return colors[Math.floor(Math.random() * colors.length)];};

  return (<div className="relative w-full h-full">{/* Map Container */}<div ref={mapContainer} className="w-full h-full" />{/* Collaboration Controls */}<div className="absolute top-4 left-4 space-y-2"><Card className="w-64"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Collaboration<Badge variant={connected ? 'default' : 'secondary'}>{connected ? 'Live' : 'Offline'}</Badge></CardTitle></CardHeader><CardContent className="pt-0"><div className="text-xs text-muted-foreground">{participants.length} users in room</div><div className="flex gap-1 mt-2">{participants.slice(0, 3).map((participant, index) => (<div
                  key={participant.id}
                  className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white"
                  title={participant.name}
                >{participant.name.charAt(0)}</div>))}
              {participants.length > 3 && (<div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white">+{participants.length - 3}</div>)}</div></CardContent></Card>{/* Drawing Tools */}<Card className="w-64"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Draw className="h-4 w-4" />Drawing Tools</CardTitle></CardHeader><CardContent className="pt-0"><div className="flex gap-2"><Button
                size="sm"
                variant={drawingMode === 'none' ? 'default' : 'outline'}
                onClick={() => setDrawingMode('none')}
              ><Move className="h-4 w-4" /></Button><Button
                size="sm"
                variant={drawingMode === 'point' ? 'default' : 'outline'}
                onClick={() => setDrawingMode('point')}
                disabled={!connected}
              ><MapPin className="h-4 w-4" /></Button><Button
                size="sm"
                variant={drawingMode === 'line' ? 'default' : 'outline'}
                onClick={() =>setDrawingMode('line')}
                disabled={!connected}
              >
                Line</Button><Button
                size="sm"
                variant={drawingMode === 'polygon' ? 'default' : 'outline'}
                onClick={() =>setDrawingMode('polygon')}
                disabled={!connected}
              >
                Polygon</Button></div>{drawingMode !== 'none' && (<div className="text-xs text-muted-foreground mt-2">Click on map to draw {drawingMode}</div>)}</CardContent></Card></div>{/* Status Indicators */}<div className="absolute top-4 right-4"><div className="flex flex-col gap-2">{!isLoaded &&<Badge variant="secondary">Loading map...</Badge>}
          {userCursors.length >0 && (<Badge variant="outline"><Cursor className="h-3 w-3 mr-1" />{userCursors.length} active cursors</Badge>)}
          {annotations.length > 0 && (<Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{annotations.length} annotations</Badge>)}</div></div>{/* Map Loading Overlay */}
      {!isLoaded && (<div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div><div className="text-sm text-muted-foreground">Loading collaborative map...</div></div></div>)}</div>
  );
}
