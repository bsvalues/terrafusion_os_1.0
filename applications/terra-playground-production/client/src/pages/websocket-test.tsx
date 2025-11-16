/**
 * WebSocket Test Page
 *
 * A page for testing WebSocket connections with our new WebSocket implementation.
 * Provides UI for connecting to WebSocket server, sending messages, and viewing
 * connection status and received messages.
 */

import { useState, useEffect } from 'react';
import { useWebSocket, ConnectionState } from '../hooks/use-websocket';

// A simple message input component
const MessageInput = ({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSend(message);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
      >
        Send
      </button>
    </form>
  );
};

// Connection status indicator component
const ConnectionStatus = ({ state }: { state: ConnectionState }) => {
  const getStatusColor = () => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return 'bg-green-500';
      case ConnectionState.CONNECTING:
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
    <div className="flex items-center gap-2"><>

      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
      <span
</>>{getStatusText()}</span>
    </div>
  );
};

// Message log component
const MessageLog = ({ messages }: { messages: any[] }) => {
  if (messages.length === 0) {
    return <div className="text-gray-500 italic">No messages yet</div>;
  }

  return (
    <div className="overflow-y-auto max-h-80 border border-gray-200 rounded-md p-4">
      {messages.map((msg /* , index */) => (
        <div key={index} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
          <div className="flex justify-between text-sm"><>

            <span className="font-semibold">{msg.type || 'message'}</span>
            <span
</> className="text-gray-500 text-xs">
              {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>
          <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded mt-1">
            {JSON.stringify(msg, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};

// Main WebSocket test component
const WebSocketTestPage = () => {
  // Store received messages
  const [messages, setMessages] = useState<any[]>([]);

  // Stats for display
  const [stats, setStats] = useState({
    messagesReceived: 0,
    messagesSent: 0,
    reconnects: 0,
    latency: null as number | null,
  });

  // Use our WebSocket hook
  const { connectionState, lastMessage, sendMessage, connect, disconnect, reconnect, getStatus } =
    useWebSocket(
      undefined, // Auto-detect URL
      {
        path: '/ws',
        autoReconnect: true,
        reconnectStrategy: {
          initialDelay: 1000,
          maxDelay: 30000,
          multiplier: 1.5,
          maxAttempts: 10,
        },
        heartbeatInterval: 30000,
      },
      true // Auto-connect on page load
    );

  // Update messages when we receive a new one
  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, lastMessage]);
    }
  }, [lastMessage]);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getStatus();
      setStats({
        messagesReceived: status.stats.messagesReceived,
        messagesSent: status.stats.messagesSent,
        reconnects: status.stats.reconnects,
        latency: status.stats.lastLatency,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [getStatus]);

  // Handle sending a message
  const handleSendMessage = (messageText: string) => {
    sendMessage({
      type: 'message',
      content: messageText,
      timestamp: Date.now(),
    });
  };

  // Handle sending a ping
  const handleSendPing = () => {
    sendMessage({
      type: 'ping',
      timestamp: Date.now(),
    });
  };

  // Clear messages
  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">WebSocket Connection Test</h1>

      {/* Connection status and controls */}
      <div className="bg-white rounded-md shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <ConnectionStatus state={connectionState} />

          <div className="flex gap-2"><>

            <button
              onClick={connect}
              disabled={
                connectionState === ConnectionState.CONNECTED ||
                connectionState === ConnectionState.CONNECTING
              }
              className="px-4 py-2 bg-green-500 text-white rounded-md disabled:bg-gray-300"
            >
              Connect
            </button>
            <button
</>
              onClick={disconnect}
              disabled={connectionState === ConnectionState.DISCONNECTED}
              className="px-4 py-2 bg-red-500 text-white rounded-md disabled:bg-gray-300"
            >
              Disconnect
            </button>
            <button
              onClick={reconnect}
              disabled={
                connectionState === ConnectionState.CONNECTING ||
                connectionState === ConnectionState.RECONNECTING
              }
              className="px-4 py-2 bg-yellow-500 text-white rounded-md disabled:bg-gray-300"
            >
              Reconnect
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-100 p-3 rounded-md"><>

            <div className="text-sm text-gray-500">Messages Received</div>
            <div
</> className="text-xl font-bold">{stats.messagesReceived}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded-md"><>

            <div className="text-sm text-gray-500">Messages Sent</div>
            <div
</> className="text-xl font-bold">{stats.messagesSent}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded-md"><>

            <div className="text-sm text-gray-500">Reconnects</div>
            <div
</> className="text-xl font-bold">{stats.reconnects}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded-md"><>

            <div className="text-sm text-gray-500">Latency</div>
            <div
</> className="text-xl font-bold">{stats.latency ? `${stats.latency}ms` : 'N/A'}</div>
          </div>
        </div>

        {/* Send message form */}
        <MessageInput
          onSend={handleSendMessage}
          disabled={connectionState !== ConnectionState.CONNECTED}
        />

        {/* Additional actions */}
        <div className="flex gap-2 mt-4"><>

          <button
            onClick={handleSendPing}
            disabled={connectionState !== ConnectionState.CONNECTED}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
          >
            Send Ping
          </button>
          <button
</> onClick={clearMessages} className="px-4 py-2 bg-gray-500 text-white rounded-md">
            Clear Messages
          </button>
        </div>
      </div>

      {/* Message log */}
      <div className="bg-white rounded-md shadow-md p-6"><>

        <h2 className="text-xl font-bold mb-4">Messages</h2>
        <MessageLog
</> messages={messages} />
      </div>
    </div>
  );
};

export default WebSocketTestPage;
