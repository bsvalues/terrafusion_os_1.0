import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Users, Edit, MousePointerClick, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Collaboration message types
enum MessageType {
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  SESSION_UPDATE = 'session_update',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  CURSOR_POSITION = 'cursor_position',
  EDIT_OPERATION = 'edit_operation',
  COMMENT = 'comment',
  VALIDATION_RESULT = 'validation_result',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong'
}

// Message interface
interface CollaborationMessage {
  type: MessageType;
  sessionId: string;
  userId: number;
  userName?: string;
  timestamp: number;
  payload?: any;
}

const CollaborationTestPage: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState('test-session-1');
  const [userId, setUserId] = useState(1);
  const [userName, setUserName] = useState('Test User');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionJoined, setSessionJoined] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const port = window.location.port || (protocol === 'wss:' ? '443' : '80');
    
    // Construct URL with explicit hostname and port to avoid 'undefined' issues
    const wsUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/ws/collaboration`;
    
    // Add debug logging to help diagnose connection issues
    console.log(`[Collaboration Test] Connecting to WebSocket at: ${wsUrl}`);
    console.log(`[Collaboration Test] hostname: ${hostname}`);
    console.log(`[Collaboration Test] port: ${port}`);
    console.log(`[Collaboration Test] protocol: ${protocol}`);
    const socket = new WebSocket(wsUrl);
    
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setConnected(true);
      toast({
        title: 'Connection Established',
        description: 'Successfully connected to collaboration server',
        variant: 'default',
      });
      
      // Store messages
      setMessages(prev => [...prev, {
        type: 'system',
        message: 'Connected to collaboration server',
        timestamp: Date.now()
      }]);
    });
    
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        // Add to messages
        setMessages(prev => [...prev, {
          type: 'received',
          message: data,
          timestamp: Date.now()
        }]);
        
        // Handle specific message types
        if (data.type === MessageType.USER_JOINED) {
          toast({
            title: 'User Joined',
            description: `${data.userName || 'A user'} joined the session`,
            variant: 'default',
          });
        } else if (data.type === MessageType.USER_LEFT) {
          toast({
            title: 'User Left',
            description: `${data.userName || 'A user'} left the session`,
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setConnected(false);
      setSessionJoined(false);
      toast({
        title: 'Connection Closed',
        description: `WebSocket connection closed (${event.code})`,
        variant: 'destructive',
      });
      
      // Store messages
      setMessages(prev => [...prev, {
        type: 'system',
        message: `Connection closed: ${event.reason || 'Unknown reason'}`,
        timestamp: Date.now()
      }]);
      
      // Attempt to reconnect after a delay
      if (event.code !== 1000) { // Not a normal closure
        setTimeout(() => {
          if (socketRef.current === socket) {
            connectWebSocket();
          }
        }, 5000);
      }
    });
    
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'WebSocket connection encountered an error',
        variant: 'destructive',
      });
      
      // Store messages
      setMessages(prev => [...prev, {
        type: 'system',
        message: 'Connection error occurred',
        timestamp: Date.now()
      }]);
    });
    
    socketRef.current = socket;
    return socket;
  }, [toast]);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [connectWebSocket]);

  // Join session
  const joinSession = useCallback(() => {
    if (!connected || !socketRef.current) {
      toast({
        title: 'Not Connected',
        description: 'Cannot join session: not connected to server',
        variant: 'destructive',
      });
      return;
    }
    
    const joinMessage: CollaborationMessage = {
      type: MessageType.JOIN_SESSION,
      sessionId,
      userId,
      userName,
      timestamp: Date.now(),
      payload: {
        role: 'editor'
      }
    };
    
    socketRef.current.send(JSON.stringify(joinMessage));
    setSessionJoined(true);
    
    // Store messages
    setMessages(prev => [...prev, {
      type: 'sent',
      message: joinMessage,
      timestamp: Date.now()
    }]);
    
    toast({
      title: 'Session Joined',
      description: `Joined session: ${sessionId}`,
      variant: 'default',
    });
  }, [connected, sessionId, userId, userName, toast]);

  // Leave session
  const leaveSession = useCallback(() => {
    if (!connected || !socketRef.current || !sessionJoined) {
      return;
    }
    
    const leaveMessage: CollaborationMessage = {
      type: MessageType.LEAVE_SESSION,
      sessionId,
      userId,
      userName,
      timestamp: Date.now()
    };
    
    socketRef.current.send(JSON.stringify(leaveMessage));
    setSessionJoined(false);
    
    // Store messages
    setMessages(prev => [...prev, {
      type: 'sent',
      message: leaveMessage,
      timestamp: Date.now()
    }]);
    
    toast({
      title: 'Session Left',
      description: `Left session: ${sessionId}`,
      variant: 'default',
    });
  }, [connected, sessionJoined, sessionId, userId, userName, toast]);

  // Send cursor position
  const sendCursorPosition = useCallback(() => {
    if (!connected || !socketRef.current || !sessionJoined) {
      return;
    }
    
    const cursorMessage: CollaborationMessage = {
      type: MessageType.CURSOR_POSITION,
      sessionId,
      userId,
      userName,
      timestamp: Date.now(),
      payload: {
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600),
        section: 'property-details'
      }
    };
    
    socketRef.current.send(JSON.stringify(cursorMessage));
    
    // Store messages
    setMessages(prev => [...prev, {
      type: 'sent',
      message: cursorMessage,
      timestamp: Date.now()
    }]);
    
    toast({
      title: 'Cursor Position Sent',
      description: 'Sent cursor position update',
      variant: 'default',
    });
  }, [connected, sessionJoined, sessionId, userId, userName, toast]);

  // Send edit operation
  const sendEditOperation = useCallback(() => {
    if (!connected || !socketRef.current || !sessionJoined) {
      return;
    }
    
    const editMessage: CollaborationMessage = {
      type: MessageType.EDIT_OPERATION,
      sessionId,
      userId,
      userName,
      timestamp: Date.now(),
      payload: {
        operation: 'update',
        path: 'property.value',
        value: `$${(Math.random() * 1000000).toFixed(2)}`,
        revision: Math.floor(Math.random() * 100)
      }
    };
    
    socketRef.current.send(JSON.stringify(editMessage));
    
    // Store messages
    setMessages(prev => [...prev, {
      type: 'sent',
      message: editMessage,
      timestamp: Date.now()
    }]);
    
    toast({
      title: 'Edit Operation Sent',
      description: 'Sent property value update',
      variant: 'default',
    });
  }, [connected, sessionJoined, sessionId, userId, userName, toast]);

  // Send custom message
  const sendCustomMessage = useCallback(() => {
    if (!connected || !socketRef.current || !sessionJoined || !inputMessage) {
      return;
    }
    
    const message: CollaborationMessage = {
      type: MessageType.COMMENT,
      sessionId,
      userId,
      userName,
      timestamp: Date.now(),
      payload: {
        text: inputMessage
      }
    };
    
    socketRef.current.send(JSON.stringify(message));
    
    // Store messages
    setMessages(prev => [...prev, {
      type: 'sent',
      message,
      timestamp: Date.now()
    }]);
    
    // Clear input
    setInputMessage('');
    
    toast({
      title: 'Comment Sent',
      description: 'Sent comment to collaboration session',
      variant: 'default',
    });
  }, [connected, sessionJoined, sessionId, userId, userName, inputMessage, toast]);

  // Format message for display
  const formatMessage = (msg: any) => {
    if (msg.type === 'system') {
      return (
        <div className="text-muted-foreground text-sm italic">
          {msg.message}
        </div>
      );
    }
    
    if (msg.type === 'sent' || msg.type === 'received') {
      const message = msg.message;
      const isReceived = msg.type === 'received';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      
      return (
        <div className={`flex flex-col ${isReceived ? 'items-start' : 'items-end'} mb-2`}>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={isReceived ? "outline" : "default"}>
              {isReceived ? 'Received' : 'Sent'}
            </Badge>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
          <div className={`rounded-lg p-3 max-w-[80%] ${isReceived ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
            <div className="font-semibold mb-1">{message.type}</div>
            <div className="text-sm">
              <pre className="whitespace-pre-wrap overflow-auto max-h-60">
                {JSON.stringify(message, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Collaboration WebSocket Testing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>WebSocket connection information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={connected ? "default" : "destructive"} className="py-1">
                    {connected ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                    {connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  
                  <Badge variant={sessionJoined ? "outline" : "secondary"} className="py-1">
                    <Users className="w-4 h-4 mr-1" />
                    {sessionJoined ? 'Session Active' : 'Not in Session'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="sessionId">Session ID</Label>
                    <Input
                      id="sessionId"
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      disabled={sessionJoined}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      type="number"
                      value={userId}
                      onChange={(e) => setUserId(parseInt(e.target.value) || 0)}
                      disabled={sessionJoined}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="userName">User Name</Label>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      disabled={sessionJoined}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {!connected && (
                <Button onClick={connectWebSocket} className="w-full">
                  Reconnect
                </Button>
              )}
              
              {connected && !sessionJoined && (
                <Button onClick={joinSession} className="w-full">
                  Join Session
                </Button>
              )}
              
              {connected && sessionJoined && (
                <Button onClick={leaveSession} variant="destructive" className="w-full">
                  Leave Session
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {sessionJoined && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Test Actions</CardTitle>
                <CardDescription>Send test messages to the server</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={sendCursorPosition} 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <MousePointerClick className="w-4 h-4" />
                  Send Cursor Position
                </Button>
                
                <Button 
                  onClick={sendEditOperation} 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Send Edit Operation
                </Button>
                
                <Separator />
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="customMessage">Custom Comment</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customMessage"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Enter a comment..."
                    />
                    <Button 
                      onClick={sendCustomMessage} 
                      size="icon"
                      disabled={!inputMessage}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Message Log</CardTitle>
              <CardDescription>WebSocket communication history</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      No messages yet. Connect and join a session to start collaborating.
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index}>
                        {formatMessage(msg)}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollaborationTestPage;