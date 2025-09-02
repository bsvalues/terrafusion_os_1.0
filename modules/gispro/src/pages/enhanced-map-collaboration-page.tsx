import React, { useState } from 'react';
import { useTitle } from '@/hooks/use-title';
import { CollaborativeMapbox } from '@/components/maps/mapbox/collaborative-mapbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';
import { useEnhancedWebSocket, MessageTypeEnum, ConnectionStatusEnum } from '@/hooks/use-enhanced-websocket';
import { Send, LogIn, LogOut, MessageSquare, Users, Map as MapIcon, CheckCircle, AlertCircle  } from '@mui/icons-material';

export default function EnhancedMapCollaborationPage() {
  useTitle('Enhanced Map Collaboration | BentonGeoPro');
  
  const [roomId, setRoomId] = useState('map-collab-' + uuidv4().substring(0, 5));
  const [roomName, setRoomName] = useState('Collaborative Map Room');
  const [message, setMessage] = useState('');
  
  // Initialize WebSocket
  const {
    send,
    status,
    messages,
    joinRoom,
    leaveRoom,
    currentRoom,
    connected,
    userId,
    username
  } = useEnhancedWebSocket({
    reconnectInterval: 3000,
    reconnectAttempts: 5,
    username: `User-${Math.floor(Math.random() * 1000)}`
  });
  
  // Filter chat messages
  const chatMessages = messages.filter(msg => msg.type === MessageTypeEnum.CHAT);
  
  // Join a room handler
  const handleJoinRoom = () => {
    if (!roomId.trim()) return;
    joinRoom(roomId, roomName, 'map');
  };
  
  // Leave a room handler
  const handleLeaveRoom = () => {
    if (currentRoom) {
      leaveRoom(currentRoom);
    }
  };
  
  // Send chat message
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
  
  return (
    <div className="container mx-auto py-8"><>

      <h1 className="text-3xl font-bold mb-6 text-center">Enhanced Map Collaboration</h1>
      <p
</> className="text-center mb-8 max-w-3xl mx-auto text-muted-foreground">
        This demo showcases real-time collaboration capabilities on maps using Mapbox GL JS and WebSockets.
        Users can see each other's cursors, draw features, and communicate in real-time.
      </p>
      
      <Card className="w-full mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div><>

              <CardTitle>Collaborative Map</CardTitle>
              <CardDescription
</>>Work together with others in real-time</CardDescription>
            </div>
            <div className="flex items-center space-x-3">
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
              
              <Badge variant="outline" className="flex items-center gap-1">
                {username}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
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
              
              <TabsContent value="map" className="border rounded-md p-0 overflow-hidden"><>

                <CollaborativeMapbox 
                  roomId={currentRoom}
                  roomName={roomName}
                  height="500px"
                  initialViewState={{
                    longitude: -121.3153,
                    latitude: 44.0582,
                    zoom: 12
                  }}
                />
              </TabsContent>
              
              <TabsContent
</> value="chat">
                <div className="border rounded-md p-4">
                  <ScrollArea className="h-[300px] mb-4">
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

                  <h3 className="text-sm font-medium mb-3">Users Viewing This Map</h3>
                  <p
</> className="text-sm text-muted-foreground">
                    As users move their cursor on the map, they will appear here.
                    You can see active users directly on the map as well.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between text-xs text-muted-foreground"><>

          <p>Click on the map to add points</p>
          <p
</>>Use the toolbar to add lines and polygons</p>
        </CardFooter>
      </Card>
      
      <div className="mt-10 p-4 bg-muted/30 rounded-lg max-w-3xl mx-auto"><>

        <h2 className="text-xl font-semibold mb-3">Mapbox-Powered Collaboration Features</h2>
        <ul
</> className="list-disc pl-5 space-y-2"><>

          <li>Interactive Mapbox GL JS map with navigation controls</li>
                            <li
</>>Real-time cursor position sharing between users</li><>

          <li>Create and share points with a single click</li>
                            <li
</>>Add lines and polygons visible to all users</li><>

          <li>Real-time chat with others in the same map room</li>
                            <li
</>>Automatic reconnection on network issues</li>
          <li>Support for multiple collaborative rooms</li>
        </ul>
      </div>
    </div>
  );
}