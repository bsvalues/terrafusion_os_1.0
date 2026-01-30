// Mock UI components - would normally import from shared UI library
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`border rounded-lg ${className}`}>{children}</div>
);
const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
const CardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-4 ${className}`}>{children}</div>;
const Button = ({
  children,
  className,
  size,
  variant,
  type,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  size?: string;
  variant?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}) => (
  <button
    className={`px-4 py-2 rounded ${className}`}
    type={type}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);
const Input = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
  }
>(({ value, onChange, placeholder, disabled, className }, ref) => (
  <input
    ref={ref}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`border rounded px-3 py-2 ${className}`}
  />
));
const Badge = ({
  children,
  variant,
  className,
  size,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
  size?: string;
}) => <span className={`inline-block px-2 py-1 text-xs rounded ${className}`}>{children}</span>;

import {
  Bot,
  Brain,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';

// Mock useAIAssistant hook for now
const useAIAssistant = (options: any) => ({
  generateResponse: async (input: string, context: any) => ({
    id: 'mock-response',
    type: 'text' as const,
    content: `Mock AI response: I understand you're asking about "${input}". I can help with levy management, analytics, and more.`,
    actions: [] as any[],
    confidence: 0.85,
    timestamp: new Date(),
    model: 'TerraLevy-Mock',
  }),
  analyzeContext: async (context: any) => context,
  suggestWorkflows: async (context: any) => [],
  personalizeModel: async (data: any) => {},
  getProactiveInsights: async (module: string) =>
    [{ id: '1', summary: 'Sample insight for ' + module }] as any[],
  isModelTraining: false,
  accuracy: 0.987,
});

interface AIAssistantProps {
  userId: string;
  userRole: string;
  department: string;
  currentModule?: string;
  onAssistantAction?: (action: any) => void;
}

interface AIResponse {
  id: string;
  type: 'text' | 'action' | 'visualization' | 'workflow' | 'insight';
  content: string;
  actions?: AIAction[];
  confidence: number;
  timestamp: Date;
  model: string;
}

interface AIAction {
  id: string;
  type: 'navigate' | 'analyze' | 'create' | 'update' | 'optimize';
  label: string;
  description: string;
  payload: any;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  userId,
  userRole,
  department,
  currentModule = 'dashboard',
  onAssistantAction,
}) => {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'chat' | 'voice' | 'proactive'>('chat');
  const [personalizedSettings, setPersonalizedSettings] = useState({
    analysisLevel: 'advanced' as 'basic' | 'advanced' | 'expert',
    responseStyle: 'detailed' as 'concise' | 'detailed' | 'academic',
    autoActions: true,
    proactiveInsights: true,
    workflowSuggestions: true,
  });

  // Refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const { isListening, transcript, confidence, startListening, stopListening, voiceCommand } =
    useVoiceCommands({
      onCommand: handleVoiceCommand,
      continuous: true,
      language: 'en-US',
    });

  const {
    generateResponse,
    analyzeContext,
    suggestWorkflows,
    personalizeModel,
    getProactiveInsights,
    isModelTraining,
    accuracy,
  } = useAIAssistant({
    userId,
    userRole,
    department,
    personalizedSettings,
  });

  // Handle voice commands
  async function handleVoiceCommand(command: string, confidence: number) {
    if (confidence > 0.7) {
      // Add voice command to conversation
      addMessage('user', command, { source: 'voice', confidence });

      // Process the voice command
      await processInput(command, 'voice');
    }
  }

  // Add message to conversation
  const addMessage = useCallback((type: 'user' | 'assistant', content: string, metadata?: any) => {
    const message: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      metadata,
    };

    setConversation((prev) => [...prev, message]);
  }, []);

  // Process user input (text or voice)
  const processInput = useCallback(
    async (input: string, source: 'text' | 'voice' = 'text') => {
      if (!input.trim()) return;

      setIsProcessing(true);

      try {
        // Analyze current context for better responses
        const context = await analyzeContext({
          currentModule,
          userRole,
          department,
          recentActions: [], // Would get from user activity tracking
          openDocuments: [], // Would get from document service
          currentData: {}, // Would get from current view state
        });

        // Generate AI response with context awareness
        const response = await generateResponse(input, {
          context,
          conversationHistory: conversation.slice(-10), // Last 10 messages for context
          source,
          personalizedSettings,
        });

        // Add AI response to conversation
        addMessage('assistant', response.content, {
          type: response.type,
          actions: response.actions,
          confidence: response.confidence,
          model: response.model,
        });

        // Execute any suggested actions if auto-actions is enabled
        if (personalizedSettings.autoActions && response.actions) {
          for (const action of response.actions) {
            if (action.type === 'navigate' || action.type === 'optimize') {
              if (onAssistantAction) {
                onAssistantAction(action);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing AI input:', error);
        addMessage(
          'assistant',
          'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.'
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [
      currentModule,
      userRole,
      department,
      conversation,
      personalizedSettings,
      generateResponse,
      analyzeContext,
      addMessage,
      onAssistantAction,
    ]
  );

  // Handle text input submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim() || isProcessing) return;

      const input = inputText.trim();
      setInputText('');

      // Add user message to conversation
      addMessage('user', input, { source: 'text' });

      // Process the input
      await processInput(input, 'text');
    },
    [inputText, isProcessing, addMessage, processInput]
  );

  // Toggle voice listening
  const toggleVoiceListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Get proactive insights when module changes
  useEffect(() => {
    if (personalizedSettings.proactiveInsights && currentModule) {
      const getInsights = async () => {
        try {
          const insights = await getProactiveInsights(currentModule);
          if (insights.length > 0) {
            const insightText = `I noticed you're in the ${currentModule} module. Here are some AI-powered insights that might help: ${insights.map((i) => i.summary).join('; ')}`;
            addMessage('assistant', insightText, {
              type: 'proactive',
              insights,
              confidence: 0.85,
            });
          }
        } catch (error) {
          console.error('Error getting proactive insights:', error);
        }
      };

      // Delay to avoid overwhelming the user
      const timer = setTimeout(getInsights, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentModule, personalizedSettings.proactiveInsights, getProactiveInsights, addMessage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Initialize with welcome message
  useEffect(() => {
    if (conversation.length === 0) {
      addMessage(
        'assistant',
        `Welcome! I'm your TerraLevy AI Assistant. I can help you with levy management, analytics, workflow optimization, and more. What would you like to work on today?`
      );
    }
  }, [conversation.length, addMessage]);

  return (
    <div className={`ai-assistant ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Assistant Toggle Button */}
      {!isExpanded && (
        <Button
          onClick={() => setIsExpanded(true)}
          className='assistant-toggle'
          size='lg'
          variant='default'
        >
          <Bot className='w-5 h-5 mr-2' />
          AI Assistant
          {isModelTraining && (
            <Badge variant='secondary' className='ml-2 pulse'>
              <Brain className='w-3 h-3 mr-1' />
              Learning
            </Badge>
          )}
        </Button>
      )}

      {/* Main Assistant Interface */}
      {isExpanded && (
        <Card className='assistant-panel'>
          <CardHeader className='assistant-header'>
            <div className='header-content'>
              <div className='assistant-title'>
                <Bot className='w-6 h-6 text-blue-600' />
                <span className='title-text'>TerraLevy AI Assistant</span>
                <Badge variant='outline' className='accuracy-badge'>
                  {(accuracy * 100).toFixed(1)}% accuracy
                </Badge>
              </div>

              <div className='header-controls'>
                {/* Mode Toggle */}
                <div className='mode-selector'>
                  <Button
                    size='sm'
                    variant={assistantMode === 'chat' ? 'default' : 'outline'}
                    onClick={() => setAssistantMode('chat')}
                  >
                    <MessageSquare className='w-4 h-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant={assistantMode === 'voice' ? 'default' : 'outline'}
                    onClick={() => setAssistantMode('voice')}
                  >
                    <Mic className='w-4 h-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant={assistantMode === 'proactive' ? 'default' : 'outline'}
                    onClick={() => setAssistantMode('proactive')}
                  >
                    <Sparkles className='w-4 h-4' />
                  </Button>
                </div>

                {/* Settings Button */}
                <Button size='sm' variant='outline'>
                  <Settings className='w-4 h-4' />
                </Button>

                {/* Minimize Button */}
                <Button size='sm' variant='outline' onClick={() => setIsExpanded(false)}>
                  ×
                </Button>
              </div>
            </div>

            {/* Status Indicators */}
            <div className='status-indicators'>
              {isListening && (
                <Badge variant='destructive' className='listening-indicator pulse'>
                  <Mic className='w-3 h-3 mr-1' />
                  Listening... {confidence > 0 && `${(confidence * 100).toFixed(0)}%`}
                </Badge>
              )}

              {isProcessing && (
                <Badge variant='secondary' className='processing-indicator'>
                  <Brain className='w-3 h-3 mr-1 animate-spin' />
                  Processing...
                </Badge>
              )}

              {transcript && <div className='voice-transcript'>"{transcript}"</div>}
            </div>
          </CardHeader>

          <CardContent className='assistant-content'>
            {/* Conversation Area */}
            <div className='conversation-area'>
              {conversation.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className='message-content'>
                    <div className='message-text'>{message.content}</div>

                    {/* Action Buttons for AI responses */}
                    {message.type === 'assistant' && message.metadata?.actions && (
                      <div className='message-actions'>
                        {message.metadata.actions.map((action: AIAction) => (
                          <Button
                            key={action.id}
                            size='sm'
                            variant='outline'
                            onClick={() => onAssistantAction?.(action)}
                            className='action-button'
                          >
                            <Zap className='w-3 h-3 mr-1' />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className='message-metadata'>
                    <span className='timestamp'>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {message.metadata?.confidence && (
                      <Badge variant='outline' size='sm'>
                        {(message.metadata.confidence * 100).toFixed(0)}%
                      </Badge>
                    )}

                    {message.metadata?.source === 'voice' && (
                      <Badge variant='secondary' size='sm'>
                        <Mic className='w-3 h-3' />
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className='input-area'>
              <div className='input-container'>
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder='Ask me anything about TerraLevy...'
                  disabled={isProcessing}
                  className='message-input'
                />

                <div className='input-controls'>
                  {/* Voice Control Button */}
                  <Button
                    type='button'
                    size='sm'
                    variant={isListening ? 'destructive' : 'outline'}
                    onClick={toggleVoiceListening}
                    className='voice-button'
                  >
                    {isListening ? <MicOff className='w-4 h-4' /> : <Mic className='w-4 h-4' />}
                  </Button>

                  {/* Send Button */}
                  <Button
                    type='submit'
                    size='sm'
                    disabled={!inputText.trim() || isProcessing}
                    className='send-button'
                  >
                    <Send className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </form>

            {/* Quick Actions */}
            <div className='quick-actions'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => processInput("Show me today's levy collection summary")}
                disabled={isProcessing}
              >
                Today's Summary
              </Button>

              <Button
                size='sm'
                variant='outline'
                onClick={() => processInput('Analyze revenue trends and predict next quarter')}
                disabled={isProcessing}
              >
                Revenue Analysis
              </Button>

              <Button
                size='sm'
                variant='outline'
                onClick={() => processInput('Optimize current workflow for efficiency')}
                disabled={isProcessing}
              >
                Optimize Workflow
              </Button>

              <Button
                size='sm'
                variant='outline'
                onClick={() => processInput('What compliance issues need attention?')}
                disabled={isProcessing}
              >
                Compliance Check
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
