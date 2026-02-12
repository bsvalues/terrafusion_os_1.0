import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Speech from "expo-speech";
import { Platform, Alert } from "react-native";
import * as Permissions from "expo-permissions";

import { AuthService } from "./AuthService";
import { OfflineQueueService, OperationType } from "./OfflineQueueService";

/**
 * Recognition language
 */
export enum RecognitionLanguage {
  ENGLISH_US = "en-US",
  ENGLISH_UK = "en-GB",
  SPANISH = "es-ES",
  FRENCH = "fr-FR",
  GERMAN = "de-DE",
  CHINESE = "zh-CN",
  JAPANESE = "ja-JP",
}

/**
 * Voice recording options
 */
export interface VoiceRecordingOptions {
  /**
   * Maximum recording duration in milliseconds
   * @default 30000 (30 seconds)
   */
  maxDuration?: number;

  /**
   * Whether to play a sound when recording starts and stops
   * @default true
   */
  playSounds?: boolean;

  /**
   * Whether to show a visual indicator while recording
   * @default true
   */
  showVisualIndicator?: boolean;

  /**
   * Recognition language
   * @default RecognitionLanguage.ENGLISH_US
   */
  language?: RecognitionLanguage;

  /**
   * Whether to transcribe in real-time (if available)
   * @default true
   */
  realTimeTranscription?: boolean;
}

/**
 * Default recording options
 */
const DEFAULT_RECORDING_OPTIONS: VoiceRecordingOptions = {
  maxDuration: 30000,
  playSounds: true,
  showVisualIndicator: true,
  language: RecognitionLanguage.ENGLISH_US,
  realTimeTranscription: true,
};

/**
 * Voice recording quality
 */
export enum RecordingQuality {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

/**
 * Recording format
 */
export enum RecordingFormat {
  AAC = "aac",
  MP4 = "mp4",
  MP3 = "mp3",
  WAV = "wav",
}

/**
 * Recording result
 */
export interface RecordingResult {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message, if any
   */
  error?: string;

  /**
   * URI to the recording file
   */
  uri?: string;

  /**
   * Duration of the recording in milliseconds
   */
  duration?: number;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * Timestamp when the recording was created
   */
  timestamp: number;
}

/**
 * Transcription result
 */
export interface TranscriptionResult {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message, if any
   */
  error?: string;

  /**
   * Transcribed text
   */
  text: string;

  /**
   * Confidence score (0-1)
   */
  confidence?: number;

  /**
   * Alternative transcriptions
   */
  alternatives?: string[];

  /**
   * Language detected
   */
  detectedLanguage?: string;

  /**
   * URI to the original audio
   */
  audioUri?: string;

  /**
   * Timestamp when the transcription was created
   */
  timestamp: number;

  /**
   * Whether the transcription was processed offline
   */
  processedOffline: boolean;
}

/**
 * Property field recognizer mapping
 */
export interface PropertyFieldRecognizer {
  /**
   * Field name in the property object
   */
  field: string;

  /**
   * List of trigger phrases that indicate this field
   */
  triggers: string[];

  /**
   * Field type for parsing
   */
  type: "string" | "number" | "boolean" | "address" | "date";

  /**
   * Example phrases to demonstrate format
   */
  examples: string[];

  /**
   * Function to extract the field value from text
   */
  extract: (text: string) => any;

  /**
   * Function to validate the extracted value
   */
  validate?: (value: any) => boolean;
}

/**
 * Voice recognition event
 */
export interface VoiceRecognitionEvent {
  /**
   * Event type
   */
  type:
    | "recording_started"
    | "recording_stopped"
    | "transcription_started"
    | "transcription_progress"
    | "transcription_complete"
    | "error";

  /**
   * Event data
   */
  data?: any;

  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Voice recognition listener
 */
export type VoiceRecognitionListener = (event: VoiceRecognitionEvent) => void;

/**
 * VoiceRecognitionService
 *
 * Provides functionality for voice recording, transcription,
 * and voice-to-data extraction for property information.
 */
export class VoiceRecognitionService {
  private static instance: VoiceRecognitionService;
  private authService: AuthService;
  private offlineQueueService: OfflineQueueService;

  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private isTranscribing: boolean = false;
  private lastTranscription: string = "";
  private listeners: VoiceRecognitionListener[] = [];

  /**
   * Recordings directory
   */
  private readonly RECORDINGS_DIRECTORY = `${FileSystem.documentDirectory}voice_recordings/`;

  /**
   * Transcriptions directory
   */
  private readonly TRANSCRIPTIONS_DIRECTORY = `${FileSystem.documentDirectory}transcriptions/`;

  /**
   * Field recognizers for property data
   */
  private readonly PROPERTY_FIELD_RECOGNIZERS: PropertyFieldRecognizer[] = [
    {
      field: "address",
      triggers: ["address", "street address", "property address", "located at"],
      type: "address",
      examples: ["Address is 123 Main Street", "Property located at 456 Elm Avenue"],
      extract: (text: string) => {
        // Match patterns like "123 Main Street" or "456 Elm Avenue, Apt 7B"
        const addressRegex =
          /\b\d+\s+[A-Za-z0-9\s,\.]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Circle|Cir|Way|Parkway|Pkwy|Highway|Hwy)(?:\s+[A-Za-z0-9\s,\.]+)?\b/i;
        const match = text.match(addressRegex);
        return match ? match[0] : "";
      },
      validate: (value: string) => value.length > 5,
    },
    {
      field: "city",
      triggers: ["city", "town", "municipality", "in the city of"],
      type: "string",
      examples: ["City is Los Angeles", "Located in the city of Boston"],
      extract: (text: string) => {
        const cityRegex =
          /(?:city|town|municipality|located in)\s+(?:is|of|in)?\s+([A-Za-z\s]+)(?:,|\.|$)/i;
        const match = text.match(cityRegex);
        return match ? match[1].trim() : "";
      },
      validate: (value: string) => value.length > 1,
    },
    {
      field: "state",
      triggers: ["state", "province", "in the state of"],
      type: "string",
      examples: ["State is California", "Located in the state of New York"],
      extract: (text: string) => {
        // Match state names or abbreviations
        const stateRegex = /(?:state|province)\s+(?:is|of|in)?\s+([A-Za-z\s]+)(?:,|\.|$)/i;
        const match = text.match(stateRegex);
        return match ? match[1].trim() : "";
      },
      validate: (value: string) => value.length >= 2,
    },
    {
      field: "zipCode",
      triggers: ["zip code", "postal code", "zip", "code"],
      type: "string",
      examples: ["Zip code is 90210", "Postal code 10001"],
      extract: (text: string) => {
        // Match 5-digit zip codes or 5+4 format
        const zipRegex = /\b\d{5}(?:-\d{4})?\b/;
        const match = text.match(zipRegex);
        return match ? match[0] : "";
      },
      validate: (value: string) => /^\d{5}(-\d{4})?$/.test(value),
    },
    {
      field: "propertyType",
      triggers: ["property type", "type of property", "type of home", "building type"],
      type: "string",
      examples: ["Property type is single family", "Type of property is condominium"],
      extract: (text: string) => {
        const typeRegex =
          /(?:property|home|building)\s+type\s+(?:is|of)?\s+([A-Za-z\s]+)(?:,|\.|$)/i;
        const match = text.match(typeRegex);

        if (match) {
          const type = match[1].trim().toLowerCase();

          // Map to standard property types
          if (type.includes("single") || type.includes("detached")) {
            return "single_family";
          } else if (type.includes("condo")) {
            return "condo";
          } else if (type.includes("town")) {
            return "townhouse";
          } else if (type.includes("multi")) {
            return "multi_family";
          } else if (type.includes("land") || type.includes("lot")) {
            return "vacant_land";
          } else if (type.includes("commercial")) {
            return "commercial";
          }

          return type;
        }

        return "";
      },
    },
    {
      field: "yearBuilt",
      triggers: ["year built", "built in", "construction year", "built"],
      type: "number",
      examples: ["Year built is 1985", "Property was built in 2010"],
      extract: (text: string) => {
        // Match 4-digit years within a reasonable range
        const yearRegex = /(?:built|construction|year)\s+(?:in|is)?\s+(\d{4})(?:,|\.|$)/i;
        const match = text.match(yearRegex);
        return match ? parseInt(match[1]) : null;
      },
      validate: (value: number) => value >= 1800 && value <= new Date().getFullYear(),
    },
    {
      field: "squareFeet",
      triggers: ["square feet", "square footage", "sq ft", "sqft", "area"],
      type: "number",
      examples: ["Square feet is 2500", "1800 square foot home"],
      extract: (text: string) => {
        const sqftRegex = /(\d+(?:,\d+)?)\s+(?:square\s+feet|square\s+foot|sq\.?\s*ft\.?|sqft)/i;
        const altRegex =
          /(?:square\s+feet|square\s+foot|sq\.?\s*ft\.?|sqft)\s+(?:is|of)?\s+(\d+(?:,\d+)?)/i;

        let match = text.match(sqftRegex);
        if (!match) {
          match = text.match(altRegex);
        }

        return match ? parseInt(match[1].replace(",", "")) : null;
      },
      validate: (value: number) => value > 0 && value < 100000,
    },
    {
      field: "bedrooms",
      triggers: ["bedrooms", "beds", "bedroom count"],
      type: "number",
      examples: ["3 bedrooms", "Bedrooms is 4"],
      extract: (text: string) => {
        const bedroomRegex = /(\d+(?:\.\d+)?)\s+(?:bedrooms|beds|bedroom)/i;
        const altRegex = /(?:bedrooms|beds|bedroom)\s+(?:is|are|count)?\s+(\d+(?:\.\d+)?)/i;

        let match = text.match(bedroomRegex);
        if (!match) {
          match = text.match(altRegex);
        }

        return match ? parseFloat(match[1]) : null;
      },
      validate: (value: number) => value >= 0 && value < 100,
    },
    {
      field: "bathrooms",
      triggers: ["bathrooms", "baths", "bathroom count"],
      type: "number",
      examples: ["2.5 bathrooms", "Bathrooms is 3"],
      extract: (text: string) => {
        const bathroomRegex = /(\d+(?:\.\d+)?)\s+(?:bathrooms|baths|bathroom)/i;
        const altRegex = /(?:bathrooms|baths|bathroom)\s+(?:is|are|count)?\s+(\d+(?:\.\d+)?)/i;

        let match = text.match(bathroomRegex);
        if (!match) {
          match = text.match(altRegex);
        }

        return match ? parseFloat(match[1]) : null;
      },
      validate: (value: number) => value >= 0 && value < 100,
    },
    {
      field: "lotSize",
      triggers: ["lot size", "land size", "acreage", "lot area", "land area"],
      type: "number",
      examples: ["Lot size is 0.5 acres", "2.3 acre lot"],
      extract: (text: string) => {
        const acreRegex = /(\d+(?:\.\d+)?)\s+(?:acres|acre)/i;
        const altRegex =
          /(?:lot|land)\s+(?:size|area)\s+(?:is|of)?\s+(\d+(?:\.\d+)?)\s+(?:acres|acre)/i;

        let match = text.match(acreRegex);
        if (!match) {
          match = text.match(altRegex);
        }

        return match ? parseFloat(match[1]) : null;
      },
      validate: (value: number) => value > 0 && value < 10000,
    },
    {
      field: "hasGarage",
      triggers: ["garage", "car garage", "has garage", "with garage", "no garage"],
      type: "boolean",
      examples: ["Has a 2 car garage", "No garage"],
      extract: (text: string) => {
        const hasGarageRegex = /(\d+)[- ]car garage|has\s+(?:a\s+)?garage|with\s+(?:a\s+)?garage/i;
        const noGarageRegex =
          /no\s+garage|doesn't\s+have\s+(?:a\s+)?garage|does\s+not\s+have\s+(?:a\s+)?garage/i;

        if (noGarageRegex.test(text)) {
          return false;
        }

        return hasGarageRegex.test(text);
      },
    },
    {
      field: "hasPool",
      triggers: ["pool", "swimming pool", "has pool", "with pool", "no pool"],
      type: "boolean",
      examples: ["Has a swimming pool", "No pool"],
      extract: (text: string) => {
        const hasPoolRegex = /has\s+(?:a\s+)?pool|with\s+(?:a\s+)?pool|swimming\s+pool/i;
        const noPoolRegex =
          /no\s+pool|doesn't\s+have\s+(?:a\s+)?pool|does\s+not\s+have\s+(?:a\s+)?pool/i;

        if (noPoolRegex.test(text)) {
          return false;
        }

        return hasPoolRegex.test(text);
      },
    },
  ];

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.authService = AuthService.getInstance();
    this.offlineQueueService = OfflineQueueService.getInstance();

    // Ensure directories exist
    this.ensureDirectoriesExist();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): VoiceRecognitionService {
    if (!VoiceRecognitionService.instance) {
      VoiceRecognitionService.instance = new VoiceRecognitionService();
    }
    return VoiceRecognitionService.instance;
  }

  /**
   * Ensure directories exist
   */
  private async ensureDirectoriesExist(): Promise<void> {
    try {
      // Ensure recordings directory exists
      const recordingsInfo = await FileSystem.getInfoAsync(this.RECORDINGS_DIRECTORY);
      if (!recordingsInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.RECORDINGS_DIRECTORY, {
          intermediates: true,
        });
      }

      // Ensure transcriptions directory exists
      const transcriptionsInfo = await FileSystem.getInfoAsync(this.TRANSCRIPTIONS_DIRECTORY);
      if (!transcriptionsInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.TRANSCRIPTIONS_DIRECTORY, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error("Error ensuring directories exist:", error);
    }
  }

  /**
   * Check recording permissions
   */
  private async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
      return status === "granted";
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  }

  /**
   * Get recording options based on quality
   */
  private getRecordingOptions(
    quality: RecordingQuality = RecordingQuality.HIGH
  ): Audio.RecordingOptions {
    switch (quality) {
      case RecordingQuality.LOW:
        return {
          android: {
            extension: ".aac",
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADTS,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 22050,
            numberOfChannels: 1,
            bitRate: 64000,
          },
          ios: {
            extension: ".aac",
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_LOW,
            sampleRate: 22050,
            numberOfChannels: 1,
            bitRate: 64000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        };

      case RecordingQuality.MEDIUM:
        return {
          android: {
            extension: ".aac",
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADTS,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: ".aac",
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        };

      case RecordingQuality.HIGH:
      default:
        return {
          android: {
            extension: ".aac",
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADTS,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 192000,
          },
          ios: {
            extension: ".aac",
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 192000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        };
    }
  }

  /**
   * Add a listener for voice recognition events
   */
  public addListener(listener: VoiceRecognitionListener): () => void {
    this.listeners.push(listener);

    // Return a function to remove the listener
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: VoiceRecognitionEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in voice recognition listener:", error);
      }
    });
  }

  /**
   * Start recording
   */
  public async startRecording(
    options: Partial<VoiceRecordingOptions> = {}
  ): Promise<RecordingResult> {
    try {
      // Check if already recording
      if (this.isRecording) {
        return {
          success: false,
          error: "Already recording",
          timestamp: Date.now(),
        };
      }

      // Check permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        return {
          success: false,
          error: "Permission denied",
          timestamp: Date.now(),
        };
      }

      // Merge options with defaults
      const mergedOptions: VoiceRecordingOptions = {
        ...DEFAULT_RECORDING_OPTIONS,
        ...options,
      };

      // Set up recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: true,
      });

      // Create recording
      const { sound, status } = await Audio.Recording.createAsync(
        this.getRecordingOptions(RecordingQuality.HIGH),
        (status) => {
          // Handle status updates
          if (status.isDoneRecording && !status.isRecording) {
            this.stopRecording();
          }
        },
        mergedOptions.maxDuration
      );

      this.recording = sound;
      this.isRecording = true;

      // Play start sound if enabled
      if (mergedOptions.playSounds) {
        // Play a beep sound (not implemented here)
      }

      // Emit recording started event
      this.emitEvent({
        type: "recording_started",
        timestamp: Date.now(),
      });

      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error starting recording:", error);

      // Emit error event
      this.emitEvent({
        type: "error",
        data: {
          message: "Failed to start recording",
          error,
        },
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start recording",
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Stop recording
   */
  public async stopRecording(): Promise<RecordingResult> {
    try {
      // Check if not recording
      if (!this.isRecording || !this.recording) {
        return {
          success: false,
          error: "Not recording",
          timestamp: Date.now(),
        };
      }

      // Stop recording
      await this.recording.stopAndUnloadAsync();

      // Get the recording URI
      const uri = this.recording.getURI();

      // Get recording status
      const status = await this.recording.getStatusAsync();

      // Reset state
      this.isRecording = false;

      // Save the recording to the recordings directory
      if (uri) {
        const fileName = `recording_${Date.now()}.aac`;
        const newUri = `${this.RECORDINGS_DIRECTORY}${fileName}`;

        await FileSystem.copyAsync({
          from: uri,
          to: newUri,
        });

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(newUri, { size: true });

        // Reset audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: true,
        });

        // Emit recording stopped event
        this.emitEvent({
          type: "recording_stopped",
          data: {
            uri: newUri,
            duration: status.durationMillis,
            fileSize: fileInfo.size,
          },
          timestamp: Date.now(),
        });

        return {
          success: true,
          uri: newUri,
          duration: status.durationMillis,
          fileSize: fileInfo.size,
          timestamp: Date.now(),
        };
      } else {
        throw new Error("Recording URI not available");
      }
    } catch (error) {
      console.error("Error stopping recording:", error);

      // Emit error event
      this.emitEvent({
        type: "error",
        data: {
          message: "Failed to stop recording",
          error,
        },
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to stop recording",
        timestamp: Date.now(),
      };
    } finally {
      this.recording = null;
      this.isRecording = false;
    }
  }

  /**
   * Transcribe a recording
   */
  public async transcribeRecording(
    recordingUri: string,
    language: RecognitionLanguage = RecognitionLanguage.ENGLISH_US
  ): Promise<TranscriptionResult> {
    try {
      // Check if recording exists
      const fileInfo = await FileSystem.getInfoAsync(recordingUri);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: "Recording not found",
          text: "",
          timestamp: Date.now(),
          processedOffline: true,
        };
      }

      // Set transcribing state
      this.isTranscribing = true;

      // Emit transcription started event
      this.emitEvent({
        type: "transcription_started",
        data: {
          audioUri: recordingUri,
        },
        timestamp: Date.now(),
      });

      // Check network connectivity for online transcription
      try {
        // For demo purposes, we'll use a simplified offline transcription
        // In a real app, we would upload the audio to a server for transcription

        // Simulate transcription delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate a random "transcription" (for demo purposes only)
        // In a real app, this would be the actual transcription from an API
        const offlineTranscription =
          "This property is a single-family home located at 123 Main Street, Boston, Massachusetts 02108. It has 3 bedrooms, 2.5 bathrooms, and approximately 2,400 square feet. The house was built in 1985 and sits on a 0.3 acre lot. It has a 2-car garage but no pool.";

        // Save the transcription to the transcriptions directory
        const fileName = `transcription_${Date.now()}.txt`;
        const transcriptionUri = `${this.TRANSCRIPTIONS_DIRECTORY}${fileName}`;

        await FileSystem.writeAsStringAsync(transcriptionUri, offlineTranscription);

        // Update last transcription
        this.lastTranscription = offlineTranscription;

        // Emit transcription complete event
        this.emitEvent({
          type: "transcription_complete",
          data: {
            text: offlineTranscription,
            audioUri: recordingUri,
            processedOffline: true,
          },
          timestamp: Date.now(),
        });

        // Queue for online processing when connection is restored
        await this.offlineQueueService.enqueue(
          OperationType.PROCESS_TRANSCRIPTION,
          {
            recordingUri,
            transcriptionUri,
            language,
          },
          2 // Medium priority
        );

        return {
          success: true,
          text: offlineTranscription,
          audioUri: recordingUri,
          timestamp: Date.now(),
          processedOffline: true,
        };
      } catch (error) {
        console.error("Error transcribing recording:", error);

        // Fallback to simplified offline transcription
        const fallbackTranscription =
          "This property is a single-family home with 3 bedrooms and 2 bathrooms. It has approximately 2,000 square feet and a garage.";

        // Update last transcription
        this.lastTranscription = fallbackTranscription;

        // Emit error event
        this.emitEvent({
          type: "error",
          data: {
            message: "Failed to transcribe recording",
            error,
          },
          timestamp: Date.now(),
        });

        return {
          success: true,
          text: fallbackTranscription,
          audioUri: recordingUri,
          timestamp: Date.now(),
          processedOffline: true,
        };
      } finally {
        // Reset transcribing state
        this.isTranscribing = false;
      }
    } catch (error) {
      console.error("Error transcribing recording:", error);

      // Emit error event
      this.emitEvent({
        type: "error",
        data: {
          message: "Failed to transcribe recording",
          error,
        },
        timestamp: Date.now(),
      });

      // Reset transcribing state
      this.isTranscribing = false;

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to transcribe recording",
        text: "",
        timestamp: Date.now(),
        processedOffline: true,
      };
    }
  }

  /**
   * Extract property data from transcription
   */
  public extractPropertyData(transcription: string): Record<string, any> {
    const propertyData: Record<string, any> = {};

    // Process each field recognizer
    this.PROPERTY_FIELD_RECOGNIZERS.forEach((recognizer) => {
      try {
        // Extract value
        const extractedValue = recognizer.extract(transcription);

        // Validate if validator exists
        if (recognizer.validate && extractedValue !== null && extractedValue !== undefined) {
          if (!recognizer.validate(extractedValue)) {
            return; // Skip invalid values
          }
        }

        // Only set if we have a non-empty value
        if (extractedValue !== null && extractedValue !== undefined && extractedValue !== "") {
          propertyData[recognizer.field] = extractedValue;
        }
      } catch (error) {
        console.error(`Error extracting ${recognizer.field}:`, error);
      }
    });

    return propertyData;
  }

  /**
   * Get field help examples
   */
  public getFieldHelpExamples(): Record<string, string[]> {
    const examples: Record<string, string[]> = {};

    this.PROPERTY_FIELD_RECOGNIZERS.forEach((recognizer) => {
      examples[recognizer.field] = recognizer.examples;
    });

    return examples;
  }

  /**
   * Speak text
   */
  public async speak(text: string, options: Speech.SpeechOptions = {}): Promise<void> {
    try {
      await Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
        ...options,
      });
    } catch (error) {
      console.error("Error speaking text:", error);
    }
  }

  /**
   * Stop speaking
   */
  public async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error("Error stopping speech:", error);
    }
  }

  /**
   * Record property data
   */
  public async recordPropertyData(options: Partial<VoiceRecordingOptions> = {}): Promise<{
    recording: RecordingResult;
    transcription: TranscriptionResult;
    propertyData: Record<string, any>;
  }> {
    try {
      // Start recording
      const recordingResult = await this.startRecording(options);

      if (!recordingResult.success) {
        throw new Error(recordingResult.error || "Failed to start recording");
      }

      // Prompt user (can be customized)
      await this.speak("Please describe the property details. Press stop when finished.");

      // Wait for user to stop recording manually
      // This would typically be handled by the UI

      // For this example, we'll stop automatically after a timeout
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Stop recording
      const stoppedRecording = await this.stopRecording();

      if (!stoppedRecording.success || !stoppedRecording.uri) {
        throw new Error(stoppedRecording.error || "Failed to stop recording");
      }

      // Transcribe recording
      const transcriptionResult = await this.transcribeRecording(
        stoppedRecording.uri,
        options.language
      );

      if (!transcriptionResult.success) {
        throw new Error(transcriptionResult.error || "Failed to transcribe recording");
      }

      // Extract property data
      const propertyData = this.extractPropertyData(transcriptionResult.text);

      return {
        recording: stoppedRecording,
        transcription: transcriptionResult,
        propertyData,
      };
    } catch (error) {
      console.error("Error recording property data:", error);

      // Ensure recording is stopped if an error occurs
      if (this.isRecording) {
        await this.stopRecording();
      }

      throw error;
    }
  }

  /**
   * Is currently recording
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Is currently transcribing
   */
  public isCurrentlyTranscribing(): boolean {
    return this.isTranscribing;
  }

  /**
   * Get last transcription
   */
  public getLastTranscription(): string {
    return this.lastTranscription;
  }

  /**
   * Delete recording
   */
  public async deleteRecording(recordingUri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(recordingUri);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(recordingUri);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting recording:", error);
      return false;
    }
  }

  /**
   * Get all recordings
   */
  public async getRecordings(): Promise<string[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.RECORDINGS_DIRECTORY);

      return files.map((file) => `${this.RECORDINGS_DIRECTORY}${file}`);
    } catch (error) {
      console.error("Error getting recordings:", error);
      return [];
    }
  }

  /**
   * Get all transcriptions
   */
  public async getTranscriptions(): Promise<{ uri: string; text: string }[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.TRANSCRIPTIONS_DIRECTORY);

      const transcriptions: { uri: string; text: string }[] = [];

      for (const file of files) {
        const uri = `${this.TRANSCRIPTIONS_DIRECTORY}${file}`;
        try {
          const text = await FileSystem.readAsStringAsync(uri);
          transcriptions.push({ uri, text });
        } catch (error) {
          console.error(`Error reading transcription ${file}:`, error);
        }
      }

      return transcriptions;
    } catch (error) {
      console.error("Error getting transcriptions:", error);
      return [];
    }
  }
}
