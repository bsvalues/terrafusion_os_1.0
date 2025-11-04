import { useEffect, useState, useCallback } from 'react';
import { CollaborationEventType } from '@/types';
import { Permit } from '@/types';

// Types needed for collaboration 
interface CollaborationSession {
  id: string;
  uploadId: number;
  createdAt: string;
  participants: CollaborationParticipant[];
  activePermitId?: number;
}

interface CollaborationParticipant {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: string;
  isActive: boolean;
  color: string;
}

interface PermitComment {
  id: string;
  permitId: number;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface CollaborationState {
  session: CollaborationSession | null;
  userId: string | null;
  userName: string | null;
  userColor: string | null;
  comments: PermitComment[];
  isConnected: boolean;
  error: string | null;
}

interface UseCollaborationOptions {
  uploadId: number;
  userName: string;
  onEvent?: (event: any) => void;
  enabled?: boolean;
}

export function useCollaboration(options: UseCollaborationOptions) {
  const { uploadId, userName, onEvent, enabled = true } = options;
  
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [state, setState] = useState<CollaborationState>({
    session: null,
    userId: null,
    userName: null,
    userColor: null,
    comments: [],
    isConnected: false,
    error: null,
  });
  
  // MOCK IMPLEMENTATION: Instead of using real WebSockets which cause errors in this environment
  useEffect(() => {
    // Don't initialize if not enabled
    if (!enabled || !uploadId || !userName) {
      return;
    }
    
    console.log('Initializing mock collaboration connection');
    
    // Set up mock connection with timeout to simulate connecting
    const connectionTimer = setTimeout(() => {
      console.log('Mock collaboration connection established');
      setState(prev => ({ ...prev, isConnected: true }));
      
      // Mock session data
      const mockSession: CollaborationSession = {
        id: `mock-session-${uploadId}`,
        uploadId,
        createdAt: new Date().toISOString(),
        participants: [
          {
            id: 'user-1',
            name: userName,
            joinedAt: new Date().toISOString(),
            isActive: true,
            color: '#60A5FA'
          },
          {
            id: 'user-2',
            name: 'Demo User',
            joinedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            isActive: true,
            color: '#F472B6' 
          }
        ]
      };
      
      // Update state with mock session
      setState(prev => ({
        ...prev,
        session: mockSession,
        userId: 'user-1',
        userName,
        userColor: '#60A5FA',
        comments: []
      }));
      
      // Fire mock event
      if (onEvent) {
        onEvent({
          type: 'session_state',
          session: mockSession,
          userId: 'user-1',
          userName,
          userColor: '#60A5FA',
          comments: []
        });
      }
      
    }, 500); // Simulate connection delay
    
    // Create a mock socket object that won't actually connect to anything
    const mockSocket = {
      readyState: 1, // WebSocket.OPEN
      send: (data: string) => {
        console.log('Mock WebSocket message sent:', data);
        // We could add logic here to simulate responses
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.type === 'add_comment') {
            // Simulate receiving a comment back
            setTimeout(() => {
              const mockComment = {
                id: `comment-${Date.now()}`,
                permitId: parsedData.permitId,
                userId: 'user-1',
                userName,
                message: parsedData.message,
                timestamp: new Date().toISOString()
              };
              
              setState(prev => ({
                ...prev,
                comments: [...prev.comments, mockComment]
              }));
              
              if (onEvent) {
                onEvent({
                  type: CollaborationEventType.PERMIT_COMMENT,
                  sessionId: `mock-session-${uploadId}`,
                  userId: 'user-1',
                  timestamp: new Date().toISOString(),
                  payload: { comment: mockComment }
                });
              }
            }, 200);
          }
        } catch (err) {
          console.error('Error processing mock message:', err);
        }
      },
      close: () => {
        console.log('Mock WebSocket closed');
        setState(prev => ({ ...prev, isConnected: false }));
      }
    };
    
    // @ts-ignore - our mock doesn't implement the full WebSocket interface
    setSocket(mockSocket);
    
    // Cleanup function when component unmounts
    return () => {
      clearTimeout(connectionTimer);
      // No need to close a real socket, but we'll update state
      setState(prev => ({ ...prev, isConnected: false }));
    };
  }, [uploadId, userName, onEvent, enabled]);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    const { type } = data;
    
    switch (type) {
      case 'session_state':
        setState(prev => ({
          ...prev,
          session: data.session,
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor,
          comments: data.comments || [],
        }));
        break;
        
      case 'error':
        setState(prev => ({ ...prev, error: data.message }));
        break;
        
      case CollaborationEventType.JOIN_SESSION:
        // Update participant list
        setState(prev => {
          if (!prev.session) return prev;
          
          return {
            ...prev,
            session: {
              ...prev.session,
              participants: [...prev.session.participants, data.payload.participant],
            },
          };
        });
        break;
        
      case CollaborationEventType.LEAVE_SESSION:
        // Remove participant from list
        setState(prev => {
          if (!prev.session) return prev;
          
          return {
            ...prev,
            session: {
              ...prev.session,
              participants: prev.session.participants.filter((p: CollaborationParticipant) => p.id !== data.userId),
            },
          };
        });
        break;
        
      case CollaborationEventType.PERMIT_FOCUS:
        // Update active permit in session
        setState(prev => {
          if (!prev.session) return prev;
          
          return {
            ...prev,
            session: {
              ...prev.session,
              activePermitId: data.payload.permitId,
            },
          };
        });
        break;
        
      case CollaborationEventType.PERMIT_COMMENT:
        // Add comment to list
        setState(prev => ({
          ...prev,
          comments: [...prev.comments, data.payload.comment],
        }));
        break;
        
      case CollaborationEventType.PERMIT_UPDATE:
        // Handle permit update (would trigger a re-fetch in actual implementation)
        break;
        
      default:
        break;
    }
  }, []);
  
  // Focus on a specific permit (mock implementation that updates local state)
  const focusPermit = useCallback((permitId: number) => {
    if (!socket || !state.userId || !state.session) return;
    
    // Send data to our mock socket
    socket.send(JSON.stringify({
      type: 'focus_permit',
      permitId,
    }));
    
    // Directly update state since we're mocking
    setState(prev => {
      if (!prev.session) return prev;
      
      return {
        ...prev,
        session: {
          ...prev.session,
          activePermitId: permitId,
        },
      };
    });
    
    // Simulate a response from the server
    if (onEvent) {
      setTimeout(() => {
        onEvent({
          type: CollaborationEventType.PERMIT_FOCUS,
          sessionId: state.session?.id || '',
          userId: state.userId || '',
          timestamp: new Date().toISOString(),
          payload: { permitId }
        });
      }, 100);
    }
  }, [socket, state.userId, state.session, onEvent]);
  
  // Add a comment to a permit
  const addComment = useCallback((permitId: number, message: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !state.userId) return;
    
    socket.send(JSON.stringify({
      type: 'add_comment',
      permitId,
      message,
    }));
  }, [socket, state.userId]);
  
  // Update a permit
  const updatePermit = useCallback((permitId: number, changes: Partial<Permit>) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !state.userId) return;
    
    socket.send(JSON.stringify({
      type: 'update_permit',
      permitId,
      changes,
    }));
  }, [socket, state.userId]);
  
  // Send user activity
  const sendActivity = useCallback((activityType: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !state.userId) return;
    
    socket.send(JSON.stringify({
      type: 'user_activity',
      activityType,
    }));
  }, [socket, state.userId]);
  
  // Get comments for a specific permit
  const getCommentsForPermit = useCallback((permitId: number) => {
    return state.comments.filter(comment => comment.permitId === permitId);
  }, [state.comments]);
  
  // Function to clean up and disconnect
  const disconnect = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }, [socket]);
  
  return {
    // State
    session: state.session,
    userId: state.userId,
    userName: state.userName,
    userColor: state.userColor,
    participants: state.session?.participants || [],
    isConnected: state.isConnected,
    error: state.error,
    
    // Comments
    comments: state.comments,
    getCommentsForPermit,
    
    // Actions
    focusPermit,
    addComment,
    updatePermit,
    sendActivity,
    disconnect,
  };
}