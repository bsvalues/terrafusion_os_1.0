import React, {useState, useEffect, useRef} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Alert} from '@/components/ui/alert';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Textarea} from '@/components/ui/textarea';
import {Layout} from '@/components/layout';
import {Info, Warning} from '@mui/icons-material';

/**
 * WebSocket Test Page - Advanced testing utility for WebSocket connections
 */
export default function WebSocketTestPage() {const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('TestUser_' + Math.floor(Math.random() * 1000));
  const [roomId, setRoomId] = useState('test-room');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Array<{ type: string; timestamp: number; data: any}>>(
    []
  );
  const [customMessageText, setCustomMessageText] = useState('');
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [joinedRoom, setJoinedRoom] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() =>{if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;}
    }
  }, [messages]);

  // Connect to WebSocket
  const connectWebSocket = () => {// Clear any previous errors
    setError(null);

    // Close existing connection if any
    if (socket) {
      socket.close();
      setSocket(null);}

    try {
      // Establish new connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {setConnected(true);
        addMessage('connection', { status: 'Connected to WebSocket server'});

        // Join room immediately upon connection
        if (roomId) {joinRoom(newSocket);}
      };

      newSocket.onmessage = event => {try {
          const data = JSON.parse(event.data);
          addMessage('message', data);

          // Handle specific message types
          if (data.type === 'ping_response') {
            setLastPing(new Date());} else if (data.type === 'room_joined') {
            setJoinedRoom(data.roomId);
            addMessage('info', { message: `Successfully joined room: ${data.roomId}` });
          }
        } catch (err) {addMessage('error', { message: 'Failed to parse message', raw: event.data});
        }
      };

      newSocket.onclose = event => {setConnected(false);
        setJoinedRoom('');
        addMessage('connection', {
          status: 'Disconnected',
          code: event.code,
          reason: event.reason || 'No reason provided',});
      };

      newSocket.onerror = event => {setError('WebSocket connection error occurred');
        addMessage('error', { message: 'Connection error occurred'});
      };

      setSocket(newSocket);
    } catch (err) {setError('Failed to establish WebSocket connection');
      addMessage('error', { message: 'Failed to establish connection'});
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {if (socket) {
      socket.close();
      setSocket(null);}
  };

  // Join a room
  const joinRoom = (socketToUse = socket) => {if (socketToUse && connected && roomId) {
      const message = {
        type: 'join_room',
        roomId: roomId,
        username: username,};
      socketToUse.send(JSON.stringify(message));
      addMessage('outbound', message);
    }
  };

  // Send a test message
  const sendMessage = () => {if (socket && connected && messageText.trim()) {
      const message = {
        type: 'message',
        roomId: joinedRoom || roomId,
        username: username,
        text: messageText,
        timestamp: Date.now(),};
      socket.send(JSON.stringify(message));
      addMessage('outbound', message);
      setMessageText('');
    }
  };

  // Send a ping
  const sendPing = () => {if (socket && connected) {
      const message = {
        type: 'ping',
        timestamp: Date.now(),};
      socket.send(JSON.stringify(message));
      addMessage('outbound', message);
    }
  };

  // Send custom message
  const sendCustomMessage = () => {if (socket && connected && customMessageText.trim()) {
      try {
        const message = JSON.parse(customMessageText);
        socket.send(JSON.stringify(message));
        addMessage('outbound', message);
        setCustomMessageText('');} catch (err) {setError('Invalid JSON format in custom message');
        addMessage('error', { message: 'Invalid JSON format'});
      }
    }
  };

  // Add message to log
  const addMessage = (type: string, data: any) => {setMessages(prev => [
      ...prev,
      {
        type,
        timestamp: Date.now(),
        data,},
    ]);
  };

  // Clear message log
  const clearMessages = () => {setMessages([]);};

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {return new Date(timestamp).toLocaleTimeString();};

  // Get message display color
  const getMessageColor = (type: string) => {switch (type) {
      case 'connection':
        return 'text-blue-600';
      case 'outbound':
        return 'text-green-600';
      case 'message':
        return 'text-gray-800';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';}
  };

  return (<Layout title="WebSocket Testing Console"><div className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2">WebSocket Testing Console<Badge variant={connected ? 'default' : 'secondary'}>{connected ? 'Connected' : 'Disconnected'}</Badge></CardTitle><CardDescription>Test and debug WebSocket connections, room management, and real-time messaging</CardDescription></CardHeader><CardContent className="space-y-6">{/* Connection Section */}<div className="space-y-4"><h3 className="text-lg font-medium">Connection Settings</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="username">Username</Label><Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={connected}
                  /></div><div className="space-y-2"><Label htmlFor="roomId">Room ID</Label><Input
                    id="roomId"
                    type="text"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    placeholder="Enter room ID"
                  /></div></div><div className="flex gap-2"><Button
                  onClick={connectWebSocket}
                  disabled={connected}
                  className="bg-green-600 hover:bg-green-700"
                >Connect</Button><Button onClick={disconnectWebSocket} disabled={!connected} variant="destructive">Disconnect</Button><Button
                  onClick={() =>joinRoom()}
                  disabled={!connected || !roomId}
                  variant="outline"
                >
                  Join Room</Button></div>{/* Connection Status */}<div className="flex items-center gap-2 p-3 bg-gray-50 rounded"><div
                  className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
                ></div><span className="text-sm">Status:{' '}
                  {connected ? (<span className="text-green-600 font-medium">Connected</span>) : (<span className="text-red-600 font-medium">Disconnected</span>)}</span>{joinedRoom && (<React.Fragment><Separator orientation="vertical" className="h-4" /><span className="text-sm">Room: {joinedRoom}</span></React.Fragment>)}</div></div><Separator />{/* Message Testing */}<Tabs defaultValue="simple" className="w-full"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="simple">Simple Messages</TabsTrigger><TabsTrigger value="ping">Ping/Pong</TabsTrigger><TabsTrigger value="custom" className="flex-1">Custom JSON</TabsTrigger></TabsList><TabsContent value="simple" className="space-y-4"><div className="space-y-4"><div className="space-y-2"><Label htmlFor="messageText">Message Text</Label><div className="flex gap-2"><Input
                        id="messageText"
                        type="text"
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Enter your message"
                        onKeyPress={e => e.key === 'Enter' && sendMessage()}
                        disabled={!connected}
                      /><Button onClick={sendMessage} disabled={!connected || !messageText.trim()}>Send</Button></div></div></div></TabsContent><TabsContent value="ping" className="space-y-4"><div className="space-y-4"><div className="flex items-center gap-4"><Button onClick={sendPing} disabled={!connected} variant="outline">Send Ping</Button>{lastPing && (<div className="text-sm text-muted-foreground">Last ping response: {lastPing.toLocaleTimeString()}</div>)}</div><Alert><Info className="h-4 w-4" /><div><p className="text-sm font-medium">Ping Test Information</p><p className="text-sm text-muted-foreground mt-1">Send ping messages to test server response time and connection stability.</p></div></Alert></div></TabsContent><TabsContent value="custom" className="space-y-4"><div className="space-y-4"><div className="space-y-2"><Label htmlFor="customMessage">Custom JSON Message</Label><Textarea
                      id="customMessage"
                      value={customMessageText}
                      onChange={e => setCustomMessageText(e.target.value)}
                      placeholder='{"type": "custom", "data": "your message"}'
                      rows={4}
                      disabled={!connected}
                    /></div><Button
                    onClick={sendCustomMessage}
                    disabled={!connected || !customMessageText.trim()}
                  >Send Custom Message</Button><Alert><Warning className="h-4 w-4" /><div><p className="text-sm font-medium">Custom Message Format</p><p className="text-sm text-muted-foreground mt-1">Send custom JSON messages for advanced testing. Ensure valid JSON format.</p><ul className="list-disc list-inside space-y-1 mt-1"><li className="text-xs">Use proper JSON syntax with quotes</li><li className="text-xs">Include required fields like "type"</li><li className="text-xs">Test different message structures</li></ul></div></Alert></div></TabsContent></Tabs><Separator />{/* Message Log */}<div className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-medium">Message Log</h3><Button onClick={clearMessages} variant="outline" size="sm">Clear Log</Button></div><ScrollArea ref={scrollAreaRef} className="flex-grow border rounded-md p-4"><div className="space-y-2 min-h-[300px]">{messages.length === 0 ? (<div className="text-center text-muted-foreground py-8">No messages yet. Connect and start sending messages to see them here.</div>) : (
                    messages.map((message, index) => (<div key={index} className="text-sm border-b pb-2 last:border-b-0"><div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-xs px-2 py-1">{message.type}</Badge><span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span></div><div className={`font-mono text-xs ${getMessageColor(message.type)}`}>{typeof message.data === 'object'
                            ? JSON.stringify(message.data, null, 2)
                            : message.data}</div></div>))
                  )}</div></ScrollArea></div>{/* Error Display */}
            {error && (<Alert variant="destructive"><Warning className="h-4 w-4" /><div><p className="text-sm font-medium">Connection Error</p><p className="text-sm mt-1">{error}</p></div></Alert>)}</CardContent></Card>{/* Documentation */}<Card><CardHeader><CardTitle>WebSocket Testing Documentation</CardTitle><CardDescription>Guide for testing WebSocket functionality</CardDescription></CardHeader><CardContent><div className="space-y-4"><div><h4 className="text-sm font-medium mb-2">Available Message Types</h4><ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground"><li><code>join_room</code>- Join a collaborative room</li><li><code>message</code>- Send text message to room</li><li><code>ping</code>- Test server connectivity</li><li><code>cursor_move</code>- Share cursor position</li><li><code>document_edit</code>- Share document changes</li></ul></div><div><h4 className="text-sm font-medium mb-2">Connection States</h4><ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground"><li><span className="text-green-600">Connected</span>- WebSocket is connected and
                    ready</li><li><span className="text-red-600">Disconnected</span>- No active WebSocket
                    connection</li><li><span className="text-yellow-600">Connecting</span>- Attempting to establish
                    connection</li></ul></div></div></CardContent></Card></div></Layout>
  );
}
