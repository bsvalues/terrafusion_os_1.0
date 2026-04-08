/**
 * Voice Command Help
 * 
 * This component provides contextual help for voice commands.
 * It displays available commands, examples, and usage instructions.
 */

import { useState, useEffect } from 'react';
import { 
  getContextualHelp, 
  type VoiceCommandHelpContent
} from '@/services/enhanced-voice-command-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Search,
  ChevronDown, 
  ChevronUp, 
  PlayCircle, 
  HelpCircle, 
  Command,
  Tag,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommandHelpProps {
  contextId: string;
  onCommandSelected: (command: string) => void;
  className?: string;
}

export function VoiceCommandHelp({
  contextId,
  onCommandSelected,
  className = ''
}: VoiceCommandHelpProps) {
  // State
  const [helpContents, setHelpContents] = useState<VoiceCommandHelpContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  
  const { toast } = useToast();
  
  // Load help contents when context changes
  useEffect(() => {
    loadHelpContents();
  }, [contextId]);
  
  // Load help contents
  const loadHelpContents = async () => {
    setIsLoading(true);
    
    try {
      const data = await getContextualHelp(contextId);
      setHelpContents(data);
      
      // Auto-expand first item if there are results
      if (data.length > 0) {
        setExpandedItems({ [data[0].id]: true });
      }
    } catch (error) {
      console.error('Error loading help contents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load command help',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Filter help contents based on search query
  const filteredHelpContents = helpContents.filter(content => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    return (
      content.title.toLowerCase().includes(query) ||
      content.description.toLowerCase().includes(query) ||
      content.commandType.toLowerCase().includes(query) ||
      content.examplePhrases.some(phrase => phrase.toLowerCase().includes(query))
    );
  });
  
  // Render loading state
  const renderLoading = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ))}
    </div>
  );
  
  // Render empty state
  const renderEmpty = () => (
    <div className="text-center py-12 text-muted-foreground">
      <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
      <p className="text-lg font-medium">No Command Help Available</p>
      <p className="mt-1">No help content is available for this context.</p>
    </div>
  );
  
  // Render a single help item
  const renderHelpItem = (content: VoiceCommandHelpContent) => {
    const isExpanded = expandedItems[content.id] || false;
    
    return (
      <Collapsible
        key={content.id}
        open={isExpanded}
        onOpenChange={() => toggleExpanded(content.id)}
        className="border rounded-md overflow-hidden mb-4"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 text-left">
          <div className="flex items-center gap-2">
            <Command className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">{content.title}</h3>
              <p className="text-xs text-muted-foreground">{content.commandType}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0 border-t">
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm">{content.description}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Example Commands
              </h4>
              <div className="space-y-2">
                {content.examplePhrases.map((phrase, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onCommandSelected(phrase)}
                    >
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Try
                    </Button>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{phrase}</code>
                  </div>
                ))}
              </div>
            </div>
            
            {Object.keys(content.parameters).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Parameters
                </h4>
                <div className="space-y-2">
                  {Object.entries(content.parameters).map(([key, description], i) => (
                    <div key={i} className="text-xs">
                      <Badge variant="outline">{key}</Badge>
                      <span className="ml-2">{description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {content.responseExample && (
              <div>
                <h4 className="text-sm font-medium mb-2">Example Response</h4>
                <div className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap">
                  {content.responseExample}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };
  
  // Main render
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Voice Command Help</CardTitle>
        <CardDescription>
          Learn about available voice commands and how to use them
        </CardDescription>
        
        <div className="mt-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          renderLoading()
        ) : filteredHelpContents.length === 0 ? (
          renderEmpty()
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            {filteredHelpContents.map(renderHelpItem)}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}