/**
 * Voice Recognition Service
 * 
 * This service handles the transcription of voice recordings and extraction
 * of structured search parameters using OpenAI.
 */

import { apiRequest } from '@/lib/queryClient';

export interface SearchParams {
  propertyId?: string;
  address?: string;
  parcelNumber?: string;
  owner?: string;
  area?: string;
  propertyType?: string;
  minValue?: number;
  maxValue?: number;
  minAcres?: number;
  maxAcres?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

interface TranscriptionResponse {
  text: string;
  searchParams: SearchParams;
}

class VoiceRecognitionService {
  /**
   * Transcribe audio using the server's API
   * @param audioBase64 - Base64 encoded audio data
   */
  public async transcribeAudio(audioBase64: string): Promise<TranscriptionResponse | null> {
    try {
      const response = await apiRequest('/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: audioBase64 }),
      });

      if (!response.ok) {
        console.error('Failed to transcribe audio:', await response.text());
        return null;
      }

      const data = await response.json();
      return {
        text: data.text,
        searchParams: data.searchParams,
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  }

  /**
   * Extract structured search parameters from transcribed text
   * @param text - Transcribed text from audio
   */
  public async extractSearchParams(text: string): Promise<SearchParams> {
    try {
      const response = await apiRequest('/api/voice/extract-params', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('Failed to extract search parameters:', await response.text());
        return {};
      }

      return await response.json();
    } catch (error) {
      console.error('Error extracting search parameters:', error);
      return {};
    }
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();