import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MessageCircleQuestion, 
  Send, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Loader2,
  HelpCircle
 } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

// Define message interface
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

// Define context data structure
interface ContextData {
  [key: string]: {
    title: string;
    initialContext: string;
    suggestedQuestions: string[];
  };
}

// Context data map that provides context-specific help based on the current route
const contextData: ContextData = {
  '/': {
    title: 'Dashboard Help',
    initialContext: 'Welcome to the Benton County Assessor GIS Workflow Assistant! This dashboard provides an overview of your workflows, documents, and parcel management tasks. How can I help you today?',
    suggestedQuestions: [
      'How do I start a new workflow?',
      'Where can I find my recent documents?',
      'How do I view my assigned parcels?',
      'What do the different workflow statuses mean?'
    ]
  },
  '/workflow': {
    title: 'Workflow Help',
    initialContext: 'This is the workflow management area where you can create, track, and manage all property-related workflows. Each workflow represents a process like boundary line adjustments, short plats, or long plats.',
    suggestedQuestions: [
      'How do I create a new boundary line adjustment workflow?',
      'What checklist items are required for completion?',
      'How do I attach documents to a workflow?',
      'Can I assign a workflow to another user?'
    ]
  },
  '/map-viewer': {
    title: 'Map Viewer Help',
    initialContext: 'The map viewer allows you to visualize and interact with geographic data, property boundaries, and parcels. You can toggle different layers, measure areas, and search for specific parcels.',
    suggestedQuestions: [
      'How do I search for a specific parcel?',
      'How do I measure the area of a property?',
      'Can I print or export this map?',
      'How do I change the visible layers?'
    ]
  },
  '/documents': {
    title: 'Document Management Help',
    initialContext: 'The document management system helps you organize, classify, and link documents to parcels and workflows. Documents are automatically classified when uploaded.',
    suggestedQuestions: [
      'How do I upload a new document?',
      'How do I link a document to a parcel?',
      'What document formats are supported?',
      'How does automatic classification work?'
    ]
  },
  '/reports': {
    title: 'Reports Help',
    initialContext: 'The reporting system allows you to generate standardized reports, schedule recurring reports, and export data in various formats for analysis and compliance purposes.',
    suggestedQuestions: [
      'How do I create a new SM00 report?',
      'Can I schedule a report to run monthly?',
      'What export formats are available?',
      'How do I share a report with colleagues?'
    ]
  },
  '/property-search': {
    title: 'Property Search Help',
    initialContext: 'The property search tool allows you to find parcels by address, parcel number, or owner name. Search results provide quick access to property details and related workflows.',
    suggestedQuestions: [
      'How do I search for multiple properties at once?',
      'Can I export my search results?',
      'How do I view the history of a property?',
      'What does the zoning information mean?'
    ]
  }
};

// Default context for pages without specific context
const defaultContext = {
  title: 'General Help',
  initialContext: 'Welcome to the Benton County Assessor GIS Workflow Assistant! I\'m here to help you navigate and use the application effectively. What would you like to know?',
  suggestedQuestions: [
    'How do I navigate between different sections?',
    'What types of workflows can I manage here?',
    'Where can I find documentation?',
    'How do I get additional support?'
  ]
};

function ContextAssistant() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Get context data based on current route
  const getContextForRoute = () => {
    // Extract base route from location
    const baseRoute = '/' + location.split('/')[1];
    return contextData[baseRoute] || defaultContext;
  };
  
  // Add initial welcome message from assistant when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const context = getContextForRoute();
      const initialMessage: Message = {
        id: uuidv4(),
        content: context.initialContext,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, messages.length]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Create and add user message
    const userMessage: Message = {
      id: uuidv4(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // In a real implementation, we would call an API here
      // For now, we'll simulate a response after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple response logic based on user input (would be replaced by AI in production)
      let responseContent = '';
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('workflow') && (lowerInput.includes('create') || lowerInput.includes('new') || lowerInput.includes('start'))) {
        responseContent = 'To create a new workflow, go to the Workflows page and click the "+ New Workflow" button in the top-right corner. You\'ll need to select the workflow type (e.g., Boundary Line Adjustment, Short Plat) and fill in the initial details before creating it.';
      } else if (lowerInput.includes('document') && (lowerInput.includes('upload') || lowerInput.includes('add'))) {
        responseContent = 'To upload a document, navigate to the Documents page and use the "Upload Document" button. The system supports PDF, TIFF, JPEG, and PNG formats. Once uploaded, the document will be automatically classified and you can link it to the relevant parcel or workflow.';
      } else if (lowerInput.includes('report') && (lowerInput.includes('generate') || lowerInput.includes('create'))) {
        responseContent = 'To generate a report, go to the Reports page and select the report type you need. Fill in the required parameters (date range, workflow types, etc.) and click "Generate Report". You can then view, download, or schedule the report for recurring generation.';
      } else if (lowerInput.includes('parcel') && lowerInput.includes('search')) {
        responseContent = 'You can search for parcels using the Property Search page. Enter a parcel number, address, or owner name in the search box and press enter. The results will show matching properties with key details and links to view them on the map.';
      } else if (lowerInput.includes('map') && (lowerInput.includes('layer') || lowerInput.includes('view'))) {
        responseContent = 'In the Map Viewer, you can toggle different layers using the Layer Control panel on the right side. Click the eye icon to show/hide layers, and use the opacity slider to adjust transparency. You can also change the base map using the selector in the bottom-left corner.';
      } else {
        // Default response if no specific pattern is matched
        responseContent = 'Thanks for your question. To best assist you, I recommend checking the documentation for this specific feature in the Help Center. You can also contact the support team for more detailed assistance on this topic.';
      }
      
      // Create assistant response
      const assistantMessage: Message = {
        id: uuidv4(),
        content: responseContent,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle keyboard submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle suggested question selection
  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };
  
  // Render the assistant UI
  return (
    <>
      {/* Chat toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-md z-50 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-5 w-5" />}
      </Button>
      
      {/* Chat window */}
      <Card
        className={cn(
          "fixed bottom-20 right-4 w-80 sm:w-96 shadow-lg transition-all duration-200 ease-in-out z-40",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
          isMinimized ? "h-14" : "h-[550px]"
        )}
      >
        {/* Chat header */}
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b">
          <CardTitle className="text-base font-medium flex items-center">
            <Avatar className="h-7 w-7 mr-2">
              <AvatarImage src="/assistant-avatar.png" alt="Assistant" />
              <AvatarFallback>
                <HelpCircle className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span>{getContextForRoute().title}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>
        
        {/* Chat content - only shown when not minimized */}
        {!isMinimized && (
          <>
            {/* Messages area */}
            <CardContent className="p-0 h-[400px]">
              <ScrollArea className="h-full px-3 pt-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "mb-3 max-w-[85%] px-3 py-2 rounded-lg",
                      message.role === 'user' 
                        ? "ml-auto bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="mb-3 max-w-[85%] px-3 py-2 rounded-lg bg-muted">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
                
                {/* Suggested questions for new chats */}
                {messages.length <= 1 && !isLoading && (
                  <div className="my-4"><>

                    <p className="text-sm font-medium text-muted-foreground mb-2">Suggested questions:</p>
                    <div
</> className="flex flex-wrap gap-2">
                      {getContextForRoute().suggestedQuestions.map((question /* , index */) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          {question}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messageEndRef} />
              </ScrollArea>
            </CardContent>
            
            {/* Input area */}
            <CardFooter className="p-3 border-t">
              <div className="relative w-full">
                <Textarea
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="resize-none pr-10"
                  rows={2}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 bottom-1 h-8 w-8"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </>
  );
}

export default ContextAssistant;