import { useCallback, useEffect, useState } from 'react';

interface VoiceCommandOptions {
  onCommand: (command: string, confidence: number) => void; // Updated to include confidence
  continuous?: boolean;
  language?: string;
  confidenceThreshold?: number;
}

interface VoiceCommandHook {
  voiceCommand: string | null;
  transcript: string; // Added transcript property
  confidence: number; // Added confidence property
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
}

export const useVoiceCommands = ({
  onCommand,
  continuous = false,
  language = 'en-US',
  confidenceThreshold = 0.7,
}: VoiceCommandOptions): VoiceCommandHook => {
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>(''); // Added transcript state
  const [confidence, setConfidence] = useState<number>(0); // Added confidence state
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null); // Changed to any to avoid type issues

  // Check if browser supports speech recognition
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SpeechRecognition/webkitSpeechRecognition are Web Speech API, not in TypeScript lib
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = continuous;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = language;

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionInstance.onresult = (event: any) => {
      const command = event.results[event.results.length - 1][0].transcript.trim();
      const commandConfidence = event.results[event.results.length - 1][0].confidence;

      setVoiceCommand(command);
      setTranscript(command); // Update transcript
      setConfidence(commandConfidence); // Update confidence

      if (commandConfidence >= confidenceThreshold) {
        onCommand(command, commandConfidence); // Pass confidence to callback
      }
    };
    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      if (continuous && !error) {
        // Restart for continuous listening
        setTimeout(() => {
          recognitionInstance.start();
        }, 100);
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [onCommand, continuous, language, confidenceThreshold, isSupported, error]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
      } catch (err) {
        setError('Failed to start speech recognition');
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  return {
    voiceCommand,
    transcript, // Added transcript
    confidence, // Added confidence
    isListening,
    startListening,
    stopListening,
    isSupported,
    error,
  };
};

export default useVoiceCommands;
