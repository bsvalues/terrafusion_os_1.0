import { Brain, Send, Sparkles, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AICopilotProps {
  consciousnessUrl?: string;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  consciousnessUrl = 'http://localhost:3004',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentCount, setAgentCount] = useState(0);
  const [swarmStatus, setSwarmStatus] = useState<string>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSwarmStatus();
    const interval = setInterval(fetchSwarmStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSwarmStatus = async () => {
    try {
      const response = await fetch(`${consciousnessUrl}/api/consciousness/status`);
      const data = await response.json();
      setAgentCount(data.agentCount || 1008);
      setSwarmStatus(data.status || 'operational');
    } catch (error) {
      console.error('Failed to fetch swarm status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${consciousnessUrl}/api/consciousness/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content:
          data.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        role: 'system',
        content: 'Failed to connect to AI Consciousness Service',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='h-full flex flex-col bg-terra-midnight'>
      {/* AI Copilot Header */}
      <div className='flex items-center justify-between px-4 py-2 border-b border-terra-cyan/20'>
        <div className='flex items-center space-x-2'>
          <Brain size={18} className='text-terra-cyan' />
          <span className='text-sm text-white font-semibold'>AI Copilot</span>
        </div>
        <div className='flex items-center space-x-3'>
          <div className='flex items-center space-x-1 text-xs'>
            <Users size={14} className='text-terra-cyan' />
            <span className='text-white'>{agentCount.toLocaleString()}</span>
          </div>
          <div className='flex items-center space-x-1 text-xs'>
            <div
              className={`w-2 h-2 rounded-full ${
                swarmStatus === 'operational'
                  ? 'bg-green-500'
                  : swarmStatus === 'degraded'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
            <span className='text-white capitalize'>{swarmStatus}</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.length === 0 && (
          <div className='flex flex-col items-center justify-center h-full text-center text-terra-cyan/50'>
            <Sparkles size={48} className='mb-4' />
            <p className='text-sm'>AI Swarm ready with {agentCount.toLocaleString()} agents</p>
            <p className='text-xs mt-2'>Ask me anything about your code</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-terra-cyan/20 text-white'
                  : message.role === 'assistant'
                    ? 'bg-terra-slate/30 text-white'
                    : 'bg-yellow-500/20 text-yellow-300'
              }`}
            >
              <div className='flex items-start space-x-2'>
                {message.role === 'assistant' && (
                  <Brain size={16} className='text-terra-cyan mt-1 flex-shrink-0' />
                )}
                <div className='flex-1'>
                  <p className='text-sm whitespace-pre-wrap'>{message.content}</p>
                  <p className='text-xs opacity-50 mt-1'>{formatTime(message.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className='flex justify-start'>
            <div className='bg-terra-slate/30 rounded-lg px-4 py-2'>
              <div className='flex items-center space-x-2'>
                <Brain size={16} className='text-terra-cyan animate-pulse' />
                <span className='text-sm text-white'>AI Swarm processing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className='p-4 border-t border-terra-cyan/20'>
        <div className='flex items-center space-x-2'>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask AI Copilot...'
            disabled={isLoading || swarmStatus !== 'operational'}
            className='flex-1 bg-terra-slate/20 text-white px-4 py-2 rounded border border-terra-cyan/20 focus:border-terra-cyan outline-none disabled:opacity-50 disabled:cursor-not-allowed'
          />
          <button
            type='submit'
            disabled={!input.trim() || isLoading || swarmStatus !== 'operational'}
            className='p-2 bg-terra-cyan/20 hover:bg-terra-cyan/30 text-terra-cyan rounded disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Send size={20} />
          </button>
        </div>
        <p className='text-xs text-terra-cyan/50 mt-2'>
          Powered by {agentCount.toLocaleString()}-agent swarm intelligence
        </p>
      </form>
    </div>
  );
};

export default AICopilot;
