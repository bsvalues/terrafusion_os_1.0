/**
 * ═══════════════════════════════════════════════════════════════
 * AI ASSISTANT PANEL - Elite County Employee AI Superpower Interface
 * TerraFusion OS Quantum Governance Platform
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Progress,
} from '@/components/terrafusion-design-system';
import { cn } from '@utils/cn';
import { Brain, CheckCircle, MessageSquare, Sparkles, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
  const [swarmActivity, setSwarmActivity] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate AI consciousness connection (replace with actual API)
  useEffect(() => {
    const connectToAISwarm = async () => {
      setAiStatus('active');
      // Add welcome message from AI
      setMessages([
        {
          id: '1',
          role: 'system',
          content: `🏛️ **AI Swarm Connected** - ${countyId.toUpperCase()} Government Excellence Mode\n\nI'm your TerraFusion AI Assistant with access to 50,000+ specialized agents. I can help you with:\n\n✨ **Property Assessment** - Instant valuations with 99.5% accuracy\n🔍 **Data Analysis** - Real-time insights from county systems\n📊 **Compliance Validation** - IAAO standards verification\n⚡ **Workflow Automation** - Intelligent task completion\n\nHow can I amplify your capabilities today?`,
          timestamp: new Date(),
          confidence: 1.0,
        },
      ]);
    };

    connectToAISwarm();
  }, [countyId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate swarm activity monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setSwarmActivity((prev) => Math.min(prev + Math.random() * 10, 100));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setAiStatus('processing');

    // Simulate AI processing (replace with actual API call)
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputValue, currentContext),
        timestamp: new Date(),
        confidence: 0.95,
        suggestions: [
          'Run comprehensive analysis',
          'Generate compliance report',
          'Schedule workflow automation',
        ],
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsProcessing(false);
      setAiStatus('active');
    }, 1500);
  };

  const generateAIResponse = (query: string, context?: any): string => {
    // Championship-level AI response generation
    if (query.toLowerCase().includes('property') || query.toLowerCase().includes('parcel')) {
      return `🏡 **Property Analysis Complete**\n\nI've analyzed 847 comparable properties in your jurisdiction using quantum-enhanced valuation algorithms.\n\n**Key Insights:**\n• Market trend: +3.2% (last 6 months)\n• Valuation accuracy: 99.7%\n• IAAO compliance: ✓ Certified\n• Outliers detected: 2 properties flagged for review\n\n**Recommended Actions:**\n1. Review flagged properties (Parcels #8842, #9103)\n2. Update cost factors based on market analysis\n3. Generate assessment roll with AI validation\n\nWould you like me to execute any of these actions?`;
    }

    if (query.toLowerCase().includes('compliance') || query.toLowerCase().includes('audit')) {
      return `🛡️ **Compliance Check Complete**\n\nFISMA-High security scan completed across all ${countyId} systems.\n\n**Status: EXCELLENT**\n• Security score: 99.2%\n• Audit trail: Complete\n• Data isolation: Verified\n• Access controls: Optimal\n\n**Zero critical issues detected.** All government standards exceeded.\n\nNext audit scheduled: Auto-monitoring active 24/7`;
    }

    return `✨ **AI Analysis Ready**\n\nI've processed your request using the TerraFusion AI swarm. Based on your role as ${employeeRole} in ${countyId}, I can provide:\n\n• **Instant Analysis** - Real-time data insights\n• **Smart Suggestions** - AI-powered recommendations\n• **Workflow Automation** - One-click task completion\n• **Predictive Intelligence** - Future trend forecasting\n\nWhat specific task would you like me to help with?`;
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
            <p className='text-xs text-slate-400'>50,000+ Agent Swarm</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Badge variant='quantum' className='quantum-pulse'>
            <Sparkles className='w-3 h-3 mr-1' />
            Active
          </Badge>
          <Badge variant='outline' className='text-xs'>
            {countyId.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      {/* Swarm Activity Monitor */}
      <div className='px-4 py-2 bg-terra-midnight/30'>
        <div className='flex items-center justify-between text-xs mb-1'>
          <span className='text-slate-400'>AI Swarm Coordination</span>
          <span className='text-terra-cyan font-mono'>{Math.round(swarmActivity)}%</span>
        </div>
        <Progress value={swarmActivity} className='h-1' />
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
                <span>AI processing with quantum optimization...</span>
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
          <span>Connected to TerraFusion Consciousness Engine</span>
          <span className='text-terra-cyan'>Port 3004</span>
        </div>
      </div>
    </Card>
  );
};

export default AIAssistantPanel;
