import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { AgentVoiceInterface } from './agent-voice/AgentVoiceInterface';
import { VoiceCommandResult } from '../services/agent-voice-command-service';

export interface AgentVoiceDemoProps {
  agentId?: string;
  subject?: string;
  className?: string;
}

export function AgentVoiceDemo({
  agentId = 'assistant',
  subject = 'assessment',
  className = ''
}: AgentVoiceDemoProps) {
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [lastCommandTimestamp, setLastCommandTimestamp] = useState<number>(0);
  
  // Handle voice command results
  const handleVoiceResult = useCallback((result: VoiceCommandResult) => {
    setLastResult(result);
    setLastCommandTimestamp(Date.now());
  }, []);
  
  return (
    <Card className={`agent-voice-demo max-w-3xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Assessment Agent Voice Interface</CardTitle>
        <CardDescription>
          Use your voice to interact with the assessment agent. Try commands like:
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Show me property data for [property ID]</li>
            <li>Generate a valuation report for [address]</li>
            <li>What's the assessment method for commercial properties?</li>
            <li>Help me understand land value calculations</li>
          </ul>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle className="ml-2">Voice Recognition Available</AlertTitle>
          <AlertDescription className="ml-2">
            Click the microphone button and speak clearly to issue voice commands to the assessment agent.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Voice Controls</h3>
            <AgentVoiceInterface 
              onResult={handleVoiceResult}
              agentId={agentId}
              subject={subject}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Command History</h3>
            {!lastResult ? (
              <div className="rounded-md border p-4 text-muted-foreground text-center">
                <p>No commands issued yet.</p>
                <p className="text-sm mt-2">Try saying something to the agent.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-1">
                  Last command: {new Date(lastCommandTimestamp).toLocaleTimeString()}
                </p>
                <div className="rounded-md border p-3">
                  <p className="font-medium">{lastResult.command}</p>
                  <p className="text-sm mt-1">
                    {lastResult.successful 
                      ? (lastResult.response || 'Command successful') 
                      : (lastResult.error || 'Command failed')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}