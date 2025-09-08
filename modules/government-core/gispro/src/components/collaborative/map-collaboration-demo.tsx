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
import { 
  Users, 
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
    participants,
    joinRoomWithName
  } = useEnhancedWebSocket({
    onMessage: (message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    },
    onConnectionChange: (connected: boolean) => {
      if (!connected) {
        setUserCursors({});
      }
    }
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case MessageTypeEnum.CURSOR_MOVE:
        if (message.data.userId !== participants.find(p => p.isCurrentUser)?.id) {
          setUserCursors(prev => ({
            ...prev,
            [message.data.userId]: {
              userId: message.data.userId,
              username: message.data.username,
              position: message.data.position,
              timestamp: message.timestamp
            }
          }));
        }
        break;
        
      case MessageTypeEnum.MAP_DRAW:
        if (message.data.drawing) {
          setDrawings(prev => [
            ...prev.filter(d => d.id !== message.data.drawing.id),
            message.data.drawing
          ]);
        }
        break;
        
      case MessageTypeEnum.MAP_EDIT:
        if (message.data.drawingId) {
          setDrawings(prev => prev.map(drawing => 
            drawing.id === message.data.drawingId 
              ? { ...drawing, ...message.data.changes }
              : drawing
          ));
        }
        break;
        
      case MessageTypeEnum.MAP_DELETE:
        if (message.data.drawingId) {
          setDrawings(prev => prev.filter(d => d.id !== message.data.drawingId));
        }
        break;
        
      case MessageTypeEnum.USER_LEFT:
        setUserCursors(prev => {
          const updated = { ...prev };
          delete updated[message.data.userId];
          return updated;
        });
        break;
    }
  };

  // Join collaboration room
  const handleJoinRoom = () => {
    if (roomId.trim()) {
      joinRoomWithName(roomId, roomName);
    }
  };

  // Leave collaboration room
  const handleLeaveRoom = () => {
    leaveRoom();
    setUserCursors({});
    setDrawings([]);
  };

  // Send chat message
  const sendChatMessage = () => {
    if (message.trim() && connected) {
      send({
        type: MessageTypeEnum.CHAT_MESSAGE,
        data: {
          message: message.trim(),
          timestamp: Date.now()
        }
      });
      setMessage('');
    }
  };

  // Handle mouse movement on map area
  const handleMapMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapAreaRef.current || !connected) return;
    
    const rect = mapAreaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setCursorPosition({ x, y });
    
    // Throttle cursor updates
    const now = Date.now();
    if (now - (handleMapMouseMove as any).lastUpdate > 100) {
      send({
        type: MessageTypeEnum.CURSOR_MOVE,
        data: {
          position: { x, y },
          timestamp: now
        }
      });
      (handleMapMouseMove as any).lastUpdate = now;
    }
  };

  // Simulate drawing on map
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapAreaRef.current || !connected) return;
    
    const rect = mapAreaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newDrawing: MapDrawing = {
      id: uuidv4(),
      userId: participants.find(p => p.isCurrentUser)?.id || 'unknown',
      username: participants.find(p => p.isCurrentUser)?.name || 'Unknown User',
      type: 'marker',
      coordinates: { x, y },
      properties: {
        color: '#FF6B6B',
        size: 8
      },
      timestamp: Date.now()
    };
    
    setDrawings(prev => [...prev, newDrawing]);
    
    send({
      type: MessageTypeEnum.MAP_DRAW,
      data: {
        drawing: newDrawing
      }
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: ConnectionStatusEnum) => {
    switch (status) {
      case ConnectionStatusEnum.CONNECTED:
        return 'default';
      case ConnectionStatusEnum.CONNECTING:
        return 'secondary';
      case ConnectionStatusEnum.DISCONNECTED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ConnectionStatusEnum) => {
    switch (status) {
      case ConnectionStatusEnum.CONNECTED:
        return <CheckCircle className="h-4 w-4" />;
      case ConnectionStatusEnum.CONNECTING:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Map Collaboration Demo</h1>
          <p className="text-muted-foreground">
            Real-time collaborative mapping with cursor tracking and synchronized editing
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(status)} className="flex items-center gap-1">
            {getStatusIcon(status)}
            {status}
          </Badge>
          
          {currentRoom && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {participants.length} users
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Collaborative Map
              </CardTitle>
              <CardDescription>
                Click to add markers, see live cursors from other users
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div
                ref={mapAreaRef}
                className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair overflow-hidden"
                onMouseMove={handleMapMouseMove}
                onClick={handleMapClick}
              >
                {/* Grid pattern for map simulation */}
                <div className="absolute inset-0 opacity-10">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#000" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                
                {/* Current user cursor indicator */}
                {connected && (
                  <div
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: cursorPosition.x - 8,
                      top: cursorPosition.y - 8
                    }}
                  >
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                  </div>
                )}
                
                {/* Other users' cursors */}
                {Object.values(userCursors).map((cursor) => (
                  <div
                    key={cursor.userId}
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: cursor.position.x - 8,
                      top: cursor.position.y - 8
                    }}
                  >
                    <div className="relative">
                      <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                      <div className="absolute top-4 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {cursor.username}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Map drawings */}
                {drawings.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="absolute pointer-events-none z-5"
                    style={{
                      left: drawing.coordinates.x - (drawing.properties?.size || 8) / 2,
                      top: drawing.coordinates.y - (drawing.properties?.size || 8) / 2
                    }}
                  >
                    <div
                      className="rounded-full border-2 border-white shadow-lg"
                      style={{
                        width: drawing.properties?.size || 8,
                        height: drawing.properties?.size || 8,
                        backgroundColor: drawing.properties?.color || '#FF6B6B'
                      }}
                      title={`${drawing.username} - ${new Date(drawing.timestamp).toLocaleTimeString()}`}
                    />
                  </div>
                ))}
                
                {/* Instructions overlay */}
                {!connected && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Join a Room to Collaborate</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to start collaborating on the map
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Room Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Room Management
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Room ID</label>
                <Input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  disabled={connected}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Room Name</label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  disabled={connected}
                />
              </div>
              
              <div className="flex gap-2">
                {!connected ? (
                  <Button onClick={handleJoinRoom} className="flex-1">
                    <LogIn className="h-4 w-4 mr-2" />
                    Join Room
                  </Button>
                ) : (
                  <Button onClick={handleLeaveRoom} variant="destructive" className="flex-1">
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Room
                  </Button>
                )}
              </div>
              
              {currentRoom && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Connected to: {currentRoom}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No participants yet
                  </p>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {participant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium">{participant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {participant.isCurrentUser ? 'You' : 'Collaborator'}
                        </p>
                      </div>
                      
                      {participant.isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ScrollArea className="h-48">
                <div ref={chatContainerRef} className="space-y-2">
                  {messages.filter(m => m.type === MessageTypeEnum.CHAT_MESSAGE).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet
                    </p>
                  ) : (
                    messages
                      .filter(m => m.type === MessageTypeEnum.CHAT_MESSAGE)
                      .map((msg, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex items-start gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {msg.username?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{msg.username}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm">{msg.data.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  disabled={!connected}
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!connected || !message.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Map Tools
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" disabled={!connected}>
                  <Layers className="h-4 w-4 mr-2" />
                  Layers
                </Button>
                
                <Button variant="outline" size="sm" disabled={!connected}>
                  <Pointer className="h-4 w-4 mr-2" />
                  Select
                </Button>
                
                <Button variant="outline" size="sm" disabled={!connected}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Marker
                </Button>
                
                <Button variant="outline" size="sm" disabled={!connected}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Draw
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Drawings</span>
                  <Badge variant="outline">{drawings.length}</Badge>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Click on the map to add markers
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
