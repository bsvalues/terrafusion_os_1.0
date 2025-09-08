import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  Map, 
  Users, 
  MessageSquare, 
  Send, 
  MousePointer2, 
  Eye,
  EyeOff,
  Layers,
  Drawing,
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Download,
  Share2,
  MapPin,
  Pencil,
  Square,
  Circle,
  Triangle,
  Minus
} from 'lucide-react';

// Mock data and types
interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen?: string;
  cursor?: { x: number; y: number };
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'drawing';
  payload?: any;
}

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  isActive: boolean;
}

// Mock users
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    avatar: '/avatars/john.jpg',
    color: '#3B82F6',
    isOnline: true,
    cursor: { x: 245, y: 156 }
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    avatar: '/avatars/sarah.jpg',
    color: '#10B981',
    isOnline: true,
    cursor: { x: 345, y: 200 }
  },
  {
    id: '3',
    name: 'Mike Davis',
    color: '#F59E0B',
    isOnline: false,
    lastSeen: '5 minutes ago'
  },
  {
    id: '4',
    name: 'Lisa Chen',
    color: '#EF4444',
    isOnline: true,
    cursor: { x: 180, y: 120 }
  }
];

// Mock chat messages
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    userId: '1',
    username: 'John Smith',
    message: 'Let me highlight the boundary we discussed',
    timestamp: '2024-01-15T10:30:00Z',
    type: 'message'
  },
  {
    id: '2',
    userId: '2',
    username: 'Sarah Johnson',
    message: 'Perfect, I can see your cursor near the property line',
    timestamp: '2024-01-15T10:31:00Z',
    type: 'message'
  },
  {
    id: '3',
    userId: '1',
    username: 'John Smith',
    message: 'Added a polygon to mark the disputed area',
    timestamp: '2024-01-15T10:32:00Z',
    type: 'drawing',
    payload: { tool: 'polygon', color: '#3B82F6' }
  },
  {
    id: '4',
    userId: 'system',
    username: 'System',
    message: 'Mike Davis joined the session',
    timestamp: '2024-01-15T10:33:00Z',
    type: 'system'
  }
];

// Drawing tools
const drawingTools: DrawingTool[] = [
  { id: 'select', name: 'Select', icon: <MousePointer2 className="h-4 w-4" />, color: '#6B7280', isActive: true },
  { id: 'point', name: 'Point', icon: <Circle className="h-4 w-4" />, color: '#3B82F6', isActive: false },
  { id: 'line', name: 'Line', icon: <Minus className="h-4 w-4" />, color: '#10B981', isActive: false },
  { id: 'polygon', name: 'Polygon', icon: <Square className="h-4 w-4" />, color: '#F59E0B', isActive: false },
  { id: 'circle', name: 'Circle', icon: <Circle className="h-4 w-4" />, color: '#EF4444', isActive: false },
  { id: 'pencil', name: 'Freehand', icon: <Pencil className="h-4 w-4" />, color: '#8B5CF6', isActive: false }
];

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const cursorVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.2 }
  },
  hover: {
    scale: 1.2,
    transition: { duration: 0.1 }
  }
};

const messageVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

export default function EnhancedMapCollaborationPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTool, setSelectedTool] = useState('select');
  const [isConnected, setIsConnected] = useState(true);
  const [showCursors, setShowCursors] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Simulate connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(prev => Math.random() > 0.1 ? true : prev);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle mouse movement on map
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  }, []);

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: 'current-user',
      username: 'You',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Handle key press in chat input
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get message style based on type
  const getMessageStyle = (message: ChatMessage) => {
    switch (message.type) {
      case 'system':
        return 'bg-muted text-muted-foreground';
      case 'drawing':
        return 'bg-blue-50 border border-blue-200';
      default:
        return message.userId === 'current-user' 
          ? 'bg-primary text-primary-foreground ml-8' 
          : 'bg-muted mr-8';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Enhanced Map Collaboration
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Real-time collaborative mapping with cursor tracking, drawing tools, 
          and integrated chat for seamless team coordination.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map Area */}
        <motion.div 
          className="lg:col-span-3"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="h-[600px] relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  <CardTitle>Collaborative Map View</CardTitle>
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? (
                      <div className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        Connected
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <WifiOff className="h-3 w-3" />
                        Disconnected
                      </div>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Drawing Tools */}
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    {drawingTools.map((tool) => (
                      <TooltipProvider key={tool.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedTool === tool.id ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setSelectedTool(tool.id)}
                              className="h-8 w-8 p-0"
                            >
                              {tool.icon}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tool.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  {/* View Controls */}
                  <Button
                    variant={showCursors ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowCursors(!showCursors)}
                  >
                    {showCursors ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>

                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-full">
              <div 
                ref={mapRef}
                className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 relative cursor-crosshair"
                onMouseMove={handleMouseMove}
                style={{ 
                  backgroundImage: `
                    radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                    linear-gradient(45deg, rgba(168, 85, 247, 0.05) 0%, transparent 100%)
                  `
                }}
              >
                {/* Grid Pattern */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Mock map elements */}
                <div className="absolute top-20 left-20 w-32 h-24 bg-green-200 border-2 border-green-400 rounded-lg flex items-center justify-center">
                  <span className="text-green-800 font-semibold">Park Area</span>
                </div>

                <div className="absolute top-40 right-32 w-40 h-20 bg-blue-200 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                  <span className="text-blue-800 font-semibold">Water Feature</span>
                </div>

                <div className="absolute bottom-32 left-40 w-28 h-28 bg-yellow-200 border-2 border-yellow-400 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-800 font-semibold">Building</span>
                </div>

                {/* Sample drawing annotations */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <polygon
                    points="150,100 200,80 250,120 200,160"
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <circle
                    cx="350"
                    cy="200"
                    r="30"
                    fill="rgba(16, 185, 129, 0.2)"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                  <line
                    x1="100"
                    y1="300"
                    x2="400"
                    y2="320"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>

                {/* User Cursors */}
                <AnimatePresence>
                  {showCursors && users.filter(user => user.isOnline && user.cursor).map((user) => (
                    <motion.div
                      key={user.id}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: user.cursor!.x,
                        top: user.cursor!.y,
                        color: user.color
                      }}
                      variants={cursorVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      whileHover="hover"
                    >
                      <div className="flex items-center gap-1">
                        <MousePointer2 
                          className="h-4 w-4 rotate-12 transform" 
                          style={{ color: user.color }}
                        />
                        <div 
                          className="bg-black text-white text-xs px-2 py-1 rounded-md whitespace-nowrap"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Your cursor indicator */}
                <div 
                  className="absolute pointer-events-none z-10 opacity-60"
                  style={{
                    left: mousePosition.x,
                    top: mousePosition.y
                  }}
                >
                  <MousePointer2 className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-muted/30 border-t">
              <p className="text-sm text-muted-foreground">
                Use the toolbar to add lines and polygons
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Collaboration Panel */}
        <motion.div 
          className="lg:col-span-1"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Collaboration</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid grid-cols-2 mx-4">
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Users
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-lg p-3 ${getMessageStyle(message)}`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-sm">
                                {message.username}
                              </span>
                              <span className="text-xs opacity-70">
                                {formatTimestamp(message.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                            {message.payload && (
                              <div className="mt-2 text-xs opacity-80">
                                <Drawing className="h-3 w-3 inline mr-1" />
                                Drew {message.payload.tool}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="flex-1 m-0">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">
                        Online Users ({users.filter(u => u.isOnline).length})
                      </span>
                      <Badge variant="outline">
                        {users.filter(u => u.isOnline).length}/{users.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {users.map((user) => (
                        <motion.div
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback style={{ backgroundColor: user.color }}>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div 
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                                user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.isOnline ? (
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: user.color }}
                                  />
                                  Online
                                </div>
                              ) : (
                                `Last seen ${user.lastSeen}`
                              )}
                            </div>
                          </div>

                          {user.isOnline && user.cursor && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MousePointer2 className="h-3 w-3" style={{ color: user.color }} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View cursor</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Collaboration Features
            </CardTitle>
            <CardDescription>
              Advanced real-time collaboration tools for team mapping projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MousePointer2 className="h-4 w-4 text-blue-600" />
                  Real-time Cursors
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• See other users' cursor positions in real-time</li>
                  <li>• Color-coded user identification</li>
                  <li>• Smooth cursor movement animations</li>
                  <li>• Optional cursor visibility toggle</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Drawing className="h-4 w-4 text-green-600" />
                  Collaborative Drawing
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Draw points, lines, and polygons</li>
                  <li>• Real-time shape synchronization</li>
                  <li>• User-specific drawing colors</li>
                  <li>• Drawing history and versioning</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  Integrated Chat
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time messaging</li>
                  <li>• Drawing action notifications</li>
                  <li>• User join/leave announcements</li>
                  <li>• Message history persistence</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  User Management
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Online/offline status indicators</li>
                  <li>• User avatars and profiles</li>
                  <li>• Permission-based access control</li>
                  <li>• Session management</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-teal-600" />
                  Connection Management
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic reconnection on network issues</li>
                  <li>• Connection status indicators</li>
                  <li>• Offline mode support</li>
                  <li>• Data synchronization on reconnect</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-600" />
                  Advanced Tools
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Export collaboration sessions</li>
                  <li>• Share session links</li>
                  <li>• Recording and playback</li>
                  <li>• Integration with GIS systems</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
