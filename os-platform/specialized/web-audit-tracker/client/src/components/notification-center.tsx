import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Bell, 
  BellOff, 
  CheckCircle2, 
  MessageSquare, 
  UserPlus, 
  Warning,
  X,
  MoreHorizontal} from '@mui/icons-material';
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Popover, 
  PopoverContent, 
  PopoverTrigger} from "@/components/ui/popover";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {useToast} from "@/hooks/use-toast";
import {format} from "date-fns";
import {apiRequest} from "@/lib/queryClient";

interface Notification {id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  entityType?: string;
  entityId?: number;
  relatedUserId?: number;
  isRead: boolean;
  actionUrl?: string;
  metadata?: any;
  createdAt: string;
  relatedUser?: {
    id: number;
    fullName: string;
    role: string;};
}

const notificationIcons = {mention: MessageSquare,
  reply: MessageSquare,
  annotation_created: MessageSquare,
  status_change: Warning,
  user_assigned: UserPlus,
  default: Bell};

export function NotificationCenter() {const { toast} = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const {data: notifications, isLoading} = useQuery({queryKey: ['/api/collaborative/notifications'],
    queryFn: () =>apiRequest('GET', '/api/collaborative/notifications?limit=20'),
    refetchInterval: 30000 // Refetch every 30 seconds});

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('PATCH', `/api/collaborative/notifications/${id}/read`),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['/api/collaborative/notifications']});
    }
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({mutationFn: () => 
      apiRequest('PATCH', '/api/collaborative/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborative/notifications']});
      toast({title: "Success",
        description: "All notifications marked as read"});
    }
  });

  const handleNotificationClick = (notification: Notification) => {if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);}
    
    // Navigate to the action URL if provided
    if (notification.actionUrl) {// In a real app, you'd use your router here
      console.log('Navigate to:', notification.actionUrl);}
    
    setIsOpen(false);
  };

  const unreadCount = notifications?.data?.filter((n: Notification) => !n.isRead).length || 0;

  const NotificationItem = ({notification}: {notification: Notification}) => {
    const IconComponent = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.default;
    
    return (<Card 
        className={`mb-2 cursor-pointer transition-colors hover:bg-gray-50 ${
          !notification.isRead ? 'border-l-4 border-l-terrafusion-cyan bg-blue-50/30' : ''}`}
        onClick={() => handleNotificationClick(notification)}
      ><CardContent className="p-3"><div className="flex items-start gap-3"><div className="flex-shrink-0"><><IconComponent size={16} className="text-terrafusion-cyan mt-1" /></div><div
</>
className="flex-1 min-w-0"><div className="flex items-start justify-between"><h4 className="text-sm font-medium text-gray-900 truncate">{notification.title}</h4>{!notification.isRead && (<><div className="w-2 h-2 bg-terrafusion-cyan rounded-full flex-shrink-0 ml-2 mt-1" />)}</div><p
</>className="text-xs text-gray-600 mt-1 line-clamp-2">
                {notification.content}</p><div className="flex items-center gap-2 mt-2">{notification.relatedUser && (<div className="flex items-center gap-1"><Avatar className="h-4 w-4"><AvatarFallback className="text-xs">{notification.relatedUser.fullName.charAt(0)}</AvatarFallback></Avatar><span className="text-xs text-gray-500">{notification.relatedUser.fullName}</span></div>)}<span className="text-xs text-gray-400">{format(new Date(notification.createdAt), 'MMM d, HH:mm')}</span></div></div></div></CardContent></Card>);
  };

  return (<Popover open={isOpen} onOpenChange={setIsOpen}><PopoverTrigger asChild><Button 
          variant="ghost" 
          size="sm" 
          className="relative p-2 text-white hover:bg-white/10"
        ><Bell size={18} />{unreadCount > 0 && (<Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500"
            >{unreadCount > 99 ? '99+' : unreadCount}</Badge>)}</Button></PopoverTrigger><PopoverContent className="w-80 p-0" align="end"><div className="p-4 border-b"><div className="flex items-center justify-between"><><h3 className="font-semibold">Notifications</h3><div
</>className="flex items-center gap-2">
              {unreadCount > 0 && (<Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                ><CheckCircle2 size={14} className="mr-1" />Mark all read</Button>)}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem><><Bell size={14} className="mr-2" />Notification Settings</DropdownMenuItem><DropdownMenuItem
</></>><BellOff size={14} className="mr-2" />Turn Off Notifications</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>{unreadCount > 0 && (<p className="text-sm text-gray-600 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>)}</div><ScrollArea className="max-h-96"><div className="p-2">{isLoading ? (<div className="text-center py-8 text-gray-500">Loading notifications...</div>) : notifications?.data?.length > 0 ? (
              notifications.data.map((notification: Notification) => (<NotificationItem key={notification.id} notification={notification} />))
            ) : (<div className="text-center py-8 text-gray-500"><Bell size={24} className="mx-auto mb-2 opacity-50" /><><p>No notifications yet</p><p
</>
className="text-xs">You'll see updates here when team members interact with your work</p></div>)}</div></ScrollArea>{notifications?.data?.length > 0 && (<div className="p-3 border-t"><Button variant="ghost" className="w-full text-sm">View all notifications</Button></div>)}</PopoverContent></Popover>);
}

// Notification Badge Component for showing notification counts inline
export function NotificationBadge({entityType, entityId}: {entityType: string; entityId: number}) {const { data: stats} = useQuery({
    queryKey: ['/api/collaborative/stats', entityType, entityId],
    queryFn: () => apiRequest(`/api/collaborative/stats/${entityType}/${entityId}`)
  });

  const totalAnnotations = stats?.data?.annotations?.total || 0;
  const activeAnnotations = stats?.data?.annotations?.active || 0;
  const totalComments = stats?.data?.comments?.total || 0;

  if (totalAnnotations === 0 && totalComments === 0) {return null;}

  return (<div className="flex items-center gap-2">{activeAnnotations > 0 && (<Badge variant="secondary" className="text-xs">{activeAnnotations} annotation{activeAnnotations !== 1 ? 's' : ''}</Badge>)}
      {totalComments > 0 && (<Badge variant="outline" className="text-xs">{totalComments} comment{totalComments !== 1 ? 's' : ''}</Badge>)}</div>
  );
}