import { useState, useCallback } from 'react';
import { AgentVoiceInterface } from '../components/agent-voice/AgentVoiceInterface';
import { VoiceCommandResult } from '../services/agent-voice-command-service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

const VoiceCommandPage = () => {
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [commandHistory, setCommandHistory] = useState<VoiceCommandResult[]>([]);
  
  const handleVoiceCommandResult = useCallback((result: VoiceCommandResult) => {
    setLastResult(result);
    setCommandHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10 commands
  }, []);
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Agent Voice Commands</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side: Voice command interface */}
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Voice Command</CardTitle>
              <CardDescription>
                Speak to your assessment assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentVoiceInterface 
                onResult={handleVoiceCommandResult}
                agentId="assessment_assistant"
                subject="property_assessment"
                className="w-full"
              />
              
              <Alert className="mt-6 bg-blue-50">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Voice Command Tips</AlertTitle>
                <AlertDescription>
                  <p className="mt-2">Try commands like:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>"Show me property data for BC001"</li>
                    <li>"Generate a valuation report for 1320 N Louis Avenue"</li>
                    <li>"How are residential properties assessed?"</li>
                    <li>"Help me understand land value calculations"</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side: Command history and details */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Command History</CardTitle>
              <CardDescription>
                Recent voice command interactions and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commandHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No commands yet. Try speaking to the assistant.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commandHistory.map((command, index) => (
                    <Card key={index} className={`border-l-4 ${command.successful ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{command.command}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(command.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {command.response && (
                          <p className="mt-2 text-gray-700">{command.response}</p>
                        )}
                        
                        {command.error && (
                          <p className="mt-2 text-red-600">{command.error}</p>
                        )}
                        
                        {command.data && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-md text-xs overflow-auto max-h-32">
                            <pre>{JSON.stringify(command.data, null, 2)}</pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoiceCommandPage;