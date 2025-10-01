import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Progress} from '@/components/ui/progress';
import {Users,
  MessageSquare,
  Map,
  MousePointer2,
  Layers,
  Settings,
  Wifi,
  Activity,
  Drawing,
  Play,
  Pause,
  RotateCcw,
  Info,
  CheckCircle,
  Clock,
  MapPin,
  Share2,
  Eye,
  Zap,} from 'lucide-react';

// Types
interface DemoFeature {id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'demo' | 'available';
  progress?: number;}

interface ActivityLog {id: string;
  timestamp: string;
  user: string;
  action: string;
  type: 'cursor' | 'drawing' | 'chat' | 'system';}

// Animation variants
const containerVariants = {hidden: { opacity: 0},
  visible: {opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,},
  },
};

const cardVariants = {hidden: { opacity: 0, y: 20},
  visible: {opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut'},
  },
};

const featureVariants = {hidden: { opacity: 0, scale: 0.9},
  visible: {opacity: 1,
    scale: 1,
    transition: { duration: 0.3},
  },
  hover: {scale: 1.02,
    transition: { duration: 0.2},
  },
};

const progressVariants = {hidden: { width: 0},
  visible: {width: '100%',
    transition: { duration: 2, ease: 'easeOut'},
  },
};

export default function MapCollaborationDemoPage() {// Demo features
  const [demoFeatures] = useState<DemoFeature[]>([
    {
      id: 'cursors',
      title: 'Real-time Cursor Tracking',
      description:
        "See other users' cursor positions in real-time with smooth animations and user identification",
      icon: <MousePointer2 className="h-6 w-6" />,
      status: 'active',
      progress: 100,},
    {id: 'drawing',
      title: 'Collaborative Drawing Tools',
      description:
        'Draw points, lines, and polygons together with real-time synchronization across all users',
      icon: <Drawing className="h-6 w-6" />,
      status: 'demo',
      progress: 75,},
    {id: 'chat',
      title: 'Integrated Team Chat',
      description:
        'Chat with other users while viewing the same map with message history and notifications',
      icon: <MessageSquare className="h-6 w-6" />,
      status: 'active',
      progress: 100,},
    {id: 'layers',
      title: 'Synchronized Layer Management',
      description:
        'Collaboratively manage map layers with visibility controls and real-time updates',
      icon: <Layers className="h-6 w-6" />,
      status: 'demo',
      progress: 60,},
    {id: 'sessions',
      title: 'Session Management',
      description:
        'Join and leave collaborative sessions with user presence indicators and permissions',
      icon: <Users className="h-6 w-6" />,
      status: 'active',
      progress: 100,},
    {id: 'connectivity',
      title: 'Network Resilience',
      description:
        'Automatic reconnection on network issues with offline mode support and data sync',
      icon: <Wifi className="h-6 w-6" />,
      status: 'available',
      progress: 90,},
  ]);

  // Activity log
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([
    {id: '1',
      timestamp: '2024-01-15T10:35:00Z',
      user: 'John Smith',
      action: 'moved cursor to coordinates (245, 156)',
      type: 'cursor',},
    {id: '2',
      timestamp: '2024-01-15T10:34:30Z',
      user: 'Sarah Johnson',
      action: 'drew polygon boundary',
      type: 'drawing',},
    {id: '3',
      timestamp: '2024-01-15T10:34:15Z',
      user: 'Mike Davis',
      action: 'sent message: "Looking at the disputed area"',
      type: 'chat',},
    {id: '4',
      timestamp: '2024-01-15T10:33:45Z',
      user: 'System',
      action: 'Lisa Chen joined the session',
      type: 'system',},
    {id: '5',
      timestamp: '2024-01-15T10:33:20Z',
      user: 'Alex Rodriguez',
      action: 'enabled parcels layer',
      type: 'system',},
  ]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentUserCount, setCurrentUserCount] = useState(4);
  const [totalInteractions, setTotalInteractions] = useState(127);

  // Simulate real-time activity
  useEffect(() =>{if (!isPlaying) return;

    const interval = setInterval(() => {
      const users = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Chen', 'Alex Rodriguez'];
      const actions = [
        'moved cursor to new position',
        'added annotation',
        'toggled layer visibility',
        'sent chat message',
        'drew measurement line',
        'updated feature properties',
      ];
      const types: ActivityLog['type'][] = ['cursor', 'drawing', 'chat', 'system'];

      const newActivity: ActivityLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        type: types[Math.floor(Math.random() * types.length)],};

      setActivityLog(prev => [newActivity, ...prev.slice(0, 9)]);
      setTotalInteractions(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Simulate user count changes
  useEffect(() => {const interval = setInterval(() => {
      setCurrentUserCount(prev => {
        const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(1, Math.min(8, prev + change));});
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: DemoFeature['status']) => {switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'demo':
        return 'bg-blue-500';
      case 'available':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';}
  };

  const getStatusText = (status: DemoFeature['status']) => {switch (status) {
      case 'active':
        return 'Live';
      case 'demo':
        return 'Demo';
      case 'available':
        return 'Available';
      default:
        return 'Unknown';}
  };

  const getActivityIcon = (type: ActivityLog['type']) => {switch (type) {
      case 'cursor':
        return<MousePointer2 className="h-4 w-4 text-blue-600" />;
      case 'drawing':
        return <Drawing className="h-4 w-4 text-green-600" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;}
  };

  const formatTimestamp = (timestamp: string) =>{return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',});
  };

  return (<motion.div
      className="container mx-auto py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >{/* Header */}<motion.div className="text-center" variants={cardVariants}><h1 className="text-4xl font-bold text-foreground mb-4">Map Collaboration Demo</h1><p className="text-xl text-muted-foreground max-w-3xl mx-auto">Experience real-time collaborative mapping with live cursor tracking, synchronized drawing
          tools, and integrated team communication.</p></motion.div>{/* Status Overview */}<motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={cardVariants}><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Users</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{currentUserCount}</div><p className="text-xs text-muted-foreground">Currently online</p><div className="flex items-center gap-1 mt-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-xs text-green-600">All connected</span></div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Interactions</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalInteractions}</div><p className="text-xs text-muted-foreground">Actions performed today</p><div className="flex items-center gap-1 mt-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /><span className="text-xs text-blue-600">Live tracking</span></div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Demo Status</CardTitle><Zap className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">Live</div><p className="text-xs text-muted-foreground">All systems operational</p><div className="flex items-center gap-2 mt-2"><Button
                size="sm"
                variant={isPlaying ? 'default' : 'outline'}
                onClick={() =>setIsPlaying(!isPlaying)}
                className="text-xs"
              >
                {isPlaying ?<Pause className="h-3 w-3" />:<Play className="h-3 w-3" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button></div></CardContent></Card></motion.div>{/* Demo Features Grid */}<motion.div variants={cardVariants}><h2 className="text-2xl font-bold text-foreground mb-6">Collaboration Features</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><AnimatePresence>{demoFeatures.map(feature => (<motion.div
                key={feature.id}
                variants={featureVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                layout
              ><Card className="h-full"><CardHeader><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-muted rounded-lg">{feature.icon}</div><div><CardTitle className="text-lg">{feature.title}</CardTitle></div></div><Badge variant="outline" className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${getStatusColor(feature.status)}`} />{getStatusText(feature.status)}</Badge></div></CardHeader><CardContent className="space-y-4"><CardDescription className="text-sm">{feature.description}</CardDescription>{feature.progress && (<div className="space-y-2"><div className="flex justify-between text-sm"><span>Implementation Progress</span><span>{feature.progress}%</span></div><Progress value={feature.progress} className="h-2" /></div>)}<div className="flex items-center gap-2 pt-2"><Button size="sm" variant="outline" className="flex-1"><Eye className="h-3 w-3 mr-1" />View Demo</Button><Button size="sm" variant="ghost"><Info className="h-3 w-3" /></Button></div></CardContent></Card></motion.div>))}</AnimatePresence></div></motion.div>{/* Live Activity Feed */}<motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={cardVariants}><Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Live Activity Feed
              {isPlaying && (<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />)}</CardTitle><CardDescription>Real-time collaboration events from all connected users</CardDescription></CardHeader><CardContent><div className="space-y-3 max-h-80 overflow-y-auto"><AnimatePresence>{activityLog.map((activity, index) => (<motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20}}
                    animate={{ opacity: 1, x: 0}}
                    exit={{ opacity: 0, x: 20}}
                    transition={{ delay: index * 0.05}}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  ><div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="font-medium text-sm">{activity.user}</span><span className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</span></div><p className="text-sm text-muted-foreground">{activity.action}</p></div></motion.div>))}</AnimatePresence></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Map className="h-5 w-5" />Interactive Map Preview</CardTitle><CardDescription>Collaborative mapping interface with real-time features</CardDescription></CardHeader><CardContent><div className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-lg h-80 overflow-hidden border">{/* Grid background */}<div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',}} />{/* Mock map elements */}<div className="absolute top-8 left-8 w-20 h-16 bg-green-200 border-2 border-green-400 rounded flex items-center justify-center"><span className="text-xs font-semibold text-green-800">Park</span></div><div className="absolute top-12 right-12 w-16 h-12 bg-blue-200 border-2 border-blue-400 rounded flex items-center justify-center"><span className="text-xs font-semibold text-blue-800">Lake</span></div><div className="absolute bottom-12 left-12 w-18 h-14 bg-yellow-200 border-2 border-yellow-400 rounded flex items-center justify-center"><span className="text-xs font-semibold text-yellow-800">City</span></div>{/* Animated cursors */}<AnimatePresence>{[
                  {id: 1, x: 60, y: 40, user: 'John', color: '#3B82F6'},
                  {id: 2, x: 180, y: 80, user: 'Sarah', color: '#10B981'},
                  {id: 3, x: 120, y: 160, user: 'Mike', color: '#F59E0B'},
                ].map(cursor => (<motion.div
                    key={cursor.id}
                    className="absolute pointer-events-none"
                    initial={{ opacity: 0, scale: 0}}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: [cursor.x, cursor.x + 20, cursor.x - 10, cursor.x],
                      y: [cursor.y, cursor.y - 15, cursor.y + 10, cursor.y],}}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: cursor.id * 0.5,}}
                    style={{ left: cursor.x, top: cursor.y}}
                  ><div className="flex items-center gap-1"><MousePointer2
                        className="h-4 w-4 rotate-12 drop-shadow-md"
                        style={{ color: cursor.color}} /><div
                        className="text-white text-xs px-2 py-1 rounded shadow-lg"
                        style={{ backgroundColor: cursor.color}}
                      >{cursor.user}</div></div></motion.div>))}</AnimatePresence>{/* Drawing elements */}<svg className="absolute inset-0 w-full h-full"><circle
                  cx="100"
                  cy="120"
                  r="15"
                  fill="rgba(59, 130, 246, 0.3)"
                  stroke="#3B82F6"
                  strokeWidth="2" /><line
                  x1="50"
                  y1="200"
                  x2="200"
                  y2="180"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round" /><polygon
                  points="220,60 250,50 260,80 240,90"
                  fill="rgba(245, 158, 11, 0.3)"
                  stroke="#F59E0B"
                  strokeWidth="2" /></svg>{/* Feature indicators */}<div className="absolute bottom-4 left-4 flex items-center gap-2"><Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{currentUserCount} users</Badge><Badge variant="outline" className="text-xs"><Drawing className="h-3 w-3 mr-1" />Live drawing</Badge></div><div className="absolute top-4 right-4"><Button size="sm" variant="outline"><Share2 className="h-3 w-3 mr-1" />Join Session</Button></div></div></CardContent></Card></motion.div>{/* Implementation Notes */}<motion.div variants={cardVariants}><Alert className="border-blue-200 bg-blue-50"><Info className="h-4 w-4" /><AlertDescription>This demonstration showcases the core collaborative mapping features. In production, the
            system supports unlimited concurrent users with WebSocket connections for real-time
            synchronization.</AlertDescription></Alert></motion.div></motion.div>
  );
}
