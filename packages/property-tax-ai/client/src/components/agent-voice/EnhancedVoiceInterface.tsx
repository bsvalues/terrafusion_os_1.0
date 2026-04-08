/**
 * Enhanced Voice Interface
 * 
 * This component coordinates all voice command features:
 * - Voice recording and recognition
 * - Command processing and display
 * - Shortcuts expansion
 * - Contextual help
 * - Results presentation
 */

import { useState, useEffect, useCallback } from 'react';
import { EnhancedVoiceCommandButton } from './EnhancedVoiceCommandButton';
import { EnhancedVoiceCommandResults } from './EnhancedVoiceCommandResults';
import { RecordingState, VoiceCommandResult, processVoiceCommand } from '@/services/agent-voice-command-service';
import { expandShortcuts, getCommandCorrections } from '@/services/enhanced-voice-command-service';
import { useToast } from '@/hooks/use-toast';

interface EnhancedVoiceInterfaceProps {
  userId: number;
  contextId?: string;
  showHelp?: boolean;
  className?: string;
}

export function EnhancedVoiceInterface({
  userId,
  contextId = 'global',
  showHelp = false,
  className = ''
}: EnhancedVoiceInterfaceProps) {
  // State
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.INACTIVE);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<VoiceCommandResult[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  // Load stored results when component mounts
  useEffect(() => {
    // In a real app, this would load from local storage or a database
    // For now, we'll just init with empty results
    setResults([]);
  }, [userId]);
  
  // Reset when context changes
  useEffect(() => {
    setRecordingState(RecordingState.INACTIVE);
    setCurrentTranscript('');
    setSuggestions([]);
  }, [contextId]);
  
  // Clear results
  const handleClearResults = () => {
    setResults([]);
    setSuggestions([]);
  };
  
  // Process voice command
  const handleCommand = async (command: string): Promise<VoiceCommandResult> => {
    setIsProcessing(true);
    setCurrentTranscript(command);
    let expandedCommand = command;
    
    try {
      // First expand any shortcuts in the command
      expandedCommand = await expandShortcuts(command, userId);
      
      // Process the command with the server
      const result = await processVoiceCommand(expandedCommand, userId, contextId);
      
      // Update the results
      if (result) {
        setResults(prev => [...prev, result]);
        
        // If successful, clear suggestions
        if (result.successful) {
          setSuggestions([]);
        } else {
          // If failed, try to get correction suggestions
          try {
            const corrections = await getCommandCorrections(command, contextId);
            setSuggestions(corrections);
          } catch (error) {
            console.error("Error getting corrections:", error);
          }
        }
        
        return result;
      }
    } catch (error) {
      console.error("Error processing command:", error);
      
      // Create an error result
      const errorResult: VoiceCommandResult = {
        id: Date.now().toString(),
        userId,
        command,
        successful: false,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "An unknown error occurred",
        contextId,
        actions: []
      };
      
      setResults(prev => [...prev, errorResult]);
      return errorResult;
    } finally {
      setIsProcessing(false);
      setRecordingState(RecordingState.INACTIVE);
    }
    
    // Fallback error result if we get here
    const fallbackResult: VoiceCommandResult = {
      id: Date.now().toString(),
      userId,
      command,
      successful: false,
      timestamp: Date.now(),
      error: "Processing failed",
      contextId,
      actions: []
    };
    
    setResults(prev => [...prev, fallbackResult]);
    return fallbackResult;
  };
  
  // Handle manual command submission
  const handleCommandSubmit = useCallback((command: string) => {
    if (isProcessing || recordingState !== RecordingState.INACTIVE) return;
    
    setCurrentTranscript(command);
    handleCommand(command);
  }, [isProcessing, recordingState, contextId, userId]);
  
  // Handle suggestion selection
  const handleSuggestionSelected = useCallback((suggestion: string) => {
    if (isProcessing || recordingState !== RecordingState.INACTIVE) return;
    
    handleCommandSubmit(suggestion);
  }, [handleCommandSubmit, isProcessing, recordingState]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <EnhancedVoiceCommandButton
          recordingState={recordingState}
          setRecordingState={setRecordingState}
          onCommand={handleCommand}
          isProcessing={isProcessing}
          userId={userId}
          contextId={contextId}
        />
      </div>
      
      <EnhancedVoiceCommandResults
        results={results}
        onClear={handleClearResults}
        isProcessing={isProcessing}
        recordingState={recordingState}
        currentTranscript={currentTranscript}
        suggestions={suggestions}
        onSuggestionSelected={handleSuggestionSelected}
        onCommandSubmit={handleCommandSubmit}
        showHelp={showHelp}
        contextId={contextId}
      />
    </div>
  );
}