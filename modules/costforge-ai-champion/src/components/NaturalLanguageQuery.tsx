import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { aiService, NaturalLanguageQueryResponse } from '../services/AIService';
import { MessageSquare, 
  Send, 
  Loader2, 
  Lightbulb, 
  HelpCircle,
  Bot,
  User,
  TrendingUp,
  FileText,
  CheckCircle,
  ArrowRight
 } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestedActions?: Array<{
    action: string;
    description: string;
    parameters?: Record<string, any>;
  }>;
  relatedQueries?: string[];
}

export default function NaturalLanguageQuery() {
  const { toast } = useToast();
  const [query, setQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI assistant for government building cost analysis. I can help you understand construction costs, compliance requirements, and provide detailed analysis. Ask me anything about building costs, regulations, or project planning.",
      timestamp: new Date(),
      confidence: 1.0,
      suggestedActions: [],
      relatedQueries: [
        "What factors affect government building costs?",
        "How do I ensure FISMA compliance for my project?",
        "What are typical costs for healthcare facilities?"
      ]
    }
  ]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a question about building costs or compliance",
        variant: "destructive",
      });
      return;
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsProcessing(true);
    
    try {
      // Process query through AI service
      const response = await aiService.processNaturalLanguageQuery({
        query,
        context: {
          // Could include previous conversation context
        }
      });
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        suggestedActions: response.suggestedActions,
        relatedQueries: response.relatedQueries,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      toast({
        title: "Analysis Complete",
        description: `AI has processed your query with ${(response.confidence * 100).toFixed(0)}% confidence`,
      });
      
    } catch (error) {
      toast({
        title: "Query Processing Failed",
        description: error instanceof Error ? error.message : "Unable to process your query at this time",
        variant: "destructive",
      });
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your query right now. Please try rephrasing your question or contact support if the issue persists.",
        timestamp: new Date(),
        confidence: 0,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
  };
  
  const handleSuggestedAction = (action: any) => {
    toast({
      title: "Action Triggered",
      description: `Initiating: ${action.description}`,
      variant: "default",
    });
    // Here you would trigger the appropriate action
    // For example, opening the cost prediction form, compliance checker, etc.
  };
  
  const predefinedQuestions = [
    "What are the typical costs for a 50,000 sq ft government office building?",
    "How do regional factors affect construction costs?",
    "What compliance requirements apply to healthcare facilities?",
    "How do I calculate lifecycle costs for government projects?",
    "What are the key cost drivers for educational buildings?",
    "How do sustainability requirements impact project costs?"
  ];
  
  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Assistant - Natural Language Query
          <Badge variant="secondary" className="ml-2">
            <Bot className="h-3 w-3 mr-1" />
            Government AI
          </Badge>
        </CardTitle>
        <CardDescription>
          Ask questions about building costs, compliance requirements, and project analysis in natural language.
          The AI assistant understands context and provides government-grade insights.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg border">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-primary' : 'bg-emerald-500'
                }`}>
                  {message.type === 'user' ? 
                    <User className="h-4 w-4 text-white" /> : 
                    <Bot className="h-4 w-4 text-white" />
                  }
                </div>
                
                {/* Message Content */}
                <div className={`space-y-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* Confidence Score for Assistant Messages */}
                    {message.type === 'assistant' && message.confidence !== undefined && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3" />
                        <span>{(message.confidence * 100).toFixed(0)}% Confidence</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Suggested Actions */}
                  {message.type === 'assistant' && message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="space-y-2"><>

                      <p className="text-xs font-medium text-muted-foreground">Suggested Actions:</p>
                      <div
</> className="flex flex-wrap gap-2">
                        {message.suggestedActions.map((action /* , index */) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestedAction(action)}
                            className="text-xs h-7"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {action.description}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Related Queries */}
                  {message.type === 'assistant' && message.relatedQueries && message.relatedQueries.length > 0 && (
                    <div className="space-y-2"><>

                      <p className="text-xs font-medium text-muted-foreground">Related Questions:</p>
                      <div
</> className="space-y-1">
                        {message.relatedQueries.map((relatedQuery /* , index */) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuggestedQuery(relatedQuery)}
                            className="text-xs h-auto p-2 text-left justify-start whitespace-normal"
                          >
                            <HelpCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            {relatedQuery}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><>

                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div
</> className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is analyzing your query...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Predefined Questions */}
        <div className="space-y-2"><>

          <p className="text-sm font-medium text-muted-foreground">Quick Start Questions:</p>
          <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {predefinedQuestions.slice(0, 4).map((question /* , index */) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuery(question)}
                className="text-xs h-auto p-2 text-left justify-start whitespace-normal"
              >
                <Lightbulb className="h-3 w-3 mr-1 flex-shrink-0" />
                {question}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Query Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me about building costs, compliance, or project requirements..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isProcessing || !query.trim()}
            className="px-4"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Bot className="h-3 w-3 mr-1" />
          <span>Terrafusion OS - Government AI Assistant</span>
        </div>
        <div className="flex items-center">
          <FileText className="h-3 w-3 mr-1" />
          <span>Natural Language Processing Enabled</span>
        </div>
      </CardFooter>
    </Card>
  );
}