/**
 * TerraFusion Native Shell - AI Drawer
 * Mode-adaptive AI assistant with suite-specific agent injection
 */

import React, { useEffect, useState } from 'react';
import { useDualMode } from './DualModeContext';
import { suiteRegistry } from './SuiteRegistry';
import { AIAgent, AIMessage } from './types';

interface AIDrawerProps {
  activeSuiteId?: string;
}

export const AIDrawer: React.FC<AIDrawerProps> = ({ activeSuiteId }) => {
  const { isCountyStaff, isPowerUser } = useDualMode();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [activeAgents, setActiveAgents] = useState<AIAgent[]>([]);

  // Update agents when suite changes
  useEffect(() => {
    if (activeSuiteId) {
      const suite = suiteRegistry.getSuite(activeSuiteId);
      if (suite) {
        setActiveAgents(suite.manifest.aiAgents);

        // Auto-open drawer with welcome message
        const welcomeMessage: AIMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: isCountyStaff
            ? `Hi! I'm here to help with ${suite.manifest.label}. What would you like to do?`
            : `${suite.manifest.label} suite activated. ${suite.manifest.aiAgents.length} AI agents available. How can I assist?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setIsOpen(true);
      }
    }
  }, [activeSuiteId, isCountyStaff]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate AI response (in production, call backend AI service)
    setTimeout(() => {
      const response = generateModeAwareResponse(input, isCountyStaff, activeAgents);
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        agentId: activeAgents[0]?.id,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen ? 'rotate-180' : ''
        }`}
        title='AI Assistant'
      >
        <span className='text-2xl'>{isOpen ? '✕' : '🤖'}</span>
      </button>

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 z-30 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-cyan-900 to-blue-900 p-4 border-b border-slate-700'>
          <h2 className='text-xl font-bold text-white mb-1'>AI Assistant</h2>
          <p className='text-sm text-slate-300'>
            {isCountyStaff ? 'Here to guide you' : `${activeAgents.length} agents active`}
          </p>
        </div>

        {/* Active Agents */}
        {isPowerUser && activeAgents.length > 0 && (
          <div className='bg-slate-800/50 p-3 border-b border-slate-700'>
            <div className='text-xs text-slate-400 mb-2'>ACTIVE AGENTS</div>
            <div className='flex flex-wrap gap-2'>
              {activeAgents.map((agent) => (
                <div
                  key={agent.id}
                  className='px-2 py-1 bg-slate-700 rounded text-xs text-slate-300'
                  title={agent.capabilities.join(', ')}
                >
                  {agent.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          className='flex-1 overflow-y-auto p-4 space-y-4'
          style={{ height: 'calc(100% - 200px)' }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-100'
                }`}
              >
                {msg.role === 'assistant' && isPowerUser && msg.agentId && (
                  <div className='text-xs text-slate-400 mb-1'>
                    {activeAgents.find((a) => a.id === msg.agentId)?.name}
                  </div>
                )}
                <p className='text-sm'>{msg.content}</p>
                <div className='text-xs opacity-50 mt-1'>{msg.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className='absolute bottom-0 left-0 right-0 p-4 bg-slate-800 border-t border-slate-700'>
          <div className='flex gap-2'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isCountyStaff ? 'Ask me anything...' : 'Query AI agents...'}
              className='flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500'
            />
            <button
              onClick={handleSendMessage}
              className='px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all'
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Generate mode-aware AI responses
 */
function generateModeAwareResponse(
  input: string,
  isCountyStaff: boolean,
  agents: AIAgent[]
): string {
  const lowerInput = input.toLowerCase();

  if (isCountyStaff) {
    // County Staff Mode: Friendly, step-by-step guidance
    if (lowerInput.includes('levy')) {
      return "I can help you with levy operations! Here's what we can do:\n\n1️⃣ Explain levy calculations\n2️⃣ Review district boundaries\n3️⃣ Check DOR reports\n\nWhich would you like to start with?";
    }
    if (lowerInput.includes('assessment')) {
      return "Let's work on assessments together! I can help you:\n\n✓ Review property values\n✓ Compare similar properties\n✓ Document your decisions\n\nWhat would you like to do first?";
    }
    return "I'm here to help! Can you tell me more about what you need? I can assist with assessments, levies, GIS, and more.";
  } else {
    // Power User Mode: Technical depth, data-driven
    if (lowerInput.includes('levy')) {
      return `Levy analysis available from ${agents.find((a) => a.id.includes('levy'))?.name || 'levy agents'}.\n\nCapabilities:\n${agents
        .filter((a) => a.id.includes('levy'))
        .map((a) => `• ${a.capabilities.join('\n• ')}`)
        .join(
          '\n'
        )}\n\nProvide specific levy calculation parameters or query residual distributions.`;
    }
    if (lowerInput.includes('assessment')) {
      return `Assessment engines online. ${agents.filter((a) => a.id.includes('assessment')).length} agents available.\n\nAnalytical options:\n• SHAP value analysis\n• Distribution validation\n• Valuation model comparison\n• Market trend correlation\n\nSpecify analysis type or provide parcel ID for targeted review.`;
    }
    return `${agents.length} AI agents active. Query format: [agent-name] [capability] [parameters]\n\nAvailable agents:\n${agents.map((a) => `• ${a.name}: ${a.capabilities.slice(0, 2).join(', ')}`).join('\n')}`;
  }
}
