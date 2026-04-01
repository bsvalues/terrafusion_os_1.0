import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AgentVoiceCommandButton } from './AgentVoiceCommandButton';
import { AgentVoiceCommandResults } from './AgentVoiceCommandResults';
import { VoiceCommandResult, processVoiceCommand, VoiceCommandContext, RecordingState } from '../../services/agent-voice-command-service';

export interface AgentVoiceInterfaceProps {
  onResult?: (result: VoiceCommandResult) => void;
  agentId?: string;
  subject?: string;
  className?: string;
}

export function AgentVoiceInterface({
  onResult,
  agentId = 'assistant',
  subject = 'assessment',
  className = ''
}: AgentVoiceInterfaceProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.INACTIVE);
  const [transcript, setTranscript] = useState<string>('');
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [recentResults, setRecentResults] = useState<VoiceCommandResult[]>([]);
  
  // Process the voice command
  const processCommand = useCallback(async (command: string) => {
    if (!command) return;
    
    setRecordingState(RecordingState.PROCESSING);
    
    try {
      // Prepare the context for the command
      const context: VoiceCommandContext = {
        agentId,
        subject,
        recentCommands,
        recentResults
      };
      
      // Process the command via the API
      const result = await processVoiceCommand(command, context);
      
      // Update state with results
      setLastResult(result);
      
      // Add to recent commands and results (keeping last 5)
      setRecentCommands(prev => [command, ...prev.slice(0, 4)]);
      setRecentResults(prev => [result, ...prev.slice(0, 4)]);
      
      // Call the onResult callback if provided
      if (onResult) {
        onResult(result);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      // Create an error result
      const errorResult: VoiceCommandResult = {
        command,
        processed: false,
        successful: false,
        error: error instanceof Error ? error.message : 'Unknown error processing command',
        timestamp: Date.now()
      };
      
      setLastResult(errorResult);
      
      // Call the onResult callback if provided
      if (onResult) {
        onResult(errorResult);
      }
    } finally {
      setRecordingState(RecordingState.INACTIVE);
    }
  }, [agentId, subject, recentCommands, recentResults, onResult]);
  
  // Handle recording state changes
  const handleStateChange = useCallback((state: RecordingState, text?: string) => {
    setRecordingState(state);
    
    if (text) {
      setTranscript(text);
    }
    
    // If state changed to inactive and we have a transcript, process it
    if (state === RecordingState.INACTIVE && text) {
      processCommand(text);
    }
  }, [processCommand]);
  
  return (
    <Card className={`voice-interface ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Voice command button */}
          <AgentVoiceCommandButton 
            onStateChange={handleStateChange}
            onResult={onResult}
            agentId={agentId}
            subject={subject}
            className="mx-auto"
          />
          
          {/* Transcript display */}
          {transcript && recordingState !== RecordingState.INACTIVE && (
            <div className="text-center text-sm">
              <p className="font-medium">I heard: <span className="italic">{transcript}</span></p>
            </div>
          )}
          
          {/* Results display */}
          {lastResult && (
            <AgentVoiceCommandResults 
              result={lastResult} 
              onClear={() => setLastResult(null)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}