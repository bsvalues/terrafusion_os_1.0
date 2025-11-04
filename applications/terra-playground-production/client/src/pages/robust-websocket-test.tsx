/**
 * Robust WebSocket Test Page
 *
 * A more advanced page for testing WebSocket connections with comprehensive
 * configuration options, diagnostics, and logging capabilities.
 */

import { useState, useEffect, useRef } from 'react';
import { useWebSocket, ConnectionState } from '../hooks/use-websocket';
import { logger } from '../utils/logger';

// Connection status display component
const ConnectionStatus = ({ state }: { state: ConnectionState }) => {
  const getColorClass = () => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return 'bg-green-500';
      case ConnectionState.CONNECTING:
        return 'bg-blue-500';
      case ConnectionState.RECONNECTING:
        return 'bg-yellow-500';
      case ConnectionState.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return 'Connected';
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.RECONNECTING:
        return 'Reconnecting...';
      case ConnectionState.ERROR:
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="flex items-center space-x-2"><>

      <div className={`w-3 h-3 rounded-full ${getColorClass()}`}></div>
      <span
</> className="font-medium">{getStatusText()}</span>
    </div>
  );
};

// Configuration form for WebSocket connection
const ConnectionConfig = ({
  onConnect,
  disabled,
}: {
  onConnect: (config: any) => void;
  disabled: boolean;
}) => {
  const [config, setConfig] = useState({
    url: '',
    path: '/ws',
    autoReconnect: true,
    reconnectStrategy: {
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 1.5,
      maxAttempts: 10,
    },
    heartbeatInterval: 30000,
    useHttpFallback: true,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><>

        <label className="block text-sm font-medium mb-1">WebSocket URL</label>
        <input
</>
          type="text"
          value={config.url}
          onChange={e => setConfig({ ...config, url: e.target.value })}
          placeholder="Leave empty for auto-detection"
          className="w-full p-2 border rounded"
        />
      </div>

      <div><>

        <label className="block text-sm font-medium mb-1">WebSocket Path</label>
        <input
</>
          type="text"
          value={config.path}
          onChange={e => setConfig({ ...config, path: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="autoReconnect"
          checked={config.autoReconnect}
          onChange={e => setConfig({ ...config, autoReconnect: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="autoReconnect" className="text-sm font-medium">
          Auto Reconnect
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="useHttpFallback"
          checked={config.useHttpFallback}
          onChange={e => setConfig({ ...config, useHttpFallback: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="useHttpFallback" className="text-sm font-medium">
          Use HTTP Fallback
        </label>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-blue-500 text-sm"
      >
        {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
      </button>

      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <div><>

            <label className="block text-sm font-medium mb-1">Heartbeat Interval (ms)</label>
            <input
</>
              type="number"
              value={config.heartbeatInterval}
              onChange={e => setConfig({ ...config, heartbeatInterval: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><>

              <label className="block text-sm font-medium mb-1">Initial Delay (ms)</label>
              <input
</>
                type="number"
                value={config.reconnectStrategy.initialDelay}
                onChange={e =>
                  setConfig({
                    ...config,
                    reconnectStrategy: {
                      ...config.reconnectStrategy,
                      initialDelay: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div><>

              <label className="block text-sm font-medium mb-1">Max Delay (ms)</label>
              <input
</>
                type="number"
                value={config.reconnectStrategy.maxDelay}
                onChange={e =>
                  setConfig({
                    ...config,
                    reconnectStrategy: {
                      ...config.reconnectStrategy,
                      maxDelay: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div><>

              <label className="block text-sm font-medium mb-1">Backoff Multiplier</label>
              <input
</>
                type="number"
                step="0.1"
                value={config.reconnectStrategy.multiplier}
                onChange={e =>
                  setConfig({
                    ...config,
                    reconnectStrategy: {
                      ...config.reconnectStrategy,
                      multiplier: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div><>

              <label className="block text-sm font-medium mb-1">Max Attempts</label>
              <input
</>
                type="number"
                value={config.reconnectStrategy.maxAttempts}
                onChange={e =>
                  setConfig({
                    ...config,
                    reconnectStrategy: {
                      ...config.reconnectStrategy,
                      maxAttempts: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
      >
        Connect
      </button>
    </form>
  );
};

// WebSocket message composer
const MessageComposer = ({
  onSend,
  disabled,
}: {
  onSend: (message: any) => void;
  disabled: boolean;
}) => {
  const [messageType, setMessageType] = useState('message');
  const [messageContent, setMessageContent] = useState('');
  const [customJson, setCustomJson] = useState('{"type": "custom", "content": "Hello, server!"}');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (messageType === 'custom') {
      try {
        const customMessage = JSON.parse(customJson);
        onSend(customMessage);
      } catch (error) {
        logger.error('Invalid JSON', error);
        alert('Invalid JSON format');
      }
    } else if (messageType === 'ping') {
      onSend({
        type: 'ping',
        timestamp: Date.now(),
      });
    } else if (messageType === 'binary') {
      // Create a binary message
      const encoder = new TextEncoder();
      const binaryData = encoder.encode(messageContent);
      onSend(binaryData);
    } else {
      onSend({
        type: messageType,
        content: messageContent,
        timestamp: Date.now(),
      });
    }

    // Clear input
    setMessageContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><>

        <label className="block text-sm font-medium mb-1">Message Type</label>
        <select
</>
          value={messageType}
          onChange={e => setMessageType(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={disabled}
        ><>

          <option value="message">Regular Message</option>
          <option
</> value="ping">Ping</option><>

          <option value="echo">Echo</option>
          <option
</> value="binary">Binary Data</option>
          <option value="custom">Custom JSON</option>
        </select>
      </div>

      {messageType === 'custom' ? (
        <div><>

          <label className="block text-sm font-medium mb-1">Custom JSON</label>
          <textarea
</>
            value={customJson}
            onChange={e => setCustomJson(e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm h-32"
            disabled={disabled}
          />
        </div>
      ) : (
        messageType !== 'ping' && (
          <div><>

            <label className="block text-sm font-medium mb-1">Message Content</label>
            <input
</>
              type="text"
              value={messageContent}
              onChange={e => setMessageContent(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={disabled}
            />
          </div>
        )
      )}

      <button
        type="submit"
        disabled={
          disabled || (messageType !== 'ping' && messageType !== 'custom' && !messageContent)
        }
        className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-green-300"
      >
        Send Message
      </button>
    </form>
  );
};

// Message log display
const MessageLog = ({ messages }: { messages: any[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return <div className="text-gray-500 italic p-4">No messages yet</div>;
  }

  return (
    <div ref={containerRef} className="overflow-y-auto h-96 border rounded">
      {messages.map((msg, idx) => (
        <div key={idx} className="border-b p-3 hover:bg-gray-50">
          <div className="flex justify-between items-center mb-1"><>

            <span className="font-medium">{msg.type || 'unknown'}</span>
            <span
</> className="text-xs text-gray-500">
              {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>
          <pre className="text-sm overflow-x-auto bg-gray-100 p-2 rounded">
            {typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg.toString()}
          </pre>
        </div>
      ))}
    </div>
  );
};

// Connection statistics display
const ConnectionStats = ({ stats }: { stats: any }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-100 p-3 rounded"><>

        <div className="text-gray-500 text-sm">Messages Sent</div>
        <div
</> className="text-xl font-bold">{stats.messagesSent}</div>
      </div>
      <div className="bg-gray-100 p-3 rounded"><>

        <div className="text-gray-500 text-sm">Messages Received</div>
        <div
</> className="text-xl font-bold">{stats.messagesReceived}</div>
      </div>
      <div className="bg-gray-100 p-3 rounded"><>

        <div className="text-gray-500 text-sm">Reconnections</div>
        <div
</> className="text-xl font-bold">{stats.reconnects}</div>
      </div>
      <div className="bg-gray-100 p-3 rounded"><>

        <div className="text-gray-500 text-sm">Latency</div>
        <div
</> className="text-xl font-bold">{stats.latency ? `${stats.latency}ms` : 'N/A'}</div>
      </div>
    </div>
  );
};

// Main component
const RobustWebSocketTest = () => {
  // State
  const [config, setConfig] = useState({
    url: '',
    path: '/ws',
    autoReconnect: true,
    reconnectStrategy: {
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 1.5,
      maxAttempts: 10,
    },
    heartbeatInterval: 30000,
    useHttpFallback: true,
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [useWebSocketHook, setUseWebSocketHook] = useState(false);
  const [stats, setStats] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    reconnects: 0,
    latency: null as number | null,
  });

  // WebSocket hook
  const { connectionState, lastMessage, sendMessage, connect, disconnect, reconnect, getStatus } =
    useWebSocket(config.url, config, useWebSocketHook);

  // Update messages when new messages arrive
  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, lastMessage]);
    }
  }, [lastMessage]);

  // Update stats periodically
  useEffect(() => {
    if (!useWebSocketHook) return;

    const interval = setInterval(() => {
      const status = getStatus();
      setStats({
        messagesSent: status.stats.messagesSent,
        messagesReceived: status.stats.messagesReceived,
        reconnects: status.stats.reconnects,
        latency: status.stats.lastLatency,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [getStatus, useWebSocketHook]);

  // Handle connect button
  const handleConnect = (newConfig: any) => {
    setConfig(newConfig);
    setUseWebSocketHook(true);
  };

  // Handle send message
  const handleSendMessage = (message: any) => {
    sendMessage(message);
  };

  // Handle clear messages
  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl"><>

      <h1 className="text-3xl font-bold mb-6">Robust WebSocket Test</h1>

      <div
</> className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Connection & Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6"><>

            <h2 className="text-xl font-semibold mb-4">Connection</h2>

            <div
</> className="flex justify-between items-center mb-6">
              <ConnectionStatus state={connectionState} />

              <div className="space-x-2"><>

                <button
                  onClick={disconnect}
                  disabled={!useWebSocketHook || connectionState === ConnectionState.DISCONNECTED}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm disabled:bg-red-300"
                >
                  Disconnect
                </button>
                <button
</>
                  onClick={reconnect}
                  disabled={
                    !useWebSocketHook ||
                    connectionState === ConnectionState.CONNECTING ||
                    connectionState === ConnectionState.RECONNECTING
                  }
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-sm disabled:bg-yellow-300"
                >
                  Reconnect
                </button>
              </div>
            </div>

            {useWebSocketHook ? (
              <ConnectionStats stats={stats} />
            ) : (
              <ConnectionConfig onConnect={handleConnect} disabled={useWebSocketHook} />
            )}
          </div>

          {useWebSocketHook && (
            <div className="bg-white rounded-lg shadow p-6"><>

              <h2 className="text-xl font-semibold mb-4">Send Message</h2>
              <MessageComposer
</>
                onSend={handleSendMessage}
                disabled={connectionState !== ConnectionState.CONNECTED}
              />
            </div>
          )}
        </div>

        {/* Right column - Messages */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4"><>

            <h2 className="text-xl font-semibold">Messages</h2>
            <button
</>
              onClick={handleClearMessages}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Clear
            </button>
          </div>
          <MessageLog messages={messages} />
        </div>
      </div>
    </div>
  );
};

export default RobustWebSocketTest;
