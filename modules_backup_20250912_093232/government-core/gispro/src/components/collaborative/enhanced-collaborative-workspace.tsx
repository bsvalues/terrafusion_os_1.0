import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Progress} from '@/components/ui/progress';
import {Separator} from '@/components/ui/separator';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {ResizablePanelGroup, ResizablePanel, ResizableHandle} from '@/components/ui/resizable';
import {Users,
  Share,
  Video,
  MessageSquare,
  FileText,
  Map,
  BarChart3,
  Settings,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Hand,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  History,
  Clock,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Layers,
  Target,
  Navigation,
  Search,
  Filter,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Comment,
  Flag,
  MoreHorizontal,
  Maximize,
  Minimize,
  Split,
  Grid,
  List,
  Calendar,
  Folder,
  FolderOpen,
  Code,
  Terminal,
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  ExitFullscreen,
  PictureInPicture,
  ScreenShare,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,} from '@mui/icons-material';

import CollaborativeCursors from './collaborative-cursors';
import CollaborativeChat from './collaborative-chat';

interface User {id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  status: 'online' | 'offline' | 'away' | 'busy' | 'presenting';
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'guest' | 'observer';
  permissions: string[];
  lastActivity?: Date;
  activeLayer?: string;
  currentTool?: string;
  presenceData?: {
    viewport?: { center: [number, number]; zoom: number};
    selection?: string[];
    cursor?: {x: number; y: number};
  };
}

interface Layer {id: string;
  name: string;
  description?: string;
  type: 'vector' | 'raster' | 'analysis' | 'annotation' | 'reference' | 'temporal';
  visible: boolean;
  locked: boolean;
  opacity: number;
  owner: User;
  collaborators: User[];
  permissions: {
    canEdit: string[];
    canView: string[];
    canComment: string[];};
  lastModified: Date;
  version: number;
  metadata: {source?: string;
    projection?: string;
    format?: string;
    size?: number;
    resolution?: string;
    extent?: [number, number, number, number];};
  changeHistory: Array<{id: string;
    action: 'create' | 'update' | 'delete' | 'style' | 'permissions';
    user: User;
    timestamp: Date;
    description: string;
    diff?: any;}>;
  style?: {strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    symbolSize?: number;};
}

interface WorkspaceSession {id: string;
  name: string;
  description?: string;
  owner: User;
  participants: User[];
  status: 'active' | 'scheduled' | 'ended' | 'paused';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isRecording: boolean;
  isScreenSharing: boolean;
  presenter?: User;
  settings: {
    allowChat: boolean;
    allowDrawing: boolean;
    allowLayerEditing: boolean;
    requireApproval: boolean;
    maxParticipants: number;
    isPublic: boolean;
    recordingEnabled: boolean;};
}

interface EnhancedWorkspaceProject {id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  owner: User;
  collaborators: User[];
  layers: Layer[];
  sessions: WorkspaceSession[];
  bookmarks: Array<{
    id: string;
    name: string;
    description?: string;
    viewport: { center: [number, number]; zoom: number};
    layers: string[];
    user: User;
    timestamp: Date;
    isPublic: boolean;
  }>;
  comments: Array<{id: string;
    content: string;
    user: User;
    timestamp: Date;
    position?: { x: number; y: number};
    layerId?: string;
    replies: Array<{id: string;
      content: string;
      user: User;
      timestamp: Date;}>;
    isResolved: boolean;
  }>;
  permissions: {canEdit: string[];
    canView: string[];
    canComment: string[];
    canShare: string[];
    canAdmin: string[];};
  settings: {allowPublicView: boolean;
    requireApproval: boolean;
    enableChat: boolean;
    enableCursors: boolean;
    enableVoice: boolean;
    enableVideo: boolean;
    autoSave: boolean;
    versionControl: boolean;
    enableAnalytics: boolean;
    allowGuests: boolean;
    maxCollaborators: number;};
  analytics: {totalViews: number;
    totalEdits: number;
    lastAccessed: Date;
    popularLayers: string[];
    activeUsers: number;
    peakUsers: number;};
  lastModified: Date;
  version: number;
  tags: string[];
  category: string;
  isTemplate: boolean;
  isFavorite: boolean;
}

interface EnhancedCollaborativeWorkspaceProps {currentUser: User;
  project?: EnhancedWorkspaceProject;
  onUserInvite?: (email: string, role: User['role']) => void;
  onUserRemove?: (userId: string) => void;
  onRoleChange?: (userId: string, role: User['role']) => void;
  onLayerUpdate?: (layerId: string, updates: Partial<Layer>) => void;
  onProjectSave?: (project: EnhancedWorkspaceProject) => void;
  onSessionStart?: (session: Partial<WorkspaceSession>) => void;
  onCommentAdd?: (comment: Partial<EnhancedWorkspaceProject['comments'][0]>) => void;
  onBookmarkAdd?: (bookmark: Partial<EnhancedWorkspaceProject['bookmarks'][0]>) => void;
  className?: string;}

const EnhancedCollaborativeWorkspace: React.FC<EnhancedCollaborativeWorkspaceProps> = ({currentUser,
  project,
  onUserInvite,
  onUserRemove,
  onRoleChange,
  onLayerUpdate,
  onProjectSave,
  onSessionStart,
  onCommentAdd,
  onBookmarkAdd,
  className = '',}) => {const [activeTab, setActiveTab] = useState('layers');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showCursors, setShowCursors] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<User['role']>('viewer');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vector' | 'raster' | 'analysis'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [workspaceLayout, setWorkspaceLayout] = useState<'default' | 'focused' | 'split'>(
    'default'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activityFeed, setActivityFeed] = useState<
    Array<{
      id: string;
      user: User;
      action: string;
      timestamp: Date;
      details?: string;
      type: 'edit' | 'comment' | 'session' | 'user' | 'system';}>
  >([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connected');
  const [notifications, setNotifications] = useState<
    Array<{id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      message: string;
      timestamp: Date;
      read: boolean;}>
  >([]);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Enhanced sample project data
  const enhancedSampleProject: EnhancedWorkspaceProject = useMemo(
    () => ({id: 'enhanced-project-1',
      name: 'TerraFusion Advanced Environmental Analysis',
      description:
        'Comprehensive multi-temporal environmental impact assessment with collaborative analysis workflows',
      thumbnail: '/projects/environmental-study.jpg',
      owner: currentUser,
      collaborators: [
        {
          id: 'user-1',
          name: 'Dr. Sarah Chen',
          email: 'sarah.chen@terrafusion.com',
          avatar: '/avatars/sarah.jpg',
          color: '#3B82F6',
          status: 'online',
          role: 'admin',
          permissions: ['edit', 'view', 'comment', 'share', 'admin'],
          lastActivity: new Date(),
          activeLayer: 'layer-1',
          currentTool: 'analyze',
          presenceData: {
            viewport: { center: [-122.4194, 37.7749], zoom: 12},
            selection: ['feature-1', 'feature-2'],
            cursor: {x: 450, y: 300},
          },
        },
        {id: 'user-2',
          name: 'Michael Rodriguez',
          email: 'michael.rodriguez@terrafusion.com',
          avatar: '/avatars/michael.jpg',
          color: '#EF4444',
          status: 'presenting',
          role: 'editor',
          permissions: ['edit', 'view', 'comment'],
          lastActivity: new Date(Date.now() - 300000),
          activeLayer: 'layer-2',
          currentTool: 'edit',},
        {id: 'user-3',
          name: 'Emily Johnson',
          email: 'emily.johnson@terrafusion.com',
          color: '#10B981',
          status: 'away',
          role: 'editor',
          permissions: ['edit', 'view', 'comment'],
          lastActivity: new Date(Date.now() - 1800000),
          currentTool: 'measure',},
        {id: 'user-4',
          name: 'James Wilson',
          email: 'james.wilson@gov.org',
          color: '#F59E0B',
          status: 'busy',
          role: 'viewer',
          permissions: ['view', 'comment'],
          lastActivity: new Date(Date.now() - 3600000),},
        {id: 'user-5',
          name: 'Dr. Maria Gonzalez',
          email: 'maria.gonzalez@university.edu',
          color: '#8B5CF6',
          status: 'online',
          role: 'observer',
          permissions: ['view'],
          lastActivity: new Date(Date.now() - 600000),},
      ],
      layers: [
        {id: 'layer-1',
          name: 'Environmental Study Boundaries',
          description: 'Primary study area boundaries with regulatory zones',
          type: 'vector',
          visible: true,
          locked: false,
          opacity: 0.8,
          owner: currentUser,
          collaborators: [],
          permissions: {
            canEdit: ['user-1', 'user-2'],
            canView: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
            canComment: ['user-1', 'user-2', 'user-3', 'user-4'],},
          lastModified: new Date(),
          version: 3,
          metadata: {source: 'EPA Regulatory Database',
            projection: 'EPSG:4326',
            format: 'GeoJSON',
            size: 2547832,
            resolution: '1:10000',
            extent: [-122.5, 37.7, -122.3, 37.8],},
          changeHistory: [],
          style: {strokeColor: '#2563EB',
            fillColor: '#3B82F620',
            strokeWidth: 2,
            opacity: 0.8,},
        },
        {id: 'layer-2',
          name: 'Environmental Sensor Network',
          description: 'Real-time environmental monitoring stations',
          type: 'vector',
          visible: true,
          locked: true,
          opacity: 1.0,
          owner: currentUser,
          collaborators: [],
          permissions: {
            canEdit: ['user-1'],
            canView: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
            canComment: ['user-1', 'user-2', 'user-3'],},
          lastModified: new Date(Date.now() - 3600000),
          version: 1,
          metadata: {source: 'TerraFusion Sensor API',
            projection: 'EPSG:4326',
            format: 'GeoJSON',
            size: 156432,
            resolution: 'Point data',},
          changeHistory: [],
          style: {strokeColor: '#DC2626',
            fillColor: '#DC2626',
            symbolSize: 8,},
        },
        {id: 'layer-3',
          name: 'Satellite Imagery - Temporal Analysis',
          description: 'Multi-temporal satellite imagery for change detection',
          type: 'raster',
          visible: false,
          locked: false,
          opacity: 0.7,
          owner: currentUser,
          collaborators: [],
          permissions: {
            canEdit: ['user-1', 'user-2'],
            canView: ['user-1', 'user-2', 'user-3', 'user-4'],
            canComment: ['user-1', 'user-2', 'user-3'],},
          lastModified: new Date(Date.now() - 7200000),
          version: 2,
          metadata: {source: 'Landsat 8/9',
            projection: 'EPSG:3857',
            format: 'GeoTIFF',
            size: 45678912,
            resolution: '30m',},
          changeHistory: [],
        },
        {id: 'layer-4',
          name: 'AI Analysis Results',
          description: 'Machine learning analysis of environmental patterns',
          type: 'analysis',
          visible: true,
          locked: false,
          opacity: 0.6,
          owner: currentUser,
          collaborators: [],
          permissions: {
            canEdit: ['user-1'],
            canView: ['user-1', 'user-2', 'user-3', 'user-4'],
            canComment: ['user-1', 'user-2', 'user-3', 'user-4'],},
          lastModified: new Date(Date.now() - 1800000),
          version: 1,
          metadata: {source: 'TerraFusion AI Engine',
            projection: 'EPSG:4326',
            format: 'Analysis Grid',
            resolution: '100m grid',},
          changeHistory: [],
        },
      ],
      sessions: [
        {id: 'session-1',
          name: 'Weekly Environmental Review',
          description: 'Collaborative review of weekly monitoring data',
          owner: currentUser,
          participants: [],
          status: 'active',
          startTime: new Date(Date.now() - 1800000),
          duration: 1800,
          isRecording: true,
          isScreenSharing: false,
          presenter: currentUser,
          settings: {
            allowChat: true,
            allowDrawing: true,
            allowLayerEditing: false,
            requireApproval: true,
            maxParticipants: 10,
            isPublic: false,
            recordingEnabled: true,},
        },
      ],
      bookmarks: [
        {id: 'bookmark-1',
          name: 'Pollution Hotspot Area',
          description: 'High concentration pollution zone requiring investigation',
          viewport: { center: [-122.4194, 37.7749], zoom: 15},
          layers: ['layer-1', 'layer-2'],
          user: currentUser,
          timestamp: new Date(Date.now() - 86400000),
          isPublic: true,
        },
      ],
      comments: [
        {id: 'comment-1',
          content:
            'The sensor readings in this area show unusual patterns. We should investigate further.',
          user: currentUser,
          timestamp: new Date(Date.now() - 3600000),
          position: { x: 450, y: 300},
          layerId: 'layer-2',
          replies: [],
          isResolved: false,
        },
      ],
      permissions: {canEdit: ['user-1', 'user-2', 'user-3'],
        canView: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
        canComment: ['user-1', 'user-2', 'user-3', 'user-4'],
        canShare: ['user-1', 'user-2'],
        canAdmin: ['user-1'],},
      settings: {allowPublicView: false,
        requireApproval: true,
        enableChat: true,
        enableCursors: true,
        enableVoice: true,
        enableVideo: true,
        autoSave: true,
        versionControl: true,
        enableAnalytics: true,
        allowGuests: false,
        maxCollaborators: 15,},
      analytics: {totalViews: 1247,
        totalEdits: 89,
        lastAccessed: new Date(),
        popularLayers: ['layer-1', 'layer-2'],
        activeUsers: 4,
        peakUsers: 8,},
      lastModified: new Date(),
      version: 12,
      tags: ['environmental', 'monitoring', 'analysis', 'collaboration'],
      category: 'Environmental Science',
      isTemplate: false,
      isFavorite: true,
    }),
    [currentUser]
  );

  const currentProject = project || enhancedSampleProject;

  // Enhanced activity feed initialization
  useEffect(() => {const initialActivity = [
      {
        id: 'activity-1',
        user: currentProject.collaborators[0],
        action: 'started editing layer "Environmental Sensors"',
        timestamp: new Date(Date.now() - 300000),
        type: 'edit' as const,
        details: 'Updated 5 sensor locations',},
      {id: 'activity-2',
        user: currentProject.collaborators[1],
        action: 'started presenting',
        timestamp: new Date(Date.now() - 600000),
        type: 'session' as const,
        details: 'Screen sharing active',},
      {id: 'activity-3',
        user: currentProject.collaborators[2],
        action: 'added comment',
        timestamp: new Date(Date.now() - 900000),
        type: 'comment' as const,
        details: 'Comment on pollution hotspot area',},
      {id: 'activity-4',
        user: currentProject.owner,
        action: 'invited new collaborator',
        timestamp: new Date(Date.now() - 1200000),
        type: 'user' as const,
        details: 'Dr. Maria Gonzalez joined as observer',},
      {id: 'activity-5',
        user: currentProject.owner,
        action: 'auto-saved project',
        timestamp: new Date(Date.now() - 1800000),
        type: 'system' as const,},
    ];
    setActivityFeed(initialActivity);
  }, [currentProject]);

  // Enhanced auto-save with conflict resolution
  useEffect(() => {
    if (currentProject.settings.autoSave) {
      const interval = setInterval(() => {
        setIsAutoSaving(true);

        // Simulate save with potential conflicts
        setTimeout(() => {
          const hasConflicts = Math.random()< 0.1; // 10% chance of conflicts

          if (hasConflicts) {
            setNotifications(prev =>[
              ...prev,
              {
                id: `notification-${Date.now()}`,
                type: 'warning',
                message: 'Auto-save detected conflicts. Please review changes.',
                timestamp: new Date(),
                read: false,
              },
            ]);
          }

          setIsAutoSaving(false);
          setLastSaved(new Date());

          if (onProjectSave) {onProjectSave(currentProject);}
        }, 1500);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentProject, onProjectSave]);

  // Connection status simulation
  useEffect(() => {const interval = setInterval(() => {
      const random = Math.random();
      if (random< 0.02) {
        // 2% chance of disconnection
        setConnectionStatus('disconnected');
        setTimeout(() =>{
          setConnectionStatus('connecting');
          setTimeout(() => {
            setConnectionStatus('connected');}, 2000);
        }, 1000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Enhanced layer filtering
  const filteredLayers = useMemo(() => {return currentProject.layers.filter(layer => {
      const matchesSearch =
        !searchQuery ||
        layer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        layer.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || layer.type === filterType;

      return matchesSearch && matchesType;});
  }, [currentProject.layers, searchQuery, filterType]);

  // Handle enhanced user invitation
  const handleInviteUser = async () => {
    if (inviteEmail && onUserInvite) {
      try {
        await onUserInvite(inviteEmail, inviteRole);
        setInviteEmail('');

        setActivityFeed(prev => [
          {
            id: `activity-${Date.now()}`,
            user: currentUser,
            action: 'invited new collaborator',
            timestamp: new Date(),
            type: 'user',
            details: `${inviteEmail} as ${inviteRole}`,
          },
          ...prev,
        ]);

        setNotifications(prev => [
          ...prev,
          {
            id: `notification-${Date.now()}`,
            type: 'success',
            message: `Invitation sent to ${inviteEmail}`,
            timestamp: new Date(),
            read: false,
          },
        ]);
      } catch (error) {
        setNotifications(prev => [
          ...prev,
          {
            id: `notification-${Date.now()}`,
            type: 'error',
            message: 'Failed to send invitation',
            timestamp: new Date(),
            read: false,
          },
        ]);
      }
    }
  };

  // Handle presentation mode
  const handleStartPresentation = () => {setIsPresenting(true);
    if (onSessionStart) {
      onSessionStart({
        name: 'Live Presentation',
        description: 'Real-time workspace presentation',
        presenter: currentUser,
        settings: {
          allowChat: true,
          allowDrawing: false,
          allowLayerEditing: false,
          requireApproval: false,
          maxParticipants: 50,
          isPublic: false,
          recordingEnabled: isRecording,},
      });
    }
  };

  // Handle layer bulk operations
  const handleBulkLayerOperation = (operation: 'show' | 'hide' | 'lock' | 'unlock') => {selectedLayers.forEach(layerId => {
      if (onLayerUpdate) {
        switch (operation) {
          case 'show':
            onLayerUpdate(layerId, { visible: true});
            break;
          case 'hide':
            onLayerUpdate(layerId, {visible: false});
            break;
          case 'lock':
            onLayerUpdate(layerId, {locked: true});
            break;
          case 'unlock':
            onLayerUpdate(layerId, {locked: false});
            break;
        }
      }
    });
    setSelectedLayers([]);
  };

  // Get enhanced role icon
  const getRoleIcon = (role: User['role']) => {switch (role) {
      case 'owner':
        return<Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-green-600" />;
      case 'observer':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;}
  };

  // Get enhanced status color and icon
  const getStatusDisplay = (status: User['status']) =>{switch (status) {
      case 'online':
        return { color: 'bg-green-500', icon: null};
      case 'away':
        return {color: 'bg-yellow-500', icon:<Clock className="h-2 w-2" />};
      case 'busy':
        return {color: 'bg-red-500', icon: null};
      case 'presenting':
        return {color: 'bg-purple-500', icon: <ScreenShare className="h-2 w-2" />};
      default:
        return {color: 'bg-gray-400', icon: null};
    }
  };

  // Get layer type icon with enhanced styling
  const getLayerIcon = (type: Layer['type']) =>{switch (type) {
      case 'vector':
        return<Navigation className="h-4 w-4 text-blue-600" />;
      case 'raster':
        return <Map className="h-4 w-4 text-green-600" />;
      case 'analysis':
        return <BarChart3 className="h-4 w-4 text-purple-600" />;
      case 'annotation':
        return <Edit className="h-4 w-4 text-orange-600" />;
      case 'reference':
        return <Bookmark className="h-4 w-4 text-gray-600" />;
      case 'temporal':
        return <History className="h-4 w-4 text-indigo-600" />;
      default:
        return <Layers className="h-4 w-4 text-gray-600" />;}
  };

  // Enhanced time formatting
  const formatTimeAgo = (date: Date) =>{
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Format file size
  const formatFileSize = (bytes: number) => {const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];};

  // Get connection status display
  const getConnectionStatus = () => {switch (connectionStatus) {
      case 'connected':
        return {
          color: 'text-green-600',
          icon:<CheckCircle className="h-4 w-4" />,
          text: 'Connected',};
      case 'connecting':
        return {color: 'text-yellow-600',
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Connecting...',};
      case 'disconnected':
        return {color: 'text-red-600',
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Disconnected',};
    }
  };

  const connectionDisplay = getConnectionStatus();

  return (
    <div className={`h-full flex flex-col ${className}`}>{/* Enhanced Header */}<div className="flex-shrink-0 border-b bg-white"><div className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="flex items-center gap-3">{currentProject.thumbnail && (<img
                    src={currentProject.thumbnail}
                    alt={currentProject.name}
                    className="w-10 h-10 rounded object-cover" />)}<div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold">{currentProject.name}</h1>{currentProject.isFavorite &&<Star className="h-5 w-5 text-yellow-500" />}
                    <Badge variant="outline" className="text-xs">v{currentProject.version}</Badge></div><p className="text-sm text-muted-foreground">{currentProject.description}</p><div className="flex items-center gap-4 mt-1"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{currentProject.analytics.activeUsers} active</div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" />{currentProject.analytics.totalViews} views</div><div className="flex items-center gap-1 text-xs"><span className={connectionDisplay.color}>{connectionDisplay.icon}</span><span className={`text-xs ${connectionDisplay.color}`}>{connectionDisplay.text}</span></div></div></div></div>{/* Auto-save indicator */}<div className="flex items-center gap-2 text-sm text-muted-foreground">{isAutoSaving ? (<div className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" />Saving...</div>) : (<div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-600" />Saved {formatTimeAgo(lastSaved)}</div>)}</div></div><div className="flex items-center gap-2">{/* Enhanced collaborator avatars */}<div className="flex -space-x-2">{currentProject.collaborators.slice(0, 6).map(user => {
                  const statusDisplay = getStatusDisplay(user.status);
                  return (<TooltipProvider key={user.id}><Tooltip><TooltipTrigger><div className="relative"><Avatar className="h-8 w-8 border-2 border-white"><AvatarImage src={user.avatar} /><AvatarFallback
                                style={{ backgroundColor: user.color + '20', color: user.color}}
                              >{user.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')}</AvatarFallback></Avatar><div
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white ${statusDisplay.color} flex items-center justify-center`}
                            >{statusDisplay.icon}</div></div></TooltipTrigger><TooltipContent><div className="text-center"><p className="font-medium">{user.name}</p><p className="text-xs opacity-75">{user.role} • {user.status}</p>{user.currentTool && (<p className="text-xs opacity-75">Using {user.currentTool}</p>)}</div></TooltipContent></Tooltip></TooltipProvider>);
                })}
                {currentProject.collaborators.length > 6 && (<div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium">+{currentProject.collaborators.length - 6}</div>)}</div>{/* Enhanced action buttons */}<Button
                size="sm"
                variant={isPresenting ? 'default' : 'outline'}
                onClick={() => (isPresenting ? setIsPresenting(false) : handleStartPresentation())}
              >
                {isPresenting ?<Stop className="h-4 w-4" />:<PlayArrow className="h-4 w-4" />}
                {isPresenting ? 'Stop' : 'Present'}
              </Button><Button size="sm" variant="outline" onClick={() =>setShowVideo(!showVideo)}>
                {showVideo ?<VideocamOff className="h-4 w-4" />:<Videocam className="h-4 w-4" />}
                Video
              </Button><Button size="sm" variant="outline" onClick={() => setShowChat(!showChat)}><MessageSquare className="h-4 w-4" />Chat
                {notifications.filter(n => !n.read).length > 0 && (<Badge variant="destructive" className="ml-1 h-4 text-xs">{notifications.filter(n => !n.read).length}</Badge>)}</Button><Button
                size="sm"
                variant="outline"
                onClick={() =>setIsRecording(!isRecording)}
                className={isRecording ? 'text-red-600' : ''}
              >
                {isRecording ? (<Stop className="h-4 w-4" />) : (<VideoAlternate className="h-4 w-4" />)}
                {isRecording ? 'Recording' : 'Record'}</Button><Button size="sm" variant="outline"><Share className="h-4 w-4" />Share</Button><Button size="sm"><Save className="h-4 w-4" />Save</Button></div></div></div>{/* Notifications bar */}
        {notifications.filter(n => !n.read).length > 0 && (<div className="px-4 pb-2"><Alert className="py-2"><AlertTriangle className="h-4 w-4" /><AlertDescription className="text-sm">{notifications.filter(n => !n.read).length} unread notification(s)<Button
                  size="sm"
                  variant="ghost"
                  className="ml-2 h-6 text-xs"
                  onClick={() =>setNotifications(prev => prev.map(n => ({ ...n, read: true})))}
                >
                  Mark all read</Button></AlertDescription></Alert></div>)}</div>{/* Enhanced Main Workspace */}<div className="flex-1 flex min-h-0"><ResizablePanelGroup direction="horizontal">{/* Enhanced Sidebar */}<ResizablePanel defaultSize={25} minSize={20} maxSize={40}><div className="h-full bg-gray-50 flex flex-col"><Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col"><TabsList className="grid w-full grid-cols-5 m-2"><TabsTrigger value="layers" className="text-xs"><Layers className="h-3 w-3" /></TabsTrigger><TabsTrigger value="users" className="text-xs"><Users className="h-3 w-3" /></TabsTrigger><TabsTrigger value="activity" className="text-xs"><History className="h-3 w-3" /></TabsTrigger><TabsTrigger value="comments" className="text-xs"><Comment className="h-3 w-3" /></TabsTrigger><TabsTrigger value="settings" className="text-xs"><Settings className="h-3 w-3" /></TabsTrigger></TabsList><TabsContent value="layers" className="flex-1 flex flex-col min-h-0 mx-2"><Card className="flex-1 flex flex-col"><CardHeader className="pb-3"><CardTitle className="flex items-center justify-between"><div className="flex items-center gap-2"><Layers className="h-5 w-5" />Layers ({filteredLayers.length})</div><div className="flex items-center gap-1"><Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                          >
                            {viewMode === 'list' ? (<Grid className="h-3 w-3" />) : (<List className="h-3 w-3" />)}</Button><Button size="sm" variant="ghost"><Filter className="h-3 w-3" /></Button></div></CardTitle>{/* Enhanced search and filters */}<div className="space-y-2"><div className="relative"><Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" /><Input
                            placeholder="Search layers..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-7 h-8 text-xs"
                          /></div><div className="flex gap-1">{(['all', 'vector', 'raster', 'analysis'] as const).map(type => (<Button
                              key={type}
                              size="sm"
                              variant={filterType === type ? 'default' : 'outline'}
                              onClick={() =>setFilterType(type)}
                              className="h-6 text-xs capitalize"
                            >
                              {type}</Button>))}</div></div>{/* Bulk operations */}
                      {selectedLayers.length > 0 && (<div className="flex gap-1 pt-2 border-t"><Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkLayerOperation('show')}
                            className="h-6 text-xs"
                          ><Eye className="h-3 w-3" /></Button><Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkLayerOperation('hide')}
                            className="h-6 text-xs"
                          ><EyeOff className="h-3 w-3" /></Button><Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkLayerOperation('lock')}
                            className="h-6 text-xs"
                          ><Lock className="h-3 w-3" /></Button><span className="text-xs text-muted-foreground self-center">{selectedLayers.length} selected</span></div>)}</CardHeader><CardContent className="flex-1 overflow-hidden p-3"><ScrollArea className="h-full"><div
                          className={`space-y-2 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2 space-y-0' : ''}`}
                        >{filteredLayers.map(layer => (<div
                              key={layer.id}
                              className={`flex items-center gap-2 p-2 rounded border bg-white hover:shadow-sm transition-shadow ${
                                selectedLayers.includes(layer.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : ''} ${viewMode === 'grid' ? 'flex-col items-start' : ''}`}
                            ><div
                                className={`flex items-center gap-2 ${viewMode === 'grid' ? 'w-full' : ''}`}
                              ><input
                                  type="checkbox"
                                  checked={selectedLayers.includes(layer.id)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedLayers(prev => [...prev, layer.id]);} else {setSelectedLayers(prev => prev.filter(id => id !== layer.id));}
                                  }}
                                  className="h-3 w-3"
                                /><Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>onLayerUpdate?.(layer.id, { visible: !layer.visible})
                                  }
                                >
                                  {layer.visible ? (<Eye className="h-3 w-3" />) : (<EyeOff className="h-3 w-3" />)}</Button><div className="flex items-center gap-1">{getLayerIcon(layer.type)}
                                  {layer.locked &&<Lock className="h-3 w-3 text-gray-400" />}
                                </div></div><div
                                className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'w-full' : ''}`}
                              ><div className="flex items-center gap-1"><p className="text-sm font-medium truncate">{layer.name}</p>{layer.metadata.size && (<span className="text-xs text-muted-foreground">({formatFileSize(layer.metadata.size)})</span>)}</div><p className="text-xs text-muted-foreground truncate">by {layer.owner.name} • {formatTimeAgo(layer.lastModified)}</p>{layer.description && viewMode === 'list' && (<p className="text-xs text-muted-foreground truncate mt-1">{layer.description}</p>)}</div><div
                                className={`flex items-center gap-1 ${viewMode === 'grid' ? 'w-full justify-between' : ''}`}
                              ><Badge variant="outline" className="text-xs">{layer.type}</Badge>{layer.version > 1 && (<Badge variant="secondary" className="text-xs">v{layer.version}</Badge>)}<Button size="sm" variant="ghost" className="h-6 w-6 p-0"><MoreHorizontal className="h-3 w-3" /></Button></div></div>))}</div></ScrollArea></CardContent></Card></TabsContent>{/* Additional tab contents would continue here with similar enhanced functionality... */}</Tabs></div></ResizablePanel><ResizableHandle />{/* Enhanced Main workspace area */}<ResizablePanel defaultSize={showChat ? 50 : 75}><div className="h-full relative" ref={workspaceRef}>{/* Enhanced collaborative cursors overlay */}
              {showCursors && (<CollaborativeCursors
                  currentUser={currentUser}
                  collaborators={currentProject.collaborators}
                  className="absolute inset-0 z-10" />)}

              {/* Enhanced workspace content */}<div className="absolute inset-0 bg-gray-100 flex items-center justify-center"><div className="text-center"><Map className="h-16 w-16 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-600 mb-2">Enhanced GIS Workspace</h3><p className="text-gray-500 max-w-md">Your enhanced collaborative GIS workspace with real-time collaboration, advanced
                    analytics, and comprehensive project management.</p><div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground"><div className="flex items-center gap-1"><Users className="h-4 w-4" />{currentProject.analytics.activeUsers} collaborating</div><div className="flex items-center gap-1"><Layers className="h-4 w-4" />{currentProject.layers.length} layers</div><div className="flex items-center gap-1"><BarChart3 className="h-4 w-4" />{currentProject.analytics.totalEdits} edits</div></div></div></div>{/* Enhanced workspace toolbar */}<div className="absolute top-4 left-4 z-20"><div className="bg-white rounded-lg shadow-lg border p-2 flex gap-1"><Button size="sm" variant="ghost" title="Pan"><Hand className="h-4 w-4" /></Button><Button size="sm" variant="ghost" title="Zoom In"><ZoomIn className="h-4 w-4" /></Button><Button size="sm" variant="ghost" title="Zoom Out"><ZoomOut className="h-4 w-4" /></Button><Separator orientation="vertical" className="mx-1" /><Button size="sm" variant="ghost" title="Edit"><Edit className="h-4 w-4" /></Button><Button size="sm" variant="ghost" title="Measure"><Target className="h-4 w-4" /></Button><Button size="sm" variant="ghost" title="Analyze"><BarChart3 className="h-4 w-4" /></Button><Separator orientation="vertical" className="mx-1" /><Button
                    size="sm"
                    variant="ghost"
                    title="Fullscreen"
                    onClick={() =>setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (<ExitFullscreen className="h-4 w-4" />) : (<Fullscreen className="h-4 w-4" />)}</Button></div></div>{/* Enhanced status indicators */}<div className="absolute top-4 right-4 z-20"><div className="bg-white rounded-lg shadow-lg border p-2 flex items-center gap-2">{isPresenting && (<div className="flex items-center gap-1 text-sm text-purple-600"><ScreenShare className="h-4 w-4" />Presenting</div>)}
                  {isRecording && (<div className="flex items-center gap-1 text-sm text-red-600"><div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />Recording</div>)}<div className={`flex items-center gap-1 text-sm ${connectionDisplay.color}`}>{connectionDisplay.icon}
                    {connectionDisplay.text}</div></div></div></div></ResizablePanel>{/* Enhanced Chat panel */}
          {showChat && (<div><ResizableHandle /><ResizablePanel defaultSize={25} minSize={20} maxSize={40}><CollaborativeChat currentUser={currentUser} className="h-full" /></ResizablePanel></div>)}</ResizablePanelGroup></div></div>
  );
};

export default EnhancedCollaborativeWorkspace;
