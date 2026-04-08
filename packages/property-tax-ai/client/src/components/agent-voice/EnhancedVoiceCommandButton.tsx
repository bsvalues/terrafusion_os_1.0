/**
 * Enhanced Voice Command Button
 * 
 * This component handles the recording of voice commands.
 * It provides a button to start/stop recording and displays the current state.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RecordingState, VoiceCommandResult } from '@/services/agent-voice-command-service';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedVoiceCommandButtonProps {
  recordingState: RecordingState;
  setRecordingState: (state: RecordingState) => void;
  onCommand: (command: string) => Promise<VoiceCommandResult>;
  isProcessing: boolean;
  userId: number;
  contextId: string;
  className?: string;
}

export function EnhancedVoiceCommandButton({
  recordingState,
  setRecordingState,
  onCommand,
  isProcessing,
  userId,
  contextId,
  className = ''
}: EnhancedVoiceCommandButtonProps) {
  // State
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const { toast } = useToast();
  
  // Initialize speech recognition when component mounts
  useEffect(() => {
    // Check if speech recognition is supported
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }
    
    // Create speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Configure speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // Set up event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setRecordingState(RecordingState.RECORDING);
        setTranscript('');
        setError(null);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        
        // Only process if we have a transcript and we're not already processing
        if (transcript && recordingState === RecordingState.RECORDING) {
          setRecordingState(RecordingState.PROCESSING);
          processTranscript(transcript);
        } else {
          setRecordingState(RecordingState.INACTIVE);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        const speechError = event as SpeechRecognitionErrorEvent;
        console.error('Speech recognition error:', speechError.error);
        
        if (speechError.error !== 'aborted' && speechError.error !== 'no-speech') {
          setError(`Speech recognition error: ${speechError.error}`);
          toast({
            title: 'Recognition Error',
            description: `Speech recognition error: ${speechError.error}`,
            variant: 'destructive'
          });
        }
        
        setIsListening(false);
        setRecordingState(RecordingState.INACTIVE);
      };
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update transcript
        if (finalTranscript) {
          setTranscript(finalTranscript);
        } else if (interimTranscript) {
          setTranscript(interimTranscript);
        }
      };
    }
    
    // Initialize audio context for visualization
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    } catch (error) {
      console.error('Error initializing audio context:', error);
      // Audio visualization is optional, so we don't need to show an error
    }
    
    // Clean up when component unmounts
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Process transcript when recording stops
  const processTranscript = async (text: string) => {
    if (!text.trim()) {
      setRecordingState(RecordingState.INACTIVE);
      return;
    }
    
    try {
      await onCommand(text.trim());
    } catch (error) {
      console.error('Error processing command:', error);
      toast({
        title: 'Error',
        description: 'Failed to process voice command',
        variant: 'destructive'
      });
    }
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isProcessing) return;
    
    if (recordingState === RecordingState.INACTIVE) {
      // Start recording
      try {
        recognitionRef.current.start();
        
        // Set up audio input if available
        if (audioContextRef.current && analyserRef.current) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              source.connect(analyserRef.current!);
              // Note: we don't connect to audioContext.destination to avoid feedback
            })
            .catch(err => {
              console.error('Error accessing microphone:', err);
              // Audio visualization is optional, so we don't need to show an error
            });
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: 'Error',
          description: 'Failed to start voice recognition',
          variant: 'destructive'
        });
      }
    } else if (recordingState === RecordingState.RECORDING) {
      // Stop recording
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setRecordingState(RecordingState.INACTIVE);
      }
    }
  };
  
  // Button text based on state
  const getButtonText = () => {
    switch (recordingState) {
      case RecordingState.INACTIVE:
        return 'Record Command';
      case RecordingState.RECORDING:
        return 'Stop Recording';
      case RecordingState.PROCESSING:
        return 'Processing...';
      default:
        return 'Record Command';
    }
  };
  
  // Button variant based on state
  const getButtonVariant = () => {
    switch (recordingState) {
      case RecordingState.INACTIVE:
        return 'outline';
      case RecordingState.RECORDING:
        return 'destructive';
      case RecordingState.PROCESSING:
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  // Button icon based on state
  const getButtonIcon = () => {
    switch (recordingState) {
      case RecordingState.INACTIVE:
        return <Mic className="h-4 w-4 mr-2" />;
      case RecordingState.RECORDING:
        return <MicOff className="h-4 w-4 mr-2" />;
      case RecordingState.PROCESSING:
        return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
      default:
        return <Mic className="h-4 w-4 mr-2" />;
    }
  };
  
  return (
    <div className={className}>
      <Button
        onClick={toggleRecording}
        variant={getButtonVariant() as any}
        disabled={isProcessing || recordingState === RecordingState.PROCESSING || !!error}
        className="relative"
      >
        {getButtonIcon()}
        {getButtonText()}
        
        {recordingState === RecordingState.RECORDING && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </Button>
      
      {error && (
        <div className="text-xs text-destructive mt-1">
          {error}
        </div>
      )}
    </div>
  );
}