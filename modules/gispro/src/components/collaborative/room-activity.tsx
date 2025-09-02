import React, { useState, useEffect } from 'react';
import { useEnhancedWebSocket } from '@/hooks/use-enhanced-websocket';
import { CollaborativeRoom } from '@/lib/websocket-session-manager';
import { ConnectionStatusEnum, MessageTypeEnum } from '@/lib/websocket';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, 
  MapPin, 
  Pencil, 
  Clock, 
  ArrowRight, 
  ArrowRightCircle,
  Flag,
  Activity
 } from '@mui/icons-material';

/**
 * Props for the RoomActivity component
 */
interface RoomActivityProps {
  roomId: string;
  onJoinRoom?: (roomId: string) => void;
  displayMode?: 'card' | 'list-item';
  showJoinButton?: boolean;
  className?: string;
}

/**
 * Format a date for display
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format time elapsed in a human-readable way
 */
function formatTimeElapsed(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return 'Less than a minute ago';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Calculate activity level as a percentage
 */
function calculateActivityLevel(room: CollaborativeRoom): number {
  // More recent activity gets a higher percentage
  const now = Date.now();
  const timeSinceActivity = now - room.lastActivity;
  
  // Max time considered is 1 hour (3,600,000 ms)
  const maxTime = 3600000;
  
  if (timeSinceActivity > maxTime) {
    return 0;
  }
  
  return 100 - Math.floor((timeSinceActivity / maxTime) * 100);
}

/**
 * Component to display room activity information
 */
export function RoomActivity({
  roomId,
  onJoinRoom,
  displayMode = 'card',
  showJoinButton = true,
  className
}: RoomActivityProps) {
  // Use enhanced WebSocket
  const { status, currentRoom, currentRoomData, joinRoom } = useEnhancedWebSocket({
    roomId
  });
  
  // Track activity level
  const [activityLevel, setActivityLevel] = useState(0);
  
  // Room information
  const [roomInfo, setRoomInfo] = useState<{
    userCount: number;
    featureCount: number;
    annotationCount: number;
    lastActivity: number;
    createdAt: number;
  }>({
    userCount: 0,
    featureCount: 0,
    annotationCount: 0,
    lastActivity: Date.now(),
    createdAt: Date.now()
  });
  
  // Handle room join button click
  const handleJoinRoom = () => {
    // Use callback if provided
    if (onJoinRoom) {
      onJoinRoom(roomId);
    } else {
      // Otherwise use built-in join
      joinRoom(roomId);
    }
  };
  
  // Update room info when data changes
  useEffect(() => {
    if (currentRoomData) {
      setRoomInfo({
        userCount: currentRoomData.users.size,
        featureCount: currentRoomData.features.size,
        annotationCount: currentRoomData.annotations.size,
        lastActivity: currentRoomData.lastActivity,
        createdAt: currentRoomData.createdAt
      });
      
      // Calculate activity level
      setActivityLevel(calculateActivityLevel(currentRoomData));
    }
  }, [currentRoomData]);
  
  // Update activity level periodically
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentRoomData) {
        setActivityLevel(calculateActivityLevel(currentRoomData));
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(timer);
  }, [currentRoomData]);
  
  // If display mode is list item, render a simpler version
  if (displayMode === 'list-item') {
    return (
      <div className={cn(
        "flex items-center justify-between p-3 border rounded-md",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center h-12 w-12 bg-primary/10 rounded-lg"><>

            <Flag className="h-6 w-6 text-primary" />
          </div>
          <div
</>
</>><>

            <h3 className="font-medium">{roomId}</h3>
            <div
</>
className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><>

                <Users className="h-3 w-3" />
                {roomInfo.userCount}
              </span>
              <span
</>
className="flex items-center gap-1"><>

                <Pencil className="h-3 w-3" />
                {roomInfo.featureCount}
              </span>
              <span
</>
className="flex items-center gap-1"><>

                <MapPin className="h-3 w-3" />
                {roomInfo.annotationCount}
              </span>
              <span
</>
className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeElapsed(roomInfo.lastActivity)}
              </span>
            </div>
          </div>
        </div>
        
        {showJoinButton && (
          <Button 
            size="sm" 
            onClick={handleJoinRoom}
            disabled={status !== ConnectionStatusEnum.CONNECTED || currentRoom === roomId}
          >
            {currentRoom === roomId ? 'Active' : 'Join'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
  
  // Default card view
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-lg font-semibold"><>

          <span>{roomId}</span>
          <Badge
</>

            variant={activityLevel > 50 ? "default" : "secondary"} 
            className="flex gap-1 items-center"
          >
            <Activity className="h-3 w-3" />
            {activityLevel > 75 ? 'High Activity' : activityLevel > 30 ? 'Active' : 'Quiet'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1"><>

            <div className="text-sm font-medium">Users</div>
            <div
</>
className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">{roomInfo.userCount}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1"><>

            <div className="text-sm font-medium">Features</div>
            <div
</>
className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">{roomInfo.featureCount}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1"><>

            <div className="text-sm font-medium">Annotations</div>
            <div
</>
className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">{roomInfo.annotationCount}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1"><>

            <div className="text-sm font-medium">Created</div>
            <div
</>
className="text-sm text-muted-foreground">
              {formatDate(roomInfo.createdAt)}
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm"><>

            <span className="text-muted-foreground">Activity Level</span>
            <span
</>
className="font-medium">{activityLevel}%</span>
          </div><>

          <Progress value={activityLevel} className="h-2" />
        </div>
        
        <div
</>
className="text-sm"><>

          <span className="text-muted-foreground mr-1">Last activity:</span>
          <span
</>
className="font-medium">{formatTimeElapsed(roomInfo.lastActivity)}</span>
        </div>
      </CardContent>
      
      {showJoinButton && (
        <CardFooter className="pt-0">
          <Button 
            className="w-full" 
            onClick={handleJoinRoom}
            disabled={status !== ConnectionStatusEnum.CONNECTED || currentRoom === roomId}
          >
            {currentRoom === roomId ? 'Currently Active' : 'Join Collaboration Room'}
            <ArrowRightCircle className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}