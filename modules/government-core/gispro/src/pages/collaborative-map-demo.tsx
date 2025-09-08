import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Users, 
  MessageSquare, 
  Map, 
  MousePointer2, 
  Layers,
  Send,
  Settings,
  Wifi,
  Activity,
  Drawing,
  MapPin,
  Eye,
  Share2,
  Download,
  Zap,
  Circle,
  Square,
  Minus,
  Pencil,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

// Types
interface User {
  id: number;
  name: string;
  color: string;
  isOnline: boolean;
  cursor?: { x: number; y: number };
  lastActivity?: string;
  avatar?: string;
}

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  time: string;
  type?: 'message' | 'system' | 'drawing' | 'join' | 'leave';
  userColor?: string;
}

interface DrawingElement {
  id: string;
  type: 'point' | 'line' | 'polygon' | 'circle' | 'freehand';
  coordinates: number[][];
  color: string;
  user: string;
  timestamp: string;
  strokeWidth?: number;
}

interface MapRegion {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  color: string;
  type: 'park' | 'water' | 'building' | 'road' | 'boundary';
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
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
    scale: 1.1,
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

const toolVariants = {
  inactive: { scale: 1 },
  active: { 
    scale: 1.1,
    transition: { duration: 0.2 }
  }
};

export default function CollaborativeMapDemoPage() {
  // Users state
  const [users, setUsers] = useState<User[]>([
    { 
      id: 1, 
      name: 'John Smith', 
      color: '#3B82F6', 
      isOnline: true,
      cursor: { x: 220, y: 180 },
      lastActivity: 'Drawing polygon',
      avatar: '/avatars/john.jpg'
    },
    { 
      id: 2, 
      name: 'Sarah Johnson', 
      color: '#10B981', 
      isOnline: true,
      cursor: { x: 380, y: 220 },
      lastActivity: 'Adding markers',
      avatar: '/avatars/sarah.jpg'
    },
    { 
      id: 3, 
      name: 'Mike Davis', 
      color: '#F59E0B', 
      isOnline: false,
      lastActivity: '5 minutes ago'
    },
    { 
      id: 4, 
      name: 'Lisa Chen', 
      color: '#EF4444', 
      isOnline: true,
      cursor: { x: 160, y: 140 },
      lastActivity: 'Viewing layers'
    },
    { 
      id: 5, 
      name: 'Alex Rodriguez', 
      color: '#8B5CF6', 
      isOnline: true,
      cursor: { x: 300, y: 160 },
      lastActivity: 'Measuring distance'
    }
  ]);

  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 1, 
      user: 'System', 
      message: 'Collaborative session started', 
      time: '10:00 AM',
      type: 'system'
    },
    { 
      id: 2, 
      user: 'John Smith', 
      message: 'Let me mark the boundary we discussed', 
      time: '10:30 AM',
      type: 'message',
      userColor: '#3B82F6'
    },
    { 
      id: 3, 
      user: 'Sarah Johnson', 
      message: 'Perfect, I can see your cursor near the property line', 
      time: '10:31 AM',
      type: 'message',
      userColor: '#10B981'
    },
    { 
      id: 4, 
      user: 'Mike Davis', 
      message: 'Added a polygon to mark the disputed area', 
      time: '10:32 AM',
      type: 'drawing',
      userColor: '#F59E0B'
    },
    { 
      id: 5, 
      user: 'System', 
      message: 'Lisa Chen joined the session', 
      time: '10:33 AM',
      type: 'join'
    },
    { 
      id: 6, 
      user: 'Lisa Chen', 
      message: 'Looking at the northern boundary now', 
      time: '10:34 AM',
      type: 'message',
      userColor: '#EF4444'
    },
    { 
      id: 7, 
      user: 'Alex Rodriguez', 
      message: 'I\'ll measure the distances for verification', 
      time: '10:35 AM',
      type: 'message',
      userColor: '#8B5CF6'
    }
  ]);

  // Drawing and interaction state
  const [newMessage, setNewMessage] = useState('');
  const [selectedTool, setSelectedTool] = useState('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCursors, setShowCursors] = useState(true);
  const [showDrawings, setShowDrawings] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');

  // Drawing elements
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([
    {
      id: '1',
      type: 'circle',
      coordinates: [[220, 180]],
      color: '#3B82F6',
      user: 'John Smith',
      timestamp: '10:30 AM',
      strokeWidth: 2
    },
    {
      id: '2',
      type: 'line',
      coordinates: [[120, 220], [350, 240]],
      color: '#10B981',
      user: 'Sarah Johnson',
      timestamp: '10:31 AM',
      strokeWidth: 3
    },
    {
      id: '3',
      type: 'polygon',
      coordinates: [[380, 120], [430, 100], [450, 150], [400, 160]],
      color: '#F59E0B',
      user: 'Mike Davis',
      timestamp: '10:32 AM',
      strokeWidth: 2
    },
    {
      id: '4',
      type: 'point',
      coordinates: [[300, 160]],
      color: '#8B5CF6',
      user: 'Alex Rodriguez',
      timestamp: '10:35 AM',
      strokeWidth: 2
    }
  ]);

  // Map regions
  const mapRegions: MapRegion[] = [
    {
      id: 'park1',
      name: 'Central Park',
      bounds: { x: 80, y: 80, width: 120, height: 80 },
      color: '#22C55E',
      type: 'park'
    },
    {
      id: 'water1',
      name: 'River System',
      bounds: { x: 300, y: 50, width: 100, height: 60 },
      color: '#3B82F6',
      type: 'water'
    },
    {
      id: 'building1',
      name: 'City Hall',
      bounds: { x: 150, y: 250, width: 80, height: 60 },
      color: '#F59E0B',
      type: 'building'
    },
    {
      id: 'building2',
      name: 'School District',
      bounds: { x: 350, y: 200, width: 90, height: 70 },
      color: '#EF4444',
      type: 'building'
    }
  ];

  const mapRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Drawing tools configuration
  const drawingTools = [
    { 
      id: 'select', 
      name: 'Select', 
      icon: <MousePointer2 className="h-4 w-4" />, 
      description: 'Select and move objects' 
    },
    { 
      id: 'point', 
      name: 'Point', 
      icon: <Circle className="h-4 w-4" />, 
      description: 'Add point markers' 
    },
    { 
      id: 'line', 
      name: 'Line', 
      icon: <Minus className="h-4 w-4" />, 
      description: 'Draw lines and paths' 
    },
    { 
      id: 'polygon', 
      name: 'Polygon', 
      icon: <Square className="h-4 w-4" />, 
      description: 'Create area shapes' 
    },
    { 
      id: 'freehand', 
      name: 'Freehand', 
      icon: <Pencil className="h-4 w-4" />, 
      description: 'Draw freehand shapes' 
    }
  ];

  // Handle mouse movement on map
  const handleMouseMove = (event: React.MouseEvent) => {
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  // Handle tool selection
  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    if (toolId !== 'select') {
      setIsDrawing(true);
    } else {
      setIsDrawing(false);
    }
  };

  // Add message function
  const addMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: messages.length + 1,
        user: 'You',
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'message',
        userColor: '#6366F1'
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  // Handle enter key in chat
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addMessage();
    }
  };

  // Get message style based on type
  const getMessageStyle = (message: ChatMessage) => {
    switch (message.type) {
      case 'system':
        return 'bg-muted text-muted-foreground italic text-center';
      case 'join':
        return 'bg-green-50 text-green-800 border border-green-200';
      case 'leave':
        return 'bg-red-50 text-red-800 border border-red-200';
      case 'drawing':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      default:
        return message.user === 'You' 
          ? 'bg-primary text-primary-foreground ml-8' 
          : 'bg-muted mr-8';
    }
  };

  // Simulate real-time cursor updates
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(prev => prev.map(user => {
        if (user.isOnline && user.cursor) {
          return {
            ...user,
            cursor: {
              x: Math.max(50, Math.min(450, user.cursor.x + (Math.random() - 0.5) * 30)),
              y: Math.max(50, Math.min(300, user.cursor.y + (Math.random() - 0.5) * 30))
            }
          };
        }
        return user;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: ('connected' | 'connecting' | 'disconnected')[] = ['connected', 'connecting', 'disconnected'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      if (Math.random() > 0.9) {
        setConnectionStatus(randomStatus);
        setTimeout(() => setConnectionStatus('connected'), 2000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return timestamp;
  };

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="text-center"
        variants={cardVariants}
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Collaborative Map Demo
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience real-time collaboration with multiple users on the same map interface.
          See cursor movements, chat, and draw together in real-time.
        </p>
      </motion.div>

      {/* Connection Status Banner */}
      <AnimatePresence>
        {connectionStatus !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert className={connectionStatus === 'connecting' ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}>
              <Activity className={`h-4 w-4 ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
              <AlertDescription>
                {connectionStatus === 'connecting' 
                  ? 'Reconnecting to collaboration server...' 
                  : 'Connection lost. Attempting to reconnect...'}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map Area */}
        <motion.div 
          className="lg:col-span-3"
          variants={cardVariants}
        >
          <Card className="h-[600px] relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  <CardTitle>Live Collaboration Map</CardTitle>
                  <Badge 
                    variant={connectionStatus === 'connected' ? 'default' : 'destructive'} 
                    className="flex items-center gap-1"
                  >
                    <Activity className={`h-3 w-3 ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
                    {connectionStatus === 'connected' ? 'Live' : 
                     connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
                  </Badge>
                  <Badge variant="secondary">
                    {users.filter(u => u.isOnline).length} users online
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Drawing Tools */}
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    {drawingTools.map((tool) => (
                      <TooltipProvider key={tool.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div variants={toolVariants} animate={selectedTool === tool.id ? 'active' : 'inactive'}>
                              <Button
                                variant={selectedTool === tool.id ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleToolSelect(tool.id)}
                                className="h-8 w-8 p-0"
                              >
                                {tool.icon}
                              </Button>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tool.name} - {tool.description}</p>
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
                    title="Toggle cursor visibility"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={showDrawings ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowDrawings(!showDrawings)}
                    title="Toggle drawings visibility"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>

                  <Button variant="ghost" size="sm" title="Map settings">
                    <Settings className="h-4 w-4" />
                  </Button>

                  <Button variant="ghost" size="sm" title="Share session">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 h-full">
              <div 
                ref={mapRef}
                className={`w-full h-full bg-gradient-to-br from-green-50 to-blue-50 relative ${
                  isDrawing ? 'cursor-crosshair' : 'cursor-default'
                }`}
                onMouseMove={handleMouseMove}
                style={{ 
                  backgroundImage: `
                    radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                    linear-gradient(45deg, rgba(168, 85, 247, 0.05) 0%, transparent 100%)
                  `
                }}
              >
                {/* Grid pattern */}
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

                {/* Map regions */}
                {mapRegions.map((region) => (
                  <div
                    key={region.id}
                    className="absolute border-2 rounded-lg flex items-center justify-center text-sm font-semibold"
                    style={{
                      left: region.bounds.x,
                      top: region.bounds.y,
                      width: region.bounds.width,
                      height: region.bounds.height,
                      backgroundColor: `${region.color}33`,
                      borderColor: region.color,
                      color: region.color.replace('#', '#').slice(0, 7) + 'CC'
                    }}
                  >
                    <span>{region.name}</span>
                  </div>
                ))}

                {/* Drawing elements */}
                {showDrawings && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {drawingElements.map((element) => {
                      switch (element.type) {
                        case 'point':
                          return (
                            <circle
                              key={element.id}
                              cx={element.coordinates[0][0]}
                              cy={element.coordinates[0][1]}
                              r="6"
                              fill={element.color}
                              stroke="white"
                              strokeWidth="2"
                            />
                          );
                        case 'circle':
                          return (
                            <circle
                              key={element.id}
                              cx={element.coordinates[0][0]}
                              cy={element.coordinates[0][1]}
                              r="25"
                              fill={`${element.color}33`}
                              stroke={element.color}
                              strokeWidth={element.strokeWidth || 2}
                            />
                          );
                        case 'line':
                          return (
                            <line
                              key={element.id}
                              x1={element.coordinates[0][0]}
                              y1={element.coordinates[0][1]}
                              x2={element.coordinates[1][0]}
                              y2={element.coordinates[1][1]}
                              stroke={element.color}
                              strokeWidth={element.strokeWidth || 3}
                              strokeLinecap="round"
                            />
                          );
                        case 'polygon':
                          return (
                            <polygon
                              key={element.id}
                              points={element.coordinates.map(coord => coord.join(',')).join(' ')}
                              fill={`${element.color}33`}
                              stroke={element.color}
                              strokeWidth={element.strokeWidth || 2}
                              strokeDasharray="5,5"
                            />
                          );
                        default:
                          return null;
                      }
                    })}
                  </svg>
                )}

                {/* User cursors */}
                {showCursors && (
                  <AnimatePresence>
                    {users.filter(user => user.isOnline && user.cursor).map((user) => (
                      <motion.div
                        key={user.id}
                        className="absolute pointer-events-none z-10"
                        style={{
                          left: user.cursor!.x,
                          top: user.cursor!.y
                        }}
                        variants={cursorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        whileHover="hover"
                      >
                        <div className="flex items-center gap-1">
                          <MousePointer2 
                            className="h-4 w-4 rotate-12 transform drop-shadow-md" 
                            style={{ color: user.color }}
                          />
                          <div 
                            className="text-white text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-lg"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* Your cursor indicator */}
                <div 
                  className="absolute pointer-events-none z-10 opacity-60"
                  style={{
                    left: mousePosition.x,
                    top: mousePosition.y
                  }}
                >
                  <MousePointer2 className="h-4 w-4 text-primary drop-shadow-sm" />
                </div>

                {/* Tool indicator */}
                {selectedTool !== 'select' && (
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm border rounded-md px-3 py-2 shadow-lg">
                    <div className="flex items-center gap-2 text-sm">
                      {drawingTools.find(t => t.id === selectedTool)?.icon}
                      <span className="font-medium">
                        {drawingTools.find(t => t.id === selectedTool)?.name} Tool Active
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="bg-muted/30 border-t">
              <div className="flex items-center justify-between w-full">
                <p className="text-sm text-muted-foreground">
                  {selectedTool === 'select' 
                    ? 'Select tool active - click to select objects' 
                    : `${drawingTools.find(t => t.id === selectedTool)?.name} tool active - click to draw`}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Mouse: {mousePosition.x}, {mousePosition.y}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{drawingElements.length} elements</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Collaboration Panel */}
        <motion.div 
          className="lg:col-span-1"
          variants={cardVariants}
        >
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Collaboration</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid grid-cols-2 mx-4">
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                </TabsList>

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
                                  {user.lastActivity}
                                </div>
                              ) : (
                                `Last seen ${user.lastActivity}`
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
                                  <p>View cursor at ({user.cursor.x}, {user.cursor.y})</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

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
                            transition={{ delay: index * 0.02 }}
                            className={`rounded-lg p-3 ${getMessageStyle(message)}`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {message.user}
                                </span>
                                {message.userColor && message.user !== 'System' && (
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: message.userColor }}
                                  />
                                )}
                              </div>
                              <span className="text-xs opacity-70">
                                {formatTime(message.time)}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                            {message.type === 'drawing' && (
                              <div className="mt-2 text-xs opacity-80">
                                <Drawing className="h-3 w-3 inline mr-1" />
                                Drawing activity
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
                      <Button onClick={addMessage} size="sm" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
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
        variants={cardVariants}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Real-time Collaboration Features
            </CardTitle>
            <CardDescription>
              Advanced collaborative mapping capabilities demonstrated in this interactive interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MousePointer2 className="h-4 w-4 text-blue-600" />
                  Live Cursor Tracking
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• See other users' cursor positions in real-time</li>
                  <li>• Color-coded user identification</li>
                  <li>• Smooth cursor movement animations</li>
                  <li>• Optional cursor visibility toggle</li>
                  <li>• Cursor coordinate display</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Drawing className="h-4 w-4 text-green-600" />
                  Collaborative Drawing Tools
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Draw points, lines, and polygons</li>
                  <li>• Real-time shape synchronization</li>
                  <li>• User-specific drawing colors</li>
                  <li>• Multiple drawing tool options</li>
                  <li>• Freehand drawing capabilities</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  Integrated Team Chat
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time messaging system</li>
                  <li>• Drawing action notifications</li>
                  <li>• User join/leave announcements</li>
                  <li>• Message history persistence</li>
                  <li>• Typing indicators and timestamps</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  User Session Management
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Online/offline status indicators</li>
                  <li>• User avatars and profiles</li>
                  <li>• Activity tracking and display</li>
                  <li>• Session participant list</li>
                  <li>• Real-time user count display</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-teal-600" />
                  Connection Management
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic reconnection on network issues</li>
                  <li>• Real-time connection status display</li>
                  <li>• Offline mode support</li>
                  <li>• Data synchronization on reconnect</li>
                  <li>• Connection quality indicators</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-600" />
                  Advanced Features
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Session sharing and export</li>
                  <li>• Layer visibility controls</li>
                  <li>• Tool selection and switching</li>
                  <li>• Map coordinate tracking</li>
                  <li>• Integration with GIS systems</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <Activity className="h-4 w-4" />
            <AlertDescription>
              This demonstration shows live collaboration features with simulated users. 
              Cursors move automatically to demonstrate real-time synchronization capabilities.
            </AlertDescription>
          </Alert>

          <Alert className="border-blue-200 bg-blue-50">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              In production, this interface connects to WebSocket services for real-time 
              synchronization across all connected clients, supporting unlimited concurrent users.
            </AlertDescription>
          </Alert>

          <Alert className="border-purple-200 bg-purple-50">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Try switching between different drawing tools and watch the interface adapt. 
              The chat system and user management work in real-time for seamless collaboration.
            </AlertDescription>
          </Alert>
        </div>
      </motion.div>
    </motion.div>
  );
}
