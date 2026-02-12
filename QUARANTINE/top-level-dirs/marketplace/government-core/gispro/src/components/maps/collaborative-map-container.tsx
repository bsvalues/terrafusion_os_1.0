import { useState, useCallback, useEffect } from 'react';
import { CollaborativeMap, CollaborativeFeature } from './collaborative-map-enhanced';
import { MapboxMap } from './mapbox/mapbox-map';
import { MapProviderSelector, MapProviderType } from './map-provider-selector';
import mapboxgl from 'mapbox-gl';
import { ConnectionStatusEnum } from '@/lib/websocket';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Loader2, WifiOff  } from '@mui/icons-material';
import { CollaborativeSessionManager, SessionData } from './collaborative-session-manager';
import { CollaborativeUserIndicator, UserActivity } from './collaborative-user-indicator';

interface CollaborativeMapContainerProps {
  roomId: string;
  height?: string | number;
  onMapUpdated?: (map: mapboxgl.Map | __esri.MapView) => void;
  defaultProvider?: MapProviderType;
  onParcelSelected?: (parcelId: number) => void;
}

export function CollaborativeMapContainer({ 
  roomId, 
  height = '500px',
  onMapUpdated,
  defaultProvider = 'mapbox',
  onParcelSelected
}: CollaborativeMapContainerProps) {
  const [map, setMap] = useState<mapboxgl.Map | any>(null);
  const [mapProvider, setMapProvider] = useState<MapProviderType>(defaultProvider);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusEnum>(ConnectionStatusEnum.DISCONNECTED);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [features, setFeatures] = useState<CollaborativeFeature[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);

  // Handle Mapbox map creation
  const handleMapboxMapCreated = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);
    setMapProvider('mapbox');
    
    // Call the parent's callback if provided
    if (onMapUpdated) {
      onMapUpdated(mapInstance);
    }
  }, [onMapUpdated]);
  
  // Handle ArcGIS map creation
  const handleArcGISMapCreated = useCallback((view: any) => {
    setMap(view);
    setMapProvider('arcgis');
    
    // Call the parent's callback if provided
    if (onMapUpdated) {
      onMapUpdated(view);
    }
  }, [onMapUpdated]);

  // Handle connection status change
  const handleConnectionStatusChange = useCallback((status: ConnectionStatusEnum) => {
    setConnectionStatus(status);
    
    // Show toast notification for connection changes
    if (status === ConnectionStatusEnum.CONNECTED) {
      toast({
        title: "Connected to collaboration server",
        description: "You can now draw and collaborate with others",
        variant: "default",
      });
    } else if (status === ConnectionStatusEnum.DISCONNECTED) {
      toast({
        title: "Disconnected from collaboration server",
        description: "Attempting to reconnect automatically",
        variant: "destructive",
      });
    }
  }, []);

  // Handle collaborators update
  const handleCollaboratorsChange = useCallback((users: string[]) => {
    setCollaborators(users);
    
    // Show toast for new collaborators
    if (users.length > 0) {
      toast({
        title: "Collaborators present",
        description: `${users.length} people are currently collaborating`,
        variant: "default",
      });
    }
  }, []);
  
  // Handle features update
  const handleFeaturesUpdate = useCallback((updatedFeatures: CollaborativeFeature[]) => {
    setFeatures(updatedFeatures);
    
    // Check for parcel selection events
    if (onParcelSelected) {
      const selectedParcelFeature = updatedFeatures.find(
        feature => feature.properties?.isSelected && feature.properties?.parcelId
      );
      
      if (selectedParcelFeature?.properties?.parcelId) {
        onParcelSelected(parseInt(selectedParcelFeature.properties.parcelId));
      }
    }
  }, [onParcelSelected]);
  
  // Handle annotations update
  const handleAnnotationsUpdate = useCallback((updatedAnnotations: any[]) => {
    setAnnotations(updatedAnnotations);
  }, []);
  
  // Handle user activity update
  const handleUserActivityUpdate = useCallback((userId: string, activityType: "drawing" | "editing" | "viewing" | "idle", data?: any) => {
    const timestamp = new Date();
    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    
    setUserActivities(prev => {
      // Find existing activity for this user
      const existingIndex = prev.findIndex(a => a.userId === userId);
      
      if (existingIndex >= 0) {
        // Update existing activity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          activityType,
          lastActivity: timestamp,
          data
        };
        return updated;
      } else {
        // Add new activity
        return [...prev, {
          userId,
          activityType,
          lastActivity: timestamp,
          color: randomColor,
          data
        }];
      }
    });
  }, []);
  
  // Clean up stale user activities (older than 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setUserActivities(prev => 
        prev.filter(activity => 
          now.getTime() - activity.lastActivity.getTime() < 10000
        )
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Initial map location (Benton County, Oregon)
  const initialCenter: [number, number] = [-123.3617, 44.5646];
  const initialZoom = 10;

  const containerStyle = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
    position: 'relative' as const,
  };

  // Get connection status icon
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case ConnectionStatusEnum.CONNECTED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ConnectionStatusEnum.CONNECTING:
      case ConnectionStatusEnum.RECONNECTING:
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case ConnectionStatusEnum.DISCONNECTED:
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Connection status badge variant
  const getStatusVariant = () => {
    switch (connectionStatus) {
      case ConnectionStatusEnum.CONNECTED:
        return "outline";
      case ConnectionStatusEnum.CONNECTING:
      case ConnectionStatusEnum.RECONNECTING:
        return "secondary";
      case ConnectionStatusEnum.DISCONNECTED:
        return "destructive";
      default:
        return "outline";
    }
  };

  // Connection status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatusEnum.CONNECTED:
        return "Connected";
      case ConnectionStatusEnum.CONNECTING:
        return "Connecting";
      case ConnectionStatusEnum.RECONNECTING:
        return "Reconnecting";
      case ConnectionStatusEnum.DISCONNECTED:
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  // Session save/load handlers
  const handleSessionSave = useCallback((name: string, description?: string) => {
    const sessionData: SessionData = {
      name,
      description,
      features,
      annotations,
      timestamp: new Date().toISOString(),
      center: map ? [map.getCenter().lng, map.getCenter().lat] : initialCenter,
      zoom: map ? map.getZoom() : initialZoom
    };
    
    // In a real app, we'd save this to a database
    localStorage.setItem(`map-session-${roomId}-${name}`, JSON.stringify(sessionData));
    
    toast({
      title: "Session saved",
      description: `Map session "${name}" has been saved`,
      variant: "default"
    });
    
    return sessionData;
  }, [features, annotations, map, roomId, initialCenter, initialZoom]);
  
  const handleSessionLoad = useCallback((sessionName: string) => {
    // In a real app, we'd load this from a database
    const savedSession = localStorage.getItem(`map-session-${roomId}-${sessionName}`);
    
    if (savedSession) {
      try {
        const sessionData: SessionData = JSON.parse(savedSession);
        
        // Update state with loaded data
        setFeatures(sessionData.features || []);
        setAnnotations(sessionData.annotations || []);
        
        // Update map position if available
        if (map && sessionData.center && sessionData.zoom) {
          map.flyTo({
            center: sessionData.center as [number, number],
            zoom: sessionData.zoom
          });
        }
        
        toast({
          title: "Session loaded",
          description: `Map session "${sessionName}" has been loaded`,
          variant: "default"
        });
        
        return sessionData;
      } catch (err) {
        console.error('Error loading session:', err);
        
        toast({
          title: "Error loading session",
          description: "The saved session data could not be loaded",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Session not found",
        description: `No saved session named "${sessionName}" was found`,
        variant: "destructive"
      });
    }
    
    return null;
  }, [map, roomId]);

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusVariant()} className="flex items-center space-x-1">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </Badge>
          
          {collaborators.length > 0 && (
            <Badge variant="outline" className="flex items-center">
              <span>{collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}</span>
            </Badge>
          )}
        </div>
        
        <Badge variant="outline" className="flex items-center">
          <span>Room: {roomId}</span>
        </Badge>
      </div>
      
      {/* Session manager */}
      <div className="flex items-start justify-between gap-2">
        <CollaborativeSessionManager 
          onSave={handleSessionSave}
          onLoad={handleSessionLoad}
          roomId={roomId}
        />
        
        {/* User activity indicator */}
        <CollaborativeUserIndicator 
          activities={userActivities} 
          collaborators={collaborators}
        />
      </div>
      
      {/* Map container */}
      <div style={containerStyle}>
        <MapProviderSelector
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          defaultProvider={defaultProvider}
          width="100%"
          height="100%"
          onMapboxMapCreated={handleMapboxMapCreated}
          onArcGISMapCreated={handleArcGISMapCreated}
        >
          {map && mapProvider === 'mapbox' && (
            <CollaborativeMap
              roomId={roomId} 
              onConnectionStatusChange={handleConnectionStatusChange}
              onCollaboratorsChange={handleCollaboratorsChange}
              onFeaturesUpdate={handleFeaturesUpdate}
              onAnnotationsUpdate={handleAnnotationsUpdate}
              onUserActivity={handleUserActivityUpdate}
              onParcelClick={onParcelSelected}
            />
          )}
          {map && mapProvider === 'arcgis' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <Card className="w-auto mx-4">
                <CardContent className="p-4 text-center"><>

                  <p>Collaborative features not yet implemented for ArcGIS maps.</p>
                  <p
</>
className="text-xs mt-1 text-muted-foreground">Switch to Mapbox for collaborative editing.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </MapProviderSelector>
      </div>
    </div>
  );
}