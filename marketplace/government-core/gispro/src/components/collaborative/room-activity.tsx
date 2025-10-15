import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Activity,
  Users, 
  MessageSquare,
  Edit,
  Eye,
  Share,
  Download,
  Upload,
  Save,
  Delete,
  History,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Map,
  Layers,
  Settings,
  Filter,
  Search,
  Sort,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Warning,
  Error,
  Crown,
  Shield,
  Star,
  Flag,
  Bookmark,
  Comment,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Forward,
  MoreHorizontal,
  Play,
  Pause,
  Stop,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ExternalLink,
  Copy,
  Link,
  Archive,
  Unarchive
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';
  lastActivity?: Date;
}

interface ActivityEvent {
  id: string;
  type: 'user_join' | 'user_leave' | 'layer_create' | 'layer_edit' | 'layer_delete' | 
        'comment_add' | 'comment_reply' | 'comment_resolve' | 'bookmark_create' | 
        'share' | 'export' | 'import' | 'analysis_run' | 'session_start' | 
        'session_end' | 'presentation_start' | 'presentation_end' | 'recording_start' | 
        'recording_end' | 'settings_change' | 'permission_change' | 'data_sync' | 
        'error' | 'warning' | 'info' | 'system';
  user: User;
  timestamp: Date;
  title: string;
  description?: string;
  metadata?: {
    layerId?: string;
    layerName?: string;
    commentId?: string;
    bookmarkId?: string;
    analysisType?: string;
    exportFormat?: string;
    errorCode?: string;
    oldValue?: any;
    newValue?: any;
    affectedUsers?: string[];
    duration?: number;
    fileSize?: number;
    coordinates?: [number, number];
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
  isRead?: boolean;
  isArchived?: boolean;
  reactions?: {
    userId: string;
    type: 'like' | 'dislike' | 'important' | 'question';
    timestamp: Date;
  }[];
  relatedEvents?: string[];
}

interface ActivityFilter {
  types: ActivityEvent['type'][];
  users: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  severity?: ActivityEvent['severity'][];
  showArchived: boolean;
  searchQuery: string;
}

interface ActivityStats {
  totalEvents: number;
  todayEvents: number;
  weekEvents: number;
  userActivity: Record<string, number>;
  typeDistribution: Record<ActivityEvent['type'], number>;
  hourlyActivity: number[];
  averageSessionDuration: number;
  mostActiveUser: User;
  mostEditedLayer: string;
  errorRate: number;
}

interface RoomActivityProps {
  projectId: string;
  currentUser: User;
  users: User[];
  events?: ActivityEvent[];
  onEventAction?: (eventId: string, action: 'archive' | 'unarchive' | 'delete' | 'react') => void;
  onFilterChange?: (filter: ActivityFilter) => void;
  onExportActivity?: (format: 'csv' | 'json' | 'pdf') => void;
  realTimeUpdates?: boolean;
  showStats?: boolean;
  className?: string;
}

const RoomActivity: React.FC<RoomActivityProps> = ({
  projectId,
  currentUser,
  users,
  events = [],
  onEventAction,
  onFilterChange,
  onExportActivity,
  realTimeUpdates = true,
  showStats = true,
  className = ''
}) => {
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(events);
  const [activeTab, setActiveTab] = useState('feed');
  const [filter, setFilter] = useState<ActivityFilter>({
    types: [],
    users: [],
    dateRange: {},
    severity: [],
    showArchived: false,
    searchQuery: ''
  });
  const [sortBy, setSortBy] = useState<'timestamp' | 'type' | 'user' | 'severity'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(realTimeUpdates);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Sample activity events
  const sampleEvents: ActivityEvent[] = [
    {
      id: 'event-1',
      type: 'user_join',
      user: users[0] || currentUser,
      timestamp: new Date(Date.now() - 300000),
      title: 'User joined workspace',
      description: 'Dr. Sarah Chen joined the collaborative workspace',
      metadata: {},
      isRead: false
    },
    {
      id: 'event-2',
      type: 'layer_edit',
      user: users[1] || currentUser,
      timestamp: new Date(Date.now() - 600000),
      title: 'Layer modified',
      description: 'Updated Environmental Sensors layer with 15 new data points',
      metadata: {
        layerId: 'layer-2',
        layerName: 'Environmental Sensors',
        oldValue: 247,
        newValue: 262
      },
      severity: 'medium',
      isRead: true,
      reactions: [
        { userId: currentUser.id, type: 'like', timestamp: new Date(Date.now() - 300000) }
      ]
    },
    {
      id: 'event-3',
      type: 'comment_add',
      user: users[2] || currentUser,
      timestamp: new Date(Date.now() - 900000),
      title: 'Comment added',
      description: 'Added comment on pollution hotspot analysis',
      metadata: {
        commentId: 'comment-1',
        coordinates: [-122.4194, 37.7749]
      },
      isRead: true
    },
    {
      id: 'event-4',
      type: 'analysis_run',
      user: currentUser,
      timestamp: new Date(Date.now() - 1200000),
      title: 'Analysis completed',
      description: 'Spatial correlation analysis finished successfully',
      metadata: {
        analysisType: 'spatial_correlation',
        duration: 45
      },
      severity: 'low',
      isRead: true
    },
    {
      id: 'event-5',
      type: 'presentation_start',
      user: users[1] || currentUser,
      timestamp: new Date(Date.now() - 1800000),
      title: 'Presentation started',
      description: 'Michael Rodriguez started presenting to 4 participants',
      metadata: {
        affectedUsers: ['user-1', 'user-3', 'user-4', currentUser.id]
      },
      severity: 'medium',
      isRead: true
    },
    {
      id: 'event-6',
      type: 'error',
      user: users[0] || currentUser,
      timestamp: new Date(Date.now() - 2400000),
      title: 'Export failed',
      description: 'Failed to export layer data due to network timeout',
      metadata: {
        errorCode: 'NETWORK_TIMEOUT',
        layerName: 'Satellite Imagery'
      },
      severity: 'high',
      isRead: false
    },
    {
      id: 'event-7',
      type: 'layer_create',
      user: currentUser,
      timestamp: new Date(Date.now() - 3600000),
      title: 'New layer created',
      description: 'Created AI Analysis Results layer',
      metadata: {
        layerId: 'layer-4',
        layerName: 'AI Analysis Results',
        fileSize: 2547832
      },
      severity: 'low',
      isRead: true
    },
    {
      id: 'event-8',
      type: 'bookmark_create',
      user: users[2] || currentUser,
      timestamp: new Date(Date.now() - 7200000),
      title: 'Bookmark saved',
      description: 'Saved bookmark: Pollution Hotspot Area',
      metadata: {
        bookmarkId: 'bookmark-1',
        coordinates: [-122.4194, 37.7749]
      },
      isRead: true
    }
  ];

  // Initialize with sample data if none provided
  useEffect(() => {
    if (events.length === 0) {
      setActivityEvents(sampleEvents);
    } else {
      setActivityEvents(events);
    }
  }, [events]);

  // Auto-refresh functionality
  useEffect(() => {
    if (isAutoRefresh && realTimeUpdates) {
      refreshTimeoutRef.current = setTimeout(() => {
        // Simulate new events
        const newEvent: ActivityEvent = {
          id: `event-${Date.now()}`,
          type: ['user_join', 'layer_edit', 'comment_add'][Math.floor(Math.random() * 3)] as ActivityEvent['type'],
          user: users[Math.floor(Math.random() * users.length)] || currentUser,
          timestamp: new Date(),
          title: 'Real-time update',
          description: 'Simulated real-time activity event',
          isRead: false
        };

        setActivityEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
      }, refreshInterval * 1000);

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [isAutoRefresh, refreshInterval, realTimeUpdates, users, currentUser]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = activityEvents.filter(event => {
      // Type filter
      if (filter.types.length > 0 && !filter.types.includes(event.type)) {
        return false;
      }

      // User filter
      if (filter.users.length > 0 && !filter.users.includes(event.user.id)) {
        return false;
      }

      // Date range filter
      if (filter.dateRange.start && event.timestamp < filter.dateRange.start) {
        return false;
      }
      if (filter.dateRange.end && event.timestamp > filter.dateRange.end) {
        return false;
      }

      // Severity filter
      if (filter.severity && filter.severity.length > 0 && 
          (!event.severity || !filter.severity.includes(event.severity))) {
        return false;
      }

      // Archived filter
      if (!filter.showArchived && event.isArchived) {
        return false;
      }

      // Search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.user.name.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Sort events
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'user':
          aValue = a.user.name;
          bValue = b.user.name;
          break;
        case 'severity':
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          aValue = severityOrder[a.severity || 'low'];
          bValue = severityOrder[b.severity || 'low'];
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [activityEvents, filter, sortBy, sortOrder]);

  // Calculate activity statistics
  const activityStats = useMemo((): ActivityStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayEvents = activityEvents.filter(e => e.timestamp >= today).length;
    const weekEvents = activityEvents.filter(e => e.timestamp >= weekAgo).length;

    const userActivity: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {};
    const hourlyActivity = new Array(24).fill(0);

    activityEvents.forEach(event => {
      // User activity
      userActivity[event.user.id] = (userActivity[event.user.id] || 0) + 1;

      // Type distribution
      typeDistribution[event.type] = (typeDistribution[event.type] || 0) + 1;

      // Hourly activity
      const hour = event.timestamp.getHours();
      hourlyActivity[hour]++;
    });

    const mostActiveUserId = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    const mostActiveUser = users.find(u => u.id === mostActiveUserId) || currentUser;

    const sessionEvents = activityEvents.filter(e => 
      e.type === 'session_start' || e.type === 'session_end'
    );
    const averageSessionDuration = sessionEvents.length > 0 ? 
      sessionEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) / sessionEvents.length : 0;

    const layerEdits = activityEvents.filter(e => e.type === 'layer_edit');
    const layerEditCounts: Record<string, number> = {};
    layerEdits.forEach(e => {
      if (e.metadata?.layerName) {
        layerEditCounts[e.metadata.layerName] = (layerEditCounts[e.metadata.layerName] || 0) + 1;
      }
    });
    const mostEditedLayer = Object.entries(layerEditCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    const errorEvents = activityEvents.filter(e => e.type === 'error').length;
    const errorRate = activityEvents.length > 0 ? (errorEvents / activityEvents.length) * 100 : 0;

    return {
      totalEvents: activityEvents.length,
      todayEvents,
      weekEvents,
      userActivity,
      typeDistribution: typeDistribution as Record<ActivityEvent['type'], number>,
      hourlyActivity,
      averageSessionDuration,
      mostActiveUser,
      mostEditedLayer,
      errorRate
    };
  }, [activityEvents, users, currentUser]);

  // Event type configuration
  const eventTypeConfig = {
    user_join: { icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    user_leave: { icon: Users, color: 'text-red-600', bg: 'bg-red-100' },
    layer_create: { icon: Layers, color: 'text-blue-600', bg: 'bg-blue-100' },
    layer_edit: { icon: Edit, color: 'text-orange-600', bg: 'bg-orange-100' },
    layer_delete: { icon: Delete, color: 'text-red-600', bg: 'bg-red-100' },
    comment_add: { icon: Comment, color: 'text-purple-600', bg: 'bg-purple-100' },
    comment_reply: { icon: Reply, color: 'text-purple-600', bg: 'bg-purple-100' },
    comment_resolve: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    bookmark_create: { icon: Bookmark, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    share: { icon: Share, color: 'text-blue-600', bg: 'bg-blue-100' },
    export: { icon: Download, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    import: { icon: Upload, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    analysis_run: { icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    session_start: { icon: Play, color: 'text-green-600', bg: 'bg-green-100' },
    session_end: { icon: Stop, color: 'text-red-600', bg: 'bg-red-100' },
    presentation_start: { icon: Play, color: 'text-purple-600', bg: 'bg-purple-100' },
    presentation_end: { icon: Pause, color: 'text-gray-600', bg: 'bg-gray-100' },
    recording_start: { icon: Play, color: 'text-red-600', bg: 'bg-red-100' },
    recording_end: { icon: Stop, color: 'text-gray-600', bg: 'bg-gray-100' },
    settings_change: { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' },
    permission_change: { icon: Shield, color: 'text-orange-600', bg: 'bg-orange-100' },
    data_sync: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100' },
    error: { icon: Error, color: 'text-red-600', bg: 'bg-red-100' },
    warning: { icon: Warning, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
    system: { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' }
  };

  // Handle event action
  const handleEventAction = (eventId: string, action: 'archive' | 'unarchive' | 'delete' | 'react') => {
    if (action === 'react') {
      setActivityEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          const reactions = event.reactions || [];
          const existingReaction = reactions.find(r => r.userId === currentUser.id);
          
          if (existingReaction) {
            return {
              ...event,
              reactions: reactions.filter(r => r.userId !== currentUser.id)
            };
          } else {
            return {
              ...event,
              reactions: [...reactions, {
                userId: currentUser.id,
                type: 'like',
                timestamp: new Date()
              }]
            };
          }
        }
        return event;
      }));
    } else {
      setActivityEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          if (action === 'archive') {
            return { ...event, isArchived: true };
          } else if (action === 'unarchive') {
            return { ...event, isArchived: false };
          } else if (action === 'delete') {
            return event; // Will be filtered out
          }
        }
        return event;
      }));

      if (action === 'delete') {
        setActivityEvents(prev => prev.filter(event => event.id !== eventId));
      }
    }

    if (onEventAction) {
      onEventAction(eventId, action);
    }
  };

  // Update filter
  const updateFilter = (updates: Partial<ActivityFilter>) => {
    const newFilter = { ...filter, ...updates };
    setFilter(newFilter);
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
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

  // Get severity badge
  const getSeverityBadge = (severity?: ActivityEvent['severity']) => {
    if (!severity) return null;

    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={`text-xs ${colors[severity]}`}>
        {severity}
      </Badge>
    );
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Room Activity
              {filteredAndSortedEvents.some(e => !e.isRead) && (
                <Badge variant="destructive" className="text-xs">
                  {filteredAndSortedEvents.filter(e => !e.isRead).length} new
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              >
                {isAutoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                Auto-refresh
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-3 w-3" />
                Filters
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onExportActivity?.('csv')}
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Search Events</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Search activities..."
                      value={filter.searchQuery}
                      onChange={(e) => updateFilter({ searchQuery: e.target.value })}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Sort By</label>
                  <div className="flex gap-1">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="flex-1 text-xs border rounded px-2 py-1"
                    >
                      <option value="timestamp">Time</option>
                      <option value="type">Type</option>
                      <option value="user">User</option>
                      <option value="severity">Severity</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="h-8 w-8 p-0"
                    >
                      {sortOrder === 'asc' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={filter.showArchived}
                    onChange={(e) => updateFilter({ showArchived: e.target.checked })}
                    className="h-3 w-3"
                  />
                  Show archived
                </label>
                
                {selectedEvents.length > 0 && (
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-muted-foreground">
                      {selectedEvents.length} selected
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedEvents.forEach(id => handleEventAction(id, 'archive'))}
                      className="h-6 text-xs"
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedEvents([])}
                      className="h-6 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="feed">Activity Feed</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="space-y-3">
                  {filteredAndSortedEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Activity</h3>
                      <p className="text-muted-foreground">
                        No events match your current filters.
                      </p>
                    </div>
                  ) : (
                    filteredAndSortedEvents.map(event => {
                      const config = eventTypeConfig[event.type];
                      const Icon = config.icon;
                      const isExpanded = expandedEvents.includes(event.id);
                      const isSelected = selectedEvents.includes(event.id);

                      return (
                        <div
                          key={event.id}
                          className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 
                            event.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                          } ${event.isArchived ? 'opacity-50' : ''}`}
                        >
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEvents(prev => [...prev, event.id]);
                                } else {
                                  setSelectedEvents(prev => prev.filter(id => id !== event.id));
                                }
                              }}
                              className="h-3 w-3 mt-1"
                            />
                          </div>

                          <div className={`flex-shrink-0 p-2 rounded-full ${config.bg}`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium truncate">{event.title}</h4>
                                  {getSeverityBadge(event.severity)}
                                  {event.isArchived && (
                                    <Badge variant="outline" className="text-xs">
                                      Archived
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={event.user.avatar} />
                                    <AvatarFallback style={{ backgroundColor: event.user.color + '20' }}>
                                      {event.user.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{event.user.name}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(event.timestamp)}</span>
                                </div>

                                {event.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {event.description}
                                  </p>
                                )}

                                {/* Event metadata */}
                                {event.metadata && isExpanded && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                    {Object.entries(event.metadata).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                        <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Reactions */}
                                {event.reactions && event.reactions.length > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1">
                                      <ThumbsUp className="h-3 w-3 text-blue-600" />
                                      <span className="text-xs">{event.reactions.length}</span>
                                    </div>
                                    <div className="flex -space-x-1">
                                      {event.reactions.slice(0, 3).map((reaction, index) => {
                                        const user = users.find(u => u.id === reaction.userId);
                                        return (
                                          <TooltipProvider key={index}>
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Avatar className="h-4 w-4 border border-white">
                                                  <AvatarImage src={user?.avatar} />
                                                  <AvatarFallback className="text-xs">
                                                    {user?.name.split(' ').map(n => n[0]).join('') || '?'}
                                                  </AvatarFallback>
                                                </Avatar>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">{user?.name || 'Unknown user'} reacted</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEventAction(event.id, 'react')}
                                  className="h-6 w-6 p-0"
                                  title="React"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>

                                {event.metadata && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (isExpanded) {
                                        setExpandedEvents(prev => prev.filter(id => id !== event.id));
                                      } else {
                                        setExpandedEvents(prev => [...prev, event.id]);
                                      }
                                    }}
                                    className="h-6 w-6 p-0"
                                    title="Expand details"
                                  >
                                    {isExpanded ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEventAction(
                                    event.id, 
                                    event.isArchived ? 'unarchive' : 'archive'
                                  )}
                                  className="h-6 w-6 p-0"
                                  title={event.isArchived ? 'Unarchive' : 'Archive'}
                                >
                                  {event.isArchived ? <Unarchive className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="flex-1 flex flex-col min-h-0">
              {showStats && (
                <ScrollArea className="flex-1">
                  <div className="space-y-4">
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-2xl font-bold">{activityStats.totalEvents}</p>
                              <p className="text-xs text-muted-foreground">Total Events</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-2xl font-bold">{activityStats.todayEvents}</p>
                              <p className="text-xs text-muted-foreground">Today</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-sm font-bold truncate">{activityStats.mostActiveUser.name}</p>
                              <p className="text-xs text-muted-foreground">Most Active</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-2xl font-bold">{activityStats.errorRate.toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">Error Rate</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Activity distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Activity Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(activityStats.typeDistribution)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 8)
                            .map(([type, count]) => {
                              const config = eventTypeConfig[type as ActivityEvent['type']];
                              const Icon = config?.icon || Activity;
                              const percentage = (count / activityStats.totalEvents) * 100;

                              return (
                                <div key={type} className="flex items-center gap-2">
                                  <Icon className={`h-3 w-3 ${config?.color || 'text-gray-600'}`} />
                                  <span className="text-xs flex-1 capitalize">
                                    {type.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs font-medium">{count}</span>
                                  <Progress value={percentage} className="w-16 h-1" />
                                  <span className="text-xs text-muted-foreground w-8">
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* User activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">User Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(activityStats.userActivity)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 6)
                            .map(([userId, count]) => {
                              const user = users.find(u => u.id === userId) || currentUser;
                              const percentage = (count / activityStats.totalEvents) * 100;

                              return (
                                <div key={userId} className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback style={{ backgroundColor: user.color + '20' }}>
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs flex-1 truncate">{user.name}</span>
                                  <span className="text-xs font-medium">{count}</span>
                                  <Progress value={percentage} className="w-16 h-1" />
                                  <span className="text-xs text-muted-foreground w-8">
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="flex-1">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Timeline View</h3>
                <p className="text-muted-foreground">
                  Visual timeline representation of activity events.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomActivity;
