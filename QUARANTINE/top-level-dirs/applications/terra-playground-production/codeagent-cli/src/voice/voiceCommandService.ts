import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import speech from '@google-cloud/speech';
import { AudioRecorder } from './audioRecorder.js';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Voice Command Result interface
 */
interface VoiceCommandResult {
  command: string;
  confidence: number;
  isMatch: boolean;
  action?: string;
  parameters?: Record<string, string>;
}

/**
 * Voice Command Service
 *
 * Provides voice recognition and command processing capabilities
 */
export class VoiceCommandService extends EventEmitter {
  private client: speech.SpeechClient;
  private commands: Map<string, (params?: Record<string, string>) => void>;
  private isListening: boolean = false;
  private processingAudio: boolean = false;
  private commandPatterns: Map<string, RegExp>;
  private keywordDetectionEnabled: boolean = false;
  private wakeWord: string = 'hey agent';
  private audioFilePath: string = '';
  private audioRecorder: AudioRecorder;
  private useRealRecording: boolean = false;

  constructor() {
    super();
    this.commands = new Map();
    this.commandPatterns = new Map();

    // Create a client with default credentials
    this.client = new speech.SpeechClient();

    // Set temporary file location
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.audioFilePath = path.join(homeDir, '.codeagent', 'temp', 'audio.wav');

    // Ensure temp directory exists
    const tempDir = path.dirname(this.audioFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Initialize audio recorder
    this.audioRecorder = new AudioRecorder();
    this.audioRecorder.setOutputPath(this.audioFilePath);

    // Set up audio recorder event listeners
    this.setupAudioRecorderEvents();

    // Initialize with default commands
    this.initializeCommands();
  }

  /**
   * Set up event listeners for the audio recorder
   */
  private setupAudioRecorderEvents(): void {
    this.audioRecorder.on('recording', data => {
      this.emit('recording', data);
    });

    this.audioRecorder.on('recorded', async data => {
      if (data.path) {
        await this.processAudioFile(data.path);
      } else if (data.text) {
        // This is a simulation with text directly
        this.emit('transcription', { text: data.text });
        const commandResult = this.processCommand(data.text);
        if (commandResult) {
          this.emit('result', commandResult);
        }
      }
    });

    this.audioRecorder.on('stopped', () => {
      this.emit('recording_stopped');
    });

    this.audioRecorder.on('error', error => {
      this.emit('error', error);
    });

    this.audioRecorder.on('warning', warning => {
      this.emit('warning', warning);
    });
  }

  /**
   * Initialize default commands
   */
  private initializeCommands(): void {
    // Navigation commands
    this.registerCommand('help', () => {
      this.emit('command', { command: 'help', action: 'showHelp' });
    });

    this.registerCommand('list plugins', () => {
      this.emit('command', {
        command: 'list plugins',
        action: 'executeCommand',
        parameters: { command: 'plugin --list' },
      });
    });

    this.registerCommand('create plugin', () => {
      this.emit('command', {
        command: 'create plugin',
        action: 'executeCommand',
        parameters: { command: 'plugin --wizard' },
      });
    });

    // Register command patterns with parameter extraction
    this.registerCommandPattern('install plugin {name}', /install plugin (?<name>.+)/i, params => {
      this.emit('command', {
        command: `install plugin ${params?.name}`,
        action: 'executeCommand',
        parameters: { command: `plugin --install ${params?.name}` },
      });
    });

    this.registerCommandPattern('edit plugin {name}', /edit plugin (?<name>.+)/i, params => {
      this.emit('command', {
        command: `edit plugin ${params?.name}`,
        action: 'executeCommand',
        parameters: { command: `plugin --wizard ${params?.name}` },
      });
    });

    this.registerCommandPattern(
      'edit settings for {plugin}',
      /edit settings for (?<plugin>.+)/i,
      params => {
        this.emit('command', {
          command: `edit settings for ${params?.plugin}`,
          action: 'executeCommand',
          parameters: { command: `plugin-settings --edit ${params?.plugin}` },
        });
      }
    );

    // Ask command with parameter extraction
    this.registerCommandPattern('ask {question}', /ask (?<question>.+)/i, params => {
      this.emit('command', {
        command: `ask ${params?.question}`,
        action: 'executeCommand',
        parameters: { command: `ask "${params?.question}"` },
      });
    });

    // System commands
    this.registerCommand('stop listening', () => {
      this.stopListening();
      this.emit('command', {
        command: 'stop listening',
        action: 'systemMessage',
        parameters: { message: 'Voice recognition stopped' },
      });
    });
  }

  /**
   * Register a new voice command
   * @param command The command phrase
   * @param callback The callback function to execute
   */
  registerCommand(command: string, callback: (params?: Record<string, string>) => void): void {
    this.commands.set(command.toLowerCase(), callback);
  }

  /**
   * Register a command pattern with parameter extraction
   * @param name Descriptive name for the command
   * @param pattern Regular expression pattern with named capture groups
   * @param callback The callback function to execute with captured parameters
   */
  registerCommandPattern(
    name: string,
    pattern: RegExp,
    callback: (params?: Record<string, string>) => void
  ): void {
    this.commandPatterns.set(name, pattern);
    this.registerCommand(name, callback);
  }

  /**
   * Start listening for voice commands
   * @param withKeywordDetection Use keyword detection (wake word)
   * @param wakeWord Custom wake word (default: 'hey agent')
   * @param useRealRecording Whether to use real audio recording (if available)
   */
  async startListening(
    withKeywordDetection: boolean = false,
    wakeWord?: string,
    useRealRecording: boolean = false
  ): Promise<void> {
    if (this.isListening) {
      return;
    }

    this.isListening = true;
    this.keywordDetectionEnabled = withKeywordDetection;
    this.useRealRecording = useRealRecording;

    if (wakeWord) {
      this.wakeWord = wakeWord.toLowerCase();
    }

    this.emit('status', {
      listening: true,
      keywordDetection: this.keywordDetectionEnabled,
      useRealRecording: this.useRealRecording,
    });

    if (this.useRealRecording) {
      // Start recording with a continuous recording (0 duration)
      this.startRecording();
    } else {
      // Since we can't use native libraries for audio recording in this environment,
      // we'll simulate voice input using a file-based approach for demonstration purposes
      this.simulateVoiceInput();
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;

    if (this.useRealRecording) {
      this.audioRecorder.stopRecording();
    }

    this.emit('status', { listening: false });
  }

  /**
   * Start recording audio
   * @param duration Recording duration in seconds (0 for continuous)
   */
  private async startRecording(duration: number = 0): Promise<void> {
    try {
      await this.audioRecorder.startRecording(duration);
    } catch (error) {
      this.emit('error', { error });

      // Fall back to simulation mode
      this.useRealRecording = false;
      this.simulateVoiceInput();
    }
  }

  /**
   * Process a voice command
   * @param text The transcript of the voice command
   * @returns The result of the command processing
   */
  processCommand(text: string): VoiceCommandResult | null {
    if (!text) return null;

    const input = text.toLowerCase().trim();

    // Check if using keyword detection and waiting for wake word
    if (this.keywordDetectionEnabled) {
      if (input.includes(this.wakeWord)) {
        // Strip the wake word from the input
        const commandPart = input.replace(this.wakeWord, '').trim();
        if (commandPart) {
          return this.matchCommand(commandPart);
        } else {
          // Just the wake word was detected, emit a wake event
          this.emit('wake', { wakeWord: this.wakeWord });
          return {
            command: this.wakeWord,
            confidence: 1.0,
            isMatch: true,
            action: 'wake',
          };
        }
      } else {
        // No wake word detected
        return null;
      }
    } else {
      // No keyword detection, process the command directly
      return this.matchCommand(input);
    }
  }

  /**
   * Match a command string against registered commands and patterns
   * @param input The command input string
   * @returns The result of the command matching
   */
  private matchCommand(input: string): VoiceCommandResult | null {
    // First check for exact command matches
    for (const [command, callback] of this.commands.entries()) {
      if (input === command) {
        callback();
        return {
          command,
          confidence: 1.0,
          isMatch: true,
        };
      }
    }

    // Then check for command patterns
    for (const [name, pattern] of this.commandPatterns.entries()) {
      const match = input.match(pattern);
      if (match && match.groups) {
        const callback = this.commands.get(name);
        if (callback) {
          callback(match.groups);
          return {
            command: name,
            confidence: 0.9, // Slightly lower confidence for pattern matches
            isMatch: true,
            parameters: match.groups,
          };
        }
      }
    }

    // No match found
    this.emit('nomatch', { input });
    return {
      command: input,
      confidence: 0,
      isMatch: false,
    };
  }

  /**
   * Process an audio file for speech recognition
   * @param audioFilePath Path to the audio file (WAV format)
   */
  async processAudioFile(audioFilePath: string): Promise<void> {
    if (this.processingAudio || !this.isListening) {
      return;
    }

    this.processingAudio = true;

    try {
      // Read the audio file
      const audioBytes = fs.readFileSync(audioFilePath).toString('base64');

      // Configure the request
      const audio = {
        content: audioBytes,
      };
      const config = {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      };
      const request = {
        audio,
        config,
      };

      // Detects speech in the audio file
      const [response] = await this.client.recognize(request);
      const transcription =
        response.results?.map(result => result.alternatives?.[0]?.transcript || '').join('\n') ||
        '';

      if (transcription) {
        this.emit('transcription', { text: transcription });

        // Process the command
        const commandResult = this.processCommand(transcription);
        if (commandResult) {
          this.emit('result', commandResult);
        }
      }
    } catch (error) {
      this.emit('error', { error });
      console.error('Error processing audio:', error);
    } finally {
      this.processingAudio = false;
    }
  }

  /**
   * Simulate voice input for demonstration purposes
   *
   * In a real implementation, this would be replaced with actual
   * audio recording capability using native libraries.
   */
  private simulateVoiceInput(): void {
    if (!this.isListening) return;

    // Set up a demo command processing interface
    console.log('\n🎤 Voice Command Simulation (no actual audio recording)');
    console.log('---------------------------------------------------');
    console.log('Enter text to simulate voice commands. Type "exit" to stop.\n');

    // Use stdin to simulate voice input
    process.stdin.on('data', data => {
      const input = data.toString().trim();

      if (input.toLowerCase() === 'exit') {
        this.stopListening();
        console.log('Voice command simulation stopped.');
        return;
      }

      // Simulate transcription event
      this.emit('transcription', { text: input });

      // Process the command
      const commandResult = this.processCommand(input);
      if (commandResult) {
        this.emit('result', commandResult);

        if (!commandResult.isMatch) {
          console.log('Command not recognized. Try another command.');
        }
      }
    });
  }

  /**
   * Check if Google Cloud Speech credentials are available
   */
  async checkCredentials(): Promise<boolean> {
    try {
      // Try to make a simple request to check if credentials are valid
      // This is a lightweight check that doesn't make an actual API call
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return false;
      }

      // Just check if we can initialize the client without errors
      const isClient = !!this.client;
      return isClient;
    } catch (error) {
      return false;
    }
  }
}
