/**
 * Agent Voice Command Service (Client-side)
 * 
 * This service provides speech recognition, audio recording, and communication
 * with the server-side voice command processing API.
 */

import { apiRequest } from '@/lib/queryClient';

// Define the voice command context interface
export interface VoiceCommandContext {
  agentId?: string;
  subject?: string;
  recentCommands?: string[];
  recentResults?: VoiceCommandResult[];
  userId?: number;         // Added for enhanced voice command features
  sessionId?: string;      // Added for tracking in analytics
  contextId?: string;      // Added for contextual help
}

// Define the voice command result interface
export interface VoiceCommandResult {
  command: string;
  processed: boolean;
  successful: boolean;
  response?: string;
  error?: string;
  data?: any;
  actions?: VoiceCommandAction[];
  timestamp: number;
}

// Command action types
export enum VoiceCommandActionType {
  NAVIGATE = 'navigate',
  OPEN_MODAL = 'open_modal',
  CLOSE_MODAL = 'close_modal',
  REFRESH_DATA = 'refresh_data',
  EXECUTE_FUNCTION = 'execute_function',
  COPY_TO_CLIPBOARD = 'copy_to_clipboard',
  TOGGLE_VIEW = 'toggle_view',
  DISPLAY_NOTIFICATION = 'display_notification'
}

// Command action interface
export interface VoiceCommandAction {
  type: VoiceCommandActionType;
  payload: any;
}

// Recording states
export enum RecordingState {
  INACTIVE = 'inactive',
  LISTENING = 'listening',
  RECORDING = 'recording',  // Added for compatibility with enhanced components
  PROCESSING = 'processing',
  ERROR = 'error'
}

// Speech recognition options
export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

/**
 * Speech recognition class to normalize browser differences
 */
export class SpeechRecognitionService {
  private recognition: any = null;
  private isRecording: boolean = false;
  private transcript: string = '';
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor(options: SpeechRecognitionOptions = {}) {
    // Check browser support for speech recognition
    const SpeechRecognitionAPI = 
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.error('Speech recognition is not supported in this browser');
      return;
    }
    
    this.recognition = new SpeechRecognitionAPI();
    
    // Configure speech recognition
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.lang = options.lang ?? 'en-US';
    
    // Set up event handlers
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for the speech recognition API
   */
  private setupEventListeners() {
    if (!this.recognition) return;
    
    this.recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcript = result[0].transcript.trim();
      
      this.transcript = transcript;
      
      if (result.isFinal && this.onResultCallback) {
        this.onResultCallback(this.transcript);
      }
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
      this.stop();
    };
    
    this.recognition.onend = () => {
      this.isRecording = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }
  
  /**
   * Start recording audio for speech recognition
   */
  public start(): void {
    if (!this.recognition) {
      console.error('Speech recognition is not supported or not initialized');
      if (this.onErrorCallback) {
        this.onErrorCallback('Speech recognition not supported');
      }
      return;
    }
    
    try {
      this.recognition.start();
      this.isRecording = true;
      this.transcript = '';
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }
  
  /**
   * Stop recording audio
   */
  public stop(): void {
    if (!this.recognition || !this.isRecording) return;
    
    try {
      this.recognition.stop();
      this.isRecording = false;
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }
  
  /**
   * Check if recording is active
   */
  public isActive(): boolean {
    return this.isRecording;
  }
  
  /**
   * Get the current transcript
   */
  public getTranscript(): string {
    return this.transcript;
  }
  
  /**
   * Register callback for speech recognition results
   */
  public onResult(callback: (transcript: string) => void): void {
    this.onResultCallback = callback;
  }
  
  /**
   * Register callback for errors
   */
  public onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }
  
  /**
   * Register callback for when recognition ends
   */
  public onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }
}

/**
 * Process a voice command through the API
 * @param commandText The text command to process
 * @param context The context in which the command was given
 */
export async function processVoiceCommand(
  commandText: string,
  context: VoiceCommandContext = {}
): Promise<VoiceCommandResult> {
  try {
    // Send command to the server for processing
    const response = await apiRequest("POST", "/api/agent-voice/command", {
      command: commandText,
      context
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to process command: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing voice command:', error);
    return {
      command: commandText,
      processed: false,
      successful: false,
      error: error instanceof Error ? error.message : 'Unknown error processing command',
      timestamp: Date.now()
    };
  }
}

// For testing purposes: detect if web speech API is available
export function isSpeechRecognitionAvailable(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

// Enhanced recording functions for compatibility with the new components
// These are simple wrappers around SpeechRecognitionService to abstract the details
let recognitionService: SpeechRecognitionService | null = null;

// Initialize the speech recognition service
function initRecognitionService() {
  if (!recognitionService) {
    recognitionService = new SpeechRecognitionService({
      continuous: false,
      interimResults: true
    });
  }
  return recognitionService;
}

// Start recording audio
export function startRecording(
  onResult: (transcript: string) => void,
  onError: (error: any) => void,
  onEnd: () => void
): void {
  const service = initRecognitionService();
  
  service.onResult(onResult);
  service.onError(onError);
  service.onEnd(onEnd);
  
  service.start();
}

// Stop recording audio
export function stopRecording(): string | null {
  if (!recognitionService) return null;
  
  const transcript = recognitionService.getTranscript();
  recognitionService.stop();
  
  return transcript;
}

// For handling actions from voice command results
export function executeVoiceCommandAction(action: VoiceCommandAction): void {
  if (!action || !action.type) return;
  
  switch (action.type) {
    case VoiceCommandActionType.NAVIGATE:
      if (action.payload && action.payload.url) {
        window.location.href = action.payload.url;
      }
      break;
      
    case VoiceCommandActionType.OPEN_MODAL:
      // This would need to be connected to the app's modal system
      console.log('Modal action:', action.payload);
      break;
      
    case VoiceCommandActionType.CLOSE_MODAL:
      // This would need to be connected to the app's modal system
      console.log('Close modal action');
      break;
      
    case VoiceCommandActionType.REFRESH_DATA:
      // This would need to be connected to the app's data fetching system
      console.log('Refresh data action:', action.payload);
      break;
      
    case VoiceCommandActionType.COPY_TO_CLIPBOARD:
      if (action.payload && action.payload.text) {
        navigator.clipboard.writeText(action.payload.text)
          .catch(err => console.error('Failed to copy to clipboard:', err));
      }
      break;
      
    default:
      console.warn('Unknown action type:', action.type);
  }
}