/**
 * Agent Message Log Component
 * 
 * Displays real-time agent messages and activities in a scrollable log format.
 * Captures and formats various message types from the agent WebSocket system.
 */

import { useAgentWebSocket } from '@/hooks/use-agent-websocket';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  AlertCircle, 
  MessageSquare, 
  Clock, 
  Info, 
  AlertTriangle, 
  Activity,
  Trash2, 
  Zap,
  Download 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Types of agent messages we want to display
export enum AgentLogType {
  MESSAGE = 'message',
  ACTIVITY = 'activity',
  NOTIFICATION = 'notification',
  COORDINATION = 'coordination',
  ERROR = 'error'
}

// Represents an entry in the agent message log
interface AgentLogEntry {
  id: string;
  type: AgentLogType;
  timestamp: Date;
  content: any;
  sender?: string;
  recipient?: string;
  priority?: string;
  level?: 'info' | 'warning' | 'error';
  expanded?: boolean;
}

interface AgentMessageLogProps {
  maxMessages?: number;
  className?: string;
  showControls?: boolean;
  height?: string;
}

export function AgentMessageLog({
  maxMessages = 100,
  className = '',
  showControls = true,
  height = 'h-96'
}: AgentMessageLogProps) {
  const [messages, setMessages] = useState<AgentLogEntry[]>([]);
  const [filter, setFilter] = useState<AgentLogType | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const websocketService = useAgentWebSocket({ autoConnect: true });
  const { connectionStatus, on } = websocketService;

  // Add a message to the log
  const addMessage = (entry: AgentLogEntry) => {
    setMessages(prev => {
      const newMessages = [...prev, entry];
      // Limit number of messages to improve performance
      if (newMessages.length > maxMessages) {
        return newMessages.slice(newMessages.length - maxMessages);
      }
      return newMessages;
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Register WebSocket message handlers
  useEffect(() => {
    // Each handler converts incoming messages to our AgentLogEntry format
    const handlers = [
      on('agent_message', (data) => {
        addMessage({
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: AgentLogType.MESSAGE,
          timestamp: new Date(),
          content: data.message,
          sender: data.message.senderId,
          recipient: data.message.recipientId,
          priority: data.message.priority
        });
      }),
      
      on('agent_activity', (data) => {
        addMessage({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: AgentLogType.ACTIVITY,
          timestamp: new Date(),
          content: data.message,
          sender: data.message.senderId
        });
      }),
      
      on('agent_coordination', (data) => {
        addMessage({
          id: `coord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: AgentLogType.COORDINATION,
          timestamp: new Date(),
          content: data.message,
          sender: data.message.senderId,
          recipient: data.message.recipientId
        });
      }),
      
      on('notification', (data) => {
        addMessage({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: AgentLogType.NOTIFICATION,
          timestamp: new Date(),
          content: data,
          level: data.level || 'info'
        });
      }),
      
      on('error', (data) => {
        addMessage({
          id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: AgentLogType.ERROR,
          timestamp: new Date(),
          content: data,
          level: 'error'
        });
      })
    ];

    // Add an initial message when connecting
    if (connectionStatus === 'connected') {
      addMessage({
        id: `system_${Date.now()}`,
        type: AgentLogType.NOTIFICATION,
        timestamp: new Date(),
        content: { message: 'Connected to agent system' },
        level: 'info'
      });
    }

    // Clean up event handlers on unmount
    return () => {
      handlers.forEach(unsubscribe => unsubscribe());
    };
  }, [connectionStatus, on, maxMessages]);

  const clearMessages = () => {
    setMessages([]);
  };

  const exportMessages = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      messages: messages.map(message => ({
        ...message,
        timestamp: message.timestamp.toISOString()
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-messages-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredMessages = filter 
    ? messages.filter(message => message.type === filter)
    : messages;

  const getMessageIcon = (type: AgentLogType) => {
    switch (type) {
      case AgentLogType.MESSAGE:
        return <MessageSquare className="h-4 w-4" />;
      case AgentLogType.ACTIVITY:
        return <Activity className="h-4 w-4" />;
      case AgentLogType.NOTIFICATION:
        return <Info className="h-4 w-4" />;
      case AgentLogType.COORDINATION:
        return <Zap className="h-4 w-4" />;
      case AgentLogType.ERROR:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getMessageColor = (type: AgentLogType, level?: string) => {
    if (type === AgentLogType.ERROR || level === 'error') {
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
    if (level === 'warning') {
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
    
    switch (type) {
      case AgentLogType.MESSAGE:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case AgentLogType.ACTIVITY:
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case AgentLogType.NOTIFICATION:
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case AgentLogType.COORDINATION:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const toggleExpand = (id: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, expanded: !msg.expanded } : msg
      )
    );
  };

  return (
    <div className={`border rounded-md ${className}`}>
      {showControls && (
        <div className="border-b p-2 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === null ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setFilter(null)}
            >
              All
            </Button>
            <Button
              variant={filter === AgentLogType.MESSAGE ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setFilter(AgentLogType.MESSAGE)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Messages
            </Button>
            <Button
              variant={filter === AgentLogType.ACTIVITY ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setFilter(AgentLogType.ACTIVITY)}
            >
              <Activity className="h-3 w-3 mr-1" />
              Activities
            </Button>
            <Button
              variant={filter === AgentLogType.COORDINATION ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setFilter(AgentLogType.COORDINATION)}
            >
              <Zap className="h-3 w-3 mr-1" />
              Coordination
            </Button>
            <Button
              variant={filter === AgentLogType.ERROR ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setFilter(AgentLogType.ERROR)}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Errors
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              <Clock className="h-3 w-3 mr-1" />
              {autoScroll ? 'Disable' : 'Enable'} Auto-scroll
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={clearMessages}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={exportMessages}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      )}
      
      <ScrollArea className={`${height} px-4`} ref={scrollRef}>
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Info className="h-8 w-8 mb-2 opacity-50" />
            <p>No agent messages yet</p>
            <p className="text-xs">
              {connectionStatus === 'connected' 
                ? 'Waiting for activity...' 
                : 'Connect to the agent system to see messages'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            {filteredMessages.map((message) => (
              <Collapsible
                key={message.id}
                open={message.expanded}
                className={`border rounded p-2 ${getMessageColor(message.type, message.level)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getMessageIcon(message.type)}
                    <div>
                      <div className="font-medium text-sm">
                        {message.type === AgentLogType.MESSAGE && 'Agent Message'}
                        {message.type === AgentLogType.ACTIVITY && 'Agent Activity'}
                        {message.type === AgentLogType.NOTIFICATION && 
                          (message.level === 'error' ? 'Error' :
                           message.level === 'warning' ? 'Warning' : 'Notification')}
                        {message.type === AgentLogType.COORDINATION && 'Coordination'}
                        {message.type === AgentLogType.ERROR && 'Error'}
                      </div>
                      <div className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {message.sender && (
                      <Badge variant="outline" className="text-xs">
                        From: {message.sender}
                      </Badge>
                    )}
                    {message.recipient && (
                      <Badge variant="outline" className="text-xs">
                        To: {message.recipient}
                      </Badge>
                    )}
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(message.id)}>
                        {message.expanded ? '−' : '+'}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                
                <CollapsibleContent>
                  <div className="border-t mt-2 pt-2">
                    {message.type === AgentLogType.NOTIFICATION && (
                      <div className="text-sm">
                        {message.content.title && <p className="font-bold">{message.content.title}</p>}
                        <p>{message.content.message}</p>
                      </div>
                    )}
                    {message.type === AgentLogType.ERROR && (
                      <div className="text-sm">
                        <p className="font-bold">{message.content.code || 'Error'}</p>
                        <p>{message.content.message}</p>
                      </div>
                    )}
                    {(message.type === AgentLogType.MESSAGE || 
                      message.type === AgentLogType.ACTIVITY || 
                      message.type === AgentLogType.COORDINATION) && (
                      <pre className="text-xs bg-black/10 p-2 rounded overflow-auto">
                        {JSON.stringify(message.content, null, 2)}
                      </pre>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}