/**
 * Terrafusion AI Assistant Interface
 * Intelligent chat interface for government operations guidance
 * Integrates with AIAssistantService, GeniusPromptService, and all backend services
 */

import React, { useState, useEffect, useRef } from 'react';
import { aiAssistant } from './services/AIAssistantService';
import { authService } from './services/AuthenticationService';
import { performanceService } from './services/PerformanceService';
import { notificationService } from './services/NotificationService';
import GeniusPromptService from './services/GeniusPromptService';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  template?: string;
  confidence?: number;
  actions?: any[];
  followUp?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  template: string;
  query: string;
  icon: string;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('government_copilot');
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'deploy-plugin',
      label: 'Deploy Plugin',
      template: 'government_copilot',
      query: 'How do I deploy a plugin to multiple counties?',
      icon: '🚀'
    },
    {
      id: 'check-compliance',
      label: 'Check Compliance',
      template: 'compliance_automation',
      query: 'What is the current compliance status?',
      icon: '✅'
    },
    {
      id: 'validate-plugin',
      label: 'Validate Plugin',
      template: 'plugin_validation_agent',
      query: 'Validate the security of CostForge Professional',
      icon: '🔍'
    },
    {
      id: 'federation-help',
      label: 'Federation Setup',
      template: 'federation_manager',
      query: 'How do I set up federation between counties?',
      icon: '🌐'
    },
    {
      id: 'audit-report',
      label: 'Generate Audit',
      template: 'audit_trail_generator',
      query: 'Generate a compliance audit report',
      icon: '📊'
    },
    {
      id: 'onboarding-help',
      label: 'User Onboarding',
      template: 'user_onboarding',
      query: 'Help me onboard a new county staff member',
      icon: '👥'
    }
  ];

  const templateOptions = [
    { value: 'government_copilot', label: 'Government Copilot', icon: '🏛️' },
    { value: 'plugin_validation_agent', label: 'Plugin Validator', icon: '🔍' },
    { value: 'compliance_automation', label: 'Compliance Assistant', icon: '✅' },
    { value: 'federation_manager', label: 'Federation Manager', icon: '🌐' },
    { value: 'user_onboarding', label: 'Onboarding Helper', icon: '👥' },
    { value: 'audit_trail_generator', label: 'Audit Generator', icon: '📊' },
    { value: 'ai_confidence_explainer', label: 'AI Explainer', icon: '🤖' }
  ];

  useEffect(() => {
    initializeAssistant();
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const initializeAssistant = async () => {
    const user = authService.getCurrentUser();
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      type: 'assistant',
      content: `👋 Hello${user ? ` ${user.firstName}` : ''}! I'm your Terrafusion AI Assistant. I'm here to help you with government operations, plugin management, compliance checks, and more.\n\n**Current Context:**\n- Role: ${user?.role.displayName || 'Guest'}\n- County: ${user?.county || 'Not specified'}\n- Security Level: ${user?.securityClearance || 'Public'}\n\nHow can I assist you today?`,
      timestamp: new Date().toISOString(),
      template: 'government_copilot',
      confidence: 1.0
    };

    setMessages([welcomeMessage]);
    
    // Load conversation history
    const history = aiAssistant.getConversationHistory();
    setConversationHistory(history);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setTypingIndicator(true);

    try {
      // Genius UX: Immediate feedback with delightful animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get genius-enhanced prompt for current context
      const geniusPrompt = GeniusPromptService.getPromptForContext('marketplace', 'guidance');
      
      const response = await aiAssistant.askAssistant({
        template: selectedTemplate,
        userQuery: inputValue,
        priority: 'medium'
      });

      // Enhance response with genius principles
      const enhancedContent = GeniusPromptService.enhanceResponse(
        response.response,
        'government_assistance'
      );

      // Validate genius quality
      const validation = GeniusPromptService.validateGeniusResponse(enhancedContent);
      
      const aiMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: enhancedContent,
        timestamp: new Date().toISOString(),
        confidence: Math.max(response.confidence, validation.score / 100),
        followUp: response.followUp || [
          "✨ How can I make this even more helpful?",
          "🚀 What would you like to explore next?",
          "💡 Would you like me to show you a related feature?"
        ],
        actions: response.actions
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationHistory(prev => [...prev, userMessage, aiMessage]);
      
      // Genius UX: Always provide delightful follow-up options
      setFollowUpSuggestions(aiMessage.followUp || []);

      // Celebrate successful interactions
      if (validation.isGenius && validation.score > 90) {
        notificationService.showNotification({
          type: 'success',
          title: '✨ Magical Response Generated',
          message: 'AI assistance optimized for your delight!',
          duration: 2000
        });
      }

    } catch (error) {
      console.error('AI Assistant error:', error);
      
      // Genius error recovery: Turn problems into opportunities
      const geniusErrorResponse = GeniusPromptService.enhanceResponse(
        "I encountered a temporary challenge, but I'm here to help you succeed. Let me try a different approach that will work perfectly for you.",
        'error_recovery'
      );
      
      const errorMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: geniusErrorResponse,
        timestamp: new Date().toISOString(),
        confidence: 0.8, // Still confident in our ability to help
        followUp: [
          "🔄 Let's try that again with a fresh approach",
          "💡 Would you like me to help in a different way?",
          "🤝 I'm here to ensure your success - what can I do?"
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTypingIndicator(false);
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    setSelectedTemplate(action.template);
    setInputValue(action.query);
    
    // Auto-send the quick action
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleActionClick = async (action: any) => {
    try {
      await action.handler();
      
      const systemMessage: ChatMessage = {
        id: `action-${Date.now()}`,
        type: 'system',
        content: `✅ Action "${action.label}" executed successfully.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `action-error-${Date.now()}`,
        type: 'system',
        content: `❌ Failed to execute action "${action.label}": ${error}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleFollowUpClick = (followUp: string) => {
    setInputValue(followUp);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'var(--tf-text-secondary)';
    if (confidence >= 0.9) return 'var(--tf-success)';
    if (confidence >= 0.7) return 'var(--tf-warning)';
    return 'var(--tf-error)';
  };

  const clearConversation = () => {
    setMessages([]);
    aiAssistant.clearConversationHistory();
    setConversationHistory([]);
    initializeAssistant();
  };

  return (
    <div className={`ai-assistant ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Assistant Toggle Button */}
      <button 
        className="ai-toggle-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Terrafusion AI Assistant"
      >
        <span className="ai-icon">🤖</span>
        {!isExpanded && <span className="ai-label">AI Assistant</span>}
      </button>

      {/* Assistant Panel */}
      {isExpanded && (
        <div className="ai-panel">
          {/* Header */}
          <div className="ai-header">
            <div className="ai-title"><>

              <span className="ai-icon">🤖</span>
              <h3
</>
</>>Terrafusion AI Assistant</h3>
            </div>
            <div className="ai-controls">
              <select 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="template-selector"
                title="Select AI Assistant Mode"
              >
                {templateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select><>

              <button 
                onClick={clearConversation}
                className="clear-btn"
                title="Clear Conversation"
              >
                🗑️
              </button>
              <button
</>

                onClick={() => setIsExpanded(false)}
                className="close-btn"
                title="Close Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions"><>

            <div className="quick-actions-label">Quick Actions:</div>
            <div
</>
className="quick-actions-grid">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action)}
                  title={action.query}
                ><>

                  <span className="action-icon">{action.icon}</span>
                  <span
</>
className="action-label">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  <div className="message-text">
                    {message.content.split('\n').map((line /* , index */) => (
                      <div key={index}>
                        {line.startsWith('##') ? (
                          <h4 className="message-heading">{line.replace('##', '').trim()}</h4>
                        ) : line.startsWith('**') && line.endsWith('**') ? (
                          <strong>{line.replace(/\*\*/g, '')}</strong>
                        ) : (
                          line
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Message Metadata */}
                  <div className="message-meta">
                    <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                    {message.confidence && (
                      <span 
                        className="message-confidence"
                        style={{ color: getConfidenceColor(message.confidence) }}
                      >
                        {(message.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                    {message.template && (
                      <span className="message-template">{message.template}</span>
                    )}
                  </div>

                  {/* Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="message-actions">
                      {message.actions.map(action => (
                        <button
                          key={action.id}
                          className="action-btn"
                          onClick={() => handleActionClick(action)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Questions */}
                  {message.followUp && message.followUp.length > 0 && (
                    <div className="follow-up-questions">
                      <div className="follow-up-label">Suggested follow-ups:</div>
                      {message.followUp.map((followUp /* , index */) => (
                        <button
                          key={index}
                          className="follow-up-btn"
                          onClick={() => handleFollowUpClick(followUp)}
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant loading">
                <div className="message-content">
                  <div className="typing-indicator"><>

                    <span></span>
                    <span
</>
</>></span>
                    <span></span>
                  </div>
                  <div className="message-text">AI Assistant is thinking...</div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-input">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about government operations, compliance, plugins..."
                className="message-input"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="send-btn"
                title="Send Message"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
            
            <div className="input-help"><>

              <span className="current-mode">
                Mode: {templateOptions.find(t => t.value === selectedTemplate)?.label}
              </span>
              <span
</>
className="input-hint">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
