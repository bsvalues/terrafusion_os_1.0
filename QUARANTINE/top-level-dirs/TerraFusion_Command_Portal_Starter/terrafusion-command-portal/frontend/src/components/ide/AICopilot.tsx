'use client';

import axios from 'axios';
import { Maximize2, Minimize2, Send, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICopilotProps {
  selectedCode?: string;
  onClose?: () => void;
  isMinimized?: boolean;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  selectedCode,
  onClose,
  isMinimized: initialMinimized = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '🤖 AI Copilot ready! Ask me anything about your code.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [agentLevel, setAgentLevel] = useState<'beginner' | 'advanced' | 'ninja'>('advanced');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8787/api/ai/ask', {
        query: input,
        context: {
          selectedCode,
          agentLevel,
          mode: 'developer',
        },
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response || 'No response',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Error communicating with AI. Check if backend is running.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="h-12 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-3">
        <span className="text-xs text-gray-400">AI Copilot</span>
        <button onClick={() => setIsMinimized(false)} className="p-1 hover:bg-gray-700 rounded">
          <Maximize2 className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-300">🤖 AI Copilot</h3>
        <div className="flex items-center gap-2">
          <select
            value={agentLevel}
            onChange={e => setAgentLevel(e.target.value as any)}
            className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300"
          >
            <option value="beginner">Beginner</option>
            <option value="advanced">Advanced</option>
            <option value="ninja">Ninja (1,008 Agents)</option>
          </select>
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
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-200 border border-gray-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-200 border border-gray-700 px-3 py-2 rounded-lg text-sm">
              ✨ Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask the AI..."
            disabled={isLoading}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {selectedCode && <p className="text-xs text-gray-500 mt-2">📝 Code context available</p>}
      </div>
    </div>
  );
};
