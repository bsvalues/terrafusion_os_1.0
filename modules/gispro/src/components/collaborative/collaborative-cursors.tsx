import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEnhancedWebSocket } from '@/hooks/use-enhanced-websocket';
import { MessageTypeEnum } from '@/lib/websocket';
import { CollaborativeUser } from '@/lib/websocket-session-manager';
import { cn } from '@/lib/utils';
import { throttle } from '@/lib/utils';

/**
 * Props for the CollaborativeCursors component
 */
interface CollaborativeCursorsProps {
  roomId: string;
  containerRef: React.RefObject<HTMLElement>;
  className?: string;
  throttleMs?: number;
  fadeOutDelay?: number;
  showUsernames?: boolean;
  excludeLocalUser?: boolean;
}

/**
 * Cursor position with metadata
 */
interface CursorPosition {
  userId: string;
  username: string;
  position: { x: number, y: number };
  color: string;
  lastUpdated: number;
  isVisible: boolean;
}

// Colors for different cursors
const CURSOR_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
];

/**
 * Get a color based on user ID (deterministic)
 */
function getUserColor(userId: string): string {
  // Simple hash function for the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the absolute value of the hash to pick a color
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}

/**
 * Component for displaying and tracking user cursors in a collaborative room
 */
export function CollaborativeCursors({
  roomId,
  containerRef,
  className,
  throttleMs = 50,
  fadeOutDelay = 5000,
  showUsernames = true,
  excludeLocalUser = false
}: CollaborativeCursorsProps) {
  // Create stable room ID reference
  const roomIdRef = useRef(roomId);
  
  // Update room ID ref when it changes
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);
  
  // Use enhanced WebSocket with stable room ID ref
  const { 
    sendMessage, 
    lastMessage, 
    userId: localUserId 
  } = useEnhancedWebSocket({
    roomId: roomIdRef.current
  });
  
  // Store local user ID in ref to prevent dependency changes
  const localUserIdRef = useRef(localUserId);
  
  // Update local user ID ref when it changes
  useEffect(() => {
    localUserIdRef.current = localUserId;
  }, [localUserId]);
  
  // Cursor positions
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  
  // Track mouse movement
  const mouseMovementRef = useRef<{ x: number, y: number } | null>(null);
  
  // Create ref for exclude local user flag to prevent dependency changes
  const excludeLocalUserRef = useRef(excludeLocalUser);
  
  // Update exclude local user ref when it changes
  useEffect(() => {
    excludeLocalUserRef.current = excludeLocalUser;
  }, [excludeLocalUser]);
  
  // Effect to process incoming cursor position messages using refs
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== MessageTypeEnum.CURSOR_MOVE) return;
    
    const { userId, username, payload } = lastMessage;
    if (!userId || !username || !payload || !payload.position) return;
    
    // Skip the local user's cursor if excluded - use refs for stable comparison
    if (excludeLocalUserRef.current && userId === localUserIdRef.current) return;
    
    // Update cursor position
    setCursorPositions(prevPositions => {
      const position = payload.position;
      const existingIndex = prevPositions.findIndex(p => p.userId === userId);
      
      if (existingIndex >= 0) {
        // Update existing cursor position
        const updated = [...prevPositions];
        updated[existingIndex] = {
          ...updated[existingIndex],
          position,
          lastUpdated: Date.now(),
          isVisible: true
        };
        return updated;
      } else {
        // Add new cursor position
        return [
          ...prevPositions,
          {
            userId,
            username,
            position,
            color: getUserColor(userId),
            lastUpdated: Date.now(),
            isVisible: true
          }
        ];
      }
    });
  }, [lastMessage]); // Only depend on lastMessage since we use refs for other values
  
  // Refs for dependencies to avoid recreation
  const sendMessageRef = useRef(sendMessage);
  
  // Update sendMessage ref when it changes
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);
  
  // Reference for throttle ms to avoid dependency changes
  const throttleMsRef = useRef(throttleMs);
  
  // Update throttleMs ref when it changes
  useEffect(() => {
    throttleMsRef.current = throttleMs;
  }, [throttleMs]);
  
  // Throttled function to send cursor position updates with stable references
  const sendCursorPosition = useCallback(
    throttle((x: number, y: number) => {
      if (!containerRef.current) return;
      
      sendMessageRef.current({
        type: MessageTypeEnum.CURSOR_MOVE,
        roomId: roomIdRef.current,
        payload: {
          position: { x, y }
        }
      });
    }, throttleMsRef.current),
    [containerRef] // Only depend on containerRef since we use refs for other values
  );
  
  // Handle mouse movement in the container
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Calculate position relative to container
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Store position for later sending
      mouseMovementRef.current = { x, y };
    };
    
    // Add event listener
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [containerRef]);
  
  // Reference for the cursor position callback
  const sendCursorPositionRef = useRef(sendCursorPosition);
  
  // Update the cursor position callback ref when it changes
  useEffect(() => {
    sendCursorPositionRef.current = sendCursorPosition;
  }, [sendCursorPosition]);
  
  // Periodically send cursor position with stable references
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (mouseMovementRef.current) {
        sendCursorPositionRef.current(mouseMovementRef.current.x, mouseMovementRef.current.y);
      }
    }, throttleMsRef.current);
    
    return () => clearInterval(intervalId);
  }, []); // No dependencies since we use refs
  
  // Reference for the fade out delay to avoid dependency changes
  const fadeOutDelayRef = useRef(fadeOutDelay);
  
  // Update fade out delay ref when it changes
  useEffect(() => {
    fadeOutDelayRef.current = fadeOutDelay;
  }, [fadeOutDelay]);
  
  // Hide cursors after inactivity with stable references
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCursorPositions(prevPositions => {
        // Get current time for comparison
        const now = Date.now();
        let updated = false;
        
        // Check each position for timeout using the ref for stable fadeOutDelay reference
        const newPositions = prevPositions.map(pos => {
          if (pos.isVisible && now - pos.lastUpdated > fadeOutDelayRef.current) {
            updated = true;
            return { ...pos, isVisible: false };
          }
          return pos;
        });
        
        // Only update state if something changed
        return updated ? newPositions : prevPositions;
      });
    }, 1000); // Check every second
    
    return () => clearInterval(intervalId);
  }, []); // No dependencies since we use refs
  
  return (
    <>
      {cursorPositions.map(cursor => (
        <div
          key={cursor.userId}
          className={cn(
            "pointer-events-none absolute z-50 transition-opacity duration-300",
            !cursor.isVisible && "opacity-0",
            className
          )}
          style={{
            left: `${cursor.position.x}px`,
            top: `${cursor.position.y}px`,
            transform: 'translate(-4px, -4px)'
          }}
        >
          {/* Cursor pointer */}
          <div className="relative">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md"
            >
              <path
                d="M5.95959 2.00001C5.23777 2.00001 4.7059 2.71811 4.92876 3.40576L10.6144 21.4065C10.8542 22.1308 11.833 22.2517 12.2341 21.6268L16.6893 14.7602L21.5604 14.7602C22.3107 14.7602 22.7079 13.9039 22.3026 13.2682L13.5346 0.839195C13.157 0.246137 12.3113 0.219552 11.8952 0.792068L6.41893 8.37675L2.52534 9.53531C1.86946 9.70531 1.60463 10.5123 2.03516 11.0443L3.60855 13.0303L0.831381 14.1787C0.131428 14.4576 -0.17604 15.3103 0.26378 15.9287L3.56298 20.7698C3.95432 21.3125 4.7514 21.156 4.93399 20.5166L5.95959 17.0002H9.5596C10.112 17.0002 10.5596 16.5525 10.5596 16.0002C10.5596 15.4479 10.112 15.0002 9.5596 15.0002H5.95959L4.96714 18.3998L2.69742 14.9778L5.77474 13.6663C6.19456 13.5032 6.43656 13.062 6.32278 12.6253L5.95959 11.0002H9.5596C10.112 11.0002 10.5596 10.5525 10.5596 10.0002C10.5596 9.44792 10.112 9.00015 9.5596 9.00015H5.95959L6.85855 4.90588L11.4824 13.7602H17.9789L13.9624 19.9348L8.9511 4.00001H11.5596C12.112 4.00001 12.5596 3.55229 12.5596 3.00001C12.5596 2.44772 12.112 2.00001 11.5596 2.00001H5.95959Z"
                className={cursor.color}
              />
            </svg>
            
            {/* Username label */}
            {showUsernames && (
              <div
                className={cn(
                  "absolute left-5 top-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-white shadow-sm",
                  cursor.color
                )}
              >
                {cursor.username}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}