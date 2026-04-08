import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Loader2 } from 'lucide-react';
import { SearchParams, voiceRecognitionService } from '../../services/voice-recognition-service';

interface VoiceSearchButtonProps {
  onSearchResult: (text: string, params: SearchParams) => void;
  className?: string;
}

export function VoiceSearchButton({ onSearchResult, className = '' }: VoiceSearchButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        await processAudio();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const processAudio = async () => {
    try {
      if (audioChunksRef.current.length === 0) {
        setIsProcessing(false);
        return;
      }
      
      // Create a blob from the audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          if (typeof reader.result !== 'string') {
            throw new Error('Failed to convert audio to base64');
          }
          
          // Get only the base64 data part (remove the data URL prefix)
          const base64Audio = reader.result.split(',')[1];
          
          // Send to the server for transcription
          const result = await voiceRecognitionService.transcribeAudio(base64Audio);
          
          if (result) {
            onSearchResult(result.text, result.searchParams);
          } else {
            alert('Failed to transcribe audio. Please try again.');
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          alert('An error occurred while processing your voice input. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      variant={isRecording ? "destructive" : "default"}
      size="lg"
      className={`flex items-center gap-2 ${className}`}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : isRecording ? (
        <>
          <StopCircle className="h-5 w-5" />
          <span>Stop Recording</span>
        </>
      ) : (
        <>
          <Mic className="h-5 w-5" />
          <span>Voice Search</span>
        </>
      )}
    </Button>
  );
}