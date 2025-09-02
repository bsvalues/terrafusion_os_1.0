import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Users, MapPin, Layers, Edit3, Ruler, Hand, PenTool, MousePointer  } from '@mui/icons-material';
import { useEnhancedWebSocket } from '../../hooks/use-enhanced-websocket';
import { CollaborativeUser } from '../../lib/websocket-session-manager';
import { MessageTypeEnum } from '../../lib/websocket';
import { useMapbox } from '../../hooks/use-mapbox';
import { cn } from '../../lib/utils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CollaborativeMapProps {
  roomId?: string;
  username?: string;
  showCollaborators?: boolean;
  showControls?: boolean;
  showLayerControls?: boolean;
  allowDrawing?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  className?: string;
}

export function CollaborativeMap({
  roomId = 'map-room',
  username,
  showCollaborators = true,
  showControls = true,
  showLayerControls = true,
  allowDrawing = true,
  initialCenter = [-123.1187, 44.0521], // Default: Benton County, Oregon
  initialZoom = 11,
  height = '600px',
  className
}: CollaborativeMapProps) {
  // Initialize map with Mapbox
  const [activeMode, setActiveMode] = useState<string>('view');
  const [showingUsers, setShowingUsers] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  
  // Cursor position reference for real-time tracking
  const cursorPositionRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });
  
  // Enhanced WebSocket hook for collaboration
  const {
    status,
    roomUsers,
    joinRoom,
    leaveRoom,
    sendCursorPosition,
    currentRoomData
  } = useEnhancedWebSocket({
    roomId,
    username,
    autoJoin: true
  });

  // Initialize Mapbox map
  const { map, mapContainer } = useMapbox({
    center: initialCenter,
    zoom: initialZoom,
    style: 'mapbox://styles/mapbox/streets-v12'
  });

  // Set up map event listeners when map is loaded
  useEffect(() => {
    if (!map) return;
    
    const onMapLoad = () => {
      console.log('Map loaded');
      setMapLoaded(true);
      
      // Add cursor move event listener for collaborative cursor tracking
      map.on('mousemove', (e: mapboxgl.MapMouseEvent) => {
        cursorPositionRef.current = { x: e.point.x, y: e.point.y };
        
        // Send cursor position to other users at most every 50ms
        // This will be throttled by the actual implementation
        if (status === 'connected' && currentRoomData) {
          sendCursorPosition(e.lngLat.lng, e.lngLat.lat);
        }
      });
    };
    
    if (map.loaded()) {
      onMapLoad();
    } else {
      map.on('load', onMapLoad);
    }
    
    return () => {
      if (map) {
        map.off('load', onMapLoad);
        map.off('mousemove');
      }
    };
  }, [map, status, currentRoomData, sendCursorPosition]);
  
  // Change active mode
  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    
    // Change cursor based on mode
    if (map) {
      switch (mode) {
        case 'measure':
          map.getCanvas().style.cursor = 'crosshair';
          break;
        case 'draw':
          map.getCanvas().style.cursor = 'crosshair';
          break;
        case 'annotate':
          map.getCanvas().style.cursor = 'text';
          break;
        case 'select':
          map.getCanvas().style.cursor = 'pointer';
          break;
        case 'pan':
        default:
          map.getCanvas().style.cursor = 'grab';
          break;
      }
    }
  };
  
  // Toggle user list visibility
  const toggleUsers = () => {
    setShowingUsers(!showingUsers);
  };
  
  return (
    <div className={cn("relative", className)}>
      <div 
        ref={mapContainer} 
        className="w-full rounded-md overflow-hidden"
        style={{ height }}
      />
      
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <Card className="shadow-md">
            <CardContent className="p-2">
              <div className="flex flex-col gap-2">
                <Button
                  variant={activeMode === 'view' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('view')}
                  title="Pan & Zoom"
                ><>

                  <Hand className="h-4 w-4" />
                </Button>
                <Button
</>

                  variant={activeMode === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('select')}
                  title="Select Features"
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
                {allowDrawing && (
                  <Button
                    variant={activeMode === 'draw' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('draw')}
                    title="Draw Features"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant={activeMode === 'measure' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('measure')}
                  title="Measure Distance"
                ><>

                  <Ruler className="h-4 w-4" />
                </Button>
                <Button
</>

                  variant={activeMode === 'annotate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('annotate')}
                  title="Add Annotation"
                >
                  <PenTool className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Layer Controls */}
      {showLayerControls && (
        <div className="absolute top-4 right-4 z-10">
          <Card className="shadow-md">
            <CardContent className="p-2">
              <Button
                variant="outline"
                size="sm"
                title="Layer Controls"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Collaborator Controls */}
      {showCollaborators && (
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="shadow-md">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleUsers}
                  className="relative"
                  title="Collaborators"
                >
                  <Users className="h-4 w-4" />
                  {roomUsers.length > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                      variant="default"
                    >
                      {roomUsers.length}
                    </Badge>
                  )}
                </Button>
                
                {showingUsers && (
                  <div className="bg-background border rounded-md p-2 shadow-md ml-2">
                    <h4 className="text-xs font-medium mb-1">Collaborators</h4>
                    {roomUsers.length > 0 ? (
                      <ul className="space-y-1">
                        {roomUsers.map((user) => (
                          <li key={user.id} className="flex items-center gap-1 text-xs">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            {user.username || `User ${user.id.substring(0, 4)}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No other users</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Add user cursors from other collaborators here */}
      {showCollaborators && roomUsers.map((user) => (
        user.cursor && (
          <CollaborativeCursor 
            key={user.id}
            user={user}
            mapLoaded={mapLoaded}
            map={map}
          />
        )
      ))}
    </div>
  );
}

// Collaborative cursor component to show other users' cursors
interface CollaborativeCursorProps {
  user: CollaborativeUser;
  mapLoaded: boolean;
  map: mapboxgl.Map | null;
}

function CollaborativeCursor({ user, mapLoaded, map }: CollaborativeCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapLoaded || !map || !user.cursor || !cursorRef.current) return;
    
    const updateCursorPosition = () => {
      if (!map || !cursorRef.current || !user.cursor) return;
      
      // Convert geographic coordinates to pixel coordinates
      const pixelPosition = map.project([user.cursor.lng, user.cursor.lat]);
      
      // Position the cursor element
      cursorRef.current.style.left = `${pixelPosition.x}px`;
      cursorRef.current.style.top = `${pixelPosition.y}px`;
    };
    
    // Initial positioning
    updateCursorPosition();
    
    // Update cursor position when the map moves
    map.on('move', updateCursorPosition);
    map.on('zoom', updateCursorPosition);
    
    return () => {
      map.off('move', updateCursorPosition);
      map.off('zoom', updateCursorPosition);
    };
  }, [mapLoaded, map, user.cursor]);
  
  if (!user.cursor) return null;
  
  return (
    <div 
      ref={cursorRef}
      className="absolute z-20 pointer-events-none"
      style={{ 
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="flex flex-col items-center">
        <div className="text-primary"><>

          <MousePointer className="h-4 w-4" />
        </div>
        <div
</>
className="px-1 py-0.5 bg-primary text-primary-foreground text-[10px] rounded">
          {user.username || `User ${user.id.substring(0, 4)}`}
        </div>
      </div>
    </div>
  );
}