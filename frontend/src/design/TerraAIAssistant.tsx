/**
 * ═══════════════════════════════════════════════════════════════
 * TERRA AI OPERATIONS ASSISTANT
 * Revolutionary Government AI with Natural Language Processing
 * THE TERRAFUSION WAY - ELITE ENGINEERING EXCELLENCE
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { TerraPanel, TerraSphere, useTerraFlow } from './TerraFlowEngine';

// Advanced AI Assistant Types
interface AIMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  confidence?: number;
  attachments?: AIAttachment[];
  suggestedActions?: SuggestedAction[];
}

interface AIAttachment {
  type: 'data' | 'chart' | 'report' | 'image';
  title: string;
  description: string;
  data?: any;
  url?: string;
}

interface SuggestedAction {
  id: string;
  label: string;
  action: string;
  category: 'property' | 'tax' | 'gis' | 'analysis' | 'reporting';
  confidence: number;
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  category: 'assessment' | 'analysis' | 'automation' | 'reporting';
  status: 'available' | 'processing' | 'offline';
  accuracy: number;
}

/**
 * Revolutionary AI Operations Assistant
 * Natural language government operations interface
 */
export const TerraAIAssistant: React.FC = () => {
  const { metrics } = useTerraFlow();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'system',
      content:
        'TerraFusion AI Operations Assistant initialized. I can help with property assessments, tax calculations, GIS analysis, and advanced data operations.',
      timestamp: Date.now() - 300000,
      confidence: 0.98,
    },
    {
      id: '2',
      type: 'assistant',
      content:
        "Hello! I'm your AI Government Operations Assistant. I have access to CAMA property data, GIS systems, tax calculations, and predictive analytics. How can I help you today?",
      timestamp: Date.now() - 240000,
      confidence: 0.95,
      suggestedActions: [
        {
          id: 'assess',
          label: 'Assess Properties',
          action: 'Start property assessment workflow',
          category: 'property',
          confidence: 0.92,
        },
        {
          id: 'analyze',
          label: 'Market Analysis',
          action: 'Run market trend analysis',
          category: 'analysis',
          confidence: 0.89,
        },
        {
          id: 'reports',
          label: 'Generate Reports',
          action: 'Create government reports',
          category: 'tax',
          confidence: 0.94,
        },
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCapabilities, setActiveCapabilities] = useState<AICapability[]>([
    {
      id: 'nlp',
      name: 'Natural Language Processing',
      description: 'Understand and process complex government queries',
      category: 'analysis',
      status: 'available',
      accuracy: 0.96,
    },
    {
      id: 'cama',
      name: 'CAMA Integration',
      description: 'Computer-Assisted Mass Appraisal operations',
      category: 'assessment',
      status: 'available',
      accuracy: 0.94,
    },
    {
      id: 'gis',
      name: 'GIS Analysis',
      description: 'Geographic Information System processing',
      category: 'analysis',
      status: 'available',
      accuracy: 0.91,
    },
    {
      id: 'tax',
      name: 'Tax Calculations',
      description: 'Automated tax levy and assessment calculations',
      category: 'assessment',
      status: 'available',
      accuracy: 0.98,
    },
    {
      id: 'prediction',
      name: 'Predictive Analytics',
      description: 'Market trends and valuation predictions',
      category: 'analysis',
      status: 'available',
      accuracy: 0.87,
    },
    {
      id: 'automation',
      name: 'Process Automation',
      description: 'Automated workflow execution',
      category: 'automation',
      status: 'available',
      accuracy: 0.93,
    },
  ]);

  // Sample AI responses for different query types
  const aiResponses = {
    property: [
      'I can help you assess properties using our CAMA system. Would you like to analyze a specific parcel ID or run a batch assessment?',
      'Property assessment complete. The estimated market value is $284,500 based on recent comparable sales and property characteristics.',
      'I found 23 properties in your search area. The average assessed value is $312,000 with a 12% increase from last year.',
    ],
    tax: [
      'Tax levy calculations are ready. The total assessed value for the district is $2.3B with an effective rate of 1.24%.',
      "I've generated the annual tax roll. Would you like me to export it in PDF format or send it directly to the state portal?",
      'Revenue projections show a 8.5% increase in tax collections based on current assessment trends.',
    ],
    gis: [
      "GIS analysis complete. I've identified 156 parcels within the flood zone boundary that may need reassessment.",
      'Spatial data shows strong correlation between proximity to transit and property values (+15% within 0.5 miles).',
      'Map layers updated. The new zoning boundaries affect 89 commercial properties in the downtown district.',
    ],
    general: [
      'I can help with property assessments, tax calculations, GIS analysis, report generation, and data analytics. What would you like to work on?',
      'Based on your recent activity, you might want to review the pending appeal cases or run the quarterly market analysis.',
      'System performance is optimal. All modules are functioning normally with 94% AI confidence in current operations.',
    ],
  };

  // Handle message sending
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(
      () => {
        const messageType = inputText.toLowerCase().includes('property')
          ? 'property'
          : inputText.toLowerCase().includes('tax')
            ? 'tax'
            : inputText.toLowerCase().includes('gis') || inputText.toLowerCase().includes('map')
              ? 'gis'
              : 'general';

        const responses = aiResponses[messageType];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: randomResponse,
          timestamp: Date.now(),
          confidence: 0.85 + Math.random() * 0.12,
          suggestedActions:
            messageType === 'property'
              ? [
                  {
                    id: 'detailed',
                    label: 'Detailed Assessment',
                    action: 'Run comprehensive property analysis',
                    category: 'property',
                    confidence: 0.89,
                  },
                  {
                    id: 'comparable',
                    label: 'Find Comparables',
                    action: 'Search for comparable properties',
                    category: 'analysis',
                    confidence: 0.91,
                  },
                ]
              : messageType === 'tax'
                ? [
                    {
                      id: 'export',
                      label: 'Export Report',
                      action: 'Generate tax report PDF',
                      category: 'reporting',
                      confidence: 0.94,
                    },
                  ]
                : undefined,
        };

        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      },
      1500 + Math.random() * 1000
    );
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle suggested actions
  const handleSuggestedAction = (action: SuggestedAction) => {
    const actionMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Execute: ${action.label}`,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, actionMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Executing ${action.label}... Operation completed successfully with ${Math.round(action.confidence * 100)}% confidence.`,
        timestamp: Date.now(),
        confidence: action.confidence,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getCapabilityColor = (status: string, accuracy: number) => {
    if (status !== 'available') return 'text-amber-400';
    if (accuracy > 0.9) return 'text-emerald-400';
    if (accuracy > 0.8) return 'text-cyan-400';
    return 'text-slate-400';
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6'>
      {/* Header */}
      <div className='mb-8 flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <TerraSphere systemHealth={metrics.aiConfidence} size='lg' variant='quantum' />
          <div>
            <h1 className='text-3xl font-bold text-white'>AI Operations Assistant</h1>
            <p className='text-slate-400'>Natural language government operations interface</p>
          </div>
        </div>

        <div className='flex items-center space-x-6'>
          <div className='text-right'>
            <div className='text-sm text-slate-400'>AI Confidence</div>
            <div className='text-2xl font-bold text-cyan-400'>
              {Math.round(metrics.aiConfidence * 100)}%
            </div>
          </div>
          <div className='text-right'>
            <div className='text-sm text-slate-400'>Active Modules</div>
            <div className='text-2xl font-bold text-emerald-400'>
              {activeCapabilities.filter((c) => c.status === 'available').length}
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
        {/* Main Chat Interface */}
        <div className='xl:col-span-3'>
          <TerraPanel className='h-[600px] flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>AI Operations Console</h3>
              <div className='flex items-center space-x-2'>
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isTyping ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  )}
                />
                <span className='text-xs text-slate-400'>
                  {isTyping ? 'AI Thinking...' : 'Ready'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className='flex-1 overflow-y-auto space-y-4 mb-4'>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex', message.type === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg p-4',
                      message.type === 'user'
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
                        : message.type === 'system'
                          ? 'bg-slate-700/30 border border-slate-600/30 text-slate-300'
                          : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-100'
                    )}
                  >
                    <div className='text-sm mb-2'>{message.content}</div>

                    <div className='flex items-center justify-between text-xs text-slate-400'>
                      <span>{formatTimestamp(message.timestamp)}</span>
                      {message.confidence && (
                        <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                      )}
                    </div>

                    {/* Suggested Actions */}
                    {message.suggestedActions && (
                      <div className='mt-3 space-y-2'>
                        <div className='text-xs text-slate-400'>Suggested actions:</div>
                        <div className='flex flex-wrap gap-2'>
                          {message.suggestedActions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleSuggestedAction(action)}
                              className='px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded text-slate-300 transition-all'
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className='flex justify-start'>
                  <div className='bg-slate-700/30 border border-slate-600/30 rounded-lg p-4'>
                    <div className='flex space-x-1'>
                      <div className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' />
                      <div
                        className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className='flex space-x-3'>
              <input
                type='text'
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder='Ask me anything about property assessments, tax calculations, GIS analysis...'
                className='flex-1 p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none'
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isTyping}
                className='px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:bg-slate-700/50 border border-cyan-500/30 disabled:border-slate-600/30 rounded-lg text-cyan-300 disabled:text-slate-500 transition-all'
              >
                Send
              </button>
            </div>
          </TerraPanel>
        </div>

        {/* AI Capabilities Panel */}
        <div className='space-y-6'>
          <TerraPanel>
            <h3 className='text-lg font-semibold text-white mb-4'>AI Capabilities</h3>
            <div className='space-y-3'>
              {activeCapabilities.map((capability) => (
                <div key={capability.id} className='terra-glass p-3 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-medium text-white text-sm'>{capability.name}</h4>
                    <span
                      className={cn(
                        'text-xs',
                        getCapabilityColor(capability.status, capability.accuracy)
                      )}
                    >
                      {capability.status.toUpperCase()}
                    </span>
                  </div>
                  <p className='text-xs text-slate-400 mb-2'>{capability.description}</p>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-slate-500'>{capability.category}</span>
                    <span className='text-xs text-emerald-400'>
                      {Math.round(capability.accuracy * 100)}% accuracy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TerraPanel>

          {/* Quick Commands */}
          <TerraPanel>
            <h3 className='text-lg font-semibold text-white mb-4'>Quick Commands</h3>
            <div className='space-y-2'>
              <button
                onClick={() => setInputText('Show me the property assessment status')}
                className='w-full p-2 text-left text-sm bg-slate-700/30 hover:bg-slate-600/30 border border-slate-600/30 rounded text-slate-300 transition-all'
              >
                📊 Assessment Status
              </button>
              <button
                onClick={() => setInputText('Generate monthly tax report')}
                className='w-full p-2 text-left text-sm bg-slate-700/30 hover:bg-slate-600/30 border border-slate-600/30 rounded text-slate-300 transition-all'
              >
                📈 Monthly Reports
              </button>
              <button
                onClick={() => setInputText('Analyze market trends for residential properties')}
                className='w-full p-2 text-left text-sm bg-slate-700/30 hover:bg-slate-600/30 border border-slate-600/30 rounded text-slate-300 transition-all'
              >
                🏠 Market Analysis
              </button>
              <button
                onClick={() => setInputText('Check for properties needing reassessment')}
                className='w-full p-2 text-left text-sm bg-slate-700/30 hover:bg-slate-600/30 border border-slate-600/30 rounded text-slate-300 transition-all'
              >
                🔍 Reassessment Queue
              </button>
            </div>
          </TerraPanel>
        </div>
      </div>
    </div>
  );
};

export default TerraAIAssistant;
