/**
 * Enhanced Voice Command Results
 * 
 * This component displays the results of voice commands, including:
 * - Command transcripts
 * - Processing status
 * - Command results
 * - Suggestions for failed commands
 */

import { useState, useRef, useEffect } from 'react';
import { VoiceCommandResult, RecordingState } from '@/services/agent-voice-command-service';
import { VoiceCommandHelp } from './VoiceCommandHelp';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Check,
  XCircle,
  Loader2,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Info,
  Mic,
  MessageSquare,
  Clock,
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';

interface EnhancedVoiceCommandResultsProps {
  results: VoiceCommandResult[];
  onClear: () => void;
  isProcessing: boolean;
  recordingState: RecordingState;
  currentTranscript: string;
  suggestions: string[];
  onSuggestionSelected: (suggestion: string) => void;
  onCommandSubmit: (command: string) => void;
  showHelp: boolean;
  contextId: string;
}

export function EnhancedVoiceCommandResults({
  results,
  onClear,
  isProcessing,
  recordingState,
  currentTranscript,
  suggestions,
  onSuggestionSelected,
  onCommandSubmit,
  showHelp,
  contextId
}: EnhancedVoiceCommandResultsProps) {
  // State
  const [command, setCommand] = useState<string>('');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(showHelp);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const resultAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom when results change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [results, isProcessing, recordingState, currentTranscript]);
  
  // Handle manual command submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;
    
    onCommandSubmit(command);
    setCommand('');
  };
  
  // Toggle result expansion
  const toggleResultExpanded = (id: string) => {
    setExpandedResults(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'MM/dd/yyyy HH:mm:ss');
  };
  
  // Determine text color based on successful state
  const getResultTextColor = (successful: boolean) => {
    return successful ? 'text-green-500' : 'text-red-500';
  };
  
  // Render help toggle button
  const renderHelpToggle = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsHelpOpen(!isHelpOpen)}
      className="gap-1"
    >
      {isHelpOpen ? (
        <>
          <ChevronUp className="h-4 w-4" />
          Hide Help
        </>
      ) : (
        <>
          <HelpCircle className="h-4 w-4" />
          Show Help
        </>
      )}
    </Button>
  );
  
  // Render command form
  const renderCommandForm = () => (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Type a command..."
        disabled={isProcessing || recordingState === RecordingState.RECORDING}
        ref={inputRef}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={!command.trim() || isProcessing || recordingState === RecordingState.RECORDING}
      >
        <Send className="h-4 w-4 mr-2" />
        Send
      </Button>
    </form>
  );
  
  // Render current status
  const renderCurrentStatus = () => {
    if (isProcessing || recordingState === RecordingState.PROCESSING) {
      return (
        <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md animate-pulse mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing command...</span>
        </div>
      );
    }
    
    if (recordingState === RecordingState.RECORDING) {
      return (
        <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md mb-4">
          <Mic className="h-4 w-4 text-red-500" />
          <span>Recording: {currentTranscript || "Waiting for speech..."}</span>
        </div>
      );
    }
    
    return null;
  };
  
  // Render suggestions
  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;
    
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Did you mean:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionSelected(suggestion)}
              className="text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  // Render action buttons for a result
  const renderResultActions = (result: VoiceCommandResult) => {
    if (!result.actions || result.actions.length === 0) return null;
    
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {result.actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => {
              if (action.command) {
                onCommandSubmit(action.command);
              }
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };
  
  // Render a single result
  const renderResult = (result: VoiceCommandResult, index: number) => {
    const isExpanded = expandedResults[result.id] || false;
    
    return (
      <Collapsible
        key={result.id}
        open={isExpanded}
        onOpenChange={() => toggleResultExpanded(result.id)}
        className="border rounded-md overflow-hidden mb-2"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-muted/50 text-left">
          <div className="flex items-center gap-2 truncate">
            {result.successful ? (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <div className="truncate">
              <span className="font-medium">{result.command}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {formatTimestamp(result.timestamp)}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 border-t">
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={result.successful ? "success" : "destructive"}>
                {result.successful ? "Success" : "Failed"}
              </Badge>
              {result.contextId && (
                <Badge variant="outline">{result.contextId}</Badge>
              )}
            </div>
            
            <div className="text-sm">
              <div className="font-medium mb-1">Command:</div>
              <div className="bg-muted p-2 rounded-md">{result.command}</div>
            </div>
            
            {result.processedCommand && result.processedCommand !== result.command && (
              <div className="text-sm">
                <div className="font-medium mb-1">Processed Command:</div>
                <div className="bg-muted p-2 rounded-md">{result.processedCommand}</div>
              </div>
            )}
            
            {result.response && (
              <div className="text-sm">
                <div className="font-medium mb-1">Response:</div>
                <div className="bg-muted p-2 rounded-md whitespace-pre-wrap">{result.response}</div>
              </div>
            )}
            
            {result.error && (
              <div className="text-sm">
                <div className="font-medium mb-1 text-red-500">Error:</div>
                <div className="bg-red-50 p-2 rounded-md text-red-500">{result.error}</div>
              </div>
            )}
            
            {renderResultActions(result)}
            
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-3">
              <Clock className="h-3 w-3" />
              {formatTimestamp(result.timestamp)}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };
  
  // Render empty state
  const renderEmpty = () => (
    <div className="text-center py-12 text-muted-foreground">
      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
      <p className="text-lg font-medium">No Commands Yet</p>
      <p className="mt-1 mb-4">Use the voice button or type a command to get started.</p>
    </div>
  );
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Voice Command Results</CardTitle>
          <div className="flex gap-2">
            {renderHelpToggle()}
            {results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {isHelpOpen && (
        <CardContent className="p-0">
          <div className="mx-6 mb-6">
            <VoiceCommandHelp 
              contextId={contextId} 
              onCommandSelected={onCommandSubmit}
              className="w-full"
            />
          </div>
        </CardContent>
      )}
      
      <CardContent className="pb-3" ref={resultAreaRef}>
        {renderCurrentStatus()}
        {renderSuggestions()}
        
        <div ref={scrollRef} className="results-container">
          {results.length === 0 ? (
            renderEmpty()
          ) : (
            <ScrollArea className="h-[350px]">
              {results.map(renderResult)}
            </ScrollArea>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        {renderCommandForm()}
      </CardFooter>
    </Card>
  );
}