import { useCallback } from 'react';

export interface AIAssistantOptions {
  userId?: string;
  userRole?: string;
  department?: string;
  personalizedSettings?: unknown;
}

export interface UnavailableAssistantResponse {
  status: 'unavailable';
  error: string;
}

const UNAVAILABLE_MESSAGE =
  'TerraLevy AI assistant is not wired to a governed backend contract.';

export const useAIAssistant = (_options: AIAssistantOptions = {}) => {
  const generateResponse = useCallback(
    async (): Promise<UnavailableAssistantResponse> => ({
      status: 'unavailable',
      error: UNAVAILABLE_MESSAGE,
    }),
    [],
  );

  return {
    status: 'unavailable' as const,
    error: UNAVAILABLE_MESSAGE,
    insights: [] as never[],
    accuracy: null as number | null,
    modelVersion: null as string | null,
    isModelTraining: false,
    generateResponse,
    analyzeWorkflow: generateResponse,
    trainPersonalizedModel: generateResponse,
  };
};
