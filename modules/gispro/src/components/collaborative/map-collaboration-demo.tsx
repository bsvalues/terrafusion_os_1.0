import React, { useState, useEffect, useRef } from 'react';
import { useEnhancedWebSocket, MessageTypeEnum, ConnectionStatusEnum, WebSocketMessage } from '@/hooks/use-enhanced-websocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';
import { Users, 
  MapPin, 
  Send, 
  User, 
  LogIn, 
  LogOut, 
  Layers, 
  Edit3, 
  MessageSquare, 
  Pointer, 
  Map as MapIcon,
  CheckCircle,
  AlertCircle
 } from '@mui/icons-material';

// Simulated map cursor position
interface MapCursor {
  userId: string;
  username: string;
  position: {
    x: number;
    y: number;
    lat?: number;
    lng?: number;
  };
  timestamp: number;
}

// Simulated map drawing data
interface MapDrawing {
  id: string;
  userId: string;
  username: string;
  type: 'point' | 'line' | 'polygon' | 'rectangle' | 'circle' | 'marker';
  coordinates: any; // Simplified for demo
  properties?: Record<string, any>;
  timestamp: number;
}

export default function MapCollaborationDemo() {
  // Local state
  const [roomId, setRoomId] = useState('map-collab-room');
  const [roomName, setRoomName] = useState('Map Collaboration Demo');
  const [message, setMessage] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [userCursors, setUserCursors] = useState<Record<string, MapCursor>>({});
  const [drawings, setDrawings] = useState<MapDrawing[]>([]);
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket with enhanced features
  const {
    send,
    status,
    messages,
    joinRoom,
    leaveRoom,
    clearMessages,
    currentRoom,
    connected,
    disconnect,
    reconnect,
    userId,
    username
  } = useEnhancedWebSocket({
    reconnectInterval: 3000,
    reconnectAttempts: 5,
    userId: `user-${uuidv4().substring(0, 5)}`,
    username: `User-${Math.floor(Math.random() * 1000)}`
  });

  // Filter chat messages from all messages
  const chatMessages = messages.filter(msg => msg.type === MessageTypeEnum.CHAT);

  // Join a room
  const handleJoinRoom = () => {
    if (!roomId.trim()) return;
    joinRoom(roomId, roomName, 'map');
  };

  // Leave a room
  const handleLeaveRoom = () => {
    if (currentRoom) {
      leaveRoom(currentRoom);
    }
  };

  // Send a chat message
  const sendChatMessage = () => {
    if (!message.trim() || !currentRoom) return;
    
    send({
      type: MessageTypeEnum.CHAT,
      roomId: currentRoom,
      payload: {
        text: message
      }
    });
    
    setMessage('');
  };

  // Send cursor position update
  const sendCursorPosition = (x: number, y: number) => {
    if (!currentRoom) return;
    
    send({
      type: MessageTypeEnum.CURSOR_POSITION,
      roomId: currentRoom,
      payload: {
        position: { x, y },
        timestamp: Date.now()
      }
    });
  };

  // Simulate drawing on the map
  const simulateDrawing = (type: 'point' | 'line' | 'polygon' = 'point') => {
    if (!currentRoom) return;
    
    // Create a sample drawing (in a real app, this would come from the map interaction)
    const sampleDrawings = {
      point: { lat: 44.0582, lng: -121.3153 },
      line: [
        { lat: 44.0582, lng: -121.3153 },
        { lat: 44.0600, lng: -121.3200 }
      ],
      polygon: [
        { lat: 44.0582, lng: -121.3153 },
        { lat: 44.0600, lng: -121.3200 },
        { lat: 44.0550, lng: -121.3250 },
        { lat: 44.0582, lng: -121.3153 }
      ]
    };
    
    const drawing: MapDrawing = {
      id: uuidv4(),
      userId,
      username,
      type,
      coordinates: sampleDrawings[type],
      properties: {
        color: '#FF5733',
        label: `${type} by ${username}`
      },
      timestamp: Date.now()
    };
    
    // Send the drawing to others
    send({
      type: MessageTypeEnum.DRAWING,
      roomId: currentRoom,
      payload: drawing
    });
    
    // Add to local state
    setDrawings(prev => [...prev, drawing]);
  };

  // Handle mouse move on map area
  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapAreaRef.current || !currentRoom) return;
    
    const rect = mapAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100; // percentage
    
    setCursorPosition({ x, y });
    sendCursorPosition(x, y);
  };

  // Auto scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Process incoming messages for cursor position, drawings, etc.
  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === MessageTypeEnum.CURSOR_POSITION && message.userId !== userId) {
        setUserCursors(prev => ({
          ...prev,
          [message.userId || 'unknown']: {
            userId: message.userId || 'unknown',
            username: message.username || 'Unknown user',
            position: message.payload?.position || { x: 0, y: 0 },
            timestamp: message.payload?.timestamp || Date.now()
          }
        }));
      } else if (message.type === MessageTypeEnum.DRAWING && message.userId !== userId) {
        setDrawings(prev => [...prev, message.payload]);
      }
    };

    // Process the last message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      handleMessage(lastMessage);
    }
  }, [messages, userId]);

  // Clean up old cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setUserCursors(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          // Remove cursors older than 5 seconds
          if (now - updated[key].timestamp > 5000) {
            delete updated[key];
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col space-y-4 w-full max-w-6xl mx-auto">
      <Card className="w-full">
        <CardHeader><>

          <CardTitle>Map Collaboration Demo</CardTitle>
          <CardDescription
</>>
            Collaborate in real-time on maps with others
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between space-x-4 mb-4">
            <div>
              <Badge 
                variant={
                  status === ConnectionStatusEnum.CONNECTED ? 'default' : 
                  status === ConnectionStatusEnum.CONNECTING ? 'outline' : 
                  status === ConnectionStatusEnum.DISCONNECTED ? 'secondary' : 'destructive'
                }
                className="flex items-center gap-1"
              >
                {status === ConnectionStatusEnum.CONNECTED && <CheckCircle className="h-3 w-3" />}
                {status === ConnectionStatusEnum.ERROR && <AlertCircle className="h-3 w-3" />}
                {status}
              </Badge>
            </div>
            
            <div>
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {username}
              </Badge>
            </div>
            
            <div>
              <Badge variant={currentRoom ? 'default' : 'secondary'} className="flex items-center gap-1">
                <MapIcon className="h-3 w-3" />
                {currentRoom || 'Not in a map room'}
              </Badge>
            </div>
          </div>
          
          {!currentRoom ? (
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-4">
              <div className="flex-1"><>

                <label htmlFor="room-id" className="text-sm font-medium block mb-1">Room ID:</label>
                <Input
</>
                  id="room-id"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter map room ID"
                  disabled={!!currentRoom}
                />
              </div>
              
              <div className="flex-1"><>

                <label htmlFor="room-name" className="text-sm font-medium block mb-1">Room Name:</label>
                <Input
</>
                  id="room-name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter map room name"
                  disabled={!!currentRoom}
                />
              </div>
              
              <div className="flex-none flex items-end">
                <Button onClick={handleJoinRoom} disabled={!connected || !roomId.trim()}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Join Map Room
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="map" className="w-full">
              <TabsList className="mb-4 w-full justify-start">
                <TabsTrigger value="map" className="flex items-center"><>

                  <MapIcon className="mr-2 h-4 w-4" />
                  Map
                </TabsTrigger>
                <TabsTrigger
</> value="chat" className="flex items-center"><>

                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
</> value="users" className="flex items-center"><>

                  <Users className="mr-2 h-4 w-4" />
                  Users
                </TabsTrigger>
                <div
</> className="flex-1 flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Room
                  </Button>
                </div>
              </TabsList>
              
              <TabsContent value="map" className="border rounded-md p-0 overflow-hidden">
                <div className="flex">
                  <div 
                    ref={mapAreaRef}
                    onMouseMove={handleMapMouseMove}
                    className="h-[400px] flex-1 relative bg-muted/20 flex flex-col items-center justify-center"
                  >
                    {/* Simulated map area */}
                    <div className="text-center z-10 mb-2 flex flex-col items-center">
                      <MapIcon className="h-16 w-16 text-primary/20 mb-2" /><>

                      <p className="text-muted-foreground">
                        This is a simulated map area for collaboration demo
                      </p>
                      <p
</> className="text-xs text-muted-foreground mt-2">
                        (In a real application, this would be a Mapbox or Leaflet map)
                      </p>
                    </div>
                    
                    {/* Map toolbar */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-2 z-20">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => simulateDrawing('point')}
                        title="Add point"
                      ><>

                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button
</> 
                        size="icon" 
                        variant="outline" 
                        onClick={() => simulateDrawing('line')}
                        title="Add line"
                      ><>

                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
</> 
                        size="icon" 
                        variant="outline" 
                        onClick={() => simulateDrawing('polygon')}
                        title="Add polygon"
                      >
                        <Layers className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* User cursors */}
                    {Object.values(userCursors).map((cursor) => (
                      <div
                        key={cursor.userId}
                        className="absolute z-30 pointer-events-none"
                        style={{
                          left: `${cursor.position.x}%`,
                          top: `${cursor.position.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <Pointer className="h-4 w-4 text-primary" />
                          <span className="text-xs bg-background px-2 py-1 rounded shadow-sm">
                            {cursor.username}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Drawing indicators */}
                    {drawings.length > 0 && (
                      <div className="absolute bottom-2 left-2 z-20 bg-background/80 p-2 rounded shadow-sm"><>

                        <p className="text-xs font-medium mb-1">Recent Drawings:</p>
                        <div
</> className="max-h-24 overflow-y-auto space-y-1">
                          {drawings.slice(-5).map((drawing) => (
                            <div key={drawing.id} className="text-xs flex items-center space-x-2"><>

                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: drawing.properties?.color || '#FF5733' }}
                              ></span>
                              <span
</>>
                                {drawing.properties?.label || `${drawing.type} by ${drawing.username}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="chat">
                <div className="border rounded-md p-4">
                  <ScrollArea 
                    ref={chatContainerRef}
                    className="h-[300px] mb-4"
                  >
                    <div className="space-y-3 p-2">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        chatMessages.map((msg /* , index */) => (
                          <div 
                            key={`${msg.timestamp}-${index}`}
                            className={`p-3 rounded-lg max-w-[80%] ${
                              msg.userId === userId 
                                ? 'ml-auto bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex justify-between items-start"><>

                              <span className="font-semibold text-xs">
                                {msg.username || 'Unknown user'}
                              </span>
                              <span
</> className="text-xs opacity-70">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                              </span>
                            </div>
                            <div className="mt-1">
                              {msg.payload?.text}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    />
                    <Button onClick={sendChatMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="users">
                <div className="border rounded-md p-4"><>

                  <h3 className="text-sm font-medium mb-3">Active Users in Room</h3>
                  <div
</> className="space-y-2">
                    {/* Current user */}
                    <div className="flex items-center space-x-3 p-2 bg-muted/30 rounded-md">
                      <Avatar>
                        <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div><>

                        <p className="text-sm font-medium">{username} (You)</p>
                        <p
</> className="text-xs text-muted-foreground">ID: {userId.substring(0, 8)}</p>
                      </div>
                      <Badge className="ml-auto">Active</Badge>
                    </div>
                    
                    {/* Other users derived from cursor positions */}
                    {Object.values(userCursors).map((cursor) => (
                      <div key={cursor.userId} className="flex items-center space-x-3 p-2 rounded-md">
                        <Avatar>
                          <AvatarFallback>{cursor.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div><>

                          <p className="text-sm font-medium">{cursor.username}</p>
                          <p
</> className="text-xs text-muted-foreground">ID: {cursor.userId.substring(0, 8)}</p>
                        </div>
                        <Badge variant="outline" className="ml-auto">Active</Badge>
                      </div>
                    ))}
                    
                    {Object.keys(userCursors).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No other users currently active in this room
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between text-xs text-muted-foreground">
          <p>WebSocket path: <code className="bg-muted p-1 rounded">/ws</code></p>
          <p>{chatMessages.length} message(s) | {drawings.length} drawing(s)</p>
        </CardFooter>
      </Card>
    </div>
  );
}