'use client';

import { Maximize2, Minimize2, Send, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface TerminalMessage {
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  onClose?: () => void;
  isMinimized?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
  onClose,
  isMinimized: initialMinimized = false,
}) => {
  const [messages, setMessages] = useState<TerminalMessage[]>([
    {
      type: 'output',
      content: 'TerraFusion Developer Platform Terminal',
      timestamp: new Date(),
    },
    {
      type: 'output',
      content: 'Type commands to run tasks',
      timestamp: new Date(),
    },
  ]);
  const [command, setCommand] = useState('');
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Connect to WebSocket terminal
    try {
      wsRef.current = new WebSocket('ws://localhost:8787/ws');
      wsRef.current.onopen = () => {
        setIsConnected(true);
        addMessage('✅ Connected to TerraFusion terminal', 'output');
      };
      wsRef.current.onmessage = event => {
        addMessage(event.data, 'output');
      };
      wsRef.current.onerror = () => {
        setIsConnected(false);
        addMessage('⚠️ Terminal connection error', 'error');
      };
      wsRef.current.onclose = () => {
        setIsConnected(false);
        addMessage('Terminal disconnected', 'error');
      };
    } catch (err) {
      addMessage('Failed to connect to terminal', 'error');
      console.error(err);
    }

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content: string, type: TerminalMessage['type'] = 'output') => {
    setMessages(prev => [...prev, { content, type, timestamp: new Date() }]);
  };

  const handleSendCommand = () => {
    if (!command.trim()) return;

    addMessage(`$ ${command}`, 'input');

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(command);
    }

    setCommand('');
  };

  if (isMinimized) {
    return (
      <div className="h-12 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-3">
        <span className="text-xs text-gray-400">Terminal</span>
        <div className="flex gap-2">
          <button onClick={() => setIsMinimized(false)} className="p-1 hover:bg-gray-700 rounded">
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold text-gray-300">Terminal</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4 text-gray-400" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded" title="Close">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 font-mono text-sm">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${
              msg.type === 'input'
                ? 'text-green-400'
                : msg.type === 'error'
                  ? 'text-red-400'
                  : 'text-gray-300'
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm">$</span>
          <input
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleSendCommand();
              }
            }}
            placeholder="Type command..."
            className="flex-1 bg-transparent text-gray-100 font-mono text-sm outline-none"
            autoFocus
          />
          <button
            onClick={handleSendCommand}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Send"
          >
            <Send className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
