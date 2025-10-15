/**
 * Terrafusion OS 1.0 - Notification Center
 * Government-Grade Real-Time Notification System
 * 
 * Comprehensive notification management with real-time updates,
 * categorization, priority filtering, and government compliance features.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../ui/tabs';
import {
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Bell,
  BellRing,
  Check,
  CheckCheck,
  X,
  Filter,
  Search,
  Settings,
  Archive,
  Trash2,
  Clock,
  Warning,
  Info,
  CheckCircle,
  XCircle,
  User,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Share2,
  UserPlus,
  Activity,
  Star,
  Eye,
  EyeOff,
 } from '@mui/icons-material';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useToast } from '../../ui/use-toast';
import {
  CollaborationNotification,
  NotificationType,
  NotificationPriority,
  CollaborationUser,
  CollaborationComponentProps,
} from '../types/CollaborationTypes';
import { collaborationService } from '../services/CollaborationService';

interface NotificationCenterProps extends CollaborationComponentProps {
  showUnreadOnly?: boolean;
  maxNotifications?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = '',
  currentUser,
  showUnreadOnly = false,
  maxNotifications = 50,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  onUpdate,
  onError,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTab, setSelectedTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyUnread, setShowOnlyUnread] = useState(showUnreadOnly);

  // Fetch notifications
  const { 
    data: notifications = [], 
    isLoading, 
    error: notificationsError,
    refetch 
  } = useQuery({
    queryKey: ['collaboration-notifications', currentUser?.id],
    queryFn: () => currentUser ? collaborationService.getNotifications(currentUser.id) : [],
    enabled: !!currentUser,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      collaborationService.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['collaboration-notifications']);
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification status.',
        variant: 'destructive',
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(n => collaborationService.markNotificationRead(n.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collaboration-notifications']);
      toast({
        title: 'Success',
        description: 'All notifications marked as read.',
      });
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
        variant: 'destructive',
      });
    },
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (showOnlyUnread) {
      filtered = filtered.filter(n => !n.isRead);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.sender?.name.toLowerCase().includes(query)
      );
    }

    // Apply tab filter
    switch (selectedTab) {
      case 'tasks':
        filtered = filtered.filter(n => 
          n.type === NotificationType.TASK_ASSIGNED ||
          n.type === NotificationType.TASK_COMPLETED ||
          n.type === NotificationType.TASK_OVERDUE
        );
        break;
      case 'projects':
        filtered = filtered.filter(n => n.type === NotificationType.PROJECT_UPDATE);
        break;
      case 'mentions':
        filtered = filtered.filter(n => n.type === NotificationType.MENTION);
        break;
      case 'team':
        filtered = filtered.filter(n => n.type === NotificationType.TEAM_INVITATION);
        break;
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = {
        [NotificationPriority.URGENT]: 4,
        [NotificationPriority.HIGH]: 3,
        [NotificationPriority.MEDIUM]: 2,
        [NotificationPriority.LOW]: 1,
      };
      
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered.slice(0, maxNotifications);
  }, [
    notifications, 
    showOnlyUnread, 
    priorityFilter, 
    typeFilter, 
    searchQuery, 
    selectedTab, 
    maxNotifications
  ]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { date: string; notifications: CollaborationNotification[] }[] = [];
    
    filteredNotifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      let dateLabel: string;
      
      if (isToday(date)) {
        dateLabel = 'Today';
      } else if (isYesterday(date)) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = format(date, 'MMM dd, yyyy');
      }
      
      const existingGroup = groups.find(g => g.date === dateLabel);
      if (existingGroup) {
        existingGroup.notifications.push(notification);
      } else {
        groups.push({ date: dateLabel, notifications: [notification] });
      }
    });
    
    return groups;
  }, [filteredNotifications]);

  // Calculate statistics
  const stats = useMemo(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const urgentCount = notifications.filter(n => 
      n.priority === NotificationPriority.URGENT && !n.isRead
    ).length;
    const todayCount = notifications.filter(n => 
      isToday(new Date(n.createdAt))
    ).length;
    
    return { unreadCount, urgentCount, todayCount };
  }, [notifications]);

  // Real-time notification updates
  useEffect(() => {
    const handleNotificationReceived = (notification: CollaborationNotification) => {
      if (notification.recipient.id === currentUser?.id) {
        queryClient.setQueryData(
          ['collaboration-notifications', currentUser.id], 
          (oldData: CollaborationNotification[] = []) => [notification, ...oldData]
        );
        
        // Show toast for high priority notifications
        if (notification.priority === NotificationPriority.URGENT) {
          toast({
            title: notification.title,
            description: notification.message,
            duration: 10000,
          });
        }
        
        onUpdate?.(notification);
      }
    };

    collaborationService.on('notification-received', handleNotificationReceived);
    return () => collaborationService.off('notification-received', handleNotificationReceived);
  }, [queryClient, currentUser?.id, toast, onUpdate]);

  // Notification type icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.TASK_COMPLETED:
      case NotificationType.TASK_OVERDUE:
        return FileText;
      case NotificationType.PROJECT_UPDATE:
        return Activity;
      case NotificationType.MENTION:
        return MessageSquare;
      case NotificationType.MEETING_REMINDER:
        return Calendar;
      case NotificationType.DOCUMENT_SHARED:
        return Share2;
      case NotificationType.TEAM_INVITATION:
        return UserPlus;
      default:
        return Info;
    }
  };

  // Priority badge variant
  const getPriorityBadgeVariant = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'destructive';
      case NotificationPriority.HIGH:
        return 'secondary';
      case NotificationPriority.MEDIUM:
        return 'default';
      default:
        return 'outline';
    }
  };

  // Handle notification click
  const handleNotificationClick = useCallback((notification: CollaborationNotification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Handle navigation based on notification type
    if (notification.data) {
      // Navigate to relevant page based on notification data
      console.log('Navigate to:', notification.data);
    }
  }, [markAsReadMutation]);

  if (notificationsError) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" /><>

          <p className="font-medium">Failed to load notifications</p>
          <Button
</>
variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5" />
                {stats.unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {stats.unreadCount > 99 ? '99+' : stats.unreadCount}
                  </Badge>
                )}
              </div>
              <div><>

                <CardTitle>Notifications</CardTitle>
                <CardDescription
</>
</>>
                  {stats.unreadCount} unread • {stats.todayCount} today
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {stats.unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isLoading}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent><>

                  <DropdownMenuLabel>View Options</DropdownMenuLabel>
                  <DropdownMenuItem
</>
onClick={() => setShowOnlyUnread(!showOnlyUnread)}>
                    {showOnlyUnread ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {showOnlyUnread ? 'Show All' : 'Show Unread Only'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Notification Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        {/* Filters */}
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger className="w-32"><>

                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent
</>
</>><>

                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem
</>
value={NotificationPriority.URGENT}>Urgent</SelectItem><>

                  <SelectItem value={NotificationPriority.HIGH}>High</SelectItem>
                  <SelectItem
</>
value={NotificationPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={NotificationPriority.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-32"><>

                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent
</>
</>><>

                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem
</>
value={NotificationType.TASK_ASSIGNED}>Tasks</SelectItem><>

                  <SelectItem value={NotificationType.PROJECT_UPDATE}>Projects</SelectItem>
                  <SelectItem
</>
value={NotificationType.MENTION}>Mentions</SelectItem>
                  <SelectItem value={NotificationType.TEAM_INVITATION}>Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5"><>

          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger
</>
value="tasks">
            Tasks
          </TabsTrigger><>

          <TabsTrigger value="projects">
            Projects
          </TabsTrigger>
          <TabsTrigger
</>
value="mentions">
            Mentions
          </TabsTrigger>
          <TabsTrigger value="team">
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="animate-spin mx-auto mb-4"><>

                    <Bell className="h-8 w-8" />
                  </div>
                  <p
</>
</>>Loading notifications...</p>
                </div>
              </CardContent>
            </Card>
          ) : groupedNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Bell className="h-8 w-8 mx-auto mb-4 text-muted-foreground" /><>

                <p className="font-medium mb-2">No notifications found</p>
                <p
</>
className="text-sm text-muted-foreground">
                  {searchQuery || priorityFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'You\'re all caught up!'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedNotifications.map((group) => (
                <Card key={group.date}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      {group.date}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.notifications.map((notification) => {
                      const NotificationIcon = getNotificationIcon(notification.type);
                      
                      return (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                            !notification.isRead ? 'bg-blue-50/50 border-blue-200' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {notification.sender ? (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={notification.sender.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {notification.sender.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                                  <NotificationIcon className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1"><>

                                  <p className="font-medium text-sm leading-tight">
                                    {notification.title}
                                  </p>
                                  <p
</>
className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    {notification.message}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge variant={getPriorityBadgeVariant(notification.priority)} className="text-xs">
                                    {notification.priority}
                                  </Badge>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatDistanceToNow(new Date(notification.createdAt), { 
                                      addSuffix: true 
                                    })}
                                  </span>
                                </div>
                                
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsReadMutation.mutate(notification.id);
                                    }}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationCenter;