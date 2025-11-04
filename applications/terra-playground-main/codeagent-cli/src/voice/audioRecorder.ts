import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import wav from 'node-wav';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Audio Recorder Class
 *
 * Provides utilities for recording audio for voice commands
 * Uses command-line tools for recording as a fallback since
 * native recording libraries require system dependencies
 */
export class AudioRecorder extends EventEmitter {
  private isRecording: boolean = false;
  private recordProcess: any = null;
  private outputFilePath: string = '';

  constructor() {
    super();

    // Set default output path
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.outputFilePath = path.join(homeDir, '.codeagent', 'temp', 'recording.wav');

    // Ensure temp directory exists
    const tempDir = path.dirname(this.outputFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  /**
   * Set the output file path
   * @param filePath The path to save the recording
   */
  setOutputPath(filePath: string): void {
    this.outputFilePath = filePath;
  }

  /**
   * Start recording audio
   * @param duration Recording duration in seconds (0 for continuous)
   */
  async startRecording(duration: number = 5): Promise<void> {
    if (this.isRecording) {
      this.emit('warning', { message: 'Already recording' });
      return;
    }

    this.isRecording = true;

    try {
      // Check for available recording tools
      const hasFFmpeg = await this.checkCommand('ffmpeg -version');
      const hasRec = await this.checkCommand('rec --version');
      const hasArecord = await this.checkCommand('arecord --version');

      if (hasFFmpeg) {
        this.recordWithFFmpeg(duration);
      } else if (hasRec) {
        this.recordWithSox(duration);
      } else if (hasArecord) {
        this.recordWithArecord(duration);
      } else {
        // No recording tools available
        this.isRecording = false;
        this.emit('error', {
          message: 'No recording tools found. Install ffmpeg, sox, or alsa-utils.',
        });
      }
    } catch (error) {
      this.isRecording = false;
      this.emit('error', { error });
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording(): void {
    if (!this.isRecording || !this.recordProcess) {
      return;
    }

    // Kill the recording process
    try {
      this.recordProcess.kill();
      this.recordProcess = null;
      this.isRecording = false;
      this.emit('stopped');
    } catch (error) {
      this.emit('error', { error });
    }
  }

  /**
   * Record using FFmpeg
   * @param duration Recording duration in seconds
   */
  private recordWithFFmpeg(duration: number): void {
    const args = [
      '-y', // Overwrite output file
      '-f',
      'alsa', // Format
      '-i',
      'default', // Input device
      '-acodec',
      'pcm_s16le', // Audio codec
      '-ar',
      '16000', // Sample rate
      '-ac',
      '1', // Channels
    ];

    if (duration > 0) {
      args.push('-t', duration.toString()); // Duration
    }

    args.push(this.outputFilePath);

    this.recordProcess = spawn('ffmpeg', args, { stdio: 'pipe' });

    this.setupProcessListeners('FFmpeg');
  }

  /**
   * Record using SoX (rec command)
   * @param duration Recording duration in seconds
   */
  private recordWithSox(duration: number): void {
    const args = [
      this.outputFilePath,
      'rate',
      '16000',
      'channels',
      '1',
      'silence',
      '1',
      '0.1',
      '3%',
    ];

    if (duration > 0) {
      args.push('trim', '0', duration.toString());
    }

    this.recordProcess = spawn('rec', args, { stdio: 'pipe' });

    this.setupProcessListeners('SoX');
  }

  /**
   * Record using ALSA arecord
   * @param duration Recording duration in seconds
   */
  private recordWithArecord(duration: number): void {
    const args = [
      '-f',
      'S16_LE', // Format
      '-c',
      '1', // Channels
      '-r',
      '16000', // Sample rate
      '-D',
      'default', // Device
    ];

    if (duration > 0) {
      args.push('-d', duration.toString()); // Duration
    }

    args.push(this.outputFilePath);

    this.recordProcess = spawn('arecord', args, { stdio: 'pipe' });

    this.setupProcessListeners('arecord');
  }

  /**
   * Set up event listeners for the recording process
   * @param toolName Name of the recording tool
   */
  private setupProcessListeners(toolName: string): void {
    if (!this.recordProcess) return;

    this.recordProcess.stdout.on('data', (data: Buffer) => {
      // Just for logging specific tool output if needed
    });

    this.recordProcess.stderr.on('data', (data: Buffer) => {
      // Some tools like ffmpeg output info to stderr
      const output = data.toString();
      if (output.includes('error') || output.includes('Error')) {
        this.emit('warning', { message: output });
      }
    });

    this.recordProcess.on('close', (code: number) => {
      this.isRecording = false;

      if (code === 0) {
        this.emit('recorded', {
          path: this.outputFilePath,
          duration: this.getAudioDuration(this.outputFilePath),
        });
      } else {
        this.emit('error', {
          message: `${toolName} recording process exited with code ${code}`,
        });
      }
    });

    this.emit('recording', { tool: toolName });
  }

  /**
   * Check if a command is available
   * @param command The command to check
   * @returns Whether the command is available
   */
  private async checkCommand(command: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const process = spawn(command.split(' ')[0], ['-version'], {
        shell: true,
        stdio: 'ignore',
      });

      process.on('close', code => {
        resolve(code === 0);
      });

      process.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Simulate recording for demonstration purposes
   * @param text Text to "record"
   */
  async simulateRecording(text: string): Promise<string> {
    if (this.isRecording) {
      this.emit('warning', { message: 'Already recording' });
      return '';
    }

    this.isRecording = true;
    this.emit('recording', { tool: 'simulation' });

    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Write text to a file for the demonstration
    const simulationFile = path.join(path.dirname(this.outputFilePath), 'simulation.txt');
    fs.writeFileSync(simulationFile, text);

    this.isRecording = false;
    this.emit('recorded', {
      path: simulationFile,
      text,
    });

    return simulationFile;
  }

  /**
   * Get the duration of an audio file
   * @param filePath Path to the audio file
   * @returns Duration in seconds
   */
  private getAudioDuration(filePath: string): number {
    try {
      if (!fs.existsSync(filePath)) {
        return 0;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const result = wav.decode(fileBuffer);

      // Calculate duration based on sample rate and length
      return result.length / result.sampleRate;
    } catch (error) {
      return 0;
    }
  }
}
