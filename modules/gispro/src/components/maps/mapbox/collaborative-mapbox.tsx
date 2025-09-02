import React, { useEffect, useState, useCallback } from 'react';
import { MapboxProvider, useMapbox } from './mapbox-provider';
import { useEnhancedWebSocket, MessageTypeEnum, WebSocketMessage } from '@/hooks/use-enhanced-websocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pointer, Users, MessageSquare, Edit3, Layers, MapPin  } from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';

// Types
interface MapCursor {
  userId: string;
  username: string;
  position: {
    x?: number;
    y?: number;
    lng?: number;
    lat?: number;
  };
  timestamp: number;
}

interface MapDrawing {
  id: string;
  userId: string;
  username: string;
  type: 'point' | 'line' | 'polygon' | 'rectangle' | 'circle' | 'marker';
  coordinates: any;
  properties?: Record<string, any>;
  timestamp: number;
}

interface CollaborativeMapboxProps {
  roomId: string;
  roomName?: string;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  height?: string;
  showControls?: boolean;
  showUsers?: boolean;
}

// Map cursor markers component
const MapCursors: React.FC<{
  cursors: Record<string, MapCursor>;
}> = ({ cursors }) => {
  const { map, isLoaded } = useMapbox();
  const [markers, setMarkers] = useState<Record<string, mapboxgl.Marker>>({});

  // Update or create cursor markers when cursors change
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Create/update markers for current cursors
    const updatedMarkers = { ...markers };

    Object.entries(cursors).forEach(([userId, cursor]) => {
      if (!cursor.position.lng || !cursor.position.lat) return;
      
      if (updatedMarkers[userId]) {
        // Update existing marker
        updatedMarkers[userId].setLngLat([cursor.position.lng, cursor.position.lat]);
      } else {
        // Create marker element
        const el = document.createElement('div');
        el.className = 'cursor-marker';
        el.innerHTML = `
          <div class="flex flex-col items-center">
            <div class="text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pointer"><>

                <path d="M22 14a8 8 0 0 1-8 8"></path>
                <path
</>
d="M18 11v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><>

                <path d="M14 10V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"></path>
                <path
</>
d="M10 9.5V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10"></path>
                <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
              </svg>
            </div>
            <span class="text-xs bg-background px-2 py-1 rounded shadow-sm">${cursor.username}</span>
          </div>
        `;
        
        // Create new marker
        updatedMarkers[userId] = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom'
        })
          .setLngLat([cursor.position.lng, cursor.position.lat])
          .addTo(map);
      }
    });

    // Remove markers for users that are no longer present
    Object.keys(markers).forEach(userId => {
      if (!cursors[userId]) {
        markers[userId].remove();
        delete updatedMarkers[userId];
      }
    });

    setMarkers(updatedMarkers);

    // Cleanup function
    return () => {
      Object.values(updatedMarkers).forEach(marker => marker.remove());
    };
  }, [map, isLoaded, cursors, markers]);

  return null; // Rendering is handled by mapbox markers
};

// Map drawings component
const MapDrawings: React.FC<{
  drawings: MapDrawing[];
}> = ({ drawings }) => {
  const { map, isLoaded } = useMapbox();
  
  // Add drawings to the map when they change
  useEffect(() => {
    if (!map || !isLoaded || !drawings.length) return;
    
    // Ensure source exists
    if (!map.getSource('drawings-source')) {
      map.addSource('drawings-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      // Add layers for different drawing types
      map.addLayer({
        id: 'drawings-points',
        type: 'circle',
        source: 'drawings-source',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 6,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      map.addLayer({
        id: 'drawings-lines',
        type: 'line',
        source: 'drawings-source',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3
        }
      });
      
      map.addLayer({
        id: 'drawings-polygons',
        type: 'fill',
        source: 'drawings-source',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.4,
          'fill-outline-color': '#ffffff'
        }
      });
    }
    
    // Convert drawings to GeoJSON
    const features = drawings.map(drawing => {
      let geometry: any;
      
      switch (drawing.type) {
        case 'point':
          geometry = {
            type: 'Point',
            coordinates: [drawing.coordinates.lng, drawing.coordinates.lat]
          };
          break;
        case 'line':
          geometry = {
            type: 'LineString',
            coordinates: drawing.coordinates.map((point: any) => [point.lng, point.lat])
          };
          break;
        case 'polygon':
          geometry = {
            type: 'Polygon',
            coordinates: [drawing.coordinates.map((point: any) => [point.lng, point.lat])]
          };
          break;
        default:
          geometry = {
            type: 'Point',
            coordinates: [drawing.coordinates.lng, drawing.coordinates.lat]
          };
      }
      
      return {
        type: 'Feature',
        geometry,
        properties: {
          id: drawing.id,
          userId: drawing.userId,
          username: drawing.username,
          color: drawing.properties?.color || '#FF5733',
          label: drawing.properties?.label || `${drawing.type} by ${drawing.username}`
        }
      };
    });
    
    // Update the GeoJSON source
    const source = map.getSource('drawings-source') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [map, isLoaded, drawings]);
  
  return null; // Rendering is handled by mapbox layers
};

// Main Collaborative Mapbox component
export const CollaborativeMapbox: React.FC<CollaborativeMapboxProps> = ({
  roomId,
  roomName = 'Collaborative Map',
  initialViewState = { longitude: -121.3153, latitude: 44.0582, zoom: 13 },
  height = '600px',
  showControls = true,
  showUsers = true
}) => {
  const [userCursors, setUserCursors] = useState<Record<string, MapCursor>>({});
  const [drawings, setDrawings] = useState<MapDrawing[]>([]);
  
  // Initialize WebSocket
  const {
    send,
    status,
    messages,
    joinRoom,
    leaveRoom,
    currentRoom,
    connected,
    userId,
    username
  } = useEnhancedWebSocket({
    reconnectInterval: 3000,
    reconnectAttempts: 5
  });
  
  // Join the room when component mounts
  useEffect(() => {
    if (connected && !currentRoom) {
      joinRoom(roomId, roomName, 'map');
    }
    
    return () => {
      if (currentRoom === roomId) {
        leaveRoom(roomId);
      }
    };
  }, [connected, currentRoom, joinRoom, leaveRoom, roomId, roomName]);
  
  // Handle map loaded
  const handleMapLoaded = useCallback((map: mapboxgl.Map) => {
    // Add navigation control
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Set up click handler for map
    map.on('click', (e) => {
      if (!currentRoom) return;
      
      // Send click location as a drawing
      const point: MapDrawing = {
        id: `point-${Date.now()}`,
        userId,
        username,
        type: 'point',
        coordinates: { lng: e.lngLat.lng, lat: e.lngLat.lat },
        properties: {
          color: '#FF5733',
          label: `Point by ${username}`
        },
        timestamp: Date.now()
      };
      
      sendDrawing(point);
    });
    
    // Track cursor movement
    map.on('mousemove', (e) => {
      if (!currentRoom) return;
      
      sendCursorPosition(e.lngLat.lng, e.lngLat.lat);
    });
  }, [currentRoom, userId, username]);
  
  // Send cursor position
  const sendCursorPosition = useCallback((lng: number, lat: number) => {
    if (!currentRoom) return;
    
    send({
      type: MessageTypeEnum.CURSOR_POSITION,
      roomId: currentRoom,
      userId,
      username,
      payload: {
        position: { lng, lat },
        timestamp: Date.now()
      }
    });
  }, [currentRoom, send, userId, username]);
  
  // Send drawing
  const sendDrawing = useCallback((drawing: MapDrawing) => {
    if (!currentRoom) return;
    
    send({
      type: MessageTypeEnum.DRAWING,
      roomId: currentRoom,
      userId,
      username,
      payload: drawing
    });
    
    setDrawings(prev => [...prev, drawing]);
  }, [currentRoom, send, userId, username]);
  
  // Create a function to create lines and polygons
  const createShape = useCallback((type: 'line' | 'polygon') => {
    if (!currentRoom) return;
    
    // Create sample shapes (in real app, this would come from drawing interaction)
    const randomOffset = () => (Math.random() - 0.5) * 0.01;
    
    const center = {
      lng: initialViewState.longitude,
      lat: initialViewState.latitude
    };
    
    const shape: MapDrawing = {
      id: `${type}-${Date.now()}`,
      userId,
      username,
      type,
      coordinates: type === 'line' 
        ? [
            { lng: center.lng + randomOffset(), lat: center.lat + randomOffset() },
            { lng: center.lng + randomOffset(), lat: center.lat + randomOffset() }
          ]
        : [
            { lng: center.lng + randomOffset(), lat: center.lat + randomOffset() },
            { lng: center.lng + randomOffset(), lat: center.lat + randomOffset() },
            { lng: center.lng + randomOffset(), lat: center.lat + randomOffset() },
            { lng: center.lng + randomOffset(), lat: center.lat + randomOffset() }
          ],
      properties: {
        color: type === 'line' ? '#3498db' : '#2ecc71',
        label: `${type} by ${username}`
      },
      timestamp: Date.now()
    };
    
    sendDrawing(shape);
  }, [currentRoom, initialViewState, sendDrawing, userId, username]);
  
  // Process incoming messages
  useEffect(() => {
    // Handle the last message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    
    if (lastMessage.type === MessageTypeEnum.CURSOR_POSITION && lastMessage.userId !== userId) {
      setUserCursors(prev => ({
        ...prev,
        [lastMessage.userId || 'unknown']: {
          userId: lastMessage.userId || 'unknown',
          username: lastMessage.username || 'Unknown user',
          position: lastMessage.payload?.position || {},
          timestamp: lastMessage.payload?.timestamp || Date.now()
        }
      }));
    } else if (lastMessage.type === MessageTypeEnum.DRAWING && lastMessage.userId !== userId) {
      setDrawings(prev => [...prev, lastMessage.payload]);
    }
  }, [messages, userId]);
  
  // Clean up old cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setUserCursors(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          // Remove cursors older than 5 seconds
          if (now - updated[key].timestamp > 5000) {
            delete updated[key];
          }
        });
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative w-full" style={{ height }}>
      {showControls && (
        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 p-2 bg-background/90 rounded shadow">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center gap-1"><>

              <Users className="h-3 w-3" />
              {Object.keys(userCursors).length + 1} user(s)
            </Badge>
            
            <Badge
</>

              variant={currentRoom ? 'default' : 'secondary'}
            >
              {currentRoom ? `Room: ${roomName}` : 'Not connected'}
            </Badge>
          </div>
          
          {currentRoom && (
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => createShape('line')}
                title="Add line"
              ><>

                <Edit3 className="h-4 w-4 mr-1" />
                Line
              </Button>
              
              <Button
</>

                size="sm" 
                variant="outline"
                onClick={() => createShape('polygon')}
                title="Add polygon"
              >
                <Layers className="h-4 w-4 mr-1" />
                Polygon
              </Button>
            </div>
          )}
        </div>
      )}
      
      <MapboxProvider 
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        onMapLoaded={handleMapLoaded}
      >
        <MapCursors cursors={userCursors} />
        <MapDrawings drawings={drawings} />
      </MapboxProvider>
      
      {showUsers && Object.keys(userCursors).length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 p-2 bg-background/90 rounded shadow max-w-[200px]">
          <div className="text-xs font-semibold mb-1 flex items-center"><>

            <Users className="h-3 w-3 mr-1" />
            Active Users:
          </div>
          <div
</>
className="space-y-1 max-h-[120px] overflow-y-auto">
            {Object.values(userCursors).map((cursor) => (
              <div key={cursor.userId} className="flex items-center text-xs"><>

                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                <span
</>
className="truncate">{cursor.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeMapbox;