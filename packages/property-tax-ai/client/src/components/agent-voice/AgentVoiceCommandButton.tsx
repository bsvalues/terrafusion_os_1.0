import { useState, useEffect, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  SpeechRecognitionService, 
  RecordingState, 
  isSpeechRecognitionAvailable,
  processVoiceCommand,
  VoiceCommandResult,
  VoiceCommandContext
} from '../../services/agent-voice-command-service';

interface AgentVoiceCommandButtonProps {
  onStateChange: (state: RecordingState, text?: string) => void;
  onResult?: (result: VoiceCommandResult) => void;
  agentId?: string;
  subject?: string;
  size?: 'default' | 'sm' | 'lg' | 'large'; // 'large' is a custom size
  className?: string;
}

export function AgentVoiceCommandButton({ 
  onStateChange,
  onResult,
  agentId,
  subject,
  size = 'default',
  className = ''
}: AgentVoiceCommandButtonProps) {
  const [state, setState] = useState<RecordingState>(RecordingState.INACTIVE);
  const [recognitionService, setRecognitionService] = useState<SpeechRecognitionService | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  // Initialize speech recognition
  useEffect(() => {
    // Check if speech recognition is available
    if (!isSpeechRecognitionAvailable()) {
      setIsSupported(false);
      return;
    }
    
    // Create the recognition service
    const recognition = new SpeechRecognitionService({
      continuous: false,
      interimResults: true
    });
    
    // Set up event handlers
    recognition.onResult((text) => {
      if (text) {
        onStateChange(RecordingState.LISTENING, text);
      }
    });
    
    recognition.onError((error) => {
      console.error('Speech recognition error:', error);
      setState(RecordingState.ERROR);
      onStateChange(RecordingState.ERROR);
    });
    
    recognition.onEnd(() => {
      setState(RecordingState.INACTIVE);
      // The final text will be processed by the parent component
    });
    
    setRecognitionService(recognition);
    
    // Clean up on unmount
    return () => {
      if (recognition && recognition.isActive()) {
        recognition.stop();
      }
    };
  }, [onStateChange]);
  
  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (!recognitionService) return;
    
    if (state === RecordingState.INACTIVE) {
      // Start recording
      setState(RecordingState.LISTENING);
      onStateChange(RecordingState.LISTENING);
      recognitionService.start();
    } else if (state === RecordingState.LISTENING) {
      // Stop recording
      setState(RecordingState.PROCESSING);
      onStateChange(RecordingState.PROCESSING);
      
      const finalText = recognitionService.getTranscript();
      recognitionService.stop();
      
      // Only process if we have actual text content
      if (finalText && finalText.trim().length > 0) {
        // Process the voice command
        const context: VoiceCommandContext = {
          agentId: agentId,
          subject: subject
        };
        
        // Send the command to the server
        processVoiceCommand(finalText, context)
          .then(result => {
            if (onResult) {
              onResult(result);
            }
            setState(RecordingState.INACTIVE);
            onStateChange(RecordingState.INACTIVE, finalText);
          })
          .catch(error => {
            console.error('Error processing voice command:', error);
            setState(RecordingState.ERROR);
            onStateChange(RecordingState.ERROR);
            
            if (onResult) {
              onResult({
                command: finalText,
                processed: false,
                successful: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
              });
            }
          });
      } else {
        // If there's no text, just go back to inactive
        setState(RecordingState.INACTIVE);
        onStateChange(RecordingState.INACTIVE);
      }
    }
  }, [recognitionService, state, onStateChange, agentId, subject, onResult]);
  
  // Button appearance based on state
  let buttonVariant: "default" | "destructive" | "outline" | "ghost" | "link" | "secondary" = "default";
  let isDisabled = false;
  let ariaLabel = 'Record voice command';
  let iconSize = "h-5 w-5";
  let buttonContent;
  
  // Determine button size dimensions
  let buttonSize = "w-12 h-12";
  let iconClass = iconSize;
  
  if (size === 'sm') {
    buttonSize = "w-8 h-8";
    iconClass = "h-4 w-4";
  } else if (size === 'lg') {
    buttonSize = "w-14 h-14";
    iconClass = "h-6 w-6";
  } else if (size === 'large') {
    buttonSize = "w-16 h-16";
    iconClass = "h-7 w-7";
  }
  
  // Determine button state
  if (!isSupported) {
    isDisabled = true;
    buttonVariant = "destructive";
    ariaLabel = 'Voice commands not supported in this browser';
    buttonContent = <Mic className={iconClass} />;
  } else if (state === RecordingState.LISTENING) {
    buttonVariant = "destructive";
    ariaLabel = 'Stop recording';
    buttonContent = <Mic className={`${iconClass} animate-pulse`} />;
  } else if (state === RecordingState.PROCESSING) {
    isDisabled = true;
    ariaLabel = 'Processing voice command';
    buttonContent = <Loader2 className={`${iconClass} animate-spin`} />;
  } else if (state === RecordingState.ERROR) {
    buttonVariant = "destructive";
    ariaLabel = 'Error recording voice command. Click to try again';
    buttonContent = <Mic className={iconClass} />;
  } else {
    buttonContent = <Mic className={iconClass} />;
  }
  
  return (
    <Button
      onClick={toggleRecording}
      variant={buttonVariant}
      size="icon"
      disabled={isDisabled}
      className={`rounded-full ${buttonSize} ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {buttonContent}
    </Button>
  );
}