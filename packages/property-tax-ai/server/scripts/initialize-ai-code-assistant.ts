import { aiAssistantService } from '../services/ai-assistant-service';
import { initializeAICodeAssistant as initializeCodeAssistant } from '../services/development/ai-code-assistant';

/**
 * Initialize the AI Code Assistant component
 * This sets up the code assistant with the AI service required for generating
 * assessment-specific code completions and suggestions
 */
export const initializeAICodeAssistant = async (): Promise<void> => {
  try {
    console.log("Initializing AI Code Assistant...");
    
    // Initialize the AI Code Assistant with the AI Assistant service
    initializeCodeAssistant(aiAssistantService);
    
    console.log("AI Code Assistant initialized successfully");
  } catch (error) {
    console.error("Failed to initialize AI Code Assistant:", error);
    throw error;
  }
};