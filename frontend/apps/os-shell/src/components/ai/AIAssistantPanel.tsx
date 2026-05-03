import { TerraSphere } from '@/components/brand/TerraSphere';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from '@/components/terrafusion-design-system';
import { cn } from '@utils/cn';
import { Brain, CheckCircle, MessageSquare, Sparkles, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { getToken } from '../../auth/authStorage';
import { getApiBase } from '../../lib/apiBase';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

interface AIAssistantPanelProps {
  countyId: string;
  employeeRole: string;
  currentContext?: {
    module: string;
    task: string;
    data?: any;
  };
  onAISuggestion?: (suggestion: string) => void;
  className?: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  countyId,
  employeeRole,
  currentContext,
  onAISuggestion,
  className,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState<'active' | 'idle' | 'processing'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAiStatus('active');
    setMessages([
      {
        id: 'system-welcome',
        role: 'system',
        content: `**AI Assistant Compatibility Mode** - ${countyId.toUpperCase()}\n\nResponses come from the governed TerraFusion AI Assistant API. This panel will not claim live automation, swarm execution, valuation accuracy, or compliance outcomes unless the backend returns evidence for them.\n\nRole context: ${employeeRole}`,
        timestamp: new Date(),
      },
    ]);
  }, [countyId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const messageText = inputValue;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setAiStatus('processing');

    try {
      const response = await fetch(`${getApiBase()}/AIAssistant/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          countyId,
          employeeRole,
          message: messageText,
          context: currentContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Assistant API unavailable: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse: AIMessage = {
        id: data.messageId || (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        confidence: data.confidence,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, aiResponse]);
      setAiStatus('active');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI Assistant API unavailable.';
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `AI Assistant evidence unavailable. ${errorMessage}`,
          timestamp: new Date(),
          confidence: 0,
        },
      ]);
      setAiStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onAISuggestion?.(suggestion);
    setInputValue(suggestion);
  };

  return (
    <Card className={cn('terra-glass h-full flex flex-col', className)} glow>
      {/* Header */}
      <CardHeader className='flex-row items-center justify-between pb-4 border-b border-terra-cyan/20'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <TerraSphere size='md' variant='quantum' />
            {aiStatus === 'active' && (
              <div className='absolute -top-1 -right-1'>
                <div className='w-3 h-3 bg-terra-cyan rounded-full animate-pulse' />
              </div>
            )}
          </div>
          <div>
            <h3 className='text-lg font-semibold text-terra-cyan'>AI Assistant</h3>
            <p className='text-xs text-slate-400'>Governed backend responses only</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Badge variant='quantum' className='quantum-pulse'>
            <Sparkles className='w-3 h-3 mr-1' />
            {aiStatus === 'processing' ? 'Processing' : aiStatus === 'active' ? 'Ready' : 'Offline'}
          </Badge>
          <Badge variant='outline' className='text-xs'>
            {countyId.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      {/* Backend Evidence Notice */}
      <div className='px-4 py-2 bg-terra-midnight/30'>
        <div className='text-xs text-slate-400'>
          Agent telemetry, confidence, and provenance are displayed only when returned by the API.
        </div>
      </div>

      {/* Messages Area */}
      <CardContent className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.role !== 'user' && (
              <Avatar className='w-8 h-8 terra-glow'>
                <div className='w-full h-full bg-gradient-to-br from-terra-cyan to-terra-blue flex items-center justify-center'>
                  <Brain className='w-4 h-4 text-terra-midnight' />
                </div>
              </Avatar>
            )}

            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3',
                message.role === 'user'
                  ? 'bg-terra-blue/20 border border-terra-blue/30 text-right'
                  : message.role === 'system'
                    ? 'bg-terra-cyan/10 border border-terra-cyan/20 terra-glow'
                    : 'bg-slate-800/50 border border-slate-700'
              )}
            >
              <div className='prose prose-invert prose-sm max-w-none'>
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className='mb-1 last:mb-0'>
                    {line}
                  </p>
                ))}
              </div>

              {message.confidence && (
                <div className='mt-2 flex items-center gap-2 text-xs text-slate-400'>
                  <CheckCircle className='w-3 h-3' />
                  <span>Confidence: {(message.confidence * 100).toFixed(1)}%</span>
                </div>
              )}

              {message.suggestions && message.suggestions.length > 0 && (
                <div className='mt-3 space-y-2'>
                  <p className='text-xs text-slate-400'>Quick Actions:</p>
                  {message.suggestions.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant='outline'
                      size='sm'
                      className='w-full justify-start text-xs hover-quantum'
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Zap className='w-3 h-3 mr-2' />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <Avatar className='w-8 h-8'>
                <div className='w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center'>
                  <span className='text-xs font-semibold'>{employeeRole[0]}</span>
                </div>
              </Avatar>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className='flex gap-3'>
            <Avatar className='w-8 h-8 terra-glow animate-pulse'>
              <div className='w-full h-full bg-gradient-to-br from-terra-cyan to-terra-blue flex items-center justify-center'>
                <Brain className='w-4 h-4 text-terra-midnight animate-spin' />
              </div>
            </Avatar>
            <div className='bg-slate-800/50 border border-slate-700 rounded-lg p-3'>
              <div className='flex items-center gap-2 text-sm text-slate-400'>
                <div className='w-2 h-2 bg-terra-cyan rounded-full animate-pulse' />
                <span>Checking assistant route. Governed execution is not implied.</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Area */}
      <div className='p-4 border-t border-terra-cyan/20 bg-terra-midnight/30'>
        <div className='flex gap-2'>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder='Ask your AI assistant anything...'
            className='flex-1'
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            variant='quantum'
            className='quantum-pulse'
          >
            <MessageSquare className='w-4 h-4' />
          </Button>
        </div>

        <div className='mt-2 flex items-center justify-between text-xs text-slate-400'>
          <span>Assistant route compatibility mode</span>
          <span className='text-terra-cyan'>No governed automation</span>
        </div>
      </div>
    </Card>
  );
};

export default AIAssistantPanel;
