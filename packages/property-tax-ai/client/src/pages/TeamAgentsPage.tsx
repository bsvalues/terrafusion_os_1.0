import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Code2,
  Cpu,
  MessageSquare,
  Palette,
  TestTube,
  User,
  Check,
  ClipboardList,
  Clock,
  ExternalLink,
  Send,
  X,
  FileText,
  Users,
  PlayCircle,
  Loader2
} from 'lucide-react';

// Message types for WebSocket
enum MessageType {
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  CHAT_MESSAGE = 'chat_message',
  STATUS_UPDATE = 'status_update',
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  COMMENT_ADDED = 'comment_added',
  USER_ACTIVITY = 'user_activity',
  MEETING_REMINDER = 'meeting_reminder',
  ERROR = 'error',
  AUTH_REQUIRED = 'auth_required',
  AUTH_SUCCESS = 'auth_success',
  SESSION_STATE = 'session_state'
}

// Team agent role-specific icons
const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case 'frontend_developer':
      return <Code2 className="h-5 w-5" />;
    case 'backend_developer':
      return <Cpu className="h-5 w-5" />;
    case 'designer':
      return <Palette className="h-5 w-5" />;
    case 'qa_tester':
      return <TestTube className="h-5 w-5" />;
    case 'county_assessor':
      return <ClipboardList className="h-5 w-5" />;
    default:
      return <User className="h-5 w-5" />;
  }
};

// Format user role for display
const formatRole = (role: string) => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  let color = 'bg-gray-500';
  switch (status.toLowerCase()) {
    case 'online':
      color = 'bg-green-500';
      break;
    case 'busy':
      color = 'bg-yellow-500';
      break;
    case 'away':
      color = 'bg-orange-500';
      break;
    case 'offline':
      color = 'bg-gray-500';
      break;
  }
  
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color} mr-2`} />
  );
};

const TeamAgentsPage = () => {
  const [message, setMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [sessionId, setSessionId] = useState('team-onboarding-session');
  const [activeAgentId, setActiveAgentId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState({
    id: 999,
    name: 'System Administrator',
    role: 'admin'
  });
  
  const websocket = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch team agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/team-agents'],
    queryFn: async () => {
      const response = await apiRequest('/api/team-agents');
      return response.data;
    }
  });
  
  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/team-tasks'],
    queryFn: async () => {
      const response = await apiRequest('/api/team-tasks');
      return response.data;
    }
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const response = await apiRequest('/api/team-tasks', {
        method: 'POST',
        data: task
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-tasks'] });
      toast({
        title: 'Task created',
        description: 'The task has been created successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating task',
        description: error.message || 'Failed to create task',
        variant: 'destructive'
      });
    }
  });
  
  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (comment: any) => {
      const response = await apiRequest(`/api/team-tasks/${comment.taskId}/comments`, {
        method: 'POST',
        data: comment
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-tasks'] });
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error adding comment',
        description: error.message || 'Failed to add comment',
        variant: 'destructive'
      });
    }
  });
  
  // WebSocket connection setup
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      const port = window.location.port || (protocol === 'wss:' ? '443' : '80');
      
      // Construct URL with explicit hostname and port to avoid 'undefined' issues
      const wsUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/ws/team-collaboration`;
      
      // Add debug logging to help diagnose connection issues
      console.log(`[TeamAgents WebSocket] Using URL: ${wsUrl}`);
      console.log(`[TeamAgents WebSocket] hostname: ${hostname}`);
      console.log(`[TeamAgents WebSocket] port: ${port}`);
      console.log(`[TeamAgents WebSocket] protocol: ${protocol}`);
      
      if (websocket.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }
      
      try {
        const ws = new WebSocket(wsUrl);
        websocket.current = ws;
        
        ws.onopen = () => {
          console.log('WebSocket connection established');
          setConnectionStatus('Connected');
          setWsConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('Error');
          setWsConnected(false);
          toast({
            title: 'WebSocket Error',
            description: 'Connection to the collaboration server failed.',
            variant: 'destructive'
          });
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          setConnectionStatus('Disconnected');
          setWsConnected(false);
          
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setConnectionStatus('Error');
        setWsConnected(false);
      }
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [toast]);
  
  // Authentication with WebSocket server
  useEffect(() => {
    if (websocket.current?.readyState === WebSocket.OPEN && currentUser) {
      // Wait for AUTH_REQUIRED message before attempting to authenticate
    }
  }, [wsConnected, currentUser]);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case MessageType.AUTH_REQUIRED:
        // Send authentication message
        if (websocket.current?.readyState === WebSocket.OPEN) {
          const authMessage = {
            type: 'authenticate',
            connectionId: message.connectionId,
            sessionId,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role
          };
          
          websocket.current.send(JSON.stringify(authMessage));
        }
        break;
        
      case MessageType.AUTH_SUCCESS:
        toast({
          title: 'Connected',
          description: 'Successfully connected to the collaboration server.'
        });
        break;
        
      case MessageType.SESSION_STATE:
        // Update UI with session state
        if (message.recentMessages) {
          setChatMessages(message.recentMessages);
        }
        break;
        
      case MessageType.CHAT_MESSAGE:
        // Add new message to chat
        setChatMessages(prev => [...prev, message]);
        break;
        
      case MessageType.TASK_ASSIGNED:
      case MessageType.TASK_UPDATED:
      case MessageType.COMMENT_ADDED:
        // Refresh tasks
        queryClient.invalidateQueries({ queryKey: ['/api/team-tasks'] });
        break;
        
      case MessageType.ERROR:
        toast({
          title: 'Error',
          description: message.errorMessage || 'An error occurred',
          variant: 'destructive'
        });
        break;
    }
  };
  
  // Send chat message
  const sendChatMessage = () => {
    if (!message.trim() || !websocket.current || websocket.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const chatMessage = {
      type: MessageType.CHAT_MESSAGE,
      sessionId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    websocket.current.send(JSON.stringify(chatMessage));
    setMessage('');
  };
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Determine if message is from current user
  const isOwnMessage = (senderId: number) => senderId === currentUser.id;
  
  // Create a new task
  const createTask = (assigneeId: number) => {
    createTaskMutation.mutate({
      title: `Task for ${agents.find(a => a.id === assigneeId)?.name || 'Agent'}`,
      description: 'Please work on this task',
      priority: 'medium',
      assignedTo: assigneeId,
      createdBy: currentUser.id,
      status: 'pending',
      tags: ['collaboration']
    });
  };
  
  // Create a sample task pipeline if no tasks exist
  useEffect(() => {
    if (!tasksLoading && tasks.length === 0 && agents.length > 0) {
      // Create initial task pipeline
      setTimeout(() => {
        const backendDevId = agents.find(a => a.role === 'backend_developer')?.id;
        const frontendDevId = agents.find(a => a.role === 'frontend_developer')?.id;
        
        if (backendDevId) {
          createTaskMutation.mutate({
            title: 'Implement WebSocket Authentication',
            description: 'Create secure WebSocket authentication flow',
            priority: 'high',
            assignedTo: backendDevId,
            createdBy: currentUser.id,
            status: 'in_progress',
            tags: ['backend', 'security']
          });
        }
        
        if (frontendDevId) {
          createTaskMutation.mutate({
            title: 'Design Team Collaboration UI',
            description: 'Create UI components for team collaboration',
            priority: 'medium',
            assignedTo: frontendDevId,
            createdBy: currentUser.id,
            status: 'pending',
            tags: ['frontend', 'ui']
          });
        }
      }, 1000);
    }
  }, [tasksLoading, tasks, agents, createTaskMutation, currentUser.id]);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Agent Collaboration</h1>
            <p className="text-muted-foreground">
              Manage and collaborate with AI team agents
            </p>
          </div>
          <Badge 
            variant={wsConnected ? "default" : "destructive"}
            className="h-8 px-3 flex items-center gap-2"
          >
            {wsConnected ? <Check size={14} /> : <X size={14} />}
            {connectionStatus}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Agents List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={18} />
                Team Agents
              </CardTitle>
              <CardDescription>
                Available team members and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div 
                      key={agent.id}
                      className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                        activeAgentId === agent.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setActiveAgentId(agent.id)}
                      role="button"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/20">
                            {getRoleIcon(agent.role)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center">
                            <StatusBadge status={agent.status} /> 
                            {agent.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatRole(agent.role)}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          createTask(agent.id);
                        }}
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Session: {sessionId}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Main Collaboration Area */}
          <Card className="md:col-span-2">
            <Tabs defaultValue="chat">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Team Collaboration</CardTitle>
                  <TabsList>
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Tasks
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Communicate and collaborate with your AI team members
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <TabsContent value="chat" className="mt-0">
                  <div className="flex flex-col h-[500px]">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          chatMessages.map((msg, index) => (
                            <div 
                              key={index} 
                              className={`flex ${isOwnMessage(msg.senderId) ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  isOwnMessage(msg.senderId) 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                {!isOwnMessage(msg.senderId) && (
                                  <div className="font-semibold text-sm mb-1">
                                    {msg.senderName}
                                  </div>
                                )}
                                <div>{msg.content}</div>
                                <div className="text-xs opacity-70 mt-1 text-right">
                                  {formatTimestamp(msg.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Type your message..." 
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              sendChatMessage();
                            }
                          }}
                        />
                        <Button onClick={sendChatMessage} disabled={!wsConnected}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      {!wsConnected && (
                        <div className="text-sm text-destructive mt-2">
                          Not connected to server. Attempting to reconnect...
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="tasks" className="mt-0">
                  <div className="h-[500px]">
                    <ScrollArea className="h-full">
                      {tasksLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : tasks.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <ClipboardList className="mx-auto h-12 w-12 opacity-20 mb-2" />
                          <p>No tasks yet. Create a task for a team member.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tasks.map((task) => (
                            <Card key={task.id} className="overflow-hidden">
                              <div className={`px-6 py-2 text-sm font-medium ${
                                task.priority === 'high' 
                                  ? 'bg-red-500 text-white' 
                                  : task.priority === 'medium'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-blue-500 text-white'
                              }`}>
                                {task.priority.toUpperCase()} PRIORITY
                              </div>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between">
                                  <CardTitle>{task.title}</CardTitle>
                                  <Badge variant={
                                    task.status === 'completed' 
                                      ? 'default' 
                                      : task.status === 'in_progress' 
                                        ? 'secondary' 
                                        : 'outline'
                                  }>
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <CardDescription className="flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Assigned to: {
                                      agents.find(a => a.id === task.assignedTo)?.name || 'Unassigned'
                                    }
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(task.createdAt).toLocaleDateString()}
                                  </span>
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm">{task.description}</p>
                                
                                {task.comments && task.comments.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="text-sm font-semibold mb-2">Comments</h4>
                                    <div className="space-y-2">
                                      {task.comments.map((comment, i) => (
                                        <div key={i} className="bg-muted p-2 rounded-md text-sm">
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                            <span className="font-medium">
                                              {agents.find(a => a.id === comment.userId)?.name || 'Unknown'}
                                            </span>
                                            <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                          </div>
                                          <p>{comment.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                              <CardFooter className="flex justify-between">
                                <div className="flex flex-wrap gap-1">
                                  {task.tags.map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    // Add a comment to the task
                                    createCommentMutation.mutate({
                                      taskId: task.id,
                                      userId: currentUser.id,
                                      content: 'Great work on this task!'
                                    });
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" /> Comment
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamAgentsPage;