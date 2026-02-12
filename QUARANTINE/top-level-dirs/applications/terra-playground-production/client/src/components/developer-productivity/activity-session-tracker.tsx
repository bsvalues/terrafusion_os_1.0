/**
 * Activity Session Tracker Component
 *
 * Track and manage developer activity sessions
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Play, Square, Clock, Code, ScrollText  } from '@mui/icons-material';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ActivitySession {
  id: number;
  activityType: string;
  description: string;
  startTime: string;
  duration?: number;
  isCompleted: boolean;
}

interface ActivitySessionTrackerProps {
  activeSessions: ActivitySession[];
  isLoading: boolean;
}

const ActivitySessionTracker: React.FC<ActivitySessionTrackerProps> = ({
  activeSessions,
  isLoading,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activityType, setActivityType] = useState('CODE_COMPLETION');
  const [description, setDescription] = useState('');

  // Start a new activity session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/productivity/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start activity session');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/sessions/active'] });
      setDescription('');
      toast({
        title: 'Session started',
        description: 'Activity session has been started successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to start session',
        description: 'There was an error starting your activity session',
        variant: 'destructive',
      });
    },
  });

  // End an activity session
  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/productivity/sessions/${sessionId}/end`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to end activity session');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/sessions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/today'] });
      toast({
        title: 'Session ended',
        description: 'Activity session has been ended successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to end session',
        description: 'There was an error ending your activity session',
        variant: 'destructive',
      });
    },
  });

  // Format time elapsed
  const formatTimeElapsed = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const elapsed = now - start;

    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'FEATURE_IMPLEMENTATION':
        return <Code className="h-4 w-4 mr-2" />;
      case 'CODE_REVIEW':
        return <ScrollText className="h-4 w-4 mr-2" />;
      case 'BUG_FIX':
        return <Code className="h-4 w-4 mr-2" />;
      case 'CODE_COMPLETION':
        return <Code className="h-4 w-4 mr-2" />;
      default:
        return <Clock className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2"><>

        <p className="text-sm font-medium">Start a new activity</p>
        <div
</> className="grid grid-cols-4 gap-2">
          <div className="col-span-3">
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger><>

                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent
</>><>

                <SelectItem value="FEATURE_IMPLEMENTATION">Feature Implementation</SelectItem>
                <SelectItem
</> value="BUG_FIX">BugReport Fix</SelectItem><>

                <SelectItem value="CODE_REVIEW">Code Review</SelectItem>
                <SelectItem
</> value="CODE_COMPLETION">Code Completion</SelectItem><>

                <SelectItem value="TESTING">Testing</SelectItem>
                <SelectItem
</> value="DOCUMENTATION">Documentation</SelectItem><>

                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem
</> value="PLANNING">Planning</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <Button
              className="w-full"
              onClick={() => startSessionMutation.mutate()}
              disabled={startSessionMutation.isPending}
            >
              {startSessionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div><>

        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full mt-2"
        />
      </div>

      <div
</> className="space-y-2">
        <p className="text-sm font-medium">Active sessions</p>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">No active sessions</div>
        ) : (
          <div className="space-y-2">
            {activeSessions.map(session => (
              <Card key={session.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      {getActivityIcon(session.activityType)}
                      <span className="font-medium text-sm">
                        {session.activityType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-xs text-muted-foreground mt-1">{session.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs flex items-center"><>

                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeElapsed(session.startTime)}
                    </div>
                    <Button
</>
                      size="sm"
                      variant="destructive"
                      onClick={() => endSessionMutation.mutate(session.id)}
                      disabled={
                        endSessionMutation.isPending && endSessionMutation.variables === session.id
                      }
                    >
                      {endSessionMutation.isPending &&
                      endSessionMutation.variables === session.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Square className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitySessionTracker;
