import React, { useState, useEffect, useRef } from 'react';
import { useEnhancedWebSocket, MessageTypeEnum, ConnectionStatusEnum } from '@/hooks/use-enhanced-websocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import {
  Badge
} from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle, CheckCircle, Send, Users, LogIn, LogOut, Refresh, Trash  } from '@mui/icons-material';

export default function WebSocketDemo() {
  // Local state
  const [message, setMessage] = useState('');
  const [roomId, setRoomId] = useState('demo-room');
  const [roomName, setRoomName] = useState('Demo Collaboration Room');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Generate user ID for this demo
  const demoUserId = useRef(`user-${uuidv4().substring(0, 5)}`);
  const demoUsername = useRef(`User-${Math.floor(Math.random() * 1000)}`);
  
  // Initialize WebSocket with enhanced features
  const {
    send,
    status,
    messages,
    joinRoom,
    leaveRoom,
    roomId: currentRoom,
    isConnected,
    disconnect,
    connect
  } = useEnhancedWebSocket({
    roomId: 'demo-room',
    autoConnect: true
  });
  
  // Use local references for user ID and username
  const userId = demoUserId.current;
  const username = demoUsername.current;
  
  // Function to clear messages
  const clearMessages = () => {
    // No direct method to clear messages, so we'll just re-connect
    if (isConnected) {
      disconnect();
      setTimeout(() => connect(), 300);
    }
  };
  
  // Function to reconnect
  const reconnect = () => {
    disconnect();
    setTimeout(() => connect(), 300);
  };

  // Send a chat message
  const sendMessage = () => {
    if (!message.trim()) return;
    
    send({
      type: MessageTypeEnum.CHAT_MESSAGE,
      roomId: currentRoom || roomId,
      userId: userId,
      username: username,
      payload: {
        text: message
      }
    });
    
    setMessage('');
  };

  // Connect to a room
  const handleJoinRoom = () => {
    if (!roomId.trim()) return;
    const joined = joinRoom(roomId);
    
    // Send additional room metadata with room info if join was successful
    if (joined) {
      send({
        type: MessageTypeEnum.JOIN_ROOM,
        roomId: roomId,
        roomName: roomName,
        userId: userId,
        username: username
      });
    }
  };

  // Disconnect from a room
  const handleLeaveRoom = () => {
    if (currentRoom) {
      leaveRoom();
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keypress event (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-4xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader><>

          <CardTitle>WebSocket Collaboration Demo</CardTitle>
          <CardDescription
</>>
            Real-time collaboration using WebSocket for BentonGeoPro
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between space-x-4 mb-4">
            <div className="flex-1"><>

              <p className="text-sm font-medium mb-1">Connection Status:</p>
              <Badge
</> 
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
            
            <div className="flex-1"><>

              <p className="text-sm font-medium mb-1">Your Identity:</p>
              <Badge
</> variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {username} (ID: {userId.substring(0, 5)})
              </Badge>
            </div>
            
            <div className="flex-1"><>

              <p className="text-sm font-medium mb-1">Current Room:</p>
              <Badge
</> variant={currentRoom ? 'default' : 'secondary'} className="flex items-center gap-1">
                {currentRoom || 'Not in a room'}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1"><>

              <label htmlFor="room-id" className="text-sm font-medium block mb-1">Room ID:</label>
              <Input
</>
                id="room-id"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
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
                placeholder="Enter room name"
                disabled={!!currentRoom}
              />
            </div>
            
            <div className="flex-none flex items-end gap-2">
              {!currentRoom ? (
                <Button onClick={handleJoinRoom} disabled={!isConnected || !roomId.trim()}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Join Room
                </Button>
              ) : (
                <Button variant="outline" onClick={handleLeaveRoom}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Room
                </Button>
              )}
              
              <Button variant="ghost" onClick={clearMessages} title="Clear messages"><>

                <Trash className="h-4 w-4" />
              </Button>
              
              <Button
</> variant="ghost" onClick={isConnected ? disconnect : reconnect} title={isConnected ? "Disconnect" : "Reconnect"}>
                <Refresh className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md p-4 h-80 overflow-y-auto bg-muted/20 space-y-3 mb-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No messages yet. Join a room and start chatting!
              </div>
            )}
            
            {messages.map((msg /* , index */) => (
              <div 
                key={`${msg.timestamp}-${index}`}
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.userId === userId 
                    ? 'ml-auto bg-primary text-primary-foreground' 
                    : 'bg-muted'
                } ${
                  msg.type === 'system' 
                    ? 'w-full bg-accent/20 text-center italic text-sm' 
                    : ''
                } ${
                  msg.type === MessageTypeEnum.ERROR
                    ? 'w-full bg-destructive/20 text-center' 
                    : ''
                }`}
              >
                {msg.type === MessageTypeEnum.CHAT_MESSAGE && (
                  <>
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
                  </>
                )}
                
                {msg.type === 'user_presence' && (
                  <div className="text-center text-sm">
                    <span className="font-semibold">{msg.username}</span> has {msg.payload?.action} the room
                  </div>
                )}
                
                {msg.type === 'system' && (
                  <div>{msg.payload?.message}</div>
                )}
                
                {msg.type === MessageTypeEnum.ERROR && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {msg.payload?.message}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {isConnected && currentRoom && (
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1"
                rows={2}
              />
              <Button onClick={sendMessage} disabled={!message.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between text-xs text-muted-foreground">
          <div>WebSocket path: <code className="bg-muted p-1 rounded">/ws</code></div>
          <div>{messages.length} message(s) in history</div>
        </CardFooter>
      </Card>
    </div>
  );
}