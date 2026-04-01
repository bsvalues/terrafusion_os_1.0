/**
 * Plandex AI Provider
 * 
 * This context provider manages the state and provides access to Plandex AI
 * functionality throughout the application.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  PlandexAIClientService, 
  CodeGenerationRequest,
  CodeCompletionRequest,
  BugFixRequest,
  CodeExplanationRequest
} from '@/services/plandex-ai-service';
import { useToast } from '@/hooks/use-toast';

// Define the context interface
interface PlandexAIContextType {
  isAvailable: boolean;
  isLoading: boolean;
  generateCode: (request: CodeGenerationRequest) => Promise<string>;
  completeCode: (request: CodeCompletionRequest) => Promise<string>;
  fixBugs: (request: BugFixRequest) => Promise<string>;
  explainCode: (request: CodeExplanationRequest) => Promise<string>;
}

// Create the context
const PlandexAIContext = createContext<PlandexAIContextType | null>(null);

interface PlandexAIProviderProps {
  children: ReactNode;
}

/**
 * Plandex AI Provider Component
 */
export const PlandexAIProvider: React.FC<PlandexAIProviderProps> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if Plandex AI is available on component mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await PlandexAIClientService.checkAvailability();
        setIsAvailable(available);
      } catch (error) {
        console.error('Error checking Plandex AI availability:', error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, []);

  // Generate code
  const generateCode = async (request: CodeGenerationRequest): Promise<string> => {
    if (!isAvailable) {
      toast({
        title: 'Plandex AI Not Available',
        description: 'Plandex AI service is not available. Please check API key configuration.',
        variant: 'destructive'
      });
      return '';
    }

    try {
      return await PlandexAIClientService.generateCode(request);
    } catch (error) {
      toast({
        title: 'Code Generation Failed',
        description: (error as Error).message,
        variant: 'destructive'
      });
      return '';
    }
  };

  // Complete code
  const completeCode = async (request: CodeCompletionRequest): Promise<string> => {
    if (!isAvailable) {
      toast({
        title: 'Plandex AI Not Available',
        description: 'Plandex AI service is not available. Please check API key configuration.',
        variant: 'destructive'
      });
      return '';
    }

    try {
      return await PlandexAIClientService.completeCode(request);
    } catch (error) {
      toast({
        title: 'Code Completion Failed',
        description: (error as Error).message,
        variant: 'destructive'
      });
      return '';
    }
  };

  // Fix bugs
  const fixBugs = async (request: BugFixRequest): Promise<string> => {
    if (!isAvailable) {
      toast({
        title: 'Plandex AI Not Available',
        description: 'Plandex AI service is not available. Please check API key configuration.',
        variant: 'destructive'
      });
      return '';
    }

    try {
      return await PlandexAIClientService.fixBugs(request);
    } catch (error) {
      toast({
        title: 'Bug Fixing Failed',
        description: (error as Error).message,
        variant: 'destructive'
      });
      return '';
    }
  };

  // Explain code
  const explainCode = async (request: CodeExplanationRequest): Promise<string> => {
    if (!isAvailable) {
      toast({
        title: 'Plandex AI Not Available',
        description: 'Plandex AI service is not available. Please check API key configuration.',
        variant: 'destructive'
      });
      return '';
    }

    try {
      return await PlandexAIClientService.explainCode(request);
    } catch (error) {
      toast({
        title: 'Code Explanation Failed',
        description: (error as Error).message,
        variant: 'destructive'
      });
      return '';
    }
  };

  // Create context value
  const contextValue: PlandexAIContextType = {
    isAvailable,
    isLoading,
    generateCode,
    completeCode,
    fixBugs,
    explainCode
  };

  return (
    <PlandexAIContext.Provider value={contextValue}>
      {children}
    </PlandexAIContext.Provider>
  );
};

/**
 * Custom hook for using the Plandex AI context
 */
export const usePlandexAI = (): PlandexAIContextType => {
  const context = useContext(PlandexAIContext);
  
  if (!context) {
    throw new Error('usePlandexAI must be used within a PlandexAIProvider');
  }
  
  return context;
};