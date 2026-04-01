import { ReactNode, useState } from 'react';
import TopNavigation from '@/components/ui/top-navigation';
import AIAssistantSidebar from '@/components/ai-assistant/AIAssistantSidebar';
import { AgentVoiceCommandButton } from '@/components/agent-voice/AgentVoiceCommandButton';
import { AgentVoiceCommandResults } from '@/components/agent-voice/AgentVoiceCommandResults';
import { VoiceCommandResult, RecordingState } from '@/services/agent-voice-command-service';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.INACTIVE);
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [showCommandResults, setShowCommandResults] = useState(false);

  const handleVoiceCommandResult = (result: VoiceCommandResult) => {
    setLastResult(result);
    setShowCommandResults(true);
    // Auto-hide results after 5 seconds if successful
    if (result.successful) {
      setTimeout(() => {
        setShowCommandResults(false);
      }, 5000);
    }
  };

  const handleStateChange = (state: RecordingState) => {
    setRecordingState(state);
    // When recording stops, show the results panel
    if (state === RecordingState.INACTIVE && recordingState !== RecordingState.INACTIVE) {
      setShowCommandResults(true);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Navigation Bar */}
      <TopNavigation />

      {/* Page Content */}
      <main className="flex-1 relative overflow-y-auto focus:outline-none">
        {children}
        
        {/* Floating Voice Command Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <AgentVoiceCommandButton 
            onStateChange={handleStateChange}
            onResult={handleVoiceCommandResult}
            agentId="assessment_assistant"
            subject="property_assessment"
            size="large"
            className="shadow-lg"
          />
        </div>
        
        {/* Voice Command Results Panel */}
        {showCommandResults && lastResult && (
          <div className="fixed bottom-24 right-6 z-40 w-80 animate-in slide-in-from-right-10 duration-300">
            <AgentVoiceCommandResults 
              result={lastResult}
              onClose={() => setShowCommandResults(false)}
            />
          </div>
        )}
      </main>
      
      {/* AI Assistant Sidebar */}
      <AIAssistantSidebar />
    </div>
  );
};

export default AppLayout;
