import { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Lightbulb, Navigation, Copy, RefreshCw } from 'lucide-react';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  VoiceCommandResult, 
  VoiceCommandAction, 
  executeVoiceCommandAction, 
  VoiceCommandActionType 
} from '../../services/agent-voice-command-service';

export interface AgentVoiceCommandResultsProps {
  result: VoiceCommandResult;
  onClear?: () => void;
  onClose?: () => void;
}

export function AgentVoiceCommandResults({ 
  result,
  onClear,
  onClose
}: AgentVoiceCommandResultsProps) {
  // Format date from timestamp
  const formattedDate = new Date(result.timestamp).toLocaleString();
  
  // Handle action execution
  const executeAction = useCallback((action: VoiceCommandAction) => {
    executeVoiceCommandAction(action);
  }, []);
  
  // Render a list of actions as buttons
  const renderActions = () => {
    if (!result.actions || result.actions.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {result.actions.map((action, index) => {
          // Determine icon based on action type
          let icon = <Lightbulb className="h-4 w-4 mr-1" />;
          
          if (action.type === VoiceCommandActionType.NAVIGATE) {
            icon = <Navigation className="h-4 w-4 mr-1" />;
          } else if (action.type === VoiceCommandActionType.COPY_TO_CLIPBOARD) {
            icon = <Copy className="h-4 w-4 mr-1" />;
          } else if (action.type === VoiceCommandActionType.REFRESH_DATA) {
            icon = <RefreshCw className="h-4 w-4 mr-1" />;
          }
          
          return (
            <Button 
              key={index}
              variant="outline"
              size="sm"
              onClick={() => executeAction(action)}
              className="flex items-center"
            >
              {icon}
              {action.type.replace(/_/g, ' ')}
            </Button>
          );
        })}
      </div>
    );
  };
  
  // If we have a simple success/failure response, show as an alert
  if (result.processed && !result.data) {
    return (
      <Alert variant={result.successful ? "default" : "destructive"}>
        {result.successful ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <AlertTitle className="ml-2">
          {result.successful ? 'Command completed' : 'Command failed'}
        </AlertTitle>
        <AlertDescription className="ml-2">
          {result.response || result.error || (result.successful ? 'Your command was processed successfully.' : 'Failed to process your command.')}
          {renderActions()}
        </AlertDescription>
      </Alert>
    );
  }
  
  // For more complex responses with data, show as a card
  return (
    <Card className="voice-command-result">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          {result.successful ? (
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 mr-2 text-red-500" />
          )}
          {result.command}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {result.response && (
          <p className="mb-3">{result.response}</p>
        )}
        
        {result.error && (
          <Alert variant="destructive" className="mb-3">
            <XCircle className="h-4 w-4" />
            <AlertTitle className="ml-2">Error</AlertTitle>
            <AlertDescription className="ml-2">{result.error}</AlertDescription>
          </Alert>
        )}
        
        {result.data && typeof result.data === 'object' && (
          <div className="bg-muted p-2 rounded text-sm overflow-auto max-h-48">
            <pre>{JSON.stringify(result.data, null, 2)}</pre>
          </div>
        )}
        
        {renderActions()}
      </CardContent>
      
      {(onClear || onClose) && (
        <CardFooter className="flex justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (onClear) onClear();
              if (onClose) onClose();
            }}
          >
            Dismiss
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}