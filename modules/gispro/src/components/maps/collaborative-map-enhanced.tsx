import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import useMapboxToken from '@/hooks/use-mapbox-token';
import { useWebSocket } from '@/hooks/use-websocket';
import { ConnectionStatusEnum } from '@/lib/websocket';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest } from '@/lib/queryClient';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// Define CollaborativeFeature interface
export interface CollaborativeFeature {
  id: string;
  geometry: any;
  properties: any;
  type: string;
  userId?: string;
  timestamp?: string;
}

// Collaborative Map Props
export interface CollaborativeMapProps {
  roomId: string;
  onConnectionStatusChange?: (status: ConnectionStatusEnum) => void;
  onCollaboratorsChange?: (users: string[]) => void;
  onFeaturesUpdate?: (features: CollaborativeFeature[]) => void;
  onAnnotationsUpdate?: (annotations: any[]) => void;
  onUserActivity?: (userId: string, activityType: "drawing" | "editing" | "viewing" | "idle", data?: any) => void;
  onParcelClick?: (parcelId: number) => void;
}

/**
 * Collaborative Map Component
 * 
 * This component adds real-time collaboration features to Mapbox maps
 */
export function CollaborativeMap({
  roomId,
  onConnectionStatusChange,
  onCollaboratorsChange,
  onFeaturesUpdate,
  onAnnotationsUpdate,
  onUserActivity,
  onParcelClick,
}: CollaborativeMapProps) {
  // Get token using the custom hook
  const { token, isLoading, error } = useMapboxToken();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [userId] = useState<string>(uuidv4());
  const [features, setFeatures] = useState<CollaborativeFeature[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const drawingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  const { 
    sendMessage, 
    lastMessage, 
    status 
  } = useWebSocket({
    path: `/ws`, // Use the base path to match the server configuration
    autoConnect: true,
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 2000
  });
  
  // Map status to ConnectionStatusEnum
  const connectionStatus = (() => {
    switch (status) {
      case 'connected': return ConnectionStatusEnum.CONNECTED;
      case 'connecting': return ConnectionStatusEnum.CONNECTING;
      case 'reconnecting': return ConnectionStatusEnum.RECONNECTING;
      case 'disconnected': 
      default: 
        return ConnectionStatusEnum.DISCONNECTED;
    }
  })();

  // Utility function to fetch parcel data
  const fetchParcels = async (mapInstance: mapboxgl.Map) => {
    try {
      // Fetch parcels from API
      const response = await apiRequest('GET', '/api/parcels');
      const parcels = await response.json();
      
      if (parcels && parcels.length > 0) {
        // Convert to GeoJSON format
        const features = parcels.map((parcel: any) => ({
          type: 'Feature',
          properties: {
            id: parcel.id,
            parcelId: parcel.id,
            parcelNumber: parcel.parcelNumber,
            owner: parcel.owner,
            address: parcel.address,
            isSelected: false
          },
          geometry: parcel.geometry
        }));
        
        // Update the source data if the map is still available
        if (mapInstance && mapInstance.getSource('parcels')) {
          (mapInstance.getSource('parcels') as mapboxgl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features
          });
        }
      }
    } catch (err) {
      console.error('Error fetching parcels:', err);
    }
  };
  
  // Utility function to mark a parcel as selected
  const markParcelAsSelected = (mapInstance: mapboxgl.Map, parcelId: number) => {
    if (!mapInstance || !mapInstance.getSource('parcels')) return;
    
    // Get current data
    const source = mapInstance.getSource('parcels') as mapboxgl.GeoJSONSource;
    const data = (source as any)._data as { features: any[] };
    
    if (!data || !data.features) return;
    
    // Update selection state in properties
    const updatedFeatures = data.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        isSelected: feature.properties.parcelId === parcelId
      }
    }));
    
    // Update the source data
    source.setData({
      type: 'FeatureCollection',
      features: updatedFeatures
    });
  };

  // Initialize map
  useEffect(() => {
    if (!token || isLoading || error || !mapContainerRef.current || mapInitialized) {
      return;
    }

    try {
      console.log('Initializing map with token');
      mapboxgl.accessToken = token;

      // Create a new map instance
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-123.3617, 44.5646], // Benton County, Oregon
        zoom: 10,
      });

      // Save the map instance and set initialized flag
      mapRef.current = newMap;
      setMap(newMap);

      // Setup event listeners on map load
      newMap.on('load', () => {
        console.log('Map loaded successfully');

        // Initialize the draw control
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            point: true,
            line_string: true,
            polygon: true,
            trash: true,
          },
        });

        // Add draw controls to the map
        newMap.addControl(draw, 'top-right');
        drawRef.current = draw;

        // Add a source for parcel data
        newMap.addSource('parcels', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        // Add a layer for parcel outlines
        newMap.addLayer({
          id: 'parcel-boundaries',
          type: 'line',
          source: 'parcels',
          layout: {},
          paint: {
            'line-color': '#3388ff',
            'line-width': 2,
          },
        });

        // Add a layer for parcel fills
        newMap.addLayer({
          id: 'parcel-fills',
          type: 'fill',
          source: 'parcels',
          layout: {},
          paint: {
            'fill-color': '#3388ff',
            'fill-opacity': 0.1,
            'fill-outline-color': '#3388ff',
          },
        });

        // Add a highlighted layer for selected parcels
        newMap.addLayer({
          id: 'selected-parcels',
          type: 'fill',
          source: 'parcels',
          layout: {},
          paint: {
            'fill-color': '#ff9900',
            'fill-opacity': 0.4,
          },
          filter: ['==', 'isSelected', true],
        });

        // Fetch parcel data when the map loads
        fetchParcels(newMap);

        // Add click handler for parcels
        newMap.on('click', 'parcel-fills', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const parcelId = feature.properties?.parcelId || feature.properties?.id;
            
            if (parcelId && onParcelClick) {
              // Mark this parcel as selected
              markParcelAsSelected(newMap, parseInt(parcelId));
              
              // Notify parent about the selection
              onParcelClick(parseInt(parcelId));
              
              // Broadcast selection to all collaborators
              const allFeatures = drawRef.current?.getAll();
              if (allFeatures) {
                const collaborativeFeatures = [...features]; // Start with existing features
                
                // Add selection feature
                collaborativeFeatures.push({
                  id: `selected-parcel-${parcelId}`,
                  geometry: feature.geometry,
                  properties: {
                    ...feature.properties,
                    isSelected: true,
                    parcelId: parcelId,
                  },
                  type: 'Feature',
                  userId: userId,
                  timestamp: new Date().toISOString()
                });
                
                // Update the feature collection and notify parent
                setFeatures(collaborativeFeatures);
                if (onFeaturesUpdate) {
                  onFeaturesUpdate(collaborativeFeatures);
                }
                
                // Send to collaborators
                sendMessage(JSON.stringify({
                  type: 'features',
                  roomId: roomId,
                  features: collaborativeFeatures,
                  userId: userId
                }));
              }
            }
          }
        });

        // Change the cursor to a pointer when hovering over parcels
        newMap.on('mouseenter', 'parcel-fills', () => {
          newMap.getCanvas().style.cursor = 'pointer';
        });
        
        // Change back to default cursor when leaving parcels
        newMap.on('mouseleave', 'parcel-fills', () => {
          newMap.getCanvas().style.cursor = '';
        });

        // Listen for drawing events
        newMap.on('draw.create', (e) => handleDrawEvent('create', e));
        newMap.on('draw.update', (e) => handleDrawEvent('update', e));
        newMap.on('draw.delete', (e) => handleDrawEvent('delete', e));
        newMap.on('draw.selectionchange', (e) => handleDrawEvent('selection', e));
        newMap.on('mousemove', () => {
          // Track user movement for activity indicators
          if (drawingTimeoutRef.current) {
            clearTimeout(drawingTimeoutRef.current);
          }
          
          sendActivityUpdate('viewing');
          
          // Set a timeout to revert to idle after no movement
          drawingTimeoutRef.current = setTimeout(() => {
            sendActivityUpdate('idle');
          }, 5000); // 5 seconds with no movement = idle
        });
        
        setMapInitialized(true);
      });

      // Clean up on unmount
      return () => {
        if (drawingTimeoutRef.current) {
          clearTimeout(drawingTimeoutRef.current);
        }
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        if (mapRef.current) {
          mapRef.current.remove();
        }
      };
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }, [token, isLoading, error, mapInitialized, fetchParcels, markParcelAsSelected, onParcelClick, userId, features, roomId, sendMessage, onFeaturesUpdate]);

  // Handle draw events
  const handleDrawEvent = useCallback((type: string, event: any) => {
    if (!drawRef.current || !mapRef.current) return;
    
    console.log(`Draw event: ${type}`, event);
    
    // Only send updates for create and update events
    if (type === 'create' || type === 'update') {
      // Get all features from the draw control
      const allFeatures = drawRef.current.getAll();
      
      // Convert to our internal format
      const collaborativeFeatures = allFeatures.features.map(feature => ({
        id: feature.id as string,
        geometry: feature.geometry,
        properties: feature.properties || {},
        type: 'Feature',
        userId: userId,
        timestamp: new Date().toISOString()
      }));
      
      // Update local state
      setFeatures(collaborativeFeatures);
      
      // Send update to other collaborators
      sendMessage(JSON.stringify({
        type: 'features',
        roomId: roomId, // Include roomId to identify the collaboration space
        features: collaborativeFeatures,
        userId: userId
      }));
      
      // Notify parent about the update
      if (onFeaturesUpdate) {
        onFeaturesUpdate(collaborativeFeatures);
      }
      
      // Update user activity
      sendActivityUpdate('drawing', { featureCount: collaborativeFeatures.length });
    } else if (type === 'delete') {
      // Handle delete operation
      const allFeatures = drawRef.current.getAll();
      
      // Convert to our internal format
      const collaborativeFeatures = allFeatures.features.map(feature => ({
        id: feature.id as string,
        geometry: feature.geometry,
        properties: feature.properties || {},
        type: 'Feature',
        userId: userId,
        timestamp: new Date().toISOString()
      }));
      
      // Update local state
      setFeatures(collaborativeFeatures);
      
      // Send update to other collaborators
      sendMessage(JSON.stringify({
        type: 'features',
        roomId: roomId, // Include roomId to identify the collaboration space
        features: collaborativeFeatures,
        userId: userId
      }));
      
      // Notify parent about the update
      if (onFeaturesUpdate) {
        onFeaturesUpdate(collaborativeFeatures);
      }
    }
  }, [userId, roomId, sendMessage, onFeaturesUpdate]);

  // Send activity update
  const sendActivityUpdate = useCallback((activityType: "drawing" | "editing" | "viewing" | "idle", data?: any) => {
    // Send activity update to server for other users
    sendMessage(JSON.stringify({
      type: 'activity',
      roomId: roomId, // Include roomId to identify the collaboration space
      activityType,
      userId,
      data
    }));
    
    // Notify parent component
    if (onUserActivity) {
      onUserActivity(userId, activityType, data);
    }
  }, [userId, roomId, sendMessage, onUserActivity]);

  // Handle connection status changes
  useEffect(() => {
    if (onConnectionStatusChange) {
      onConnectionStatusChange(connectionStatus);
    }
    
    // Initialize heartbeat when connected
    if (connectionStatus === ConnectionStatusEnum.CONNECTED) {
      // Set up heartbeat interval
      heartbeatIntervalRef.current = setInterval(() => {
        sendMessage(JSON.stringify({ 
          type: 'heartbeat', 
          roomId: roomId,
          userId 
        }));
      }, 30000); // 30 second heartbeat
      
      // Initial state sync request
      sendMessage(JSON.stringify({ 
        type: 'sync_request',
        roomId: roomId,
        userId 
      }));
    } else if (heartbeatIntervalRef.current) {
      // Clear heartbeat interval when disconnected
      clearInterval(heartbeatIntervalRef.current);
    }
  }, [connectionStatus, sendMessage, userId, roomId, onConnectionStatusChange]);

  // Process incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        // Extract data from the message
        const data = lastMessage.data;
        
        console.log('Processing WebSocket message:', data);
        
        if (!data || typeof data !== 'object') {
          console.warn('Invalid message format:', lastMessage);
          return;
        }
        
        switch(data.type) {
          case 'features':
            // Update features from other collaborators
            if (data.features && Array.isArray(data.features)) {
              setFeatures(data.features);
              
              // Update draw control if the features weren't created by this user
              if (drawRef.current && mapRef.current && data.userId !== userId) {
                // Clear existing features first
                const currentFeatures = drawRef.current.getAll();
                currentFeatures.features.forEach(feature => {
                  drawRef.current?.delete(feature.id as string);
                });
                
                // Add new features
                data.features.forEach((feature: CollaborativeFeature) => {
                  if (feature.geometry) {
                    drawRef.current?.add({
                      id: feature.id,
                      type: 'Feature' as 'Feature',
                      geometry: feature.geometry,
                      properties: feature.properties || {}
                    });
                  }
                });
              }
              
              // Notify parent component
              if (onFeaturesUpdate) {
                onFeaturesUpdate(data.features);
              }
            }
            break;
            
          case 'annotations':
            // Handle annotations from collaborators
            if (data.annotations && Array.isArray(data.annotations)) {
              setAnnotations(data.annotations);
              
              // Notify parent component
              if (onAnnotationsUpdate) {
                onAnnotationsUpdate(data.annotations);
              }
            }
            break;
            
          case 'users':
            // Update collaborator list
            if (data.users && Array.isArray(data.users)) {
              const filteredUsers = data.users.filter((id: string) => id !== userId);
              setCollaborators(filteredUsers);
              
              if (onCollaboratorsChange) {
                onCollaboratorsChange(filteredUsers);
              }
            }
            break;
            
          case 'activity':
            // Process activity updates from other users
            if (data.userId && data.userId !== userId && data.activityType && onUserActivity) {
              onUserActivity(data.userId, data.activityType, data.data);
            }
            break;
            
          case 'sync_response':
            // Handle sync response with current state
            if (data.features && Array.isArray(data.features)) {
              setFeatures(data.features);
              
              // Update draw control
              if (drawRef.current && mapRef.current) {
                // Clear existing features first
                const currentFeatures = drawRef.current.getAll();
                currentFeatures.features.forEach(feature => {
                  drawRef.current?.delete(feature.id as string);
                });
                
                // Add synced features
                data.features.forEach((feature: CollaborativeFeature) => {
                  if (feature.geometry) {
                    drawRef.current?.add({
                      id: feature.id,
                      type: 'Feature' as 'Feature',
                      geometry: feature.geometry,
                      properties: feature.properties || {}
                    });
                  }
                });
              }
              
              // Notify parent component
              if (onFeaturesUpdate) {
                onFeaturesUpdate(data.features);
              }
            }
            
            if (data.annotations && Array.isArray(data.annotations)) {
              setAnnotations(data.annotations);
              
              // Notify parent component
              if (onAnnotationsUpdate) {
                onAnnotationsUpdate(data.annotations);
              }
            }
            break;
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
        console.error('Message content:', lastMessage.data);
      }
    }
  }, [lastMessage, userId, onFeaturesUpdate, onAnnotationsUpdate, onCollaboratorsChange, onUserActivity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center"><>

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p
</> className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Convert the error to a string for safe rendering
    const errorMessage: ReactNode = error instanceof Error 
      ? error.message 
      : typeof error === 'object'
        ? JSON.stringify(error)
        : String(error);
        
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md p-4"><>

          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <h3
</> className="font-semibold text-lg mb-2">Could not load map</h3><>

          <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
          <p
</> className="text-xs text-gray-500">
            Please check your internet connection and try again. If the problem persists, ensure you have a valid Mapbox access token.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-md overflow-hidden" />
  );
}

export default CollaborativeMap;