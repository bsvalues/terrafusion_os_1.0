/**
 * CollaborationSidebar - Multi-User Collaboration Interface Component
 *
 * Production-ready component for multi-user collaboration with presence tracking,
 * chat interface, activity feed, and typing indicators.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 4
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCollaborationHub, PresenceStatus } from '../../hooks/useCollaborationHub';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// ==================== TYPES ====================

export interface CollaborationSidebarProps {
  sessionId: string;
  currentUser: {
    userId: number;
    userName: string;
    avatar?: string;
    role?: string;
  };
  onUserClick?: (userId: number) => void;
  showChat?: boolean;
  showActivity?: boolean;
  showPresence?: boolean;
  autoJoin?: boolean;
}

// ==================== COMPONENT ====================

export function CollaborationSidebar({
  sessionId,
  currentUser,
  onUserClick,
  showChat = true,
  showActivity = true,
  showPresence = true,
  autoJoin = true,
}: CollaborationSidebarProps) {
  // ==================== HOOKS ====================

  const { state, actions } = useCollaborationHub(true);

  // ==================== STATE ====================

  const [messageInput, setMessageInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'users' | 'chat' | 'activity'>('users');

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== EFFECTS ====================

  // Auto-join session
  useEffect(() => {
    if (autoJoin && sessionId) {
      actions.joinSession(sessionId, currentUser).catch(console.error);

      return () => {
        actions.leaveSession(sessionId).catch(console.error);
      };
    }
  }, [autoJoin, sessionId, currentUser, actions]);

  // Send heartbeat every 30 seconds
  useEffect(() => {
    if (state.connected && state.sessionId) {
      const interval = setInterval(() => {
        actions.sendHeartbeat(state.sessionId!).catch(console.error);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [state.connected, state.sessionId, actions]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [state.chatMessages]);

  // ==================== HANDLERS ====================

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !state.sessionId) return;

    try {
      await actions.sendChatMessage(state.sessionId, messageInput.trim(), 'text');
      setMessageInput('');
      setIsTyping(false);
      await actions.sendTypingIndicator(state.sessionId, false, 'chat');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [messageInput, state.sessionId, actions]);

  const handleMessageInputChange = useCallback(
    async (value: string) => {
      setMessageInput(value);

      if (!state.sessionId) return;

      // Send typing indicator
      if (value.length > 0 && !isTyping) {
        setIsTyping(true);
        await actions.sendTypingIndicator(state.sessionId, true, 'chat');
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        setIsTyping(false);
        if (state.sessionId) {
          await actions.sendTypingIndicator(state.sessionId, false, 'chat');
        }
      }, 2000);
    },
    [isTyping, state.sessionId, actions]
  );

  const handlePresenceChange = useCallback(
    async (status: PresenceStatus) => {
      if (!state.sessionId) return;

      try {
        await actions.updatePresence(state.sessionId, status);
      } catch (error) {
        console.error('Failed to update presence:', error);
      }
    },
    [state.sessionId, actions]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // ==================== RENDER HELPERS ====================

  const renderPresenceBadge = (status?: PresenceStatus) => {
    const colors = {
      [PresenceStatus.Active]: 'bg-green-500',
      [PresenceStatus.Away]: 'bg-yellow-500',
      [PresenceStatus.Busy]: 'bg-red-500',
      [PresenceStatus.Offline]: 'bg-gray-500',
    };

    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${colors[status || PresenceStatus.Offline]}`}
      />
    );
  };

  const getUserInitials = (userName: string) => {
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ==================== RENDER ====================

  if (state.connecting) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Spinner className="mr-2" />
          <span>Connecting...</span>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Alert variant="destructive">
        <span className="font-semibold">Connection Error</span>
        <p>{state.error}</p>
      </Alert>
    );
  }

  return (
    <Card className="collaboration-sidebar h-full flex flex-col">
      {/* Header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Collaboration</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={state.connected ? 'success' : 'secondary'}>
              {state.connected ? '🟢' : '🔴'}
            </Badge>
            <Badge variant="outline">{state.sessionStats.activeUsers} online</Badge>
          </div>
        </div>
      </CardHeader>

      {/* Tabs */}
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">👥 Users</TabsTrigger>
            <TabsTrigger value="chat">💬 Chat</TabsTrigger>
            <TabsTrigger value="activity">📋 Activity</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {state.activeUsers.map((user) => {
                  const presence = state.userPresence.get(user.userId);

                  return (
                    <div
                      key={user.userId}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-accent cursor-pointer"
                      onClick={() => onUserClick?.(user.userId)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getUserInitials(user.userName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{user.userName}</span>
                          {user.userId === currentUser.userId && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        {user.role && (
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        )}
                      </div>
                      {showPresence && renderPresenceBadge(presence?.status)}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Presence Controls */}
            {showPresence && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Your Status:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePresenceChange(PresenceStatus.Active)}
                    >
                      🟢 Active
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePresenceChange(PresenceStatus.Away)}
                    >
                      🟡 Away
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePresenceChange(PresenceStatus.Busy)}
                    >
                      🔴 Busy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePresenceChange(PresenceStatus.Offline)}
                    >
                      ⚫ Offline
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Chat Tab */}
          {showChat && (
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4" ref={chatScrollRef}>
                <div className="space-y-3">
                  {state.chatMessages.map((message) => {
                    const isCurrentUser = message.userId === currentUser.userId;

                    return (
                      <div
                        key={message.messageId}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isCurrentUser
                              ? 'bg-terra-cyan text-white'
                              : 'bg-accent'
                          }`}
                        >
                          {!isCurrentUser && (
                            <p className="text-xs font-semibold mb-1">
                              {message.userName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Typing Indicators */}
              {Array.from(state.typingIndicators.values()).length > 0 && (
                <div className="mb-2 text-xs text-muted-foreground">
                  {Array.from(state.typingIndicators.values())
                    .map((t) => t.userName)
                    .join(', ')}{' '}
                  {state.typingIndicators.size === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  value={messageInput}
                  onChange={(e) => handleMessageInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  Send
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Activity Tab */}
          {showActivity && (
            <TabsContent value="activity" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {state.activities.map((activity) => (
                    <div key={activity.activityId} className="p-2 rounded border text-sm">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.activityType}
                        </Badge>
                        <span className="font-medium">{activity.userName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}

                  {state.activities.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No activity yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* Notifications */}
      {state.notifications.length > 0 && (
        <CardContent className="border-t pt-4">
          <div className="space-y-2">
            {state.notifications.slice(-3).map((notification) => (
              <Alert key={notification.notificationId} variant={notification.type as any}>
                <div>
                  <p className="font-semibold text-sm">{notification.title}</p>
                  <p className="text-xs">{notification.message}</p>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default CollaborationSidebar;
