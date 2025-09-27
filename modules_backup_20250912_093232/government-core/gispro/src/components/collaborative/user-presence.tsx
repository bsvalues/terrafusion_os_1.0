import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
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
import {Users,
  Person,
  PersonAdd,
  PersonRemove,
  Circle,
  RadioButtonChecked,
  Visibility,
  VisibilityOff,
  Edit,
  LocationOn,
  Schedule,
  Settings,
  Notifications,
  NotificationsOff,
  VolumeUp,
  VolumeOff,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  Call,
  CallEnd,
  PersonPin,
  Group,
  SupervisorAccount,
  AdminPanelSettings,
  Security,
  Key,
  Lock,
  LockOpen,
  Refresh,
  FilterList,
  Sort,
  Search,
  MoreVert,
  Close,
  Check,
  Clear,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Flag,
  FlagOutlined,
  AccessTime,
  Today,
  Event,
  History,
  TrendingUp,
  TrendingDown,
  Timeline,
  Speed,
  SignalWifi4Bar,
  SignalWifiOff,
  Battery1Bar,
  Battery2Bar,
  Battery3Bar,
  BatteryFull,
  DeviceHub,
  Computer,
  Smartphone,
  Tablet,
  Watch,} from '@mui/icons-material';

interface UserDevice {id: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'watch';
  browser?: string;
  os?: string;
  version?: string;
  capabilities: {
    audio: boolean;
    video: boolean;
    screenShare: boolean;
    geolocation: boolean;};
  performance: {cpu: number; // 0-100
    memory: number; // 0-100
    network: 'fast' | 'medium' | 'slow' | 'offline';
    battery?: number; // 0-100};
  lastHeartbeat: Date;
}

interface UserLocation {coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;};
  timezone: string;
  country?: string;
  city?: string;
  isShared: boolean;
}

interface UserActivity {currentAction?: string;
  lastAction?: string;
  lastActionTime?: Date;
  idleTime: number; // seconds
  totalSessionTime: number; // seconds
  interactionCount: number;
  keystrokeCount: number;
  clickCount: number;
  scrollDistance: number;
  windowFocused: boolean;
  tabVisible: boolean;}

interface UserPresenceData {id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  status: 'online' | 'offline' | 'away' | 'busy' | 'presenting' | 'idle' | 'dnd';
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'guest' | 'observer';
  permissions: string[];
  joinedAt: Date;
  lastSeen: Date;
  location?: UserLocation;
  devices: UserDevice[];
  activity: UserActivity;
  preferences: {
    showLocation: boolean;
    showActivity: boolean;
    allowNotifications: boolean;
    allowDirectMessages: boolean;
    muteAudio: boolean;
    muteVideo: boolean;
    sharePresence: boolean;};
  collaborationData: {activeLayer?: string;
    currentTool?: string;
    viewport?: {
      center: [number, number];
      zoom: number;};
    selection?: string[];
    cursor?: {x: number;
      y: number;
      timestamp: Date;};
    isFollowing?: string; // user ID being followed
    followers?: string[]; // user IDs following this user
  };
  stats: {totalSessions: number;
    totalTime: number; // seconds
    editsCount: number;
    commentsCount: number;
    sharesCount: number;
    averageSessionLength: number;
    lastWeekActivity: number[];
    popularActions: Record<string, number>;};
}

interface PresenceFilter {status: UserPresenceData['status'][];
  roles: UserPresenceData['role'][];
  devices: UserDevice['type'][];
  showOffline: boolean;
  searchQuery: string;}

interface UserPresenceProps {currentUser: UserPresenceData;
  users: UserPresenceData[];
  maxUsers?: number;
  showDetailedView?: boolean;
  allowUserManagement?: boolean;
  onUserSelect?: (userId: string) => void;
  onUserInvite?: (email: string, role: UserPresenceData['role']) => void;
  onUserRemove?: (userId: string) => void;
  onRoleChange?: (userId: string, role: UserPresenceData['role']) => void;
  onStatusChange?: (status: UserPresenceData['status']) => void;
  onFollowUser?: (userId: string) => void;
  onUnfollowUser?: (userId: string) => void;
  onDirectMessage?: (userId: string) => void;
  onVoiceCall?: (userId: string) => void;
  onVideoCall?: (userId: string) => void;
  realTimeUpdates?: boolean;
  className?: string;}

const UserPresence: React.FC<UserPresenceProps> = ({currentUser,
  users,
  maxUsers = 50,
  showDetailedView = false,
  allowUserManagement = false,
  onUserSelect,
  onUserInvite,
  onUserRemove,
  onRoleChange,
  onStatusChange,
  onFollowUser,
  onUnfollowUser,
  onDirectMessage,
  onVoiceCall,
  onVideoCall,
  realTimeUpdates = true,
  className = '',}) => {const [presenceData, setPresenceData] = useState<UserPresenceData[]>(users);
  const [selectedUser, setSelectedUser] = useState<UserPresenceData | null>(null);
  const [activeTab, setActiveTab] = useState('online');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed' | 'grid'>('compact');
  const [filter, setFilter] = useState<PresenceFilter>({
    status: [],
    roles: [],
    devices: [],
    showOffline: false,
    searchQuery: '',});
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'role' | 'joinedAt' | 'activity'>(
    'name'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserPresenceData['role']>('viewer');
  const [bulkActions, setBulkActions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<
    Array<{id: string;
      type: 'join' | 'leave' | 'status_change' | 'activity';
      user: UserPresenceData;
      message: string;
      timestamp: Date;
      read: boolean;}>
  >([]);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Enhanced sample presence data
  const samplePresenceData: UserPresenceData[] = useMemo(
    () =>[
      {id: 'user-1',
        name: 'Dr. Sarah Chen',
        email: 'sarah.chen@terrafusion.com',
        avatar: '/avatars/sarah.jpg',
        color: '#3B82F6',
        status: 'online',
        role: 'admin',
        permissions: ['edit', 'view', 'comment', 'share', 'admin'],
        joinedAt: new Date(Date.now() - 7200000),
        lastSeen: new Date(),
        location: {
          timezone: 'America/Los_Angeles',
          country: 'United States',
          city: 'San Francisco',
          isShared: true,
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 100,},
        },
        devices: [
          {id: 'device-1',
            type: 'desktop',
            browser: 'Chrome',
            os: 'macOS',
            version: '119.0',
            capabilities: {
              audio: true,
              video: true,
              screenShare: true,
              geolocation: true,},
            performance: {cpu: 25,
              memory: 45,
              network: 'fast',
              battery: 85,},
            lastHeartbeat: new Date(),
          },
        ],
        activity: {currentAction: 'Editing Environmental Sensors layer',
          lastAction: 'Added 15 data points',
          lastActionTime: new Date(Date.now() - 300000),
          idleTime: 0,
          totalSessionTime: 7200,
          interactionCount: 247,
          keystrokeCount: 1543,
          clickCount: 189,
          scrollDistance: 12847,
          windowFocused: true,
          tabVisible: true,},
        preferences: {showLocation: true,
          showActivity: true,
          allowNotifications: true,
          allowDirectMessages: true,
          muteAudio: false,
          muteVideo: false,
          sharePresence: true,},
        collaborationData: {activeLayer: 'layer-2',
          currentTool: 'edit',
          viewport: {
            center: [-122.4194, 37.7749],
            zoom: 12,},
          selection: ['feature-1', 'feature-2'],
          cursor: {x: 450,
            y: 300,
            timestamp: new Date(),},
          followers: ['user-3'],
        },
        stats: {totalSessions: 45,
          totalTime: 156000,
          editsCount: 234,
          commentsCount: 67,
          sharesCount: 12,
          averageSessionLength: 3466,
          lastWeekActivity: [5, 8, 12, 15, 20, 18, 22],
          popularActions: {
            layer_edit: 89,
            comment_add: 34,
            analysis_run: 23,},
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
        joinedAt: new Date(Date.now() - 5400000),
        lastSeen: new Date(Date.now() - 60000),
        location: {
          timezone: 'America/New_York',
          country: 'United States',
          city: 'New York',
          isShared: true,},
        devices: [
          {id: 'device-2',
            type: 'desktop',
            browser: 'Firefox',
            os: 'Windows',
            version: '119.0',
            capabilities: {
              audio: true,
              video: true,
              screenShare: true,
              geolocation: false,},
            performance: {cpu: 45,
              memory: 67,
              network: 'medium',},
            lastHeartbeat: new Date(Date.now() - 60000),
          },
        ],
        activity: {currentAction: 'Presenting analysis results',
          lastAction: 'Started screen sharing',
          lastActionTime: new Date(Date.now() - 900000),
          idleTime: 0,
          totalSessionTime: 5400,
          interactionCount: 156,
          keystrokeCount: 890,
          clickCount: 123,
          scrollDistance: 8456,
          windowFocused: true,
          tabVisible: true,},
        preferences: {showLocation: true,
          showActivity: true,
          allowNotifications: true,
          allowDirectMessages: true,
          muteAudio: false,
          muteVideo: false,
          sharePresence: true,},
        collaborationData: {activeLayer: 'layer-4',
          currentTool: 'present',
          viewport: {
            center: [-74.006, 40.7128],
            zoom: 10,},
          followers: ['user-1', 'user-4'],
        },
        stats: {totalSessions: 32,
          totalTime: 98000,
          editsCount: 156,
          commentsCount: 45,
          sharesCount: 8,
          averageSessionLength: 3062,
          lastWeekActivity: [3, 6, 9, 12, 16, 14, 18],
          popularActions: {
            layer_edit: 67,
            presentation: 23,
            comment_add: 19,},
        },
      },
      {id: 'user-3',
        name: 'Emily Johnson',
        email: 'emily.johnson@terrafusion.com',
        color: '#10B981',
        status: 'away',
        role: 'editor',
        permissions: ['edit', 'view', 'comment'],
        joinedAt: new Date(Date.now() - 3600000),
        lastSeen: new Date(Date.now() - 1800000),
        location: {
          timezone: 'Europe/London',
          country: 'United Kingdom',
          city: 'London',
          isShared: false,},
        devices: [
          {id: 'device-3',
            type: 'mobile',
            browser: 'Safari',
            os: 'iOS',
            version: '17.1',
            capabilities: {
              audio: true,
              video: true,
              screenShare: false,
              geolocation: true,},
            performance: {cpu: 30,
              memory: 55,
              network: 'fast',
              battery: 67,},
            lastHeartbeat: new Date(Date.now() - 1800000),
          },
        ],
        activity: {currentAction: 'Idle',
          lastAction: 'Added comment on analysis',
          lastActionTime: new Date(Date.now() - 1800000),
          idleTime: 1800,
          totalSessionTime: 3600,
          interactionCount: 89,
          keystrokeCount: 234,
          clickCount: 67,
          scrollDistance: 3456,
          windowFocused: false,
          tabVisible: false,},
        preferences: {showLocation: false,
          showActivity: true,
          allowNotifications: true,
          allowDirectMessages: true,
          muteAudio: true,
          muteVideo: true,
          sharePresence: true,},
        collaborationData: {activeLayer: 'layer-1',
          currentTool: 'select',
          isFollowing: 'user-1',},
        stats: {totalSessions: 28,
          totalTime: 76000,
          editsCount: 98,
          commentsCount: 89,
          sharesCount: 5,
          averageSessionLength: 2714,
          lastWeekActivity: [2, 4, 7, 9, 11, 8, 13],
          popularActions: {
            comment_add: 45,
            layer_edit: 34,
            bookmark_create: 12,},
        },
      },
      {id: 'user-4',
        name: 'James Wilson',
        email: 'james.wilson@gov.org',
        color: '#F59E0B',
        status: 'busy',
        role: 'viewer',
        permissions: ['view', 'comment'],
        joinedAt: new Date(Date.now() - 1800000),
        lastSeen: new Date(Date.now() - 300000),
        location: {
          timezone: 'America/Chicago',
          country: 'United States',
          city: 'Chicago',
          isShared: true,},
        devices: [
          {id: 'device-4',
            type: 'tablet',
            browser: 'Chrome',
            os: 'Android',
            version: '119.0',
            capabilities: {
              audio: true,
              video: true,
              screenShare: false,
              geolocation: true,},
            performance: {cpu: 55,
              memory: 78,
              network: 'medium',
              battery: 45,},
            lastHeartbeat: new Date(Date.now() - 300000),
          },
        ],
        activity: {currentAction: 'Reviewing analysis results',
          lastAction: 'Viewed bookmark',
          lastActionTime: new Date(Date.now() - 300000),
          idleTime: 180,
          totalSessionTime: 1800,
          interactionCount: 45,
          keystrokeCount: 123,
          clickCount: 89,
          scrollDistance: 2456,
          windowFocused: true,
          tabVisible: true,},
        preferences: {showLocation: true,
          showActivity: false,
          allowNotifications: false,
          allowDirectMessages: true,
          muteAudio: false,
          muteVideo: true,
          sharePresence: true,},
        collaborationData: {currentTool: 'view',
          isFollowing: 'user-2',},
        stats: {totalSessions: 15,
          totalTime: 34000,
          editsCount: 0,
          commentsCount: 23,
          sharesCount: 2,
          averageSessionLength: 2266,
          lastWeekActivity: [1, 2, 4, 3, 5, 4, 6],
          popularActions: {
            view: 67,
            comment_add: 12,
            bookmark_view: 8,},
        },
      },
    ],
    []
  );

  // Initialize presence data
  useEffect(() => {if (users.length === 0) {
      setPresenceData(samplePresenceData);} else {setPresenceData(users);}
  }, [users, samplePresenceData]);

  // Real-time updates simulation
  useEffect(() => {
    if (realTimeUpdates) {
      updateIntervalRef.current = setInterval(() => {
        setPresenceData(prev =>
          prev.map(user => {
            // Simulate activity updates
            const activityUpdate = Math.random();

            if (activityUpdate< 0.1) {
              // 10% chance of status change
              const statuses: UserPresenceData['status'][] = ['online', 'away', 'busy'];
              const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

              if (newStatus !== user.status) {
                setNotifications(prevNotifs =>[
                  ...prevNotifs,
                  {
                    id: `notif-${Date.now()}`,
                    type: 'status_change',
                    user,
                    message: `${user.name} is now ${newStatus}`,
                    timestamp: new Date(),
                    read: false,
                  },
                ]);
              }

              return {...user, status: newStatus, lastSeen: new Date()};
            }

            if (activityUpdate< 0.3 && user.status === 'online') {// 30% chance of activity update
              return {
                ...user,
                activity: {
                  ...user.activity,
                  idleTime: user.activity.idleTime + 5,
                  totalSessionTime: user.activity.totalSessionTime + 5,
                  interactionCount: user.activity.interactionCount + Math.floor(Math.random() * 3),},
                lastSeen: new Date(),
              };
            }

            return user;
          })
        );
      }, 5000);

      return () =>{if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);}
      };
    }
  }, [realTimeUpdates]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {let filtered = presenceData.filter(user => {
      // Status filter
      if (filter.status.length > 0 && !filter.status.includes(user.status)) {
        return false;}

      // Role filter
      if (filter.roles.length > 0 && !filter.roles.includes(user.role)) {return false;}

      // Device filter
      if (
        filter.devices.length > 0 &&
        !user.devices.some(device => filter.devices.includes(device.type))
      ) {return false;}

      // Offline filter
      if (!filter.showOffline && user.status === 'offline') {return false;}

      // Search query
      if (filter.searchQuery) {const query = filter.searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
        );}

      return true;
    });

    // Apply maxUsers limit
    if (maxUsers && filtered.length > maxUsers) {filtered = filtered.slice(0, maxUsers);}

    // Sort users
    filtered.sort((a, b) => {let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          const statusOrder = {
            online: 1,
            presenting: 2,
            busy: 3,
            away: 4,
            idle: 5,
            dnd: 6,
            offline: 7,};
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'role':
          const roleOrder = {owner: 1, admin: 2, editor: 3, viewer: 4, guest: 5, observer: 6};
          aValue = roleOrder[a.role];
          bValue = roleOrder[b.role];
          break;
        case 'joinedAt':
          aValue = a.joinedAt;
          bValue = b.joinedAt;
          break;
        case 'activity':
          aValue = a.activity.totalSessionTime;
          bValue = b.activity.totalSessionTime;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (aValue< bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [presenceData, filter, sortBy, sortOrder, maxUsers]);

  // Group users by status
  const usersByStatus = useMemo(() => {
    const groups: Record<string, UserPresenceData[]>= {};
    filteredAndSortedUsers.forEach(user => {if (!groups[user.status]) {
        groups[user.status] = [];}
      groups[user.status].push(user);
    });
    return groups;
  }, [filteredAndSortedUsers]);

  // Handle user selection
  const handleUserSelect = (user: UserPresenceData) => {setSelectedUser(user);
    if (onUserSelect) {
      onUserSelect(user.id);}
  };

  // Handle user invitation
  const handleUserInvite = () => {
    if (inviteEmail && onUserInvite) {
      onUserInvite(inviteEmail, inviteRole);
      setInviteEmail('');
      setShowInviteDialog(false);

      setNotifications(prev => [
        ...prev,
        {
          id: `notif-${Date.now()}`,
          type: 'join',
          user: currentUser,
          message: `Invitation sent to ${inviteEmail}`,
          timestamp: new Date(),
          read: false,
        },
      ]);
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status: UserPresenceData['status']) => {switch (status) {
      case 'online':
        return { icon: Circle, color: 'text-green-500', bg: 'bg-green-500'};
      case 'presenting':
        return {icon: ScreenShare, color: 'text-purple-500', bg: 'bg-purple-500'};
      case 'busy':
        return {icon: Circle, color: 'text-red-500', bg: 'bg-red-500'};
      case 'away':
        return {icon: Schedule, color: 'text-yellow-500', bg: 'bg-yellow-500'};
      case 'idle':
        return {icon: AccessTime, color: 'text-gray-500', bg: 'bg-gray-500'};
      case 'dnd':
        return {icon: Circle, color: 'text-red-600', bg: 'bg-red-600'};
      default:
        return {icon: Circle, color: 'text-gray-400', bg: 'bg-gray-400'};
    }
  };

  // Get role icon
  const getRoleIcon = (role: UserPresenceData['role']) => {switch (role) {
      case 'owner':
        return<SupervisorAccount className="h-3 w-3 text-yellow-600" />;
      case 'admin':
        return <AdminPanelSettings className="h-3 w-3 text-red-600" />;
      case 'editor':
        return <Edit className="h-3 w-3 text-blue-600" />;
      case 'viewer':
        return <Visibility className="h-3 w-3 text-green-600" />;
      case 'guest':
        return <Person className="h-3 w-3 text-purple-600" />;
      case 'observer':
        return <Visibility className="h-3 w-3 text-gray-600" />;
      default:
        return <Person className="h-3 w-3 text-gray-600" />;}
  };

  // Get device icon
  const getDeviceIcon = (deviceType: UserDevice['type']) =>{switch (deviceType) {
      case 'desktop':
        return<Computer className="h-3 w-3" />;
      case 'mobile':
        return <Smartphone className="h-3 w-3" />;
      case 'tablet':
        return <Tablet className="h-3 w-3" />;
      case 'watch':
        return <Watch className="h-3 w-3" />;
      default:
        return <DeviceHub className="h-3 w-3" />;}
  };

  // Get network icon
  const getNetworkIcon = (network: UserDevice['performance']['network']) =>{switch (network) {
      case 'fast':
        return<SignalWifi4Bar className="h-3 w-3 text-green-600" />;
      case 'medium':
        return <SignalWifi4Bar className="h-3 w-3 text-yellow-600" />;
      case 'slow':
        return <Battery1Bar className="h-3 w-3 text-red-600" />;
      case 'offline':
        return <SignalWifiOff className="h-3 w-3 text-gray-600" />;
      default:
        return <SignalWifi4Bar className="h-3 w-3 text-gray-600" />;}
  };

  // Format time
  const formatTime = (date: Date) =>{return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',});
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Render user card
  const renderUserCard = (user: UserPresenceData) => {
    const statusDisplay = getStatusDisplay(user.status);
    const StatusIcon = statusDisplay.icon;
    const primaryDevice = user.devices[0];
    const isSelected = selectedUser?.id === user.id;
    const isCurrentUser = user.id === currentUser.id;

    return (<div
        key={user.id}
        className={`p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300'} ${isCurrentUser ? 'ring-2 ring-blue-200' : ''}`}
        onClick={() => handleUserSelect(user)}
      ><div className="flex items-start gap-3"><div className="relative flex-shrink-0"><Avatar className="h-10 w-10"><AvatarImage src={user.avatar} /><AvatarFallback style={{ backgroundColor: user.color + '20', color: user.color}}>{user.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')}</AvatarFallback></Avatar>{/* Status indicator */}<div
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${statusDisplay.bg} flex items-center justify-center`}
            >{user.status === 'presenting' &&<ScreenShare className="h-2 w-2 text-white" />}
            </div>{/* Following indicator */}
            {user.collaborationData.isFollowing && (<div className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-blue-500 border border-white flex items-center justify-center"><PersonPin className="h-2 w-2 text-white" /></div>)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h4 className="text-sm font-medium truncate">{user.name}</h4>{getRoleIcon(user.role)}
              {isCurrentUser && (<Badge variant="outline" className="text-xs">You</Badge>)}</div><div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><StatusIcon className={`h-3 w-3 ${statusDisplay.color}`} /><span className="capitalize">{user.status}</span>{primaryDevice && (<div className="flex items-center gap-1"><span>•</span>{getDeviceIcon(primaryDevice.type)}<span>{primaryDevice.type}</span></div>)}</div>{viewMode === 'detailed' && (<div className="space-y-1 text-xs text-muted-foreground">{user.activity.currentAction && (<div className="flex items-center gap-1"><Edit className="h-3 w-3" /><span className="truncate">{user.activity.currentAction}</span></div>)}

                {user.location?.isShared && user.location.city && (<div className="flex items-center gap-1"><LocationOn className="h-3 w-3" /><span>{user.location.city}</span>{user.location.timezone &&<span>({formatTime(new Date())})</span>}
                  </div>)}<div className="flex items-center gap-1"><Schedule className="h-3 w-3" /><span>Active {formatDuration(user.activity.totalSessionTime)}</span></div>{primaryDevice && (<div className="flex items-center gap-2">{getNetworkIcon(primaryDevice.performance.network)}<Progress value={100 - primaryDevice.performance.cpu} className="flex-1 h-1" />{primaryDevice.performance.battery && (<span>{primaryDevice.performance.battery}%</span>)}</div>)}</div>)}

            {user.collaborationData.followers && user.collaborationData.followers.length > 0 && (<div className="flex items-center gap-1 mt-2"><PersonPin className="h-3 w-3 text-blue-600" /><span className="text-xs text-blue-600">{user.collaborationData.followers.length} follower
                  {user.collaborationData.followers.length > 1 ? 's' : ''}</span></div>)}</div>{/* Action buttons */}<div className="flex flex-col gap-1">{!isCurrentUser && (<div className="flex gap-1">{onDirectMessage && (<TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                          size="sm"
                          variant="ghost"
                          onClick={e => {
                            e.stopPropagation();
                            onDirectMessage(user.id);}}
                          className="h-6 w-6 p-0"
                        ><Chat className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent><p>Send message</p></TooltipContent></Tooltip></TooltipProvider>)}

                {onFollowUser && !user.collaborationData.followers?.includes(currentUser.id) && (<TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                          size="sm"
                          variant="ghost"
                          onClick={e => {
                            e.stopPropagation();
                            onFollowUser(user.id);}}
                          className="h-6 w-6 p-0"
                        ><PersonPin className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent><p>Follow user</p></TooltipContent></Tooltip></TooltipProvider>)}

                {onVoiceCall && user.devices.some(d => d.capabilities.audio) && (<TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                          size="sm"
                          variant="ghost"
                          onClick={e => {
                            e.stopPropagation();
                            onVoiceCall(user.id);}}
                          className="h-6 w-6 p-0"
                        ><Call className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent><p>Voice call</p></TooltipContent></Tooltip></TooltipProvider>)}</div>)}

            {allowUserManagement && !isCurrentUser && (<Button
                size="sm"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  // Show management options}}
                className="h-6 w-6 p-0"
              ><MoreVert className="h-3 w-3" /></Button>)}</div></div></div>);
  };

  return (<div className={`h-full flex flex-col ${className}`}><Card className="flex-1 flex flex-col"><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />User Presence ({filteredAndSortedUsers.length})
              {notifications.filter(n => !n.read).length > 0 && (<Badge variant="destructive" className="text-xs">{notifications.filter(n => !n.read).length}</Badge>)}</CardTitle><div className="flex items-center gap-2"><Button
                size="sm"
                variant="outline"
                onClick={() =>setViewMode(
                    viewMode === 'compact'
                      ? 'detailed'
                      : viewMode === 'detailed'
                        ? 'grid'
                        : 'compact'
                  )}
              >
                {viewMode === 'compact' ? 'Compact' : viewMode === 'detailed' ? 'Detailed' : 'Grid'}</Button>{allowUserManagement && (<Button size="sm" variant="outline" onClick={() => setShowInviteDialog(true)}><PersonAdd className="h-3 w-3 mr-1" />Invite</Button>)}<Button
                size="sm"
                variant="outline"
                onClick={() =>{
                  // Export presence data}}
              >
                Export</Button></div></div>{/* Filters and search */}<div className="mt-4 space-y-3"><div className="grid grid-cols-2 gap-3"><div className="relative"><Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" /><Input
                  placeholder="Search users..."
                  value={filter.searchQuery}
                  onChange={e => setFilter(prev => ({ ...prev, searchQuery: e.target.value}))}
                  className="pl-7 h-8 text-xs"
                /></div><div className="flex gap-1"><select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="flex-1 text-xs border rounded px-2 py-1"
                ><option value="name">Name</option><option value="status">Status</option><option value="role">Role</option><option value="joinedAt">Joined</option><option value="activity">Activity</option></select><Button
                  size="sm"
                  variant="outline"
                  onClick={() =>setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-8 w-8 p-0"
                >
                  {sortOrder === 'asc' ? (<TrendingUp className="h-3 w-3" />) : (<TrendingDown className="h-3 w-3" />)}</Button></div></div><div className="flex items-center gap-2 text-xs"><label className="flex items-center gap-1"><input
                  type="checkbox"
                  checked={filter.showOffline}
                  onChange={e =>setFilter(prev => ({ ...prev, showOffline: e.target.checked}))}
                  className="h-3 w-3"
                />
                Show offline</label>{bulkActions.length > 0 && (<div className="flex items-center gap-1 ml-auto"><span className="text-muted-foreground">{bulkActions.length} selected</span><Button size="sm" variant="outline" className="h-6 text-xs">Actions</Button></div>)}</div></div></CardHeader><CardContent className="flex-1 overflow-hidden"><Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col"><TabsList className="grid w-full grid-cols-4 mb-4"><TabsTrigger value="online">Online ({usersByStatus.online?.length || 0})</TabsTrigger><TabsTrigger value="all">All ({filteredAndSortedUsers.length})</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="stats">Stats</TabsTrigger></TabsList><TabsContent value="online" className="flex-1 flex flex-col min-h-0"><ScrollArea className="flex-1"><div
                  className={`space-y-3 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 space-y-0' : ''}`}
                >{usersByStatus.online?.map(renderUserCard) || (<div className="text-center py-8"><Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Online Users</h3><p className="text-muted-foreground">No users are currently online.</p></div>)}</div></ScrollArea></TabsContent><TabsContent value="all" className="flex-1 flex flex-col min-h-0"><ScrollArea className="flex-1"><div
                  className={`space-y-3 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 space-y-0' : ''}`}
                >{filteredAndSortedUsers.length === 0 ? (<div className="text-center py-8"><Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Users Found</h3><p className="text-muted-foreground">No users match your current filters.</p></div>) : (
                    filteredAndSortedUsers.map(renderUserCard)
                  )}</div></ScrollArea></TabsContent><TabsContent value="activity" className="flex-1"><div className="text-center py-8"><Timeline className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">Activity Timeline</h3><p className="text-muted-foreground">Real-time user activity and collaboration events.</p></div></TabsContent><TabsContent value="stats" className="flex-1"><div className="text-center py-8"><BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">Presence Statistics</h3><p className="text-muted-foreground">User engagement and collaboration analytics.</p></div></TabsContent></Tabs></CardContent></Card>{/* User invite dialog */}
      {showInviteDialog && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><Card className="w-96"><CardHeader><CardTitle className="flex items-center justify-between">Invite User<Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInviteDialog(false)}
                  className="h-6 w-6 p-0"
                ><Close className="h-4 w-4" /></Button></CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="text-sm font-medium mb-1 block">Email Address</label><Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                /></div><div><label className="text-sm font-medium mb-1 block">Role</label><select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserPresenceData['role'])}
                  className="w-full text-sm border rounded px-3 py-2"
                ><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option><option value="guest">Guest</option><option value="observer">Observer</option></select></div><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() =>setShowInviteDialog(false)}>
                  Cancel</Button><Button size="sm" onClick={handleUserInvite} disabled={!inviteEmail}>Send Invitation</Button></div></CardContent></Card></div>)}</div>
  );
};

export default UserPresence;
