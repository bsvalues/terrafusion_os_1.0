import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket, MessageTypeEnum, ConnectionStatusEnum } from '@/lib/websocket';

// Drawing modes that match MapboxDraw
export enum DrawMode {
  SIMPLE_SELECT = 'simple_select',
  DIRECT_SELECT = 'direct_select',
  DRAW_POINT = 'draw_point',
  DRAW_POLYGON = 'draw_polygon',
  DRAW_LINE = 'draw_line_string',
  STATIC = 'static',
  FREEHAND = 'draw_freehand'
}

// Drawing action types
export enum DrawActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

// Re-export the ConnectionStatus enum from websocket
export { ConnectionStatusEnum } from '@/lib/websocket';

// Basic GeoJSON types
type Point = {
  type: 'Point';
  coordinates: number[];
};

type LineString = {
  type: 'LineString';
  coordinates: number[][];
};

type Polygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

type Geometry = Point | LineString | Polygon;

export type Feature = {
  id?: string;
  type: 'Feature';
  geometry: Geometry;
  properties?: {
    [key: string]: any;
  };
};

export type FeatureCollection = {
  type: 'FeatureCollection';
  features: Feature[];
};

export interface DrawingChange {
  action: DrawActionType;
  feature: Feature;
  userId: string;
  timestamp: string;
}

/**
 * Hook for collaborative drawing using WebSockets
 */
export function useCollaborativeDrawing(roomId: string = 'default') {
  // Create stable room ID reference
  const roomIdRef = useRef(roomId);
  
  // Update room ID reference when it changes
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);
  
  // WebSocket connection hook with proper options
  const { 
    send, 
    lastMessage, 
    status, 
    userId 
  } = useWebSocket({ roomId: roomIdRef.current });
  
  // Keep references to WebSocket state
  const sendRef = useRef(send);
  const userIdRef = useRef(userId);
  const statusRef = useRef(status);
  
  // Update refs when dependencies change
  useEffect(() => {
    sendRef.current = send;
    userIdRef.current = userId;
    statusRef.current = status;
  }, [send, userId, status]);
  
  // Collection of features
  const [featureCollection, setFeatureCollection] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: []
  });
  
  // Keep reference to the current feature collection to avoid stale closures
  const featureCollectionRef = useRef<FeatureCollection>(featureCollection);
  
  // Update feature collection ref when state changes
  useEffect(() => {
    featureCollectionRef.current = featureCollection;
  }, [featureCollection]);
  
  // Keep track of local changes to prevent echoing
  const localChangeIds = useRef(new Set<string>());
  
  // Process incoming messages
  useEffect(() => {
    if (!lastMessage) return;
    
    // Only process FEATURE messages (both old and new formats)
    if (lastMessage.type !== MessageTypeEnum.FEATURE_ADD && 
        lastMessage.type !== MessageTypeEnum.FEATURE_UPDATE && 
        lastMessage.type !== MessageTypeEnum.FEATURE_DELETE &&
        lastMessage.type !== MessageTypeEnum.FEATURE_CREATED && 
        lastMessage.type !== MessageTypeEnum.FEATURE_UPDATED && 
        lastMessage.type !== MessageTypeEnum.FEATURE_DELETED) return;
    
    try {
      // Check if this is a change we initiated to prevent echoing
      const change = lastMessage.data as DrawingChange;
      if (!change) return;
      
      const changeId = `${change.action}-${change.feature.id}-${change.timestamp}`;
      
      // Skip if this is a change we initiated
      if (localChangeIds.current.has(changeId)) {
        localChangeIds.current.delete(changeId);
        return;
      }
      
      // Process the change based on the action type
      switch (change.action) {
        case DrawActionType.CREATE:
          setFeatureCollection(prev => ({
            ...prev,
            features: [...prev.features, {
              ...change.feature,
              properties: {
                ...change.feature.properties,
                userColor: getUserColor(change.userId),
                userId: change.userId
              }
            }]
          }));
          break;
          
        case DrawActionType.UPDATE:
          setFeatureCollection(prev => ({
            ...prev,
            features: prev.features.map(feature => 
              feature.id === change.feature.id 
                ? {
                    ...change.feature,
                    properties: {
                      ...change.feature.properties,
                      userColor: getUserColor(change.userId),
                      userId: change.userId
                    }
                  }
                : feature
            )
          }));
          break;
          
        case DrawActionType.DELETE:
          setFeatureCollection(prev => ({
            ...prev,
            features: prev.features.filter(feature => feature.id !== change.feature.id)
          }));
          break;
          
        default:
          console.warn('Unknown drawing action:', change.action);
      }
    } catch (err) {
      console.error('Error processing WebSocket drawing message:', err);
    }
  }, [lastMessage]);
  
  // Add a new feature (memoized with stable refs)
  const addFeature = useCallback((feature: Feature) => {
    // Get current refs to avoid stale closures
    const currentUserId = userIdRef.current || 'anonymous';
    const currentRoomId = roomIdRef.current;
    const currentSend = sendRef.current;
    
    // Ensure feature has a unique id
    const featureWithId = {
      ...feature,
      id: feature.id || uuidv4(),
      properties: {
        ...feature.properties,
        userColor: getUserColor(currentUserId),
        userId: currentUserId
      }
    };
    
    // Update local state
    setFeatureCollection(prev => ({
      ...prev,
      features: [...prev.features, featureWithId]
    }));
    
    // Generate change timestamp
    const timestamp = new Date().toISOString();
    
    // Create change id to prevent echo
    const changeId = `${DrawActionType.CREATE}-${featureWithId.id}-${timestamp}`;
    localChangeIds.current.add(changeId);
    
    // Send to server using stable refs
    currentSend({
      type: MessageTypeEnum.FEATURE_ADD,
      data: {
        action: DrawActionType.CREATE,
        feature: featureWithId,
        userId: currentUserId,
        timestamp
      },
      roomId: currentRoomId,
      source: currentUserId,
      timestamp: Date.now() // Use number timestamp for WebSocket message
    });
    
    return featureWithId;
  }, []); // No dependencies as we use refs
  
  // Update an existing feature (memoized with stable refs)
  const updateFeature = useCallback((id: string, feature: Feature) => {
    // Get current refs to avoid stale closures
    const currentUserId = userIdRef.current || 'anonymous';
    const currentRoomId = roomIdRef.current;
    const currentSend = sendRef.current;
    
    // Update feature properties
    const updatedFeature = {
      ...feature,
      id,
      properties: {
        ...feature.properties,
        userColor: getUserColor(currentUserId),
        userId: currentUserId
      }
    };
    
    // Update local state
    setFeatureCollection(prev => ({
      ...prev,
      features: prev.features.map(f => 
        f.id === id ? updatedFeature : f
      )
    }));
    
    // Generate change timestamp
    const timestamp = new Date().toISOString();
    
    // Create change id to prevent echo
    const changeId = `${DrawActionType.UPDATE}-${id}-${timestamp}`;
    localChangeIds.current.add(changeId);
    
    // Send to server using stable refs
    currentSend({
      type: MessageTypeEnum.FEATURE_UPDATE,
      data: {
        action: DrawActionType.UPDATE,
        feature: updatedFeature,
        userId: currentUserId,
        timestamp
      },
      roomId: currentRoomId,
      source: currentUserId,
      timestamp: Date.now() // Use number timestamp for WebSocket message
    });
    
    return updatedFeature;
  }, []); // No dependencies as we use refs
  
  // Delete a feature (memoized with stable refs)
  const deleteFeature = useCallback((id: string) => {
    // Get current refs to avoid stale closures
    const currentUserId = userIdRef.current || 'anonymous';
    const currentRoomId = roomIdRef.current;
    const currentSend = sendRef.current;
    const currentFeatures = featureCollectionRef.current;
    
    // Find the feature from the current feature collection ref
    const feature = currentFeatures.features.find(f => f.id === id);
    if (!feature) return null;
    
    // Update local state
    setFeatureCollection(prev => ({
      ...prev,
      features: prev.features.filter(f => f.id !== id)
    }));
    
    // Generate change timestamp
    const timestamp = new Date().toISOString();
    
    // Create change id to prevent echo
    const changeId = `${DrawActionType.DELETE}-${id}-${timestamp}`;
    localChangeIds.current.add(changeId);
    
    // Send to server using stable refs
    currentSend({
      type: MessageTypeEnum.FEATURE_DELETE,
      data: {
        action: DrawActionType.DELETE,
        feature,
        userId: currentUserId,
        timestamp
      },
      roomId: currentRoomId,
      source: currentUserId,
      timestamp: Date.now() // Use number timestamp for WebSocket message
    });
    
    return feature;
  }, []); // No dependencies as we use refs
  
  return {
    featureCollection,
    addFeature,
    updateFeature,
    deleteFeature,
    connectionStatus: status
  };
}

// Helper function to generate a color from a user ID
function getUserColor(userId: string): string {
  // Generate a color based on the hash of the user ID
  const hash = Array.from(userId).reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const h = Math.abs(hash) % 360; // Hue (0-360)
  const s = 70 + (Math.abs(hash) % 20); // Saturation (70-90%)
  const l = 40 + (Math.abs(hash) % 10); // Lightness (40-50%)
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}