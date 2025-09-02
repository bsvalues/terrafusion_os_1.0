import { useEffect, useRef, useState } from 'react';
import * as mapboxgl from 'mapbox-gl';
import { useWebSocket, MessageTypeEnum, ConnectionStatusEnum } from '@/lib/websocket';

interface CursorPosition {
  userId: string;
  position: [number, number];
  timestamp: Date;
  color: string;
}

interface CollaborativeCursorProps {
  map: mapboxgl.Map;
  roomId: string;
  userId: string;
  enabled?: boolean;
}

// Random color generator for user cursors
function getRandomColor(seed: string): string {
  // Create a simple hash from the string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use hash to generate HSL color
  // We use HSL to ensure good contrast and visibility
  const hue = Math.abs(hash % 360);
  
  // Keep saturation and lightness in a pleasing range
  const saturation = 70 + Math.abs((hash >> 8) % 20);
  const lightness = 45 + Math.abs((hash >> 16) % 15);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function CollaborativeCursor({ 
  map, 
  roomId, 
  userId,
  enabled = true 
}: CollaborativeCursorProps) {
  // Track cursor elements by user ID
  const cursorElementsRef = useRef<Record<string, HTMLDivElement>>({});
  // Track cursor positions
  const [cursorPositions, setCursorPositions] = useState<Record<string, CursorPosition>>({});
  // Use WebSocket connection
  const { status, messages, sendMessage } = useWebSocket({ autoJoinRoom: roomId });
  
  // Get the latest message
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  
  // Alias for sendMessage
  const send = sendMessage;
  // Track throttled send time
  const lastSendTimeRef = useRef<number>(0);
  // Cursor update throttle interval (ms)
  const THROTTLE_INTERVAL = 100;
  // Cursor timeout (ms) - hide cursors after this period of inactivity
  const CURSOR_TIMEOUT = 5000;
  
  // Initialize cursor elements container
  useEffect(() => {
    if (!map || !enabled) return;
    
    // Create container for cursor elements if it doesn't exist
    let container = document.getElementById('collaborative-cursors-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'collaborative-cursors-container';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '999';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.overflow = 'hidden';
      
      // Add container to map
      map.getContainer().appendChild(container);
    }
    
    // Cleanup on unmount
    return () => {
      // Remove all cursor elements
      Object.values(cursorElementsRef.current).forEach(element => {
        element.remove();
      });
      
      // Clear references
      cursorElementsRef.current = {};
      
      // Remove container if it exists and is empty
      if (container && container.childElementCount === 0) {
        container.remove();
      }
    };
  }, [map, enabled]);
  
  // Handle map mouse move to send cursor position
  useEffect(() => {
    if (!map || !enabled || status !== ConnectionStatusEnum.CONNECTED) return;
    
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const now = Date.now();
      
      // Throttle cursor position updates
      if (now - lastSendTimeRef.current < THROTTLE_INTERVAL) {
        return;
      }
      
      lastSendTimeRef.current = now;
      
      // Send cursor position
      send({
        type: MessageTypeEnum.CURSOR_MOVE,
        roomId,
        userId,
        payload: {
          position: [e.lngLat.lng, e.lngLat.lat]
        }
      });
    };
    
    // Add mouse move event listener
    map.on('mousemove', handleMouseMove);
    
    // Cleanup
    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [map, send, roomId, userId, status, enabled]);
  
  // Process incoming cursor messages
  useEffect(() => {
    if (!lastMessage || !map || !enabled) return;
    
    // Only process cursor messages from other users
    if (
      lastMessage.type === MessageTypeEnum.CURSOR_MOVE && 
      lastMessage.roomId === roomId &&
      lastMessage.userId !== userId && 
      lastMessage.payload?.position
    ) {
      const otherUserId = lastMessage.userId as string;
      const position = lastMessage.payload.position as [number, number];
      
      // Update cursor position
      setCursorPositions(prev => ({
        ...prev,
        [otherUserId]: {
          userId: otherUserId,
          position,
          timestamp: new Date(),
          color: getRandomColor(otherUserId)
        }
      }));
    }
  }, [lastMessage, map, roomId, userId, enabled]);
  
  // Update cursor DOM elements positions
  useEffect(() => {
    if (!map || !enabled) return;
    
    const container = document.getElementById('collaborative-cursors-container');
    if (!container) return;
    
    // Clean up outdated cursors
    const now = new Date();
    const updatedPositions = { ...cursorPositions };
    let hasChanges = false;
    
    Object.entries(updatedPositions).forEach(([uid, cursor]) => {
      const timeSinceUpdate = now.getTime() - cursor.timestamp.getTime();
      
      // Remove cursor if it hasn't been updated for a while
      if (timeSinceUpdate > CURSOR_TIMEOUT) {
        delete updatedPositions[uid];
        
        // Remove DOM element
        if (cursorElementsRef.current[uid]) {
          cursorElementsRef.current[uid].remove();
          delete cursorElementsRef.current[uid];
        }
        
        hasChanges = true;
      }
    });
    
    // Update state if cursors were removed
    if (hasChanges) {
      setCursorPositions(updatedPositions);
    }
    
    // Update cursor positions
    Object.entries(cursorPositions).forEach(([uid, cursor]) => {
      // Convert geo coordinates to pixel coordinates
      const pixelPosition = map.project(cursor.position as mapboxgl.LngLatLike);
      
      // Create or update cursor element
      let cursorElement = cursorElementsRef.current[uid];
      
      if (!cursorElement) {
        // Create cursor element
        cursorElement = document.createElement('div');
        cursorElement.id = `cursor-${uid}`;
        cursorElement.className = 'user-cursor';
        cursorElement.style.position = 'absolute';
        cursorElement.style.pointerEvents = 'none';
        cursorElement.style.zIndex = '1000';
        cursorElement.style.transition = 'transform 0.1s ease-out';
        
        // Create cursor pointer
        const cursorPointer = document.createElement('div');
        cursorPointer.style.width = '15px';
        cursorPointer.style.height = '15px';
        cursorPointer.style.borderRadius = '50%';
        cursorPointer.style.border = `2px solid ${cursor.color}`;
        cursorPointer.style.backgroundColor = `${cursor.color}40`; // 40 = 25% opacity
        cursorPointer.style.transform = 'translate(-50%, -50%)';
        cursorPointer.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
        
        // Create user label
        const label = document.createElement('div');
        label.textContent = `User ${uid.substring(0, 4)}`;
        label.style.fontSize = '10px';
        label.style.backgroundColor = cursor.color;
        label.style.color = 'white';
        label.style.padding = '2px 4px';
        label.style.borderRadius = '3px';
        label.style.transform = 'translateX(-50%)';
        label.style.marginTop = '2px';
        label.style.whiteSpace = 'nowrap';
        
        // Assemble cursor
        cursorElement.appendChild(cursorPointer);
        cursorElement.appendChild(label);
        
        // Add to container
        container.appendChild(cursorElement);
        
        // Store reference
        cursorElementsRef.current[uid] = cursorElement;
      }
      
      // Update position
      cursorElement.style.transform = `translate(${pixelPosition.x}px, ${pixelPosition.y}px)`;
    });
  }, [map, cursorPositions, enabled]);
  
  // Nothing to render directly - cursors are added to DOM outside of React
  return null;
}