/**
 * Voice Service
 *
 * This service handles voice recording in the browser, including:
 * - Requesting microphone permissions
 * - Starting and stopping recordings
 * - Converting audio to formats for processing
 */

export type RecordingState = 'idle' | 'recording' | 'processing';

class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private setStateCallback: ((state: RecordingState) => void) | null = null;

  /**
   * Initialize the voice service by requesting microphone permissions
   */
  public async initialize(): Promise<boolean> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Error initializing microphone:', error);
      return false;
    }
  }

  /**
   * Start recording audio from the microphone
   */
  public startRecording(setStateCallback: (state: RecordingState) => void): void {
    if (!this.stream) {
      console.error('Cannot start recording: stream not initialized');
      return;
    }

    this.setStateCallback = setStateCallback;
    this.audioChunks = [];

    try {
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      setStateCallback('recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      setStateCallback('idle');
    }
  }

  /**
   * Stop recording and return the audio blob
   */
  public async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = event => {
        reject(event.error);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Convert an audio blob to a base64 string for transmission
   */
  public async audioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        } else {
          reject(new Error('Failed to convert audio to base64'));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.setStateCallback = null;
  }
}

export const voiceService = new VoiceService();
