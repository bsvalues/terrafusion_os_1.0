import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ChatbotEngine, ChatbotMessage, ChatbotAction } from '@/lib/chatbot';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Recommendation, RecommendationPriority, RecommendationStatus } from '@/lib/maintenance/types';
import { 
  AlertCircle, 
  Send, 
  MessageSquare, 
  RefreshCcw,
  Check,
  X,
  ArrowRightCircle,
  Loader2,
  Clock
} from 'lucide-react';

// Props for the ChatInterface component
interface ChatInterfaceProps {
  chatbotEngine: ChatbotEngine;
  onActionClick?: (action: ChatbotAction) => void;
  initialOpen?: boolean;
}

/**
 * Chat Interface component for interacting with the maintenance chatbot
 */
export function ChatInterface({ 
  chatbotEngine, 
  onActionClick,
  initialOpen = false
}: ChatInterfaceProps) {
  // State for the chat UI
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load initial conversation history
  useEffect(() => {
    setMessages(chatbotEngine.getConversationHistory());
  }, [chatbotEngine]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    
    // Show the user message immediately
    const userMessage: ChatbotMessage = {
      text: inputValue,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };
    
    // Update UI with user message
    setMessages([...messages, userMessage]);
    setInputValue('');
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Process the query and get a response
      const response = await chatbotEngine.processQuery(inputValue);
      
      // Remove typing indicator and update messages
      setIsTyping(false);
      setMessages(chatbotEngine.getConversationHistory());
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Remove typing indicator
      setIsTyping(false);
      
      // Show error message
      const errorMessage: ChatbotMessage = {
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        sender: 'assistant',
        error: error instanceof Error ? error.message : 'unknown_error'
      };
      
      setMessages([...messages, userMessage, errorMessage]);
    }
  };
  
  // Handle clicking an action button
  const handleActionClick = async (action: ChatbotAction) => {
    if (onActionClick) {
      onActionClick(action);
    } else {
      // Default handling
      try {
        await chatbotEngine.executeAction(action);
        setMessages(chatbotEngine.getConversationHistory());
      } catch (error) {
        console.error('Error executing action:', error);
      }
    }
  };
  
  // Handle pressing Enter in the input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // Clear the conversation history
  const handleClearConversation = () => {
    chatbotEngine.clearConversationHistory();
    setMessages(chatbotEngine.getConversationHistory());
  };
  
  // Toggle the chat open/closed state
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      <Button
        className="rounded-full w-14 h-14 shadow-lg"
        onClick={toggleChat}
        variant="default"
      >
        <MessageSquare size={24} />
      </Button>
      
      {/* Chat interface */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-96 h-[600px] shadow-xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between px-4 py-2 border-b">
            <CardTitle className="text-lg">Maintenance Assistant</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={handleClearConversation} title="Clear conversation">
                <RefreshCcw size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleChat} title="Close chat">
                <X size={18} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.sender === 'user' 
                      ? 'flex flex-row-reverse' 
                      : message.sender === 'system' 
                        ? 'flex justify-center'
                        : 'flex'
                  }`}
                >
                  {message.sender === 'system' ? (
                    <div className="bg-muted px-3 py-2 rounded-lg text-xs text-muted-foreground">
                      {message.text}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[75%] ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      } rounded-lg px-4 py-2 shadow-sm`}
                    >
                      <div className="text-sm">{message.text}</div>
                      
                      {/* Related recommendations */}
                      {message.relatedRecommendations && message.relatedRecommendations.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.relatedRecommendations.map((rec, recIndex) => (
                            <div key={`${index}-rec-${recIndex}`} className="border rounded p-2 bg-muted bg-opacity-20">
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-sm">{rec.title}</div>
                                <Badge
                                  variant={
                                    rec.priority === RecommendationPriority.HIGH 
                                      ? 'destructive' 
                                      : rec.priority === RecommendationPriority.MEDIUM 
                                        ? 'secondary' 
                                        : 'outline'
                                  }
                                  className="text-[10px]"
                                >
                                  {rec.priority === RecommendationPriority.HIGH 
                                    ? 'High Priority' 
                                    : rec.priority === RecommendationPriority.MEDIUM 
                                      ? 'Medium Priority' 
                                      : 'Low Priority'
                                  }
                                </Badge>
                              </div>
                              <div className="text-xs mt-1">{rec.description}</div>
                              <div className="flex items-center mt-1 text-[10px] text-muted-foreground">
                                <Clock size={10} className="mr-1" />
                                {new Date(rec.timestamp).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.actions.map((action, actionIndex) => (
                            <Button
                              key={`${index}-action-${actionIndex}`}
                              size="sm"
                              variant={
                                action.type === 'status_change' 
                                  ? action.value === RecommendationStatus.RESOLVED 
                                    ? 'default'
                                    : 'outline'
                                  : 'secondary'
                              }
                              className="text-xs py-0 h-7"
                              onClick={() => handleActionClick(action)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-[10px] text-muted-foreground mt-1 text-right">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex mb-4">
                  <div className="bg-card border border-border rounded-lg px-4 py-2 max-w-[75%]" data-testid="typing-indicator">
                    <div className="flex items-center">
                      <Loader2 size={14} className="animate-spin mr-2" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Dummy div for scroll reference */}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="p-3 border-t">
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Type your question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSendMessage} disabled={isTyping}>
                <Send size={18} />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}