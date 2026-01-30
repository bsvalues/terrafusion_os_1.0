import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';

interface UseYjsCollaborationOptions {
  sessionId: string;
  userName: string;
  userColor: string;
  enabled?: boolean;
}

/**
 * A hook for using Y.js for real-time collaboration
 * This is a mock implementation that simulates collaboration functionality
 * without actually using Yjs directly to avoid constructor check issues
 */
export function useYjsCollaboration(options: UseYjsCollaborationOptions) {
  const { sessionId, userName, userColor, enabled = true } = options;
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localText, setLocalText] = useState<string>('Welcome to the collaborative editor! Type here to start...');
  
  // Set up the collaboration state safely with error handling
  useEffect(() => {
    // Safety check: If not enabled or no sessionId, don't try to connect
    if (!enabled || !sessionId) {
      setIsLoading(false);
      // This is an expected state, not an error
      setIsConnected(false);
      return;
    }
    
    // We're wrapping everything in try/catch to prevent unhandled rejections
    try {
      // Simulate connecting to Yjs - in a full implementation, we would connect to the real WebSocket here
      const connectTimeout = setTimeout(() => {
        try {
          setIsLoading(false);
          setIsConnected(true);
          console.log('Mock collaboration initialized successfully');
        } catch (innerErr) {
          // Extra safety - catch any errors during state updates
          console.warn('Error in Yjs connection simulation:', innerErr);
          setIsLoading(false);
          setError("Error in collaboration initialization");
        }
      }, 500);
      
      // Clean up on unmount
      return () => {
        clearTimeout(connectTimeout);
        console.log('Mock collaboration cleaned up');
      };
    } catch (err) {
      // This protects against any synchronous errors in the setup process
      console.error('Error in useYjsCollaboration setup:', err);
      setIsLoading(false);
      setError("Failed to initialize collaboration");
    }
  }, [enabled, sessionId]);
  
  // Only show error toasts for actual errors, not expected states
  useEffect(() => {
    if (error && enabled && sessionId) {
      // Don't show toasts for known implementation limitations
      if (!error.includes("not available") && !error.includes("temporarily disabled")) {
        toast({
          title: "Collaboration Notice",
          description: "Collaborative editing is in offline mode",
          variant: "default"
        });
      }
    }
  }, [error, toast, enabled, sessionId]);
  
  // Mock active users (add a simulated second user for demo purposes)
  const [activeUsers, setActiveUsers] = useState<Array<{
    id: number;
    name: string;
    color: string;
    position?: { x: number; y: number };
  }>>([
    {
      id: 1,
      name: userName,
      color: userColor,
      position: { x: 0, y: 0 }
    },
    {
      id: 2,
      name: "Demo User",
      color: "#A78BFA", // violet
      position: { x: 50, y: 50 }
    }
  ]);
  
  // Update cursor position when mouse moves (mock implementation with simulated users)
  const updateCursorPosition = useCallback((x: number, y: number) => {
    try {
      // Update the current user's position
      setActiveUsers(prev => {
        const updated = prev.map(user => {
          if (user.name === userName) {
            return {
              ...user,
              position: { x, y }
            };
          }
          return user;
        });
        return updated;
      });
      
      // Simulate other users' movements occasionally (for demonstration purposes)
      if (Math.random() > 0.95) {
        const otherUserIndex = Math.floor(Math.random() * activeUsers.length);
        if (otherUserIndex >= 0 && activeUsers[otherUserIndex]?.name !== userName) {
          const randomOffset = { x: Math.random() * 50 - 25, y: Math.random() * 50 - 25 };
          setActiveUsers(prev => {
            return prev.map((user /* , index */) => {
              if (index === otherUserIndex && user.name !== userName) {
                return {
                  ...user,
                  position: {
                    x: (user.position?.x || 0) + randomOffset.x,
                    y: (user.position?.y || 0) + randomOffset.y
                  }
                };
              }
              return user;
            });
          });
        }
      }
    } catch (err) {
      console.warn('Error updating cursor position:', err);
    }
  }, [userName, activeUsers]);
  
  // Add a note to the shared notes (mock implementation)
  const addNote = useCallback((noteId: string, noteData: any) => {
    // Mock implementation, does nothing currently
    console.log('Note added (mock):', noteId, noteData);
  }, [userName]);
  
  // Update shared text (mock implementation with state management)
  const updateText = useCallback((content: string) => {
    try {
      setLocalText(content);
      console.log('Text updated (mock):', content.substring(0, 20) + '...');
    } catch (err) {
      console.warn('Error updating text:', err);
    }
  }, []);
  
  // Get the current text value (mock implementation with state)
  const getText = useCallback(() => {
    return localText;
  }, [localText]);
  
  // Get all notes (mock implementation)
  const getNotes = useCallback(() => {
    const result: Record<string, any> = {
      'note-1': {
        text: 'Collaborative notes temporarily disabled',
        createdAt: new Date().toISOString(),
        createdBy: userName
      }
    };
    return result;
  }, [userName]);
  
  // Watch for changes in the shared text (mock implementation with local state)
  const onTextChange = useCallback((callback: (text: string) => void) => {
    // Call the callback immediately with the current text
    try {
      callback(localText);
    } catch (err) {
      console.warn('Error in text change callback:', err);
    }
    
    // We don't actually listen for changes from other users in this mock implementation
    // In a real implementation, we would set up Yjs observers here
    return () => {}; // No-op cleanup function
  }, [localText]);
  
  // Watch for changes in the shared notes (mock implementation)
  const onNotesChange = useCallback((callback: (notes: Record<string, any>) => void) => {
    // Mock implementation
    return () => {}; // No-op cleanup function
  }, []);
  
  return {
    isConnected,
    isLoading,
    error,
    activeUsers,
    
    // Methods
    updateCursorPosition,
    addNote,
    updateText,
    getText,
    getNotes,
    
    // Event listeners
    onTextChange,
    onNotesChange,
  };
}