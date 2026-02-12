/**
 * Plandex AI Factory
 *
 * This module provides factory functions for creating and accessing
 * the Plandex AI service instance.
 */

import { PlandexAIService, PlandexAIConfig } from './plandex-ai-service';

// Singleton instance of the Plandex AI service
let plandexAIServiceInstance: PlandexAIService | null = null;

/**
 * Initialize the Plandex AI service with configuration
 */
export function initializePlandexAIService(config: PlandexAIConfig): PlandexAIService {
  plandexAIServiceInstance = new PlandexAIService(config);
  return plandexAIServiceInstance;
}

/**
 * Get the Plandex AI service instance
 * Creates it from environment variables if not already initialized
 */
export function getPlandexAIService(): PlandexAIService | null {
  if (!plandexAIServiceInstance && process.env.PLANDEX_API_KEY) {
    const config: PlandexAIConfig = {
      apiKey: process.env.PLANDEX_API_KEY,
      baseUrl: process.env.PLANDEX_API_BASE_URL || 'https://api.plandex.ai/v1',
      defaultModel: process.env.PLANDEX_DEFAULT_MODEL || 'plandex-code-v1',
      maxTokens: parseInt(process.env.PLANDEX_MAX_TOKENS || '1024', 10),
      temperature: parseFloat(process.env.PLANDEX_TEMPERATURE || '0.2'),
    };

    plandexAIServiceInstance = new PlandexAIService(config);
  }

  return plandexAIServiceInstance;
}

/**
 * Check if the Plandex AI service is available
 */
export function isPlandexAIAvailable(): boolean {
  return !!getPlandexAIService();
}
