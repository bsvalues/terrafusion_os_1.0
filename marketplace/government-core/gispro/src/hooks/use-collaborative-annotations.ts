import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket, MessageTypeEnum, ConnectionStatusEnum } from '@/lib/websocket';

// Annotation types
export enum AnnotationType {
  TEXT = 'text',
  MARKER = 'marker',
  IMAGE = 'image',
  MEASUREMENT = 'measurement'
}

// Annotation action types
export enum AnnotationActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

// Re-export connection status
export { ConnectionStatusEnum } from '@/lib/websocket';

// Annotation interface
export interface Annotation {
  id: string;
  type: AnnotationType;
  position: {
    lat: number;
    lng: number;
  };
  content: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  styling?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Annotation change interface
export interface AnnotationChange {
  action: AnnotationActionType;
  annotation: Annotation;
  source: string;
  timestamp: string;
}

// Initial annotation properties interface
export interface InitialAnnotationProps {
  type: AnnotationType;
  position: {
    lat: number;
    lng: number;
  };
  content: string;
  styling?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Hook for collaborative annotations using WebSockets
 */
export function useCollaborativeAnnotations(roomId: string = 'default') {
  // WebSocket connection
  const { 
    send, 
    lastMessage, 
    status, 
    userId 
  } = useWebSocket(roomId);
  
  // Annotations state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  
  // Track local changes to prevent echoes
  const localChangeIds = useRef(new Set<string>());
  
  // Process incoming messages
  useEffect(() => {
    if (!lastMessage) return;
    
    // Only process DRAWING_UPDATE messages
    if (lastMessage.type !== MessageTypeEnum.FEATURE_UPDATE) return;
    
    try {
      // Parse the change
      const change = lastMessage.data as AnnotationChange;
      if (!change) return;
      
      // Create a change ID to check if this is our own change
      const changeId = `${change.action}-${change.annotation.id}-${change.timestamp}`;
      
      // Skip if this is our own change
      if (localChangeIds.current.has(changeId)) {
        localChangeIds.current.delete(changeId);
        return;
      }
      
      // Process the change
      switch (change.action) {
        case AnnotationActionType.CREATE:
          setAnnotations(prev => [...prev, change.annotation]);
          break;
          
        case AnnotationActionType.UPDATE:
          setAnnotations(prev => prev.map(ann => 
            ann.id === change.annotation.id ? change.annotation : ann
          ));
          break;
          
        case AnnotationActionType.DELETE:
          setAnnotations(prev => prev.filter(ann => ann.id !== change.annotation.id));
          break;
          
        default:
          console.warn('Unknown annotation action:', change.action);
      }
    } catch (err) {
      console.error('Error processing WebSocket annotation message:', err);
    }
  }, [lastMessage]);
  
  // Function to create a new annotation
  const createAnnotation = useCallback((props: InitialAnnotationProps) => {
    const timestamp = new Date().toISOString();
    
    const newAnnotation: Annotation = {
      id: uuidv4(),
      ...props,
      createdBy: userId,
      createdAt: timestamp
    };
    
    // Update local state
    setAnnotations(prev => [...prev, newAnnotation]);
    
    // Create change id to prevent echo
    const changeId = `${AnnotationActionType.CREATE}-${newAnnotation.id}-${timestamp}`;
    localChangeIds.current.add(changeId);
    
    // Send to server
    send({
      type: MessageTypeEnum.FEATURE_UPDATE,
      data: {
        action: AnnotationActionType.CREATE,
        annotation: newAnnotation,
        timestamp
      },
      source: userId,
      roomId,
      timestamp
    });
    
    return newAnnotation;
  }, [userId, roomId, send, localChangeIds]);
  
  // Function to update an annotation
  const updateAnnotation = useCallback((
    id: string,
    updates: Partial<Omit<Annotation, 'id' | 'createdBy' | 'createdAt'>>
  ) => {
    let updatedAnnotation: Annotation | null = null;
    
    setAnnotations(prev => {
      const updated = prev.map(ann => {
        if (ann.id === id) {
          const timestamp = new Date().toISOString();
          updatedAnnotation = {
            ...ann,
            ...updates,
            updatedBy: userId,
            updatedAt: timestamp
          };
          return updatedAnnotation;
        }
        return ann;
      });
      
      return updated;
    });
    
    if (updatedAnnotation && updatedAnnotation.updatedAt) {
      // Create change id to prevent echo
      const changeId = `${AnnotationActionType.UPDATE}-${id}-${updatedAnnotation.updatedAt}`;
      localChangeIds.current.add(changeId);
      
      // Send to server
      send({
        type: MessageTypeEnum.FEATURE_UPDATE,
        data: {
          action: AnnotationActionType.UPDATE,
          annotation: updatedAnnotation,
          timestamp: updatedAnnotation.updatedAt
        },
        source: userId,
        roomId,
        timestamp: updatedAnnotation.updatedAt
      });
    }
    
    return updatedAnnotation;
  }, [userId, roomId, send, localChangeIds]);
  
  // Function to delete an annotation
  const deleteAnnotation = useCallback((id: string) => {
    let deletedAnnotation: Annotation | null = null;
    
    setAnnotations(prev => {
      // Find annotation first
      deletedAnnotation = prev.find(ann => ann.id === id) || null;
      
      // Filter it out
      return prev.filter(ann => ann.id !== id);
    });
    
    if (deletedAnnotation) {
      const timestamp = new Date().toISOString();
      
      // Create change id to prevent echo
      const changeId = `${AnnotationActionType.DELETE}-${id}-${timestamp}`;
      localChangeIds.current.add(changeId);
      
      // Send to server
      send({
        type: MessageTypeEnum.FEATURE_UPDATE,
        data: {
          action: AnnotationActionType.DELETE,
          annotation: deletedAnnotation,
          timestamp
        },
        source: userId,
        roomId,
        timestamp
      });
    }
    
    return deletedAnnotation;
  }, [userId, roomId, send, localChangeIds]);
  
  // Return hook values
  return {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    connectionStatus: status
  };
}