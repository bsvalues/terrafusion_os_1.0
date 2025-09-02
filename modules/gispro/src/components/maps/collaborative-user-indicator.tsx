import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, 
  MousePointer, 
  Pencil, 
  Clock, 
  Users
 } from '@mui/icons-material';

export type ActivityType = 'drawing' | 'editing' | 'viewing' | 'idle';

export interface UserActivity {
  userId: string;
  activityType: ActivityType;
  lastActivity: Date;
  color: string;
  data?: any;
}

export interface CollaborativeUserIndicatorProps {
  activities: UserActivity[];
  collaborators: string[];
}

export function CollaborativeUserIndicator({ 
  activities, 
  collaborators 
}: CollaborativeUserIndicatorProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Update current time every second to keep "time since" updated
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Format time since last activity
  const formatTimeSince = (date: Date): string => {
    const seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
    
    if (seconds < 5) {
      return 'just now';
    } else if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else {
      return `${Math.floor(seconds / 3600)}h ago`;
    }
  };
  
  // Get icon for activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'drawing':
        return <Pencil className="h-3 w-3" />;
      case 'editing':
        return <Edit className="h-3 w-3" />;
      case 'viewing':
        return <MousePointer className="h-3 w-3" />;
      case 'idle':
      default:
        return <Clock className="h-3 w-3" />;
    }
  };
  
  // Get text description for activity type
  const getActivityText = (type: ActivityType): string => {
    switch (type) {
      case 'drawing':
        return 'Drawing';
      case 'editing':
        return 'Editing';
      case 'viewing':
        return 'Viewing';
      case 'idle':
      default:
        return 'Idle';
    }
  };
  
  // Filter out inactive users (no activity in the last 5 minutes)
  const activeUsers = activities.filter(activity => {
    const seconds = Math.floor((currentTime.getTime() - activity.lastActivity.getTime()) / 1000);
    return seconds < 300; // 5 minutes
  });
  
  // Get total active and connected users
  const activeCount = activeUsers.length;
  const totalCount = collaborators.length;
  
  return (
    <Card className="w-auto">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Collaborators</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {activeCount} active / {totalCount} connected
          </Badge>
        </div>
        
        <div className="space-y-2">
          {activeUsers.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-2">
              No active collaborators
            </div>
          ) : (
            <div className="grid gap-2">
              {activeUsers.map((activity) => (
                <TooltipProvider key={activity.userId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2 p-1 rounded-md hover:bg-accent/50 transition-colors">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback 
                            style={{ backgroundColor: activity.color }}
                            className="text-xs text-white"
                          >
                            {activity.userId.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center"><>

                            <p className="text-xs font-medium truncate">
                              User {activity.userId.substring(0, 6)}
                            </p>
                            <div
</>
className="flex items-center space-x-1">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeSince(activity.lastActivity)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getActivityIcon(activity.activityType)}
                            <span className="text-xs text-muted-foreground">
                              {getActivityText(activity.activityType)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="text-xs">
                        <p><strong>User ID:</strong> {activity.userId}</p>
                        <p><strong>Activity:</strong> {getActivityText(activity.activityType)}</p>
                        <p><strong>Last active:</strong> {formatTimeSince(activity.lastActivity)}</p>
                        {activity.data && activity.data.mode && (
                          <p><strong>Drawing mode:</strong> {activity.data.mode}</p>
                        )}
                        {activity.data && activity.data.featureId && (
                          <p><strong>Editing feature:</strong> {activity.data.featureId.substring(0, 8)}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}