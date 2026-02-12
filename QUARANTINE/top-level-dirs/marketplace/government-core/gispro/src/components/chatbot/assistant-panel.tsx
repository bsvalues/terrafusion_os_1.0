import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  Mic,
  MicOff,
  Settings,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle
} from '@mui/icons-material';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'error';
  feedback?: 'positive' | 'negative';
  suggestions?: string[];
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

interface AssistantPanelProps {
  open?: boolean;
  onClose?: () => void;
  context?: any;
  features?: {
    voiceInput?: boolean;
    suggestions?: boolean;
    feedback?: boolean;
    copyResponses?: boolean;
  };
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({
  open = true,
  onClose,
  context,
  features = {
    voiceInput: true,
    suggestions: true,
    feedback: true,
    copyResponses: true
  }
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationCount, setConversationCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Predefined suggestions based on context
  const contextSuggestions = [
    "Explain this analysis result",
    "What are the key insights here?",
    "How can I improve this data?",
    "Generate a summary report",
    "What patterns do you see?",
    "Suggest next steps",
    "Help me understand the trends",
    "Create visualization recommendations"
  ];

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome-1',
        content: `Hello! I'm your GIS Analysis Assistant. I can help you understand your data, generate insights, create reports, and answer questions about geospatial analysis. How can I assist you today?`,
        role: 'assistant',
        timestamp: new Date(),
        status: 'delivered',
        suggestions: contextSuggestions.slice(0, 4)
      };
      setMessages([welcomeMessage]);
      setSuggestions(contextSuggestions);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending messages
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setAssistantThinking(true);

    // Simulate API delay and thinking
    setTimeout(async () => {
      try {
        const response = await generateAssistantResponse(content, context);
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          content: response.content,
          role: 'assistant',
          timestamp: new Date(),
          status: 'delivered',
          suggestions: response.suggestions,
          metadata: {
            tokens: response.tokens,
            model: 'TerraFusion-AI-v2',
            processingTime: response.processingTime
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
        setSuggestions(response.suggestions || []);
        setConversationCount(prev => prev + 1);
        
      } catch (error) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
          status: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
        setAssistantThinking(false);
      }
    }, 1000 + Math.random() * 2000);
  };

  // Generate assistant response (mock)
  const generateAssistantResponse = async (userInput: string, analysisContext: any) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses = {
      explanation: [
        "Based on your analysis, I can see several interesting patterns in the data. The spatial distribution shows clustering in the northwestern region, which could indicate underlying geographic or demographic factors.",
        "Looking at your geospatial analysis, the results suggest strong correlation between proximity to urban centers and the measured values. This is a common pattern in geographic data analysis.",
        "Your analysis reveals temporal trends that align with seasonal patterns. The peak values occur during summer months, which is consistent with climate-driven variations."
      ],
      insights: [
        "Key insights from your data: 1) Strong spatial autocorrelation indicating geographic clustering, 2) Temporal seasonality with 23% variance explained by time, 3) Outliers concentrated in specific regions suggesting localized factors.",
        "The analysis reveals three distinct clusters with different characteristics. The northern cluster shows higher density values, while southern regions display more dispersed patterns.",
        "Notable trends include a 15% increase in values over the analyzed period, with significant hotspots emerging near transportation corridors."
      ],
      recommendations: [
        "I recommend collecting additional data points in the identified gap areas to improve spatial coverage. Consider temporal sampling to capture seasonal variations.",
        "For better results, try adjusting the spatial resolution and applying smoothing algorithms to reduce noise. Cross-validation with external datasets could strengthen findings.",
        "Consider implementing a multi-scale analysis approach. The current resolution might be missing important local variations that could provide additional insights."
      ],
      summary: [
        "Analysis Summary: Your geospatial study covers 1,247 data points across a 50km² area. Key findings include spatial clustering (Moran's I = 0.34), temporal trends (+2.3% annually), and three distinct geographic zones with varying characteristics.",
        "Executive Summary: The analysis identifies significant spatial patterns with 78% accuracy. Primary clusters align with topographic features, suggesting environmental drivers. Recommend expanding sampling in underrepresented areas.",
        "Results Overview: Strong correlation between location and measured values (r² = 0.67). Hotspot analysis reveals 5 primary clusters accounting for 45% of total variation. Temporal analysis shows seasonal peaks in Q2/Q3."
      ]
    };

    const categories = Object.keys(responses);
    const category = categories[Math.floor(Math.random() * categories.length)] as keyof typeof responses;
    const responseTexts = responses[category];
    const selectedResponse = responseTexts[Math.floor(Math.random() * responseTexts.length)];

    const responseSuggestions = [
      "Tell me more about this pattern",
      "What are the implications?",
      "How can I validate these findings?",
      "Generate a detailed report",
      "What should I do next?",
      "Show me similar examples"
    ];

    return {
      content: selectedResponse,
      suggestions: responseSuggestions.slice(0, 3),
      tokens: Math.floor(Math.random() * 200) + 50,
      processingTime: Math.floor(Math.random() * 2000) + 500
    };
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handle voice input
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      setIsListening(false);
      // Stop speech recognition
    } else {
      setIsListening(true);
      // Start speech recognition
      setTimeout(() => {
        setIsListening(false);
        setInputMessage("Sample voice input: Analyze the spatial distribution");
      }, 3000);
    }
  };

  // Copy message content
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  // Handle message feedback
  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setConversationCount(0);
    setSuggestions(contextSuggestions);
    // Re-initialize with welcome message
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: 'welcome-new',
        content: "I'm ready to help with your new analysis. What would you like to explore?",
        role: 'assistant',
        timestamp: new Date(),
        status: 'delivered',
        suggestions: contextSuggestions.slice(0, 4)
      };
      setMessages([welcomeMessage]);
    }, 500);
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get status icon
  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending': return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent': return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case 'delivered': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
            {conversationCount > 0 && (
              <Badge variant="outline">{conversationCount} exchanges</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={clearConversation}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button size="sm" variant="outline" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
        
        {assistantThinking && (
          <Alert className="border-blue-200 bg-blue-50">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              AI is analyzing your request...
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[85%] ${
                  message.role === 'user' ? 'order-1' : ''
                }`}>
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Message metadata */}
                    <div className={`flex items-center justify-between mt-2 text-xs ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatTime(message.timestamp)}</span>
                      <div className="flex items-center gap-2">
                        {message.metadata?.processingTime && (
                          <span>{message.metadata.processingTime}ms</span>
                        )}
                        {getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>

                  {/* Message actions */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-1">
                      {features.copyResponses && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {features.feedback && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={`h-6 px-2 ${
                              message.feedback === 'positive' ? 'text-green-600' : ''
                            }`}
                            onClick={() => handleFeedback(message.id, 'positive')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={`h-6 px-2 ${
                              message.feedback === 'negative' ? 'text-red-600' : ''
                            }`}
                            onClick={() => handleFeedback(message.id, 'negative')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs mr-1 mb-1"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-600">
                      <User className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Suggestions */}
        {features.suggestions && suggestions.length > 0 && !isTyping && (
          <div className="flex-shrink-0">
            <Separator className="mb-3" />
            <div className="flex flex-wrap gap-1">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about your analysis..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputMessage);
                  }
                }}
                disabled={isTyping}
              />
              
              {features.voiceInput && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={`absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 ${
                    isListening ? 'text-red-600' : 'text-gray-400'
                  }`}
                  onClick={toggleVoiceInput}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            <Button 
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isTyping}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {isListening && (
            <Alert className="border-red-200 bg-red-50">
              <Mic className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Listening... Speak now
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssistantPanel;
