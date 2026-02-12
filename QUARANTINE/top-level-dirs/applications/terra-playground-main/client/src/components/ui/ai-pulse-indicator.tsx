/**
 * AI Pulse Indicator
 *
 * This component shows a visual indicator when AI agents are working.
 * It provides real-time feedback to users about AI agent activity,
 * agent type, and progress.
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Brain, Activity, CheckCircle, AlertCircle, RotateCw  } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAgentActivity } from '@/hooks/use-agent-activity';
import { Badge } from '@/components/ui/badge';

// AI Task interface to represent current active tasks
interface AITask {
  id: string;
  type: 'analysis' | 'repair' | 'conversion' | 'enhancement' | 'search' | 'detection';
  agentType: string;
  status: 'working' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  startTime: Date;
  endTime?: Date;
  notified?: boolean;
}

interface AIPulseIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  showBadges?: boolean;
  maxTasks?: number;
  className?: string;
}

/**
 * AI Pulse Indicator Component
 * Shows a pulsing indicator when AI is processing, with optional tooltips and badges
 */
export function AIPulseIndicator({
  position = 'bottom-right',
  size = 'md',
  showTooltip = true,
  showBadges = true,
  maxTasks = 3,
  className,
}: AIPulseIndicatorProps) {
  const { activeTasks, completedTasks } = useAgentActivity();
  const [notifications, setNotifications] = useState<AITask[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Set sizing based on the size prop
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  // Set positioning based on the position prop
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Process new notifications
  useEffect(() => {
    // Look for new active tasks that haven't been notified
    const newTasks = activeTasks.filter(task => task.notified !== true);

    if (newTasks.length > 0) {
      // Mark tasks as notified
      const updatedTasks = activeTasks.map(task => ({
        ...task,
        notified: true,
      }));

      // Update active tasks
      // In a real implementation, this would call a function from useAgentActivity
      // to update the notified status

      // Add new tasks to notifications
      setNotifications(prev => [...prev, ...newTasks].slice(-maxTasks));
    }

    // Process completed tasks that haven't been notified
    const newCompletedTasks = completedTasks.filter(task => task.notified !== true);

    if (newCompletedTasks.length > 0) {
      // Update notifications with completed status
      setNotifications(prev =>
        prev.map(notification => {
          const completedTask = newCompletedTasks.find(task => task.id === notification.id);
          if (completedTask) {
            return {
              ...notification,
              status: completedTask.status,
              message: completedTask.message || notification.message,
            };
          }
          return notification;
        })
      );
    }
  }, [activeTasks, completedTasks, maxTasks]);

  // Clear older notifications after they've been shown for a while
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev =>
        prev.filter(
          task =>
            task.status === 'working' ||
            new Date().getTime() - new Date(task.startTime).getTime() < 10000
        )
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  // Get the color and animation based on current state
  const getStateClasses = () => {
    const hasActiveTasks = activeTasks.length > 0;

    if (hasActiveTasks) {
      return 'text-blue-500 animate-pulse';
    }

    return 'text-gray-500';
  };

  // Get activity count to show in badge
  const getActivityCount = () => {
    return activeTasks.length;
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col items-end gap-2',
        positionClasses[position],
        className
      )}
    >
      {/* Notification badges */}
      {showBadges && notifications.length > 0 && isExpanded && (
        <div className="flex flex-col gap-2 mb-2 items-end">
          {notifications.map(task => (
            <Badge
              key={task.id}
              variant={task.status === 'completed' ? 'outline' : 'default'}
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                task.status === 'working'
                  ? 'bg-blue-500'
                  : task.status === 'completed'
                    ? 'border-green-500 text-green-500'
                    : 'border-red-500 text-red-500'
              )}
            >
              {task.status === 'working' && <RotateCw className="w-3 h-3 animate-spin" />}
              {task.status === 'completed' && <CheckCircle className="w-3 h-3" />}
              {task.status === 'failed' && <AlertCircle className="w-3 h-3" />}
              <span className="text-xs">
                {task.status === 'working'
                  ? `${task.agentType} working...`
                  : task.status === 'completed'
                    ? `${task.agentType} completed`
                    : `${task.agentType} failed`}
              </span>
            </Badge>
          ))}
        </div>
      )}

      {/* Main indicator button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'rounded-full bg-white shadow-md flex items-center justify-center',
                'border border-gray-200 hover:shadow-lg transition-all',
                getStateClasses(),
                sizeClasses[size]
              )}
              aria-label="AI Activity"
            >
              {activeTasks.length > 0 ? (
                <Activity className="w-5 h-5" />
              ) : (
                <Brain className="w-5 h-5" />
              )}

              {/* Activity count badge */}
              {getActivityCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getActivityCount()}
                </span>
              )}
            </button>
          </TooltipTrigger>

          {showTooltip && (
            <TooltipContent side="left" align="center">
              {activeTasks.length > 0
                ? `AI agents working: ${activeTasks.map(t => t.agentType).join(', ')}`
                : 'AI waiting for tasks'}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Animations for different agent states
const animations = {
  thinking: 'animate-pulse',
  processing: 'animate-spin',
  success: 'animate-bounce',
  error: 'animate-shake',
};

export default AIPulseIndicator;
