import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HelpCircle, ChevronDown, ChevronUp, X  } from '@mui/icons-material';
import { cn } from '@/lib/utils';

export interface AssistantPanelProps {
  title: string;
  content: React.ReactNode;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  defaultOpen?: boolean;
  defaultMinimized?: boolean;
}

export function AssistantPanel({
  title,
  content,
  position = 'bottom-right',
  defaultOpen = false,
  defaultMinimized = false
}: AssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-20 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-20 left-4'
  };
  
  // Toggle button position classes
  const togglePositionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  return (
      {/* Toggle button */}
      <Button
        variant="outline"
        size="icon"
        className={`fixed ${togglePositionClasses[position]} h-12 w-12 rounded-full shadow-md z-50 bg-primary text-primary-foreground hover:bg-primary/90`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </Button>
      
      {/* Panel */}
      <Card
        className={cn(
          `fixed ${positionClasses[position]} w-80 sm:w-96 shadow-lg transition-all duration-200 ease-in-out z-40`,
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
          isMinimized ? "h-14" : "h-[550px]"
        )}
      >
        {/* Header */}
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b">
          <CardTitle className="text-base font-medium flex items-center">
            <Avatar className="h-7 w-7 mr-2">
              <AvatarImage src="/assistant-avatar.png" alt="Assistant" />
              <AvatarFallback>
                <HelpCircle className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span>{title}</span>
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
        
        {/* Content */}
        {!isMinimized && <CardContent className="p-4">{content}</CardContent>}
      </Card>
  );
}