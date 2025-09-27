import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Progress} from '@/components/ui/progress';
import {Separator} from '@/components/ui/separator';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {WifiIcon,
  WifiOffIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  RefreshCwIcon,
  SendIcon,
  MessageCircleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  UserIcon,
  UsersIcon,
  ServerIcon,
  DatabaseIcon,
  ActivityIcon,
  ZapIcon,
  MonitorIcon,
  TimerIcon,
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  SettingsIcon,
  FilterIcon,
  SortAscIcon,
  DownloadIcon,
  UploadIcon,
  ExternalLinkIcon,
  CopyIcon,
  TrashIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UnlockIcon,
  BellIcon,
  BellOffIcon,
  VolumeXIcon,
  Volume2Icon,
  NetworkIcon,
  SignalIcon,
  CloudIcon,
  ShieldIcon,
  KeyIcon,
  HashIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  GlobeIcon,
  LayersIcon,
  SearchIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  PlusIcon,
  MinusIcon,
  RotateCcwIcon,
  RotateCwIcon,
  MaximizeIcon,
  MinimizeIcon,
  LinkIcon,
  UnlinkIcon,} from 'lucide-react';

interface WebSocketMessage {id: string;
  type: 'system' | 'user' | 'data' | 'error' | 'ping' | 'pong' | 'heartbeat' | 'notification';
  timestamp: Date;
  sender?: string;
  content: any;
  size: number;
  encoding?: 'text' | 'binary' | 'json';
  compressed?: boolean;
  metadata?: Record<string, any>;
  acknowledged?: boolean;
  retryCount?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';}

interface ConnectionMetrics {connectTime?: Date;
  disconnectTime?: Date;
  totalConnections: number;
  failedConnections: number;
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  bytesTransferred: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  connectionUptime: number;
  lastPingTime?: Date;
  pingLatencies: number[];
  errorCount: number;
  reconnectAttempts: number;
  protocolVersion?: string;
  compressionEnabled: boolean;
  heartbeatInterval: number;
  bufferSize: number;
  maxMessageSize: number;}

interface WebSocketConfig {url: string;
  protocols?: string[];
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  pingInterval: number;
  heartbeatEnabled: boolean;
  compressionEnabled: boolean;
  bufferMessages: boolean;
  maxBufferSize: number;
  messageRetryEnabled: boolean;
  maxRetryAttempts: number;
  authentication?: {
    type: 'token' | 'basic' | 'custom';
    credentials: Record<string, string>;};
  headers?: Record<string, string>;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface WebSocketDemoProps {defaultUrl?: string;
  enableAdvancedFeatures?: boolean;
  showMetrics?: boolean;
  showLogs?: boolean;
  autoConnect?: boolean;
  className?: string;}

const WebSocketDemo: React.FC<WebSocketDemoProps> = ({defaultUrl = 'ws://localhost:\${{TF_ADMIN_PORT:-8080}}',
  enableAdvancedFeatures = true,
  showMetrics = true,
  showLogs = true,
  autoConnect = false,
  className = '',}) => {
  const [connectionState, setConnectionState] = useState<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  >('disconnected');
  const [config, setConfig] = useState<WebSocketConfig>({
    url: defaultUrl,
    protocols: [],
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    pingInterval: 30000,
    heartbeatEnabled: true,
    compressionEnabled: false,
    bufferMessages: true,
    maxBufferSize: 1000,
    messageRetryEnabled: true,
    maxRetryAttempts: 3,
    headers: {},
    enableLogging: true,
    logLevel: 'info',
  });
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [metrics, setMetrics] = useState<ConnectionMetrics>({totalConnections: 0,
    failedConnections: 0,
    totalMessages: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesTransferred: 0,
    averageLatency: 0,
    maxLatency: 0,
    minLatency: 0,
    connectionUptime: 0,
    pingLatencies: [],
    errorCount: 0,
    reconnectAttempts: 0,
    compressionEnabled: false,
    heartbeatInterval: 30000,
    bufferSize: 0,
    maxMessageSize: 64 * 1024,});
  const [messageInput, setMessageInput] = useState('');
  const [messageType, setMessageType] = useState<WebSocketMessage['type']>('user');
  const [messageBuffer, setMessageBuffer] = useState<WebSocketMessage[]>([]);
  const [activeTab, setActiveTab] = useState('connection');
  const [filterType, setFilterType] = useState<WebSocketMessage['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showMetadata, setShowMetadata] = useState(false);
  const [compressionStats, setCompressionStats] = useState({originalSize: 0,
    compressedSize: 0,
    ratio: 0,});
  const [connectionHistory, setConnectionHistory] = useState<
    Array<{timestamp: Date;
      event: 'connect' | 'disconnect' | 'error' | 'reconnect';
      details: string;}>
  >([]);
  const [performanceData, setPerformanceData] = useState<
    Array<{timestamp: Date;
      latency: number;
      throughput: number;
      messageCount: number;}>
  >([]);

  const websocketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectCount = useRef(0);
  const messageQueue = useRef<WebSocketMessage[]>([]);
  const startTime = useRef<Date>();

  // Sample WebSocket servers for testing
  const sampleServers = [
    'ws://localhost:\${{TF_ADMIN_PORT:-8080}}',
    'wss://echo.websocket.org',
    'wss://ws.postman-echo.com/raw',
    'ws://localhost:\${{TF_ADMIN_PORT:-8080}}/websocket',
    'wss://socketsbay.com/wss/v2/1/demo/',
    'wss://stream.binance.com:9443/ws/btcusdt@ticker',
  ];

  // Initialize auto-connect
  useEffect(() => {if (autoConnect && connectionState === 'disconnected') {
      handleConnect();}
  }, [autoConnect]);

  // Auto-scroll messages
  useEffect(() => {if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth'});
    }
  }, [messages, autoScroll]);

  // Performance monitoring
  useEffect(() => {metricsIntervalRef.current = setInterval(() => {
      if (connectionState === 'connected' && startTime.current) {
        const now = new Date();
        const uptime = now.getTime() - startTime.current.getTime();

        setMetrics(prev => ({
          ...prev,
          connectionUptime: uptime,}));

        // Add performance data point
        setPerformanceData(prev => {const newPoint = {
            timestamp: now,
            latency: prev.averageLatency,
            throughput: prev.totalMessages,
            messageCount: prev.totalMessages,};

          // Keep last 100 points
          const updated = [...prev, newPoint].slice(-100);
          return updated;
        });
      }
    }, 1000);

    return () => {if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);}
    };
  }, [connectionState]);

  // Message handling
  const addMessage = useCallback((message: Partial<WebSocketMessage>) =>{
    const newMessage: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      size: JSON.stringify(message.content).length,
      acknowledged: false,
      retryCount: 0,
      priority: 'normal',
      ...message,
    } as WebSocketMessage;

    setMessages(prev => {const updated = [...prev, newMessage];
      // Keep last 1000 messages to prevent memory issues
      return updated.slice(-1000);});

    // Update metrics
    setMetrics(prev => ({...prev,
      totalMessages: prev.totalMessages + 1,
      bytesTransferred: prev.bytesTransferred + newMessage.size,}));

    return newMessage;
  }, []);

  // WebSocket connection handling
  const handleConnect = useCallback(() => {if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return;}

    setConnectionState('connecting');
    startTime.current = new Date();

    try {const protocols = config.protocols?.length ? config.protocols : undefined;
      websocketRef.current = new WebSocket(config.url, protocols);

      // Connection opened
      websocketRef.current.onopen = event => {
        setConnectionState('connected');
        reconnectCount.current = 0;

        setMetrics(prev => ({
          ...prev,
          connectTime: new Date(),
          totalConnections: prev.totalConnections + 1,}));

        setConnectionHistory(prev => [
          ...prev,
          {
            timestamp: new Date(),
            event: 'connect',
            details: `Connected to ${config.url}`,
          },
        ]);

        addMessage({
          type: 'system',
          content: `Connected to ${config.url}`,
          sender: 'system',
        });

        // Start ping/heartbeat if enabled
        if (config.heartbeatEnabled && config.pingInterval > 0) {pingIntervalRef.current = setInterval(() => {
            if (websocketRef.current?.readyState === WebSocket.OPEN) {
              const pingTime = Date.now();
              websocketRef.current.send(
                JSON.stringify({
                  type: 'ping',
                  timestamp: pingTime,})
              );

              setMetrics(prev => ({...prev,
                lastPingTime: new Date(pingTime),}));
            }
          }, config.pingInterval);
        }

        // Process message buffer
        if (messageQueue.current.length > 0) {messageQueue.current.forEach(msg => {
            if (websocketRef.current?.readyState === WebSocket.OPEN) {
              websocketRef.current.send(JSON.stringify(msg));}
          });
          messageQueue.current = [];
        }
      };

      // Message received
      websocketRef.current.onmessage = event => {const receiveTime = Date.now();
        let messageData;

        try {
          messageData = JSON.parse(event.data);} catch (e) {messageData = { content: event.data, type: 'data'};
        }

        // Handle ping/pong for latency measurement
        if (messageData.type === 'pong' && messageData.originalTimestamp) {const latency = receiveTime - messageData.originalTimestamp;
          setMetrics(prev => {
            const newLatencies = [...prev.pingLatencies, latency].slice(-10);
            const avgLatency = newLatencies.reduce((a, b) => a + b, 0) / newLatencies.length;

            return {
              ...prev,
              pingLatencies: newLatencies,
              averageLatency: avgLatency,
              maxLatency: Math.max(prev.maxLatency, latency),
              minLatency: prev.minLatency === 0 ? latency : Math.min(prev.minLatency, latency),
              messagesReceived: prev.messagesReceived + 1,};
          });
          return;
        }

        // Add received message
        addMessage({
          type: messageData.type || 'data',
          content: messageData.content || messageData,
          sender: messageData.sender || 'remote',
          encoding: typeof event.data === 'string' ? 'text' : 'binary',
          metadata: messageData.metadata || {},
        });

        setMetrics(prev => ({...prev,
          messagesReceived: prev.messagesReceived + 1,}));
      };

      // Connection error
      websocketRef.current.onerror = event => {setConnectionState('error');

        setMetrics(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          failedConnections: prev.failedConnections + 1,}));

        setConnectionHistory(prev => [
          ...prev,
          {
            timestamp: new Date(),
            event: 'error',
            details: `Connection error: ${event.type}`,
          },
        ]);

        addMessage({
          type: 'error',
          content: `Connection error: ${event.type}`,
          sender: 'system',
        });
      };

      // Connection closed
      websocketRef.current.onclose = event => {setConnectionState('disconnected');

        setMetrics(prev => ({
          ...prev,
          disconnectTime: new Date(),}));

        setConnectionHistory(prev => [
          ...prev,
          {
            timestamp: new Date(),
            event: 'disconnect',
            details: `Disconnected: ${event.code} - ${event.reason || 'No reason provided'}`,
          },
        ]);

        addMessage({
          type: 'system',
          content: `Disconnected: ${event.code} - ${event.reason || 'Connection closed'}`,
          sender: 'system',
        });

        // Clear intervals
        if (pingIntervalRef.current) {clearInterval(pingIntervalRef.current);}

        // Auto-reconnect if enabled
        if (
          config.autoReconnect &&
          !event.wasClean &&
          reconnectCount.current< config.maxReconnectAttempts
        ) {setConnectionState('reconnecting');
          reconnectCount.current++;

          setMetrics(prev =>({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1,}));

          reconnectTimeoutRef.current = setTimeout(() => {handleConnect();}, config.reconnectInterval);

          addMessage({
            type: 'system',
            content: `Attempting to reconnect... (${reconnectCount.current}/${config.maxReconnectAttempts})`,
            sender: 'system',
          });
        }
      };
    } catch (error) {
      setConnectionState('error');
      addMessage({
        type: 'error',
        content: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'system',
      });
    }
  }, [config, addMessage]);

  // Disconnect handler
  const handleDisconnect = useCallback(() => {if (websocketRef.current) {
      websocketRef.current.close(1000, 'User initiated disconnect');}

    if (reconnectTimeoutRef.current) {clearTimeout(reconnectTimeoutRef.current);}

    reconnectCount.current = 0;
    setConnectionState('disconnected');
  }, []);

  // Send message handler
  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim()) return;

    const message: WebSocketMessage = {
      id: `msg-${Date.now()}`,
      type: messageType,
      timestamp: new Date(),
      content: messageInput,
      sender: 'local',
      size: messageInput.length,
      acknowledged: false,
      retryCount: 0,
      priority: 'normal',
    };

    if (websocketRef.current?.readyState === WebSocket.OPEN) {try {
        websocketRef.current.send(
          JSON.stringify({
            type: message.type,
            content: message.content,
            timestamp: message.timestamp.getTime(),
            id: message.id,})
        );

        setMetrics(prev => ({...prev,
          messagesSent: prev.messagesSent + 1,}));

        message.acknowledged = true;
      } catch (error) {
        message.acknowledged = false;
        addMessage({
          type: 'error',
          content: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
          sender: 'system',
        });
      }
    } else if (config.bufferMessages) {// Buffer message for when connection is restored
      messageQueue.current.push(message);
      addMessage({
        type: 'system',
        content: 'Message buffered - will send when connected',
        sender: 'system',});
    }

    addMessage(message);
    setMessageInput('');
  }, [messageInput, messageType, config.bufferMessages, addMessage]);

  // Clear messages
  const handleClearMessages = useCallback(() => {setMessages([]);
    setMetrics(prev => ({
      ...prev,
      totalMessages: 0,
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,}));
  }, []);

  // Export data
  const handleExportData = useCallback(() => {const exportData = {
      config,
      messages,
      metrics,
      connectionHistory,
      performanceData,
      timestamp: new Date(),};

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-demo-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [config, messages, metrics, connectionHistory, performanceData]);

  // Filter messages
  const filteredMessages = useMemo(() => {let filtered = messages;

    if (filterType !== 'all') {
      filtered = filtered.filter(msg => msg.type === filterType);}

    if (searchQuery) {const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        msg =>
          msg.content?.toString().toLowerCase().includes(query) ||
          msg.sender?.toLowerCase().includes(query) ||
          msg.type.toLowerCase().includes(query)
      );}

    return filtered;
  }, [messages, filterType, searchQuery]);

  // Get connection status display
  const getConnectionStatus = () => {switch (connectionState) {
      case 'connected':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bg: 'bg-green-100',
          text: 'Connected',};
      case 'connecting':
        return {icon: RefreshCwIcon,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          text: 'Connecting...',};
      case 'reconnecting':
        return {icon: RefreshCwIcon,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          text: 'Reconnecting...',};
      case 'error':
        return {icon: AlertCircleIcon, color: 'text-red-600', bg: 'bg-red-100', text: 'Error'};
      default:
        return {icon: WifiOffIcon,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          text: 'Disconnected',};
    }
  };

  // Get message type display
  const getMessageTypeDisplay = (type: WebSocketMessage['type']) => {switch (type) {
      case 'system':
        return { icon: InfoIcon, color: 'text-blue-600', bg: 'bg-blue-50'};
      case 'user':
        return {icon: UserIcon, color: 'text-green-600', bg: 'bg-green-50'};
      case 'data':
        return {icon: DatabaseIcon, color: 'text-purple-600', bg: 'bg-purple-50'};
      case 'error':
        return {icon: AlertCircleIcon, color: 'text-red-600', bg: 'bg-red-50'};
      case 'ping':
      case 'pong':
      case 'heartbeat':
        return {icon: ActivityIcon, color: 'text-orange-600', bg: 'bg-orange-50'};
      case 'notification':
        return {icon: BellIcon, color: 'text-indigo-600', bg: 'bg-indigo-50'};
      default:
        return {icon: MessageCircleIcon, color: 'text-gray-600', bg: 'bg-gray-50'};
    }
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (<div className={`h-full flex flex-col ${className}`}><Card className="flex-1 flex flex-col"><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><NetworkIcon className="h-5 w-5" />WebSocket Demo<Badge
                variant="outline"
                className={`${connectionStatus.bg} ${connectionStatus.color} border-current`}
              ><StatusIcon className="h-3 w-3 mr-1" />{connectionStatus.text}</Badge></CardTitle><div className="flex items-center gap-2"><Button
                size="sm"
                variant="outline"
                onClick={connectionState === 'connected' ? handleDisconnect : handleConnect}
                disabled={connectionState === 'connecting' || connectionState === 'reconnecting'}
              >{connectionState === 'connected' ? (<div className="flex items-center gap-1"><StopIcon className="h-3 w-3" />Disconnect</div>) : (<div className="flex items-center gap-1"><PlayIcon className="h-3 w-3" />Connect</div>)}</Button><Button size="sm" variant="outline" onClick={handleClearMessages}><TrashIcon className="h-3 w-3 mr-1" />Clear</Button><Button size="sm" variant="outline" onClick={handleExportData}><DownloadIcon className="h-3 w-3 mr-1" />Export</Button></div></div>{/* Quick stats */}<div className="grid grid-cols-4 gap-4 mt-4"><div className="text-center"><div className="text-2xl font-bold text-blue-600">{metrics.totalMessages}</div><div className="text-xs text-muted-foreground">Total Messages</div></div><div className="text-center"><div className="text-2xl font-bold text-green-600">{metrics.messagesSent}</div><div className="text-xs text-muted-foreground">Sent</div></div><div className="text-center"><div className="text-2xl font-bold text-purple-600">{metrics.messagesReceived}</div><div className="text-xs text-muted-foreground">Received</div></div><div className="text-center"><div className="text-2xl font-bold text-orange-600">{metrics.averageLatency ? `${Math.round(metrics.averageLatency)}ms` : '-'}</div><div className="text-xs text-muted-foreground">Avg Latency</div></div></div></CardHeader><CardContent className="flex-1 overflow-hidden"><Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col"><TabsList className="grid w-full grid-cols-5 mb-4"><TabsTrigger value="connection">Connection</TabsTrigger><TabsTrigger value="messages">Messages ({filteredMessages.length})</TabsTrigger><TabsTrigger value="metrics">Metrics</TabsTrigger><TabsTrigger value="config">Config</TabsTrigger><TabsTrigger value="logs">Logs</TabsTrigger></TabsList><TabsContent value="connection" className="flex-1 flex flex-col min-h-0"><div className="grid grid-cols-2 gap-6 h-full">{/* Connection controls */}<div className="space-y-4"><h3 className="text-lg font-semibold">Connection</h3><div className="space-y-3"><div><label className="text-sm font-medium mb-1 block">WebSocket URL</label><div className="flex gap-2"><select
                          value={config.url}
                          onChange={e =>setConfig(prev => ({ ...prev, url: e.target.value}))}
                          className="flex-1 text-sm border rounded px-3 py-2"
                          disabled={connectionState === 'connected'}
                        >
                          {sampleServers.map(url => (<option key={url} value={url}>{url}</option>))}</select><Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const customUrl = prompt('Enter custom WebSocket URL:');
                            if (customUrl) {
                              setConfig(prev => ({ ...prev, url: customUrl}));
                            }
                          }}
                          disabled={connectionState === 'connected'}
                        ><EditIcon className="h-3 w-3" /></Button></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium mb-1 block">Auto Reconnect</label><Switch
                          checked={config.autoReconnect}
                          onCheckedChange={checked =>
                            setConfig(prev => ({ ...prev, autoReconnect: checked}))
                          }
                        /></div><div><label className="text-sm font-medium mb-1 block">Heartbeat</label><Switch
                          checked={config.heartbeatEnabled}
                          onCheckedChange={checked =>
                            setConfig(prev => ({ ...prev, heartbeatEnabled: checked}))
                          }
                        /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium mb-1 block">Reconnect Interval (ms)</label><Input
                          type="number"
                          value={config.reconnectInterval}
                          onChange={e =>
                            setConfig(prev => ({
                              ...prev,
                              reconnectInterval: Number(e.target.value),}))
                          }
                          min="1000"
                          max="60000"
                          step="1000"
                          className="text-sm"
                        /></div><div><label className="text-sm font-medium mb-1 block">Max Reconnect Attempts</label><Input
                          type="number"
                          value={config.maxReconnectAttempts}
                          onChange={e =>
                            setConfig(prev => ({
                              ...prev,
                              maxReconnectAttempts: Number(e.target.value),}))
                          }
                          min="1"
                          max="20"
                          className="text-sm"
                        /></div></div><div><label className="text-sm font-medium mb-1 block">Protocols (optional)</label><Input
                        placeholder="wamp, chat, etc. (comma-separated)"
                        value={config.protocols?.join(', ') || ''}
                        onChange={e => {
                          const protocols = e.target.value
                            .split(',')
                            .map(p => p.trim())
                            .filter(Boolean);
                          setConfig(prev => ({ ...prev, protocols}));
                        }}
                        className="text-sm"
                      /></div></div></div>{/* Connection status and info */}<div className="space-y-4"><h3 className="text-lg font-semibold">Status</h3><div className="space-y-3"><div className={`p-4 rounded-lg ${connectionStatus.bg}`}><div className="flex items-center gap-2 mb-2"><StatusIcon className={`h-4 w-4 ${connectionStatus.color}`} /><span className={`font-medium ${connectionStatus.color}`}>{connectionStatus.text}</span></div>{connectionState === 'connected' && metrics.connectTime && (<div className="text-sm text-muted-foreground">Connected at {metrics.connectTime.toLocaleTimeString()}</div>)}
                      {connectionState === 'reconnecting' && (<div className="text-sm text-muted-foreground">Attempt {reconnectCount.current} of {config.maxReconnectAttempts}</div>)}</div>{connectionState === 'connected' && (<div className="space-y-2"><div className="flex justify-between text-sm"><span>Uptime:</span><span>{Math.floor(metrics.connectionUptime / 1000)}s</span></div><div className="flex justify-between text-sm"><span>Protocol:</span><span>{websocketRef.current?.protocol || 'Default'}</span></div><div className="flex justify-between text-sm"><span>Ready State:</span><span>{websocketRef.current?.readyState}</span></div><div className="flex justify-between text-sm"><span>Buffer Size:</span><span>{messageQueue.current.length} messages</span></div></div>)}

                    {connectionHistory.length > 0 && (<div><h4 className="text-sm font-medium mb-2">Recent Events</h4><ScrollArea className="h-32"><div className="space-y-1 text-xs">{connectionHistory
                              .slice(-10)
                              .reverse()
                              .map((event, index) => (<div key={index} className="flex items-start gap-2"><span className="text-muted-foreground">{event.timestamp.toLocaleTimeString()}</span><span
                                    className={event.event === 'connect'
                                        ? 'text-green-600'
                                        : event.event === 'disconnect'
                                          ? 'text-gray-600'
                                          : event.event === 'error'
                                            ? 'text-red-600'
                                            : 'text-blue-600'}
                                  >{event.details}</span></div>))}</div></ScrollArea></div>)}</div></div></div></TabsContent><TabsContent value="messages" className="flex-1 flex flex-col min-h-0">{/* Message controls */}<div className="flex items-center gap-3 mb-4"><div className="flex-1 flex gap-2"><select
                    value={messageType}
                    onChange={e => setMessageType(e.target.value as WebSocketMessage['type'])}
                    className="text-sm border rounded px-3 py-2"
                  ><option value="user">User</option><option value="data">Data</option><option value="ping">Ping</option><option value="notification">Notification</option></select><Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 text-sm"
                  /><Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || connectionState !== 'connected'}
                  ><SendIcon className="h-3 w-3" /></Button></div><div className="flex items-center gap-2"><select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as typeof filterType)}
                    className="text-sm border rounded px-2 py-1"
                  ><option value="all">All</option><option value="system">System</option><option value="user">User</option><option value="data">Data</option><option value="error">Error</option></select><div className="relative"><SearchIcon className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" /><Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-7 w-32 h-8 text-xs"
                    /></div><Switch
                    checked={autoScroll}
                    onCheckedChange={setAutoScroll}
                    className="scale-75" /><label className="text-xs">Auto-scroll</label></div></div>{/* Messages list */}<ScrollArea className="flex-1 border rounded-lg"><div className="p-4 space-y-2">{filteredMessages.length === 0 ? (<div className="text-center py-8"><MessageCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Messages</h3><p className="text-muted-foreground">{messages.length === 0
                          ? 'Connect and start sending messages.'
                          : 'No messages match your filters.'}</p></div>) : (
                    filteredMessages.map(message => {
                      const typeDisplay = getMessageTypeDisplay(message.type);
                      const TypeIcon = typeDisplay.icon;

                      return (<div
                          key={message.id}
                          className={`p-3 rounded-lg border transition-all hover:shadow-sm ${typeDisplay.bg} border-current/20`}
                        ><div className="flex items-start gap-3"><TypeIcon className={`h-4 w-4 mt-0.5 ${typeDisplay.color}`} /><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium">{message.sender || 'Unknown'}</span><Badge variant="outline" className="text-xs">{message.type}</Badge>{showTimestamps && (<span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>)}
                                {message.acknowledged === false && (<Badge variant="destructive" className="text-xs">Failed</Badge>)}</div><div className="text-sm break-words">{typeof message.content === 'string' ? (
                                  message.content
                                ) : (<pre className="text-xs bg-black/5 p-2 rounded overflow-x-auto">{JSON.stringify(message.content, null, 2)}</pre>)}</div>{showMetadata &&
                                message.metadata &&
                                Object.keys(message.metadata).length > 0 && (<div className="mt-2 text-xs text-muted-foreground"><strong>Metadata:</strong>{JSON.stringify(message.metadata)}</div>)}</div><div className="text-xs text-muted-foreground">{message.size} bytes</div></div></div>);
                    })
                  )}<div ref={messagesEndRef} /></div></ScrollArea></TabsContent><TabsContent value="metrics" className="flex-1"><div className="grid grid-cols-2 gap-6 h-full"><div className="space-y-4"><h3 className="text-lg font-semibold">Connection Metrics</h3><div className="grid grid-cols-2 gap-4"><div className="p-4 border rounded-lg"><div className="text-2xl font-bold text-blue-600">{metrics.totalConnections}</div><div className="text-sm text-muted-foreground">Total Connections</div></div><div className="p-4 border rounded-lg"><div className="text-2xl font-bold text-red-600">{metrics.failedConnections}</div><div className="text-sm text-muted-foreground">Failed Connections</div></div><div className="p-4 border rounded-lg"><div className="text-2xl font-bold text-green-600">{metrics.reconnectAttempts}</div><div className="text-sm text-muted-foreground">Reconnect Attempts</div></div><div className="p-4 border rounded-lg"><div className="text-2xl font-bold text-purple-600">{metrics.errorCount}</div><div className="text-sm text-muted-foreground">Errors</div></div></div><div className="space-y-2"><h4 className="font-medium">Latency Statistics</h4><div className="grid grid-cols-3 gap-2 text-sm"><div><div className="text-muted-foreground">Average</div><div className="font-medium">{Math.round(metrics.averageLatency)}ms</div></div><div><div className="text-muted-foreground">Min</div><div className="font-medium">{metrics.minLatency}ms</div></div><div><div className="text-muted-foreground">Max</div><div className="font-medium">{metrics.maxLatency}ms</div></div></div></div><div className="space-y-2"><h4 className="font-medium">Data Transfer</h4><div className="text-sm"><div className="flex justify-between"><span>Total Bytes:</span><span>{(metrics.bytesTransferred / 1024).toFixed(2)} KB</span></div><div className="flex justify-between"><span>Message Rate:</span><span>{metrics.connectionUptime > 0
                            ? (
                                metrics.totalMessages /
                                (metrics.connectionUptime / 1000 / 60)
                              ).toFixed(2)
                            : '0'}{' '}
                          msg/min</span></div></div></div></div><div className="space-y-4"><h3 className="text-lg font-semibold">Performance</h3><div className="text-center py-8"><BarChart3Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h4 className="text-lg font-medium mb-2">Performance Charts</h4><p className="text-muted-foreground">Real-time performance visualization would be displayed here.</p></div></div></div></TabsContent><TabsContent value="config" className="flex-1"><div className="grid grid-cols-2 gap-6 h-full"><div className="space-y-4"><h3 className="text-lg font-semibold">Configuration</h3><div className="space-y-3"><div><label className="text-sm font-medium mb-1 block">Ping Interval (ms)</label><Input
                        type="number"
                        value={config.pingInterval}
                        onChange={e =>
                          setConfig(prev => ({ ...prev, pingInterval: Number(e.target.value)}))
                        }
                        min="5000"
                        max="120000"
                        step="5000"
                        className="text-sm"
                      /></div><div><label className="text-sm font-medium mb-1 block">Max Buffer Size</label><Input
                        type="number"
                        value={config.maxBufferSize}
                        onChange={e =>
                          setConfig(prev => ({ ...prev, maxBufferSize: Number(e.target.value)}))
                        }
                        min="10"
                        max="10000"
                        className="text-sm"
                      /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium mb-1 block">Buffer Messages</label><Switch
                          checked={config.bufferMessages}
                          onCheckedChange={checked =>
                            setConfig(prev => ({ ...prev, bufferMessages: checked}))
                          }
                        /></div><div><label className="text-sm font-medium mb-1 block">Message Retry</label><Switch
                          checked={config.messageRetryEnabled}
                          onCheckedChange={checked =>
                            setConfig(prev => ({ ...prev, messageRetryEnabled: checked}))
                          }
                        /></div></div><div><label className="text-sm font-medium mb-1 block">Log Level</label><select
                        value={config.logLevel}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            logLevel: e.target.value as typeof config.logLevel,}))
                        }
                        className="w-full text-sm border rounded px-3 py-2"
                      ><option value="debug">Debug</option><option value="info">Info</option><option value="warn">Warning</option><option value="error">Error</option></select></div></div></div><div className="space-y-4"><h3 className="text-lg font-semibold">Advanced Settings</h3><div className="space-y-3"><div><label className="text-sm font-medium mb-1 block">Authentication</label><select
                        value={config.authentication?.type || 'none'}
                        onChange={e => {
                          if (e.target.value === 'none') {
                            setConfig(prev => ({ ...prev, authentication: undefined}));
                          } else {
                            setConfig(prev => ({
                              ...prev,
                              authentication: {
                                type: e.target.value as 'token' | 'basic' | 'custom',
                                credentials: {},
                              },
                            }));
                          }
                        }}
                        className="w-full text-sm border rounded px-3 py-2"
                      ><option value="none">None</option><option value="token">Token</option><option value="basic">Basic Auth</option><option value="custom">Custom</option></select></div>{config.authentication && (<div><label className="text-sm font-medium mb-1 block">Credentials</label><Textarea
                          placeholder="Enter credentials as JSON..."
                          value={JSON.stringify(config.authentication.credentials, null, 2)}
                          onChange={e => {
                            try {
                              const credentials = JSON.parse(e.target.value);
                              setConfig(prev => ({
                                ...prev,
                                authentication: prev.authentication
                                  ? {
                                      ...prev.authentication,
                                      credentials,}
                                  : undefined,
                              }));
                            } catch {// Invalid JSON, ignore}
                          }}
                          className="text-xs font-mono"
                          rows={4}
                        /></div>)}<div><label className="text-sm font-medium mb-1 block">Custom Headers</label><Textarea
                        placeholder="Enter headers as JSON..."
                        value={JSON.stringify(config.headers, null, 2)}
                        onChange={e => {
                          try {
                            const headers = JSON.parse(e.target.value);
                            setConfig(prev => ({ ...prev, headers}));
                          } catch {// Invalid JSON, ignore}
                        }}
                        className="text-xs font-mono"
                        rows={3}
                      /></div></div></div></div></TabsContent><TabsContent value="logs" className="flex-1"><div className="text-center py-8"><ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">System Logs</h3><p className="text-muted-foreground">Detailed system logs and debug information would be displayed here.</p></div></TabsContent></Tabs></CardContent></Card></div>
  );
};

export default WebSocketDemo;
