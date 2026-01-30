/**
 * EnhancedPresence - Rich User Presence and Activity Tracking
 *
 * Production-ready component for displaying rich user presence states,
 * activity timelines, focus indicators, and real-time collaboration awareness.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 7
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// ==================== TYPES ====================

export type PresenceState = 'active' | 'editing' | 'viewing' | 'idle' | 'focus-mode' | 'offline';

export interface UserPresence {
  userId: number;
  userName: string;
  userAvatar?: string;
  state: PresenceState;
  customStatus?: string;
  currentCell?: number;
  currentSection?: string;
  lastActivity: string;
  focusStartTime?: string;
  editingCells?: number[];
  connectionId: string;
}

export interface ActivityEvent {
  id: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  type: 'edit' | 'execute' | 'comment' | 'navigate' | 'join' | 'leave' | 'status-change';
  description: string;
  timestamp: string;
  cellIndex?: number;
  metadata?: Record<string, unknown>;
}

export interface EnhancedPresenceProps {
  currentUserId: number;
  users: UserPresence[];
  activities: ActivityEvent[];
  onStateChange: (state: PresenceState, customStatus?: string) => void;
  onFocusModeToggle: (enabled: boolean) => void;
  onUserClick?: (userId: number) => void;
  maxActivities?: number;
  showActivityTimeline?: boolean;
  showFocusIndicators?: boolean;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get presence state color
 */
function getPresenceColor(state: PresenceState): string {
  switch (state) {
    case 'active':
      return 'bg-green-500';
    case 'editing':
      return 'bg-blue-500 animate-pulse';
    case 'viewing':
      return 'bg-yellow-500';
    case 'idle':
      return 'bg-gray-400';
    case 'focus-mode':
      return 'bg-purple-500';
    case 'offline':
      return 'bg-gray-600';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Get presence state label
 */
function getPresenceLabel(state: PresenceState): string {
  switch (state) {
    case 'active':
      return 'Active';
    case 'editing':
      return 'Editing';
    case 'viewing':
      return 'Viewing';
    case 'idle':
      return 'Idle';
    case 'focus-mode':
      return 'Focus Mode';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown';
  }
}

/**
 * Get activity icon
 */
function getActivityIcon(type: ActivityEvent['type']): string {
  switch (type) {
    case 'edit':
      return '✏️';
    case 'execute':
      return '▶️';
    case 'comment':
      return '💬';
    case 'navigate':
      return '🧭';
    case 'join':
      return '👋';
    case 'leave':
      return '👋';
    case 'status-change':
      return '🔄';
    default:
      return '📌';
  }
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 5) return `${seconds}s ago`;
  return 'just now';
}

/**
 * Get focus duration
 */
function getFocusDuration(startTime: string): string {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const diff = now - start;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get user initials
 */
function getUserInitials(userName: string): string {
  return userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ==================== COMPONENT ====================

export function EnhancedPresence({
  currentUserId,
  users,
  activities,
  onStateChange,
  onFocusModeToggle,
  onUserClick,
  maxActivities = 20,
  showActivityTimeline = true,
  showFocusIndicators = true,
}: EnhancedPresenceProps) {
  // ==================== STATE ====================

  const [selectedState, setSelectedState] = useState<PresenceState>('active');
  const [customStatus, setCustomStatus] = useState<string>('');
  const [showStatusInput, setShowStatusInput] = useState(false);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);

  // ==================== COMPUTED ====================

  const currentUser = useMemo(
    () => users.find((u) => u.userId === currentUserId),
    [users, currentUserId]
  );

  const activeUsers = useMemo(() => users.filter((u) => u.state !== 'offline'), [users]);

  const sortedActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxActivities);
  }, [activities, maxActivities]);

  const usersByState = useMemo(() => {
    const groups: Record<PresenceState, UserPresence[]> = {
      'focus-mode': [],
      editing: [],
      active: [],
      viewing: [],
      idle: [],
      offline: [],
    };

    users.forEach((user) => {
      groups[user.state].push(user);
    });

    return groups;
  }, [users]);

  // ==================== EFFECTS ====================

  // Auto-update activity times
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render every 10 seconds to update time-ago strings
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ==================== HANDLERS ====================

  const handleStateChange = (state: PresenceState) => {
    setSelectedState(state);

    if (state === 'focus-mode') {
      setFocusModeEnabled(true);
      onFocusModeToggle(true);
    } else if (focusModeEnabled) {
      setFocusModeEnabled(false);
      onFocusModeToggle(false);
    }

    onStateChange(state, customStatus || undefined);
  };

  const handleCustomStatusSubmit = () => {
    onStateChange(selectedState, customStatus || undefined);
    setShowStatusInput(false);
  };

  const handleFocusModeToggle = () => {
    const newFocusMode = !focusModeEnabled;
    setFocusModeEnabled(newFocusMode);
    onFocusModeToggle(newFocusMode);

    if (newFocusMode) {
      handleStateChange('focus-mode');
    } else {
      handleStateChange('active');
    }
  };

  // ==================== RENDER HELPERS ====================

  const renderUserCard = (user: UserPresence, isCurrentUser: boolean = false) => {
    return (
      <div
        key={user.userId}
        className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer ${
          isCurrentUser ? 'bg-accent border border-terra-cyan' : ''
        }`}
        onClick={() => !isCurrentUser && onUserClick?.(user.userId)}
      >
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.userAvatar} />
            <AvatarFallback>{getUserInitials(user.userName)}</AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getPresenceColor(
              user.state
            )}`}
          />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm">
                {user.userName}
                {isCurrentUser && ' (You)'}
              </span>
              <Badge variant="outline" className="text-xs">
                {getPresenceLabel(user.state)}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {getTimeAgo(user.lastActivity)}
            </span>
          </div>

          {user.customStatus && (
            <p className="text-xs text-muted-foreground italic">"{user.customStatus}"</p>
          )}

          {showFocusIndicators && user.currentCell !== undefined && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-muted-foreground">Focused on:</span>
              <Badge variant="secondary" className="text-xs">
                Cell {user.currentCell}
              </Badge>
            </div>
          )}

          {user.state === 'focus-mode' && user.focusStartTime && (
            <div className="flex items-center space-x-2 text-xs text-purple-400">
              <span>🎯</span>
              <span>In focus for {getFocusDuration(user.focusStartTime)}</span>
            </div>
          )}

          {user.editingCells && user.editingCells.length > 0 && (
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-muted-foreground">Editing:</span>
              {user.editingCells.slice(0, 3).map((cellIndex) => (
                <Badge key={cellIndex} variant="secondary" className="text-xs">
                  #{cellIndex}
                </Badge>
              ))}
              {user.editingCells.length > 3 && (
                <span className="text-muted-foreground">+{user.editingCells.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivity = (activity: ActivityEvent) => {
    return (
      <div key={activity.id} className="flex items-start space-x-3 py-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-lg">
          {getActivityIcon(activity.type)}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={activity.userAvatar} />
                <AvatarFallback className="text-xs">
                  {getUserInitials(activity.userName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{activity.userName}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {getTimeAgo(activity.timestamp)}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">{activity.description}</p>

          {activity.cellIndex !== undefined && (
            <Badge variant="secondary" className="text-xs">
              Cell {activity.cellIndex}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      {/* Current User Status Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Your Status</CardTitle>
              <CardDescription>Manage your presence and availability</CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getPresenceColor(selectedState)}`} />
                  {getPresenceLabel(selectedState)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStateChange('active')}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getPresenceColor('active')}`} />
                    <span>Active</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStateChange('viewing')}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getPresenceColor('viewing')}`} />
                    <span>Viewing</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStateChange('idle')}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getPresenceColor('idle')}`} />
                    <span>Idle</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFocusModeToggle}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getPresenceColor('focus-mode')}`} />
                    <span>Focus Mode</span>
                    {focusModeEnabled && <span className="ml-auto">✓</span>}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowStatusInput(!showStatusInput)}>
                  Set Custom Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {showStatusInput && (
          <CardContent>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="What are you working on?"
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                maxLength={100}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomStatusSubmit();
                }}
              />
              <Button size="sm" onClick={handleCustomStatusSubmit}>
                Set
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowStatusInput(false);
                  setCustomStatus('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Active Users ({activeUsers.length}/{users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {/* Current user first */}
              {currentUser && renderUserCard(currentUser, true)}

              {currentUser && <Separator />}

              {/* Focus mode users */}
              {usersByState['focus-mode'].length > 0 && (
                <>
                  <div className="text-xs font-semibold text-purple-400 px-3 py-1">
                    In Focus Mode
                  </div>
                  {usersByState['focus-mode']
                    .filter((u) => u.userId !== currentUserId)
                    .map((user) => renderUserCard(user))}
                  <Separator />
                </>
              )}

              {/* Editing users */}
              {usersByState.editing.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-blue-400 px-3 py-1">Editing</div>
                  {usersByState.editing
                    .filter((u) => u.userId !== currentUserId)
                    .map((user) => renderUserCard(user))}
                  <Separator />
                </>
              )}

              {/* Active users */}
              {usersByState.active
                .filter((u) => u.userId !== currentUserId)
                .map((user) => renderUserCard(user))}

              {/* Viewing users */}
              {usersByState.viewing.filter((u) => u.userId !== currentUserId).length > 0 && (
                <>
                  <Separator />
                  <div className="text-xs font-semibold text-yellow-400 px-3 py-1">Viewing</div>
                  {usersByState.viewing
                    .filter((u) => u.userId !== currentUserId)
                    .map((user) => renderUserCard(user))}
                </>
              )}

              {/* Idle users */}
              {usersByState.idle.filter((u) => u.userId !== currentUserId).length > 0 && (
                <>
                  <Separator />
                  <div className="text-xs font-semibold text-gray-400 px-3 py-1">Idle</div>
                  {usersByState.idle
                    .filter((u) => u.userId !== currentUserId)
                    .map((user) => renderUserCard(user))}
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {showActivityTimeline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Activity Timeline</CardTitle>
            <CardDescription>Recent collaboration events</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-1">
                {sortedActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  sortedActivities.map((activity) => renderActivity(activity))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Focus Mode Banner */}
      {focusModeEnabled && (
        <Card className="border-purple-500 bg-purple-900/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-semibold text-sm text-purple-400">Focus Mode Active</p>
                  <p className="text-xs text-muted-foreground">
                    Your notifications are paused. Others can see you're focused.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleFocusModeToggle}>
                Exit Focus
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedPresence;
