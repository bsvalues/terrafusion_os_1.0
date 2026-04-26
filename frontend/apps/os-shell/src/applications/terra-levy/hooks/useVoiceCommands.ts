import { useCallback } from 'react';

export interface VoiceCommandOptions {
  onCommand: (command: string, confidence: number) => void;
  continuous?: boolean;
  language?: string;
  confidenceThreshold?: number;
}

export interface VoiceCommandHook {
  voiceCommand: string | null;
  transcript: string;
  confidence: number;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
}

const UNAVAILABLE_MESSAGE =
  'TerraLevy voice command support is not wired to a governed operator-control contract.';

export const useVoiceCommands = (_options: VoiceCommandOptions): VoiceCommandHook => {
  const noop = useCallback(() => undefined, []);

  return {
    voiceCommand: null,
    transcript: '',
    confidence: 0,
    isListening: false,
    startListening: noop,
    stopListening: noop,
    isSupported: false,
    error: UNAVAILABLE_MESSAGE,
  };
};

export default useVoiceCommands;
